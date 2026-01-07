#include <Arduino.h>
#include <Servo.h>
#include <Adafruit_NeoPixel.h>
#include <Wire.h>
#include <RTClib.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WiFiClientSecure.h>

// ---------------- PINOUT ----------------
#define PIN_SERVO    D4
#define PIN_NEOPIXEL D5
#define PIN_BUZZER   D7
#define PIN_BTN      D6
#define PIN_SENSOR   D8

// ---------------- WIFI (MODO ESTACIÓN) ----------------
#define WIFI_SSID     "PALOMBO-PC_Network"
#define WIFI_PASSWORD "mariocanalla47"

// ---------------- FIREBASE (REST API) ----------------
// Host sin "https://" y sin barra final
// NOTA: Asegurate que este host coincida con tu Firebase RTDB
#define FIREBASE_HOST   "devices-m1947.firebaseio.com"
// Database Secret (legacy token)
#define FIREBASE_SECRET "Af53UVDofDdlEN1OlTabfM4Tp98mkEK3Uuk24ZWc"

// ID del dispositivo - debe coincidir con el ID en Firebase
String DEVICE_ID = "TEST-DEVICE-001";

// ---------------- WEB SERVER ----------------
ESP8266WebServer server(80);

// ---------------- OBJETOS ----------------
Servo servo;
Adafruit_NeoPixel strip(1, PIN_NEOPIXEL, NEO_GRB + NEO_KHZ800);
RTC_DS3231 rtcModule;
WiFiClientSecure fbClient;

// Servo FS90R
const int SERVO_STOP = 1500;
const int SERVO_CW   = 1525;   // ultra lento
const int SERVO_20   = 1540;   // ~20% de velocidad

String input;  // buffer de comandos

// ---------------- MODO PASO ----------------
bool modoPaso = false;
unsigned long pasoIgnoreMs = 500; // por defecto 500 ms

// ---------------- ESTADO FIREBASE / COMANDOS ----------------
// Estructura para almacenar comandos de Firebase
struct FirebaseCommands {
  bool topo;
  bool buzzer;
  bool led;
  String ledColor;
  bool reboot;
};

bool topoFlag = false;      // comando topo
bool buzzerFlag = false;    // comando buzzer
bool ledFlag = false;       // comando led
String ledColorStr = "";    // comando ledColor "R,G,B"
bool rebootFlag = false;    // comando reboot
unsigned long lastCommandPoll = 0;
unsigned long lastStatusPrint = 0;

