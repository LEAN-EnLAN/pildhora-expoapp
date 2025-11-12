#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>

// Wi-Fi credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase project credentials
#define API_KEY "YOUR_API_KEY"
#define FIREBASE_HOST "YOUR_FIREBASE_PROJECT_ID.firebaseio.com"
#define USER_EMAIL "YOUR_USER_EMAIL"
#define USER_PASSWORD "YOUR_USER_PASSWORD"

// Device ID
#define DEVICE_ID "DEVICE-001"

FirebaseData firebaseData;

void setup() {
  Serial.begin(115200);

  // Connect to Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());

  // Initialize Firebase
  Firebase.begin(FIREBASE_HOST, API_KEY);
  Firebase.reconnectWiFi(true);

  // Sign up user if not already exists
  if (Firebase.signUp(firebaseData, USER_EMAIL, USER_PASSWORD)) {
    Serial.println("User signed up successfully");
  } else {
    Serial.println("User sign up failed: " + firebaseData.errorReason());
  }

  // Sign in user
  if (Firebase.signIn(firebaseData, USER_EMAIL, USER_PASSWORD)) {
    Serial.println("User signed in successfully");
  } else {
    Serial.println("User sign in failed: " + firebaseData.errorReason());
  }

  // Set up Firebase stream
  if (!Firebase.beginStream(firebaseData, "/devices/" + String(DEVICE_ID))) {
    Serial.println("Could not begin stream");
    Serial.println("REASON: " + firebaseData.errorReason());
    Serial.println();
  }
}

unsigned long lastStatusUpdateTime = 0;

void loop() {
  if (Firebase.readStream(firebaseData)) {
    if (firebaseData.streamPath() == "/dispense") {
      if (firebaseData.dataType() == "boolean") {
        if (firebaseData.boolData()) {
          dispenseMedication();
          Firebase.setBool(firebaseData, "/devices/" + String(DEVICE_ID) + "/dispense", false);
        }
      }
    }
  }

  if (millis() - lastStatusUpdateTime > 5000) {
    lastStatusUpdateTime = millis();
    Firebase.setString(firebaseData, "/devices/" + String(DEVICE_ID) + "/status", "online");
  }
}

void dispenseMedication() {
  // This function will be implemented later to control the dispensing mechanism.
  Serial.println("Dispensing medication...");
}
