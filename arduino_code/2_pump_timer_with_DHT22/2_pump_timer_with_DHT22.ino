/*
  Author: Jason De Boer
  2 relay light and pump

  TODO:
  4. add screen
  5. add physical buttons
  6. possible add relays for exhaust fan based on temp/humidity?

*/

#include <Wire.h>
//#include <DHT.h>
#include <dhtnew.h>

//#define DEBUG true

//hardware parameters
#define PUMPPIN 6
#define RELAYONEPIN 7
#define P_RESISTOR A2
#define ECHOPIN 8
#define TRIGPIN 9
#define DHTPIN 11

//behaviour parameters
#define DELAY 2000 // 2 seconds between updates - saves power so cpu is not always running
#define SAMPLES  5//number of points to average to determine valid data points
#define LOWPASS_VALUE 120
#define SMOOTHING_VALUE 0.1

//Communication parameters
#define SLAVE_ADDR 0x08
#define UPDATE_RATE 5000
#define BUFSIZE 0x20
#define MAX_SENT_BYTES 3

//Reservoir - distance from sensor to bottom of reservoir
#define RESERVOIR_BOTTOM 450  //mm to bottom of reservoir
#define RESERVOIR_TOP 20 //


//convenience definitions
#define ONEDAY 86400000
#define TWELVEHOURS 43200000
#define ONEHOUR 3600000
#define ONEMINUTEs 60000
#define FIVEMINUTES 300000
#define FIFTEENMINUTES 900000
#define OFFSET 10000

enum sMode {OFF, AUTO, MANUAL_PUMP_ON, MANUAL_PUMP_OFF};

//communications
char buffer_out[BUFSIZE]; //max buffer size is 32 bytes
byte receivedCommands[MAX_SENT_BYTES];
byte outputText = false; //1 - text, 2 - binary

const String swName = "Ebb and Flow Timer with Light";
const String swVer = "1.1";
const String swRel = "2022-06-28";

//pins
const byte pumpPin = PUMPPIN; //pin number for activating relay for pump
const byte relayOnePin = RELAYONEPIN; //pin number for activating relay for light
const byte pinLightSensor = P_RESISTOR; //pin number for light sensor
DHTNEW dht(DHTPIN);

//setup default timings
#ifndef DEBUG
unsigned long longestDelayBetweenFlooding = 21600000; //longest acceptable delay between flooding.
//unsigned long floodIntMillis = 43200000; //millis between flooding : 12 hours
unsigned long floodIntMillis = 11520000; //8 hours
unsigned long floodDurMillis = 1800000; //millis for flood duration : 30 mins
//unsigned long relayOneIntMillis = 43200000; //12 hour cycles
unsigned long relayOneIntMillis = 11520000; //8 hours
unsigned long relayOneDurMillis = 1800000; //30 minutes
#else
unsigned long longestDelayBetweenFlooding = 240000;
unsigned long floodIntMillis = 30000;
unsigned long floodDurMillis = 5000;
unsigned long relayOneIntMillis = 30000;
unsigned long relayOneDurMillis = 5000; //light off for 60 seconds
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

unsigned long relayOneLastOn = relayOneIntMillis; //ensure light comes on when started
unsigned long pumpLastOn = floodIntMillis + lightLevelDelay; //ensuring pump comes on when device is turned on and it is light
unsigned long pumpOffAt = 0;
unsigned long pumpOnAt = 0;
unsigned long relayOneOffAt = 0;
unsigned long relayOneOnAt = 0;

//setup options
unsigned int lightSensorNow = analogRead(pinLightSensor);
unsigned long now = 0;

//status and values
boolean statusSystemOn = true;
boolean statusPumpOn = false;
boolean statusRelayOneOn = false;
boolean manualMode = false;

int valuePhotoResistor = -99;
float valueHumidity = -99;
float valueTemperature = -99;
int valueReservoirDepth = -99;
//float historyTemperature[SAMPLES];
//float historyHumidity[SAMPLES];
//int historyDepth[SAMPLES];
byte index = 0;
int8_t maxTemp = -127;
int8_t minTemp = 127;