// ---------------- HTML ----------------
const char MAIN_page[] PROGMEM = R"=====( 
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>PILDHORA Control</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #020617;
      color: #e5e7eb;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .card {
      background: #020617;
      padding: 24px 28px 30px 28px;
      border-radius: 20px;
      box-shadow: 0 18px 40px rgba(0,0,0,0.8);
      max-width: 420px;
      width: 100%;
      border: 1px solid #1f2937;
    }
    h1 {
      margin-top: 0;
      font-size: 26px;
      color: #fbbf24;
      text-align: center;
    }
    h2 {
      font-size: 16px;
      color: #e5e7eb;
      margin-bottom: 8px;
      margin-top: 18px;
    }
    p {
      font-size: 13px;
      color: #9ca3af;
      margin-bottom: 10px;
      margin-top: 4px;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      background: #111827;
      color: #a5b4fc;
      margin-bottom: 10px;
    }
    .section {
      background: #020617;
      border-radius: 14px;
      padding: 12px 14px 14px 14px;
      margin-bottom: 10px;
      border: 1px solid #1f2937;
    }
    .btn-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 6px;
    }
    button {
      border: none;
      border-radius: 999px;
      padding: 9px 10px;
      font-size: 13px;
      cursor: pointer;
      font-weight: 600;
      transition: transform 0.08s ease, box-shadow 0.08s ease, opacity 0.1s;
    }
    button:active {
      transform: translateY(1px) scale(0.98);
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      opacity: 0.9;
    }
    .btn-girar {
      background: linear-gradient(135deg,#22c55e,#4ade80);
      color: #052e16;
    }
    .btn-roja {
      background: linear-gradient(135deg,#ef4444,#f97373);
      color: #7f1d1d;
    }
    .btn-verde {
      background: linear-gradient(135deg,#22c55e,#bbf7d0);
      color: #064e3b;
    }
    .btn-buzzer {
      background: linear-gradient(135deg,#38bdf8,#0ea5e9);
      color: #02131e;
    }
    .btn-topo {
      background: linear-gradient(135deg,#f97316,#fb923c);
      color: #7c2d12;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
    }
    .row label {
      font-size: 12px;
      color: #9ca3af;
      min-width: 60px;
    }
    input[type="range"] {
      width: 100%;
    }
    input[type="number"] {
      width: 80px;
      padding: 4px 6px;
      border-radius: 8px;
      border: 1px solid #1f2937;
      background: #020617;
      color: #e5e7eb;
      font-size: 12px;
    }
    .status {
      margin-top: 8px;
      font-size: 11px;
      color: #9ca3af;
    }
    .status span {
      color: #22c55e;
      font-weight: 600;
    }
    .pill-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
      font-size: 12px;
    }
    .pill-toggle input {
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>PILDHORA</h1>
    <div class="badge">Control local + Firebase</div>

    <div class="section">
      <h2>Acciones rápidas</h2>
      <p>Comandos directos al pastillero.</p>
      <div class="btn-grid">
        <button class="btn-girar" onclick="sendCmd('/girar')">Girar</button>
        <button class="btn-roja" onclick="sendCmd('/luzroja')">Luz roja</button>
        <button class="btn-verde" onclick="sendCmd('/luzverde')">Luz verde</button>
        <button class="btn-buzzer" onclick="sendCmd('/buzzer')">Buzzer</button>
      </div>
      <div style="margin-top:6px;">
        <button class="btn-topo" style="width:100%;" onclick="sendCmd('/topo')">Modo TOPO</button>
      </div>
    </div>

    <div class="section">
      <h2>Neopixel</h2>
      <p>Elegí color manual (R / G / B).</p>
      <div class="row">
        <label>Rojo</label>
        <input type="range" id="r" min="0" max="255" value="255">
      </div>
      <div class="row">
        <label>Verde</label>
        <input type="range" id="g" min="0" max="255" value="0">
      </div>
      <div class="row">
        <label>Azul</label>
        <input type="range" id="b" min="0" max="255" value="0">
      </div>
      <div class="row" style="margin-top:8px;">
        <button class="btn-verde" style="flex:1;" onclick="setColor()">Aplicar</button>
        <button class="btn-roja" style="flex:1;" onclick="sendCmd('/clearneo')">Apagar</button>
      </div>
    </div>

    <div class="section">
      <h2>Servo</h2>
      <p>Control de velocidad (CW/Stop).</p>
      <div class="row">
        <label>Velocidad</label>
        <input type="range" id="servoSpeed" min="0" max="100" value="20">
      </div>
      <div class="row" style="margin-top:8px;">
        <button class="btn-girar" style="flex:1;" onclick="setServo()">Aplicar</button>
        <button class="btn-buzzer" style="flex:1;" onclick="sendCmd('/servostop')">Stop</button>
      </div>
      <div class="pill-toggle">
        <input type="checkbox" id="modoPaso" onchange="updatePaso()">
        <label for="modoPaso">Modo paso (ignora sensor al arrancar)</label>
      </div>
      <div class="row">
        <label>Ignorar (ms)</label>
        <input type="number" id="pasoTime" value="500" min="0">
      </div>
    </div>

    <div class="section">
      <h2>Buzzer</h2>
      <p>Nivel aproximado de volumen (PWM).</p>
      <div class="row">
        <label>Nivel</label>
        <input type="range" id="buzzLevel" min="0" max="1023" value="1023">
      </div>
      <div class="row" style="margin-top:8px;">
        <button class="btn-buzzer" style="flex:1;" onclick="setBuzzer()">Aplicar</button>
        <button class="btn-roja" style="flex:1;" onclick="sendCmd('/buzzeroff')">Apagar</button>
      </div>
    </div>

    <div class="status" id="statusText">
      Estado: <span>listo</span>
    </div>
  </div>

  <script>
    function sendCmd(path) {
      const status = document.getElementById("statusText");
      status.innerHTML = 'Estado: <span>enviando...</span>';
      fetch(path)
        .then(r => r.text())
        .then(t => {
          status.innerHTML = 'Estado: <span>' + t + '</span>';
        })
        .catch(() => {
          status.innerHTML = 'Estado: <span style="color:#ef4444">error</span>';
        });
    }

    function setColor() {
      const r = document.getElementById("r").value;
      const g = document.getElementById("g").value;
      const b = document.getElementById("b").value;
      sendCmd('/setcolor?r=' + r + '&g=' + g + '&b=' + b);
    }

    function setServo() {
      const v = document.getElementById("servoSpeed").value;
      sendCmd('/setservo?speed=' + v);
    }

    function updatePaso() {
      const en = document.getElementById("modoPaso").checked ? 1 : 0;
      const t  = document.getElementById("pasoTime").value;
      sendCmd('/setpaso?en=' + en + '&t=' + t);
    }

    function setBuzzer() {
      const lvl = document.getElementById("buzzLevel").value;
      sendCmd('/setbuzz?lvl=' + lvl);
    }
  </script>
</body>
</html>
)=====";

// ---------------- PROTOTIPOS ----------------
void leerSerial();
void procesarComando(String cmd);
void girar();
void stopServo();
void luzRoja();
void luzVerde();
void buzzerOn();
void sensorEstado();
void rtcHora();
void rtcSetDesdeString(const String& cmd);
void topo();
void handleButtonWhite();
bool firebaseGetTopo();
void firebaseResetTopo();
void handleFirebase();

// ---------------- SETUP ----------------

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println();
  Serial.println("PILDHORA v-Firebase");

  // I2C para RTC
  Wire.begin(D3, D2);

  if (!rtcModule.begin()) {
    Serial.println("ERROR: No se detecta el RTC");
  } else {
    Serial.println("RTC OK");
  }

  // Servo
  servo.attach(PIN_SERVO);
  servo.writeMicroseconds(SERVO_STOP);

  // NeoPixel
  strip.begin();
  strip.clear();
  strip.show();

  // Buzzer
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  // Pulsador
  pinMode(PIN_BTN, INPUT_PULLUP);

  // Sensor óptico (LOW = detectado)
  pinMode(PIN_SENSOR, INPUT_PULLUP);

  // WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando a WiFi: ");
  Serial.println(WIFI_SSID);

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.print("WiFi conectado. IP: ");
  Serial.println(WiFi.localIP());

  // Cliente HTTPS para Firebase
  fbClient.setInsecure(); // aceptar cualquier cert
  fbClient.setBufferSizes(1024, 1024);

  // WebServer
  server.on("/", []() { server.send_P(200, "text/html", MAIN_page); });
  server.on("/girar", []() { girar(); server.send(200, "text/plain", "girar OK"); });
  server.on("/luzroja", []() { luzRoja(); server.send(200, "text/plain", "luz roja OK"); });
  server.on("/luzverde", []() { luzVerde(); server.send(200, "text/plain", "luz verde OK"); });
  server.on("/buzzer", []() { buzzerOn(); server.send(200, "text/plain", "buzzer OK"); });
  server.on("/topo", []() { topo(); server.send(200, "text/plain", "topo OK"); });

  // Neopixel avanzado
  server.on("/setcolor", []() {
    if (server.hasArg("r") && server.hasArg("g") && server.hasArg("b")) {
      int r = server.arg("r").toInt();
      int g = server.arg("g").toInt();
      int b = server.arg("b").toInt();
      strip.setPixelColor(0, strip.Color(r, g, b));
      strip.show();
      server.send(200, "text/plain", "color OK");
    } else {
      server.send(400, "text/plain", "faltan parametros");
    }
  });

  server.on("/clearneo", []() {
    strip.clear();
    strip.show();
    server.send(200, "text/plain", "neo off");
  });

  // Servo desde web (0..100)
  server.on("/setservo", []() {
    if (server.hasArg("speed")) {
      int sp = server.arg("speed").toInt();
      if (sp <= 0) {
        stopServo();
        server.send(200, "text/plain", "servo stop");
      } else {
        int us = SERVO_STOP + (sp * 2); // 0..100 → 0..200us aprox
        if (us < SERVO_STOP) us = SERVO_STOP;
        if (us > 1700) us = 1700;
        servo.writeMicroseconds(us);
        server.send(200, "text/plain", "servo speed=" + String(sp));
      }
    } else {
      server.send(400, "text/plain", "faltan parametros");
    }
  });

  server.on("/servostop", []() {
    stopServo();
    server.send(200, "text/plain", "servo stop");
  });

  // Modo paso on/off + tiempo ignore
  server.on("/setpaso", []() {
    if (server.hasArg("en")) {
      int en = server.arg("en").toInt();
      modoPaso = (en == 1);
    }
    if (server.hasArg("t")) {
      unsigned long t = server.arg("t").toInt();
      pasoIgnoreMs = t;
    }
    String msg = "paso=" + String(modoPaso ? "ON" : "OFF") + " t=" + String(pasoIgnoreMs);
    server.send(200, "text/plain", msg);
  });

  // Buzzer volumen (PWM)
  server.on("/setbuzz", []() {
    if (server.hasArg("lvl")) {
      int lvl = server.arg("lvl").toInt();
      if (lvl < 0) lvl = 0;
      if (lvl > 1023) lvl = 1023;
      analogWrite(PIN_BUZZER, lvl);
      server.send(200, "text/plain", "buzzer PWM=" + String(lvl));
    } else {
      server.send(400, "text/plain", "faltan parametros");
    }
  });

  server.on("/buzzeroff", []() {
    analogWrite(PIN_BUZZER, 0);
    digitalWrite(PIN_BUZZER, LOW);
    server.send(200, "text/plain", "buzzer off");
  });

  server.begin();
  Serial.println("Servidor web iniciado.");

  Serial.println("Comandos Serial: girar, luz, luzverde, buzzer, sensor, rtc, setrtc H M S, paso on/off, paso t N, topo, stop");
}

// ---------------- LOOP ----------------

void loop() {
  leerSerial();
  server.handleClient();
  handleButtonWhite();
  handleFirebase();
}

// --------------- MANEJO SERIAL ----------------

void leerSerial() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (input.length() > 0) {
        procesarComando(input);
        input = "";
      }
    } else {
      input += c;
    }
  }
}

