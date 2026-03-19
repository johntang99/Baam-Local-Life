import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <main>
      {/* Hero / AI Search */}
      <section className="bg-gradient-to-br from-baam-500 to-orange-600 text-white py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {t('heroTitle')}
          </h1>
          <p className="text-orange-100 mb-8 text-lg">
            {t('heroSubtitle')}
          </p>
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              className="w-full h-14 pl-5 pr-14 rounded-xl text-gray-900 text-base shadow-lg border-0 focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
            />
            <button className="absolute right-2 top-2 w-10 h-10 bg-baam-500 text-white rounded-lg flex items-center justify-center hover:bg-baam-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Today's News */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">📰</span> {t('todayNews')}
            </h2>
            <a href="/zh/news" className="text-sm text-baam-500 font-medium hover:underline">
              {t('viewAll')} →
            </a>
          </div>
          <p className="text-gray-500 text-sm">News cards will be loaded from Supabase here...</p>
        </section>

        {/* Hot Guides */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">📚</span> {t('hotGuides')}
            </h2>
            <a href="/zh/guides" className="text-sm text-baam-500 font-medium hover:underline">
              {t('viewAll')} →
            </a>
          </div>
          <p className="text-gray-500 text-sm">Guide cards will be loaded from Supabase here...</p>
        </section>

        {/* Local Voices */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">🎙️</span> {t('localVoices')}
            </h2>
            <a href="/zh/voices" className="text-sm text-baam-500 font-medium hover:underline">
              {t('viewMore')} →
            </a>
          </div>
          <p className="text-gray-500 text-sm">Voice cards will be loaded from Supabase here...</p>
        </section>
      </div>
    </main>
  );
}
