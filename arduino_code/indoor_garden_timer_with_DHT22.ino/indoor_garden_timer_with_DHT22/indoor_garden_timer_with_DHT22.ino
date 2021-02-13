/*
  Author: Jason De Boer
  2 relay light and pump

  TODO:
  4. add screen
  5. add physical buttons
  6. possible add relays for exhaust fan based on temp/humidity?

*/

#include <Wire.h>
#include <DHT.h>
#include <NewPing.h>
#include "PinChangeInterrupt.h"
#include "TimeLib.h"
struct timelib_tm tinfo;
timelib_t time_now, initialt;


#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);

//#define DEBUG

//hardware parameters
#define PUMPPIN 6
#define LIGHTPIN 7
#define P_RESISTOR A2
#define ECHOPIN 8
#define TRIGPIN 9
#define DHTPIN 11
#define DHTTYPE DHT22
#define BUTTONMENUPIN 5
#define BUTTONUPPIN 4
#define BUTTONDOWNPIN 3


#define TRIGGER_PIN 9
#define ECHO_PIN 8
#define MAX_DISTANCE 100

//Reservoir - distance from sensor to bottom of reservoir
#define RESERVOIR_BOTTOM 39  //mm to bottom of reservoir
#define RESERVOIR_TOP 2 //


//behaviour parameters
#define DELAY 2500 // milliseconds between updates - saves power so cpu is not always running
#define SAMPLES  9//number of points to average to determine valid data points
#define SMOOTHING_VALUE 0.1
#define LOWPASS_VALUE 120

//Communication parameters
#define SLAVE_ADDR 0x08
#define UPDATE_RATE 5000
#define BUFSIZE 0x20
#define MAX_SENT_BYTES 3

//convenience definitions
#define ONEDAY 86400000
#define ONEHOUR 3600000
#define ONEMINUTE 60000
#define FIVEMINUTES 300000
#define FIFTEENMINUTES 900000

enum sMode {OFF, AUTO, MANUAL_PUMP_ON, MANUAL_PUMP_OFF};
enum buttonModes {NONE, MENU, UP, DOWN};
//TODO: set time;
enum menuItems {STATUS, SETMODE, SETLIGHTTIME, SETLIGHTDURATION, SETPUMPINTERVAL, SETPUMPDURATION, SETNUTRIENTTIMER };

//communications
char buffer_out[BUFSIZE]; //max buffer size is 32 bytes
byte receivedCommands[MAX_SENT_BYTES];
byte outputText = false; //1 - text, 2 - binary

const String swName = "Hydroponics Controller";
const String swVer = "1.2";
const String swRel = "2021-01-07";

/* Common Millis equivalents
   24 hours = 86400000; 16 hours = 57600000; 8 hours = 28800000; 4 hours = 14400000; 2 hours = 7200000; 1 hour = 3600000
   10 minutes = 600000; 5 minutes = 300000; 2 minutes = 120000; 1 minute = 60000
*/

//pins
const byte pumpPin = PUMPPIN; //pin number for activating relay for pump
const byte lightPin = LIGHTPIN; //pin number for activating relay for light
const byte pinLightSensor = P_RESISTOR; //pin number for light sensor
const byte buttonMenu = BUTTONMENUPIN;
const byte buttonUp = BUTTONUPPIN;
const byte buttonDown = BUTTONDOWNPIN;
volatile buttonModes buttonStatus = NONE; //status for ISR routine
menuItems menuItem = STATUS;
boolean menuItemSelected = false;
boolean displayChanged = false;

DHT dht(DHTPIN, DHTTYPE);
NewPing sonar(TRIGPIN, ECHOPIN, MAX_DISTANCE);

//setup default timings
#ifndef DEBUG
unsigned long longestDelayBetweenFlooding = 21600000; //longest acceptable delay between flooding.
unsigned long floodIntMillis = 1800000; //millis between flooding : 30 mins
unsigned long floodDurMillis = 360000; //millis for flood duration : 6 mins
unsigned long lightIntMillis = 86400000; //24 hour cycles
//unsigned long lightDurMillis = 57600000; //16 hours on
unsigned long lightDurMillis = 54000000; //15 hours
#else
unsigned long longestDelayBetweenFlooding = 240000;
unsigned long floodIntMillis = 30000;
unsigned long floodDurMillis = 5000;
unsigned long lightIntMillis = 120000;
unsigned long lightDurMillis = 60000; //light off for 60 seconds
#endif

