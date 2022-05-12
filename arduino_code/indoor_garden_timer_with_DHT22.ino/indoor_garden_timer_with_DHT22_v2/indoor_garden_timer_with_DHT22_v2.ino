/*
  Author: Jason De Boer


*/
#include "indoor_garden_timer_with_DHT22.h"

//Timelibrary
struct timelib_tm tinfo;
timelib_t time_now, initialt, time_water_expires, time_nutrient_expires, time_next_update;
uint8_t previousDay;

//communications
char buffer_out[BUFSIZE]; //max buffer size is 32 bytes
byte receivedCommands[MAX_SENT_BYTES];
const byte outputText = false; //1 - text, 2 - binary

//pins
const uint8_t pumpPin = PUMPPIN; //pin number for activating relay for pump
const uint8_t lightPin = LIGHTPIN; //pin number for activating relay for light
const uint8_t auxOnePin = AUXONEPIN; //pin number for activating relay for pump
const uint8_t auxTwoPin = AUXTWOPIN; //pin number for activating relay for light
const uint8_t pinLightSensor = P_RESISTOR; //pin number for light sensor
const uint8_t buttonMenu = BUTTONMENUPIN;
const uint8_t buttonUp = BUTTONUPPIN;
const uint8_t buttonDown = BUTTONDOWNPIN;

//menu items
volatile buttonModes buttonStatus = NONE; //status for ISR routine
menuItems menuItem = STATUS;
boolean menuItemSelected = false;
boolean displayChanged = false;
const char* modeDescription[4] = {"Off", "Auto", "Manual Pump", "Manual Light"};
const char* commonString[2] = {"Off", "On"};


