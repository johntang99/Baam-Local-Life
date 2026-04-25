import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSiteContext } from '@/lib/admin-context';
import DealForm from '../../DealForm';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditDealPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await getAdminSiteContext(sp);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const siteParamsObj = new URLSearchParams();
  if (sp.region) siteParamsObj.set('region', String(sp.region));
  if (sp.locale) siteParamsObj.set('locale', String(sp.locale));

  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', id)
    .single();

  if (!deal) {
    return (
      <div className="p-12 text-center">
        <p className="text-lg font-medium">优惠不存在</p>
        <a href={`/admin/deals${siteParamsObj.toString() ? `?${siteParamsObj.toString()}` : ''}`} className="text-primary hover:underline text-sm mt-4 inline-block">
          返回列表
        </a>
      </div>
    );
  }

  const { data: rawBiz } = await supabase
    .from('businesses')
    .select('id, display_name, display_name_zh, slug')
    .eq('site_id', ctx.siteId)
    .eq('is_active', true)
    .order('display_name_zh', { ascending: true });

  return (
    <DealForm
      deal={deal}
      businesses={(rawBiz || []) as AnyRow[]}
      isNew={false}
      siteParams={siteParamsObj.toString()}
    />
  );
}