//light sensor thresholds - currently not being used
const int lightLevel = 600; //this value indicates whether the sun is up. Value out of 1023. higher = lighter (indirect sun is around 850; normal indoor lighting is around 650)
const long lightLevelDelay = 20000; //delay before deciding it is daylight. To avoid lights, etc. causing issues
//unsigned long sunUpMillis = 0;
//unsigned long sunDownMillis = 0;
//boolean sunUpCheck = false;
//boolean sunDownCheck = false;
//boolean sunUp;
//boolean lastState = false;

unsigned long lightLastOn = lightIntMillis; //ensure light comes on when started
unsigned long pumpLastOn = floodIntMillis + lightLevelDelay; //ensuring pump comes on when device is turned on and it is light
unsigned long pumpOffAt = 0;
unsigned long pumpOnAt = 0;
unsigned long lightOffAt = 0;
unsigned long lightOnAt = 0;

//setup options
unsigned int lightSensorNow = analogRead(pinLightSensor);

//status and values
boolean statusSystemOn = true;
boolean statusPumpOn = false;
boolean statusLightOn = false;
boolean manualMode = false;

int valuePhotoResistor = -99;
float valueHumidity = -99;
float valueTemperature = -99;
int valueReservoirDepth = -99;
//float historyTemperature[SAMPLES];
//float historyHumidity[SAMPLES];
//int historyDepth[SAMPLES];
byte index = 0;

word daysToChangeWater = 21;

sMode systemMode = AUTO;
int sysMode = 0;


/////////////////////////
// setup()
//
// runs once before loop();

void setup() {

  lcd.init();
  lcd.backlight();
  lcd.setCursor(1, 0);
  lcd.print("Initializing...");

  //setup pump and light
  pinMode(pumpPin, OUTPUT);
  pinMode(lightPin, OUTPUT);

  pinMode(buttonMenu, INPUT_PULLUP);
  pinMode(buttonUp, INPUT_PULLUP);
  pinMode(buttonDown, INPUT_PULLUP);
  //attachInterrupt(digitalPinToInterrupt(buttonMenu), menu_ISR, RISING);
  //attachInterrupt(digitalPinToInterrupt(buttonUp), up_ISR, RISING);
  //attachInterrupt(digitalPinToInterrupt(buttonDown), down_ISR, RISING);
  attachPinChangeInterrupt(digitalPinToPinChangeInterrupt(buttonMenu), menu_ISR, RISING);
  attachPinChangeInterrupt(digitalPinToPinChangeInterrupt(buttonUp), up_ISR, RISING);
  attachPinChangeInterrupt(digitalPinToPinChangeInterrupt(buttonDown), down_ISR, RISING);


  digitalWrite(pumpPin, HIGH); //pump off
  digitalWrite(lightPin, HIGH); //pump off

  setMode(2); //set to auto

  //setup sensors
  pinMode(pinLightSensor, INPUT);// Set pResistor - A0 pin as an input (optional)
  pinMode(TRIGPIN, OUTPUT);
  pinMode(ECHOPIN, INPUT);
  dht.begin();

  //for (int x = 0; x < SAMPLES; x++){
  //historyHumidity[x] = dht.readHumidity();
  //historyTemperature[x] = dht.readTemperature();
  //historyDepth[SAMPLES] = sonar.ping_cm();
  //}

  valueHumidity = dht.readHumidity();
  valueTemperature = dht.readTemperature();

  //setup of i2c communication
  Wire.begin(SLAVE_ADDR);       // join i2c bus with slave address
  Wire.onRequest(requestEvent); // register event
  Wire.onReceive(receiveEvent);

  //set time to Jan 1, 2021
  tinfo.tm_year = 21;
  tinfo.tm_mon = 1;
  tinfo.tm_mday = 1;
  tinfo.tm_hour = 12;
  tinfo.tm_min = 00;
  tinfo.tm_sec = 00;
  // Convert time structure to timestamp
  initialt = timelib_make(&tinfo);
  // Set system time counter
  timelib_set(initialt);
  // Configure the library to update / sync every day (for hardware RTC)
  timelib_set_provider(time_provider, TIMELIB_SECS_PER_DAY);

#ifdef DEBUG
  Serial.begin(57600);
  Serial.begin(9600);
#endif

lcd.clear();
displayChanged = true;

}


/////////////////////////
// loop()
//
// Main loop that runs after setup()

