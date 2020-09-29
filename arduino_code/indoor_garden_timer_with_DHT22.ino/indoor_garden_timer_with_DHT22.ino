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

//#define DEBUG true

//hardware parameters
#define PUMPPIN 6
#define LIGHTPIN 7
#define P_RESISTOR A2
#define ECHOPIN 8
#define TRIGPIN 9
#define DHTPIN 11
#define DHTTYPE DHT22

//behaviour parameters
#define DELAY 2000 // 2 seconds between updates - saves power so cpu is not always running
#define SAMPLES  5//number of points to average to determine valid data points

//Communication parameters
#define SLAVE_ADDR 0x08
#define UPDATE_RATE 5000
#define BUFSIZE 0x20
#define MAX_SENT_BYTES 3

//Reservoir - distance from sensor to bottom of reservoir
#define RESERVOIR_BOTTOM 45


//convenience definitions
#define ONEDAY 86400000
#define ONEHOUR 3600000
#define ONEMINUTEs 60000
#define FIVEMINUTES 300000
#define FIFTEENMINUTES 900000

enum sMode {OFF, AUTO, MANUAL_PUMP_ON, MANUAL_PUMP_OFF};

//communications
char buffer_out[BUFSIZE]; //max buffer size is 32 bytes
byte receivedCommands[MAX_SENT_BYTES];
byte outputText = false; //1 - text, 2 - binary

const String swName = "Ebb and Flow Timer with Light";
const String swVer = "1.1";
const String swRel = "2020-05-03";

/* Common Millis equivalents
   24 hours = 86400000; 16 hours = 57600000; 8 hours = 28800000; 4 hours = 14400000; 2 hours = 7200000; 1 hour = 3600000
   10 minutes = 600000; 5 minutes = 300000; 2 minutes = 120000; 1 minute = 60000
*/

//pins
const byte pumpPin = PUMPPIN; //pin number for activating relay for pump
const byte lightPin = LIGHTPIN; //pin number for activating relay for light
const byte pinLightSensor = P_RESISTOR; //pin number for light sensor
DHT dht(DHTPIN, DHTTYPE);

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
float historyTemperature[SAMPLES];
float historyHumidity[SAMPLES];
//int historyDepth[SAMPLES];
byte index = 0;

sMode systemMode = AUTO;


/////////////////////////
// setup()
//
// runs once before loop();

void setup() {
  
  //setup pump and light
  pinMode(pumpPin, OUTPUT);
  pinMode(lightPin, OUTPUT);
  digitalWrite(pumpPin, HIGH); //pump off
  digitalWrite(lightPin, HIGH); //pump off


  //setup sensors
  pinMode(pinLightSensor, INPUT);// Set pResistor - A0 pin as an input (optional)
  pinMode(TRIGPIN, OUTPUT);
  pinMode(ECHOPIN, INPUT);
  dht.begin();

  //setup of i2c communication
  Wire.begin(SLAVE_ADDR);       // join i2c bus with slave address
  Wire.onRequest(requestEvent); // register event
  Wire.onReceive(receiveEvent);

#ifdef DEBUG
  Serial.begin(57600);
  Serial.begin(9600);
#endif

}


/////////////////////////
// loop()
//
// Main loop that runs after setup()

