import { editorialTheme, generateEditorialThemeCSS } from '@/lib/theme';
import { EditorialNav } from './homepage-v2/components/editorial-nav';
import { EditorialFooter } from './homepage-v2/components/editorial-footer';

const editorialCSS = generateEditorialThemeCSS(editorialTheme);

export default function EditorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Editorial theme CSS variables (scoped to .theme-editorial) */}
      <style dangerouslySetInnerHTML={{ __html: editorialCSS }} />

      {/* Google Fonts for editorial design — only loaded on this layout */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;600;700;900&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&display=swap"
        rel="stylesheet"
      />

      <div
        className="theme-editorial"
        style={{
          background: 'var(--ed-paper)',
          color: 'var(--ed-ink)',
          minHeight: '100vh',
          fontFamily: 'var(--ed-font-sans)',
          lineHeight: 1.6,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <EditorialNav />
        {children}
        <EditorialFooter />
      </div>
    </>
  );
}