void loop() {

  //delay was moved to end of function on latest
  //delay(DELAY); //this is to save power

  unsigned long now = millis();
  readSensors();

  time_now = timelib_get();
  // Convert to human readable format
  //timelib_break(now, &tinfo);
  // Send to serial port

#ifdef DEBUG
  Serial.println("---Values");
  Serial.println(valuePhotoResistor);
  Serial.println(valueHumidity);
  Serial.println(valueTemperature);
  Serial.println(valueReservoirDepth);
#endif

  //calculate when to turn light and pump off and on
  //calculate light on
  //if (now - lightLastOn > lightIntMillis || now < lightLastOn) { //checking when the light was last on. also when system first starts up
  if ( now > lightOnAt) {  //check if overflowing long
    if ( (lightOnAt < ONEDAY && now < ONEDAY) || (lightOnAt > ONEDAY) ) { //code for light on at rollover
      lightLastOn = now;
      lightOnAt = lightIntMillis + now;
      lightOffAt = lightDurMillis + now;
    }
  }

  //if light is on calculate when to run pump
  if (statusLightOn) {
    if (now - pumpLastOn > floodIntMillis || now < pumpLastOn) { //checking when the pump was last on.
      pumpLastOn = now;
      pumpOffAt = now + floodDurMillis; //pumpOffAt has been added so that the pump doesn't switch off during a cycle if the lights go our or sun goes down
    }
  }

  //turn pump on at least once every x hours even without light
  if (now - pumpLastOn > longestDelayBetweenFlooding && now > longestDelayBetweenFlooding) {
    pumpLastOn = now;
    pumpOffAt = now + floodDurMillis;
  }

  //light on and off default to on
  if ( (now < lightOffAt && systemMode == AUTO) || systemMode == MANUAL_PUMP_ON || systemMode == MANUAL_PUMP_OFF)  { //turning the light on
    digitalWrite(lightPin, LOW); //light on
    statusLightOn = true;
  } else {
    digitalWrite(lightPin, HIGH); //light off
    statusLightOn = false;
  }

  //pump on and off default to on
  if ( (now < pumpOffAt && systemMode == AUTO) || systemMode == MANUAL_PUMP_ON) { //turning the pump on
    digitalWrite(pumpPin, LOW); //pump on
    statusPumpOn = true;
  } else {
    digitalWrite(pumpPin, HIGH); //pump off
    statusPumpOn = false;
  }

  if (buttonStatus != NONE) {
    switch (buttonStatus) {
      case MENU:
        menuButtonPressed();
        break;
      case UP:
        upButtonPressed();
        break;
      case DOWN:
        downButtonPressed();
        break;

    }
  }
  //days to change water calculation

  if (menuItem == STATUS) {
    if (displayChanged) {
      displayInfo();
    }
    delay(DELAY); //this is to save power
  } else {

    if (displayChanged) {
      displayMenu();
    }
    delay(250);
  }
}


/////////////////////////
// readSensors()
//
// Reads sensors and apply a smoothing filter to exclude bad values

void readSensors() {

  //historyTemperature[index] = dht.readTemperature();
  //historyHumidity[index] = dht.readHumidity();
  //historyDepth[index] = averageDistance(7);

  valuePhotoResistor = analogRead(pinLightSensor);
  //valueTemperature = dataSmooth<float>(historyTemperature);
  //valueHumidity = dataSmooth<float>(historyHumidity);
  valueTemperature = expSmoothing<float>(dht.readTemperature(), valueTemperature);
  valueHumidity = expSmoothing<float>(dht.readHumidity(), valueHumidity);
  //unsigned int distance = sonar.ping_cm(SAMPLES);
  unsigned int distance = sonar.convert_cm(sonar.ping_median(5));
  valueReservoirDepth = RESERVOIR_BOTTOM - distance;

  //index = (index + 1) % SAMPLES;

}

/////////////////////////
// displayInfo()
//
// Updates the display

void displayInfo() {

  char str2[16];

  //lcd.clear();
  //print temperature
  lcd.setCursor(0, 0);
  dtostrf( valueTemperature, 5, 1, str2 );
  lcd.print(str2);
  //lcd.print(valueTemperature);
  lcd.print((char)223);

  //print humidity
  lcd.setCursor(8, 0);
  dtostrf( valueHumidity, 5, 1, str2 );
  lcd.print(str2);
  //lcd.print(valueHumidity);
  lcd.print("%");

  //print reservoir depth
  lcd.setCursor(0, 1);
  lcd.print(valueReservoirDepth);
  lcd.print(" cm");

  //print days to change water/add nutrient
  lcd.setCursor(8, 1);
  //  lcd.print(daysToChangeWater);
  //  lcd.print("d");

}

