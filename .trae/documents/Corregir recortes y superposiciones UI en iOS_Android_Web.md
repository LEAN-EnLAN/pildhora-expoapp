## Objetivo
- Localizar y eliminar recortes, elementos "chopped" y superposiciones en pantallas clave para paciente y cuidador.

## Hallazgos rápidos
- Tab bar de cuidador usa altura/padding fijos y no considera `insets.bottom` (`src/navigation/CaregiverTabBar.tsx`).
- Varias pantallas aplican `paddingBottom` fijo en `ScrollView` en vez de dinámico (`app/patient/home.tsx`, `app/diagnostics/index.tsx`, `app/caregiver/device-connection.tsx`).
- Header absoluto en layout de cuidador requiere compensación de `top inset`; algunas pantallas no la aplican (`app/caregiver/device-connection.tsx`).
- Formularios del wizard de medicamentos sin `KeyboardAvoidingView`, riesgo de tapado por teclado.
- En iOS no se usa `contentInsetAdjustmentBehavior="automatic"` en `ScrollView`.
- Varios contenedores con `overflow:'hidden'` cerca de bordes pueden recortar chips/botones.

## Plan de cambios
- Tab bar segura:
  - Integrar `useSafeAreaInsets()` y calcular `height = base + insets.bottom` y `paddingBottom = insets.bottom` en `CaregiverTabBar`.
- Header absoluto:
  - Asegurar `ScreenWrapper`/contenedores aplican `paddingTop` usando `contentInsetTop` del layout de cuidador; revisar pantallas que lo desactivan.
- Scroll y padding dinámico:
  - Sustituir `paddingBottom` fijo por el hook que ya se usa (`contentPaddingBottom`) en pantallas restantes.
- iOS ajustes:
  - Añadir `contentInsetAdjustmentBehavior="automatic"` en `ScrollView` bajo headers/tabbars custom.
- Teclado:
  - Envolver pasos del wizard de medicamentos con `KeyboardAvoidingView` y `keyboardShouldPersistTaps="handled"`.
- Overflow:
  - Auditar contenedores con `overflow:'hidden'` en tarjetas grandes; cambiar a `overflow:'visible'` donde recorte chips/acciones.

## Archivos objetivo
- `src/navigation/CaregiverTabBar.tsx`
- `app/caregiver/_layout.tsx` y `ScreenWrapper`/uso de `contentInsetTop`
- `app/patient/home.tsx`, `app/diagnostics/index.tsx`, `app/caregiver/device-connection.tsx`
- `src/components/patient/medication-wizard/*`
- Tarjetas con chips: `src/components/screens/patient/MedicationCard.tsx`, `app/patient/home.tsx`

## Validación
- iPhone con notch y Android con gestos: verificar que el último botón/CTA y listas no queden bajo el tab bar.
- Web: confirmar que al final de las pantallas hay espacio equivalente al tab bar y que no se recorta contenido.
- Formularios: abrir teclado y comprobar que inputs y botones siguen visibles.
- Revisar chips de horario: sin cortes en filas y esquinas.

## Resultado esperado
- Sin contenido tapado por barra inferior o header.
- Scroll continuo hasta el último elemento en las tres plataformas.
- Mejor comportamiento con teclado en iOS/Android.

¿Confirmo y aplico estos cambios ahora?