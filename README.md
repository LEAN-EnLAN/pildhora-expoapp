# Pildhora App - Pastillero Inteligente

Un sistema completo de gestión de pastilleros inteligentes con interfaces separadas para pacientes mayores y cuidadores de la salud.

## Características

### Aplicación para Pacientes
- Recordatorios de medicación simples
- Confirmación de toma con un solo toque
- Estado de conectividad del pastillero
- Interfaz de usuario accesible para personas mayores

### Aplicación para Cuidadores
- Gestión completa de medicamentos (CRUD)
- Monitoreo de pacientes en tiempo real
- Informes de adherencia impulsados por IA
- Programación y seguimiento de tareas
- Panel de control para múltiples pacientes

## Tecnología Utilizada

- **Framework**: React Native con Expo
- **Navegación**: Expo Router
- **Gestión de Estado**: Redux Toolkit + Redux Persist
- **Backend**: Google Firebase (Auth, Firestore, Functions)
- **IA**: Google Vertex AI (Gemini)
- **Hardware**: Conectividad BLE con ESP8266
- **UI**: React Native Elements + React Native Paper

## Cómo Empezar

1. **Prerrequisitos**
   - Node.js 18+
   - Expo CLI
   - Android Studio (para Android) o Xcode (para iOS)

2. **Instalación**
   ```bash
   npm install
   ```

3. **Configuración del Entorno**
   - Copia `.env.example` a `.env`
   - Rellena las variables de Firebase con los valores de tu proyecto:
     ```env
     EXPO_PUBLIC_FIREBASE_API_KEY=...
     EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
     EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
     EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
     EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
     EXPO_PUBLIC_FIREBASE_APP_ID=...
     ```
   - Importante: las variables deben empezar con `EXPO_PUBLIC_` para que Expo las exponga en tiempo de ejecución (no usar secretos aquí).
   - Opciones para cargar el `.env`:
     - Simple: exporta las variables en tu terminal antes de iniciar Expo (PowerShell):
       ```powershell
       $env:EXPO_PUBLIC_FIREBASE_API_KEY="..."
       $env:EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
       $env:EXPO_PUBLIC_FIREBASE_PROJECT_ID="..."
       $env:EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
       $env:EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
       $env:EXPO_PUBLIC_FIREBASE_APP_ID="..."
       npm start
       ```
     - Conveniente: instala `dotenv-cli` y usa el archivo `.env` automáticamente (Windows/macOS/Linux):
       ```bash
       npm install --save-dev dotenv-cli
       ```
       Luego actualiza tus scripts a:
       ```json
       {
         "scripts": {
           "start": "dotenv -e .env -- expo start",
           "android": "dotenv -e .env -- expo start --android",
           "ios": "dotenv -e .env -- expo start --ios",
           "web": "dotenv -e .env -- expo start --web"
         }
       }
       ```
   - Añade también tus claves de Google AI si las usas.

4. **Desarrollo**
   ```bash
   npm start
   ```

5. **Compilación**
   ```bash
   npm run android  # o npm run ios
   ```

## Estructura del Proyecto

```
src/
├── components/          # Componentes de UI reutilizables
├── screens/            # Componentes de pantalla
├── navigation/         # Configuración de navegación
├── services/           # Servicios de API y hardware
├── store/             # Gestión de estado con Redux
├── utils/             # Utilidades y constantes
├── types/             # Definiciones de TypeScript
└── hooks/             # Hooks de React personalizados
```

## Guías de Desarrollo

- Usar TypeScript para todo el código nuevo
- Seguir patrones de componentes funcionales
- Implementar un manejo de errores adecuado
- Escribir pruebas unitarias para la lógica de negocio
- Usar JSDoc para la documentación de componentes
- Mantener los estándares de accesibilidad

## Contribuciones

1. Crear una rama para la nueva característica (feature branch)
2. Realizar los cambios
3. Añadir pruebas
4. Enviar una solicitud de pull (pull request)

## Licencia

Licencia MIT
