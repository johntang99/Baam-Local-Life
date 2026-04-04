/**
 * Backfill Business Details: Hours, Chinese Names, Descriptions, Contact
 *
 * Google Place Details (Places API v1) is the source of truth for:
 * - hours_json, website_url, phone — English request (one call)
 * - display_name_zh — only from Google zh-CN displayName (CJK); never invented
 * - short_desc_* — Google editorial + optional AI (--skip-ai turns AI off)
 *
 * Data safety: we only fill empty fields (never overwrite existing website/phone/hours
 * with blanks). Phone: nationalPhoneNumber, else internationalPhoneNumber.
 *
 * Hours + website + phone (one full English Place Details call per business; no AI / no zh-CN call):
 *   npx tsx scripts/backfill-business-details.ts --apply --contact-only --concurrency=4 --delay-ms=60
 *
 * Usage:
 *   # Dry run
 *   set -a && source <(grep -v '^#' apps/web/.env.local | grep -v '^$' | grep -v '@') && set +a && npx tsx scripts/backfill-business-details.ts
 *
 *   # Apply
 *   set -a && source <(grep -v '^#' apps/web/.env.local | grep -v '^$' | grep -v '@') && set +a && npx tsx scripts/backfill-business-details.ts --apply
 *
 *   # Limit for testing
 *   set -a && source <(grep -v '^#' apps/web/.env.local | grep -v '^$' | grep -v '@') && set +a && npx tsx scripts/backfill-business-details.ts --apply --limit=20
 *
 *   npx tsx scripts/backfill-business-details.ts --apply --region-slugs=lower-east-side-ny,murray-hill-queens-ny
 *
 *   npx tsx scripts/backfill-business-details.ts --apply --contact-only --concurrency=4
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

const args = process.argv.slice(2);
const applyChanges = args.includes('--apply');
const contactOnly = args.includes('--contact-only');
const limitArg = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0') || 0;
const concurrency = Math.max(1, parseInt(args.find((a) => a.startsWith('--concurrency='))?.split('=')[1] || '1', 10) || 1);
const delayArg = args.find((a) => a.startsWith('--delay-ms='))?.split('=')[1];
const parsedDelay = delayArg !== undefined ? Math.max(0, parseInt(delayArg, 10) || 0) : NaN;
const delayAfterBatch = Number.isNaN(parsedDelay) ? (contactOnly ? 80 : 300) : parsedDelay;
const skipAI = args.includes('--skip-ai');
const regionSlugsArg = args.find((a) => a.startsWith('--region-slugs='));
const regionSlugs = regionSlugsArg
  ? regionSlugsArg
      .slice('--region-slugs='.length)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

type AnyRow = Record<string, any>;
const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };

// ─── Supabase helpers ────────────────────────────────────────────

async function supaGet(path: string): Promise<AnyRow[]> {
  const allResults: AnyRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}&limit=1000&offset=${offset}`, { headers: H });
    if (!res.ok) throw new Error(`Supabase GET ${res.status}`);
    const batch = await res.json();
    allResults.push(...batch);
    if (batch.length < 1000) break;
  }
  return allResults;
}

async function supaPatch(table: string, id: string, data: AnyRow) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase PATCH ${res.status}: ${(await res.text()).slice(0, 100)}`);
}

async function businessIdsInRegionSlugs(slugs: string[]): Promise<Set<string>> {
  const slugList = slugs.map((s) => encodeURIComponent(s)).join(',');
  const regions = await supaGet(`regions?slug=in.(${slugList})&select=id,slug`);
  const found = new Set(regions.map((r: AnyRow) => r.slug));
  const missing = slugs.filter((s) => !found.has(s));
  if (missing.length > 0) throw new Error(`Unknown region slug(s): ${missing.join(', ')}`);
  const rids = regions.map((r: AnyRow) => r.id).join(',');
  const locs = await supaGet(
    `business_locations?region_id=in.(${rids})&is_primary=eq.true&select=business_id`,
  );
  return new Set(locs.map((l: AnyRow) => l.business_id));
}

// ─── Google Places API ───────────────────────────────────────────

async function getPlaceDetailsEN(placeId: string): Promise<AnyRow | null> {
  const id = placeId.startsWith('places/') ? placeId : `places/${placeId}`;
  const res = await fetch(`https://places.googleapis.com/v1/${id}`, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask':
        'displayName,regularOpeningHours,editorialSummary,businessStatus,primaryType,primaryTypeDisplayName,types,websiteUri,nationalPhoneNumber,internationalPhoneNumber',
      'X-Goog-Api-Language': 'en',
    },
    signal: AbortSignal.timeout(10000),
  });
  if (res.status === 429) throw new Error('RATE_LIMITED');
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

async function getPlaceDetailsZH(placeId: string): Promise<AnyRow | null> {
  const id = placeId.startsWith('places/') ? placeId : `places/${placeId}`;
  const res = await fetch(`https://places.googleapis.com/v1/${id}`, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'displayName,editorialSummary,primaryTypeDisplayName',
      'X-Goog-Api-Language': 'zh-CN',
    },
    signal: AbortSignal.timeout(10000),
  });
  if (res.status === 429) throw new Error('RATE_LIMITED');
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

// ─── Hours conversion ────────────────────────────────────────────

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function pad2(n: number): string {
  return String(n ?? 0).padStart(2, '0');
}

/** Match backfill-hours-google.ts: periods may omit close (same-day end 23:59); last period wins per weekday */
function convertHours(googleHours: AnyRow | undefined): AnyRow | null {
  const periods = googleHours?.periods;
  if (!Array.isArray(periods) || periods.length === 0) return null;
  const result: AnyRow = {};

  for (const period of periods) {
    const open = period.open;
    if (open?.day == null) continue;
    const day = DAY_NAMES[open.day];
    if (!day) continue;

    const openH = pad2(open.hour ?? 0);
    const openM = pad2(open.minute ?? 0);
    const close = period.close;
    const closeH = close != null ? pad2(close.hour ?? 0) : '23';
    const closeM = close != null ? pad2(close.minute ?? 0) : '59';

    result[day] = { open: `${openH}:${openM}`, close: `${closeH}:${closeM}` };
  }
  return Object.keys(result).length > 0 ? result : null;
}

