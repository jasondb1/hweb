#include <Wire.h>
#define SLAVE_ADDR 0x08
#define UPDATE_RATE 5000
#define BUFSIZE 0x20
#define  MAX_SENT_BYTES       3

const int pResistor = A0;
int value_pResistor = 0;
int value_humidity = 0;
int value_temp = 0;

char buffer_out[BUFSIZE];
byte receivedCommands[MAX_SENT_BYTES];


void setup() {
  Wire.begin(SLAVE_ADDR);       // join i2c bus with slave address
  Wire.onRequest(requestEvent); // register event
  Wire.onReceive(receiveEvent);
  pinMode(pResistor, INPUT);// Set pResistor - A0 pin as an input (optional)
  //Serial.begin(57600);
}

void loop() {  
  delay(500);
}

// function that executes whenever data is requested by master
// this function is registered as an event, see setup()
void requestEvent() {


  //use mapping to get the temp values
  //int value_temp = map(sensorReading, 0, 1023, -5, 32);

  //get the values
  value_pResistor = analogRead(pResistor);
  value_temp = 20.00f * 100;
  value_humidity = 47;
  
  String toSend = String(analogRead(pResistor), HEX);
  //not floats are split into integers 
  sprintf(buffer_out, "%d %d.%d %d", value_pResistor, value_temp / 100, value_temp % 100, value_humidity );
  
  //String toSend = String(analogRead(pResistor), HEX); 
  //Serial.println(toSend);
  //Wire.write(&toSend[0]); // respond with message of x bytes
  Wire.write(&buffer_out[0], BUFSIZE);
}

/////////////////////////
// receiveEvent(int)

void receiveEvent(int bytesReceived){
     for (int a = 0; a < bytesReceived; a++) {
          if ( a < MAX_SENT_BYTES) {
               receivedCommands[a] = Wire.read();
          }
          else {
               Wire.read();  // if we receive more data then allowed just throw it away
          }
     }
}
