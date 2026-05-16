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
  const titleText = title.trim();
  const bodyInput = (formData.get('body') as string)?.trim() || '';
  let bodyText: string | null = bodyInput || null;
  let priceText = String(formData.get('price_text') || '').trim() || null;
  const extractEmailFromText = (text: string) => {
    const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return m?.[0]?.trim() || '';
  };
  const contactNameInput = String(formData.get('contact_name') || '').trim();
  const contactPhoneInput = String(formData.get('contact_phone') || '').trim();
  const providedContactEmail = String(formData.get('contact_email') || '').trim();
  const inferredContactEmail = extractEmailFromText(`${titleText}\n${bodyInput}`);
  const effectiveContactEmail = providedContactEmail || inferredContactEmail;
  const formatStructuredContact = (name: string, phone: string, email: string) => {
    const normalizedName = name.toLowerCase() === 'guest sam' ? '' : name;
    const normalizedEmail = email.toLowerCase() === 'guest-sam1@gmail.com' ? '' : email;
    return [normalizedName, phone, normalizedEmail].filter(Boolean).join(' / ') || '未提供';
  };
  if (category === 'housing_rent') {
    if (formData.get('bedrooms')) metadata.bedrooms = parseInt(formData.get('bedrooms') as string);
    if (formData.get('neighborhood')) metadata.neighborhood = formData.get('neighborhood') as string;
    if (formData.get('rent_amount')) metadata.rent_amount = parseFloat(formData.get('rent_amount') as string);
    if (formData.get('move_in_date')) metadata.move_in_date = formData.get('move_in_date') as string;
  } else if (category === 'jobs') {
    if (formData.get('salary_range')) metadata.salary_range = formData.get('salary_range') as string;
    if (formData.get('job_type')) metadata.job_type = formData.get('job_type') as string;
    if (formData.get('company')) metadata.company = formData.get('company') as string;
    if (formData.get('job_location')) metadata.job_location = formData.get('job_location') as string;
    if (formData.get('work_hours')) metadata.work_hours = formData.get('work_hours') as string;
    if (formData.get('job_requirements')) metadata.job_requirements = formData.get('job_requirements') as string;

    // Keep meaning unchanged while normalizing jobs format into a simple, unified template.
    const company = String(formData.get('company') || '').trim();
    const jobLocation = String(formData.get('job_location') || '').trim();
    const salaryRange = String(formData.get('salary_range') || '').trim() || String(formData.get('price_text') || '').trim();
    const jobTypeRaw = String(formData.get('job_type') || '').trim();
    const jobType = jobTypeRaw === 'full_time' ? '全职' : jobTypeRaw === 'part_time' ? '兼职' : jobTypeRaw === 'remote' ? '远程' : jobTypeRaw;
    const workHours = String(formData.get('work_hours') || '').trim();
    const requirements = String(formData.get('job_requirements') || '').trim();
    const normalizedJobBody = [
      `【职位】${titleText}`,
      `【公司】${company || '未提供'}`,
      `【地点】${jobLocation || '未提供'}`,
      `【时间】${[jobType, workHours].filter(Boolean).join(' / ') || '未提供'}`,
      `【薪资】${salaryRange || '未提供'}`,
      `【要求】${requirements || '未提供'}`,
      `【联系方式】${formatStructuredContact(contactNameInput, contactPhoneInput, effectiveContactEmail)}`,
    ].join('\n');

    bodyText = bodyInput ? `${normalizedJobBody}\n\n【补充说明】\n${bodyInput}` : normalizedJobBody;
    if (salaryRange && !priceText) priceText = salaryRange;
  } else if (category === 'secondhand') {
    if (formData.get('condition')) metadata.condition = formData.get('condition') as string;
    if (formData.get('brand')) metadata.brand = formData.get('brand') as string;
    if (formData.get('original_price')) metadata.original_price = parseFloat(formData.get('original_price') as string);
    if (formData.get('meetup_location')) metadata.meetup_location = formData.get('meetup_location') as string;
  }

  const { data, error } = await supabase
    .from('classifieds')
    .insert({
      slug,
      site_id: site.id,
      title: titleText,
      body: bodyText,
      category,
      price_text: priceText,
      contact_name: contactNameInput || null,
      contact_phone: contactPhoneInput || null,
      contact_email: effectiveContactEmail || null,
      contact_wechat: null,
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
