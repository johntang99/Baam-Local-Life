import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/routing';
import type { Metadata } from 'next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return {
    title: `${t('voices')} · Baam`,
    description: '认识你身边有价值的人 — 本地认证专家、达人、创作者',
  };
}

const filterTags = [
  { key: 'all', label: '全部' },
  { key: 'expert', label: '认证专家' },
  { key: 'family', label: '家庭' },
  { key: 'food', label: '美食' },
  { key: 'realestate', label: '地产' },
  { key: 'medical', label: '医疗' },
  { key: 'education', label: '教育' },
];

export default async function VoicesListPage() {
  const supabase = await createClient();
  const t = await getTranslations();

  // Fetch featured voices
  const { data: rawFeatured } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_featured', true)
    .in('profile_type', ['creator', 'expert', 'professional'])
    .limit(6);

  const featured = (rawFeatured || []) as AnyRow[];

  // Fetch standard voice cards
  const { data: rawVoices, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('profile_type', 'user')
    .order('follower_count', { ascending: false })
    .limit(24);

  const voices = (rawVoices || []) as AnyRow[];

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">认识你身边有价值的人</h1>
            <p className="text-text-secondary text-sm mt-1">发现本地达人、专家和创作者</p>
          </div>
          <Link href="/voices/apply" className="btn btn-primary h-9 px-4 text-sm">
            申请成为达人
          </Link>
        </div>

        {/* Filter Tags */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2">
          {filterTags.map((tag, i) => (
            <button
              key={tag.key}
              className={`px-4 py-2 text-sm font-medium rounded-full ${
                i === 0
                  ? 'bg-primary text-text-inverse'
                  : 'bg-border-light text-text-secondary hover:bg-gray-200'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Featured Voices */}
        {featured.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold mb-4">精选达人</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((voice) => (
                <Link
                  key={voice.id}
                  href={`/voices/${voice.username}`}
                  className="card p-6 block"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar placeholder */}
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                      {voice.display_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base truncate">
                          {voice.display_name || voice.username}
                        </h3>
                        {voice.is_verified && (
                          <span className="badge badge-blue text-xs">已认证</span>
                        )}
                      </div>
                      {voice.headline && (
                        <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                          {voice.headline}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span>{voice.follower_count || 0} 关注者</span>
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-primary w-full mt-4 h-9 text-sm">关注</button>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Voices Grid */}
        <section>
          <h2 className="text-lg font-bold mb-4">全部达人</h2>
          {error ? (
            <p className="text-text-secondary py-8 text-center">加载达人时出错，请稍后重试。</p>
          ) : voices.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-4xl mb-4">👤</p>
              <p className="text-text-secondary">暂无达人内容</p>
              <p className="text-text-muted text-sm mt-1">达人将在这里显示</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {voices.map((voice) => (
                <Link
                  key={voice.id}
                  href={`/voices/${voice.username}`}
                  className="card p-4 block"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {/* Avatar placeholder */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
                      {voice.display_name?.[0] || '?'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {voice.display_name || voice.username}
                      </h3>
                      {voice.region && (
                        <span className="text-xs text-text-muted">{voice.region}</span>
                      )}
                    </div>
                  </div>
                  {voice.tags && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(Array.isArray(voice.tags) ? voice.tags : []).slice(0, 3).map((tag: string) => (
                        <span key={tag} className="badge badge-gray text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>{voice.follower_count || 0} 关注者</span>
                    <span className="btn btn-primary h-7 px-3 text-xs">关注</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
