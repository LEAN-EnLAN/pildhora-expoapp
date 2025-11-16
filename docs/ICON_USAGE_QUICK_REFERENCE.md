# Icon Usage Quick Reference

## Import Statement

```tsx
import { AppIcon, BrandedLoadingScreen, BrandedEmptyState } from '@/components/ui';
```

## AppIcon Sizes

```tsx
<AppIcon size="xs" />   // 24px - Badges, inline
<AppIcon size="sm" />   // 32px - Headers
<AppIcon size="md" />   // 48px - Default
<AppIcon size="lg" />   // 64px - Cards
<AppIcon size="xl" />   // 96px - Loading
<AppIcon size="2xl" />  // 128px - Auth screens
```

## Common Patterns

### Header Branding
```tsx
<View style={styles.brandingContainer}>
  <AppIcon size="sm" showShadow={false} rounded={true} />
  <Text style={styles.headerTitle}>PILDHORA</Text>
</View>
```

### Loading Screen
```tsx
if (loading) {
  return <BrandedLoadingScreen message="Cargando..." />;
}
```

### Empty State
```tsx
<BrandedEmptyState
  icon="medical-outline"
  title="No hay medicamentos"
  message="Agrega tu primer medicamento"
  actionLabel="Agregar"
  onAction={handleAdd}
/>
```

### Auth Screens
```tsx
<View style={styles.header}>
  <AppIcon size="2xl" showShadow={true} rounded={true} />
  <Text style={styles.title}>Bienvenido</Text>
</View>
```

## Files Modified

- src/components/ui/AppIcon.tsx (NEW)
- src/components/ui/BrandedLoadingScreen.tsx (NEW)
- src/components/ui/BrandedEmptyState.tsx (NEW)
- src/components/screens/shared/AboutScreen.tsx (NEW)
- src/components/ui/index.ts (UPDATED)
- app/auth/login.tsx (UPDATED)
- app/auth/signup.tsx (UPDATED)
- app/patient/home.tsx (UPDATED)
- src/components/caregiver/CaregiverHeader.tsx (UPDATED)
