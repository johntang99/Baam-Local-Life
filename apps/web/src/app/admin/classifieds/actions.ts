'use server';

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSiteContext } from '@/lib/admin-context';
import { generateSeoSlug } from '@/lib/slug-generator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminClient() as any;
const execFileAsync = promisify(execFile);

export type DadiImportTarget = 'housing_rent' | 'jobs' | 'secondhand' | 'all';
export type NychinarenImportTarget = 'housing_rent' | 'jobs' | 'secondhand' | 'all';

interface DadiImportCategoryConfig {
  label: string;
  forumUrl: string;
  category: 'housing_rent' | 'jobs' | 'secondhand';
  slugPrefix: string;
}

const DADI360_IMPORT_CONFIG: Record<'housing_rent' | 'jobs' | 'secondhand', DadiImportCategoryConfig> = {
  housing_rent: {
    label: '租房',
    forumUrl: 'https://c.dadi360.com/c/forums/show/92.page',
    category: 'housing_rent',
    slugPrefix: 'dadi360-housing-rent',
  },
  jobs: {
    label: '招聘',
    forumUrl: 'https://c.dadi360.com/c/forums/show/29.page',
    category: 'jobs',
    slugPrefix: 'dadi360-jobs',
  },
  secondhand: {
    label: '二手',
    forumUrl: 'https://c.dadi360.com/c/forums/show/23.page',
    category: 'secondhand',
    slugPrefix: 'dadi360-secondhand',
  },
};

interface NychinarenImportCategoryConfig {
  label: string;
  forumUrl: string;
  category: 'housing_rent' | 'jobs' | 'secondhand';
  slugPrefix: string;
}

const NYCHINAREN_IMPORT_CONFIG: Record<'housing_rent' | 'jobs' | 'secondhand', NychinarenImportCategoryConfig> = {
  housing_rent: {
    label: '租房',
    forumUrl: 'https://www.nychinaren.com/f/page_viewforum/f_5.html',
    category: 'housing_rent',
    slugPrefix: 'nychinaren-housing-rent',
  },
  jobs: {
    label: '招聘',
    forumUrl: 'https://www.nychinaren.com/f/page_viewforum/f_29.html',
    category: 'jobs',
    slugPrefix: 'nychinaren-jobs',
  },
  secondhand: {
    label: '二手',
    forumUrl: 'https://www.nychinaren.com/f/page_viewforum/f_3.html',
    category: 'secondhand',
    slugPrefix: 'nychinaren-secondhand',
  },
};

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x2F;/gi, '/');
}

