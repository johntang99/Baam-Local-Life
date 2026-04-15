/**
 * Baam Theme Configuration
 *
 * Central theme file controlling all colors, fonts, sizes, spacing.
 * Pattern follows medical-clinic/chinese-medicine project:
 * - Define theme as TypeScript object
 * - Inject as CSS variables at runtime via layout
 * - Tailwind maps CSS variables to utility classes
 * - Components consume via Tailwind classes or var() references
 */

export interface BaamTheme {
  colors: {
    primary: {
      50: string;
      100: string;
      200: string;
      light: string;
      DEFAULT: string;
      dark: string;
      700: string;
    };
    secondary: {
      50: string;
      light: string;
      DEFAULT: string;
      dark: string;
    };
    accent: {
      blue: string;
      blueLight: string;
      green: string;
      greenLight: string;
      red: string;
      redLight: string;
      yellow: string;
      purple: string;
      purpleLight: string;
    };
    backdrop: {
      primary: string;
      secondary: string;
    };
    text: {
      primary: string;
      secondary: string;
      muted: string;
      inverse: string;
    };
    border: {
      DEFAULT: string;
      light: string;
    };
    bg: {
      page: string;
      card: string;
      sidebar: string;
    };
  };
  typography: {
    display: string;
    heading: string;
    subheading: string;
    body: string;
    small: string;
    xs: string;
    fonts: {
      display: string;
      heading: string;
      body: string;
      mono: string;
    };
    weights: {
      regular: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
  shape: {
    radius: string;
    radiusLg: string;
    radiusXl: string;
    radiusFull: string;
    radiusCard?: string;
    radiusButton?: string;
    radiusChip?: string;
    radiusInput?: string;
    shadow: string;
    shadowSm: string;
    shadowMd: string;
    shadowLg: string;
  };
  layout: {
    navHeight: string;
    sidebarWidth: string;
    containerMax: string;
    contentMax: string;
    spacingDensity: 'compact' | 'comfortable' | 'spacious';
  };
}

// ============================================================
// BAAM DEFAULT THEME — Orange brand, Chinese community portal
// ============================================================
export const baamTheme: BaamTheme = {
  colors: {
    primary: {
      "50": "#FFF7ED",
      "100": "#FFEDD5",
      "200": "#FED7AA",
      "700": "#C2410C",
      light: "#FB923C",
      DEFAULT: "#d35d09",
      dark: "#c74f0f"
    },
    secondary: {
      "50": "#EFF6FF",
      light: "#93C5FD",
      DEFAULT: "#3B82F6",
      dark: "#1D4ED8"
    },
    accent: {
      blue: "#3B82F6",
      blueLight: "#DBEAFE",
      green: "#22C55E",
      greenLight: "#DCFCE7",
      red: "#EF4444",
      redLight: "#FEE2E2",
      yellow: "#EAB308",
      purple: "#8B5CF6",
      purpleLight: "#EDE9FE"
    },
    backdrop: {
      primary: "#FFF7ED",
      secondary: "#EFF6FF"
    },
    text: {
      primary: "#111827",
      secondary: "#6B7280",
      muted: "#9CA3AF",
      inverse: "#FFFFFF"
    },
    border: {
      DEFAULT: "#E5E7EB",
      light: "#F3F4F6"
    },
    bg: {
      page: "#F9FAFB",
      card: "#FFFFFF",
      sidebar: "#1F2937"
    }
  },
  typography: {
    display: "2.25rem",
    heading: "1.5rem",
    subheading: "1.125rem",
    body: "0.9375rem",
    small: "0.8125rem",
    xs: "0.75rem",
    fonts: {
      display: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', 'Segoe UI', sans-serif",
      heading: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', 'Segoe UI', sans-serif",
      body: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', 'Segoe UI', sans-serif",
      mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace"
    },
    weights: {
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700"
    }
  },
  shape: {
    radius: "8px",
    radiusLg: "12px",
    radiusXl: "16px",
    radiusFull: "9999px",
    radiusCard: "8px",
    radiusButton: "12px",
    radiusChip: "9999px",
    radiusInput: "12px",
    shadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
    shadowSm: "0 1px 2px rgba(0,0,0,0.05)",
    shadowMd: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)",
    shadowLg: "0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)"
  },
  layout: {
    navHeight: "64px",
    sidebarWidth: "240px",
    containerMax: "1280px",
    contentMax: "800px",
    spacingDensity: "comfortable"
  }
};

// ============================================================
// Generate CSS variables string from theme
// ============================================================
export function generateThemeCSS(theme: BaamTheme): string {
  const spacingMap = { compact: '3rem', comfortable: '5rem', spacious: '8rem' };

  return `
    :root {
      /* Primary Colors */
      --primary: ${theme.colors.primary.DEFAULT};
      --primary-dark: ${theme.colors.primary.dark};
      --primary-light: ${theme.colors.primary.light};
      --primary-50: ${theme.colors.primary[50]};
      --primary-100: ${theme.colors.primary[100]};
      --primary-200: ${theme.colors.primary[200]};
      --primary-700: ${theme.colors.primary[700]};

      /* Secondary Colors */
      --secondary: ${theme.colors.secondary.DEFAULT};
      --secondary-dark: ${theme.colors.secondary.dark};
      --secondary-light: ${theme.colors.secondary.light};
      --secondary-50: ${theme.colors.secondary[50]};

      /* Accent Colors */
      --accent-blue: ${theme.colors.accent.blue};
      --accent-blue-light: ${theme.colors.accent.blueLight};
      --accent-green: ${theme.colors.accent.green};
      --accent-green-light: ${theme.colors.accent.greenLight};
      --accent-red: ${theme.colors.accent.red};
      --accent-red-light: ${theme.colors.accent.redLight};
      --accent-yellow: ${theme.colors.accent.yellow};
      --accent-purple: ${theme.colors.accent.purple};
      --accent-purple-light: ${theme.colors.accent.purpleLight};

      /* Backdrop */
      --backdrop-primary: ${theme.colors.backdrop.primary};
      --backdrop-secondary: ${theme.colors.backdrop.secondary};

      /* Text Colors */
      --text-primary: ${theme.colors.text.primary};
      --text-secondary: ${theme.colors.text.secondary};
      --text-muted: ${theme.colors.text.muted};
      --text-inverse: ${theme.colors.text.inverse};

      /* Borders */
      --border: ${theme.colors.border.DEFAULT};
      --border-light: ${theme.colors.border.light};

      /* Backgrounds */
      --bg-page: ${theme.colors.bg.page};
      --bg-card: ${theme.colors.bg.card};
      --bg-sidebar: ${theme.colors.bg.sidebar};

      /* Typography */
      --text-display: ${theme.typography.display};
      --text-heading: ${theme.typography.heading};
      --text-subheading: ${theme.typography.subheading};
      --text-body: ${theme.typography.body};
      --text-small: ${theme.typography.small};
      --text-xs: ${theme.typography.xs};
      --font-display: ${theme.typography.fonts.display};
      --font-heading: ${theme.typography.fonts.heading};
      --font-body: ${theme.typography.fonts.body};
      --font-mono: ${theme.typography.fonts.mono};
      --font-weight-regular: ${theme.typography.weights?.regular || '400'};
      --font-weight-medium: ${theme.typography.weights?.medium || '500'};
      --font-weight-semibold: ${theme.typography.weights?.semibold || '600'};
      --font-weight-bold: ${theme.typography.weights?.bold || '700'};

      /* Shape */
      --radius: ${theme.shape.radius};
      --radius-lg: ${theme.shape.radiusLg};
      --radius-xl: ${theme.shape.radiusXl};
      --radius-full: ${theme.shape.radiusFull};
      --radius-card: ${theme.shape.radiusCard || theme.shape.radiusXl};
      --radius-button: ${theme.shape.radiusButton || theme.shape.radiusLg};
      --radius-chip: ${theme.shape.radiusChip || theme.shape.radiusFull};
      --radius-input: ${theme.shape.radiusInput || theme.shape.radiusLg};
      --shadow: ${theme.shape.shadow};
      --shadow-sm: ${theme.shape.shadowSm};
      --shadow-md: ${theme.shape.shadowMd};
      --shadow-lg: ${theme.shape.shadowLg};

      /* Layout */
      --nav-height: ${theme.layout.navHeight};
      --sidebar-width: ${theme.layout.sidebarWidth};
      --container-max: ${theme.layout.containerMax};
      --content-max: ${theme.layout.contentMax};
      --section-padding-y: ${spacingMap[theme.layout.spacingDensity]};
    }
  `;
}
