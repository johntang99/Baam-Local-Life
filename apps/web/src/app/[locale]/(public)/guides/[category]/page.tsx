import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import { Pagination } from '@/components/shared/pagination';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<{ page?: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const PAGE_SIZE = 12;

const GUIDE_VERTICALS = [
  'guide_howto', 'guide_checklist', 'guide_bestof', 'guide_comparison',
  'guide_neighborhood', 'guide_seasonal', 'guide_resource', 'guide_scenario',
];

const verticalConfig: Record<string, { label: string; className: string }> = {
  guide_howto: { label: 'How-To', className: 'badge-blue' },
  guide_checklist: { label: 'Checklist', className: 'badge-green' },
  guide_bestof: { label: 'Best-of', className: 'badge-green' },
  guide_comparison: { label: '对比', className: 'badge-purple' },
  guide_neighborhood: { label: '社区', className: 'badge-primary' },
  guide_seasonal: { label: '时令', className: 'badge-red' },
  guide_resource: { label: '资源', className: 'badge-blue' },
  guide_scenario: { label: '场景', className: 'badge-purple' },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('name_zh, name_en, name')
    .eq('slug', category)
    .single() as { data: AnyRow | null };

  if (!data) return { title: 'Not Found' };
  const name = data.name_zh || data.name_en || data.name;
  return {
    title: `${name} · 生活资讯 · Baam`,
    description: `${name}相关的实用指南和攻略`,
  };
}

export default async function GuideCategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page || '1', 10));

  const supabase = await createClient();

  // Fetch category info
  const { data: catData, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', category)
    .single();

  const cat = catData as AnyRow | null;
  if (catError || !cat) notFound();

  const catName = cat.name_zh || cat.name_en || cat.name;

  // Count articles in this category
  const { count } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .in('content_vertical', GUIDE_VERTICALS)
    .eq('editorial_status', 'published')
    .or(`category_id.eq.${cat.id},primary_category_id.eq.${cat.id}`);

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  // Fetch guides
  const from = (currentPage - 1) * PAGE_SIZE;
  const { data: rawGuides } = await supabase
    .from('articles')
    .select('*')
    .in('content_vertical', GUIDE_VERTICALS)
    .eq('editorial_status', 'published')
    .or(`category_id.eq.${cat.id},primary_category_id.eq.${cat.id}`)
    .order('published_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const guides = (rawGuides || []) as AnyRow[];

  // Fetch all categories for nav
  const { data: rawCategories } = await supabase
    .from('categories')
    .select('id, slug, name_zh, name_en, name, icon')
    .eq('type', 'article')
    .order('sort_order', { ascending: true });

  const categories = (rawCategories || []) as AnyRow[];

  return (
    <main>
      <section className="bg-bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <nav className="text-sm text-text-muted mb-3">
            <Link href="/" className="hover:text-primary">首页</Link>
            <span className="mx-2">&rsaquo;</span>
            <Link href="/guides" className="hover:text-primary">生活资讯</Link>
            <span className="mx-2">&rsaquo;</span>
            <span className="text-text-secondary">{catName}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold">{cat.icon && <span className="mr-2">{cat.icon}</span>}{catName}</h1>
          <p className="text-sm text-text-secondary mt-1">共 {count || 0} 篇指南</p>
        </div>
      </section>

      {/* Category Tabs */}
      <div className="bg-bg-card border-b border-border sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-3">
            <Link href="/guides" className="flex-shrink-0 px-4 py-2 text-sm font-medium text-text-secondary bg-border-light rounded-full hover:text-primary transition">
              全部
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/guides/${c.slug}`}
                className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition ${
                  c.slug === category
                    ? 'bg-primary text-text-inverse'
                    : 'text-text-secondary bg-border-light hover:text-primary'
                }`}
              >
                {c.icon && <span className="mr-1">{c.icon}</span>}
                {c.name_zh || c.name_en || c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {guides.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-text-secondary">该分类下暂无指南</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {guides.map((guide) => {
              const vertical = verticalConfig[guide.content_vertical] || { label: '指南', className: 'badge-gray' };
              return (
                <Link key={guide.id} href={`/guides/${guide.slug}`} className="card block group">
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-4xl">
                    {cat.icon || '📋'}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge ${vertical.className}`}>{vertical.label}</span>
                      {guide.audience_tags && Array.isArray(guide.audience_tags) && guide.audience_tags.slice(0, 1).map((tag: string) => (
                        <span key={tag} className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition">
                      {guide.title_zh || guide.title_en}
                    </h3>
                    {(guide.ai_summary_zh || guide.summary_zh) && (
                      <p className="text-xs text-text-muted line-clamp-2">{guide.ai_summary_zh || guide.summary_zh}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={`/guides/${category}`}
        />
      </div>
    </main>
  );
}