function stripHtml(input: string): string {
  const withNewlines = input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n');
  const noTags = withNewlines.replace(/<[^>]+>/g, ' ');
  return decodeHtmlEntities(noTags)
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

async function fetchHtml(url: string): Promise<string> {
  const { stdout } = await execFileAsync(
    'curl',
    ['-sL', '--retry', '2', '--connect-timeout', '15', '-A', 'Mozilla/5.0 (Baam Admin Importer)', url],
    { maxBuffer: 20 * 1024 * 1024 },
  );
  return stdout || '';
}

async function fetchNychinarenHtml(url: string): Promise<string> {
  const { stdout } = await execFileAsync(
    'curl',
    [
      '-sL',
      '--retry',
      '2',
      '--connect-timeout',
      '15',
      '-A',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      url,
    ],
    { maxBuffer: 20 * 1024 * 1024 },
  );
  return stdout || '';
}

function normalizePostUrl(href: string): string {
  const cleaned = href
    .replace(/^https?:\/\/c\.dadi360\.com/i, '')
    .replace(/;jsessionid=[^"?#]+/i, '');
  return `https://c.dadi360.com${cleaned.startsWith('/') ? cleaned : `/${cleaned}`}`;
}

function extractForumTopics(html: string, maxItems: number): Array<{ postId: string; title: string; url: string }> {
  const out: Array<{ postId: string; title: string; url: string }> = [];
  const seen = new Set<string>();
  const re = /href="(\/c\/posts\/list\/(\d+)\.page[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const postId = match[2];
    if (!postId || seen.has(postId)) continue;
    const title = stripHtml(match[3] || '');
    if (!title) continue;
    seen.add(postId);
    out.push({ postId, title, url: normalizePostUrl(match[1]) });
    if (out.length >= maxItems) break;
  }
  return out;
}

function buildForumPageUrls(baseForumUrl: string, maxPageCount: number, step: number): string[] {
  const m = baseForumUrl.match(/\/show\/(?:\d+\/)?(\d+)\.page/i);
  if (!m?.[1]) return [baseForumUrl];
  const forumId = m[1];
  const root = 'https://c.dadi360.com/c/forums';
  const out: string[] = [];
  for (let i = 0; i < maxPageCount; i += 1) {
    const offset = i * step;
    out.push(offset === 0 ? `${root}/show/${forumId}.page` : `${root}/show/${offset}/${forumId}.page`);
  }
  return out;
}

function buildNychinarenForumPageUrls(baseForumUrl: string, maxPageCount: number, step: number): string[] {
  const out: string[] = [];
  const normalizedBase = baseForumUrl.replace(/\/start_\d+\.html$/i, '.html');
  for (let i = 0; i < maxPageCount; i += 1) {
    const offset = i * step;
    out.push(offset === 0 ? normalizedBase : normalizedBase.replace(/\.html$/i, `/start_${offset}.html`));
  }
  return out;
}

function extractMainPostBody(detailHtml: string): string {
  const primary = detailHtml.match(
    /id="post_text_\d+"[\s\S]*?<div class="postbody"[^>]*>\s*<div[^>]*>([\s\S]*?)<\/div>/i,
  );
  if (primary?.[1]) return stripHtml(primary[1]);
  const fallback = detailHtml.match(/文章主题:[\s\S]*?<br\s*\/?>[\s\S]*?<br\s*\/?>([\s\S]*?)<\/td>/i);
  if (fallback?.[1]) return stripHtml(fallback[1]);
  return '';
}

function normalizeNychinarenTopicUrl(href: string): string {
  if (href.startsWith('http')) return href;
  return `https://www.nychinaren.com${href.startsWith('/') ? href : `/${href}`}`;
}

function extractNychinarenForumTopics(
  html: string,
  maxItems: number,
): Array<{ postId: string; title: string; url: string }> {
  const out: Array<{ postId: string; title: string; url: string }> = [];
  const seen = new Set<string>();
  const re = /href="(\/f\/page_viewtopic\/t_(\d+)\.html)"[^>]*class="title"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const postId = match[2];
    if (!postId || seen.has(postId)) continue;
    const title = stripHtml(match[3] || '');
    if (!title) continue;
    seen.add(postId);
    out.push({
      postId,
      title,
      url: normalizeNychinarenTopicUrl(match[1]),
    });
    if (out.length >= maxItems) break;
  }
  return out;
}

function extractNychinarenMainPostBody(detailHtml: string): string {
  const m = detailHtml.match(/<p class=['"]real-content['"][^>]*>([\s\S]*?)<\/p>/i);
  if (m?.[1]) {
    const cleaned = stripHtml(replaceCloudflareProtectedEmailAnchors(m[1]))
      .replace(/联系时请一定说明是在纽约华人资讯网看到的，谢谢/g, '')
      .trim();
    if (cleaned) return cleaned;
  }
  const fallback = detailHtml.match(/<div class="post_body">([\s\S]*?)<div class="post_tail">/i);
  if (fallback?.[1]) {
    const cleaned = stripHtml(replaceCloudflareProtectedEmailAnchors(fallback[1]))
      .replace(/联系时请一定说明是在纽约华人资讯网看到的，谢谢/g, '')
      .trim();
    if (cleaned) return cleaned;
  }
  return '';
}

function decodeCloudflareProtectedEmail(encoded: string): string {
  if (!encoded || encoded.length < 4 || encoded.length % 2 !== 0) return '';
  try {
    const key = parseInt(encoded.slice(0, 2), 16);
    let out = '';
    for (let i = 2; i < encoded.length; i += 2) {
      const byte = parseInt(encoded.slice(i, i + 2), 16);
      out += String.fromCharCode(byte ^ key);
    }
    return out.includes('@') ? out : '';
  } catch {
    return '';
  }
}

function replaceCloudflareProtectedEmailAnchors(html: string): string {
  if (!html) return html;
  return html.replace(
    /<a[^>]+data-cfemail=["']([0-9a-fA-F]+)["'][^>]*>[\s\S]*?<\/a>/gi,
    (_match, encoded) => decodeCloudflareProtectedEmail(String(encoded)) || '[email protected]',
  );
}

function extractEmailFromNychinarenDetailHtml(detailHtml: string): string | null {
  if (!detailHtml) return null;
  const mainHtml =
    detailHtml.match(/<p class=['"]real-content['"][^>]*>([\s\S]*?)<\/p>/i)?.[1] ||
    detailHtml.match(/<div class="post_body">([\s\S]*?)<div class="post_tail">/i)?.[1] ||
    '';
  if (!mainHtml) return null;

  const cfEmails = [...mainHtml.matchAll(/data-cfemail=["']([0-9a-fA-F]+)["']/gi)]
    .map((m) => decodeCloudflareProtectedEmail(m[1] || ''))
    .filter(Boolean);
  if (cfEmails.length > 0) return cfEmails[0];

  return extractEmail(stripHtml(mainHtml));
}

function extractPhone(text: string): string | null {
  const phoneMatches = text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g);
  if (!phoneMatches?.length) return null;
  const digits = phoneMatches[0].replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return phoneMatches[0].trim();
}

function extractEmail(text: string): string | null {
  const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m?.[0]?.trim() || null;
}

function extractPriceText(text: string): string | null {
  const normalized = text.replace(/，/g, ',');
  const monthly = normalized.match(/\$?\s?\d[\d,]{1,6}\s*(?:\/月|月租|每月|\/mo|\/month|美金|美元)/i);
  if (monthly?.[0]) return monthly[0].replace(/\s+/g, '').replace(/\/month/i, '/月').replace(/\/mo/i, '/月');
  const daily = normalized.match(/\$?\s?\d[\d,]{1,6}\s*(?:\/天|每天|日租)/i);
  if (daily?.[0]) return daily[0].replace(/\s+/g, '');
  const withCurrency = normalized.match(/(?:\$|¥|￥)\s?\d[\d,]{1,6}/i);
  if (withCurrency?.[0]) return withCurrency[0].replace(/\s+/g, '');
  const negotiable = normalized.match(/面议|免费/i);
  if (negotiable?.[0]) return negotiable[0];
  return null;
}

function extractBedrooms(text: string): number | null {
  const m = text.match(/([1-8])\s*房/i) || text.match(/([1-8])\s*室/i);
  return m?.[1] ? Number(m[1]) : null;
}

function extractBathrooms(text: string): number | null {
  const m = text.match(/([1-4](?:\.5)?)\s*(?:卫|浴)/i);
  return m?.[1] ? Number(m[1]) : null;
}

function extractRentAmount(text: string): number | null {
  const m = text.match(/\$?\s?(\d{3,5})(?:\s*\/月|\s*月租|\s*每月|\s*美金|\s*美元)/i);
  return m?.[1] ? Number(m[1].replace(/,/g, '')) : null;
}

function detectNeighborhood(text: string): string | null {
  const candidates: Array<[RegExp, string]> = [
    [/法拉盛|flushing/i, 'Flushing'],
    [/elmhurst|艾姆赫斯特/i, 'Elmhurst'],
    [/bayside|贝赛/i, 'Bayside'],
    [/woodside/i, 'Woodside'],
    [/long island city|lic|长岛市/i, 'Long Island City'],
    [/corona/i, 'Corona'],
    [/sunset park|日落公园/i, 'Sunset Park'],
    [/murray hill/i, 'Murray Hill'],
    [/manhattan|华埠|chinatown/i, 'Chinatown'],
    [/brooklyn|布碌仑|布鲁克林/i, 'Brooklyn'],
    [/queens|皇后区/i, 'Queens'],
  ];
  for (const [re, label] of candidates) {
    if (re.test(text)) return label;
  }
  return null;
}

function detectJobType(text: string): string | null {
  if (/兼职|part[\s-]?time/i.test(text)) return 'part_time';
  if (/全职|full[\s-]?time/i.test(text)) return 'full_time';
  if (/远程|remote/i.test(text)) return 'remote';
  return null;
}

function detectCondition(text: string): string | null {
  if (/全新|new\b/i.test(text)) return 'new';
  if (/9成新|95新|like new/i.test(text)) return 'like_new';
  if (/8成新|七成新|良好|good\b/i.test(text)) return 'good';
  return null;
}

function detectCompany(text: string): string | null {
  const m =
    text.match(/(?:公司|餐馆|店名|雇主)[:：]\s*([^\n,，。]{2,36})/i) ||
    text.match(/([^\n,，。]{2,36})(?:公司|餐馆|超市|物流)\s*(?:招聘|请人)/i);
  return m?.[1]?.trim() || null;
}

function displayJobType(value: string | null | undefined): string {
  if (!value) return '';
  if (value === 'full_time') return '全职';
  if (value === 'part_time') return '兼职';
  if (value === 'remote') return '远程';
  return value;
}

function displayCondition(value: string | null | undefined): string {
  if (!value) return '';
  if (value === 'new') return '全新';
  if (value === 'like_new') return '9成新';
  if (value === 'good') return '8成新';
  return value;
}

const DEFAULT_IMPORT_CONTACT_NAME = 'Guest Sam';
const DEFAULT_IMPORT_CONTACT_EMAIL = 'guest-sam1@gmail.com';

function formatStructuredContact(contactName: string, contactPhone: string | null, contactEmail: string): string {
  const normalizedName =
    contactName.trim().toLowerCase() === DEFAULT_IMPORT_CONTACT_NAME.toLowerCase() ? '' : contactName.trim();
  const normalizedEmail =
    contactEmail.trim().toLowerCase() === DEFAULT_IMPORT_CONTACT_EMAIL.toLowerCase() ? '' : contactEmail.trim();
  return [normalizedName, (contactPhone || '').trim(), normalizedEmail].filter(Boolean).join(' / ') || '未提供';
}

function buildStructuredImportedBody(
  category: 'housing_rent' | 'jobs' | 'secondhand',
  title: string,
  rawBody: string,
  metadata: AnyRow,
  priceText: string | null,
  contactName: string,
  contactPhone: string | null,
  contactEmail: string,
): string {
  const cleanBody = (rawBody || '').trim();
  if (/^【[^】]+】/m.test(cleanBody)) return cleanBody;

  const contactText = formatStructuredContact(contactName, contactPhone, contactEmail);

  if (category === 'jobs') {
    const lines = [
      `【职位】${title}`,
      `【公司】${metadata.company || '未提供'}`,
      `【地点】${metadata.job_location || metadata.neighborhood || '未提供'}`,
      `【时间】${[displayJobType(metadata.job_type), metadata.work_hours || ''].filter(Boolean).join(' / ') || '未提供'}`,
      `【薪资】${metadata.salary_range || priceText || '未提供'}`,
      `【要求】${metadata.job_requirements || '未提供'}`,
      `【联系方式】${contactText}`,
    ];
    return cleanBody ? `${lines.join('\n')}\n\n【补充说明】\n${cleanBody}` : lines.join('\n');
  }

  if (category === 'housing_rent') {
    const roomText = [metadata.bedrooms ? `${metadata.bedrooms}室` : '', metadata.bathrooms ? `${metadata.bathrooms}卫` : '']
      .filter(Boolean)
      .join(' ') || '未提供';
    const lines = [
      `【标题】${title}`,
      `【房型】${roomText}`,
      `【地区】${metadata.neighborhood || '未提供'}`,
      `【租金】${priceText || (metadata.rent_amount ? `$${metadata.rent_amount}/月` : '未提供')}`,
      `【联系方式】${contactText}`,
    ];
    return cleanBody ? `${lines.join('\n')}\n\n【补充说明】\n${cleanBody}` : lines.join('\n');
  }

  const lines = [
    `【商品】${title}`,
    `【成色】${displayCondition(metadata.condition) || '未提供'}`,
    `【品牌】${metadata.brand || '未提供'}`,
    `【售价】${priceText || '未提供'}`,
    `【交易地点】${metadata.meetup_location || '未提供'}`,
    `【联系方式】${contactText}`,
  ];
  return cleanBody ? `${lines.join('\n')}\n\n【补充说明】\n${cleanBody}` : lines.join('\n');
}

function isLikelyForCategory(category: 'housing_rent' | 'jobs' | 'secondhand', title: string, body: string): boolean {
  const text = `${title}\n${body}`.toLowerCase();
  if (category === 'housing_rent') {
    const include = ['出租', '租房', '单房', '套房', '床位', '室友', '短租', '长租', '公寓', 'apartment', '车位'];
    const blocked = ['按摩店请人', '赌博', '毒品'];
    if (blocked.some((w) => text.includes(w))) return false;
    return include.some((w) => text.includes(w));
  }
  if (category === 'jobs') {
    const include = ['招聘', '请人', '招工', '诚聘', '招聘启事', '兼职', '全职', 'hiring'];
    const blocked = ['求职', '出租', '转让', '二手'];
    if (blocked.some((w) => text.includes(w))) return false;
    return include.some((w) => text.includes(w));
  }
  const include = ['二手', '转让', '出售', '甩卖', '出让', '卖'];
  const blocked = ['招聘', '请人', '求职', '出租', '租房'];
  if (blocked.some((w) => text.includes(w))) return false;
  return include.some((w) => text.includes(w));
}

async function loadExistingSourcePostIds(
  supabase: AnyRow,
  siteId: string,
  category: 'housing_rent' | 'jobs' | 'secondhand',
  source: 'dadi360' | 'nychinaren',
) {
  const out = new Set<string>();
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('classifieds')
      .select('metadata')
      .eq('site_id', siteId)
      .eq('category', category)
      .range(from, to);
    if (error) throw new Error(error.message);
    const rows = (data || []) as AnyRow[];
    for (const row of rows) {
      const sourceValue = row?.metadata?.source;
      const postId = row?.metadata?.source_post_id;
      if (sourceValue === source && typeof postId === 'string') out.add(postId);
    }
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

interface SingleImportStats {
  target: 'housing_rent' | 'jobs' | 'secondhand';
  label: string;
  scannedTopics: number;
  prepared: number;
  inserted: number;
  skippedExisting: number;
  skippedNoBody: number;
  skippedFiltered: number;
  failed: number;
}

async function importSingleDadi360Category(
  supabase: AnyRow,
  siteId: string,
  authorId: string,
  authorName: string,
  authorEmail: string,
  cfg: DadiImportCategoryConfig,
): Promise<SingleImportStats> {
  const existingPostIds = await loadExistingSourcePostIds(supabase, siteId, cfg.category, 'dadi360');
  const maxNewItemsPerRun = existingPostIds.size === 0 ? 100 : 50;
  const pageUrls = buildForumPageUrls(cfg.forumUrl, 8, 90);
  const seenTopicIds = new Set<string>();
  const queuedTopics: Array<{ postId: string; title: string; url: string }> = [];
  let skippedExisting = 0;
  let existingStreak = 0;

  for (const pageUrl of pageUrls) {
    const forumHtml = await fetchHtml(pageUrl);
    const topics = extractForumTopics(forumHtml, 140);
    for (const topic of topics) {
      if (seenTopicIds.has(topic.postId)) continue;
      seenTopicIds.add(topic.postId);
      if (existingPostIds.has(topic.postId)) {
        skippedExisting += 1;
        existingStreak += 1;
        continue;
      }
      existingStreak = 0;
      queuedTopics.push(topic);
      if (queuedTopics.length >= maxNewItemsPerRun * 3) break;
    }
    if (queuedTopics.length >= maxNewItemsPerRun * 3 || existingStreak >= 35) break;
  }

  const preparedRows: AnyRow[] = [];
  let skippedNoBody = 0;
  let skippedFiltered = 0;
  for (const topic of queuedTopics) {
    const detailHtml = await fetchHtml(topic.url);
    const body = extractMainPostBody(detailHtml);
    if (!body) {
      skippedNoBody += 1;
      continue;
    }
    if (!isLikelyForCategory(cfg.category, topic.title, body)) {
      skippedFiltered += 1;
      continue;
    }

    const joinedText = `${topic.title}\n${body}`;
    const phone = extractPhone(joinedText);
    const extractedEmail = extractEmail(joinedText) || extractEmailFromNychinarenDetailHtml(detailHtml);
    const contactEmail = extractedEmail || authorEmail;
    const priceText = extractPriceText(joinedText);
    const nowIso = new Date().toISOString();
    const metadata: AnyRow = {
      source: 'dadi360',
      source_forum_url: cfg.forumUrl,
      source_post_url: topic.url,
      source_post_id: topic.postId,
      imported_at: nowIso,
    };

    if (cfg.category === 'housing_rent') {
      const bedrooms = extractBedrooms(joinedText);
      const bathrooms = extractBathrooms(joinedText);
      const rentAmount = extractRentAmount(joinedText);
      const neighborhood = detectNeighborhood(joinedText);
      if (bedrooms !== null) metadata.bedrooms = bedrooms;
      if (bathrooms !== null) metadata.bathrooms = bathrooms;
      if (rentAmount !== null) metadata.rent_amount = rentAmount;
      if (neighborhood) metadata.neighborhood = neighborhood;
    } else if (cfg.category === 'jobs') {
      const jobType = detectJobType(joinedText);
      const company = detectCompany(joinedText);
      if (priceText) metadata.salary_range = priceText;
      if (jobType) metadata.job_type = jobType;
      if (company) metadata.company = company;
      if (detectNeighborhood(joinedText)) metadata.job_location = detectNeighborhood(joinedText);
    } else if (cfg.category === 'secondhand') {
      const condition = detectCondition(joinedText);
      if (condition) metadata.condition = condition;
    }

    const structuredBody = buildStructuredImportedBody(
      cfg.category,
      topic.title.slice(0, 180),
      body.slice(0, 5000),
      metadata,
      priceText,
      authorName,
      phone,
      contactEmail,
    );

    preparedRows.push({
      slug: `${cfg.slugPrefix}-${topic.postId}`,
      site_id: siteId,
      title: topic.title.slice(0, 180),
      body: structuredBody,
      category: cfg.category,
      sub_category: 'external_import',
      author_id: authorId,
      contact_name: authorName,
      contact_email: contactEmail,
      contact_phone: phone,
      price_text: priceText,
      status: 'active',
      language: 'zh',
      metadata,
    });

    if (preparedRows.length >= maxNewItemsPerRun) break;
  }

  let inserted = 0;
  let failed = 0;
  for (const row of preparedRows) {
    const { error } = await supabase
      .from('classifieds')
      .upsert(row, { onConflict: 'slug', ignoreDuplicates: false });
    if (error) {
      failed += 1;
    } else {
      inserted += 1;
    }
  }

  return {
    target: cfg.category,
    label: cfg.label,
    scannedTopics: seenTopicIds.size,
    prepared: preparedRows.length,
    inserted,
    skippedExisting,
    skippedNoBody,
    skippedFiltered,
    failed,
  };
}

async function importSingleNychinarenCategory(
  supabase: AnyRow,
  siteId: string,
  authorId: string,
  authorName: string,
  authorEmail: string,
  cfg: NychinarenImportCategoryConfig,
): Promise<SingleImportStats> {
  const existingPostIds = await loadExistingSourcePostIds(supabase, siteId, cfg.category, 'nychinaren');
  const maxNewItemsPerRun = existingPostIds.size === 0 ? 100 : 50;
  const pageUrls = buildNychinarenForumPageUrls(cfg.forumUrl, 10, 15);
  const seenTopicIds = new Set<string>();
  const queuedTopics: Array<{ postId: string; title: string; url: string }> = [];
  let skippedExisting = 0;
  let existingStreak = 0;

  for (const pageUrl of pageUrls) {
    const forumHtml = await fetchNychinarenHtml(pageUrl);
    const topics = extractNychinarenForumTopics(forumHtml, 180);
    for (const topic of topics) {
      if (seenTopicIds.has(topic.postId)) continue;
      seenTopicIds.add(topic.postId);
      if (existingPostIds.has(topic.postId)) {
        skippedExisting += 1;
        existingStreak += 1;
        continue;
      }
      existingStreak = 0;
      queuedTopics.push(topic);
      if (queuedTopics.length >= maxNewItemsPerRun * 4) break;
    }
    if (queuedTopics.length >= maxNewItemsPerRun * 4 || existingStreak >= 45) break;
  }

  const preparedRows: AnyRow[] = [];
  let skippedNoBody = 0;
  let skippedFiltered = 0;
  for (const topic of queuedTopics) {
    const detailHtml = await fetchNychinarenHtml(topic.url);
    const body = extractNychinarenMainPostBody(detailHtml);
    if (!body) {
      skippedNoBody += 1;
      continue;
    }
    if (!isLikelyForCategory(cfg.category, topic.title, body)) {
      skippedFiltered += 1;
      continue;
    }

    const joinedText = `${topic.title}\n${body}`;
    const phone = extractPhone(joinedText);
    const extractedEmail = extractEmail(joinedText);
    const contactEmail = extractedEmail || authorEmail;
    const priceText = extractPriceText(joinedText);
    const nowIso = new Date().toISOString();
    const metadata: AnyRow = {
      source: 'nychinaren',
      source_forum_url: cfg.forumUrl,
      source_post_url: topic.url,
      source_post_id: topic.postId,
      imported_at: nowIso,
    };

    if (cfg.category === 'housing_rent') {
      const bedrooms = extractBedrooms(joinedText);
      const bathrooms = extractBathrooms(joinedText);
      const rentAmount = extractRentAmount(joinedText);
      const neighborhood = detectNeighborhood(joinedText);
      if (bedrooms !== null) metadata.bedrooms = bedrooms;
      if (bathrooms !== null) metadata.bathrooms = bathrooms;
      if (rentAmount !== null) metadata.rent_amount = rentAmount;
      if (neighborhood) metadata.neighborhood = neighborhood;
    } else if (cfg.category === 'jobs') {
      const jobType = detectJobType(joinedText);
      const company = detectCompany(joinedText);
      const location = detectNeighborhood(joinedText);
      if (priceText) metadata.salary_range = priceText;
      if (jobType) metadata.job_type = jobType;
      if (company) metadata.company = company;
      if (location) metadata.job_location = location;
    } else if (cfg.category === 'secondhand') {
      const condition = detectCondition(joinedText);
      if (condition) metadata.condition = condition;
    }

    const structuredBody = buildStructuredImportedBody(
      cfg.category,
      topic.title.slice(0, 180),
      body.slice(0, 5000),
      metadata,
      priceText,
      authorName,
      phone,
      contactEmail,
    );

    preparedRows.push({
      slug: `${cfg.slugPrefix}-${topic.postId}`,
      site_id: siteId,
      title: topic.title.slice(0, 180),
      body: structuredBody,
      category: cfg.category,
      sub_category: 'external_import',
      author_id: authorId,
      contact_name: authorName,
      contact_email: contactEmail,
      contact_phone: phone,
      price_text: priceText,
      status: 'active',
      language: 'zh',
      metadata,
    });

    if (preparedRows.length >= maxNewItemsPerRun) break;
  }

  let inserted = 0;
  let failed = 0;
  for (const row of preparedRows) {
    const { error } = await supabase
      .from('classifieds')
      .upsert(row, { onConflict: 'slug', ignoreDuplicates: false });
    if (error) {
      failed += 1;
    } else {
      inserted += 1;
    }
  }

  return {
    target: cfg.category,
    label: cfg.label,
    scannedTopics: seenTopicIds.size,
    prepared: preparedRows.length,
    inserted,
    skippedExisting,
    skippedNoBody,
    skippedFiltered,
    failed,
  };
}

export async function createClassified(formData: FormData) {
  const supabase = db();
  const ctx = await getAdminSiteContext();
  const title = formData.get('title') as string;
  const slug = await generateSeoSlug(title || 'listing', null, supabase, 'classifieds');

  const metadata: Record<string, unknown> = {};
  const category = formData.get('category') as string;
  // Cover photo and photos
  if (formData.get('cover_photo')) metadata.cover_photo = formData.get('cover_photo') as string;
  try { const p = JSON.parse(formData.get('photos') as string || '[]'); if (Array.isArray(p) && p.length > 0) metadata.photos = p; } catch {}
  // Category-specific metadata
  if (category === 'housing_rent' || category === 'housing_buy') {
    if (formData.get('bedrooms')) metadata.bedrooms = parseInt(formData.get('bedrooms') as string);
    if (formData.get('bathrooms')) metadata.bathrooms = parseInt(formData.get('bathrooms') as string);
    if (formData.get('rent_amount')) metadata.rent_amount = parseFloat(formData.get('rent_amount') as string);
    if (formData.get('neighborhood')) metadata.neighborhood = formData.get('neighborhood') as string;
  } else if (category === 'jobs') {
    if (formData.get('salary_range')) metadata.salary_range = formData.get('salary_range') as string;
    if (formData.get('job_type')) metadata.job_type = formData.get('job_type') as string;
    if (formData.get('company')) metadata.company = formData.get('company') as string;
  } else if (category === 'secondhand') {
    if (formData.get('condition')) metadata.condition = formData.get('condition') as string;
    if (formData.get('original_price')) metadata.original_price = parseFloat(formData.get('original_price') as string);
  }

  const { data, error } = await supabase
    .from('classifieds')
    .insert({
      slug,
      site_id: ctx.siteId,
      title,
      body: formData.get('body') as string || null,
      category,
      sub_category: formData.get('sub_category') as string || null,
      price_text: formData.get('price_text') as string || null,
      contact_name: formData.get('contact_name') as string || null,
      contact_phone: formData.get('contact_phone') as string || null,
      contact_email: formData.get('contact_email') as string || null,
      contact_wechat: formData.get('contact_wechat') as string || null,
      status: formData.get('status') as string || 'active',
      is_featured: formData.get('is_featured') === 'true',
      author_id: formData.get('author_id') as string || null,
      metadata,
    })
    .select('id')
    .single();

  revalidatePath('/admin/classifieds');
  if (error) return { id: null, error: error.message };
  return { id: data?.id, error: null };
}

export async function updateClassified(id: string, formData: FormData) {
  const supabase = db();
  const category = formData.get('category') as string;

  const metadata: Record<string, unknown> = {};
  // Cover photo and photos
  if (formData.get('cover_photo')) metadata.cover_photo = formData.get('cover_photo') as string;
  try { const p = JSON.parse(formData.get('photos') as string || '[]'); if (Array.isArray(p) && p.length > 0) metadata.photos = p; } catch {}
  if (category === 'housing_rent' || category === 'housing_buy') {
    if (formData.get('bedrooms')) metadata.bedrooms = parseInt(formData.get('bedrooms') as string);
    if (formData.get('bathrooms')) metadata.bathrooms = parseInt(formData.get('bathrooms') as string);
    if (formData.get('rent_amount')) metadata.rent_amount = parseFloat(formData.get('rent_amount') as string);
    if (formData.get('neighborhood')) metadata.neighborhood = formData.get('neighborhood') as string;
  } else if (category === 'jobs') {
    if (formData.get('salary_range')) metadata.salary_range = formData.get('salary_range') as string;
    if (formData.get('job_type')) metadata.job_type = formData.get('job_type') as string;
    if (formData.get('company')) metadata.company = formData.get('company') as string;
  } else if (category === 'secondhand') {
    if (formData.get('condition')) metadata.condition = formData.get('condition') as string;
    if (formData.get('original_price')) metadata.original_price = parseFloat(formData.get('original_price') as string);
  }

  const { error } = await supabase
    .from('classifieds')
    .update({
      title: formData.get('title') as string,
      body: formData.get('body') as string || null,
      category,
      sub_category: formData.get('sub_category') as string || null,
      price_text: formData.get('price_text') as string || null,
      contact_name: formData.get('contact_name') as string || null,
      contact_phone: formData.get('contact_phone') as string || null,
      contact_email: formData.get('contact_email') as string || null,
      contact_wechat: formData.get('contact_wechat') as string || null,
      status: formData.get('status') as string,
      is_featured: formData.get('is_featured') === 'true',
      metadata,
    })
    .eq('id', id);

  revalidatePath('/admin/classifieds');
  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteClassified(id: string) {
  const supabase = db();
  const { error } = await supabase.from('classifieds').delete().eq('id', id);
  revalidatePath('/admin/classifieds');
  if (error) return { error: error.message };
  return { error: null };
}

export async function toggleClassifiedFeatured(id: string, current: boolean) {
  const supabase = db();
  const { error } = await supabase.from('classifieds').update({ is_featured: !current }).eq('id', id);
  revalidatePath('/admin/classifieds');
  revalidatePath('/');
  revalidatePath('/zh');
  revalidatePath('/en');
  revalidatePath('/zh/homepage-v2');
  revalidatePath('/en/homepage-v2');
  if (error) return { error: error.message };
  return { error: null, is_featured: !current };
}

export async function setClassifiedStatus(id: string, status: string) {
  const supabase = db();
  const { error } = await supabase.from('classifieds').update({ status }).eq('id', id);
  revalidatePath('/admin/classifieds');
  if (error) return { error: error.message };
  return { error: null };
}

export async function runDadi360Import(target: DadiImportTarget) {
  const supabase = db();
  const ctx = await getAdminSiteContext();
  const authorName = 'Guest Sam';
  const authorEmail = 'guest-sam1@gmail.com';

  if (!ctx.siteId) {
    return { ok: false, message: '未找到当前站点，无法导入。', results: [] as SingleImportStats[] };
  }

  const { data: authorRows, error: authorErr } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('display_name', authorName)
    .limit(1);
  if (authorErr) {
    return { ok: false, message: `读取作者失败: ${authorErr.message}`, results: [] as SingleImportStats[] };
  }
  const authorId = (authorRows?.[0] as AnyRow | undefined)?.id;
  if (!authorId) {
    return {
      ok: false,
      message: `未找到作者 ${authorName}，请先创建该用户资料后再导入。`,
      results: [] as SingleImportStats[],
    };
  }

  const targets: Array<'housing_rent' | 'jobs' | 'secondhand'> =
    target === 'all' ? ['housing_rent', 'jobs', 'secondhand'] : [target];

  const results: SingleImportStats[] = [];
  for (const t of targets) {
    try {
      const result = await importSingleDadi360Category(
        supabase,
        ctx.siteId,
        authorId,
        authorName,
        authorEmail,
        DADI360_IMPORT_CONFIG[t],
      );
      results.push(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        target: t,
        label: DADI360_IMPORT_CONFIG[t].label,
        scannedTopics: 0,
        prepared: 0,
        inserted: 0,
        skippedExisting: 0,
        skippedNoBody: 0,
        skippedFiltered: 0,
        failed: 1,
      });
      return { ok: false, message: `${DADI360_IMPORT_CONFIG[t].label} 导入失败: ${message}`, results };
    }
  }

  revalidatePath('/admin/classifieds');
  revalidatePath('/zh/classifieds/housing');
  revalidatePath('/zh/classifieds/jobs');
  revalidatePath('/zh/classifieds/secondhand');

  const insertedTotal = results.reduce((sum, r) => sum + r.inserted, 0);
  const existingTotal = results.reduce((sum, r) => sum + r.skippedExisting, 0);
  const failedTotal = results.reduce((sum, r) => sum + r.failed, 0);

  return {
    ok: failedTotal === 0,
    message: `导入完成：新增 ${insertedTotal} 条，已存在跳过 ${existingTotal} 条，失败 ${failedTotal} 条。`,
    results,
  };
}

export async function runNychinarenImport(target: NychinarenImportTarget) {
  const supabase = db();
  const ctx = await getAdminSiteContext();
  const authorName = 'Guest Sam';
  const authorEmail = 'guest-sam1@gmail.com';

  if (!ctx.siteId) {
    return { ok: false, message: '未找到当前站点，无法导入。', results: [] as SingleImportStats[] };
  }

  const { data: authorRows, error: authorErr } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('display_name', authorName)
    .limit(1);
  if (authorErr) {
    return { ok: false, message: `读取作者失败: ${authorErr.message}`, results: [] as SingleImportStats[] };
  }
  const authorId = (authorRows?.[0] as AnyRow | undefined)?.id;
  if (!authorId) {
    return {
      ok: false,
      message: `未找到作者 ${authorName}，请先创建该用户资料后再导入。`,
      results: [] as SingleImportStats[],
    };
  }

  const targets: Array<'housing_rent' | 'jobs' | 'secondhand'> =
    target === 'all' ? ['housing_rent', 'jobs', 'secondhand'] : [target];

  const results: SingleImportStats[] = [];
  for (const t of targets) {
    try {
      const result = await importSingleNychinarenCategory(
        supabase,
        ctx.siteId,
        authorId,
        authorName,
        authorEmail,
        NYCHINAREN_IMPORT_CONFIG[t],
      );
      results.push(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        target: t,
        label: NYCHINAREN_IMPORT_CONFIG[t].label,
        scannedTopics: 0,
        prepared: 0,
        inserted: 0,
        skippedExisting: 0,
        skippedNoBody: 0,
        skippedFiltered: 0,
        failed: 1,
      });
      return { ok: false, message: `${NYCHINAREN_IMPORT_CONFIG[t].label} 导入失败: ${message}`, results };
    }
  }

  revalidatePath('/admin/classifieds');
  revalidatePath('/zh/classifieds/housing');
  revalidatePath('/zh/classifieds/jobs');
  revalidatePath('/zh/classifieds/secondhand');

  const insertedTotal = results.reduce((sum, r) => sum + r.inserted, 0);
  const existingTotal = results.reduce((sum, r) => sum + r.skippedExisting, 0);
  const failedTotal = results.reduce((sum, r) => sum + r.failed, 0);

  return {
    ok: failedTotal === 0,
    message: `导入完成：新增 ${insertedTotal} 条，已存在跳过 ${existingTotal} 条，失败 ${failedTotal} 条。`,
    results,
  };
}
