/**
 * Accessibility Compliance Audit Script
 * 
 * Comprehensive audit of touch targets and color contrast ratios
 * for all caregiver dashboard components.
 * 
 * Usage: npx ts-node scripts/audit-accessibility-compliance.ts
 */

import {
  auditComponent,
  calculateContrastRatio,
  generateAccessibilityReport,
  AccessibilityAuditResult,
} from '../src/utils/accessibilityAudit.js';

// Color definitions from theme tokens
const COLORS = {
  primary: {
    50: '#E6F0FF',
    100: '#CCE1FF',
    500: '#007AFF',
    600: '#0066CC',
    700: '#0052A3',
  },
  success: '#34C759',
  warning: {
    50: '#FFF7ED',
    200: '#FED7AA',
    500: '#FF9500',
  },
  error: {
    50: '#FEF2F2',
    500: '#FF3B30',
  },
  info: '#5856D6',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  background: '#F2F2F7',
  surface: '#FFFFFF',
};

/**
 * Audit all caregiver components
 */
function auditAllComponents(): AccessibilityAuditResult[] {
  const audits: AccessibilityAuditResult[] = [];

  // 1. CaregiverHeader
  audits.push(
    auditComponent('CaregiverHeader', [
      {
        name: 'Logo',
        isInteractive: false,
        label: 'PILDHORA',
        role: 'header',
        foregroundColor: COLORS.gray[900],
        backgroundColor: COLORS.surface,
        isLargeText: true,
      },
      {
        name: 'CaregiverName',
        isInteractive: false,
        label: 'Caregiver name',
        foregroundColor: COLORS.gray[600],
        backgroundColor: COLORS.surface,
      },
      {
        name: 'EmergencyButton',
        isInteractive: true,
        isComplex: true,
        label: 'Emergency call button',
        hint: 'Opens emergency call options for 911 or 112',
        role: 'button',
        width: 44,
        height: 44,
        foregroundColor: COLORS.surface,
        backgroundColor: COLORS.error[500],
      },
      {
        name: 'AccountButton',
        isInteractive: true,
        isComplex: true,
        label: 'Account menu button',
        hint: 'Opens account menu with settings, device management, and logout options',
        role: 'button',
        width: 44,
        height: 44,
        foregroundColor: COLORS.surface,
        backgroundColor: COLORS.gray[700],
      },
    ])
  );

  // 2. QuickActionsPanel
  audits.push(
    auditComponent('QuickActionsPanel', [
      {
        name: 'EventsCard',
        isInteractive: true,
        isComplex: true,
        label: 'Events Registry',
        hint: 'Opens the events registry to view all medication events',
        role: 'button',
        width: 120,
        height: 120,
        foregroundColor: COLORS.gray[900],
        backgroundColor: COLORS.surface,
      },
      {
        name: 'MedicationsCard',
        isInteractive: true,
        isComplex: true,
        label: 'Medications Management',
        hint: 'Opens medications management to add, edit, or delete medications',
        role: 'button',
        width: 120,
        height: 120,
        foregroundColor: COLORS.gray[900],
        backgroundColor: COLORS.surface,
      },
      {
        name: 'TasksCard',
        isInteractive: true,
        isComplex: true,
        label: 'Tasks',
        hint: 'Opens tasks screen to manage caregiver to-dos',
        role: 'button',
        width: 120,
        height: 120,
        foregroundColor: COLORS.gray[900],
        backgroundColor: COLORS.surface,
      },
      {
        name: 'DeviceCard',
        isInteractive: true,
        isComplex: true,
        label: 'Device Management',
        hint: 'Opens device management to link or configure devices',
        role: 'button',
        width: 120,
        height: 120,
        foregroundColor: COLORS.gray[900],
        backgroundColor: COLORS.surface,
      },
    ])
  );

  // 3. DeviceConnectivityCard
  audits.push(
    auditComponent('DeviceConnectivityCard', [
      {
        name: 'Title',
        isInteractive: false,
        foregroundColor: COLORS.gray[900],
        backgroundColor: COLORS.surface,
        isLargeText: true,
      },
      {
        name: 'DeviceID',
        isInteractive: false,
        foregroundColor: COLORS.gray[500],
        backgroundColor: COLORS.surface,
      },
      {
        name: 'StatusLabel',
        isInteractive: false,
        foregroundColor: COLORS.gray[600],
        backgroundColor: COLORS.surface,
      },
      {
        name: 'StatusValue',
        isInteractive: false,
        foregroundColor: COLORS.gray[900],
        backgroundColor: COLORS.surface,
        isLargeText: true,
      },
      {
        name: 'BatteryLabel',
        isInteractive: false,
        foregroundColor: COLORS.gray[600],
        backgroundColor: COLORS.surface,
      },
      {
        name: 'BatteryValue',
        isInteractive: false,
        foregroundColor: COLORS.gray[900],
        backgroundColor: COLORS.surface,
        isLargeText: true,
      },
      {
        name: 'ManageButton',
        isInteractive: true,
        isComplex: true,
        label: 'Gestionar dispositivo',
        hint: 'Abre la pantalla de gestión de dispositivos',
        role: 'button',
        width: 200,
        height: 44,
        foregroundColor: COLORS.primary[500],
        backgroundColor: COLORS.surface,
      },
    ])
  );

  // 4. LastMedicationStatusCard
  audits.push(
    auditComponent('LastMedicationStatusCard', [
      {
        name: 'Title',
        isInteractive: false,
        foregroundColor: COLORS.gray[900],
        backgroundColor: COLORS.surface,
        isLargeText: true,
      },
      {
        name: 'MedicationName',
        isInteractive: false,
        foregroundColor: COLORS.gray[800],
        backgroundColor: COLORS.surface,
        isLargeText: true,
      },
      {
        name: 'Timestamp',
        isInteractive: false,
        foregroundColor: COLORS.gray[600],
        backgroundColor: COLORS.surface,
      },
      {
        name: 'ViewAllButton',
        isInteractive: true,
        isComplex: true,
        label: 'Ver todos los eventos',
        hint: 'Abre la pantalla de registro de eventos',
        role: 'button',
        width: 200,
        height: 44,
        foregroundColor: COLORS.primary[500],
        backgroundColor: COLORS.surface,
      },
    ])
  );

  // 5. PatientSelector
  audits.push(
    auditComponent('PatientSelector', [
      {
        name: 'PatientChip',
        isInteractive: true,
        isComplex: true,
        label: 'Patient name with device status',
        hint: 'Tap to select this patient',
        role: 'button',
        width: 160,
        height: 60,
        foregroundColor: COLORS.gray[900],
        backgroundColor: COLORS.gray[50],
      },
      {
        name: 'SelectedPatientChip',
        isInteractive: true,
        isComplex: true,
        label: 'Selected patient',
        hint: 'Currently selected patient',
        role: 'button',
        width: 160,
        height: 60,
        foregroundColor: COLORS.primary[700],
        backgroundColor: COLORS.primary[50],
      },
    ])
  );

  // 6. EventTypeBadge
  audits.push(
    auditComponent('EventTypeBadge', [
      {
        name: 'CreatedBadge',
        isInteractive: false,
        label: 'Estado: Creado',
        role: 'text',
        foregroundColor: COLORS.primary[500],
        backgroundColor: COLORS.primary[50],
      },
      {
        name: 'UpdatedBadge',
        isInteractive: false,
        label: 'Estado: Actualizado',
        role: 'text',
        foregroundColor: COLORS.warning[500],
        backgroundColor: COLORS.warning[50],
      },
      {
        name: 'DeletedBadge',
        isInteractive: false,
        label: 'Estado: Eliminado',
        role: 'text',
        foregroundColor: COLORS.error[500],
        backgroundColor: COLORS.error[50],
      },
      {
        name: 'DoseTakenBadge',
        isInteractive: false,
        label: 'Estado: Dosis tomada',
        role: 'text',
        foregroundColor: COLORS.success,
        backgroundColor: '#E8F5E9', // Light green
        isLargeText: true,
      },
    ])
  );

  // 7. MedicationEventCard
  audits.push(
    auditComponent('MedicationEventCard', [
      {
        name: 'Card',
        isInteractive: true,
        isComplex: true,
        label: 'Medication event details',
        hint: 'Tap to view full event details',
        role: 'button',
        width: 350,
        height: 140,
      },
      {
        name: 'PatientName',
        isInteractive: false,
        foregroundColor: COLORS.gray[900],
        backgroundColor: COLORS.surface,
      },
      {
        name: 'MedicationName',
        isInteractive: false,
        foregroundColor: COLORS.gray[800],
        backgroundColor: COLORS.surface,
        isLargeText: true,
      },
      {
        name: 'Timestamp',
        isInteractive: false,
        foregroundColor: COLORS.gray[600],
        backgroundColor: COLORS.surface,
      },
    ])
  );

  // 8. EventFilterControls
  audits.push(
    auditComponent('EventFilterControls', [
      {
        name: 'SearchInput',
        isInteractive: true,
        isComplex: true,
        label: 'Buscar medicamentos',
        hint: 'Ingresa el nombre del medicamento para filtrar',
        role: 'search',
        width: 300,
        height: 44,
        foregroundColor: COLORS.gray[900],
        backgroundColor: COLORS.surface,
      },
      {
        name: 'PatientFilterChip',
        isInteractive: true,
        isComplex: true,
        label: 'Filtrar por paciente',
        hint: 'Selecciona un paciente para filtrar eventos',
        role: 'button',
        width: 150,
        height: 44,
        foregroundColor: COLORS.gray[800],
        backgroundColor: COLORS.surface,
      },
      {
        name: 'EventTypeFilterChip',
        isInteractive: true,
        isComplex: true,
        label: 'Filtrar por tipo de evento',
        hint: 'Selecciona un tipo de evento para filtrar',
        role: 'button',
        width: 150,
        height: 44,
        foregroundColor: COLORS.gray[800],
        backgroundColor: COLORS.surface,
      },
      {
        name: 'DateRangeFilterChip',
        isInteractive: true,
        isComplex: true,
        label: 'Filtrar por rango de fechas',
        hint: 'Selecciona un rango de fechas para filtrar',
        role: 'button',
        width: 150,
        height: 44,
        foregroundColor: COLORS.gray[800],
        backgroundColor: COLORS.surface,
      },
      {
        name: 'ClearButton',
        isInteractive: true,
        label: 'Limpiar filtros',
        hint: 'Elimina todos los filtros activos',
        role: 'button',
        width: 80,
        height: 44,
        foregroundColor: COLORS.error[500],
        backgroundColor: COLORS.surface,
      },
    ])
  );

  // 9. ErrorState
  audits.push(
    auditComponent('ErrorState', [
      {
        name: 'ErrorMessage',
        isInteractive: false,
        foregroundColor: COLORS.error[500],
        backgroundColor: COLORS.surface,
      },
      {
        name: 'RetryButton',
        isInteractive: true,
        isComplex: true,
        label: 'Reintentar',
        hint: 'Intenta cargar los datos nuevamente',
        role: 'button',
        width: 200,
        height: 44,
        foregroundColor: COLORS.surface,
        backgroundColor: COLORS.primary[500],
      },
    ])
  );

  // 10. OfflineIndicator
  audits.push(
    auditComponent('OfflineIndicator', [
      {
        name: 'Banner',
        isInteractive: false,
        label: 'Sin conexión a internet',
        role: 'alert',
        foregroundColor: COLORS.warning[500],
        backgroundColor: COLORS.warning[50],
      },
    ])
  );

  return audits;
}