void loop() {

  delay(DELAY); //this is to save power

  unsigned long now = millis();
  readSensors();

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
    if (lightOnAt < ONEDAY && now < ONEDAY || lightOnAt > ONEDAY) { //code for light on at rollover
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

  //if (mode button pushed) {
  //      if (systemMode == AUTO) {
  //        systemMode = MANUAL_PUMP_ON;
  //      } else if (systemMode == MANUAL_PUMP_ON) {
  //        systemMode = MANUAL_PUMP_OFF;
  //      } else {
  //        systemMode = AUTO;
  //      }
  //}

  //TODO: update display with status and temperatures
  
}


/////////////////////////
// readSensors()
//
// Reads sensors and apply a smoothing filter to exclude bad values

void readSensors() {

  historyTemperature[index] = dht.readTemperature();
  historyHumidity[index] = dht.readHumidity();
  
  valuePhotoResistor = analogRead(pinLightSensor);
  valueTemperature = dataSmooth(historyTemperature);
  valueHumidity = dataSmooth(historyHumidity);
  valueReservoirDepth = RESERVOIR_BOTTOM - averageDistance(5);

  index = (index + 1) % SAMPLES;

}

/////////////////////////
// averageDistance(int samples)
//
// Averages the distance samples for more accuracy
//

int averageDistance(int samples){

  int sum = 0;
  
  for (int x = 0; x < samples; x++){
    sum += readDistance();
    Serial.print(sum);
  }

   #ifdef DEBUG
    Serial.print("Avg Dist: ");
    Serial.print(sum/samples);
    Serial.println(" cm");
  #endif
  
  return (sum / samples);  
  
}

/////////////////////////
// readDistance()
//
// Reads the distance from an SR-04
//

int readDistance(){

  long duration;
  int distance = 0;

  // Clears the TRIGPIN condition
  digitalWrite(TRIGPIN, LOW);
  delayMicroseconds(4);
  // Sets the TRIGPIN HIGH for 10 microseconds
  digitalWrite(TRIGPIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGPIN, LOW);
  // Reads the ECHOPIN, returns the sound wave travel time in microseconds
  duration = pulseIn(ECHOPIN, HIGH);
  // Calculating the distance
  //distance = duration * 0.0343 / 2; // Speed of sound wave divided by 2 (there and back)
  distance = duration * 0.343 / 2; // Speed of sound wave divided by 2 (there and back) in mm

  #ifdef DEBUG
    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.println(" mm");
  #endif

  return distance;

}

/////////////////////////
// dataSmooth(float, float*)
//
// validate by averaging the history
//
// if more than 3 data points then throw out the highest and lowest values in the history
//

float dataSmooth(float *history){

  float sum = 0;
  float avg;
  float maxVal = history[0];
  float minVal = history[0];
  
  for (int x = 0; x < SAMPLES; x++){
    sum += history[x];
    if (history[x] > maxVal) {
      maxVal = history[x];
    } 
    else if (history[x] < minVal) {
      minVal = history[x];
    }
  }

  if (SAMPLES > 3){
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
    Serial.println(valueTemperature/100);
    //Serial.println(valueTemperature%100);
    Serial.println(valueReservoirDepth);
    Serial.println(sysmode);
    delay(250);
  #endif

  //do this to send integers and split float into integers
  int valTemp = valueTemperature * 100;
  int valHum = valueHumidity * 10;

  if (outputText){
     unsigned long secondsToLightOff = (lightOffAt - millis()) / 1000;
    //buffer
    sprintf(buffer_out, "%d %d.%d %d.%d %d %d %d %u", valuePhotoResistor, valTemp / 100, valTemp % 100, valHum / 10, valHum % 10, sysmode, statusLightOn, statusPumpOn, secondsToLightOff);
  
  } else {
    //compose custom buffer output - buffer size for wire library is 32 bytes/characters, customize this for application
    intToCharBuffer(buffer_out, 0, valuePhotoResistor);
    intToCharBuffer(buffer_out, 2, valTemp);
    intToCharBuffer(buffer_out, 4, valHum);
    if (statusLightOn){
      unsigned int minutesToLightOff = (lightOffAt - millis()) / 60000;
      //longToCharBuffer(buffer_out, 6, (lightOffAt - millis()) );
      intToCharBuffer(buffer_out, 6, minutesToLightOff);
    } else {
      unsigned int minutesToLightOn = (lightOnAt - millis()) / 60000;
      intToCharBuffer(buffer_out, 6, minutesToLightOn );
    }
    longToCharBuffer(buffer_out, 8, lightDurMillis /60000);
    longToCharBuffer(buffer_out, 10, floodIntMillis / 60000);
    longToCharBuffer(buffer_out, 12, floodDurMillis / 60000);
    buffer_out[13] = sysmode;
    buffer_out[14] = statusLightOn;
    buffer_out[15] = statusPumpOn;
    intToCharBuffer(buffer_out, 16, valueReservoirDepth);
    //reserve byte for fan status

  }
  
  Wire.write(&buffer_out[0], BUFSIZE);

}


/////////////////////////
// intToCharBuffer(buffer, offset, value)
//
// Put an integer into a buffer (note integers use 2 bytes)
//
// buffer - the buffer to write to
// offset - the position in the buffer
// value - the value to enter into the buffer

void intToCharBuffer(char *buffer, int offset, int value){
  buffer[offset] = (value >>8) & 0xFF;
  buffer[offset+1] = value & 0xFF;
}


/////////////////////////
// longToCharBuffer(buffer, offset, value)
//
// Put an long integer into a buffer (note longs use 4 bytes)
//
// buffer - the buffer to write to
// offset - the position in the buffer
// value - the value to enter into the buffer

void longToCharBuffer(char *buffer, int offset, long value){
  buffer[offset] = (value >>24) & 0xFF;
  buffer[offset+1] = (value >>16) & 0xFF;
  buffer[offset+2] = (value >>8) & 0xFF;
  buffer[offset+3] = value & 0xFF;
}

/////////////////////////
// setMode(int)

void setMode (int modeNumber) {

  switch (modeNumber) {
    case 1:
      systemMode = OFF;
      break;
    case 2:
      systemMode = AUTO;
      break;
    case 3:
      systemMode = MANUAL_PUMP_ON;
      break;
    case 4:
      systemMode = MANUAL_PUMP_OFF;
      break;
    default:
      systemMode = AUTO;
      break;
  }
}