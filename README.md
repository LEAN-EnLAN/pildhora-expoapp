# Pildhora Pillbox App

A comprehensive smart pillbox management system with separate interfaces for elderly patients and healthcare caregivers.

## Features

### Patient App
- Simple medication reminders
- One-tap intake confirmation
- Pillbox connectivity status
- Accessible UI for elderly users

### Caregiver App
- Full medication management (CRUD)
- Real-time patient monitoring
- AI-powered adherence reports
- Task scheduling and tracking
- Multi-patient dashboard

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: Redux Toolkit + Redux Persist
- **Backend**: Google Firebase (Auth, Firestore, Functions)
- **AI**: Google Vertex AI (Gemini)
- **Hardware**: BLE connectivity with ESP8266
- **UI**: React Native Elements + React Native Paper

## Getting Started

1. **Prerequisites**
   - Node.js 18+
   - Expo CLI
   - Android Studio (for Android) or Xcode (for iOS)

2. **Installation**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Add your Firebase configuration
   - Add Google AI API keys

4. **Development**
   ```bash
   npm start
   ```

5. **Building**
   ```bash
   npm run android  # or npm run ios
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── services/           # API and hardware services
├── store/             # Redux state management
├── utils/             # Utilities and constants
├── types/             # TypeScript definitions
└── hooks/             # Custom React hooks
```

## Development Guidelines

- Use TypeScript for all new code
- Follow functional component patterns
- Implement proper error handling
- Write unit tests for business logic
- Use JSDoc for component documentation
- Maintain accessibility standards

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests
4. Submit a pull request

## License

MIT License