void procesarComando(String cmd) {
  cmd.trim();
  cmd.toLowerCase();

  if (cmd == "girar") girar();
  else if (cmd == "luz") luzRoja();
  else if (cmd == "luzverde") luzVerde();
  else if (cmd == "buzzer") buzzerOn();
  else if (cmd == "sensor") sensorEstado();
  else if (cmd == "rtc") rtcHora();
  else if (cmd.startsWith("setrtc")) rtcSetDesdeString(cmd);
  else if (cmd == "stop") stopServo();
  else if (cmd == "paso on") { modoPaso = true; Serial.println("Modo paso: ON"); }
  else if (cmd == "paso off") { modoPaso = false; Serial.println("Modo paso: OFF"); }
  else if (cmd.startsWith("paso t")) {
    int t;
    if (sscanf(cmd.c_str(), "paso t %d", &t) == 1) {
      pasoIgnoreMs = t;
      Serial.print("pasoIgnoreMs = ");
      Serial.println(pasoIgnoreMs);
    }
  }
  else if (cmd == "topo") topo();
  else {
    Serial.print("Comando desconocido: ");
    Serial.println(cmd);
  }
}

// --------------- FUNCIONES DE HARDWARE ----------------

// 🌀 GIRAR hasta que el sensor detecte algo
// En modoPaso: ignora sensor los primeros pasoIgnoreMs ms
void girar() {
  Serial.println("GIRAR: Inicio");
  servo.writeMicroseconds(SERVO_CW);
  unsigned long t0 = millis();

  while (true) {
    unsigned long now = millis();

    if (modoPaso) {
      if (now - t0 > pasoIgnoreMs) {
        if (digitalRead(PIN_SENSOR) == LOW) {
          Serial.println("GIRAR: sensor detectado (modo paso)");
          break;
        }
      }
    } else {
      if (digitalRead(PIN_SENSOR) == LOW) {
        Serial.println("GIRAR: sensor detectado");
        break;
      }
    }

    if (now - t0 > 8000) {
      Serial.println("GIRAR: Timeout");
      break;
    }
    delay(5);
  }

  stopServo();
  Serial.println("GIRAR: Fin");
}