/**
 * Calculate and display detailed contrast ratios
 */
function displayContrastDetails() {
  console.log('\n=== DETAILED COLOR CONTRAST ANALYSIS ===\n');

  const contrastTests = [
    {
      name: 'Logo (Gray 900 on White)',
      fg: COLORS.gray[900],
      bg: COLORS.surface,
      isLarge: true,
    },
    {
      name: 'Caregiver Name (Gray 600 on White)',
      fg: COLORS.gray[600],
      bg: COLORS.surface,
      isLarge: false,
    },
    {
      name: 'Emergency Button Icon (White on Red)',
      fg: COLORS.surface,
      bg: COLORS.error[500],
      isLarge: false,
    },
    {
      name: 'Account Button Icon (White on Gray 700)',
      fg: COLORS.surface,
      bg: COLORS.gray[700],
      isLarge: false,
    },
    {
      name: 'Quick Action Card Title (Gray 900 on White)',
      fg: COLORS.gray[900],
      bg: COLORS.surface,
      isLarge: false,
    },
    {
      name: 'Device Status Value (Gray 900 on White)',
      fg: COLORS.gray[900],
      bg: COLORS.surface,
      isLarge: true,
    },
    {
      name: 'Device Status Label (Gray 600 on White)',
      fg: COLORS.gray[600],
      bg: COLORS.surface,
      isLarge: false,
    },
    {
      name: 'Patient Chip (Gray 900 on Gray 50)',
      fg: COLORS.gray[900],
      bg: COLORS.gray[50],
      isLarge: false,
    },
    {
      name: 'Selected Patient Chip (Primary 700 on Primary 50)',
      fg: COLORS.primary[700],
      bg: COLORS.primary[50],
      isLarge: false,
    },
    {
      name: 'Created Badge (Primary 500 on Primary 50)',
      fg: COLORS.primary[500],
      bg: COLORS.primary[50],
      isLarge: false,
    },
    {
      name: 'Updated Badge (Warning 500 on Warning 50)',
      fg: COLORS.warning[500],
      bg: COLORS.warning[50],
      isLarge: false,
    },
    {
      name: 'Deleted Badge (Error 500 on Error 50)',
      fg: COLORS.error[500],
      bg: COLORS.error[50],
      isLarge: false,
    },
    {
      name: 'Error Message (Error 500 on White)',
      fg: COLORS.error[500],
      bg: COLORS.surface,
      isLarge: false,
    },
    {
      name: 'Warning Banner (Warning 500 on Warning 50)',
      fg: COLORS.warning[500],
      bg: COLORS.warning[50],
      isLarge: false,
    },
  ];

  for (const test of contrastTests) {
    const ratio = calculateContrastRatio(test.fg, test.bg);
    const minRequired = test.isLarge ? 3.0 : 4.5;
    const aaPass = ratio >= minRequired;
    const aaaPass = ratio >= (test.isLarge ? 4.5 : 7.0);

    let level = '❌ FAIL';
    if (aaaPass) {
      level = '✅ AAA';
    } else if (aaPass) {
      level = '✅ AA';
    }

    console.log(`${test.name}`);
    console.log(`  Ratio: ${ratio.toFixed(2)}:1`);
    console.log(`  Required: ${minRequired}:1 (${test.isLarge ? 'Large Text' : 'Normal Text'})`);
    console.log(`  Level: ${level}`);
    console.log('');
  }
}