/////////////////////////
// displayMenu()
//
// Updates the display

void displayMenu() {

  String str1;
  char str2[12];

  switch (menuItem) {
    case SETMODE:
      str1 = "Set Mode";
      sprintf(str2, "%s", setMode(sysMode).c_str() );
      //str2 = setMode(sysMode);
      break;
    case SETLIGHTTIME:
      str1 = "Set Light On";
      dtostrf( (lightOnAt / 3600000UL), 5, 2, str2 );
      strcat(str2, " Hrs");
      break;
    case SETLIGHTDURATION:
      str1 = "Set Light Dur.";
      dtostrf( (lightDurMillis / 3600000UL), 5, 2, str2 );
      strcat(str2, " Hrs");
      break;
    case SETPUMPINTERVAL:
      str1 = "Set Pump Interval";     
      sprintf(str2, "%ld Mins", floodIntMillis / 60000UL);
      break;
    case SETPUMPDURATION:
      str1 = "Set Pump Dur.";
      sprintf(str2, "%lu Mins", (floodDurMillis / 60000UL) );
      break;
    case SETNUTRIENTTIMER:
      str1 = "Set Nutrient Timer";
      dtostrf( (lightDurMillis / 3600000UL), 5, 2, str2 );
      strcat(str2, " Hrs");
      break;
//TODO: add change water timer

      
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(str1);
  lcd.setCursor(2, 1);
  lcd.print(str2);
  //lcd.print(lightDurMillis / 1000UL);

  lcd.setCursor(0, 1);
  lcd.print("-");
  lcd.setCursor(15, 1);
  lcd.print("+");

  displayChanged = false;

}


/////////////////////////
// menuButtonPressed()
//
//  process menu button pressed

void menuButtonPressed() {

#ifdef DEBUG
  Serial.println("<MENU> PRESSED");
#endif

  displayChanged = true;

  switch (menuItem) {
    case STATUS:
      menuItem = SETMODE;
      break;
    case SETMODE:
      menuItem = SETLIGHTTIME;
      break;
    case SETLIGHTTIME:
      menuItem = SETLIGHTDURATION;
      break;
    case SETLIGHTDURATION:
      menuItem = SETPUMPINTERVAL;
      break;
    case SETPUMPINTERVAL:
      menuItem = SETPUMPDURATION;
      break;
    case SETPUMPDURATION:
      menuItem = SETNUTRIENTTIMER;
      break;
    case SETNUTRIENTTIMER:
      menuItem = STATUS;
      break;
    default:
      menuItem = STATUS;
  }

  buttonStatus = NONE;

}

/////////////////////////
// UpButtonPressed()
//
//  process menu button pressed

void upButtonPressed() {

#ifdef DEBUG
  Serial.println("<UP> PRESSED");
#endif

  displayChanged = true;

  switch (menuItem) {
    case SETMODE:
      setMode(++sysMode);
      break;
    case SETLIGHTTIME:
      lightOffAt += (15UL * 60000); //add 15 minutes for light off at - used to start cycle later in the day
      lightOnAt += (15UL * 60000);
      break;
    case SETLIGHTDURATION:
      lightDurMillis += (15UL * 60000); //add 15 minutes for light duration
      break;
    case SETPUMPINTERVAL:
      floodIntMillis += (1UL * 60000); //add 5 minutes for pump cycle
      break;
    case SETPUMPDURATION:
      floodDurMillis += (1UL * 60000); //add 1 minutes for pump duration
      break;
    case SETNUTRIENTTIMER:
      //increase nutrient timer by 1 day
      break;
  }

  buttonStatus = NONE;
}

/////////////////////////
// downButtonPressed()
//
//  process menu button pressed

void downButtonPressed() {

#ifdef DEBUG
  Serial.println("<DOWN> PRESSED");
#endif

  displayChanged = true;

  switch (menuItem) {
    case SETMODE:
      setMode(--sysMode);
      break;
    case SETLIGHTTIME:
      //decrease light on time by 15 minutes
      break;
    case SETLIGHTDURATION:
      lightDurMillis -= (15UL * 60000); //sub 15 minutes for light duration
      break;
    case SETPUMPINTERVAL:
      floodIntMillis -= (1UL * 60000); //sub 5 minutes for pump cycle
      break;
    case SETPUMPDURATION:
      floodDurMillis -= (1UL * 60000); //sub 1 minutes for pump duration
      break;
    case SETNUTRIENTTIMER:
      //decrease nutrient timer by 1 day
      break;
  }

  buttonStatus = NONE;
}

/////////////////////////
// menu_ISR()
//
//  process menu button pressed

void menu_ISR() {

  buttonStatus = MENU;
}

/////////////////////////
// up_ISR()
//
//  process menu button pressed

void up_ISR() {
  buttonStatus = UP;
}

/////////////////////////
// down_ISR()
//
//  process menu button pressed

void down_ISR() {
  buttonStatus = DOWN;
}

/////////////////////////
// T expSmoothing(T value, T prevValue)
//
//  data smoothing and lowpass filter

template<typename T>
T expSmoothing(T value, T prevValue) {

  if (value > LOWPASS_VALUE) {
    return prevValue;
  }

  T average = ((SMOOTHING_VALUE * value) + (1 - SMOOTHING_VALUE) * prevValue);

  return average;
}

/////////////////////////
// T dataSmooth(T*)
//
// validate by averaging the history
//
// if more than 3 data points then throw out the highest and lowest values in the history
//

template <typename T>
T dataSmooth(T *history) {

  T sum = 0;
  T avg;
  T maxVal = history[0];
  T minVal = history[0];

  for (int x = 0; x < SAMPLES; x++) {
    sum += history[x];
    if (history[x] > maxVal) {
      maxVal = history[x];
    }
    else if (history[x] < minVal) {
      minVal = history[x];
    }
  }

  //throw out min and max samples
  if (SAMPLES > 3) {
    sum -= maxVal;
    sum -= minVal;
    avg = sum / (SAMPLES - 2);
  } else {
    avg = sum / SAMPLES;
  }

  return avg;

}




/////////////////////////
// receiveEvent(int)
//
// 1 - mode off
// 2 - mode auto
// 3 - mode manual pump on light on
// 4 - mode manual pump off light on
//  - TODO - IMPLEMENTED NOT TESTED - codes to add/subtract length of time to pump / light, cycle start/end add in increments of xxxx - transmit cycle times in receive
// 5- Add Time for light on duration
// 6 - Subtract time from light duration
// 7 - Add time to pump cycle interval
// 8 - subtract time from pump cycle interval
// 9 - Add time to pump on duration
// 10 - subtract time for pump off duration
// 11 - Add time to current light cycle (temporary changes the LightOffAt) - used to change when the light/pump start in the day
// 12 - Subtract time from current light cycle

void receiveEvent(int bytesReceived) {

#ifdef DEBUG
  Serial.println("[Receive Event]");
#endif

  int value;

  while (Wire.available()) {
    value = Wire.read();

#ifdef DEBUG
    Serial.print("data received: ");
    Serial.println(bytesReceived);
#endif

  }

  switch (value) {
    case 5:
      lightDurMillis += (15UL * 60000); //add 15 minutes for light duration
      break;
    case 6:
      lightDurMillis -= (15UL * 60000); //add -15 minutes for light duration
      break;
    case 7:
      floodIntMillis += (5UL * 60000); //add 5 minutes for pump cycle
      break;
    case 8:
      floodIntMillis -= (5UL * 60000); //subtract 5 minutes for pump cycle
      break;
    case 9:
      floodDurMillis += (1UL * 60000); //add 1 minutes for pump duration
      break;
    case 10:
      floodDurMillis -= (1UL * 60000); //sub 1 minutes for pump duration
      break;
    case 11:
      lightOffAt += (15UL * 60000); //add 15 minutes for light off at - used to start cycle later in the day
      lightOnAt += (15UL * 60000);
      //lightLastOn += (15UL * 60000);
#ifdef DEBUG
      Serial.println("Light cycle +15 mins");
#endif
      break;
    case 12:
      if ( (lightOnAt - (15UL * 60000) ) > millis() ) { //do not allow lights on to become less than the current time - could break
        lightOffAt -= (15UL * 60000); //sub 15 minutes for light off at - used to start cycle earlier in the day
        //lightLastOn -= (15UL * 60000);
        lightOnAt -= (15UL * 60000);
#ifdef DEBUG
        Serial.println("Light cycle -15 mins");
#endif
      }
      break;

    default:
      setMode(value);

  }
}


/////////////////////////
// requestEvent()
//
// function that executes whenever data is requested by master
// this function is registered as an event, see setup()

void requestEvent() {
  //TODO add the pump status, light status and mode

  int sysmode;
  switch (systemMode) {
    case OFF:
      sysmode = 1;
      break;
    case AUTO:
      sysmode = 2;
      break;
    case MANUAL_PUMP_ON:
      sysmode = 3;
      break;
    case MANUAL_PUMP_OFF:
      sysmode = 4;
      break;
    default:
      sysmode = 0;
      break;
  }

#ifdef DEBUG
  Serial.print("\n---Sending");
  Serial.println(valuePhotoResistor);
  Serial.println(valueTemperature / 100);
  //Serial.println(valueTemperature%100);
  Serial.println(valueReservoirDepth);
  Serial.println(sysmode);
  delay(250);
#endif

  //do this to send integers and split float into integers
  int valTemp = valueTemperature * 10; //do this to include one decimal place and *10 at destination
  int valHum = valueHumidity;

  if (outputText) {
    unsigned long secondsToLightOff = (lightOffAt - millis()) / 1000;
    //buffer
    sprintf(buffer_out, "%d %d.%d %d.%d %d %d %d %u", valuePhotoResistor, valTemp / 100, valTemp % 100, valHum / 10, valHum % 10, sysmode, statusLightOn, statusPumpOn, secondsToLightOff);

  } else {
    //compose custom buffer output - buffer size for wire library is 32 bytes/characters, customize this for application
    intToCharBuffer(buffer_out, 0, valuePhotoResistor);
    intToCharBuffer(buffer_out, 2, valTemp);
    intToCharBuffer(buffer_out, 4, valHum);
    if (statusLightOn) {
      unsigned int minutesToLightOff = (lightOffAt - millis()) / 60000;
      //longToCharBuffer(buffer_out, 6, (lightOffAt - millis()) );
      intToCharBuffer(buffer_out, 6, minutesToLightOff);
    } else {
      unsigned int minutesToLightOn = (lightOnAt - millis()) / 60000;
      intToCharBuffer(buffer_out, 6, minutesToLightOn );
    }
    intToCharBuffer(buffer_out, 8, lightDurMillis / 60000);
    intToCharBuffer(buffer_out, 10, floodIntMillis / 60000);
    intToCharBuffer(buffer_out, 12, floodDurMillis / 60000);
    buffer_out[14] = sysmode;
    buffer_out[15] = statusLightOn;
    buffer_out[16] = statusPumpOn;
    intToCharBuffer(buffer_out, 17, valueReservoirDepth);
    //reserve byte for fan status

  }

  Wire.write(&buffer_out[0], BUFSIZE);

}

timelib_t time_provider()
{
  // Prototype if the function providing time information
  return initialt;
}


/////////////////////////
// intToCharBuffer(buffer, offset, value)
//
// Put an integer into a buffer (note integers use 2 bytes)
//
// buffer - the buffer to write to
// offset - the position in the buffer
// value - the value to enter into the buffer

void intToCharBuffer(char *buffer, int offset, int value) {
  buffer[offset] = (value >> 8) & 0xFF;
  buffer[offset + 1] = value & 0xFF;
}


/////////////////////////
// longToCharBuffer(buffer, offset, value)
//
// Put an long integer into a buffer (note longs use 4 bytes)
//
// buffer - the buffer to write to
// offset - the position in the buffer
// value - the value to enter into the buffer

void longToCharBuffer(char *buffer, int offset, long value) {
  buffer[offset] = (value >> 24) & 0xFF;
  buffer[offset + 1] = (value >> 16) & 0xFF;
  buffer[offset + 2] = (value >> 8) & 0xFF;
  buffer[offset + 3] = value & 0xFF;
}

/////////////////////////
// String setMode(int)
//
// Sets the mode, and returns the string of what the mode is;

String setMode (int modeNumber) {

  String str;

  switch (modeNumber) {
    case 1:
      systemMode = OFF;
      sysMode = 1;
      str = "OFF";
      break;
    case 2:
      systemMode = AUTO;
      sysMode = 2;
      str = "AUTO";
      break;
    case 3:
      systemMode = MANUAL_PUMP_ON;
      sysMode = 3;
      str = "MANUAL PUMP & LIGHT";
      break;
    case 4:
      systemMode = MANUAL_PUMP_OFF;
      sysMode = 4;
      str = "MANUAL LIGHT";
      break;
    default:
      sysMode = 1;
      systemMode = AUTO;
      str = "AUTO";
      break;
  }

  return str;

}