void stopServo() {
  servo.writeMicroseconds(SERVO_STOP);
}

// 🔴 NeoPixel rojo parpadeante 2s
void luzRoja() {
  Serial.println("LUZ ROJA: Inicio");
  unsigned long t0 = millis();
  bool onState = false;

  while (millis() - t0 < 2000) {
    onState = !onState;

    if (onState) strip.setPixelColor(0, strip.Color(255, 0, 0));
    else strip.setPixelColor(0, 0);

    strip.show();
    delay(100);
  }

  strip.clear();
  strip.show();
  Serial.println("LUZ ROJA: Fin");
}

// 🟢 NeoPixel verde parpadeante 2s
void luzVerde() {
  Serial.println("LUZ VERDE: Inicio");
  unsigned long t0 = millis();
  bool onState = false;

  while (millis() - t0 < 2000) {
    onState = !onState;

    if (onState) strip.setPixelColor(0, strip.Color(0, 255, 0));
    else strip.setPixelColor(0, 0);

    strip.show();
    delay(100);
  }

  strip.clear();
  strip.show();
  Serial.println("LUZ VERDE: Fin");
}

// 🔊 Buzzer 3s (digital)
void buzzerOn() {
  Serial.println("BUZZER: Inicio");
  digitalWrite(PIN_BUZZER, HIGH);
  delay(3000);
  digitalWrite(PIN_BUZZER, LOW);
  Serial.println("BUZZER: Fin");
}

