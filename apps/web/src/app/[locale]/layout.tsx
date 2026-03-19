import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';
import { ChineseScriptProvider } from '@/lib/i18n/chinese-converter';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale === 'zh' ? 'zh-CN' : locale}>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          <ChineseScriptProvider>
            {children}
          </ChineseScriptProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
