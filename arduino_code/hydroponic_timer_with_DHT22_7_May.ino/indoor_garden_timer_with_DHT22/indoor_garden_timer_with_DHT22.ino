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
byte outputText = false; //1 - text, 2 - binary

//pins
const uint8_t pumpPin = PUMPPIN; //pin number for activating relay for pump
const uint8_t lightPin = LIGHTPIN; //pin number for activating relay for light
const uint8_t fanPin = FANPIN; //pin number for activating relay for pump
const uint8_t auxPin = AUXPIN; //pin number for activating relay for light
const uint8_t pinLightSensor = P_RESISTOR; //pin number for light sensor
const uint8_t buttonMenu = BUTTONMENUPIN;
const uint8_t buttonUp = BUTTONUPPIN;
const uint8_t buttonDown = BUTTONDOWNPIN;

//menu items
volatile buttonModes buttonStatus = NONE; //status for ISR routine
menuItems menuItem = STATUS;
boolean menuItemSelected = false;
boolean displayChanged = false;

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
uint8_t lightOnHour = 3;
uint8_t lightOnMin = 0;

#ifdef FANLARGEVALUES
uint32_t fanInterval = 86400;
uint32_t fanDuration = 54000;
#else
uint32_t fanInterval = 3600;
uint32_t fanDuration = 900;
#endif

#ifdef AUXLARGEVALUES
uint32_t auxInterval = 86400;
uint32_t auxDuration = 54000;
#else
uint32_t auxInterval = 3600;
uint32_t auxDuration = 900;
#endif

#else
uint32_t longestDelayBetweenFlooding = 240;
uint32_t pumpInterval = 30;
uint32_t pumpDuration = 15;
uint32_t lightInterval = 120;
uint32_t lightDuration = 45;
uint32_t fanInterval = 120;
uint32_t fanDuration = 60;
uint32_t auxInterval = 120;
uint32_t auxDuration = 90;
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
uint32_t fanOffAt = 0;
uint32_t fanOnAt = 0;
uint32_t auxOffAt = 0;
uint32_t auxOnAt = 0;
uint32_t lightOffAt = 0;
uint32_t lightOnAt = 0;
uint16_t daysToReplaceWater = 21;
uint16_t daysToReplaceNutrient = 21;

//setup options
uint16_t lightSensorNow = analogRead(pinLightSensor);

//status and values
boolean statusSystemOn = true;
boolean statusPumpOn = false;
boolean statusFanOn = false;
boolean statusAuxOn = false;
boolean statusLightOn = false;
boolean manualMode = false;
boolean continuousPump = true;
boolean continuousFan = false;
boolean continuousAux = false;
boolean pumpWhenLightOff = true;

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