// 👁️ Estado del sensor óptico
void sensorEstado() {
  bool bloqueado = (digitalRead(PIN_SENSOR) == LOW);

  if (bloqueado) Serial.println("SENSOR: BLOQUEADO");
  else Serial.println("SENSOR: LIBRE");
}

// 🕒 RTC → hora actual
void rtcHora() {
  DateTime now = rtcModule.now();

  Serial.print("RTC: ");
  if (now.hour() < 10) Serial.print('0');
  Serial.print(now.hour());
  Serial.print(":");

  if (now.minute() < 10) Serial.print('0');
  Serial.print(now.minute());
  Serial.print(":");

  if (now.second() < 10) Serial.print('0');
  Serial.println(now.second());
}

// 🕒 Programar hora actual del RTC desde Serial: setrtc HH MM SS
void rtcSetDesdeString(const String& cmd) {
  int h, m, s;
  if (sscanf(cmd.c_str(), "setrtc %d %d %d", &h, &m, &s) == 3) {
    DateTime now = rtcModule.now();
    rtcModule.adjust(DateTime(now.year(), now.month(), now.day(), h, m, s));
    Serial.print("RTC ajustado a: ");
    if (h < 10) Serial.print('0');
    Serial.print(h); Serial.print(':');
    if (m < 10) Serial.print('0');
    Serial.print(m); Serial.print(':');
    if (s < 10) Serial.print('0');
    Serial.println(s);
  } else {
    Serial.println("Uso: setrtc HH MM SS");
  }
}

// 🌕 Función TOPO
void topo() {
  Serial.println("TOPO: inicio");

  // Fase 1: neopixel rojo fuerte parpadeando + buzzer hasta que se apriete el botón
  unsigned long start = millis();
  while (digitalRead(PIN_BTN) == HIGH) {
    if (millis() - start > 30000) {
      break;
    }
    strip.setPixelColor(0, strip.Color(255, 0, 0));
    strip.show();
    digitalWrite(PIN_BUZZER, HIGH);
    delay(150);
    strip.setPixelColor(0, 0);
    strip.show();
    digitalWrite(PIN_BUZZER, LOW);
    delay(150);
  }

  // Esperar que se suelte
  while (digitalRead(PIN_BTN) == LOW) delay(10);

  digitalWrite(PIN_BUZZER, LOW);
  strip.clear();
  strip.show();

  // Fase 2: servo al 20% hasta que el sensor detecte algo
  Serial.println("TOPO: fase 2 (servo 20%)");
  servo.writeMicroseconds(SERVO_20);
  start = millis();
  while (digitalRead(PIN_SENSOR) == HIGH) {
    if (millis() - start > 10000) {
      break;
    }
    delay(10);
  }

  stopServo();

  // Fase 3: neopixel naranja medio hasta que se apriete el botón otra vez
  Serial.println("TOPO: fase 3 (naranja)");
  strip.setPixelColor(0, strip.Color(255, 120, 0));
  strip.show();
  start = millis();
  while (digitalRead(PIN_BTN) == HIGH) {
    if (millis() - start > 30000) {
      break;
    }
    delay(10);
  }
  // Esperar suelta
  while (digitalRead(PIN_BTN) == LOW) delay(10);

  strip.clear();
  strip.show();

  // Fase 4: neopixel verde fuerte parpadeando 5s
  Serial.println("TOPO: fase 4 (verde 5s)");
  unsigned long t0 = millis();
  bool onState = false;

  while (millis() - t0 < 5000) {
    onState = !onState;
    if (onState) strip.setPixelColor(0, strip.Color(0, 255, 0));
    else strip.setPixelColor(0, 0);
    strip.show();
    delay(150);
  }

  strip.clear();
  strip.show();
  digitalWrite(PIN_BUZZER, LOW);
  stopServo();

  Serial.println("TOPO: fin");
}

