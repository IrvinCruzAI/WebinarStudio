import type { OperatorSettings } from '../contracts';

export interface MissingSettingsWarning {
  field: string;
  label: string;
  why: string;
  usedIn: string[];
}

export function checkRequiredSettings(
  operator?: OperatorSettings
): MissingSettingsWarning[] {
  const warnings: MissingSettingsWarning[] = [];

  if (!operator?.primary_cta_link) {
    warnings.push({
      field: 'primary_cta_link',
      label: 'Primary CTA Link',
      why: 'Landing page and Run of Show will have placeholder links',
      usedIn: ['WR3 Landing Page', 'WR6 Run of Show'],
    });
  }

  if (!operator?.registration_link) {
    warnings.push({
      field: 'registration_link',
      label: 'Registration Link',
      why: 'Landing page will have placeholder registration URL',
      usedIn: ['WR3 Landing Page'],
    });
  }

  if (!operator?.sender_name || !operator?.sender_email) {
    warnings.push({
      field: 'sender_email',
      label: 'Email Sender Info',
      why: 'Email campaign will have placeholder sender details',
      usedIn: ['WR4 Email Campaign'],
    });
  }

  return warnings;
}