sMode systemMode = AUTO;
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
  lcd.print(F("Initializing..."));

  //setup pump and light
  pinMode(pumpPin, OUTPUT);
  pinMode(lightPin, OUTPUT);
  pinMode(fanPin, OUTPUT);
  pinMode(auxPin, OUTPUT);

  pinMode(buttonMenu, INPUT_PULLUP);
  pinMode(buttonUp, INPUT_PULLUP);
  pinMode(buttonDown, INPUT_PULLUP);

  digitalWrite(pumpPin, HIGH); //pump off
  digitalWrite(lightPin, LOW); //light off
  digitalWrite(fanPin, LOW); //fan off
  digitalWrite(auxPin, LOW); //aux off

  delay(10000);
  digitalWrite(pumpPin, LOW); //pump off

  setMode(2); //set to auto

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
  if ( time_now > fanOnAt) {
    fanOffAt = fanDuration  + fanOnAt;
    fanOnAt = fanInterval + fanOnAt;
    displayChanged = true;
  }

  //calculate when to turn aux on
  if ( time_now > auxOnAt) {
    auxOffAt = auxDuration + auxOnAt;
    auxOnAt = auxInterval + auxOnAt;
    displayChanged = true;
  }

  //light on and off default to on
  if ( (time_now < lightOffAt && systemMode == AUTO) || systemMode == MANUAL_PUMP_ON || systemMode == MANUAL_PUMP_OFF)  { //turning the light on
    if (!statusLightOn) {
      digitalWrite(lightPin, LOW); //light on
      statusLightOn = true;
    }
  } else {
    if (statusLightOn) {
      digitalWrite(lightPin, HIGH); //light off
      statusLightOn = false;
    }
  }

  //TODO: Pump protection with reservoir level (may add setting for this protectionk

  //pump on and off default to on
  if ( (time_now < pumpOffAt && systemMode == AUTO) || systemMode == MANUAL_PUMP_ON || (continuousPump && systemMode == AUTO) ) { //turning the pump on
    //if (!statusPumpOn)
    digitalWrite(pumpPin, LOW); //pump on
    statusPumpOn = true;
  } else {
    //if (statusPumpOn)
    digitalWrite(pumpPin, HIGH); //pump off
    statusPumpOn = false;
  }

  //fan on and off
  if ( (time_now < fanOffAt && systemMode == AUTO) || (continuousFan && systemMode != OFF) ) { //turning the pump on
    //if (!statusFanOn)
    digitalWrite(fanPin, LOW); //pump on
    statusFanOn = true;
  } else {
    //if (statusFanOn)
    digitalWrite(fanPin, HIGH); //pump off
    statusFanOn = false;
  }

  //aux on and off
  if ( (time_now < auxOffAt && systemMode == AUTO) || (continuousAux && systemMode != OFF)  ) { //turning the pump on
    //if (!statusAuxOn)
    digitalWrite(auxPin, LOW); //pump on
    statusAuxOn = true;
  } else {
    //if (statusAuxOn)
    digitalWrite(auxPin, HIGH); //pump off
    statusAuxOn = false;
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
    menuDelay = time_now + MENUDELAY; //15 second delay
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

    delay(180);
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

  char str[24];
  char str2[24];

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
      lcd.print( statusLightOn ? " On" : "Off");
      lcd.setCursor(11, 0);
      printTime(time_now);
      lcd.setCursor(0, 1);

      if (statusLightOn) {
        printTime(lightOnAt);
        lcd.print(F("-"));
        printTime(lightOffAt);
      } else {
        printTime(lightOffAt);
        lcd.print(F("-"));
        printTime(lightOnAt);
      }
      break;

    case 3:
      lcd.setCursor(0, 0);
      lcd.print(F("Pump:"));
      lcd.print( statusPumpOn ? " On" : "Off");
      lcd.setCursor(11, 0);
      printTime(time_now);
      lcd.setCursor(0, 1);

      if (statusPumpOn) {
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
      lcd.print(F("Aux1:"));
      lcd.print( statusFanOn ? " On" : "Off");
      lcd.setCursor(11, 0);
      printTime(time_now);
      lcd.setCursor(0, 1);

      if (statusFanOn) {
        lcd.print(F("Off "));
        printTime(auxOffAt);
        lcd.setCursor(11, 1);
        lcd.print( ((fanOffAt - time_now) / 60UL) + 1 );
      } else {
        lcd.print(F("On  "));
        printTime(fanOnAt);
        lcd.setCursor(11, 1);
        lcd.print( ((fanOnAt - time_now) / 60UL) + 1 );
      }
      break;
    case 5:
      lcd.setCursor(0, 0);
      lcd.print(F("Aux2:"));
      lcd.print( statusAuxOn ? " On" : "Off");
      lcd.setCursor(11, 0);
      printTime(time_now);
      lcd.setCursor(0, 1);

      if (statusAuxOn) {
        lcd.print(F("Off "));
        printTime(auxOffAt);
        lcd.setCursor(11, 1);
        lcd.print( ((auxOffAt - time_now) / 60UL) + 1);
      } else {
        lcd.print(F("On  "));
        printTime(auxOnAt);
        lcd.setCursor(11, 1);
        lcd.print( ((auxOnAt - time_now) / 60UL) + 1);
      }
      break;

//    case 6:
//      lcd.setCursor(0, 0);
//      //printTime(pumpOnAt);
//      sprintf(str, "ON L% ld P% ld", ( (lightOnAt - time_now) / (1 * 60UL) ) , ( pumpOnAt - time_now ) / (1 * 60L) );
//      lcd.print(str);
//      lcd.setCursor(0, 1);
//      sprintf(str, "F% ld A% ld", ( (fanOnAt - time_now) / (1 * 60UL) ), ( (auxOnAt - time_now) / (1 * 60UL) ) );
//      lcd.print(str);
//      break;
//    case 7:
//      lcd.setCursor(0, 0);
//      sprintf(str, "OFF L% ld P% ld", ( (lightOffAt - time_now) / (1 * 60UL) ) , (pumpOffAt - time_now) / (1 * 60UL) );
//      lcd.print(str);
//      lcd.setCursor(0, 1);
//      sprintf(str, "F% ld A% ld", ( (fanOffAt - time_now) / (1 * 60UL) ), ( (auxOffAt - time_now) / (1 * 60UL) ) );
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
      lcd.print(" cm");
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
      lcd.print("%");
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
  lcd.print(":");
  if (tinfo.tm_min < 10)
    lcd.print('0');
  lcd.print(tinfo.tm_min);
  //    lcd.print(":");
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
  fanOnAt = lightOnAt - lightInterval;
  auxOnAt = lightOnAt - lightInterval;

  while (fanOnAt < time_now) {
    fanOnAt += fanInterval;
  }

  while (auxOnAt < time_now) {
    auxOnAt += auxInterval;
  }

  fanOffAt = fanOnAt + fanDuration - fanInterval;
  auxOffAt = auxOnAt + auxDuration - auxInterval;

}





/////////////////////////
// displayMenu()
//
// Updates the display

void displayMenu() {

  String str1;
  char str2[24];
  uint32_t ld_minutes =  (lightDuration /  60UL);
  time_now = timelib_get();

  switch (menuItem) {
    case SETMODE:
      str1 = F("Set Mode");
      sprintf(str2, "%s", setMode(sysMode).c_str() );
      //sprintf(str2, "%d", sysMode );
      break;
    case RESETWATERTIMER:
      str1 = F("Reset Water Timer");
      sprintf(str2, "%ld Days", (time_water_expires - time_now) / (24 * 60 * 60L) );
      break;
    case RESETNUTRIENTTIMER:
      str1 = F("Reset Nutr. Timer");
      sprintf(str2, "%ld Days", (time_nutrient_expires - time_now) / (24 * 60 * 60L) );
      break;
    case SETHOUR:
      timelib_break(time_now, &tinfo);
      str1 = F("Set Hour");
      sprintf(str2, "%02d:%02d", tinfo.tm_hour, tinfo.tm_min );
      break;
    case SETMINUTE:
      timelib_break(time_now, &tinfo);
      str1 = F("Set Minutes");
      sprintf(str2, "%02d:%02d", tinfo.tm_hour, tinfo.tm_min );
      break;
    case SETWATERTIMER:
      str1 = F("Set Water Timer");
      sprintf(str2, "%d Days", daysToReplaceWater);
      break;
    case SETNUTRIENTTIMER:
      str1 = F("Set Nutr. Timer");
      sprintf(str2, "%d Days", daysToReplaceNutrient);
      break;
    case SETLIGHTTIMEHOURS:
      str1 = F("Set Light On Hrs");
      sprintf(str2, "%02d:%02d", lightOnHour, lightOnMin );
      break;
    case SETLIGHTTIMEMINUTES:
      str1 = "Set Light On Mins";
      sprintf(str2, "%02d:%02d", lightOnHour, lightOnMin );
      break;
    case SETLIGHTDURATION:
      str1 = F("Set Light Dur.");
      sprintf(str2, "%lu:%02lu Hrs", ld_minutes / 60 , ld_minutes % 60  );
      break;
    case SETCONTINUOUSPUMP:
      str1 = F("Continuous Pump");
      if (continuousPump) {
        strcpy(str2, "Continuous");
      } else {
        strcpy(str2, "Timer");
      }
      break;
    case SETPUMPINTERVAL:
      str1 = F("Set Pump Interval");
      sprintf(str2, "%lu Mins", pumpInterval / 60UL);
      break;
    case SETPUMPDURATION:
      str1 = F("Set Pump Dur.");
      sprintf(str2, "%lu Mins", (pumpDuration / 60UL) );
      break;
    case SETCONTINUOUSFAN:
      str1 = F("Continuous Aux1");
      if (continuousFan) {
        strcpy(str2, "Continuous");
      } else {
        strcpy(str2, "Timer");
      }
      break;
    case SETFANINTERVAL:
      str1 = F("Set Aux1 Interval");
      sprintf(str2, "%lu Mins", fanInterval / 60UL);
      break;
    case SETFANDURATION:
      str1 = F("Set Aux1 Dur.");
      sprintf(str2, "%lu Mins", (fanDuration / 60UL) );
      break;
    case SETCONTINUOUSAUX:
      str1 = F("Continuous Aux2");
      if (continuousAux) {
        strcpy(str2, "Continuous");
      } else {
        strcpy(str2, "Timer");
      }
      break;
    case SETAUXINTERVAL:
      str1 = F("Set Aux2 Interval");
      sprintf(str2, "%lu Mins", auxInterval / 60UL);
      break;
    case SETAUXDURATION:
      str1 = F("Set Aux2 Dur.");
      sprintf(str2, "%lu Mins", (auxDuration / 60UL) );
      break;
    case SETRESERVOIRBOTTOM:
      str1 = F("Reservoir Btm");
      sprintf(str2, "%lu cm", reservoirBottom );
      break;
    case SAVESETTINGS:
      str1 = F("Save Settings");
      strcpy(str2, "");
      break;
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(str1);
  lcd.setCursor(2, 1);
  lcd.print(str2);

  lcd.setCursor(0, 1);
  lcd.print("<");
  lcd.setCursor(15, 1);
  lcd.print(">");

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
      menuItem = SETCONTINUOUSFAN;
      break;
    case SETCONTINUOUSFAN:
      menuItem = SETFANINTERVAL;
      break;
    case SETFANINTERVAL:
      menuItem = SETFANDURATION;
      break;
    case SETFANDURATION:
      menuItem = SETCONTINUOUSAUX;
      break;
    case SETCONTINUOUSAUX:
      menuItem = SETAUXINTERVAL;
      break;
    case SETAUXINTERVAL:
      menuItem = SETAUXDURATION;
      break;
    case SETAUXDURATION:
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
  delay(180);
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
    case SETHOUR:
      timelib_break(time_now, &tinfo);
      if (tinfo.tm_hour >= 23) {
        tinfo.tm_hour = 0;
      } else {
        tinfo.tm_hour += 1;
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
        tinfo.tm_min += 1;
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
      lightOnHour++;
      resetTimers();
      break;
    case SETLIGHTTIMEMINUTES:
      lightOnMin++;
      resetTimers();
      break;
    case SETLIGHTDURATION:
      lightDuration += (15UL * 60); //add 15 minutes for light duration
      resetTimers();
      break;
    case SETCONTINUOUSPUMP:
      continuousPump = !continuousPump;
      break;
    case SETPUMPINTERVAL:
      pumpInterval += (1UL * 60); //add 1 minute for pump cycle
      resetTimers();
      break;
    case SETPUMPDURATION:
      pumpDuration += (1UL * 60); //add 1 minutes for pump duration
      resetTimers();
      break;
    case SETCONTINUOUSFAN:
      continuousFan = !continuousFan;
      break;
    case SETFANINTERVAL:
      fanInterval += (FANINCREMENT * 60UL); //add 1 minute for pump cycle
      resetTimers();
      break;
    case SETFANDURATION:
      fanDuration += (FANINCREMENT * 60UL); //add 1 minutes for pump duration
      resetTimers();
      break;
    case SETCONTINUOUSAUX:
      continuousAux = !continuousAux;
      break;
    case SETAUXINTERVAL:
      auxInterval += (AUXINCREMENT * 60UL); //add 1 minute for pump cycle
      resetTimers();
      break;
    case SETAUXDURATION:
      auxDuration += (AUXINCREMENT * 60UL); //add 1 minutes for pump duration
      resetTimers();
      break;
    case SETWATERTIMER:

      if (daysToReplaceWater > 365) {
        daysToReplaceWater = 365;
      } else {
        daysToReplaceWater++;
        time_water_expires += (24 * 60 * 60UL);
      }
      break;
    case SETNUTRIENTTIMER:

      if (daysToReplaceNutrient > 365) {
        daysToReplaceNutrient = 365;
      } else {
        daysToReplaceNutrient++;
        time_nutrient_expires += (24 * 60 * 60UL);
      }
      break;
    case SETRESERVOIRBOTTOM:
      if (reservoirBottom >= 400) {
        reservoirBottom = 400;
      } else {
        reservoirBottom++;
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
      ++displayScreen;
      displayChanged = true;
      lcd.clear();
  }

  delay(180);
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
    case SETHOUR:
      timelib_break(time_now, &tinfo);

      if (tinfo.tm_hour <= 0) {
        tinfo.tm_hour = 23;
      } else {
        tinfo.tm_hour -= 1;
      }
      initialt = timelib_make(&tinfo);
      timelib_set(initialt);
      resetTimers();
      break;
    case SETMINUTE:
      timelib_break(time_now, &tinfo);

      if (tinfo.tm_min <= 0) {
        tinfo.tm_min = 59;
      } else {
        tinfo.tm_min -= 1;
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
      //decrease light time
      lightOnHour--;
      //todo: roll over if under 0
      resetTimers();
      break;
    case SETLIGHTTIMEMINUTES:
      //decrease light on time
      lightOnMin--;
      resetTimers();
      break;
    case SETLIGHTDURATION:
      lightDuration -= (15UL * 60); //sub 15 minutes for light duration
      resetTimers();
      break;
    case SETCONTINUOUSPUMP:
      continuousPump = !continuousPump;
      break;
    case SETPUMPINTERVAL:
      pumpInterval -= (1UL * 60); //sub 1 minutes for pump cycle
      resetTimers();
      break;
    case SETPUMPDURATION:
      pumpDuration -= (1UL * 60); //sub 1 minutes for pump duration
      resetTimers();
      break;
    case SETCONTINUOUSFAN:
      continuousFan = !continuousFan;
      break;
    case SETFANINTERVAL:
      fanInterval -= (FANINCREMENT * 60UL); //sub 1 minute for pump cycle
      resetTimers();
      break;
    case SETFANDURATION:
      fanDuration -= (FANINCREMENT * 60UL); //sub 1 minutes for pump duration
      resetTimers();
      break;
    case SETCONTINUOUSAUX:
      continuousAux = !continuousAux;
      break;
    case SETAUXINTERVAL:
      auxInterval -= (AUXINCREMENT * 60UL); //sub 1 minute for pump cycle
      resetTimers();
      break;
    case SETAUXDURATION:
      auxDuration -= (AUXINCREMENT * 60UL); //sub 1 minutes for pump duration
      resetTimers();
      break;
    case SETWATERTIMER:
      if (daysToReplaceWater < 1) {
        daysToReplaceWater = 1;
      } else {
        daysToReplaceWater--;
        time_water_expires -= (24 * 60 * 60UL);
      }
      break;
    case SETNUTRIENTTIMER:
      if (daysToReplaceNutrient < 1) {
        daysToReplaceNutrient = 1;
      } else {
        daysToReplaceNutrient--;
        time_nutrient_expires -= (24 * 60 * 60UL);
      }
      break;
    case SETRESERVOIRBOTTOM:
      if (reservoirBottom <= 0) {
        reservoirBottom = 0;
      } else {
        reservoirBottom--;
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
      displayScreen--;
      displayChanged = true;
      lcd.clear();
  }

  delay(180);
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
      lightDuration += (15UL * 60); //add 15 minutes for light duration
      break;
    case 6:
      lightDuration -= (15UL * 60); //add -15 minutes for light duration
      break;
    case 7:
      pumpInterval += (5UL * 60); //add 5 minutes for pump cycle
      break;
    case 8:
      pumpInterval -= (5UL * 60); //subtract 5 minutes for pump cycle
      break;
    case 9:
      pumpDuration += (1UL * 60); //add 1 minutes for pump duration
      break;
    case 10:
      pumpDuration -= (1UL * 60); //sub 1 minutes for pump duration
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
    unsigned long secondsToLightOff = (lightOffAt - time_now);
    //buffer
    sprintf(buffer_out, "%d %d.%d %d.%d %d %d %d %u", valuePhotoResistor, valTemp / 100, valTemp % 100, valHum / 10, valHum % 10, sysmode, statusLightOn, statusPumpOn, secondsToLightOff);

  } else {
    //compose custom buffer output - buffer size for wire library is 32 bytes/characters, customize this for application
    intToCharBuffer(buffer_out, 0, valuePhotoResistor);
    intToCharBuffer(buffer_out, 2, valTemp);
    intToCharBuffer(buffer_out, 4, valHum);

    //TODO: change to unix timestamp on light
    if (statusLightOn) {
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
    buffer_out[14] = sysmode;
    buffer_out[15] = statusLightOn;
    buffer_out[16] = statusPumpOn;
    intToCharBuffer(buffer_out, 17, valueReservoirDepth);
    //reserve byte for fan status

  }

  Wire.write(&buffer_out[0], BUFSIZE);

}

//timelib_t time_provider()
//{
//  // Prototype if the function providing time information
//  return initialt;
//}





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
      str = F("OFF");
      break;
    case 2:
      systemMode = AUTO;
      sysMode = 2;
      str = F("AUTO");
      break;
    case 3:
      systemMode = MANUAL_PUMP_ON;
      sysMode = 3;
      str = F("MANUAL PUMP");
      break;
    case 4:
      systemMode = MANUAL_PUMP_OFF;
      sysMode = 4;
      str = F("MANUAL LIGHT");
      break;
    default:
      sysMode = 2;
      systemMode = AUTO;
      str = F("AUTO");
      break;
  }

  return str;

}





/////////////////////////
// readSettings()
//
//  read settings from eeprom

void readSettings() {

  int EEAddr = EEADDR;
  EEPROM.put(EEAddr, lightOnHour); EEAddr += sizeof(lightOnHour);
  EEPROM.put(EEAddr, lightOnMin); EEAddr += sizeof(lightOnMin);
  EEPROM.get(EEAddr, lightInterval); EEAddr += sizeof(lightInterval);
  EEPROM.get(EEAddr, lightDuration); EEAddr += sizeof(lightDuration);
  EEPROM.get(EEAddr, pumpInterval); EEAddr += sizeof(pumpInterval);
  EEPROM.get(EEAddr, pumpDuration); EEAddr += sizeof(pumpDuration);
  EEPROM.get(EEAddr, fanInterval); EEAddr += sizeof(fanInterval);
  EEPROM.get(EEAddr, fanDuration); EEAddr += sizeof(fanDuration);
  EEPROM.get(EEAddr, auxInterval); EEAddr += sizeof(auxInterval);
  EEPROM.get(EEAddr, auxDuration); EEAddr += sizeof(auxDuration);
  EEPROM.get(EEAddr, daysToReplaceWater); EEAddr += sizeof(daysToReplaceWater);
  EEPROM.get(EEAddr, daysToReplaceNutrient); EEAddr += sizeof(daysToReplaceNutrient);
  EEPROM.get(EEAddr, continuousPump); EEAddr += sizeof(continuousPump);
  EEPROM.get(EEAddr, continuousFan); EEAddr += sizeof(continuousFan);
  EEPROM.get(EEAddr, continuousAux); EEAddr += sizeof(continuousAux);
  EEPROM.get(EEAddr, pumpWhenLightOff); EEAddr += sizeof(pumpWhenLightOff);
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
  EEPROM.put(EEAddr, fanInterval); EEAddr += sizeof(fanInterval);
  EEPROM.put(EEAddr, fanDuration); EEAddr += sizeof(fanDuration);
  EEPROM.put(EEAddr, auxInterval); EEAddr += sizeof(auxInterval);
  EEPROM.put(EEAddr, auxDuration); EEAddr += sizeof(auxDuration);
  EEPROM.put(EEAddr, daysToReplaceWater); EEAddr += sizeof(daysToReplaceWater);
  EEPROM.put(EEAddr, daysToReplaceNutrient); EEAddr += sizeof(daysToReplaceNutrient);
  EEPROM.put(EEAddr, continuousPump); EEAddr += sizeof(continuousPump);
  EEPROM.put(EEAddr, continuousFan); EEAddr += sizeof(continuousFan);
  EEPROM.put(EEAddr, continuousAux); EEAddr += sizeof(continuousAux);
  EEPROM.put(EEAddr, pumpWhenLightOff); EEAddr += sizeof(pumpWhenLightOff);
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