// Botón físico → Neopixel blanco mientras se mantenga presionado
void handleButtonWhite() {
  static bool prevPressed = false;
  bool pressed = (digitalRead(PIN_BTN) == LOW); // activo en LOW

  if (pressed && !prevPressed) {
    // transición a presionado → encender blanco
    strip.setPixelColor(0, strip.Color(255, 255, 255));
    strip.show();
  } else if (!pressed && prevPressed) {
    // transición a suelto → no tocamos color (para no arruinar otros efectos)
    // Si querés apagarlo al soltar:
    // strip.clear(); strip.show();
  }

  prevPressed = pressed;
}

// ---------------- FIREBASE (REST) ----------------

// Lee todos los comandos de /devices/DEVICE_ID/commands
FirebaseCommands firebaseGetCommands() {
  FirebaseCommands cmds = {false, false, false, "", false};
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Firebase READ: No WiFi");
    return cmds;
  }

  if (!fbClient.connect(FIREBASE_HOST, 443)) {
    Serial.println("Firebase READ: fallo connect()");
    return cmds;
  }

  String path = "/devices/" + DEVICE_ID + "/commands.json?auth=" + FIREBASE_SECRET;

  fbClient.print(String("GET ") + path + " HTTP/1.1\r\n" +
                 "Host: " + FIREBASE_HOST + "\r\n" +
                 "Connection: close\r\n\r\n");

  // Esperar respuesta con timeout
  unsigned long timeout = millis();
  while (fbClient.available() == 0) {
    if (millis() - timeout > 5000) {
      Serial.println("Firebase READ: timeout esperando respuesta");
      fbClient.stop();
      return cmds;
    }
    delay(10);
  }

  // Saltar headers - buscar línea vacía (solo \r\n)
  while (fbClient.connected() || fbClient.available()) {
    String line = fbClient.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) break; // Línea vacía = fin de headers
  }

  // Leer payload JSON
  String payload = "";
  while (fbClient.available()) {
    payload += (char)fbClient.read();
  }
  fbClient.stop();

  payload.trim();
  
  // DEBUG: Print raw payload
  Serial.print("Firebase RAW: [");
  Serial.print(payload);
  Serial.println("]");
  
  // Parse JSON simple (sin librería externa)
  // Formato esperado: {"topo":true,"buzzer":false,"led":false,"ledColor":"255,0,0","reboot":false}
  if (payload.length() > 2 && payload.startsWith("{")) {
    // Parse topo
    if (payload.indexOf("\"topo\":true") >= 0) cmds.topo = true;
    
    // Parse buzzer
    if (payload.indexOf("\"buzzer\":true") >= 0) cmds.buzzer = true;
    
    // Parse led
    if (payload.indexOf("\"led\":true") >= 0) cmds.led = true;
    
    // Parse reboot
    if (payload.indexOf("\"reboot\":true") >= 0) cmds.reboot = true;
    
    // Parse ledColor
    int colorStart = payload.indexOf("\"ledColor\":\"");
    if (colorStart >= 0) {
      colorStart += 12; // longitud de "ledColor":"
      int colorEnd = payload.indexOf("\"", colorStart);
      if (colorEnd > colorStart) {
        cmds.ledColor = payload.substring(colorStart, colorEnd);
      }
    }
  }
  
  Serial.print("Firebase cmds: topo=");
  Serial.print(cmds.topo);
  Serial.print(" buzzer=");
  Serial.print(cmds.buzzer);
  Serial.print(" led=");
  Serial.print(cmds.led);
  Serial.print(" color=");
  Serial.print(cmds.ledColor);
  Serial.print(" reboot=");
  Serial.println(cmds.reboot);
  
  return cmds;
}