sMode systemMode = AUTO;


/////////////////////////
// setup()
//
// runs once before loop();

void setup() {

  //setup pump and light
  pinMode(pumpPin, OUTPUT);
  pinMode(relayOnePin, OUTPUT);
  digitalWrite(pumpPin, HIGH); //pump off
  digitalWrite(relayOnePin, HIGH); //pump off


  //setup sensors
  pinMode(pinLightSensor, INPUT);// Set pResistor - A0 pin as an input (optional)
  pinMode(TRIGPIN, OUTPUT);
  pinMode(ECHOPIN, INPUT);
  initDHT22();

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

  now = millis();
  readSensors();

#ifdef DEBUG
  Serial.println("---Values");
  Serial.println(valuePhotoResistor);
  Serial.println(valueHumidity);
  Serial.println(valueTemperature);
  Serial.println(valueReservoirDepth);
#endif

  //if relay one is on calculate when to run pump
  if (now - relayOneLastOn > relayOneIntMillis || now < relayOneLastOn) { //checking when the pump was last on.
    relayOneLastOn = now;
    //relayOneOnAt = relayOneIntMillis + now;
    relayOneOffAt = now + relayOneDurMillis; //relayOneOffAt has been added so that the pump doesn't switch off during a cycle if the lights go our or sun goes down
  }

  //if light is on calculate when to run pump
  if (now - pumpLastOn > floodIntMillis || now < pumpLastOn) { //checking when the pump was last on.
    pumpLastOn = now;
    pumpOffAt = now + floodDurMillis; //pumpOffAt has been added so that the pump doesn't switch off during a cycle if the lights go our or sun goes down
  }

  //relay one on and off default to on
  if ( (now < relayOneOffAt && systemMode == AUTO) || systemMode == MANUAL_PUMP_ON || systemMode == MANUAL_PUMP_OFF)  { //turning the light on
    if (statusRelayOneOn != true) {
      digitalWrite(relayOnePin, LOW); //light on
      statusRelayOneOn = true;
    }
  } else {
    if (statusRelayOneOn != false) {
      digitalWrite(relayOnePin, HIGH); //light off
      statusRelayOneOn = false;
    }
  }

  //pump on and off default to on
  if ( (now < pumpOffAt && systemMode == AUTO) || systemMode == MANUAL_PUMP_ON) { //turning the pump on
    if (statusPumpOn != true) {
      delay(2000);
      digitalWrite(pumpPin, LOW); //pump on
      statusPumpOn = true;
    }
  } else {
    if (statusPumpOn != false) {
      delay(2000);
      digitalWrite(pumpPin, HIGH); //pump off
      statusPumpOn = false;
    }
  }

}


/////////////////////////
// readSensors()
//
// Reads sensors and apply a smoothing filter to exclude bad values

void readSensors() {

//  historyTemperature[index] = dht.readTemperature();
//  historyHumidity[index] = dht.readHumidity();

  valuePhotoResistor = analogRead(pinLightSensor);

  if (millis() - dht.lastRead() > 2000)
  {
    dht.read();
    valueTemperature = expSmoothing<float>(dht.getTemperature(), valueTemperature);
    valueHumidity = expSmoothing<float>(dht.getHumidity(), valueHumidity);
  }

    if (valueTemperature > maxTemp)
    maxTemp = valueTemperature;

  if (valueTemperature < minTemp)
    minTemp = valueTemperature;


  valueReservoirDepth = RESERVOIR_BOTTOM - averageDistance(3);

  index = (index + 1) % SAMPLES;

}

/////////////////////////
// averageDistance(int samples)
//
// Averages the distance samples for more accuracy
//

int averageDistance(int samples) {

  int sum = 0;

  for (int x = 0; x < samples; x++) {
    sum += readDistance();
    Serial.print(sum);
  }

#ifdef DEBUG
  Serial.print("Avg Dist: ");
  Serial.print(sum / samples);
  Serial.println(" cm");
#endif

  return (sum / samples);

}

