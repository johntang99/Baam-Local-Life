'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { getCurrentSite } from '@/lib/sites';

export async function createPublicClassified(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'UNAUTHORIZED' };

  const site = await getCurrentSite();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const title = formData.get('title') as string;
  const category = formData.get('category') as string;

  if (!title?.trim()) return { error: '请填写标题' };

  const slug = title.trim().toLowerCase()
    .replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '').slice(0, 80)
    + '-' + Date.now().toString(36);

  const metadata: Record<string, unknown> = {};
  if (category === 'housing_rent') {
    if (formData.get('bedrooms')) metadata.bedrooms = parseInt(formData.get('bedrooms') as string);
    if (formData.get('neighborhood')) metadata.neighborhood = formData.get('neighborhood') as string;
  } else if (category === 'jobs') {
    if (formData.get('salary_range')) metadata.salary_range = formData.get('salary_range') as string;
    if (formData.get('job_type')) metadata.job_type = formData.get('job_type') as string;
  } else if (category === 'secondhand') {
    if (formData.get('condition')) metadata.condition = formData.get('condition') as string;
  }

  const { data, error } = await supabase
    .from('classifieds')
    .insert({
      slug,
      site_id: site.id,
      title: title.trim(),
      body: (formData.get('body') as string)?.trim() || null,
      category,
      price_text: formData.get('price_text') as string || null,
      contact_name: formData.get('contact_name') as string || null,
      contact_phone: formData.get('contact_phone') as string || null,
      contact_wechat: formData.get('contact_wechat') as string || null,
      author_id: user.id,
      status: 'active',
      metadata,
    })
    .select('slug, category')
    .single();

  if (error) return { error: '发布失败：' + error.message };

  // Map category to URL key
  const catUrlMap: Record<string, string> = {
    housing_rent: 'housing', housing_buy: 'housing', jobs: 'jobs',
    secondhand: 'secondhand', services: 'help', general: 'help',
  };
  const urlCat = catUrlMap[data.category] || 'help';

  revalidatePath('/classifieds');
  return { error: null, redirect: `/classifieds/${urlCat}/${data.slug}` };
}

export async function createClassifiedReply(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'UNAUTHORIZED' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const classifiedId = formData.get('classified_id') as string;
  const body = (formData.get('body') as string)?.trim();

  if (!body) return { error: '请填写回复内容' };

  const { error } = await supabase
    .from('classified_replies')
    .insert({
      classified_id: classifiedId,
      author_id: user.id,
      body,
      status: 'published',
    });

  if (error) return { error: '回复失败：' + error.message };

  revalidatePath('/classifieds');
  return { error: null };
}
