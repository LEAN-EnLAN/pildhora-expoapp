# Pildhora App

Pildhora es un sistema integral de gestión de pastilleros inteligentes diseñado para cerrar la brecha entre los pacientes de edad avanzada y sus cuidadores. Combina una aplicación móvil intuitiva con hardware IoT para garantizar la adherencia a la medicación y brindar tranquilidad.

## 📱 Resumen

La plataforma consta de dos interfaces distintas dentro de una misma aplicación:

*   **App del Paciente:** Una interfaz simplificada, de alto contraste y accesible para usuarios mayores. Se centra en recordatorios claros, confirmación de toma con un solo toque y conectividad fluida con el pastillero físico.
*   **App del Cuidador:** Un panel de control robusto para familiares o proveedores de salud. Permite la gestión completa de la medicación, monitoreo en tiempo real, seguimiento de adherencia y configuración del dispositivo.

## ✨ Características Principales

### Para Pacientes
*   **Recordatorios Inteligentes:** Notificaciones oportunas para las tomas de medicamentos.
*   **Acciones de un Toque:** Confirmación sencilla de dosis tomadas.
*   **Claridad Visual:** Texto grande, alto contraste e iconos intuitivos.
*   **Estado del Dispositivo:** Indicadores en tiempo real de batería y conectividad para el Pastillero Pildhora.

### Para Cuidadores
*   **Gestión Remota:** Añadir, editar o eliminar medicamentos a distancia.
*   **Adherencia en Tiempo Real:** Actualizaciones instantáneas cuando un paciente toma (o falta a) una dosis.
*   **Insights con IA:** Potenciado por Google Vertex AI (Gemini) para analizar patrones de adherencia y generar reportes.
*   **Soporte Multi-Paciente:** Gestiona varios pacientes desde un solo panel.
*   **Seguimiento de Inventario:** Rastreo automático de cantidades de pastillas con alertas de stock bajo.

## 🛠️ Stack Tecnológico

*   **Framework:** React Native (Expo)
*   **Estilos:** NativeWind (Tailwind CSS) y Sistema de Diseño Personalizado
*   **Backend:** Firebase (Auth, Firestore, Realtime Database, Functions)
*   **Integración de IA:** Google Vertex AI (Gemini)
*   **Integración de Hardware:** BLE y Wi-Fi (basado en ESP8266)
*   **Gestión de Estado:** Redux Toolkit
*   **Navegación:** Expo Router

## 🚀 Primeros Pasos

### Requisitos Previos
*   Node.js (LTS recomendado)
*   Expo CLI (`npm install -g expo-cli`)
*   Aplicación **Expo Go** en tu dispositivo físico o un Emulador de Android / Simulador de iOS.

### Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/usuario/pildhora-app.git
    cd pildhora-app
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configuración de Entorno:**
    Crea un archivo `.env` en el directorio raíz basado en `.env.example`. Necesitarás tus llaves de configuración de Firebase.
    ```env
    EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
    # Otros parámetros necesarios...
    ```

### Ejecución y Pruebas

Para correr la aplicación en modo de desarrollo:

*   **Iniciar el servidor de desarrollo:**
    ```bash
    npx expo start
    ```
    *Esto abrirá el "Expo Dev Tools" en tu terminal. Escanea el código QR con la app **Expo Go** en tu celular para probar en hardware real.*

*   **Ejecutar en Android (Emulador):**
    ```bash
    npm run android
    ```

*   **Ejecutar en iOS (Simulador):**
    ```bash
    npm run ios
    ```

*   **Ejecutar Pruebas Unitarias (si aplica):**
    ```bash
    npm test
    ```

## 📁 Estructura del Proyecto

*   `app/`: Pantallas de la aplicación y enrutamiento (Expo Router).
    *   `caregiver/`: Pantallas específicas para el flujo del cuidador.
    *   `patient/`: Pantallas específicas para el flujo del paciente.
*   `src/`: Código fuente principal.
    *   `components/`: Componentes de UI reutilizables.
    *   `hooks/`: Custom hooks de React.
    *   `services/`: Servicios de API e integración con el hardware.
    *   `store/`: Gestión de estado con Redux.
    *   `theme/`: Tokens de diseño y constantes de estilo.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor, lee nuestras guías de contribución antes de enviar un pull request.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
