import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSiteContext } from '@/lib/admin-context';
import ClassifiedForm from '../../ClassifiedForm';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditClassifiedPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  await getAdminSiteContext(sp);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const siteParamsObj = new URLSearchParams();
  if (sp.region) siteParamsObj.set('region', String(sp.region));
  if (sp.locale) siteParamsObj.set('locale', String(sp.locale));

  const { data: classified } = await supabase.from('classifieds').select('*').eq('id', id).single();

  if (!classified) {
    return (
      <div className="p-12 text-center">
        <p className="text-lg font-medium">信息不存在</p>
        <a href={`/admin/classifieds${siteParamsObj.toString() ? `?${siteParamsObj.toString()}` : ''}`} className="text-primary hover:underline text-sm mt-4 inline-block">返回列表</a>
      </div>
    );
  }

  return <ClassifiedForm classified={classified} isNew={false} siteParams={siteParamsObj.toString()} />;
}