// Resetear un comando específico a false
void firebaseResetCommand(String cmdName) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Firebase WRITE: No WiFi");
    return;
  }
  
  if (!fbClient.connect(FIREBASE_HOST, 443)) {
    Serial.println("Firebase WRITE: fallo connect()");
    return;
  }

  String path = "/devices/" + DEVICE_ID + "/commands/" + cmdName + ".json?auth=" + FIREBASE_SECRET;
  String body = "false";

  fbClient.print(String("PUT ") + path + " HTTP/1.1\r\n" +
                 "Host: " + FIREBASE_HOST + "\r\n" +
                 "Content-Type: application/json\r\n" +
                 "Content-Length: " + body.length() + "\r\n" +
                 "Connection: close\r\n\r\n" +
                 body);

  // Leer respuesta
  String statusLine = "";
  if (fbClient.connected()) {
    statusLine = fbClient.readStringUntil('\n');
  }
  
  // Saltar headers y body
  while (fbClient.connected()) {
    String line = fbClient.readStringUntil('\n');
    if (line == "\r" || line.length() == 0) break;
  }
  fbClient.readString();
  fbClient.stop();
  
  bool success = statusLine.indexOf("200") > 0;
  Serial.print("Firebase ");
  Serial.print(cmdName);
  Serial.println(success ? " -> false OK" : " -> false FAILED");
}

// Función helper para parsear color RGB desde string "R,G,B"
void parseRGBColor(String colorStr, int &r, int &g, int &b) {
  r = 0; g = 0; b = 0;
  int firstComma = colorStr.indexOf(',');
  int secondComma = colorStr.indexOf(',', firstComma + 1);
  
  if (firstComma > 0 && secondComma > firstComma) {
    r = colorStr.substring(0, firstComma).toInt();
    g = colorStr.substring(firstComma + 1, secondComma).toInt();
    b = colorStr.substring(secondComma + 1).toInt();
  }
}

// Actualizar estado del dispositivo en Firebase (heartbeat)
void firebaseUpdateState() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!fbClient.connect(FIREBASE_HOST, 443)) {
    Serial.println("Firebase STATE: fallo connect()");
    return;
  }

  String path = "/devices/" + DEVICE_ID + "/state.json?auth=" + FIREBASE_SECRET;
  
  // Crear JSON con estado actual
  unsigned long timestamp = millis();
  String body = "{\"is_online\":true,\"last_seen\":" + String(timestamp) + ",\"ip\":\"" + WiFi.localIP().toString() + "\",\"firmware\":\"v2.0\",\"current_status\":\"IDLE\",\"time_synced\":true}";

  fbClient.print(String("PATCH ") + path + " HTTP/1.1\r\n" +
                 "Host: " + FIREBASE_HOST + "\r\n" +
                 "Content-Type: application/json\r\n" +
                 "Content-Length: " + body.length() + "\r\n" +
                 "Connection: close\r\n\r\n" +
                 body);

  // Saltar respuesta
  while (fbClient.connected()) {
    String line = fbClient.readStringUntil('\n');
    if (line == "\r" || line.length() == 0) break;
  }
  fbClient.stop();
}

// Manejo periódico de Firebase - procesa todos los comandos
void handleFirebase() {
  unsigned long now = millis();
  static unsigned long lastStateUpdate = 0;

  // Poll de comandos cada 2s
  if (now - lastCommandPoll >= 2000) {
    lastCommandPoll = now;

    FirebaseCommands cmds = firebaseGetCommands();
    
    // Procesar comando TOPO (dispensar medicamento)
    if (cmds.topo) {
      Serial.println(">>> Ejecutando TOPO desde Firebase");
      topo();
      delay(500);
      firebaseResetCommand("topo");
    }
    
    // Procesar comando BUZZER
    if (cmds.buzzer) {
      Serial.println(">>> Ejecutando BUZZER desde Firebase");
      buzzerOn();
      firebaseResetCommand("buzzer");
    }
    
    // Procesar comando LED con color
    if (cmds.led && cmds.ledColor.length() > 0) {
      Serial.print(">>> Ejecutando LED COLOR desde Firebase: ");
      Serial.println(cmds.ledColor);
      int r, g, b;
      parseRGBColor(cmds.ledColor, r, g, b);
      strip.setPixelColor(0, strip.Color(r, g, b));
      strip.show();
      firebaseResetCommand("led");
    } else if (cmds.led) {
      // LED sin color específico = blanco
      Serial.println(">>> Ejecutando LED BLANCO desde Firebase");
      strip.setPixelColor(0, strip.Color(255, 255, 255));
      strip.show();
      firebaseResetCommand("led");
    }
    
    // Procesar comando REBOOT
    if (cmds.reboot) {
      Serial.println(">>> REBOOT solicitado desde Firebase");
      firebaseResetCommand("reboot");
      delay(1000);
      ESP.restart();
    }
  }

  // Procesar solicitudes de dispensación
  if (millis() % 2000 < 50) {
    // Poll simple cada ~2s sin depender de lastCommandPoll
    processDispenseRequests();
  }

  // Actualizar estado cada 30s (heartbeat)
  if (now - lastStateUpdate >= 30000) {
    lastStateUpdate = now;
    firebaseUpdateState();
    Serial.println("Firebase: heartbeat enviado");
  }

  // Log cada 30s
  if (now - lastStatusPrint >= 30000) {
    lastStatusPrint = now;
    Serial.print("Device online - IP: ");
    Serial.println(WiFi.localIP());
  }
}