/////////////////////////
// readDistance()
//
// Reads the distance from an SR-04
//

int readDistance() {

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

float dataSmooth(float *history) {

  float sum = 0;
  float avg;
  float maxVal = history[0];
  float minVal = history[0];

  for (int x = 0; x < SAMPLES; x++) {
    sum += history[x];
    if (history[x] > maxVal) {
      maxVal = history[x];
    }
    else if (history[x] < minVal) {
      minVal = history[x];
    }
  }

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
// void initDHT22()
//
//  initialize temperatures and humidity values

void initDHT22() {

  const uint8_t samples = 5;
  int32_t sumHumidity = 0;
  int32_t sumTemperature = 0;

  for (int x = 0; x < samples; x++) {
    if (millis() - dht.lastRead() > 2000)
    {
      dht.read();
      sumTemperature += dht.getTemperature();
      sumHumidity += dht.getHumidity();

    }
    delay (2500);
  }

  valueHumidity = sumHumidity / samples;
  valueTemperature = sumTemperature / samples;
}

/////////////////////////
// T expSmoothing(T value, T prevValue)
//
//  data smoothing and lowpass filter

template<typename T>
T expSmoothing(T value, T prevValue) {

  if (value > LOWPASS_VALUE || isnan(value) ) {
    return prevValue;
  }

  T average = ((SMOOTHING_VALUE * value) + (1 - SMOOTHING_VALUE) * prevValue);

  return average;
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
      relayOneDurMillis += (15UL * 60000); //add 15 minutes for light duration
      break;
    case 6:
      relayOneDurMillis -= (15UL * 60000); //add -15 minutes for light duration
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
      relayOneOffAt += (15UL * 60000); //add 15 minutes for light off at - used to start cycle later in the day
      relayOneOnAt += (15UL * 60000);
      //relayOneLastOn += (15UL * 60000);
#ifdef DEBUG
      Serial.println("Light cycle +15 mins");
#endif
      break;
    case 12:
      if ( (relayOneOnAt - (15UL * 60000) ) > millis() ) { //do not allow lights on to become less than the current time - could break
        relayOneOffAt -= (15UL * 60000); //sub 15 minutes for light off at - used to start cycle earlier in the day
        //relayOneLastOn -= (15UL * 60000);
        relayOneOnAt -= (15UL * 60000);
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
  int valTemp = valueTemperature * 100;
  int valHum = valueHumidity * 10;

  if (outputText) {
    unsigned long secondsToLightOff = (relayOneOffAt - millis()) / 1000;
    //buffer
    sprintf(buffer_out, "%d %d.%d %d.%d %d %d %d %u", valuePhotoResistor, valTemp / 100, valTemp % 100, valHum / 10, valHum % 10, sysmode, statusRelayOneOn, statusPumpOn, secondsToLightOff);

  } else {
    //compose custom buffer output - buffer size for wire library is 32 bytes/characters, customize this for application
    intToCharBuffer(buffer_out, 0, valuePhotoResistor);
    intToCharBuffer(buffer_out, 2, valTemp);
    intToCharBuffer(buffer_out, 4, valHum);
    if (statusRelayOneOn) {
      unsigned int minutesToLightOff = (relayOneOffAt - millis()) / 60000;
      //longToCharBuffer(buffer_out, 6, (relayOneOffAt - millis()) );
      intToCharBuffer(buffer_out, 6, minutesToLightOff);
    } else {
      unsigned int minutesToLightOn = (relayOneOnAt - millis()) / 60000;
      intToCharBuffer(buffer_out, 6, minutesToLightOn );
    }
    longToCharBuffer(buffer_out, 8, relayOneDurMillis / 60000);
    longToCharBuffer(buffer_out, 10, floodIntMillis / 60000);
    longToCharBuffer(buffer_out, 12, floodDurMillis / 60000);
    buffer_out[13] = sysmode;
    buffer_out[14] = statusRelayOneOn;
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