function isBlank(s: string | null | undefined): boolean {
  return !s || !String(s).trim();
}

/** True if URL is missing or effectively empty (e.g. "https://" only). */
function isBlankWebsite(url: string | null | undefined): boolean {
  if (!url || !String(url).trim()) return true;
  const path = String(url).trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
  return path.length === 0;
}

function pickPhone(en: AnyRow): string | null {
  const n = en.nationalPhoneNumber?.trim();
  if (n) return n;
  return en.internationalPhoneNumber?.trim() || null;
}

function normalizeWebsite(url: string): string {
  const u = url.trim();
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

function needsChineseDisplayName(b: AnyRow): boolean {
  const zh = b.display_name_zh?.trim();
  if (!zh) return true;
  return !/[\u4e00-\u9fff]/.test(zh);
}

// ─── AI Description Generation ───────────────────────────────────

let anthropic: any = null;

async function generateDescriptions(biz: AnyRow, googleEN: AnyRow | null, googleZH: AnyRow | null, reviews: AnyRow[]): Promise<{ zh: string; en: string } | null> {
  if (!ANTHROPIC_API_KEY) return null;

  if (!anthropic) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }

  // Build context from all available data
  const name = biz.display_name_zh || biz.display_name || '';
  const enName = biz.display_name || '';
  const addr = biz.address_full || '';
  const phone = biz.phone || '';
  const rating = biz.avg_rating ? `${biz.avg_rating}分(${biz.review_count || 0}条评价)` : '';
  const googleDesc = googleEN?.editorialSummary?.text || '';
  const googleDescZH = googleZH?.editorialSummary?.text || '';
  const googleType = googleEN?.primaryTypeDisplayName?.text || '';
  const googleTypeZH = googleZH?.primaryTypeDisplayName?.text || '';
  const website = biz.website_url || '';
  const tags = (biz.ai_tags || []).join('、');

  // Include review snippets
  const reviewSnippets = reviews
    .filter(r => r.body && r.body.length > 10)
    .slice(0, 3)
    .map(r => `"${r.body.slice(0, 80)}" (${r.rating}星)`)
    .join('\n');

  const prompt = `为以下商家撰写中文和英文简介。

商家信息：
- 名称：${name} / ${enName}
- 类型：${googleTypeZH || googleType || ''}
- 地址：${addr}
- 评分：${rating}
- 标签：${tags}
${googleDesc ? `- Google描述：${googleDesc}` : ''}
${googleDescZH ? `- Google中文描述：${googleDescZH}` : ''}
${reviewSnippets ? `- 用户评价摘录：\n${reviewSnippets}` : ''}
${website ? `- 网站：${website}` : ''}

要求：
1. 中文简介(50-100字)：用亲切自然的中文写，像本地华人介绍给朋友一样。提到特色、优势、适合什么人群。不要翻译腔。
2. 英文简介(30-60 words)：Professional, concise, highlight key features.
3. 内容要准确，只写有依据的信息，不要编造。如果信息不足，写简短精炼的介绍即可。

格式（严格遵守）：
ZH: [中文简介]
EN: [English description]`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const zhMatch = text.match(/ZH:\s*(.+?)(?:\n|EN:)/s);
    const enMatch = text.match(/EN:\s*(.+?)$/s);

    const zh = zhMatch?.[1]?.trim();
    const en = enMatch?.[1]?.trim();

    if (zh && en && zh.length >= 10 && en.length >= 10) {
      return { zh, en };
    }
  } catch {
    // AI generation failed
  }
  return null;
}

