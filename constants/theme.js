export const Colors = {
  // Brand
  navy:        '#0D2137',
  teal:        '#00897B',
  tealLight:   '#4DB6AC',
  amber:       '#D97706',

  // Glucose status
  inRange:     '#1B8A5A',
  low:         '#D97706',
  high:        '#C0392B',
  veryLow:     '#7B1C1C',
  veryHigh:    '#6D0000',

  // Severity
  critical:    '#C0392B',
  warning:     '#D97706',
  info:        '#1565C0',
  success:     '#1B8A5A',

  // UI
  bg:          '#F2F5F9',
  white:       '#FFFFFF',
  card:        '#FFFFFF',
  border:      '#E2E8F0',
  borderDark:  '#CBD5E1',

  // Text
  textPrimary:    '#0F172A',
  textSecondary:  '#475569',
  textMuted:      '#94A3B8',
  textOnDark:     '#FFFFFF',

  // Dark mode surfaces
  darkBg:     '#0A0F1E',
  darkCard:   '#131B2E',
  darkBorder: '#1E293B',
};

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48,
};

export const Radius = {
  sm: 6, md: 10, lg: 16, xl: 24, full: 9999,
};

export const FontSize = {
  xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, xxl: 30, hero: 36,
};

export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,  elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,  elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
};
