export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh';

// zh maps to zh-CN (Simplified Chinese)
// Traditional Chinese is handled via opencc-js runtime conversion, NOT a separate locale
export const localeLabels: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
};

// Chinese script variants (client-side toggle, not i18n locales)
export type ChineseScript = 'simplified' | 'traditional';
