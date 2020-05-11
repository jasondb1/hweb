/*
Author: Jason De Boer
2 relay light and pump

TODO: 
1. add manual pump on function to empty reservoir - add buttons for manual
2. add code for DS22 temperature
3. add photo resistor
4. add screen

*/

#include <Wire.h>
#define SLAVE_ADDR 0x08
#define UPDATE_RATE 5000
#define BUFSIZE 0x20
#define  MAX_SENT_BYTES       3
#define DEBUG true

enum sMode {OFF, AUTO, MANUAL_PUMP_ON, MANUAL_PUMP_OFF};

char buffer_out[BUFSIZE];
byte receivedCommands[MAX_SENT_BYTES];

const String swName = "Ebb and Flow Timer with Light";
const String swVer = "1.1";
const String swRel = "2020-05-03";

/* Common Millis equivalents
   24 hours = 86400000; 16 hours = 57600000; 8 hours = 28800000; 4 hours = 14400000; 2 hours = 7200000; 1 hour = 3600000
   10 minutes = 600000; 5 minutes = 300000; 2 minutes = 120000; 1 minute = 60000
*/

//setup pins
const byte pumpPin = 6; //pin number for activating relay for pump
const byte lightPin = 7; //pin number for activating relay for light
const byte pinLightSensor = A2; //pin number for light sensor

//setup timings
#ifndef DEBUG
  const long longestDelayBetweenFlooding = 21600000; //longest acceptable delay between flooding.
  const long floodIntMillis = 1800000; //millis between flooding : 30 mins
  const long floodDurMillis = 900000; //millis for flood duration : 15 mins
  const long lightIntMillis = 86400000; //24 hour cycles
  const long lightDurMillis = 57600000; //16 hours on
#else
  const long longestDelayBetweenFlooding = 240000;
  const long floodIntMillis = 30000; 
  const long floodDurMillis = 5000;
  const long lightIntMillis = 120000; 
  const long lightDurMillis = 60000; //light off for 60 seconds 
#endif


const int lightLevel = 600; //this value indicates whether the sun is up. Value out of 1023. higher = lighter (indirect sun is around 850; normal indoor lighting is around 650)
const long lightLevelDelay = 20000; //delay before deciding it is daylight. To avoid lights, torches etc. causing issues


//setup options
unsigned int lightSensorNow = analogRead(pinLightSensor);

unsigned long lightLastOn = lightIntMillis; //ensure light comes on when started
unsigned long pumpLastOn = floodIntMillis + lightLevelDelay; //ensuring pump comes on when device is turned on and it is light
unsigned long pumpOffAt = 0;
unsigned long pumpOnAt = 0;
unsigned long lightOffAt = 0;
unsigned long lightOnAt = 0;

boolean statusSystemOn = true;
boolean statusPumpOn = false;
boolean statusLightOn = false;
boolean manualMode = false;


//unsigned long sunUpMillis = 0;
//unsigned long sunDownMillis = 0;
//boolean sunUpCheck = false;
//boolean sunDownCheck = false;
//boolean sunUp;
//boolean lastState = false;

int value_pResistor = 0;
int value_humidity = 0;
int value_temp = 0;

sMode systemMode = AUTO;



void setup() {
  //setup pump and light
  pinMode(pumpPin, OUTPUT);
  pinMode(lightPin, OUTPUT);
  digitalWrite(pumpPin, LOW); //pump off

  //setup sensors
  pinMode(pinLightSensor, INPUT);// Set pResistor - A0 pin as an input (optional)

  //setup of i2c
  Wire.begin(SLAVE_ADDR);       // join i2c bus with slave address
  Wire.onRequest(requestEvent); // register event
  Wire.onReceive(receiveEvent);

  //Serial.begin(57600);
}


void loop() {

  //TODO: manual on/off light and pump - drain 

  unsigned long now = millis();
  
  //calculate when to turn light and pump off and on
  //calculate light on
  if (now - lightLastOn > lightIntMillis || now < lightLastOn) { //checking when the pump was last on. also when system first starts up
      lightLastOn = now;
      lightOffAt = now + lightDurMillis;
  }
  
  //if light is on calculate when to run pump
  if(statusLightOn){
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

  delay(500); //this is to save power
  
}


/////////////////////////
// receiveEvent(int)
//
// 1 - mode off
// 2 - mode auto
// 3 - mode manual pump on light on
// 4 - mode manual pump off light on
//

void receiveEvent(int bytesReceived){
//     for (int a = 0; a < bytesReceived; a++) {
//          if ( a < MAX_SENT_BYTES) {
//               receivedCommands[a] = Wire.read();
//          }
//          else {
//               Wire.read();  // if we receive more data then allowed just throw it away
//          }
//     }

       while(Wire.available()) {
             number = Wire.read();
             //Serial.print("data received: ");
             //Serial.println(number);
             
             setMode(number)
                  
          }
}


/////////////////////////
// requestEvent()

// function that executes whenever data is requested by master
// this function is registered as an event, see setup()

void requestEvent() {
  //use mapping to get the temp values
  //int value_temp = map(sensorReading, 0, 1023, -5, 32);

  //get the values
  value_pResistor = analogRead(pinLightSensor);
  
  //TODO: These are demo values hardcoded in - need to get from sensors
  value_temp = 20.00f * 100;
  value_humidity = 47;

  //TODO add the pump status, light status and mode
  
  //String toSend = String(analogRead(pinLightSensor), HEX);
  //note floats are split into integers 
  //send output (photo resistor value, temperature, humidity)
  sprintf(buffer_out, "%d %d.%d %d", value_pResistor, value_temp / 100, value_temp % 100, value_humidity );
  
  //String toSend = String(analogRead(pResistor), HEX); 
  //Serial.println(toSend);
  //Wire.write(&toSend[0]); // respond with message of x bytes
  Wire.write(&buffer_out[0], BUFSIZE);
}

/////////////////////////
// setMode(int)

void setMode (int modeNumber){

  switch (modeNumber) {
  case 1:
    systemMode = OFF
    break;
  case 2:
    systemMode = AUTO
    break;
  case 3:
    systemMode = MANUAL_PUMP_ON
    break;
  case 4:
    systemMode = MANUAL_PUMP_OFF
    break;
  default:
    systemMode = AUTO
    break;
  }

  
}
