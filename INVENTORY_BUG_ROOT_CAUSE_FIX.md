# Inventory Bug - Root Cause Analysis & Fix

## Problem Identified

From the logs:
```
LOG  [TakeMedication] Decrementing inventory: {"doseAmount": 50, "medicationId": "iRboB18UhBd9UNg5Ti1u"}
LOG  [InventoryService] Decremented inventory: {"amount": 50, "medicationId": "iRboB18UhBd9UNg5Ti1u", "newQuantity": 0, "previousQuantity": 50}
```

**The system is decrementing by 50 instead of by 1.**

## Root Cause

The `parseDoseAmount()` function was incorrectly parsing the `doseValue` field as the number of units to decrement.

### Data Model Confusion

There are two different concepts that were being conflated:

1. **Dose Strength** (`doseValue` + `doseUnit`): The strength of each unit
   - Example: "50mg" means each tablet contains 50mg of the active ingredient
   - Stored as: `doseValue: "50"`, `doseUnit: "mg"`

2. **Inventory Units** (`currentQuantity`, `initialQuantity`): The number of discrete units
   - Example: 50 tablets in the bottle
   - Stored as: `currentQuantity: 50`, `initialQuantity: 50`

### What Was Happening

When a user took a dose:
1. System called `parseDoseAmount(medication)`
2. Function read `doseValue: "50"` (the strength in mg)
3. Function returned `50` (thinking this was the number of units)
4. System decremented inventory by 50 units
5. Result: 50 tablets - 50 = 0 tablets

### What Should Happen

When a user takes a dose:
1. System calls `parseDoseAmount(medication)`
2. Function checks `quantityType` (e.g., "tablets")
3. Function returns `1` (one discrete unit)
4. System decrements inventory by 1 unit
5. Result: 50 tablets - 1 = 49 tablets

## The Fix

### Updated `parseDoseAmount()` Logic

```typescript
parseDoseAmount(medication: Medication): number {
  // For countable quantity types, always decrement by 1 unit
  const countableTypes = ['tablets', 'capsules', 'pills', 'drops', 'sprays', 'puffs', 'inhalations', 'applications'];
  
  if (medication.quantityType && countableTypes.includes(medication.quantityType.toLowerCase())) {
    return 1; // One discrete unit
  }

  // For liquid/cream, don't decrement (tracked by container)
  if (medication.quantityType === 'liquid' || medication.quantityType === 'cream') {
    return 0;
  }

  // CRITICAL: If trackInventory is enabled but no quantityType,
  // assume discrete units and decrement by 1
  if (medication.trackInventory) {
    return 1;
  }

  // Default to 1
  return 1;
}
```

### Key Changes

1. **Always return 1 for countable types** - tablets, capsules, etc.
2. **Return 0 for liquids/creams** - these are tracked by container, not by dose
3. **Fallback to 1 if trackInventory is enabled** - prevents using doseValue
4. **Added extensive logging** - to debug future issues

## Why This Happened

### Missing Field in Old Data

Some medications may have been created before `quantityType` was added to the data model. These medications have:
- ✅ `doseValue: "50"` (strength)
- ✅ `doseUnit: "mg"` (unit of strength)
- ❌ `quantityType: undefined` (missing!)

Without `quantityType`, the old code fell through to parsing `doseValue`, which gave the wrong result.

### Old Code Path

```typescript
// OLD CODE (BUGGY)
parseDoseAmount(medication: Medication): number {
  if (medication.doseValue) {
    const parsed = parseFloat(medication.doseValue);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed; // ❌ Returns 50 instead of 1!
    }
  }
  return 1;
}
```

## Testing the Fix

### Test Case 1: Tablets with quantityType
```typescript
medication = {
  name: "Aspirin",
  doseValue: "50",
  doseUnit: "mg",
  quantityType: "tablets",
  currentQuantity: 50,
  trackInventory: true
}

// Expected: parseDoseAmount() returns 1
// Result: 50 - 1 = 49 ✅
```

### Test Case 2: Tablets without quantityType (legacy data)
```typescript
medication = {
  name: "Aspirin",
  doseValue: "50",
  doseUnit: "mg",
  quantityType: undefined, // Missing!
  currentQuantity: 50,
  trackInventory: true
}

// Expected: parseDoseAmount() returns 1 (fallback)
// Result: 50 - 1 = 49 ✅
```

### Test Case 3: Liquid medication
```typescript
medication = {
  name: "Cough Syrup",
  doseValue: "10",
  doseUnit: "ml",
  quantityType: "liquid",
  currentQuantity: 3, // 3 bottles
  trackInventory: true
}

// Expected: parseDoseAmount() returns 0
// Result: 3 - 0 = 3 (bottles don't decrement per dose) ✅
```

## Data Migration Needed?

### Check Existing Medications

Run this query in Firestore console to find medications without `quantityType`:

```javascript
db.collection('medications')
  .where('trackInventory', '==', true)
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.quantityType) {
        console.log('Missing quantityType:', doc.id, data.name);
      }
    });
  });
```

### Migration Script (if needed)

If you find medications without `quantityType`, you can infer it from the `doseUnit`:

```typescript
function inferQuantityType(doseUnit: string): string {
  const unit = doseUnit?.toLowerCase() || '';
  
  if (unit.includes('ml') || unit.includes('l')) return 'liquid';
  if (unit.includes('g') && !unit.includes('mg') && !unit.includes('mcg')) return 'cream';
  
  // Default to tablets for mg, mcg, units
  return 'tablets';
}
```

## Immediate Actions

1. ✅ **Fixed `parseDoseAmount()` logic** - Now always returns 1 for discrete units
2. ✅ **Added logging** - To debug medication data
3. ⚠️ **Test with your medication** - Take a dose and verify it decrements by 1
4. ⚠️ **Check Firestore data** - Verify `quantityType` is set for all medications
5. ⚠️ **Fix existing medications** - If any are missing `quantityType`, update them

## Long-term Solutions

### 1. Enforce quantityType in Wizard

Ensure the medication wizard always sets `quantityType`:

```typescript
// In MedicationDosageStep.tsx
const medicationData = {
  doseValue: formData.doseValue,
  doseUnit: formData.doseUnit,
  quantityType: formData.quantityType || 'tablets', // ✅ Always set
};
```

### 2. Add Validation

Add validation to prevent saving medications without `quantityType`:

```typescript
if (medication.trackInventory && !medication.quantityType) {
  throw new Error('quantityType is required when trackInventory is enabled');
}
```

### 3. Database Schema Documentation

Document the data model clearly:

```typescript
interface Medication {
  // Dose strength (what's IN each unit)
  doseValue: string;      // "50"
  doseUnit: string;       // "mg"
  
  // Inventory tracking (how many units you HAVE)
  quantityType: string;   // "tablets", "capsules", "liquid"
  currentQuantity: number; // 50 (tablets)
  initialQuantity: number; // 100 (tablets)
  
  trackInventory: boolean;
}
```

## Summary

The bug was caused by confusing **dose strength** (50mg) with **inventory units** (50 tablets). The fix ensures that `parseDoseAmount()` always returns the number of discrete units to decrement (usually 1), not the dose strength value.

**Status**: ✅ Fixed in code, needs testing and potential data migration
