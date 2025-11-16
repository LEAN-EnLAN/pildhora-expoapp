/**
 * Accessibility Audit Utility
 * 
 * Provides tools for auditing and validating accessibility compliance
 * across caregiver components.
 */

import { MIN_TOUCH_TARGET_SIZE } from './accessibility';

export interface AccessibilityAuditResult {
  component: string;
  passed: boolean;
  issues: AccessibilityIssue[];
  warnings: AccessibilityWarning[];
}

export interface AccessibilityIssue {
  type: 'missing_label' | 'missing_hint' | 'missing_role' | 'touch_target_too_small' | 'low_contrast';
  severity: 'critical' | 'high' | 'medium' | 'low';
  element: string;
  message: string;
  recommendation: string;
}

export interface AccessibilityWarning {
  type: 'verbose_label' | 'redundant_hint' | 'decorative_not_hidden';
  element: string;
  message: string;
  recommendation: string;
}

/**
 * Audit touch target size
 */
export function auditTouchTarget(
  componentName: string,
  elementName: string,
  width: number,
  height: number
): AccessibilityIssue | null {
  if (width < MIN_TOUCH_TARGET_SIZE || height < MIN_TOUCH_TARGET_SIZE) {
    return {
      type: 'touch_target_too_small',
      severity: 'high',
      element: `${componentName}.${elementName}`,
      message: `Touch target is ${width}x${height}pt, below minimum ${MIN_TOUCH_TARGET_SIZE}x${MIN_TOUCH_TARGET_SIZE}pt`,
      recommendation: `Increase touch target size to at least ${MIN_TOUCH_TARGET_SIZE}x${MIN_TOUCH_TARGET_SIZE}pt using minWidth and minHeight styles`,
    };
  }
  return null;
}

/**
 * Audit accessibility label
 */
export function auditAccessibilityLabel(
  componentName: string,
  elementName: string,
  label?: string,
  isInteractive: boolean = true
): AccessibilityIssue | null {
  if (isInteractive && !label) {
    return {
      type: 'missing_label',
      severity: 'critical',
      element: `${componentName}.${elementName}`,
      message: 'Interactive element missing accessibilityLabel',
      recommendation: 'Add descriptive accessibilityLabel prop that describes the element\'s purpose',
    };
  }

  if (label && label.length > 100) {
    // This is a warning, not an issue
    return null;
  }

  return null;
}

/**
 * Audit accessibility hint
 */
export function auditAccessibilityHint(
  componentName: string,
  elementName: string,
  hint?: string,
  isComplex: boolean = false
): AccessibilityWarning | null {
  if (isComplex && !hint) {
    return {
      type: 'redundant_hint',
      element: `${componentName}.${elementName}`,
      message: 'Complex interactive element could benefit from accessibilityHint',
      recommendation: 'Add accessibilityHint to explain what happens when the element is activated',
    };
  }

  return null;
}

/**
 * Audit accessibility role
 */
export function auditAccessibilityRole(
  componentName: string,
  elementName: string,
  role?: string,
  isInteractive: boolean = true
): AccessibilityIssue | null {
  if (isInteractive && !role) {
    return {
      type: 'missing_role',
      severity: 'medium',
      element: `${componentName}.${elementName}`,
      message: 'Interactive element missing accessibilityRole',
      recommendation: 'Add appropriate accessibilityRole (button, link, etc.)',
    };
  }

  return null;
}

/**
 * Calculate contrast ratio between two colors
 * Uses WCAG 2.1 formula
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Apply gamma correction
    const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    
    // Calculate relative luminance
    return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Audit color contrast
 */
export function auditColorContrast(
  componentName: string,
  elementName: string,
  foreground: string,
  background: string,
  isLargeText: boolean = false
): AccessibilityIssue | null {
  const ratio = calculateContrastRatio(foreground, background);
  const minimumRatio = isLargeText ? 3.0 : 4.5; // WCAG AA standards
  
  if (ratio < minimumRatio) {
    return {
      type: 'low_contrast',
      severity: 'high',
      element: `${componentName}.${elementName}`,
      message: `Contrast ratio ${ratio.toFixed(2)}:1 is below WCAG AA minimum ${minimumRatio}:1`,
      recommendation: `Increase contrast between foreground (${foreground}) and background (${background}) colors`,
    };
  }
  
  return null;
}

/**
 * Comprehensive component audit
 */