DHT dht(DHTPIN, DHTTYPE);
NewPing sonar(TRIGPIN, ECHOPIN, MAX_DISTANCE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

//setup default timings
#ifndef DEBUG
uint32_t longestDelayBetweenFlooding = 21600; //longest acceptable delay between flooding.
uint32_t pumpInterval = 1800; //millis between flooding : 30 mins
uint32_t pumpDuration = 360; //millis for flood duration : 6 mins

uint32_t lightInterval = 86400; //24 hour cycles
//uint32_t lightDuration = 57600; //16 hours on
uint32_t lightDuration = 54000; //15 hours
uint8_t lightOnHour = 5;
uint8_t lightOnMin = 0;

#ifdef AUXONELARGEVALUES
uint32_t auxOneInterval = 86400;
uint32_t auxOneDuration = 54000;
#else
uint32_t auxOneInterval = 3600;
uint32_t auxOneDuration = 900;
#endif

#ifdef AUXTWOLARGEVALUES
uint32_t auxTwoInterval = 86400;
uint32_t auxTwoDuration = 54000;
#else
uint32_t auxTwoInterval = 3600;
uint32_t auxTwoDuration = 900;
#endif

#else
uint32_t longestDelayBetweenFlooding = 240;
uint32_t pumpInterval = 30;
uint32_t pumpDuration = 15;
uint32_t lightInterval = 120;
uint32_t lightDuration = 45;
uint32_t auxOneInterval = 120;
uint32_t auxOneDuration = 60;
uint32_t auxTwoInterval = 120;
uint32_t auxTwoDuration = 90;
uint8_t lightOnHour = 12;
uint8_t lightOnMin = 0;
#endif

//light sensor thresholds - currently not being used
//uint16_t lightLevel = 600; //this value indicates whether the sun is up. Value out of 1023. higher = lighter (indirect sun is around 850; normal indoor lighting is around 650)
//const uint16_t lightLevelDelay = 20000; //delay before deciding it is daylight. To avoid lights, etc. causing issues

//uint32_t pumpLastOn = pumpInterval + lightLevelDelay; //ensuring pump comes on when device is turned on and it is light
uint32_t pumpLastOn = 0;
uint32_t pumpOffAt = 0;
uint32_t pumpOnAt = 0;
uint32_t auxOneOffAt = 0;
uint32_t auxOneOnAt = 0;
uint32_t auxTwoOffAt = 0;
uint32_t auxTwoOnAt = 0;
uint32_t lightOffAt = 0;
uint32_t lightOnAt = 0;
uint16_t daysToReplaceWater = 21;
uint16_t daysToReplaceNutrient = 21;

//setup options
uint16_t lightSensorNow = analogRead(pinLightSensor);

//status and values

//status and values
struct Status{
boolean statusSystemOn;
boolean statusPumpOn;
boolean statusAuxOneOn;
boolean statusAuxTwoOn;
boolean statusLightOn;
boolean manualMode;
boolean continuousPump;
boolean continuousAuxOne;
boolean continuousAuxTwo;
boolean pumpWhenLightOff;
};


int16_t valuePhotoResistor = -99;
float valueHumidity = -99;
float valueTemperature = -99;
int16_t valueReservoirDepth = -99;
//float historyTemperature[SAMPLES];
//float historyHumidity[SAMPLES];
//int historyDepth[SAMPLES];
uint8_t index = 0;
uint16_t reservoirTop = RESERVOIR_TOP;
uint16_t reservoirBottom = RESERVOIR_BOTTOM;
int8_t maxTemp = -127;
int8_t minTemp = 127;

//sMode systemMode = AUTO;
uint8_t sysMode = 0;
int8_t displayScreen = 0;

struct Status status;




/////////////////////////
// setup()
//
// runs once before loop();

void setup() {

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print(F("Init..."));


status.statusSystemOn = true;
status.statusPumpOn = false;
status.statusAuxOneOn = false;
status.statusAuxTwoOn = false;
status.statusLightOn = false;
status.manualMode = false;
status.continuousPump = true;
status.continuousAuxOne = false;
status.continuousAuxTwo = false;
status.pumpWhenLightOff = true;


  //setup pump and light
  digitalWrite(pumpPin, HIGH);
  digitalWrite(lightPin, HIGH);
  digitalWrite(auxOnePin, HIGH);
  digitalWrite(auxTwoPin, HIGH);
  pinMode(pumpPin, OUTPUT);
  pinMode(lightPin, OUTPUT);
  pinMode(auxOnePin, OUTPUT);
  pinMode(auxTwoPin, OUTPUT);

  pinMode(buttonMenu, INPUT_PULLUP);
  pinMode(buttonUp, INPUT_PULLUP);
  pinMode(buttonDown, INPUT_PULLUP);

  digitalWrite(pumpPin, HIGH); //pump off
  digitalWrite(lightPin, LOW); //light off
  digitalWrite(auxOnePin, LOW); //fan off
  digitalWrite(auxTwoPin, LOW); //aux off

  delay(10000);
  //digitalWrite(pumpPin, LOW); //pump off

  sysMode = 1; //set to auto

  //setup sensors
  pinMode(pinLightSensor, INPUT);// Set pResistor - A0 pin as an input (optional)
  pinMode(TRIGPIN, OUTPUT);
  pinMode(ECHOPIN, INPUT);
  dht.begin();
  initDHT22();

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
  //timelib_set_provider(time_provider, TIMELIB_SECS_PER_DAY);

#ifndef DEBUG
  readSettings();//Read EEPROM
#endif

  //Set timers for water and nutrient timer
  time_now = timelib_get();
  time_water_expires = time_now + (daysToReplaceWater * 24 * 60 * 60L);
  time_nutrient_expires = time_now + (daysToReplaceNutrient * 24 * 60 * 60L);

  //resetLightTimer();
  resetTimers();

#ifdef DEBUG
  Serial.begin(57600);
  //Serial.begin(9600);
#endif

  attachPinChangeInterrupt(digitalPinToPinChangeInterrupt(buttonMenu), menu_ISR, FALLING);
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

  timelib_t menuDelay;
  time_now = timelib_get();

  readSensors();

  timelib_break(time_now, &tinfo);
  if (tinfo.tm_mday > previousDay) {
    previousDay = tinfo.tm_mday;
    maxTemp = -127;
    minTemp = 127;
    //TODO: days planted write days planted
  }

  //Calculate when light goes on
  if ( time_now > lightOnAt) {
    lightOffAt = lightDuration + lightOnAt;
    lightOnAt = lightInterval + lightOnAt;
    displayChanged = true;
  }

  //Calculate when to run pump
  if ( time_now > pumpOnAt) {
    pumpLastOn = time_now;
    pumpOffAt = time_now + pumpDuration;
    pumpOnAt = time_now + pumpInterval + PUMPDELAY;
    displayChanged = true;
  }

  //calculate when to turn fan on
  if ( time_now > auxOneOnAt) {
    auxOneOffAt = auxOneDuration  + auxOneOnAt;
    auxOneOnAt = auxOneInterval + auxOneOnAt;
    displayChanged = true;
  }

  //calculate when to turn aux on
  if ( time_now > auxTwoOnAt) {
    auxTwoOffAt = auxTwoDuration + auxTwoOnAt;
    auxTwoOnAt = auxTwoInterval + auxTwoOnAt;
    displayChanged = true;
  }

  //light on and off default to on
  if ( (time_now < lightOffAt && sysMode == 1) || sysMode == 2 || sysMode == 3)  { //turning the light on
    if (!status.statusLightOn) {
      digitalWrite(lightPin, LOW); //light on
      status.statusLightOn = true;
    }
  } else {
    if (status.statusLightOn) {
      digitalWrite(lightPin, HIGH); //light off
      status.statusLightOn = false;
    }
  }

  //TODO: Pump protection with reservoir level (may add setting for this protectionk

  //pump on and off default to on
  if ( (time_now < pumpOffAt && sysMode == 1) || sysMode == 2 || (status.continuousPump && sysMode == 1) ) { //turning the pump on
    //if (!statusPumpOn)
    digitalWrite(pumpPin, LOW); //pump on
    status.statusPumpOn = true;
  } else {
    //if (statusPumpOn)
    digitalWrite(pumpPin, HIGH); //pump off
    status.statusPumpOn = false;
  }

  //fan on and off
  if ( (time_now < auxOneOffAt && sysMode == 1) || (status.continuousAuxOne && sysMode != 0) ) { //turning the pump on
    //if (!statusauxOneOn)
    digitalWrite(auxOnePin, LOW); //pump on
    status.statusAuxOneOn = true;
  } else {
    //if (statusAuxOneOn)
    digitalWrite(auxOnePin, HIGH); //pump off
    status.statusAuxOneOn = false;
  }

  //aux on and off
  if ( (time_now < auxTwoOffAt && sysMode == 1) || (status.continuousAuxTwo && sysMode != 0)  ) { //turning the pump on
    //if (!statusauxTwoOn)
    digitalWrite(auxTwoPin, LOW); //pump on
    status.statusAuxTwoOn = true;
  } else {
    //if (statusauxTwoOn)
    digitalWrite(auxTwoPin, HIGH); //pump off
    status.statusAuxTwoOn = false;
  }

  if (buttonStatus != NONE) {
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
    }
    menuDelay = time_now + MENUDELAY; 
  }

  if (menuItem == STATUS) {
    //if (displayChanged || (time_now > time_next_update) ) {
    if (time_now > menuDelay) {
      displayChanged = true;
      menuDelay = time_now + MENUDELAY; //Menu delay update
    }

    if (displayChanged ) {
      displayInfo(displayScreen);
      //time_next_update = time_now + (10UL); //10 second update
    }
    
    delay(DELAY); //this is to save power
  
  } else {


    if (displayChanged) {
      displayMenu();
    }

    if (time_now > menuDelay) {
      menuItem = STATUS;
      lcd.clear();
      displayChanged = true;
      displayInfo(displayScreen);
    }

    delay(BUTTONTIMEOUT);
  }
}





