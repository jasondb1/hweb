/*
  Author: Jason De Boer


*/
#include "indoor_garden_timer_with_DHT22.h"

//Timelibrary
time_t time_now, initialt, time_water_expires, time_nutrient_expires, menuDelay;
uint8_t previousDay;
uint8_t intervalIncrement = 10;
uint8_t durationIncrement = 10;

//communications
uint8_t serialCommunications = 0; //0 - disable; 1 - text, 2 - binary
boolean readReservoir = false;
boolean readLight = false;

//Equipment status
struct Equipment {
  time_t timeOn;
  time_t timeOff;
  boolean isContinuous;
  boolean isRunning;
  uint32_t duration;
  uint32_t interval;
  uint8_t pin;
};

struct Equipment light;
struct Equipment pump;
struct Equipment aux1;
struct Equipment aux2;

//pins
const uint8_t pinLightSensor = P_RESISTOR; //pin number for light sensor
const uint8_t buttonMenu = BUTTONMENUPIN;
const uint8_t buttonUp = BUTTONUPPIN;
const uint8_t buttonDown = BUTTONDOWNPIN;

//uint32_t longestDelayBetweenFlooding = 21600; //longest acceptable delay between flooding.

//menu items
volatile buttonModes buttonStatus = NONE; //status for ISR routine
uint8_t menuValue = 0;
//boolean menuItemSelected = false;
boolean displayChanged = false;
boolean defaultValues = false;

//Commonly used strings
const char* modeDescription[4] = {"Off", "Auto", "Manual Pump", "Manual Light"};
const char* mainMenuNames[7] = {"", "Time", "Light", "Pump", "Aux1", "Aux2", "Other"};
const char* commonString[9] = {"Off", "On", "Continuous", "Timer", "Interval", "Duration", "Increment", "Hour", "Minutes"};
const char* stringFormat[5] = {"%02d:%02d", "%d Days", "%lu:%02lu", "%s %s", "%s %s %s"};