// ---------------- DISPENSE REQUESTS ----------------
// Lee /devices/{DEVICE_ID}/dispenseRequests y procesa la primera solicitud pendiente
void processDispenseRequests() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!fbClient.connect(FIREBASE_HOST, 443)) return;

  String path = "/devices/" + DEVICE_ID + "/dispenseRequests.json?auth=" + FIREBASE_SECRET;
  fbClient.print(String("GET ") + path + " HTTP/1.1\r\n" +
                 "Host: " + FIREBASE_HOST + "\r\n" +
                 "Connection: close\r\n\r\n");

  unsigned long timeout = millis();
  while (fbClient.available() == 0) {
    if (millis() - timeout > 5000) { fbClient.stop(); return; }
    delay(10);
  }
  while (fbClient.connected() || fbClient.available()) {
    String line = fbClient.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) break;
  }
  String payload = "";
  while (fbClient.available()) payload += (char)fbClient.read();
  fbClient.stop();
  payload.trim();

  if (payload.length() < 2 || !payload.startsWith("{")) return;
  // Buscar la primera solicitud: "req_xxx": { ... }
  int keyStart = payload.indexOf('"');
  if (keyStart < 0) return;
  int keyEnd = payload.indexOf('"', keyStart + 1);
  if (keyEnd <= keyStart) return;
  String reqId = payload.substring(keyStart + 1, keyEnd);

  // Ejecutar dispensación
  topo();

  // Escribir evento en dispenseEvents
  if (!fbClient.connect(FIREBASE_HOST, 443)) return;
  String eventId = String(millis());
  String eventPath = "/devices/" + DEVICE_ID + "/dispenseEvents/" + eventId + ".json?auth=" + FIREBASE_SECRET;
  String eventBody = String("{") +
    "\"requestedAt\":" + String(millis()) + "," +
    "\"dispensedAt\":" + String(millis()) + "," +
    "\"ok\":true" +
  "}";
  fbClient.print(String("PUT ") + eventPath + " HTTP/1.1\r\n" +
                 "Host: " + FIREBASE_HOST + "\r\n" +
                 "Content-Type: application/json\r\n" +
                 "Content-Length: " + eventBody.length() + "\r\n" +
                 "Connection: close\r\n\r\n" +
                 eventBody);
  while (fbClient.connected()) {
    String line = fbClient.readStringUntil('\n');
    if (line == "\r" || line.length() == 0) break;
  }
  fbClient.readString();
  fbClient.stop();

  // Borrar la solicitud procesada
  if (!fbClient.connect(FIREBASE_HOST, 443)) return;
  String delPath = "/devices/" + DEVICE_ID + "/dispenseRequests/" + reqId + ".json?auth=" + FIREBASE_SECRET;
  fbClient.print(String("DELETE ") + delPath + " HTTP/1.1\r\n" +
                 "Host: " + FIREBASE_HOST + "\r\n" +
                 "Connection: close\r\n\r\n");
  while (fbClient.connected()) {
    String line = fbClient.readStringUntil('\n');
    if (line == "\r" || line.length() == 0) break;
  }
  fbClient.readString();
  fbClient.stop();
}
