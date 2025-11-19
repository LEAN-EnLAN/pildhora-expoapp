#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <EEPROM.h>
#include <Servo.h>
#include <Adafruit_NeoPixel.h>
#include <Wire.h>
#include <RTClib.h>
#include <WiFiClientSecure.h>

// LIBRARY: FirebaseClient by Mobizt
#include <FirebaseClient.h>

// Fix: Define Pins for Generic ESP8266 to prevent compilation errors
// User can adjust these mappings later
#ifndef D0
#define D0 16
#define D1 5
#define D2 4
#define D3 0
#define D4 2
#define D5 14
#define D6 12
#define D7 13
#define D8 15
#endif

// Fix: 'Firebase' is not a namespace in the new library
// using namespace Firebase; 

// ---------------- CONFIGURACIÓN FIREBASE ----------------
#define API_KEY "AIzaSyDw09rkePPjrU-AJbj-nN_K-2v5ZPvNY-w"
#define DATABASE_URL "https://pildhora-app2-default-rtdb.firebaseio.com"

// ---------------- ID DEL DISPOSITIVO ----------------
#define DEVICE_ID "DEVICE-001"

// ---------------- WIFI (Hardcoded por ahora) ----------------
const char* ssid     = "Informatica2043";
const char* wifiPassword = "Info20432025+";

// ---------------- PINOUT ----------------
#define PIN_SERVO    D4
#define PIN_NEOPIXEL D5
#define PIN_BUZZER   D7
#define PIN_BTN      D6
#define PIN_SENSOR   D8

// ---------------- ESTRUCTURA DE CONFIGURACIÓN ----------------
struct UserConfig {
  char email[64];
  char password[64];
  bool configured;
};

UserConfig deviceConfig;
bool inConfigMode = false;

// ---------------- OBJETOS ----------------
Servo servo;
Adafruit_NeoPixel strip(1, PIN_NEOPIXEL, NEO_GRB + NEO_KHZ800);
RTC_DS3231 rtcModule;
ESP8266WebServer server(80);

// FirebaseClient objects
WiFiClientSecure ssl_client;
DefaultNetwork network; 
AsyncClientClass aClient(ssl_client, getNetwork(network));

FirebaseApp app;
RealtimeDatabase Database;
AsyncResult result;
NoAuth noAuth;
UserAuth userAuth(API_KEY, deviceConfig.email, deviceConfig.password);

unsigned long sendDataPrevMillis = 0;
bool signupOK = false;

// Estado del dispositivo
String currentStatus = "idle"; 
int batteryLevel = 100; 
bool isAlarmActive = false;

// Servo setup
const int SERVO_STOP = 1500;
const int SERVO_CW   = 1525;

// ---------------- PROTOTIPOS ----------------
void girar();
void stopServo();
void luzRoja();
void luzVerde();
void buzzerOn();
void handleAction(String actionType, String actionId, String jsonPayload);
void updateDeviceState();
void printError(int code, const String &msg);
void loadConfig();
void saveConfig();
void clearConfig();
void handleSetupAPI(); 
void handleRoot();
void handleSetup();
void handleSave();