export function auditComponent(
  componentName: string,
  elements: Array<{
    name: string;
    isInteractive?: boolean;
    isComplex?: boolean;
    label?: string;
    hint?: string;
    role?: string;
    width?: number;
    height?: number;
    foregroundColor?: string;
    backgroundColor?: string;
    isLargeText?: boolean;
  }>
): AccessibilityAuditResult {
  const issues: AccessibilityIssue[] = [];
  const warnings: AccessibilityWarning[] = [];
  
  for (const element of elements) {
    // Audit label
    const labelIssue = auditAccessibilityLabel(
      componentName,
      element.name,
      element.label,
      element.isInteractive
    );
    if (labelIssue) issues.push(labelIssue);
    
    // Audit hint
    const hintWarning = auditAccessibilityHint(
      componentName,
      element.name,
      element.hint,
      element.isComplex
    );
    if (hintWarning) warnings.push(hintWarning);
    
    // Audit role
    const roleIssue = auditAccessibilityRole(
      componentName,
      element.name,
      element.role,
      element.isInteractive
    );
    if (roleIssue) issues.push(roleIssue);
    
    // Audit touch target
    if (element.width !== undefined && element.height !== undefined) {
      const touchTargetIssue = auditTouchTarget(
        componentName,
        element.name,
        element.width,
        element.height
      );
      if (touchTargetIssue) issues.push(touchTargetIssue);
    }
    
    // Audit contrast
    if (element.foregroundColor && element.backgroundColor) {
      const contrastIssue = auditColorContrast(
        componentName,
        element.name,
        element.foregroundColor,
        element.backgroundColor,
        element.isLargeText
      );
      if (contrastIssue) issues.push(contrastIssue);
    }
  }
  
  return {
    component: componentName,
    passed: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Generate accessibility compliance report
 */
export function generateAccessibilityReport(
  audits: AccessibilityAuditResult[]
): string {
  const totalComponents = audits.length;
  const passedComponents = audits.filter(a => a.passed).length;
  const totalIssues = audits.reduce((sum, a) => sum + a.issues.length, 0);
  const totalWarnings = audits.reduce((sum, a) => sum + a.warnings.length, 0);
  
  let report = '# Accessibility Compliance Report\n\n';
  report += `## Summary\n\n`;
  report += `- **Components Audited**: ${totalComponents}\n`;
  report += `- **Passed**: ${passedComponents} (${Math.round(passedComponents / totalComponents * 100)}%)\n`;
  report += `- **Total Issues**: ${totalIssues}\n`;
  report += `- **Total Warnings**: ${totalWarnings}\n\n`;
  
  // Group issues by severity
  const criticalIssues = audits.flatMap(a => a.issues.filter(i => i.severity === 'critical'));
  const highIssues = audits.flatMap(a => a.issues.filter(i => i.severity === 'high'));
  const mediumIssues = audits.flatMap(a => a.issues.filter(i => i.severity === 'medium'));
  const lowIssues = audits.flatMap(a => a.issues.filter(i => i.severity === 'low'));
  
  if (criticalIssues.length > 0) {
    report += `## Critical Issues (${criticalIssues.length})\n\n`;
    for (const issue of criticalIssues) {
      report += `### ${issue.element}\n`;
      report += `- **Type**: ${issue.type}\n`;
      report += `- **Message**: ${issue.message}\n`;
      report += `- **Recommendation**: ${issue.recommendation}\n\n`;
    }
  }
  
  if (highIssues.length > 0) {
    report += `## High Priority Issues (${highIssues.length})\n\n`;
    for (const issue of highIssues) {
      report += `### ${issue.element}\n`;
      report += `- **Type**: ${issue.type}\n`;
      report += `- **Message**: ${issue.message}\n`;
      report += `- **Recommendation**: ${issue.recommendation}\n\n`;
    }
  }
  
  if (mediumIssues.length > 0) {
    report += `## Medium Priority Issues (${mediumIssues.length})\n\n`;
    for (const issue of mediumIssues) {
      report += `### ${issue.element}\n`;
      report += `- **Type**: ${issue.type}\n`;
      report += `- **Message**: ${issue.message}\n`;
      report += `- **Recommendation**: ${issue.recommendation}\n\n`;
    }
  }
  
  if (totalWarnings > 0) {
    report += `## Warnings (${totalWarnings})\n\n`;
    for (const audit of audits) {
      for (const warning of audit.warnings) {
        report += `### ${warning.element}\n`;
        report += `- **Type**: ${warning.type}\n`;
        report += `- **Message**: ${warning.message}\n`;
        report += `- **Recommendation**: ${warning.recommendation}\n\n`;
      }
    }
  }
  
  return report;
}

export default {
  auditTouchTarget,
  auditAccessibilityLabel,
  auditAccessibilityHint,
  auditAccessibilityRole,
  auditColorContrast,
  calculateContrastRatio,
  auditComponent,
  generateAccessibilityReport,
};
