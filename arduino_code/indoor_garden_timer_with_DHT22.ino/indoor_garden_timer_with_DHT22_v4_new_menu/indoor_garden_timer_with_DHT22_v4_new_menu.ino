/*
  Author: Jason De Boer


*/
#include "indoor_garden_timer_with_DHT22.h"

//Timelibrary
time_t initialt, time_water_expires, time_nutrient_expires, menuDelay;
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
  uint8_t mode; //0 - Off, 1 - Timer, 2 - Continuous, 3 - Manual
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
//boolean defaultValues = false;

//Commonly used strings
const char* modeDescription[4] = {"Off", "Auto", "Manual Pump", "Manual Light"};
const char* mainMenuNames[7] = {"", "Time", "Light", "Pump", "Aux1", "Aux2", "Other"};
const char* commonString[10] = {"Off", "On", "Continuous", "Timer", "Interval", "Duration", "Increment", "Hour", "Minutes", "Manual"};
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
uint8_t displayScreen = 0;


/////////////////////////
// setup()
//
// runs once before loop();

void setup() {

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Init...");

  

#ifndef DEBUG
  readSettings();//Read EEPROM
#endif

  light.pin = LIGHTPIN;
  pump.pin = PUMPPIN;
  aux1.pin = AUXONEPIN;
  aux2.pin = AUXTWOPIN;
  light.isRunning = false;
  pump.isRunning = false;
  aux1.isRunning = false;
  aux2.isRunning = false;

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

  //pinMode(LED_BUILTIN, OUTPUT);

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

  //Set timers for water and nutrient timer
  menuDelay = now();
  time_water_expires = now() + (daysToReplaceWater * 24 * 60 * 60L);
  time_nutrient_expires = now() + (daysToReplaceNutrient * 24 * 60 * 60L);

  resetTimers();

#ifdef DEBUG
  Serial.begin(57600);
  //Serial.begin(9600);
#endif

  lcd.clear();
  displayChanged = true;

  attachPinChangeInterrupt(digitalPinToPinChangeInterrupt(buttonMenu), menu_ISR, FALLING); //UNO has only pin 2 and 3 for default interrupt, so needing alternate library to make this happen
  attachPinChangeInterrupt(digitalPinToPinChangeInterrupt(buttonUp), up_ISR, FALLING);
  attachPinChangeInterrupt(digitalPinToPinChangeInterrupt(buttonDown), down_ISR, FALLING);

wdt_enable(WDTO_8S); //enable watchdog timer with 8 seconds

}


/////////////////////////
// loop()
//
// Main loop that runs after setup()