// ─── Main ────────────────────────────────────────────────────────

type Stats = { hours: number; zhName: number; descZh: number; descEn: number; website: number; phone: number; errors: number };

function emptyStats(): Stats {
  return { hours: 0, zhName: 0, descZh: 0, descEn: 0, website: 0, phone: 0, errors: 0 };
}

function mergeStats(a: Stats, b: Stats) {
  a.hours += b.hours;
  a.zhName += b.zhName;
  a.descZh += b.descZh;
  a.descEn += b.descEn;
  a.website += b.website;
  a.phone += b.phone;
  a.errors += b.errors;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function getPlaceDetailsENWithRetry(placeId: string): Promise<AnyRow | null> {
  try {
    return await getPlaceDetailsEN(placeId);
  } catch (e) {
    if (e instanceof Error && e.message === 'RATE_LIMITED') {
      console.log('   ⏳ rate limited — wait 30s');
      await sleep(30000);
      return await getPlaceDetailsEN(placeId);
    }
    throw e;
  }
}

async function getPlaceDetailsZHWithRetry(placeId: string): Promise<AnyRow | null> {
  try {
    return await getPlaceDetailsZH(placeId);
  } catch (e) {
    if (e instanceof Error && e.message === 'RATE_LIMITED') {
      await sleep(30000);
      return await getPlaceDetailsZH(placeId);
    }
    throw e;
  }
}

async function main() {
  console.log('📋 Backfill Business Details: Hours, Chinese Names, Descriptions');
  const modeBits = [
    contactOnly ? '📇 CONTACT (hours+web+phone, full EN Place)' : null,
    skipAI ? 'skip AI' : null,
    regionSlugs?.length ? `regions: ${regionSlugs.join(', ')}` : null,
  ].filter(Boolean);
  console.log(
    `   Mode: ${applyChanges ? '✅ APPLY' : '👀 DRY RUN'}${modeBits.length ? ` · ${modeBits.join(' · ')}` : ''}`,
  );
  console.log(`   concurrency=${concurrency} · delay ${delayAfterBatch}ms between batches\n`);

  // Fetch all businesses with gaps
  const businesses = await supaGet('businesses?is_active=eq.true&google_place_id=not.is.null&select=id,display_name,display_name_zh,phone,website_url,short_desc_en,short_desc_zh,address_full,avg_rating,review_count,ai_tags,google_place_id&order=review_count.desc.nullslast');
  const locations = await supaGet('business_locations?is_primary=eq.true&select=id,business_id,hours_json');
  const locMap = new Map(locations.map(l => [l.business_id, l]));

  // Fetch reviews for AI descriptions (not needed for --contact-only)
  let reviewMap: Map<string, AnyRow[]> = new Map();
  if (!skipAI && !contactOnly) {
    const reviews = await supaGet('reviews?source=eq.google&status=eq.approved&select=business_id,body,rating&order=rating.desc');
    for (const r of reviews) {
      if (!reviewMap.has(r.business_id)) reviewMap.set(r.business_id, []);
      const list = reviewMap.get(r.business_id)!;
      if (list.length < 3) list.push(r);
    }
  }

  // Filter to businesses that need updates
  let needsWork = businesses.filter((b) => {
    const loc = locMap.get(b.id);
    const needsHours = Boolean(loc && (!loc.hours_json || Object.keys(loc.hours_json).length === 0));
    const needsWebsite = isBlankWebsite(b.website_url);
    const needsPhone = isBlank(b.phone);
    if (contactOnly) return needsHours || needsWebsite || needsPhone;

    const needsZhName = needsChineseDisplayName(b);
    const needsDesc = !b.short_desc_zh || !b.short_desc_en;
    return needsHours || needsZhName || needsDesc || needsWebsite || needsPhone;
  });

  if (regionSlugs && regionSlugs.length > 0) {
    const allowed = await businessIdsInRegionSlugs(regionSlugs);
    const before = needsWork.length;
    needsWork = needsWork.filter((b) => allowed.has(b.id));
    console.log(
      `   Region filter — need work in [${regionSlugs.join(', ')}]: ${needsWork.length} (was ${before} global need-work)\n`,
    );
  }

  const toProcess = limitArg ? needsWork.slice(0, limitArg) : needsWork;
  console.log(`📊 Total: ${businesses.length} | Need updates (after filter): ${needsWork.length} | Processing: ${toProcess.length}\n`);

  const stats = emptyStats();

  /** Full profile: zh name, descriptions, AI. Contact-only skips these (still uses full EN Place Details for hours/web/phone). */
  const doFullProfile = !contactOnly;

  async function processOne(biz: AnyRow, ordinal: number): Promise<{ line: string; delta: Stats }> {
    const loc = locMap.get(biz.id);
    const displayName = (biz.display_name_zh || biz.display_name || '').slice(0, 30);
    const delta = emptyStats();
    const updates: string[] = [];

    try {
      const bizUpdate: AnyRow = {};
      const locUpdate: AnyRow = {};

      const detailEN = await getPlaceDetailsENWithRetry(biz.google_place_id);
      if (doFullProfile) await sleep(100);

      if (detailEN) {
        if (loc && (!loc.hours_json || Object.keys(loc.hours_json).length === 0)) {
          const hours = convertHours(detailEN.regularOpeningHours);
          if (hours) {
            locUpdate.hours_json = hours;
            delta.hours++;
            updates.push('hours');
          }
        }

        if (doFullProfile && !biz.short_desc_en && detailEN.editorialSummary?.text) {
          bizUpdate.short_desc_en = detailEN.editorialSummary.text;
          delta.descEn++;
          updates.push('desc_en(google)');
        }

        // Website + phone first (priority fields)
        if (isBlankWebsite(biz.website_url) && detailEN.websiteUri) {
          bizUpdate.website_url = normalizeWebsite(detailEN.websiteUri);
          delta.website++;
          updates.push('website');
        }
        const phoneVal = pickPhone(detailEN);
        if (isBlank(biz.phone) && phoneVal) {
          bizUpdate.phone = phoneVal;
          delta.phone++;
          updates.push('phone');
        }
      }

      let detailZH: AnyRow | null = null;
      if (
        doFullProfile &&
        (needsChineseDisplayName({ ...biz, ...bizUpdate }) || (!biz.short_desc_zh && !skipAI))
      ) {
        detailZH = await getPlaceDetailsZHWithRetry(biz.google_place_id);
        await sleep(100);

        if (detailZH) {
          const zhName = detailZH.displayName?.text || '';
          if (needsChineseDisplayName({ ...biz, ...bizUpdate }) && /[\u4e00-\u9fff]/.test(zhName)) {
            bizUpdate.display_name_zh = zhName;
            delta.zhName++;
            updates.push('zh_name(google)');
          }
        }
      }

      if (doFullProfile && !skipAI && (!biz.short_desc_zh || !biz.short_desc_en)) {
        const reviews = reviewMap.get(biz.id) || [];
        const descs = await generateDescriptions({ ...biz, ...bizUpdate }, detailEN, detailZH, reviews);
        if (descs) {
          if (!biz.short_desc_zh) {
            bizUpdate.short_desc_zh = descs.zh;
            delta.descZh++;
            updates.push('desc_zh(AI)');
          }
          if (!biz.short_desc_en && !bizUpdate.short_desc_en) {
            bizUpdate.short_desc_en = descs.en;
            delta.descEn++;
            updates.push('desc_en(AI)');
          }
        }
      }

      if (applyChanges) {
        if (Object.keys(bizUpdate).length > 0) await supaPatch('businesses', biz.id, bizUpdate);
        if (Object.keys(locUpdate).length > 0 && loc) await supaPatch('business_locations', loc.id, locUpdate);
      }

      const tail =
        updates.length > 0 ? `✅ ${updates.join(', ')}` : '— nothing new from Google';
      return { line: `  [${ordinal}/${toProcess.length}] ${displayName.padEnd(32)} ${tail}`, delta };
    } catch (err) {
      delta.errors++;
      const msg = err instanceof Error ? err.message.slice(0, 60) : 'error';
      return { line: `  [${ordinal}/${toProcess.length}] ${displayName.padEnd(32)} ⚠️ ${msg}`, delta };
    }
  }

  for (let base = 0; base < toProcess.length; base += concurrency) {
    const slice = toProcess.slice(base, base + concurrency);
    const results = await Promise.all(slice.map((biz, j) => processOne(biz, base + j + 1)));
    for (const r of results) {
      console.log(r.line);
      mergeStats(stats, r.delta);
    }
    if (delayAfterBatch > 0 && base + concurrency < toProcess.length) await sleep(delayAfterBatch);
  }

  // ─── Summary ───
  console.log('\n' + '═'.repeat(60));
  console.log(`  🌐 Websites added:       ${stats.website}`);
  console.log(`  📞 Phones added:         ${stats.phone}`);
  console.log(`  🕐 Hours filled:        ${stats.hours}`);
  console.log(`  🇨🇳 Chinese names (Google only): ${stats.zhName}`);
  console.log(`  📝 Desc (zh) generated:  ${stats.descZh}`);
  console.log(`  📝 Desc (en) filled:     ${stats.descEn}`);
  console.log(`  ⚠️ Errors:              ${stats.errors}`);
  if (!applyChanges) console.log(`\n  👀 DRY RUN — add --apply to save`);
  console.log('═'.repeat(60));
}

main().catch(console.error);
