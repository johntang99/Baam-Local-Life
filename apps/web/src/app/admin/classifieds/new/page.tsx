import { getAdminSiteContext } from '@/lib/admin-context';
import ClassifiedForm from '../ClassifiedForm';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NewClassifiedPage({ searchParams }: Props) {
  const sp = await searchParams;
  await getAdminSiteContext(sp);

  const siteParamsObj = new URLSearchParams();
  if (sp.region) siteParamsObj.set('region', String(sp.region));
  if (sp.locale) siteParamsObj.set('locale', String(sp.locale));

  return <ClassifiedForm isNew={true} siteParams={siteParamsObj.toString()} defaultAuthorId="189ea643-fd1d-4afe-9c19-7346cc7f3ac9" />;
}