void loop() {

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
    menuDelay = now() + MENUDELAY;
  }

  //if (menuItem == STATUS) {
  if (menuValue == 0) {
    if (now() > menuDelay) {
      displayChanged = true;
      menuDelay = now() + MENUDELAY; //Menu delay on screen update
    }

    if (displayChanged) {
      displayInfo(displayScreen);
    }

    //digitalWrite(LED_BUILTIN, HIGH);
    //delay(DELAY); //this is to save power
    readSensors();
    checkTimers(now());
    //digitalWrite(LED_BUILTIN, LOW);
    //status.statusInternalLed = !status.statusInternalLed;
    //digitalWrite(LED_BUILTIN, status.statusInternalLed ? HIGH : LOW);

  } else {

    if (displayChanged) {
      displayMenu();
    }

    if (now() > menuDelay) {
      //menuItem = STATUS;
      menuValue = 0;
      lcd.clear();
      displayChanged = true;
      displayInfo(displayScreen);
    }
    delay(BUTTONTIMEOUT);
  }

  wdt_reset();

  //Check if days roll over
  if ( day() > previousDay || (day() == 1 && previousDay > 1) ) {
    previousDay = day();
    maxTemp = -127;
    minTemp = 127;
    displayScreen = 0;
    displayChanged = true;
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
  if ( (time_now < light.timeOff && sysMode == 1 && light.mode == 1 ) || sysMode == 2 || sysMode == 3 || (light.mode > 1 && sysMode == 1))  { //turning the light on
    if (!light.isRunning) {
      lcd.noBacklight();
      lcd.noDisplay();
      digitalWrite(light.pin, LOW); //light on
      light.isRunning = true;
      delay(1500);
      lcd.display();
      lcd.backlight();
      lcd.clear();
    }
  } else {
    if (light.isRunning) {
      digitalWrite(light.pin, HIGH); //light off
      light.isRunning = false;
      lcd.clear();
    }
  }
   wdt_reset();

  //TODO: Pump protection with reservoir level (may add setting for this protectionk

  //pump on and off default to on
  if ( (time_now < pump.timeOff && sysMode == 1 && pump.mode == 1 ) || sysMode == 2 || (pump.mode > 1 && sysMode == 1) ) { //turning the pump on
    if (!pump.isRunning) {
      lcd.noBacklight();
      lcd.noDisplay();
      digitalWrite(pump.pin, LOW); //pump on
      pump.isRunning = true;
      delay(1500);
      lcd.display();
      lcd.backlight();
      lcd.clear();
    }
  } else {
    if (pump.isRunning) {
      digitalWrite(pump.pin, HIGH); //pump off
      pump.isRunning = false;
      lcd.clear();
    }
  }
   wdt_reset();

  //fan on and off
  if ( (time_now < aux1.timeOff && sysMode == 1 && aux1.mode == 1 ) || (aux1.mode > 1 && sysMode == 1) ) { //turning the pump on
    if (!aux1.isRunning) {
      lcd.noBacklight();
      lcd.noDisplay();
      digitalWrite(aux1.pin, LOW); //pump on
      aux1.isRunning = true;
      delay(1500);
      lcd.display();
      lcd.backlight();
      lcd.clear();
    }
  } else {
    if (aux1.isRunning) {
      digitalWrite(aux1.pin, HIGH); //pump off
      aux1.isRunning = false;
      lcd.clear();
    }
  }
   wdt_reset();

  //aux on and off
  if ( (time_now < aux2.timeOff && sysMode == 1 && aux2.mode == 1 ) || (aux2.mode > 1 && sysMode == 1)  ) { //turning the pump on
    if (!aux2.isRunning) {
      lcd.noBacklight();
      lcd.noDisplay();
      digitalWrite(aux2.pin, LOW); //pump on
      aux2.isRunning = true;
      delay(1500);
      lcd.display();
      lcd.backlight();
      lcd.clear();
    }
  } else {
    if (aux2.isRunning) {
      digitalWrite(aux2.pin, HIGH); //pump off
      aux2.isRunning = false;
      lcd.clear();
    }
  }
   wdt_reset();

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
  //delay(2000);

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

  strncpy(str, "", BUFSIZE);
  strncpy(str2, "", BUFSIZE);

  switch (screen) {

    case 1:
      snprintf(str, BUFSIZE, "Max T: %02d", maxTemp);
      lcd.setCursor(0, 0);
      lcd.print(str);
      lcd.setCursor(0, 1);
      snprintf(str2, BUFSIZE, "Min T: %02d", minTemp);
      lcd.print(str2);
      break;
    case 2:
      printEquipmentStatus(&light, mainMenuNames[2]);
      break;
    case 3:
      printEquipmentStatus(&pump, mainMenuNames[3]);
      break;
    case 4:
      printEquipmentStatus(&aux1, mainMenuNames[4]);
      break;
    case 5:
      printEquipmentStatus(&aux2, mainMenuNames[5]);
      break;

    //    case 6:
    //      lcd.setCursor(0, 0);
    //      lcd.print(light.pin);
    //      lcd.print(':');
    //      lcd.print(pump.pin);
    //      lcd.print(':');
    //      lcd.print(aux1.pin);
    //      lcd.print(':');
    //      lcd.print(aux2.pin);
    //      lcd.setCursor(0, 1);
    //      lcd.print(now());
    //      break;

    //          case 7:
    //      lcd.setCursor(0, 0);
    //      lcd.print(light.timeOn);
    //       lcd.setCursor(0, 1);
    //      lcd.print(light.timeOff);
    //
    //      break;
    //      case 8:
    //      lcd.setCursor(0, 0);
    //      lcd.print(pump.timeOn);
    //       lcd.setCursor(0, 1);
    //      lcd.print(pump.timeOff);
    //
    //      break;
    //      case 9:
    //      lcd.setCursor(0, 0);
    //      lcd.print(aux1.timeOn);
    //       lcd.setCursor(0, 1);
    //      lcd.print(aux1.timeOff);
    //
    //      break;
    //            case 10:
    //      lcd.setCursor(0, 0);
    //      lcd.print(light.duration);
    //       lcd.setCursor(0, 1);
    //      lcd.print(light.interval);
    //      break;
    //                  case 11:
    //      lcd.setCursor(0, 0);
    //      lcd.print(pump.duration);
    //       lcd.setCursor(0, 1);
    //      lcd.print(pump.interval);
    //      break;
    //                  case 12:
    //      lcd.setCursor(0, 0);
    //      lcd.print(aux1.duration);
    //       lcd.setCursor(0, 1);
    //      lcd.print(aux1.interval);
    //      break;

    default:
      //print time
      displayScreen = 0;
      lcd.setCursor(0, 0);
      printTime(now());

#ifdef DISPLAYRESERVOIR
      if (readReservoir) {
        //print reservoir depth
        lcd.setCursor(6, 0);
        lcd.print(valueReservoirDepth);
        lcd.print(" cm");
      }
#endif

      //Days to Water Change
      int32_t result = (time_water_expires - now()) / (24 * 60 * 60L);
      snprintf(str, BUFSIZE, "W% ld", result );
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
      result = (time_nutrient_expires - now()) / (24 * 60 * 60L);
      snprintf(str, BUFSIZE, "N% ld", result );
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
  snprintf(str, BUFSIZE, stringFormat[0], hour(timestamp), minute(timestamp) );
  lcd.print(str);
}

/////////////////////////
// printEquipmentStatus(Equipment* equipment)
//
// print Equipment

void printEquipmentStatus(Equipment* equipment, const char* nameString)
{
  lcd.setCursor(0, 0);
  lcd.print(nameString);
  lcd.print(':');
  lcd.print( equipment->isRunning ? commonString[1] : commonString[0]);
  lcd.setCursor(11, 0);
  printTime(now());
  lcd.setCursor(0, 1);

  if (equipment->isRunning) {
    printTime(equipment->timeOn);
    lcd.print('-');
    printTime(equipment->timeOff);
  } else {
    printTime(equipment->timeOff);
    lcd.print('-');
    printTime(equipment->timeOn);
  }

  lcd.setCursor(13, 1);
  lcd.print(getEquipmentMode(equipment));
}

/////////////////////////
// resetTimer()
//
// Reset Timers for Equipment

void resetTimer(struct Equipment *equipment) {

  tmElements_t tinfo;
  breakTime(now(), tinfo);

  tinfo.Hour = hour(equipment->timeOn);
  tinfo.Minute = minute(equipment->timeOn);
  tinfo.Second = 00;
  equipment->timeOn = makeTime(tinfo);

  while (equipment->timeOn < now()) {
    equipment->timeOn += equipment->interval;
  }

  equipment->timeOff = equipment->timeOn + equipment->duration - equipment->interval;


  //possibly turn off relay
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
  strncpy(str1, "", BUFSIZE);
  strncpy(str2, "", BUFSIZE);

  if (menuValue % 10 == 0) { //Exit
    strncpy(str1, "< Back", BUFSIZE);
  }
  else if (menuValue < 10) {
    strncpy(str1, mainMenuNames[menuValue], BUFSIZE);
    strncat(str1, " >", BUFSIZE);
  }
  else {

    switch (menuValue) {
      case 11:
        strncpy(str1, "Mode", BUFSIZE);
        strncpy(str2, modeDescription[sysMode], BUFSIZE);
        break;
      case 12: //set hour
        snprintf(str1, BUFSIZE, stringFormat[3], mainMenuNames[1], commonString[7]);
        snprintf(str2, BUFSIZE, stringFormat[0], hour(), minute() );
        break;
      case 13: //set minute
        snprintf(str1, BUFSIZE, stringFormat[3], mainMenuNames[1], commonString[8]);
        snprintf(str2, BUFSIZE, stringFormat[0], hour(), minute() );
        break;
      case 14: //set intreval increment
        snprintf(str1, BUFSIZE, stringFormat[3], commonString[4], commonString[6] );
        snprintf(str2, BUFSIZE, "%d", intervalIncrement );
        break;
      case 15: //set Durationincrement
        snprintf(str1, BUFSIZE, stringFormat[3], commonString[5], commonString[6] );
        snprintf(str2, BUFSIZE, "%d", durationIncrement );
        break;
      case 21: //timer / continuous
        strncpy(str1, mainMenuNames[2], BUFSIZE);
        strncpy(str2, getEquipmentMode(&light), BUFSIZE);
        break;
      case 22: //time on light hour
        snprintf(str1, BUFSIZE, stringFormat[4], mainMenuNames[1], commonString[1], commonString[7] );
        snprintf(str2, BUFSIZE, stringFormat[0], hour(light.timeOn), minute(light.timeOn) );
        break;
      case 23: //time on light minute
        snprintf(str1, BUFSIZE, stringFormat[4], mainMenuNames[1], commonString[1], commonString[8] );
        snprintf(str2, BUFSIZE, stringFormat[0], hour(light.timeOn), minute(light.timeOn) );
        break;
      case 24: //light interval
        snprintf(str1, BUFSIZE, stringFormat[3], mainMenuNames[2], commonString[4] );
        snprintf(str2, BUFSIZE, stringFormat[2], light.interval / 3600 , light.interval % 3600 / 60  );
        break;
      case 25: //light duration
        snprintf(str1, BUFSIZE, stringFormat[3], mainMenuNames[2], commonString[5] );
        snprintf(str2, BUFSIZE, stringFormat[2], light.duration / 3600 , light.duration % 3600 / 60  );
        break;
      case 31:
        strncpy(str1, mainMenuNames[3], BUFSIZE);
        strncpy(str2, getEquipmentMode(&pump), BUFSIZE);
        break;
      case 32:
        snprintf(str1, BUFSIZE, stringFormat[4], mainMenuNames[3], commonString[1], commonString[7] );
        snprintf(str2, BUFSIZE, stringFormat[0], hour(pump.timeOn), minute(pump.timeOn) );
        break;
      case 33:
        snprintf(str1, BUFSIZE, stringFormat[4], mainMenuNames[3], commonString[1], commonString[8] );
        snprintf(str2, BUFSIZE, stringFormat[0], hour(pump.timeOn), minute(pump.timeOn) );
        break;
      case 34:
        snprintf(str1, BUFSIZE, stringFormat[3], mainMenuNames[3], commonString[4] );
        snprintf(str2, BUFSIZE, stringFormat[2], pump.interval / 3600 , pump.interval % 3600 / 60  );
        break;
      case 35:
        snprintf(str1, BUFSIZE, stringFormat[3], mainMenuNames[3], commonString[5] );
        snprintf(str2, BUFSIZE, stringFormat[2], pump.duration / 3600 , pump.duration % 3600 / 60  );
        break;
      case 41:
        strncpy(str1, mainMenuNames[4], BUFSIZE);
        strncpy(str2, getEquipmentMode(&aux1), BUFSIZE);
        break;
      case 42:
        snprintf(str1, BUFSIZE, stringFormat[4], mainMenuNames[4], commonString[1], commonString[7] );
        snprintf(str2, BUFSIZE, stringFormat[0], hour(aux1.timeOn), minute(aux1.timeOn) );
        break;
      case 43:
        snprintf(str1, BUFSIZE, stringFormat[4], mainMenuNames[4], commonString[1], commonString[8] );
        snprintf(str2, BUFSIZE, stringFormat[0], hour(aux1.timeOn), minute(aux1.timeOn) );
        break;
      case 44:
        snprintf(str1, BUFSIZE, stringFormat[3], mainMenuNames[4], commonString[4] );
        snprintf(str2, BUFSIZE, stringFormat[2], aux1.interval / 3600 , aux1.interval % 3600 / 60  );
        break;
      case 45:
        snprintf(str1, BUFSIZE, stringFormat[3], mainMenuNames[4], commonString[5] );
        snprintf(str2, BUFSIZE, stringFormat[2], aux1.duration / 3600 , aux1.duration % 3600 / 60  );
        break;
      case 51:
        strncpy(str1, mainMenuNames[5], BUFSIZE);
        strncpy(str2, getEquipmentMode(&aux2), BUFSIZE);
        break;
      case 52:
        snprintf(str1, BUFSIZE, stringFormat[4], mainMenuNames[5], commonString[1], commonString[7] );
        snprintf(str2, BUFSIZE, stringFormat[0], hour(aux2.timeOn), minute(aux2.timeOn) );
        break;
      case 53:
        snprintf(str1, BUFSIZE, stringFormat[4], mainMenuNames[5], commonString[1], commonString[8] );
        snprintf(str2, BUFSIZE, stringFormat[0], hour(aux2.timeOn), minute(aux2.timeOn) );
        break;
      case 54:
        snprintf(str1, BUFSIZE, stringFormat[3], mainMenuNames[5], commonString[4] );
        snprintf(str2, BUFSIZE, stringFormat[2], aux2.interval / 3600 , aux2.interval % 3600 / 60  );
        break;
      case 55:
        snprintf(str1, BUFSIZE, stringFormat[3], mainMenuNames[5], commonString[5] );
        snprintf(str2, BUFSIZE, stringFormat[2], aux2.duration / 3600 , aux2.duration % 3600 / 60  );
        break;
      case 61:
        strncpy (str1, "Save Settings", BUFSIZE);
        break;
      case 62:
        strncpy(str1, "Reset Water Timer", BUFSIZE);
        snprintf(str2, BUFSIZE, "%ld Days", (time_water_expires - now()) / (24 * 60 * 60L) );
        break;
      case 63:
        strncpy (str1, "Set Water Timer", BUFSIZE);
        snprintf(str2, BUFSIZE, stringFormat[1], daysToReplaceWater);
        break;
      case 64:
        strncpy (str1, "Reset Nutr. Timer", BUFSIZE);
        snprintf(str2, BUFSIZE, "%ld Days", (time_nutrient_expires - now()) / (24 * 60 * 60L) );
        break;
      case 65:
        strncpy (str1, "Set Nutr. Timer", BUFSIZE);
        snprintf(str2, BUFSIZE, stringFormat[1], daysToReplaceNutrient);
        break;
      case 66:
        strncpy (str1, "Reservoir Btm", BUFSIZE);
        snprintf(str2, BUFSIZE, "%u cm", reservoirBottom );
        break;
      case 67: //reservoir offset - not implemented yet
        strncpy (str1, "Read Reservoir", BUFSIZE);
        strncpy(str2, readReservoir ? commonString[1] : commonString[0], BUFSIZE);
        break;
      case 68: //enable serial communications - not implemented yet
        strncpy (str1, "Serial Comms", BUFSIZE);
        strncpy(str2, serialCommunications ? commonString[1] : commonString[0], BUFSIZE);
        break;
      case 69:
        strncpy (str1, "Set Defaults", BUFSIZE);
        //snprintf(str2, BUFSIZE, "%d", defaultValues );
        //strncpy(str2, defaultValues ? commonString[1] : commonString[0], BUFSIZE);
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
    if (buttonvalue > 0) {
      displayScreen++;
      displayChanged = true;
      lcd.clear();
    }
    else {
      switch (displayScreen) {

        case 2:
          light.mode = ++light.mode % 4;
          break;
        case 3:
          pump.mode = ++pump.mode % 4;
          break;
        case 4:
          aux1.mode = ++aux1.mode % 4;
          break;
        case 5:
          aux2.mode = ++aux2.mode % 4;
          break;
        default:
          break;
      }
    }

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
        light.mode = ++light.mode % 4;
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
        pump.mode = ++pump.mode % 4;
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
        aux1.mode = ++aux1.mode % 4;
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
        aux2.mode = ++aux2.mode % 4;
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
        lcd.print("Saving");
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
        if (reservoirBottom > 400) {
          reservoirBottom = 400;
        } else {
          reservoirBottom += (1 * buttonvalue);
        }
        break;
      case 67: //read reservoir
        readReservoir = !readReservoir;
        break;
      case 68: //enable serial communications - not implemented yet
        serialCommunications = !serialCommunications;
        break;
      case 69:
      lcd.clear();
        lcd.print("Reset");
        setDefaults();
        menuValue = 0;
        delay(2000);
        lcd.clear();
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
// const char* getEquipmentMode(Equipment *equipment)
//
//

const char* getEquipmentMode(Equipment *equipment) {

  const char* st;

  switch (equipment->mode) {
    case 1:
      st = commonString[3];
      break;
    case 2:
      st = commonString[2];
      break;
    case 3:
      st = commonString[9];
      break;
    default:
      st = commonString[0];
      break;
  }

  return st;
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
// void setDefaultTimes()
//
// 

void setDefaults() {
  //light.name = NAMELIGHT;
  light.duration = 54000;
  light.interval = 86400;
  light.timeOn = 5;
  light.timeOff = 0;
  light.mode = 1;

  //pump.name = NAMEPUMP;
#ifdef PUMPLARGEVALUES
  pump.duration = 54000;
  pump.interval = 86400;
#else
  pump.duration = 0;
  pump.interval = 3600;
#endif
  pump.timeOn = 5;
  pump.timeOff = 0;
  pump.mode = 1;

  //aux1.name = NAMEAUXONE;
#ifdef AUXONELARGEVALUES
  aux1.duration = 54000;
  aux1.interval = 86400;
#else
  aux1.duration = 0;
  aux1.interval = 3600;
#endif
  aux1.timeOn = 5;
  aux1.timeOff = 0;
  aux1.mode = 1;

  //aux2.name = NAMEAUXTWO;
#ifdef AUXTWOLARGEVALUES
  aux2.duration = 54000;
  aux2.interval = 86400;
#else
  aux2.duration = 10;
  aux2.interval = 3600;
#endif
  aux2.timeOn = 5;
  aux2.timeOff = 0;
  aux2.mode = 1;

  readReservoir = false;
  reservoirBottom = 40;

  daysToReplaceWater = 21;
  daysToReplaceNutrient = 21;
  time_water_expires = now() + (daysToReplaceWater * 24 * 60 * 60L);
  time_nutrient_expires = now() + (daysToReplaceNutrient * 24 * 60 * 60L);
  
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
    unsigned long secondsToLightOff = (light.timeOff - now());
    //buffer
    snprintf(buffer_out, BUFSIZE, "%d %d.%d %d.%d %d %d %d %lu", valuePhotoResistor, valTemp / 100, valTemp % 100, valHum / 10, valHum % 10, sysMode, light.isRunning, pump.isRunning, secondsToLightOff);

  } else {
    //compose custom buffer output - buffer size for wire library is 32 bytes/characters, customize this for application
    intToCharBuffer(buffer_out, 0, valuePhotoResistor);
    intToCharBuffer(buffer_out, 2, valTemp);
    intToCharBuffer(buffer_out, 4, valHum);

    //TODO: change to unix timestamp on light
    if (light.isRunning) {
      unsigned int minutesToLightOff = (light.timeOff - now()) / 60UL;
      //longToCharBuffer(buffer_out, 6, (light.timeOff - now()) );
      intToCharBuffer(buffer_out, 6, minutesToLightOff);
    } else {
      unsigned int minutesToLightOn = (light.timeOn - now()) / 60UL;
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
  //EEPROM.get(EEAddr, defaultValues); EEAddr += sizeof(defaultValues);

  //if (defaultValues) {
    //defaultValues = false;
    EEPROM.get(EEAddr, light.timeOn); EEAddr += sizeof(light.timeOn);
    EEPROM.get(EEAddr, light.duration); EEAddr += sizeof(light.duration);
    EEPROM.get(EEAddr, light.interval); EEAddr += sizeof(light.interval);
    EEPROM.get(EEAddr, light.mode); EEAddr += sizeof(light.mode);

    EEPROM.get(EEAddr, pump.timeOn); EEAddr += sizeof(pump.timeOn);
    EEPROM.get(EEAddr, pump.duration); EEAddr += sizeof(pump.duration);
    EEPROM.get(EEAddr, pump.interval); EEAddr += sizeof(pump.interval);
    EEPROM.get(EEAddr, pump.mode); EEAddr += sizeof(pump.mode);

    EEPROM.get(EEAddr, aux1.timeOn); EEAddr += sizeof(aux1.timeOn);
    EEPROM.get(EEAddr, aux1.duration); EEAddr += sizeof(aux1.duration);
    EEPROM.get(EEAddr, aux1.interval); EEAddr += sizeof(aux1.interval);
    EEPROM.get(EEAddr, aux1.mode); EEAddr += sizeof(aux1.mode);

    EEPROM.get(EEAddr, aux2.timeOn); EEAddr += sizeof(aux2.timeOn);
    EEPROM.get(EEAddr, aux2.duration); EEAddr += sizeof(aux2.duration);
    EEPROM.get(EEAddr, aux2.interval); EEAddr += sizeof(aux2.interval);
    EEPROM.get(EEAddr, aux2.mode); EEAddr += sizeof(aux2.mode);

    EEPROM.get(EEAddr, daysToReplaceWater); EEAddr += sizeof(daysToReplaceWater);
    EEPROM.get(EEAddr, daysToReplaceNutrient); EEAddr += sizeof(daysToReplaceNutrient);
    EEPROM.get(EEAddr, reservoirBottom); EEAddr += sizeof(reservoirBottom);
    EEPROM.get(EEAddr, readReservoir); EEAddr += sizeof(readReservoir);
    EEPROM.get(EEAddr, serialCommunications); EEAddr += sizeof(serialCommunications);
  //}
}


/////////////////////////
// writeSettings()
//
//  write settings from eeprom

void writeSettings() {

  int EEAddr = EEADDR;
  //EEPROM.put(EEAddr, defaultValues); EEAddr += sizeof(defaultValues);
  
  EEPROM.put(EEAddr, light.timeOn); EEAddr += sizeof(light.timeOn);
  EEPROM.put(EEAddr, light.duration); EEAddr += sizeof(light.duration);
  EEPROM.put(EEAddr, light.interval); EEAddr += sizeof(light.interval);
  EEPROM.put(EEAddr, light.mode); EEAddr += sizeof(light.mode);

  EEPROM.put(EEAddr, pump.timeOn); EEAddr += sizeof(pump.timeOn);
  EEPROM.put(EEAddr, pump.duration); EEAddr += sizeof(pump.duration);
  EEPROM.put(EEAddr, pump.interval); EEAddr += sizeof(pump.interval);
  EEPROM.put(EEAddr, pump.mode); EEAddr += sizeof(pump.mode);

  EEPROM.put(EEAddr, aux1.timeOn); EEAddr += sizeof(aux1.timeOn);
  EEPROM.put(EEAddr, aux1.duration); EEAddr += sizeof(aux1.duration);
  EEPROM.put(EEAddr, aux1.interval); EEAddr += sizeof(aux1.interval);
  EEPROM.put(EEAddr, aux1.mode); EEAddr += sizeof(aux1.mode);

  EEPROM.put(EEAddr, aux2.timeOn); EEAddr += sizeof(aux2.timeOn);
  EEPROM.put(EEAddr, aux2.duration); EEAddr += sizeof(aux2.duration);
  EEPROM.put(EEAddr, aux2.interval); EEAddr += sizeof(aux2.interval);
  EEPROM.put(EEAddr, aux2.mode); EEAddr += sizeof(aux2.mode);

  EEPROM.put(EEAddr, daysToReplaceWater); EEAddr += sizeof(daysToReplaceWater);
  EEPROM.put(EEAddr, daysToReplaceNutrient); EEAddr += sizeof(daysToReplaceNutrient);
  EEPROM.put(EEAddr, reservoirBottom); EEAddr += sizeof(reservoirBottom);
  EEPROM.put(EEAddr, readReservoir); EEAddr += sizeof(readReservoir);
  EEPROM.put(EEAddr, serialCommunications); EEAddr += sizeof(serialCommunications);
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
