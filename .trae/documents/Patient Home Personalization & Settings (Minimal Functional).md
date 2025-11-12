## Goals

* Add a minimal but functional Settings/Personalization section to Patient Home

* Support real permission requests (notifications, location, Bluetooth) with live status

* Capture device metadata tied to the logged-in user

* Store preferences locally (persisted) and mirror key items to backend for cross-device use

* Make components reusable for future Caregiver Dashboard with advanced controls

## Architecture Fit

* Navigation: `expo-router` — add `app/patient/settings.tsx` and push from Patient Home account menu

* State: Redux Toolkit + `redux-persist` (AsyncStorage) — introduce `preferences` slice

* Notifications: `expo-notifications` already integrated; reuse `src/services/notifications/push.ts`

* Firebase: mirror preferences under `users/{uid}/preferences` and permission metadata under RTDB or Firestore

* Styling: keep `StyleSheet` and existing UI components (`Button`, `Card`, `Container`) for consistency

## Minimal Settings (MVP)

* Profile section: avatar, name, email, "Edit Profile" button (non-blocking stub)

* Preferences

  * Language: display current; simple selector for `en|es` (local only for MVP)

  * Theme: Dark Mode toggle (store preference; defer global theme wiring)

  * Notifications

    * Master toggle: enable/disable app notifications

    * Request permissions via `expo-notifications` and show status (Granted/Denied)

    * Simple hierarchy: three categories with priority order `Urgent > Medication > General` stored as array; non-draggable MVP (preset + editable via segmented control)

  * Location

    * Request permissions and show status; capture coarse location only when user opts-in (requires `expo-location`)

  * Bluetooth

    * Show adapter/permission status; request on first use; reflect state via `react-native-ble-plx` APIs

* Device info

  * OS, version, model, app version (via `expo-constants`; optionally `expo-device`)

## Data Model

* Redux slice: `preferences`

  * `language: 'en' | 'es'`

  * `theme: 'light' | 'dark'`

  * `notifications: { enabled: boolean, hierarchy: string[] }` (default `["urgent","medication","general"]`)

  * `permissions: { notifications: 'granted'|'denied'|'undetermined', location: same, bluetooth: 'on'|'off'|'undetermined' }`

* Persistence: `redux-persist` (AsyncStorage)

* Backend mirrors (minimal)

  * Firestore `users/{uid}/preferences` → language, theme, notifications.hierarchy

  * RTDB/Firestore `users/{uid}/permissions` → current statuses

  * Already in place: Expo/FCM tokens under `users/{uid}/expoPushTokens` and `.../fcmTokens`

## File Changes (Where)

* Patient Home

  * Update "Configuraciones" handler to navigate: `app/patient/home.tsx:169–177,184` → `router.push('/patient/settings')`

* Add screen

  * `app/patient/settings.tsx` using `StyleSheet` and existing `Button`, `Card`

* Navigation

  * Ensure route in `app/patient/_layout.tsx:24–27` (expo-router auto-registers file)

* State

  * `src/store/slices/preferencesSlice.ts` with actions for toggles and hierarchy

  * Register slice in `src/store/index.ts:22–29` and include in `persistReducer`

* Services:

  * wifi: use a package for managing device connection in local network 
  * Notifications: reuse `src/services/notifications/push.ts:18–63` methods
  * Location: add wrapper (requires `expo-location`) to request/check status

* Backend sync

  * `src/services/firebase/user.ts` add `savePreferences(uid, data)` and `savePermissions(uid, data)` helpers

## Permissions Flows

* Notifications

  * Read current status → if not granted, show CTA to request

  * On grant, ensure push token registration via existing `ensurePushTokensRegistered`

* Location

  * Request foreground permission on toggle; store status/result; do not fetch background location in MVP

* Bluetooth

  * On toggle/CTA, check adapter state and request (Android ≥12 needs specific runtime permissions); reflect status only; actual scanning remains in BLE features

## UI Implementation Notes

* Follow WithFrame full-width settings pattern and YouTube reference, but implement with `StyleSheet` and current components

* Keep copy minimal, localized to `en/es` if available

* Use simple rows: `Label | Value/Toggle | chevron` where applicable

## Telemetry & Device Metadata

* Use `expo-constants` for app version and platform; optionally add `expo-device` for model/name

* Store under `users/{uid}/deviceMeta/{deviceId}` to support multiple devices

## Validation

* Manual: navigate from Patient Home → Settings, toggle options, request permissions, verify tokens written (`src/services/notifications/push.ts`), and Firestore/RTDB mirrors

* Unit: slice reducers and persistence behavior

## Reuse in Caregiver Dashboard

* Componentize sections (`SettingsProfile`, `SettingsPreferences`, `SettingsPermissions`)

* Keep slice/actions generic so caregiver can extend hierarchy and add advanced controls without breaking patient UX

## Dependencies To Add (if missing)

* `expo-location` for location permissions

* `expo-device` for richer device metadata

## References

* Patient Home: `app/patient/home.tsx:165–185`

* Router layout: `app/_layout.tsx:41–54`, `app/patient/_layout.tsx:24–27`

* Notifications service: `src/services/notifications/push.ts:18–63`

* Store: `src/store/index.ts:14–20,22–29,55–76`