// ---------------- SETUP ----------------
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\nIniciando PILDHORA Device...");

  // --- EEPROM INIT ---
  EEPROM.begin(512);

  // --- HARDWARE INIT ---
  Wire.begin(D3, D2);
  if (!rtcModule.begin()) {
    Serial.println("ERROR: No se detecta el RTC");
  } else {
    Serial.println("RTC OK");
  }

  servo.attach(PIN_SERVO);
  servo.writeMicroseconds(SERVO_STOP);

  strip.begin();
  strip.clear();
  strip.show();

  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_BTN, INPUT_PULLUP);
  pinMode(PIN_SENSOR, INPUT_PULLUP);

  // --- CHECK RESET (Mantener botón al inicio para borrar config) ---
  if (digitalRead(PIN_BTN) == LOW) {
    Serial.println("Boton presionado: Borrando configuracion...");
    luzRoja(); // Feedback visual
    clearConfig();
    delay(1000);
  }

  // --- CARGAR CONFIGURACIÓN ---
  loadConfig();

  if (!deviceConfig.configured) {
    // --- MODO CONFIGURACIÓN (AP) ---
    Serial.println("Modo Configuracion: Iniciando AP...");
    inConfigMode = true;
    
    WiFi.mode(WIFI_AP);
    WiFi.softAP("PILDHORA-SETUP", "12345678");
    
    Serial.print("AP IP: ");
    Serial.println(WiFi.softAPIP());

    server.on("/api/setup", HTTP_POST, handleSetupAPI);
    server.on("/", handleRoot);
    server.on("/setup", handleSetup); // Fallback form
    server.on("/save", handleSave);
    
    server.begin();
    Serial.println("Servidor Web iniciado. Esperando configuracion...");
    
    // Indicar modo config con luz azul
    strip.setPixelColor(0, strip.Color(0, 0, 255));
    strip.show();

  } else {
    // --- MODO NORMAL (Station) ---
    Serial.println("Configuracion encontrada.");
    Serial.print("Email: "); Serial.println(deviceConfig.email);
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, wifiPassword);
    Serial.print("Conectando a WiFi");
    
    int retries = 0;
    while (WiFi.status() != WL_CONNECTED && retries < 30) {
      Serial.print(".");
      delay(500);
      retries++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nConectado con IP: ");
      Serial.println(WiFi.localIP());

      // --- FIREBASE INIT (New Library) ---
      ssl_client.setInsecure();
      
      Serial.println("Inicializando Firebase...");
      
      // Re-initialize auth with loaded config
      userAuth = UserAuth(API_KEY, deviceConfig.email, deviceConfig.password);
      
      initializeApp(aClient, app, getAuth(userAuth));

      // Bind the app to the Database service
      app.getApp<RealtimeDatabase>(Database);
      Database.url(DATABASE_URL);

      // Wait for authentication
      Serial.println("Autenticando...");
      
      signupOK = true;
      luzVerde();

      // --- STREAM SETUP ---
      String actionPath = "/devices/" + String(DEVICE_ID) + "/actions";
      
      // Stream callback
      Database.get(aClient, actionPath, [](AsyncResult &aResult) {
          if (aResult.isEvent()) {
              // Fix: AsyncResult does not have eventName() in this version
              Serial.printf("Stream event: %s\n", aResult.path().c_str());
              
              String payload = aResult.payload();
              String path = aResult.path(); 
              
              if (payload.indexOf("\"status\":\"pending\"") > 0) {
                  int typeIdx = payload.indexOf("\"actionType\":\"");
                  if (typeIdx > 0) {
                      int start = typeIdx + 14;
                      int end = payload.indexOf("\"", start);
                      String actionType = payload.substring(start, end);
                      
                      String actionId = path;
                      actionId.replace("/", "");
                      
                      if (actionId.length() > 0) {
                          Serial.println("Accion detectada: " + actionType);
                          handleAction(actionType, actionId, payload);
                      }
                  }
              }
          }
      });
      
      Serial.println("Escuchando acciones en: " + actionPath);

    } else {
      Serial.println("\nFallo conexion WiFi.");
    }
  }
}

// ---------------- LOOP ----------------
void loop() {
  // Must call loop() for async client
  app.loop();
  Database.loop();

  if (inConfigMode) {
    server.handleClient();
    // Parpadeo azul lento
    if ((millis() / 500) % 2 == 0) strip.setPixelColor(0, strip.Color(0, 0, 50));
    else strip.setPixelColor(0, 0);
    strip.show();
  } else {
    // Modo Normal
    if (app.ready() && signupOK) {
      if (millis() - sendDataPrevMillis > 5000 || sendDataPrevMillis == 0) {
        sendDataPrevMillis = millis();
        updateDeviceState();
      }
    }
    
    // Reset manual en runtime (mantener 5s)
    if (digitalRead(PIN_BTN) == LOW) {
      delay(100);
      if (digitalRead(PIN_BTN) == LOW) { // Debounce
        unsigned long pressTime = millis();
        while(digitalRead(PIN_BTN) == LOW) {
          if (millis() - pressTime > 5000) {
            luzRoja();
            clearConfig();
            ESP.restart();
          }
        }
      }
    }
  }
}

// ---------------- WEB SERVER HANDLERS ----------------

void handleRoot() {
  server.send(200, "text/plain", "PILDHORA Device Setup. Use App to configure.");
}

void handleSetup() {
  String html = "<html><body><h1>Configuracion PILDHORA</h1>";
  html += "<form action='/save' method='POST'>";
  html += "Email: <input type='text' name='email'><br>";
  html += "Password: <input type='password' name='password'><br>";
  html += "<input type='submit' value='Guardar'>";
  html += "</form></body></html>";
  server.send(200, "text/html", html);
}

void handleSave() {
  if (server.hasArg("email") && server.hasArg("password")) {
    String email = server.arg("email");
    String pass = server.arg("password");
    
    email.toCharArray(deviceConfig.email, 64);
    pass.toCharArray(deviceConfig.password, 64);
    deviceConfig.configured = true;
    
    saveConfig();
    
    server.send(200, "text/html", "<h1>Guardado! Reiniciando...</h1>");
    delay(1000);
    ESP.restart();
  } else {
    server.send(400, "text/plain", "Faltan datos");
  }
}

void handleSetupAPI() {
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    String email = "";
    String pass = "";
    
    int emailIdx = body.indexOf("\"email\":\"");
    if (emailIdx > 0) {
        int start = emailIdx + 9;
        int end = body.indexOf("\"", start);
        email = body.substring(start, end);
    }
    
    int passIdx = body.indexOf("\"password\":\"");
    if (passIdx > 0) {
        int start = passIdx + 12;
        int end = body.indexOf("\"", start);
        pass = body.substring(start, end);
    }
    
    if (email.length() > 0 && pass.length() > 0) {
      email.toCharArray(deviceConfig.email, 64);
      pass.toCharArray(deviceConfig.password, 64);
      deviceConfig.configured = true;
      
      saveConfig();
      
      server.send(200, "application/json", "{\"status\":\"success\",\"message\":\"Configuration saved\"}");
      delay(1000);
      ESP.restart();
    } else {
      server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"Missing email or password\"}");
    }
  } else {
    server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"No body received\"}");
  }
}