/////////////////////////
// readSensors()
//
// Reads sensors and apply a smoothing filter to exclude bad values

void readSensors() {

  valuePhotoResistor = analogRead(pinLightSensor);
  valueTemperature = expSmoothing<float>(dht.readTemperature(), valueTemperature);
  valueHumidity = expSmoothing<float>(dht.readHumidity(), valueHumidity);
  uint16_t distance = sonar.convert_cm(sonar.ping_median(5));
  valueReservoirDepth = reservoirBottom - distance;

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
      lcd.setCursor(0, 0);
      lcd.print(F("Max Temp: "));
      lcd.print(maxTemp);
      lcd.setCursor(0, 1);
      lcd.print(F("Min Temp: "));
      lcd.print(minTemp);
      break;
    case 2:
      lcd.setCursor(0, 0);
      lcd.print(F("Light:"));
      lcd.print( status.statusLightOn ? commonString[1] : commonString[0]);
      lcd.setCursor(11, 0);
      printTime(time_now);
      lcd.setCursor(0, 1);

      if (status.statusLightOn) {
        printTime(lightOnAt);
        lcd.print('-');
        printTime(lightOffAt);
      } else {
        printTime(lightOffAt);
        lcd.print('-');
        printTime(lightOnAt);
      }
      break;

    case 3:
      lcd.setCursor(0, 0);
      lcd.print(F("Pump:"));
      lcd.print( status.statusPumpOn ? commonString[1] : commonString[0]);
      lcd.setCursor(11, 0);
      printTime(time_now);
      lcd.setCursor(0, 1);

      if (status.statusPumpOn) {
        lcd.print(F("Off "));
        printTime(pumpOffAt);
        lcd.setCursor(11, 1);
        lcd.print( ((pumpOffAt - time_now) / 60UL) +1);
      } else {
        lcd.print(F("On  "));
        printTime(pumpOnAt);
        lcd.setCursor(11, 1);
        lcd.print( ((pumpOnAt - time_now) / 60UL) +1 );
      }
      break;
    case 4:
      lcd.setCursor(0, 0);
      lcd.print(F("Aux One:"));
      lcd.print( status.statusAuxOneOn ? commonString[1] : commonString[0]);
      lcd.setCursor(11, 0);
      printTime(time_now);
      lcd.setCursor(0, 1);

      if (status.statusAuxOneOn) {
        lcd.print(F("Off "));
        printTime(auxTwoOffAt);
        lcd.setCursor(11, 1);
        lcd.print( ((auxOneOffAt - time_now) / 60UL) + 1 );
      } else {
        lcd.print(F("On  "));
        printTime(auxOneOnAt);
        lcd.setCursor(11, 1);
        lcd.print( ((auxOneOnAt - time_now) / 60UL) + 1 );
      }
      break;
    case 5:
      lcd.setCursor(0, 0);
      lcd.print(F("Aux Two:"));
      lcd.print( status.statusAuxTwoOn ? commonString[1] : commonString[0]);
      lcd.setCursor(11, 0);
      printTime(time_now);
      lcd.setCursor(0, 1);

      if (status.statusAuxTwoOn) {
        lcd.print(F("Off "));
        printTime(auxTwoOffAt);
        lcd.setCursor(11, 1);
        lcd.print( ((auxTwoOffAt - time_now) / 60UL) + 1);
      } else {
        lcd.print(F("On  "));
        printTime(auxTwoOnAt);
        lcd.setCursor(11, 1);
        lcd.print( ((auxTwoOnAt - time_now) / 60UL) + 1);
      }
      break;

//      case 6:
//      lcd.setCursor(0, 0);
//      lcd.print(F("Mem:"));
//      lcd.setCursor(0, 1);
//      //lcd.print(freeMemory());
//      break;


//    case 6:
//      lcd.setCursor(0, 0);
//      //printTime(pumpOnAt);
//      sprintf(str, "ON L% ld P% ld", ( (lightOnAt - time_now) / (1 * 60UL) ) , ( pumpOnAt - time_now ) / (1 * 60L) );
//      lcd.print(str);
//      lcd.setCursor(0, 1);
//      sprintf(str, "F% ld A% ld", ( (auxOneOnAt - time_now) / (1 * 60UL) ), ( (auxTwoOnAt - time_now) / (1 * 60UL) ) );
//      lcd.print(str);
//      break;
//    case 7:
//      lcd.setCursor(0, 0);
//      sprintf(str, "OFF L% ld P% ld", ( (lightOffAt - time_now) / (1 * 60UL) ) , (pumpOffAt - time_now) / (1 * 60UL) );
//      lcd.print(str);
//      lcd.setCursor(0, 1);
//      sprintf(str, "F% ld A% ld", ( (auxOneOffAt - time_now) / (1 * 60UL) ), ( (auxTwoOffAt - time_now) / (1 * 60UL) ) );
//      lcd.print(str);
//      break;
    default:
      //print time
      displayScreen = 0;
      lcd.setCursor(0, 0);
      printTime(time_now);

#ifdef DISPLAYRESERVOIR
      //print reservoir depth
      lcd.setCursor(6, 0);
      lcd.print(valueReservoirDepth);
      lcd.print(F(" cm"));
#endif

      //  //Days to Water Change
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

void printTime(timelib_t timestamp)
{
  timelib_break(timestamp, &tinfo);

  if (tinfo.tm_hour < 10)
    lcd.print('0');
  lcd.print(tinfo.tm_hour);
  lcd.print(':');
  if (tinfo.tm_min < 10)
    lcd.print('0');
  lcd.print(tinfo.tm_min);
  //    lcd.print(':');
  //  if (tinfo.tm_sec < 10)
  //    lcd.print('0');
  //  lcd.print(tinfo.tm_sec);


}


/////////////////////////
// resetLightTimer()
//
// Reset Timers for Light

void resetLightTimer() {
  time_now = timelib_get();
  timelib_break(time_now, &tinfo);
  tinfo.tm_hour = lightOnHour;
  tinfo.tm_min = lightOnMin;
  tinfo.tm_sec = 00;
  // Convert time structure to timestamp
  lightOnAt = timelib_make(&tinfo);
  lightOffAt = lightOnAt + lightDuration;

  if (lightOnAt < time_now) {
    lightOnAt += (24 * 60 * 60UL); //set to next day
  }

}


/////////////////////////
// resetTimers()
//
// Reset Timers for Light, pump, fan and aux

void resetTimers() {
  resetLightTimer();
  pumpOnAt = time_now + pumpInterval + PUMPDELAY;
  pumpLastOn = time_now;
  pumpOffAt = time_now + pumpDuration;
  auxOneOnAt = lightOnAt - lightInterval;
  auxTwoOnAt = lightOnAt - lightInterval;

  while (auxOneOnAt < time_now) {
    auxOneOnAt += auxOneInterval;
  }

  while (auxTwoOnAt < time_now) {
    auxTwoOnAt += auxTwoInterval;
  }

  auxOneOffAt = auxOneOnAt + auxOneDuration - auxOneInterval;
  auxTwoOffAt = auxTwoOnAt + auxTwoDuration - auxTwoInterval;

}



/////////////////////////
// displayMenu()
//
// Updates the display

void displayMenu() {

  //String str1;
  char str1[BUFSIZE];
  char str2[BUFSIZE];
  uint32_t ld_minutes =  (lightDuration /  60UL);
  time_now = timelib_get();

  switch (menuItem) {
    case SETMODE:
      strcpy(str1, "Set Mode");
      strcpy(str2, modeDescription[sysMode]);
      //strcpy(str2, setMode(sysMode));
      //sprintf(str2, "%d", sysMode );
      break;
    case RESETWATERTIMER:
      strcpy(str1, "Reset Water Timer");
      sprintf(str2, "%ld Days", (time_water_expires - time_now) / (24 * 60 * 60L) );
      break;
    case RESETNUTRIENTTIMER:
      strcpy (str1, "Reset Nutr. Timer");
      sprintf(str2, "%ld Days", (time_nutrient_expires - time_now) / (24 * 60 * 60L) );
      break;
    case SETHOUR:
      timelib_break(time_now, &tinfo);
      strcpy (str1, "Set Hour");
      sprintf(str2, "%02d:%02d", tinfo.tm_hour, tinfo.tm_min );
      break;
    case SETMINUTE:
      timelib_break(time_now, &tinfo);
      strcpy (str1, "Set Minutes");
      sprintf(str2, "%02d:%02d", tinfo.tm_hour, tinfo.tm_min );
      break;
    case SETWATERTIMER:
      strcpy (str1, "Set Water Timer");
      sprintf(str2, "%d Days", daysToReplaceWater);
      break;
    case SETNUTRIENTTIMER:
      strcpy (str1, "Set Nutr. Timer");
      sprintf(str2, "%d Days", daysToReplaceNutrient);
      break;
    case SETLIGHTTIMEHOURS:
      strcpy (str1, "Set Light On Hrs");
      sprintf(str2, "%02d:%02d", lightOnHour, lightOnMin );
      break;
    case SETLIGHTTIMEMINUTES:
      strcpy (str1,"Set Light On Mins");
      sprintf(str2, "%02d:%02d", lightOnHour, lightOnMin );
      break;
    case SETLIGHTDURATION:
      strcpy (str1, "Set Light Dur.");
      sprintf(str2, "%lu:%02lu Hrs", ld_minutes / 60 , ld_minutes % 60  );
      break;
    case SETCONTINUOUSPUMP:
      strcpy (str1, "Continuous Pump");
      if (status.continuousPump) {
        strcpy(str2, "Continuous");
      } else {
        strcpy(str2, "Timer");
      }
      break;
    case SETPUMPINTERVAL:
      strcpy (str1, "Set Pump Interval");
      //sprintf(str2, "%lu Mins", pumpInterval / 60UL);
      //long hours = pumpInterval / 3600;
      sprintf(str2, "%lu:%02lu", pumpInterval / 3600 , pumpInterval % 3600UL / 60  );
      break;
    case SETPUMPDURATION:
      strcpy (str1, "Set Pump Dur.");
      //sprintf(str2, "%lu Mins", (pumpDuration / 60UL) );
      sprintf(str2, "%lu:%02lu", pumpDuration / 3600 , pumpDuration % 3600 / 60  );
      break;
    case SETCONTINUOUSAUXONE:
      strcpy (str1, "Continuous aux1");
      if (status.continuousAuxOne) {
        strcpy(str2, "Continuous");
      } else {
        strcpy(str2, "Timer");
      }
      break;
    case SETAUXONEINTERVAL:
      strcpy (str1, "Set aux1 Interval");
      //sprintf(str2, "%lu Mins", auxOneInterval / 60UL);
      sprintf(str2, "%lu:%02lu", auxOneInterval / 3600 , auxOneInterval % 3600 / 60  );
      break;
    case SETAUXONEDURATION:
      strcpy (str1, "Set aux1 Dur.");
      sprintf(str2, "%lu:%02lu", auxOneDuration / 3600 , auxOneDuration % 3600 / 60  );
      //sprintf(str2, "%lu Mins", (auxOneDuration / 60UL) );
      break;
    case SETCONTINUOUSAUXTWO:
      strcpy (str1, "Continuous aux2");
      if (status.continuousAuxTwo) {
        strcpy(str2, "Continuous");
      } else {
        strcpy(str2, "Timer");
      }
      break;
    case SETAUXTWOINTERVAL:
      strcpy (str1, "Set aux2 Interval");
      //sprintf(str2, "%lu Mins", auxTwoInterval / 60UL);
      sprintf(str2, "%lu:%02lu Hrs", auxTwoInterval / 3600 , auxTwoInterval % 3600 /60  );
      break;
    case SETAUXTWODURATION:
      strcpy (str1, "Set aux2 Dur.");
      //sprintf(str2, "%lu Mins", (auxTwoDuration / 60UL) );
      sprintf(str2, "%lu:%02lu Hrs", auxTwoDuration / 3600 , auxTwoDuration % 3600 / 60  );
      break;
    case SETRESERVOIRBOTTOM:
      strcpy (str1, "Reservoir Btm");
      sprintf(str2, "%lu cm", reservoirBottom );
      break;
    case SAVESETTINGS:
      strcpy (str1, "Save Settings");
      strcpy(str2, "");
      break;
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(str1);
  lcd.setCursor(2, 1);
  lcd.print(str2);

  lcd.setCursor(0, 1);
  lcd.print('<');
  lcd.setCursor(15, 1);
  lcd.print('>');

  displayChanged = false;

}


/////////////////////////
// menuButtonPressed()
//
//  process menu button pressed

void menuButtonPressed() {

  displayChanged = true;

  switch (menuItem) {
    case STATUS:
      menuItem = SETMODE;
      break;
    case SETMODE:
      menuItem = RESETWATERTIMER;
      break;
    case RESETWATERTIMER:
      menuItem = RESETNUTRIENTTIMER;
      break;
    case RESETNUTRIENTTIMER:
      menuItem = SETHOUR;
      break;
    case SETHOUR:
      menuItem = SETMINUTE;
      break;
    case SETMINUTE:
      menuItem = SETWATERTIMER;
      break;
    case SETWATERTIMER:
      menuItem = SETNUTRIENTTIMER;
      break;
    case SETNUTRIENTTIMER:
      menuItem = SETLIGHTTIMEHOURS;
      break;
    case SETLIGHTTIMEHOURS:
      menuItem = SETLIGHTTIMEMINUTES;
      break;
    case SETLIGHTTIMEMINUTES:
      menuItem = SETLIGHTDURATION;
      break;
    case SETLIGHTDURATION:
      menuItem = SETCONTINUOUSPUMP;
      break;
    case SETCONTINUOUSPUMP:
      menuItem = SETPUMPINTERVAL;
      break;
    case SETPUMPINTERVAL:
      menuItem = SETPUMPDURATION;
      break;
    case SETPUMPDURATION:
      menuItem = SETRESERVOIRBOTTOM ;
      break;
    case SETRESERVOIRBOTTOM:
      menuItem = SETCONTINUOUSAUXONE;
      break;
    case SETCONTINUOUSAUXONE:
      menuItem = SETAUXONEINTERVAL;
      break;
    case SETAUXONEINTERVAL:
      menuItem = SETAUXONEDURATION;
      break;
    case SETAUXONEDURATION:
      menuItem = SETCONTINUOUSAUXTWO;
      break;
    case SETCONTINUOUSAUXTWO:
      menuItem = SETAUXTWOINTERVAL;
      break;
    case SETAUXTWOINTERVAL:
      menuItem = SETAUXTWODURATION;
      break;
    case SETAUXTWODURATION:
      menuItem = SAVESETTINGS;
      break;
    case SAVESETTINGS:
    //      menuItem = STATUS;
    //      lcd.clear();
    //      break;
    default:
      menuItem = STATUS;
      lcd.clear();
  }
  delay(BUTTONTIMEOUT);
  buttonStatus = NONE;

}



/////////////////////////
// void valueButtonPressed(int8_t buttonvalue)
//
//  process menu button pressed

void valueButtonPressed(int8_t buttonvalue) {

  displayChanged = true;

  switch (menuItem) {
    case SETMODE:
      sysMode = (sysMode + (1 * buttonvalue)) % 4;
      //setMode(sysMode);
      break;
    case SETHOUR:
      timelib_break(time_now, &tinfo);
      if (tinfo.tm_hour >= 23) {
        tinfo.tm_hour = 0;
      } else {
        tinfo.tm_hour += (1 * buttonvalue);
      }
      initialt = timelib_make(&tinfo);
      timelib_set(initialt);
      resetTimers();
      break;
    case SETMINUTE:
      timelib_break(time_now, &tinfo);
      if (tinfo.tm_min >= 59) {
        tinfo.tm_min = 0;
      } else {
        tinfo.tm_min += (1 * buttonvalue);
      }
      initialt = timelib_make(&tinfo);
      timelib_set(initialt);
      resetTimers();
      break;
    case RESETWATERTIMER:
      time_water_expires = timelib_get() + (daysToReplaceWater * 24 * 60 * 60UL);
      break;
    case RESETNUTRIENTTIMER:
      time_nutrient_expires = timelib_get() + (daysToReplaceNutrient * 24 * 60 * 60UL);
      break;
    case SETLIGHTTIMEHOURS:
      lightOnHour += (1 * buttonvalue);
      resetTimers();
      break;
    case SETLIGHTTIMEMINUTES:
      lightOnMin += (1 * buttonvalue);
      resetTimers();
      break;
    case SETLIGHTDURATION:
      lightDuration += (15UL * 60 * buttonvalue); //add 15 minutes for light duration
      resetTimers();
      break;
    case SETCONTINUOUSPUMP:
      status.continuousPump = !status.continuousPump;
      break;
    case SETPUMPINTERVAL:
      pumpInterval += (PUMPINTERVALINCREMENT * 60 * buttonvalue); //add 1 minute for pump cycle
      resetTimers();
      break;
    case SETPUMPDURATION:
      pumpDuration += (PUMPDURATIONINCREMENT * 60 * buttonvalue); //add 1 minutes for pump duration
      resetTimers();
      break;
    case SETCONTINUOUSAUXONE:
      status.continuousAuxOne = !status.continuousAuxOne;
      break;
    case SETAUXONEINTERVAL:
      auxOneInterval += (AUXONEINCREMENT * 60UL * buttonvalue); //add 1 minute for pump cycle
      resetTimers();
      break;
    case SETAUXONEDURATION:
      auxOneDuration += (AUXONEINCREMENT * 60UL * buttonvalue); //add 1 minutes for pump duration
      resetTimers();
      break;
    case SETCONTINUOUSAUXTWO:
      status.continuousAuxTwo = !status.continuousAuxTwo;
      break;
    case SETAUXTWOINTERVAL:
      auxTwoInterval += (AUXTWOINCREMENT * 60UL * buttonvalue); //add 1 minute for pump cycle
      resetTimers();
      break;
    case SETAUXTWODURATION:
      auxTwoDuration += (AUXTWOINCREMENT * 60UL * buttonvalue); //add 1 minutes for pump duration
      resetTimers();
      break;
    case SETWATERTIMER:

      if (daysToReplaceWater > 365) {
        daysToReplaceWater = 365;
      } else {
        daysToReplaceWater += (1 * buttonvalue);
        time_water_expires += (24 * 60 * 60UL * buttonvalue);
      }
      break;
    case SETNUTRIENTTIMER:

      if (daysToReplaceNutrient > 365) {
        daysToReplaceNutrient = 365;
      } else {
        daysToReplaceNutrient += (1 * buttonvalue);
        time_nutrient_expires += (24 * 60 * 60UL * buttonvalue);
      }
      break;
    case SETRESERVOIRBOTTOM:
      if (reservoirBottom >= 400) {
        reservoirBottom = 400;
      } else {
        reservoirBottom += (1 * buttonvalue);
      }
      break;
    case SAVESETTINGS:
      lcd.clear();
      lcd.print(F("Writing Settings..."));
      writeSettings();
      menuItem = STATUS;
      lcd.clear();
      break;
    default:
      displayScreen += (1 * buttonvalue);
      displayChanged = true;
      lcd.clear();
  }

  delay(BUTTONTIMEOUT);
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
    sumHumidity += dht.readHumidity();
    sumTemperature += dht.readTemperature();
    delay(500);
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
      lightDuration += (15UL * 60); //add 15 minutes for light duration
      break;
    case 6:
      lightDuration -= (15UL * 60); //add -15 minutes for light duration
      break;
    case 7:
      pumpInterval += (PUMPINTERVALINCREMENT * 60); //add 5 minutes for pump cycle
      break;
    case 8:
      pumpInterval -= (PUMPINTERVALINCREMENT * 60); //subtract 5 minutes for pump cycle
      break;
    case 9:
      pumpDuration += (PUMPDURATIONINCREMENT * 60); //add 1 minutes for pump duration
      break;
    case 10:
      pumpDuration -= (PUMPDURATIONINCREMENT * 60); //sub 1 minutes for pump duration
      break;
    case 11:
      lightOffAt += (15UL * 60); //add 15 minutes for light off at - used to start cycle later in the day
      lightOnAt += (15UL * 60);
#ifdef DEBUG
      Serial.println("Light cycle +15 mins");
#endif
      break;
    case 12:
      if ( (lightOnAt - (15UL * 60) ) > millis() ) { //do not allow lights on to become less than the current time - could break
        lightOffAt -= (15UL * 60); //sub 15 minutes for light off at - used to start cycle earlier in the day
        lightOnAt -= (15UL * 60);
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
    unsigned long secondsToLightOff = (lightOffAt - time_now);
    //buffer
    sprintf(buffer_out, "%d %d.%d %d.%d %d %d %d %u", valuePhotoResistor, valTemp / 100, valTemp % 100, valHum / 10, valHum % 10, sysMode, status.statusLightOn, status.statusPumpOn, secondsToLightOff);

  } else {
    //compose custom buffer output - buffer size for wire library is 32 bytes/characters, customize this for application
    intToCharBuffer(buffer_out, 0, valuePhotoResistor);
    intToCharBuffer(buffer_out, 2, valTemp);
    intToCharBuffer(buffer_out, 4, valHum);

    //TODO: change to unix timestamp on light
    if (status.statusLightOn) {
      unsigned int minutesToLightOff = (lightOffAt - time_now) / 60UL;
      //longToCharBuffer(buffer_out, 6, (lightOffAt - time_now) );
      intToCharBuffer(buffer_out, 6, minutesToLightOff);
    } else {
      unsigned int minutesToLightOn = (lightOnAt - time_now) / 60UL;
      intToCharBuffer(buffer_out, 6, minutesToLightOn );
    }

    intToCharBuffer(buffer_out, 8, lightDuration / 60);
    intToCharBuffer(buffer_out, 10, pumpInterval / 60);
    intToCharBuffer(buffer_out, 12, pumpDuration / 60);
    buffer_out[14] = sysMode;
    buffer_out[15] = status.statusLightOn;
    buffer_out[16] = status.statusPumpOn;
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
// String setMode(int)
//
// Sets the mode, and returns the string of what the mode is;

//const char* setMode (int modeNumber) {
//uint8_t setMode (int modeNumber);
//
//  //String str;
//  //char str1[BUFSIZE];
//
//  switch (modeNumber) {
//    case 1:
//      systemMode = OFF;
//      sysMode = 1;
//      strcpy (str1, "OFF");
//      break;
//    case 2:
//      systemMode = AUTO;
//      sysMode = 2;
//      strcpy (str1, "AUTO");
//      break;
//    case 3:
//      systemMode = MANUAL_PUMP_ON;
//      sysMode = 3;
//      strcpy (str1, "MANUAL PUMP");
//      break;
//    case 4:
//      systemMode = MANUAL_PUMP_OFF;
//      sysMode = 4;
//      strcpy (str1, "MANUAL LIGHT");
//      break;
//    default:
//      sysMode = 2;
//      systemMode = AUTO;
//      strcpy (str1, "AUTO");
//      break;
//  }
//
//  return sysMode;
//
//}





/////////////////////////
// readSettings()
//
//  read settings from eeprom

void readSettings() {

  int EEAddr = EEADDR;
  EEPROM.get(EEAddr, lightOnHour); EEAddr += sizeof(lightOnHour);
  EEPROM.get(EEAddr, lightOnMin); EEAddr += sizeof(lightOnMin);
  EEPROM.get(EEAddr, lightInterval); EEAddr += sizeof(lightInterval);
  EEPROM.get(EEAddr, lightDuration); EEAddr += sizeof(lightDuration);
  EEPROM.get(EEAddr, pumpInterval); EEAddr += sizeof(pumpInterval);
  EEPROM.get(EEAddr, pumpDuration); EEAddr += sizeof(pumpDuration);
  EEPROM.get(EEAddr, auxOneInterval); EEAddr += sizeof(auxOneInterval);
  EEPROM.get(EEAddr, auxOneDuration); EEAddr += sizeof(auxOneDuration);
  EEPROM.get(EEAddr, auxTwoInterval); EEAddr += sizeof(auxTwoInterval);
  EEPROM.get(EEAddr, auxTwoDuration); EEAddr += sizeof(auxTwoDuration);
  EEPROM.get(EEAddr, daysToReplaceWater); EEAddr += sizeof(daysToReplaceWater);
  EEPROM.get(EEAddr, daysToReplaceNutrient); EEAddr += sizeof(daysToReplaceNutrient);
  EEPROM.get(EEAddr, status.continuousPump); EEAddr += sizeof(status.continuousPump);
  EEPROM.get(EEAddr, status.continuousAuxOne); EEAddr += sizeof(status.continuousAuxOne);
  EEPROM.get(EEAddr, status.continuousAuxTwo); EEAddr += sizeof(status.continuousAuxTwo);
  EEPROM.get(EEAddr, status.pumpWhenLightOff); EEAddr += sizeof(status.pumpWhenLightOff);
  EEPROM.get(EEAddr, reservoirBottom); EEAddr += sizeof(reservoirBottom);

}


/////////////////////////
// writeSettings()
//
//  write settings from eeprom

void writeSettings() {

  int EEAddr = EEADDR;
  EEPROM.put(EEAddr, lightOnHour); EEAddr += sizeof(lightOnHour);
  EEPROM.put(EEAddr, lightOnMin); EEAddr += sizeof(lightOnMin);
  EEPROM.put(EEAddr, lightInterval); EEAddr += sizeof(lightInterval);
  EEPROM.put(EEAddr, lightDuration); EEAddr += sizeof(lightDuration);
  EEPROM.put(EEAddr, pumpInterval); EEAddr += sizeof(pumpInterval);
  EEPROM.put(EEAddr, pumpDuration); EEAddr += sizeof(pumpDuration);
  EEPROM.put(EEAddr, auxOneInterval); EEAddr += sizeof(auxOneInterval);
  EEPROM.put(EEAddr, auxOneDuration); EEAddr += sizeof(auxOneDuration);
  EEPROM.put(EEAddr, auxTwoInterval); EEAddr += sizeof(auxTwoInterval);
  EEPROM.put(EEAddr, auxTwoDuration); EEAddr += sizeof(auxTwoDuration);
  EEPROM.put(EEAddr, daysToReplaceWater); EEAddr += sizeof(daysToReplaceWater);
  EEPROM.put(EEAddr, daysToReplaceNutrient); EEAddr += sizeof(daysToReplaceNutrient);
  EEPROM.put(EEAddr, status.continuousPump); EEAddr += sizeof(status.continuousPump);
  EEPROM.put(EEAddr, status.continuousAuxOne); EEAddr += sizeof(status.continuousAuxOne);
  EEPROM.put(EEAddr, status.continuousAuxTwo); EEAddr += sizeof(status.continuousAuxTwo);
  EEPROM.put(EEAddr, status.pumpWhenLightOff); EEAddr += sizeof(status.pumpWhenLightOff);
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
