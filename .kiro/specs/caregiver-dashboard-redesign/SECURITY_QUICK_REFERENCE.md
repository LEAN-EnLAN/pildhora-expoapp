# Caregiver Security - Quick Reference Guide

## 🔐 Overview

This guide provides quick reference for implementing security features in the caregiver dashboard.

## 📦 Imports

```typescript
// Security service
import {
  verifyUserRole,
  verifyDeviceAccess,
  verifyPatientAccess,
  cacheSecureData,
  getSecureCache,
  clearCaregiverCache,
  secureLogout,
  CACHE_KEYS,
} from '@/services/caregiverSecurity';

// Security hooks
import {
  useCaregiverSecurity,
  useDeviceAccess,
  usePatientAccess,
} from '@/hooks/useCaregiverSecurity';

// Protected route
import { CaregiverProtectedRoute } from '@/components/caregiver/CaregiverProtectedRoute';
```

## 🛡️ Protect Routes

### Option 1: Wrap Component

```typescript
export default function DashboardScreen() {
  return (
    <CaregiverProtectedRoute>
      <DashboardContent />
    </CaregiverProtectedRoute>
  );
}
```

### Option 2: Use HOC

```typescript
import { withCaregiverProtection } from '@/components/caregiver/CaregiverProtectedRoute';

function DashboardScreen() {
  return <DashboardContent />;
}

export default withCaregiverProtection(DashboardScreen);
```

### Option 3: Protect Layout

```typescript
// app/caregiver/_layout.tsx
export default function CaregiverLayout() {
  return (
    <CaregiverProtectedRoute>
      <Stack>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="events" />
      </Stack>
    </CaregiverProtectedRoute>
  );
}
```

## 🔑 Use Security Hook

```typescript
function MyComponent() {
  const {
    user,              // UserData | null
    isLoading,         // boolean
    isAuthorized,      // boolean
    error,             // string | null
    verifyAccess,      // (deviceId: string) => Promise<DeviceAccessResult>
    verifyPatient,     // (patientId: string) => Promise<boolean>
    logout,            // () => Promise<void>
    refreshAuth,       // () => Promise<void>
    accessiblePatients // string[]
  } = useCaregiverSecurity();

  // Use the hook data
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthorized) return <AccessDenied />;

  return <View>Welcome, {user?.name}</View>;
}
```

## 🔍 Verify Access

### Device Access

```typescript
function DeviceComponent({ deviceId }: { deviceId: string }) {
  const { accessResult, isLoading } = useDeviceAccess(deviceId);

  if (isLoading) return <LoadingSpinner />;
  if (!accessResult?.hasAccess) {
    return <Text>Access Denied: {accessResult?.reason}</Text>;
  }

  return <DeviceContent patientId={accessResult.patientId} />;
}
```

### Patient Access

```typescript
function PatientComponent({ patientId }: { patientId: string }) {
  const { hasAccess, isLoading } = usePatientAccess(patientId);

  if (isLoading) return <LoadingSpinner />;
  if (!hasAccess) return <AccessDenied />;

  return <PatientContent />;
}
```

### Manual Verification

```typescript
// Verify device access
const result = await verifyDeviceAccess(caregiverId, deviceId);
if (result.hasAccess) {
  console.log('Patient ID:', result.patientId);
}

// Verify patient access
const hasAccess = await verifyPatientAccess(caregiverId, patientId);
if (hasAccess) {
  // Access granted
}
```

## 💾 Cache Management

### Store Encrypted Data

```typescript
import { cacheSecureData, CACHE_KEYS } from '@/services/caregiverSecurity';

// Cache patient data
await cacheSecureData(CACHE_KEYS.PATIENT_DATA, {
  id: 'patient123',
  name: 'John Doe',
  medications: [...],
});

// Cache device state
await cacheSecureData(CACHE_KEYS.DEVICE_STATE, deviceState);
```

### Retrieve Cached Data

```typescript
import { getSecureCache, CACHE_KEYS } from '@/services/caregiverSecurity';

// Get cached patient data
const patientData = await getSecureCache(CACHE_KEYS.PATIENT_DATA);
if (patientData) {
  // Use cached data
}

// Get cached device state
const deviceState = await getSecureCache(CACHE_KEYS.DEVICE_STATE);
```

### Clear Cache

