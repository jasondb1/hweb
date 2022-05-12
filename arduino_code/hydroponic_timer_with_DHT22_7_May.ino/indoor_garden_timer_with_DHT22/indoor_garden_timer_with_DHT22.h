#ifndef _INDOOR_GARDEN_TIMER_WITH_DHT22_H    // Put these two lines at the top of your file.
#define _INDOOR_GARDEN_TIMER_WITH_DHT22_H    // (Use a suitable name, usually based on the file name.)


#include <EEPROM.h>
#include <Wire.h>
#include <DHT.h>
#include <NewPing.h>
#include "PinChangeInterrupt.h"
#include "TimeLib.h"
#include <LiquidCrystal_I2C.h>


//#define DEBUG
#define AUXLARGEVALUES
#define FANLARGEVALUES

#define DISPLAYRESERVOIR
#define AUXINCREMENT 15 //minute increments
#define FANINCREMENT 15 //minute increments
#define MENUDELAY 10UL
#define PUMPDELAY 15UL //10 second delay

#define swName = "Hydroponics Controller"
#define swVer = "1.2"
#define swRel = "2021-01-07"

#define EEADDR 255


//hardware parameters
#define LIGHTPIN 12
#define PUMPPIN 7
#define FANPIN 10 //maybe ensure this is PWM if varying speed
#define AUXPIN 9


#define P_RESISTOR A2
#define ECHOPIN 0
#define TRIGPIN 1
#define DHTPIN 13
#define DHTTYPE DHT22
#define BUTTONMENUPIN 5
#define BUTTONUPPIN 4
#define BUTTONDOWNPIN 3

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

/* Common Millis equivalents
   24 hours = 86400000; 16 hours = 57600000; 8 hours = 28800000; 4 hours = 14400000; 2 hours = 7200000; 1 hour = 3600000
   10 minutes = 600000; 5 minutes = 300000; 2 minutes = 120000; 1 minute = 60000
*/
//convenience definitions
#define ONEDAY 86400000
#define ONEHOUR 3600000
#define ONEMINUTE 60000
#define FIVEMINUTES 300000
#define FIFTEENMINUTES 900000

enum sMode {OFF, AUTO, MANUAL_PUMP_ON, MANUAL_PUMP_OFF};
enum buttonModes {NONE, MENU, UP, DOWN};
enum menuItems {STATUS, SETMODE, SETHOUR, SETMINUTE, SETWATERTIMER, SETLIGHTTIMEHOURS, SETLIGHTTIMEMINUTES,SETLIGHTDURATION, SETCONTINUOUSPUMP, SETPUMPINTERVAL, SETPUMPDURATION, SETCONTINUOUSFAN, SETFANINTERVAL, SETFANDURATION, SETCONTINUOUSAUX, SETAUXINTERVAL, SETAUXDURATION, SETNUTRIENTTIMER, RESETWATERTIMER, RESETNUTRIENTTIMER, SETRESERVOIRBOTTOM, SAVESETTINGS };

#endif // _INDOOR_GARDEN_TIMER_WITH_DHT22_H    // Put this line at the end of your file.
