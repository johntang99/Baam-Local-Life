import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSiteContext } from '@/lib/admin-context';
import DealForm from '../DealForm';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NewDealPage({ searchParams }: Props) {
  const sp = await searchParams;
  const ctx = await getAdminSiteContext(sp);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const siteParamsObj = new URLSearchParams();
  if (sp.region) siteParamsObj.set('region', String(sp.region));
  if (sp.locale) siteParamsObj.set('locale', String(sp.locale));

  const { data: rawBiz } = await supabase
    .from('businesses')
    .select('id, display_name, display_name_zh, slug')
    .eq('site_id', ctx.siteId)
    .eq('is_active', true)
    .order('display_name_zh', { ascending: true });

  return (
    <DealForm
      businesses={(rawBiz || []) as AnyRow[]}
      isNew={true}
      siteParams={siteParamsObj.toString()}
    />
  );
}