//Devices
DHTNEW dht(DHTPIN);
NewPing sonar(TRIGPIN, ECHOPIN, MAX_DISTANCE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

//light sensor thresholds - currently not being used
//uint16_t lightLevel = 600; //this value indicates whether the sun is up. Value out of 1023. higher = lighter (indirect sun is around 850; normal indoor lighting is around 650)
//const uint16_t lightLevelDelay = 20000; //delay before deciding it is daylight. To avoid lights, etc. causing issues

uint16_t daysToReplaceWater = 21;
uint16_t daysToReplaceNutrient = 21;

//setup options
uint16_t lightSensorNow = analogRead(pinLightSensor);

//status initializations
struct Status {
  boolean statusSystemOn;
  boolean manualMode;
  boolean pumpWhenLightOff;
};

struct Status status;

//sensor defaults
int16_t valuePhotoResistor = -99;
float valueHumidity = -99;
float valueTemperature = -99;
int16_t valueReservoirDepth = -99;
//float historyTemperature[SAMPLES];
//float historyHumidity[SAMPLES];
//int historyDepth[SAMPLES];
//uint8_t index = 0;
uint16_t reservoirTop = RESERVOIR_TOP;
uint16_t reservoirBottom = RESERVOIR_BOTTOM;
int8_t maxTemp = -127;
int8_t minTemp = 127;

uint8_t sysMode = 0;
int8_t displayScreen = 0;


/////////////////////////
// setup()
//
// runs once before loop();

void setup() {

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Init...");

  light.pin = LIGHTPIN;
  //light.name = NAMELIGHT;
  light.duration = 54000;
  light.interval = 86400;
  light.timeOn = 5;
  light.timeOff = 0;
  light.isContinuous = false;
  light.isRunning = false;

  pump.pin = PUMPPIN;
  //pump.name = NAMEPUMP;
#ifdef PUMPLARGEVALUES
  pump.duration = 54000;
  pump.interval = 86400;;
#else
  pump.duration = 0;
  pump.interval = 3600;
#endif
  pump.timeOn = 5;
  pump.timeOff = 0;
  pump.isContinuous = false;
  pump.isRunning = false;

  aux1.pin = AUXONEPIN;
  //aux1.name = NAMEAUXONE;
#ifdef AUXONELARGEVALUES
  aux1.duration = 54000;
  aux1.interval = 86400;;
#else
  aux1.duration = 0;
  aux1.interval = 3600;
#endif
  aux1.timeOn = 5;
  aux1.timeOff = 0;
  aux1.isContinuous = false;
  aux1.isRunning = false;

  aux2.pin = AUXTWOPIN;
  //aux2.name = NAMEAUXTWO;
#ifdef AUXTWOLARGEVALUES
  aux2.duration = 54000;
  aux2.interval = 86400;
#else
  aux2.duration = 0;
  aux2.interval = 3600;
#endif
  aux2.timeOn = 5;
  aux2.timeOff = 0;
  aux2.isContinuous = false;
  aux2.isRunning = false;

  //set status'
  status.statusSystemOn = true;
  status.manualMode = false;
  status.pumpWhenLightOff = true;

  //setup pump and light
  digitalWrite(pump.pin, HIGH);
  digitalWrite(light.pin, HIGH);
  digitalWrite(aux1.pin, HIGH);
  digitalWrite(aux2.pin, HIGH);
  pinMode(pump.pin, OUTPUT);
  pinMode(light.pin, OUTPUT);
  pinMode(aux1.pin, OUTPUT);
  pinMode(aux2.pin, OUTPUT);

  pinMode(buttonMenu, INPUT_PULLUP);
  pinMode(buttonUp, INPUT_PULLUP);
  pinMode(buttonDown, INPUT_PULLUP);
  digitalWrite(buttonMenu, HIGH);
  digitalWrite(buttonUp, HIGH);
  digitalWrite(buttonDown, HIGH);

  delay(5000);

  sysMode = 1; //set to auto

  //setup sensors
  pinMode(pinLightSensor, INPUT);// Set pResistor - A0 pin as an input (optional)
  pinMode(TRIGPIN, OUTPUT);
  pinMode(ECHOPIN, INPUT);
  initDHT22();

  //setup of i2c communication
  if (serialCommunications > 0) {
    Wire.begin(SLAVE_ADDR);       // join i2c bus with slave address
    Wire.onRequest(requestEvent); // register event
    Wire.onReceive(receiveEvent);
  }

  //setTime(hr,min,sec,day,mnth,yr);
  setTime(12, 00, 00, 1, 1, 2022);

#ifndef DEBUG
  readSettings();//Read EEPROM
#endif

  //Set timers for water and nutrient timer
  time_now = now();
  menuDelay = time_now;
  time_water_expires = time_now + (daysToReplaceWater * 24 * 60 * 60L);
  time_nutrient_expires = time_now + (daysToReplaceNutrient * 24 * 60 * 60L);

  resetTimers();

#ifdef DEBUG
  Serial.begin(57600);
  //Serial.begin(9600);
#endif

  attachPinChangeInterrupt(digitalPinToPinChangeInterrupt(buttonMenu), menu_ISR, FALLING); //UNO has only pin 2 and 3 for default interrupt, so needing alternate library to make this happen
  attachPinChangeInterrupt(digitalPinToPinChangeInterrupt(buttonUp), up_ISR, FALLING);
  attachPinChangeInterrupt(digitalPinToPinChangeInterrupt(buttonDown), down_ISR, FALLING);

  lcd.clear();
  displayChanged = true;
}


/////////////////////////
// loop()
//
// Main loop that runs after setup()

void loop() {

  time_now = now();

  if (buttonStatus != NONE) {
    delay(BUTTONTIMEOUT);
    switch (buttonStatus) {
      case MENU:
        menuButtonPressed();
        break;
      case UP:
        valueButtonPressed(1);
        break;
      case DOWN:
        valueButtonPressed(-1);
        break;
      default:
        menuButtonPressed();
        break;
    }
    menuDelay = time_now + MENUDELAY;
  }

  //if (menuItem == STATUS) {
  if (menuValue == 0) {
    if (time_now > menuDelay) {
      displayChanged = true;
      menuDelay = time_now + MENUDELAY; //Menu delay on screen update
    }

    if (displayChanged) {
      displayInfo(displayScreen);
    }

    delay(DELAY); //this is to save power
    readSensors();
    checkTimers(time_now);

  } else {

    if (displayChanged) {
      displayMenu();
    }

    if (time_now > menuDelay) {
      //menuItem = STATUS;
      menuValue = 0;
      lcd.clear();
      displayChanged = true;
      displayInfo(displayScreen);
    }
    delay(BUTTONTIMEOUT);
  }

  //Check if days roll over
  if ( day() > previousDay || (day() == 1 && previousDay > 1) ) {
    previousDay = day();
    maxTemp = -127;
    minTemp = 127;
    //TODO: days planted write days planted
  }
}

/////////////////////////
// checkTimers(timelib_t)
//
// checks and calculate new times

void checkTimers(time_t time_now) {

  //Calculate when light goes on
  if ( time_now > light.timeOn) {
    light.timeOff = light.duration + light.timeOn;
    light.timeOn = light.interval + light.timeOn;
    displayChanged = true;
  }

  //Calculate when to run pump
  if ( time_now > pump.timeOn) {
    pump.timeOff = pump.duration + pump.timeOn;
    pump.timeOn = pump.interval + pump.timeOn + EQUIPDELAY;
    displayChanged = true;
  }

  //calculate when to turn fan on
  if ( time_now > aux1.timeOn) {
    aux1.timeOff = aux1.duration  + aux1.timeOn;
    aux1.timeOn = aux1.interval + aux1.timeOn + (EQUIPDELAY * 2);
    displayChanged = true;
  }

  //calculate when to turn aux on
  if ( time_now > aux2.timeOn) {
    aux2.timeOff = aux2.duration + aux2.timeOn;
    aux2.timeOn = aux2.interval + aux2.timeOn + (EQUIPDELAY * 3);
    displayChanged = true;
  }

  //light on and off default to on
  if ( (time_now < light.timeOff && sysMode == 1) || sysMode == 2 || sysMode == 3)  { //turning the light on
    if (!light.isRunning) {
      digitalWrite(light.pin, LOW); //light on
      light.isRunning = true;
    }
  } else {
    if (light.isRunning) {
      digitalWrite(light.pin, HIGH); //light off
      light.isRunning = false;
    }
  }

  //TODO: Pump protection with reservoir level (may add setting for this protectionk

  //pump on and off default to on
  if ( (time_now < pump.timeOff && sysMode == 1) || sysMode == 2 || (pump.isContinuous && sysMode == 1) ) { //turning the pump on
    if (!pump.isRunning) {
      digitalWrite(pump.pin, LOW); //pump on
      pump.isRunning = true;
    }
  } else {
    if (pump.isRunning) {
      digitalWrite(pump.pin, HIGH); //pump off
      pump.isRunning = false;
    }
  }

  //fan on and off
  if ( (time_now < aux1.timeOff && sysMode == 1) || (aux1.isContinuous && sysMode != 0) ) { //turning the pump on
    if (!aux1.isRunning) {
      digitalWrite(aux1.pin, LOW); //pump on
      aux1.isRunning = true;
    }
  } else {
    if (aux1.isRunning) {
      digitalWrite(aux1.pin, HIGH); //pump off
      aux1.isRunning = false;
    }
  }

  //aux on and off
  if ( (time_now < aux2.timeOff && sysMode == 1) || (aux2.isContinuous && sysMode != 0)  ) { //turning the pump on
    if (!aux2.isRunning) {
      digitalWrite(aux2.pin, LOW); //pump on
      aux2.isRunning = true;
    }
  } else {
    if (aux2.isRunning) {
      digitalWrite(aux2.pin, HIGH); //pump off
      aux2.isRunning = false;
    }
  }

  return;
}


/////////////////////////
// readSensors()
//
// Reads sensors and apply a smoothing filter to exclude bad values

void readSensors() {

  if (readLight)
    valuePhotoResistor = analogRead(pinLightSensor);

  if (readReservoir) {
    uint16_t distance = sonar.convert_cm(sonar.ping_median(5));
    valueReservoirDepth = reservoirBottom - distance;
  }

  if (millis() - dht.lastRead() > 2000)
  {
    dht.read();
    valueTemperature = expSmoothing<float>(dht.getTemperature(), valueTemperature);
    valueHumidity = expSmoothing<float>(dht.getHumidity(), valueHumidity);
  }

  //  valueTemperature = expSmoothing<float>(dht.readTemperature(), valueTemperature);
  //  valueHumidity = expSmoothing<float>(dht.readHumidity(), valueHumidity);

  if (valueTemperature > maxTemp)
    maxTemp = valueTemperature;

  if (valueTemperature < minTemp)
    minTemp = valueTemperature;

#ifdef DEBUG
  Serial.println("---Values");
  Serial.println(valuePhotoResistor);
  Serial.println(valueHumidity);
  Serial.println(valueTemperature);
  Serial.println(valueReservoirDepth);
#endif

}


/////////////////////////
// displayInfo()
//
// Updates the display

void displayInfo(int screen) {

  char str[BUFSIZE];
  char str2[BUFSIZE];

  switch (screen) {

    case 1:
      sprintf(str, "Max T: %02d", maxTemp);
      lcd.setCursor(0, 0);
      lcd.print(str);
      lcd.setCursor(0, 1);
      sprintf(str2, "Min T: %02d", minTemp);
      lcd.print(str2);
      break;
    case 2:
      lcd.setCursor(0, 0);
      sprintf(str, "%s: %s", mainMenuNames[2], light.isRunning ? commonString[1] : commonString[0]);
      lcd.print(str);
      lcd.setCursor(11, 0);
      printTime(time_now);
      lcd.setCursor(0, 1);

      if (light.isRunning) {
        printTime(light.timeOn);
        lcd.print('-');
        printTime(light.timeOff);
      } else {
        printTime(light.timeOff);
        lcd.print('-');
        printTime(light.timeOn);
      }
      break;
    case 3:
      lcd.setCursor(0, 0);
      lcd.print(mainMenuNames[3]);
      lcd.print(':');
      lcd.print( pump.isRunning ? commonString[1] : commonString[0]);
      lcd.setCursor(11, 0);
      printTime(time_now);
      lcd.setCursor(0, 1);

      if (pump.isRunning) {
        printTime((pump.timeOn - pump.interval));
        lcd.print('-');
        printTime(pump.timeOff);
      } else {
        printTime(pump.timeOff);
        lcd.print('-');
        printTime(pump.timeOn);
      }
      break;
    case 4:
      lcd.setCursor(0, 0);
      lcd.print(mainMenuNames[4]);
      lcd.print( aux1.isRunning ? commonString[1] : commonString[0]);
      lcd.setCursor(11, 0);
      printTime(time_now);
      lcd.setCursor(0, 1);

      if (aux1.isRunning) {
        printTime(aux1.timeOn - aux1.interval);
        lcd.print('-');
        printTime(aux1.timeOff);
      } else {
        printTime(aux1.timeOff);
        lcd.print('-');
        printTime(aux1.timeOn);
      }
      break;
    case 5:
      lcd.setCursor(0, 0);
      lcd.print(mainMenuNames[5]);
      lcd.print(':');
      lcd.print( aux2.isRunning ? commonString[1] : commonString[0]);
      lcd.setCursor(11, 0);
      printTime(time_now);
      lcd.setCursor(0, 1);
      if (aux2.isRunning) {
        printTime(aux2.timeOn - aux2.interval);
        lcd.print('-');
        printTime(aux2.timeOff);
      } else {
        printTime(aux2.timeOff);
        lcd.print('-');
        printTime(aux2.timeOn);
      }
      break;
    default:
      //print time
      displayScreen = 0;
      lcd.setCursor(0, 0);
      printTime(time_now);

#ifdef DISPLAYRESERVOIR
      if (readReservoir) {
        //print reservoir depth
        lcd.setCursor(6, 0);
        lcd.print(valueReservoirDepth);
        lcd.print(" cm");
      }
#endif

      //Days to Water Change
      int32_t result = (time_water_expires - time_now) / (24 * 60 * 60L);
      sprintf(str, "W% ld", result );
      lcd.setCursor(12, 0);
      lcd.print(str);
      //print temperature
      lcd.setCursor(0, 1);
      dtostrf( valueTemperature, 5, 1, str2 );
      lcd.print(str2);
      lcd.print((char)223);
      //print humidity
      lcd.setCursor(6, 1);
      dtostrf( valueHumidity, 4, 1, str2 );
      lcd.print(str2);
      lcd.print('%');
      //Days to Nutrient Change
      result = (time_nutrient_expires - time_now) / (24 * 60 * 60L);
      sprintf(str, "N% ld", result );
      lcd.setCursor(12, 1);
      lcd.print(str);
      break;
  }
}

/////////////////////////
// printTime(timelib_t)
//
// print Time

void printTime(time_t timestamp)
{
  char str[12];
  sprintf(str, stringFormat[0], hour(timestamp), minute(timestamp) );
  lcd.print(str);
}


/////////////////////////
// resetTimer()
//
// Reset Timers for Equipment

void resetTimer(struct Equipment *equipment) {
  time_now = now();

  tmElements_t tinfo;
  breakTime(time_now, tinfo);

  tinfo.Hour = hour(equipment->timeOn);
  tinfo.Minute = minute(equipment->timeOn);
  tinfo.Second = 00;
  equipment->timeOn = makeTime(tinfo);

  while (equipment->timeOn < time_now) {
    equipment->timeOn += equipment->interval;
  }

  equipment->timeOff = equipment->timeOn + equipment->duration - equipment->interval;

}


/////////////////////////
// resetTimers()
//
// Reset Timers for Light, pump, fan and aux

void resetTimers() {

  resetTimer(&light);
  resetTimer(&pump);
  resetTimer(&aux1);
  resetTimer(&aux2);
}


/////////////////////////
// displayMenu()
//
// Updates the display

void displayMenu() {

  char str1[BUFSIZE];
  char str2[BUFSIZE];
  strcpy(str1, "");
  strcpy(str2, "");

  if (menuValue % 10 == 0) { //Exit
    strcpy(str1, "< Back");
  }
  else if (menuValue < 10) {
    strcpy(str1, mainMenuNames[menuValue]);
    strcat(str1, " >");
  }
  else {

    switch (menuValue) {
      case 11:
        strcpy(str1, "Mode");
        strcpy(str2, modeDescription[sysMode]);
        break;
      case 12: //set hour
        sprintf(str1, stringFormat[3], mainMenuNames[1], commonString[7]);
        sprintf(str2, stringFormat[0], hour(), minute() );
        break;
      case 13: //set minute
        sprintf(str1, stringFormat[3], mainMenuNames[1], commonString[8]);
        sprintf(str2, stringFormat[0], hour(), minute() );
        break;
      case 14: //set intreval increment
        //strcpy (str1, "Interval Increment");
        sprintf (str1, stringFormat[3], commonString[4], commonString[6] );
        sprintf(str2, "%d", intervalIncrement );
        break;
      case 15: //set Durationincrement
        //strcpy (str1, "Duration Increment");
        sprintf (str1, stringFormat[3], commonString[5], commonString[6] );
        sprintf(str2, "%d", durationIncrement );
        break;
      case 21: //timer / continuous
        //strcpy(str1, light.name);
        strcpy(str1, mainMenuNames[2]);
        strcpy(str2, light.isContinuous ? commonString[2] : commonString[3]);
        break;
      case 22: //time on light hour
        //strcpy (str1, "Light On Hrs");
        sprintf (str1, stringFormat[4], mainMenuNames[1], commonString[1], commonString[7] );
        sprintf(str2, stringFormat[0], hour(light.timeOn), minute(light.timeOn) );
        break;
      case 23: //time on light minute
        //strcpy (str1, "Light On Min");
        sprintf (str1, stringFormat[4], mainMenuNames[1], commonString[1], commonString[8] );
        sprintf(str2, stringFormat[0], hour(light.timeOn), minute(light.timeOn) );
        break;
      case 24: //light interval
        //strcpy (str1, "Light Interval");
        sprintf (str1, stringFormat[3], mainMenuNames[2], commonString[4] );
        sprintf(str2, stringFormat[2], light.interval / 3600 , light.interval % 3600 / 60  );
        break;
      case 25: //light duration
        //strcpy (str1, "Light Duration");
        sprintf (str1, stringFormat[3], mainMenuNames[2], commonString[5] );
        sprintf(str2, stringFormat[2], light.duration / 3600 , light.duration % 3600 / 60  );
        break;
      case 31:
        strcpy(str1, mainMenuNames[3]);
        strcpy(str2, pump.isContinuous ? commonString[2] : commonString[3]);
        break;
      case 32:
        //strcpy (str1, "Pump On Hrs");
        sprintf (str1, stringFormat[4], mainMenuNames[3], commonString[1], commonString[7] );
        sprintf(str2, stringFormat[0], hour(pump.timeOn), minute(pump.timeOn) );
        break;
      case 33:
        //strcpy (str1, "Pump On Min");
        sprintf (str1, stringFormat[4], mainMenuNames[3], commonString[1], commonString[8] );
        sprintf(str2, stringFormat[0], hour(pump.timeOn), minute(pump.timeOn) );
        break;
      case 34:
        //strcpy (str1, "Pump Interval");
        sprintf (str1, stringFormat[3], mainMenuNames[3], commonString[4] );
        sprintf(str2, stringFormat[2], pump.interval / 3600 , pump.interval % 3600 / 60  );
        break;
      case 35:
        //strcpy (str1, "Pump Duration");
        sprintf (str1, stringFormat[3], mainMenuNames[3], commonString[5] );
        sprintf(str2, stringFormat[2], pump.duration / 3600 , pump.duration % 3600 / 60  );
        break;
      case 41:
        strcpy(str1, mainMenuNames[4]);
        strcpy(str2, aux1.isContinuous ? commonString[2] : commonString[3]);
        break;
      case 42:
        //strcpy (str1, "Aux1 On Hrs");
        sprintf (str1, stringFormat[4], mainMenuNames[4], commonString[1], commonString[7] );
        sprintf(str2, stringFormat[0], hour(aux1.timeOn), minute(aux1.timeOn) );
        break;
      case 43:
        //strcpy (str1, "Aux1 On Min");
        sprintf (str1, stringFormat[4], mainMenuNames[4], commonString[1], commonString[8] );
        sprintf(str2, stringFormat[0], hour(aux1.timeOn), minute(aux1.timeOn) );
        break;
      case 44:
        //strcpy (str1, "Aux1 Interval");
        sprintf (str1, stringFormat[3], mainMenuNames[4], commonString[4] );
        sprintf(str2, stringFormat[2], aux1.interval / 3600 , aux1.interval % 3600 / 60  );
        break;
      case 45:
        //strcpy (str1, "Aux1 Duration");
        sprintf (str1, stringFormat[3], mainMenuNames[4], commonString[5] );
        sprintf(str2, stringFormat[2], aux1.duration / 3600 , aux1.duration % 3600 / 60  );
        break;
      case 51:
        strcpy(str1, mainMenuNames[5]);
        strcpy(str2, aux2.isContinuous ? commonString[2] : commonString[3]);
        break;
      case 52:
        //strcpy (str1, "Aux2 On Hrs");
        sprintf (str1, stringFormat[4], mainMenuNames[5], commonString[1], commonString[7] );
        sprintf(str2, stringFormat[0], hour(aux2.timeOn), minute(aux2.timeOn) );
        break;
      case 53:
        //strcpy (str1, "Aux2 On Min");
        sprintf (str1, stringFormat[4], mainMenuNames[5], commonString[1], commonString[8] );
        sprintf(str2, stringFormat[0], hour(aux2.timeOn), minute(aux2.timeOn) );
        break;
      case 54:
        //strcpy (str1, "Aux2 Interval");
        sprintf (str1, stringFormat[3], mainMenuNames[5], commonString[4] );
        sprintf(str2, stringFormat[2], aux2.interval / 3600 , aux2.interval % 3600 / 60  );
        break;
      case 55:
        //strcpy (str1, "Aux2 Duration");
        sprintf (str1, stringFormat[3], mainMenuNames[5], commonString[5] );
        sprintf(str2, stringFormat[2], aux2.duration / 3600 , aux2.duration % 3600 / 60  );
        break;
      case 61:
        strcpy (str1, "Save Settings");
        break;
      case 62:
        strcpy(str1, "Reset Water Timer");
        sprintf(str2, "%ld Days", (time_water_expires - time_now) / (24 * 60 * 60L) );
        break;
      case 63:
        strcpy (str1, "Set Water Timer");
        sprintf(str2, stringFormat[1], daysToReplaceWater);
        break;
      case 64:
        strcpy (str1, "Reset Nutr. Timer");
        sprintf(str2, "%ld Days", (time_nutrient_expires - time_now) / (24 * 60 * 60L) );
        break;
      case 65:
        strcpy (str1, "Set Nutr. Timer");
        sprintf(str2, stringFormat[1], daysToReplaceNutrient);
        break;
      case 66:
        strcpy (str1, "Reservoir Btm");
        sprintf(str2, "%u cm", reservoirBottom );
        break;
      case 67: //reservoir offset - not implemented yet
        strcpy (str1, "Res1");
        break;
      case 68: //enable serial communications - not implemented yet
        strcpy (str1, "Res2");
        break;
      case 69:
        strcpy (str1, "Reset Next Reboot");
        sprintf(str2, "%d", defaultValues );
        break;
      default:
        break;
    }
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(str1);
  lcd.setCursor(2, 1);
  lcd.print(str2);

  if (menuValue > 10 && menuValue % 10 != 0) {
    lcd.setCursor(0, 1);
    lcd.print('<');
    lcd.setCursor(15, 1);
    lcd.print('>');
  }

  displayChanged = false;

}


/////////////////////////
// menuButtonPressed()
//
//  process menu button pressed

void menuButtonPressed() {

  displayChanged = true;

  menuValue++;

  if (menuValue < 10) {
    if (menuValue > 6) {
      lcd.clear();
      menuValue = 0;
    }

  }
  else if (menuValue < 20) { // Time
    if (menuValue > 15)
      menuValue = 10;
  }
  else if (menuValue < 30) { //Light
    if (menuValue > 25)
      menuValue = 20;
  }
  else if (menuValue < 40) { //Pump
    if (menuValue > 35)
      menuValue = 30;
  }
  else if (menuValue < 50) { //Aux 1
    if (menuValue > 45)
      menuValue = 40;
  }
  else if (menuValue < 60) { // Aux 2
    if (menuValue > 55)
      menuValue = 50;
  }
  else if (menuValue <= 70) { // Water / Nutrients
    if (menuValue > 69)
      menuValue = 60;
  }
  else {
    lcd.clear();
    menuValue = 0;
  }

  buttonStatus = NONE;
}


/////////////////////////
// void valueButtonPressed(int8_t buttonvalue)
//
//  process value button pressed

void valueButtonPressed(int8_t buttonvalue) {

  displayChanged = true;

  if (menuValue == 0 ) { //change display screen
    displayScreen += (1 * buttonvalue);
    displayChanged = true;
    lcd.clear();
  }
  else if (menuValue < 10) { //change
    menuValue = (menuValue * 10) + 1;
  }
  else if (menuValue % 10 == 0) {
    menuValue = menuValue / 10;
    //lcd.clear();
  }
  else {

    switch (menuValue) {
      case 11:
        sysMode = (sysMode + (1 * buttonvalue)) % 4;
        break;
      case 12: //set hour
        initialt = now();
        initialt = setHour(now(), (1 * buttonvalue));
        setTime(initialt);
        resetTimers();
        break;
      case 13: //set minute
        initialt = setMinute(now(), (1 * buttonvalue));
        setTime(initialt);
        resetTimers();
        break;
      case 14: //set interval increment
        intervalIncrement += (1 * buttonvalue);
        if (intervalIncrement <= 1) {
          intervalIncrement = 1;
        }
        break;
      case 15: //set duration increment
        durationIncrement += (1 * buttonvalue);
        if (durationIncrement <= 1) {
          durationIncrement = 1;
        }
        break;
      case 21: //timer / continuous
        light.isContinuous = !light.isContinuous;
        break;
      case 22:
        light.timeOn = setHour(light.timeOn, (1 * buttonvalue));
        resetTimers();
        break;
      case 23:
        light.timeOn = setMinute(light.timeOn, (1 * buttonvalue));
        resetTimers();
        break;
      case 24:
        light.interval += (intervalIncrement * 60UL * buttonvalue); //add minutes for light duration
        resetTimers();
        break;
      case 25:
        light.duration += (durationIncrement * 60UL * buttonvalue); //add minutes for light duration
        resetTimers();
        break;
      case 31:
        pump.isContinuous = !pump.isContinuous;
        break;
      case 32:
        pump.timeOn = setHour(pump.timeOn, (1 * buttonvalue));
        resetTimers();
        break;
      case 33:
        pump.timeOn = setMinute(pump.timeOn, (1 * buttonvalue));
        resetTimers();
        break;
      case 34:
        pump.interval += (intervalIncrement * 60UL * buttonvalue); //add 15 minutes
        resetTimers();
        break;
      case 35:
        pump.duration += (durationIncrement * 60UL * buttonvalue); //add 15 minutes
        resetTimers();
        break;
      case 41:
        aux1.isContinuous = !aux1.isContinuous;
        break;
      case 42:
        aux1.timeOn = setHour(aux1.timeOn, (1 * buttonvalue));
        resetTimers();
        break;
      case 43:
        aux1.timeOn = setMinute(aux1.timeOn, (1 * buttonvalue));
        resetTimers();
        break;
      case 44:
        aux1.interval += (intervalIncrement * 60UL * buttonvalue); //add 15 minutes
        resetTimers();
        break;
      case 45:
        aux1.duration += (durationIncrement * 60UL * buttonvalue); //add 15 minutes
        resetTimers();
        break;
      case 51:
        aux2.isContinuous = !aux2.isContinuous;
        break;
      case 52:
        aux2.timeOn = setHour(aux2.timeOn, (1 * buttonvalue));
        resetTimers();
        break;
      case 53:
        aux2.timeOn = setMinute(aux2.timeOn, (1 * buttonvalue));
        resetTimers();
        break;
      case 54:
        aux2.interval += (intervalIncrement * 60UL * buttonvalue); //add 15 minutes
        resetTimers();
        break;
      case 55:
        aux2.duration += (durationIncrement * 60UL * buttonvalue); //add 15 minutes
        resetTimers();
        break;
      case 61:
        lcd.clear();
        lcd.print("Writing Settings...");
        writeSettings();
        menuValue = 0;
        delay(2000);
        lcd.clear();
        break;
      case 62:
        time_water_expires = now() + (daysToReplaceWater * 24 * 60 * 60UL);
        break;
      case 63:
        if (daysToReplaceWater > 365) {
          daysToReplaceWater = 365;
        } else {
          daysToReplaceWater += (1 * buttonvalue);
          time_water_expires += (24 * 60 * 60UL * buttonvalue);
        }
        break;
      case 64:
        time_nutrient_expires = now() + (daysToReplaceNutrient * 24 * 60 * 60UL);
        break;
      case 65:
        if (daysToReplaceNutrient > 365) {
          daysToReplaceNutrient = 365;
        } else {
          daysToReplaceNutrient += (1 * buttonvalue);
          time_nutrient_expires += (24 * 60 * 60UL * buttonvalue);
        }
        break;
      case 66:
        if (reservoirBottom >= 400) {
          reservoirBottom = 400;
        } else {
          reservoirBottom += (1 * buttonvalue);
        }
        break;
      case 67: //reservoir offset - not implemented yet
        break;
      case 68: //enable serial communications - not implemented yet
        break;
      case 69:
        defaultValues = !defaultValues;
        break;
      default:
        displayScreen += (1 * buttonvalue);
        displayChanged = true;
        lcd.clear();
        break;
    }
  }

  buttonStatus = NONE;
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
// time_t setHour ( time_t timestamp, uint16_t value)
//
//  increase or decrease hour by value

time_t setHour(time_t timestamp, uint8_t value) {

  tmElements_t tinfo;
  uint8_t newHour;

  breakTime(now(), tinfo);
  newHour = hour(timestamp) + value;

  if (newHour > 23 || newHour <= 0) {
    newHour = 0;
  }

  tinfo.Hour = newHour;
  tinfo.Minute = minute(timestamp);
  timestamp = makeTime(tinfo);

  return timestamp;
}

/////////////////////////
// time_t setMinute ( time_t timestamp, uint8_t value)
//
//  increase or decrease minutes by value

time_t setMinute(time_t timestamp, uint8_t value) {

  tmElements_t tinfo;
  uint8_t newMinute;

  breakTime(now(), tinfo);
  newMinute = minute(timestamp) + value;

  if (newMinute > 59 || newMinute <= 0) {
    newMinute = 0;
  }

  tinfo.Minute = newMinute;
  tinfo.Hour = hour(timestamp);
  timestamp = makeTime(tinfo);

  return timestamp;
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
// 11 - Add time to current light cycle (temporary changes the light.timeOff) - used to change when the light/pump start in the day
// 12 - Subtract time from current light cycle

void receiveEvent(int bytesReceived) {

#ifdef DEBUG
  Serial.println("[Receive Event]");
#endif

  int value = 0;

  while (Wire.available()) {
    value = Wire.read();

    if (bytesReceived > 0) {
#ifdef DEBUG
      Serial.print("data received: ");
      Serial.println(bytesReceived);
#endif
    }

  }
  switch (value) {
    case 5:
      light.duration += (15UL * 60); //add 15 minutes for light duration
      break;
    case 6:
      light.duration -= (15UL * 60); //add -15 minutes for light duration
      break;
    case 7:
      pump.interval += (PUMPINTERVALINCREMENT * 60); //add 5 minutes for pump cycle
      break;
    case 8:
      pump.interval -= (PUMPINTERVALINCREMENT * 60); //subtract 5 minutes for pump cycle
      break;
    case 9:
      pump.duration += (PUMPDURATIONINCREMENT * 60); //add 1 minutes for pump duration
      break;
    case 10:
      pump.duration -= (PUMPDURATIONINCREMENT * 60); //sub 1 minutes for pump duration
      break;
    case 11:
      light.timeOff += (15UL * 60); //add 15 minutes for light off at - used to start cycle later in the day
      light.timeOn += (15UL * 60);
#ifdef DEBUG
      Serial.println("Light cycle +15 mins");
#endif
      break;
    case 12:
      if ( (light.timeOn - (15UL * 60) ) > millis() ) { //do not allow lights on to become less than the current time - could break
        light.timeOff -= (15UL * 60); //sub 15 minutes for light off at - used to start cycle earlier in the day
        light.timeOn -= (15UL * 60);
#ifdef DEBUG
        Serial.println("Light cycle -15 mins");
#endif
      }
      break;

    default:
      sysMode = value + 1;
  }
}


/////////////////////////
// requestEvent()
//
// function that executes whenever data is requested by master
// this function is registered as an event, see setup()

void requestEvent() {
  //TODO add the pump status, light status and mode

  //int sysmode;
  char buffer_out[BUFSIZE]; //max buffer size is 32 bytes

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

  if (serialCommunications) {
    unsigned long secondsToLightOff = (light.timeOff - time_now);
    //buffer
    sprintf(buffer_out, "%d %d.%d %d.%d %d %d %d %lu", valuePhotoResistor, valTemp / 100, valTemp % 100, valHum / 10, valHum % 10, sysMode, light.isRunning, pump.isRunning, secondsToLightOff);

  } else {
    //compose custom buffer output - buffer size for wire library is 32 bytes/characters, customize this for application
    intToCharBuffer(buffer_out, 0, valuePhotoResistor);
    intToCharBuffer(buffer_out, 2, valTemp);
    intToCharBuffer(buffer_out, 4, valHum);

    //TODO: change to unix timestamp on light
    if (light.isRunning) {
      unsigned int minutesToLightOff = (light.timeOff - time_now) / 60UL;
      //longToCharBuffer(buffer_out, 6, (light.timeOff - time_now) );
      intToCharBuffer(buffer_out, 6, minutesToLightOff);
    } else {
      unsigned int minutesToLightOn = (light.timeOn - time_now) / 60UL;
      intToCharBuffer(buffer_out, 6, minutesToLightOn );
    }

    intToCharBuffer(buffer_out, 8, light.duration / 60);
    intToCharBuffer(buffer_out, 10, pump.interval / 60);
    intToCharBuffer(buffer_out, 12, pump.duration / 60);
    buffer_out[14] = sysMode;
    buffer_out[15] = light.isRunning;
    buffer_out[16] = pump.isRunning;
    intToCharBuffer(buffer_out, 17, valueReservoirDepth);
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
// readSettings()
//
//  read settings from eeprom

void readSettings() {

  int EEAddr = EEADDR;
  EEPROM.get(EEAddr, defaultValues); EEAddr += sizeof(defaultValues);

  if (defaultValues) {
    defaultValues = false;
    EEPROM.get(EEAddr, light); EEAddr += sizeof(light);
    EEPROM.get(EEAddr, pump); EEAddr += sizeof(pump);
    EEPROM.get(EEAddr, aux1); EEAddr += sizeof(aux1);
    EEPROM.get(EEAddr, aux1); EEAddr += sizeof(aux2);
    EEPROM.get(EEAddr, daysToReplaceWater); EEAddr += sizeof(daysToReplaceWater);
    EEPROM.get(EEAddr, daysToReplaceNutrient); EEAddr += sizeof(daysToReplaceNutrient);
    EEPROM.get(EEAddr, reservoirBottom); EEAddr += sizeof(reservoirBottom);
  }
}


/////////////////////////
// writeSettings()
//
//  write settings from eeprom

void writeSettings() {

  int EEAddr = EEADDR;
  EEPROM.put(EEAddr, defaultValues); EEAddr += sizeof(defaultValues);
  EEPROM.put(EEAddr, light); EEAddr += sizeof(light);
  EEPROM.put(EEAddr, pump); EEAddr += sizeof(pump);
  EEPROM.put(EEAddr, aux1); EEAddr += sizeof(aux1);
  EEPROM.put(EEAddr, aux2); EEAddr += sizeof(aux2);
  EEPROM.put(EEAddr, daysToReplaceWater); EEAddr += sizeof(daysToReplaceWater);
  EEPROM.put(EEAddr, daysToReplaceNutrient); EEAddr += sizeof(daysToReplaceNutrient);
  EEPROM.put(EEAddr, reservoirBottom); EEAddr += sizeof(reservoirBottom);
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