```typescript
import { clearCaregiverCache, clearCacheEntry, CACHE_KEYS } from '@/services/caregiverSecurity';

// Clear all cache
await clearCaregiverCache();

// Clear specific entry
await clearCacheEntry(CACHE_KEYS.PATIENT_DATA);
```

## 🚪 Logout

### Using Hook

```typescript
function LogoutButton() {
  const { logout } = useCaregiverSecurity();

  const handleLogout = async () => {
    try {
      await logout(); // Clears cache and signs out
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return <Button onPress={handleLogout}>Logout</Button>;
}
```

### Using Service

```typescript
import { secureLogout } from '@/services/caregiverSecurity';

const handleLogout = async () => {
  try {
    await secureLogout(); // Clears cache and signs out
    router.replace('/auth/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

## 🔄 Session Management

### Check Session Validity

```typescript
import { isSessionValid } from '@/services/caregiverSecurity';

const valid = await isSessionValid();
if (!valid) {
  // Redirect to login
}
```

### Refresh Token

```typescript
import { refreshUserToken } from '@/services/caregiverSecurity';

const newToken = await refreshUserToken();
if (newToken) {
  // Token refreshed successfully
}
```

## 📋 Cache Keys

```typescript
import { CACHE_KEYS } from '@/services/caregiverSecurity';

CACHE_KEYS.PATIENT_DATA        // 'caregiver_patient_data'
CACHE_KEYS.DEVICE_STATE        // 'caregiver_device_state'
CACHE_KEYS.MEDICATION_EVENTS   // 'caregiver_medication_events'
CACHE_KEYS.USER_PREFERENCES    // 'caregiver_user_preferences'
```

## 🎯 Common Patterns

### Protected Screen with Loading

```typescript
export default function MyScreen() {
  const { isLoading, isAuthorized, user } = useCaregiverSecurity();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthorized) {
    return <AccessDenied />;
  }

  return (
    <View>
      <Text>Welcome, {user?.name}</Text>
      {/* Screen content */}
    </View>
  );
}
```

### Device Access with Error Handling

```typescript
function DeviceScreen({ deviceId }: { deviceId: string }) {
  const { accessResult, isLoading } = useDeviceAccess(deviceId);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;

  if (!accessResult?.hasAccess) {
    return (
      <ErrorState
        title="Access Denied"
        message={accessResult?.reason || 'You do not have access to this device'}
      />
    );
  }

  return <DeviceContent />;
}
```

### Cached Data with Fallback

```typescript
function PatientDataComponent({ patientId }: { patientId: string }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Try cache first
      const cached = await getSecureCache(CACHE_KEYS.PATIENT_DATA);
      if (cached) {
        setData(cached);
        setLoading(false);
      }

      // Fetch fresh data
      try {
        const fresh = await fetchPatientData(patientId);
        setData(fresh);
        await cacheSecureData(CACHE_KEYS.PATIENT_DATA, fresh);
      } catch (error) {
        if (!cached) {
          // No cache and fetch failed
          setError('Failed to load data');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientId]);

  if (loading) return <LoadingSpinner />;
  return <DataDisplay data={data} />;
}
```

### Multi-Patient Access

```typescript
function PatientSelector() {
  const { accessiblePatients, isLoading } = useCaregiverSecurity();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;

  return (
    <View>
      {accessiblePatients.map(patientId => (
        <TouchableOpacity
          key={patientId}
          onPress={() => setSelectedPatient(patientId)}
        >
          <PatientChip patientId={patientId} />
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

## ⚠️ Important Notes

1. **Always use hooks in components** - Don't call service functions directly in render
2. **Cache sensitive data** - Use encrypted cache for patient information
3. **Clear cache on logout** - Always use `secureLogout()` instead of direct Firebase signout
4. **Verify access** - Check device/patient access before displaying sensitive data
5. **Handle loading states** - Always show loading indicators during verification
6. **Handle errors gracefully** - Display user-friendly error messages

## 🔗 Related Documentation

- [Security Rules Documentation](./SECURITY_RULES_DOCUMENTATION.md)
- [Task 20 Implementation Summary](./TASK20_SECURITY_IMPLEMENTATION_SUMMARY.md)
- [Firestore Security Rules](../../firestore.rules)

## 📞 Support

For issues or questions:
1. Check the comprehensive documentation
2. Review test files for examples
3. Check Firebase console for security rule errors
4. Review error logs for authentication issues