// ---------------- EEPROM HELPERS ----------------

void loadConfig() {
  EEPROM.get(0, deviceConfig);
  if (deviceConfig.email[0] == 0xFF || deviceConfig.email[0] == 0) {
    deviceConfig.configured = false;
  }
}

void saveConfig() {
  EEPROM.put(0, deviceConfig);
  EEPROM.commit();
}

void clearConfig() {
  for (int i = 0; i < 512; i++) {
    EEPROM.write(i, 0);
  }
  EEPROM.commit();
  Serial.println("Configuracion borrada.");
}

// ---------------- FIREBASE HANDLERS ----------------

void printError(int code, const String &msg) {
    Serial.printf("Error, msg: %s, code: %d\n", msg.c_str(), code);
}

void handleAction(String actionType, String actionId, String jsonPayload) {
  if (actionType == "test_alarm") {
    currentStatus = "alarm_active";
    updateDeviceState();
    buzzerOn();
    luzRoja();
    currentStatus = "idle";
  } 
  else if (actionType == "dispense_dose") {
    currentStatus = "dispensing";
    updateDeviceState();
    girar();
    currentStatus = "idle";
  }
  else if (actionType == "clear_alarm") {
    stopServo();
    strip.clear();
    strip.show();
    digitalWrite(PIN_BUZZER, LOW);
    currentStatus = "idle";
  }
  else if (actionType == "check_status") {
    updateDeviceState();
  }
  else if (actionType == "sync_time") {
      int reqIdx = jsonPayload.indexOf("\"requestedAt\":");
      if (reqIdx > 0) {
          int start = reqIdx + 14;
          int end = jsonPayload.indexOf(",", start);
          if (end == -1) end = jsonPayload.indexOf("}", start);
          String tsStr = jsonPayload.substring(start, end);
          double ts = tsStr.toDouble();
          unsigned long timestamp = ts / 1000;
          rtcModule.adjust(DateTime(timestamp));
          Serial.println("RTC Sincronizado");
          luzVerde();
      }
  }
  
  String path = "/devices/" + String(DEVICE_ID) + "/actions/" + actionId;
  
  // Use String for JSON to avoid JsonWriter issues
  String json = "{\"status\":\"completed\",\"completedAt\":" + String((int)(millis() / 1000)) + "}";
  
  Database.update(aClient, path, object_t(json), nullptr);
  
  updateDeviceState();
}

void updateDeviceState() {
  String path = "/devices/" + String(DEVICE_ID) + "/state";
  
  bool sensorBlocked = (digitalRead(PIN_SENSOR) == LOW);
  
  // Construct JSON string manually
  String json = "{";
  json += "\"is_online\":true,";
  json += "\"battery_level\":" + String(batteryLevel) + ",";
  json += "\"current_status\":\"" + currentStatus + "\",";
  json += "\"wifi_signal_strength\":" + String(WiFi.RSSI()) + ",";
  json += "\"sensor_blocked\":" + String(sensorBlocked ? "true" : "false");
  // Note: last_seen timestamp is tricky with manual string if we want ServerValue.TIMESTAMP
  // We can set it separately or use the object_t helper if it works.
  json += "}";
  
  Database.set(aClient, path, object_t(json), nullptr);
  
  // Set timestamp separately
  // Fix: object_t constructor for server value needs a JSON string
  Database.set(aClient, path + "/last_seen", object_t("{\".sv\": \"timestamp\"}"), nullptr);
}

// ---------------- FUNCIONES DE HARDWARE ----------------

void girar() {
  Serial.println("GIRAR: Inicio");
  servo.writeMicroseconds(SERVO_CW);
  unsigned long t0 = millis();
  while (digitalRead(PIN_SENSOR) == HIGH) {
    if (millis() - t0 > 8000) break;
    delay(10);
  }
  stopServo();
  Serial.println("GIRAR: Fin");
}

void stopServo() {
  servo.writeMicroseconds(SERVO_STOP);
}

void luzRoja() {
  Serial.println("LUZ ROJA");
  for(int i=0; i<3; i++) {
    strip.setPixelColor(0, strip.Color(255, 0, 0));
    strip.show();
    delay(300);
    strip.setPixelColor(0, 0);
    strip.show();
    delay(300);
  }
}

void luzVerde() {
  Serial.println("LUZ VERDE");
  strip.setPixelColor(0, strip.Color(0, 255, 0));
  strip.show();
  delay(1000);
  strip.setPixelColor(0, 0);
  strip.show();
}

void buzzerOn() {
  Serial.println("BUZZER ON");
  digitalWrite(PIN_BUZZER, HIGH);
  delay(1000);
  digitalWrite(PIN_BUZZER, LOW);
}
