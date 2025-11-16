# Medication Wizard Integration Quick Reference

## Overview
Quick reference for the caregiver medication wizard integration (Task 11.2).

## Key Files

```
app/caregiver/medications/[patientId]/
├── index.tsx          # Medications list with Add button
└── add.tsx            # Wizard integration screen
```

## Navigation Flow

```typescript
// From medications list
router.push(`/caregiver/medications/${patientId}/add`)

// After completion
router.back()
```

## Parameter Extraction

```typescript
// In add.tsx
const { patientId } = useLocalSearchParams();
const pid = Array.isArray(patientId) ? patientId[0] : patientId;
const { user } = useSelector((state: RootState) => state.auth);
```

## Wizard Integration

```typescript
<MedicationWizard
  mode="add"
  onComplete={handleWizardComplete}
  onCancel={handleWizardCancel}
/>
```

## Completion Handler

```typescript
const handleWizardComplete = async (formData: MedicationFormData) => {
  // 1. Validate user and patient
  if (!user?.id || !pid) return;

  // 2. Prepare medication data
  const medicationData = {
    ...formData,
    patientId: pid,
    caregiverId: user.id,
    // ... other fields
  };

  // 3. Save to Firestore
  const result = await dispatch(addMedication(medicationData)).unwrap();

  // 4. Generate event
  await createAndEnqueueEvent(result, patientName, 'created');

  // 5. Show success & navigate back
  Alert.alert('Éxito', 'Medicamento agregado correctamente');
  router.back();
};
```

## List Refresh

```typescript
// In index.tsx
useFocusEffect(
  useCallback(() => {
    if (patientId) {
      dispatch(fetchMedications(patientId));
    }
  }, [patientId, dispatch])
);
```

## Error Handling

```typescript
try {
  // Save medication
} catch (error) {
  Alert.alert('Error', error.message, [
    { text: 'Reintentar', onPress: () => handleWizardComplete(formData) },
    { text: 'Cancelar', style: 'cancel' }
  ]);
}
```

## Data Mapping

### From Wizard Form Data
```typescript
{
  emoji: string;
  name: string;
  times: string[];
  frequency: string[];
  doseValue: string;
  doseUnit: string;
  quantityType: string;
  initialQuantity?: number;
  lowQuantityThreshold?: number;
}
```

### To Medication Object
```typescript
{
  name: formData.name,
  emoji: formData.emoji,
  doseValue: formData.doseValue,
  doseUnit: formData.doseUnit,
  quantityType: formData.quantityType,
  times: formData.times,
  frequency: formData.frequency.join(', '),
  patientId: pid,
  caregiverId: user.id,
  trackInventory: formData.initialQuantity !== undefined,
  currentQuantity: formData.initialQuantity,
  initialQuantity: formData.initialQuantity,
  lowQuantityThreshold: formData.lowQuantityThreshold,
}
```

## Common Issues & Solutions

### Issue: List doesn't refresh after adding
**Solution**: Use `useFocusEffect` instead of `useEffect`

### Issue: PatientId is undefined
**Solution**: Extract from route params and handle array case
```typescript
const { patientId } = useLocalSearchParams();
const pid = Array.isArray(patientId) ? patientId[0] : patientId;
```

### Issue: CaregiverId not set
**Solution**: Get from Redux auth state
```typescript
const { user } = useSelector((state: RootState) => state.auth);
// Use: user.id
```

### Issue: Event not created
**Solution**: Fetch patient name first
```typescript
const patient = await getPatientById(pid);
await createAndEnqueueEvent(medication, patient.name, 'created');
```

## Testing Checklist

- [ ] Navigation to wizard works
- [ ] PatientId passed correctly
- [ ] CaregiverId passed correctly
- [ ] Wizard completes successfully
- [ ] Medication saved to Firestore
- [ ] Event created in medicationEvents
- [ ] Success alert shown
- [ ] Navigation back works
- [ ] List refreshes with new medication
- [ ] Error handling works
- [ ] Retry functionality works
- [ ] Cancel button works
- [ ] Accessibility labels present

## Related Documentation

- [Task 11.2 Implementation Summary](./TASK11.2_IMPLEMENTATION_SUMMARY.md)
- [Medication Wizard Components](../../medication-wizard-fixes/WIZARD_COMPONENTS_DOCUMENTATION.md)
- [Event Service Guide](../../../src/services/MEDICATION_EVENT_SERVICE_GUIDE.md)