/**
 * Display touch target summary
 */
function displayTouchTargetSummary() {
  console.log('\n=== TOUCH TARGET SIZE SUMMARY ===\n');

  const touchTargets = [
    { name: 'Emergency Button', width: 44, height: 44 },
    { name: 'Account Button', width: 44, height: 44 },
    { name: 'Quick Action Cards', width: 120, height: 120 },
    { name: 'Manage Device Button', width: 200, height: 44 },
    { name: 'View All Events Button', width: 200, height: 44 },
    { name: 'Patient Chip', width: 160, height: 60 },
    { name: 'Search Input', width: 300, height: 44 },
    { name: 'Filter Chips', width: 150, height: 44 },
    { name: 'Clear Button', width: 80, height: 44 },
    { name: 'Retry Button', width: 200, height: 44 },
  ];

  const minSize = 44;

  for (const target of touchTargets) {
    const pass = target.width >= minSize && target.height >= minSize;
    const status = pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${target.name}: ${target.width}x${target.height}pt ${status}`);
  }

  console.log(`\nMinimum Required: ${minSize}x${minSize}pt (WCAG 2.1 AA)`);
}

/**
 * Main execution
 */
function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   ACCESSIBILITY COMPLIANCE AUDIT                           ║');
  console.log('║   Caregiver Dashboard Components                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Run component audits
  const audits = auditAllComponents();

  // Generate and display report
  const report = generateAccessibilityReport(audits);
  console.log('\n' + report);

  // Display detailed contrast analysis
  displayContrastDetails();

  // Display touch target summary
  displayTouchTargetSummary();

  // Summary
  const totalComponents = audits.length;
  const passedComponents = audits.filter((a) => a.passed).length;
  const totalIssues = audits.reduce((sum, a) => sum + a.issues.length, 0);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   AUDIT SUMMARY                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nComponents Audited: ${totalComponents}`);
  console.log(`Passed: ${passedComponents} (${Math.round((passedComponents / totalComponents) * 100)}%)`);
  console.log(`Total Issues: ${totalIssues}`);

  if (totalIssues === 0) {
    console.log('\n✅ ALL COMPONENTS PASS ACCESSIBILITY COMPLIANCE!');
    console.log('   - All touch targets meet 44x44pt minimum');
    console.log('   - All color contrasts meet WCAG 2.1 AA standards');
    console.log('   - All interactive elements have proper labels');
  } else {
    console.log('\n⚠️  ACCESSIBILITY ISSUES FOUND');
    console.log('   Please review the detailed report above');
  }

  console.log('\n');
}

// Run the audit
main();
