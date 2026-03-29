/**
 * Generate Rich Business Descriptions using AI
 *
 * For businesses with only a short 1-sentence description, generates
 * a detailed full_desc_zh by:
 * 1. Using existing data (name, category, tags, address, phone)
 * 2. Scraping their website homepage for additional info (if available)
 * 3. Sending to Claude to generate a comprehensive Chinese description
 *
 * Usage:
 *   # Dry run (first 5)
 *   source apps/web/.env.local && npx tsx scripts/generate-descriptions.ts
 *
 *   # Apply all
 *   source apps/web/.env.local && npx tsx scripts/generate-descriptions.ts --apply
 *
 *   # Single business
 *   source apps/web/.env.local && npx tsx scripts/generate-descriptions.ts --slug=natural-life-acupuncture-pc --apply
 */

import Anthropic from '@anthropic-ai/sdk';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const args = process.argv.slice(2);
const applyChanges = args.includes('--apply');
const slugArg = args.find(a => a.startsWith('--slug='))?.split('=')[1];
const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1];
const BATCH_LIMIT = limitArg ? parseInt(limitArg) : (slugArg ? 999 : 5);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

async function supaFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options?.method === 'PATCH' ? 'return=minimal' : '',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function scrapeWebsite(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    if (!res.ok) return '';

    const html = await res.text();

    // Extract useful text content
    const parts: string[] = [];

    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) parts.push(`Title: ${titleMatch[1].trim()}`);

    // Meta description
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (metaDesc) parts.push(`Description: ${metaDesc[1].trim()}`);

    // OG description
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (ogDesc && ogDesc[1] !== metaDesc?.[1]) parts.push(`About: ${ogDesc[1].trim()}`);

    // H1-H3 headings
    const headings = html.matchAll(/<h[1-3][^>]*>([^<]{3,100})<\/h[1-3]>/gi);
    const headingTexts: string[] = [];
    for (const m of headings) {
      const text = m[1].replace(/<[^>]+>/g, '').trim();
      if (text.length >= 3 && text.length <= 100) headingTexts.push(text);
    }
    if (headingTexts.length > 0) parts.push(`Key points: ${headingTexts.slice(0, 8).join('; ')}`);

    // Look for "about" or "services" sections
    const aboutMatch = html.match(/(?:about|关于|简介|服务|services)[^<]*<\/[^>]+>\s*(?:<[^>]+>)*\s*([^<]{20,500})/i);
    if (aboutMatch) parts.push(`About section: ${aboutMatch[1].trim()}`);

    // Chinese text blocks (paragraphs with Chinese content)
    const zhParagraphs = html.matchAll(/<p[^>]*>([^<]*[\u4e00-\u9fff][^<]{10,300})<\/p>/gi);
    const zhTexts: string[] = [];
    for (const m of zhParagraphs) {
      zhTexts.push(m[1].trim());
    }
    if (zhTexts.length > 0) parts.push(`Content: ${zhTexts.slice(0, 5).join(' ')}`);

    return parts.join('\n').slice(0, 2000);
  } catch {
    return '';
  }
}

async function generateDescription(
  client: Anthropic,
  biz: AnyRow,
  websiteContent: string,
  categories: string[],
): Promise<string> {
  const name = biz.display_name_zh || biz.display_name || '';
  const enName = biz.display_name || '';
  const tags = (biz.ai_tags || []).filter((t: string) => t !== 'GBP已认领').join('、');
  const address = biz.address || '';
  const phone = biz.phone || '';
  const rating = biz.avg_rating ? `${biz.avg_rating}分 (${biz.review_count || 0}条评价)` : '';
  const existingDesc = biz.short_desc_zh || biz.short_desc_en || '';

  const prompt = `你是一个纽约华人社区平台的商家内容编辑。请为以下商家撰写一段详细的中文介绍（150-250字），用于商家详情页面。

商家信息：
- 中文名：${name}
- 英文名：${enName}
- 类别：${categories.join('、')}
- 特色标签：${tags}
- 地址：${address}
- 电话：${phone}
- 评分：${rating}
- 现有简介：${existingDesc}
${websiteContent ? `\n商家网站内容摘要：\n${websiteContent}` : ''}

要求：
1. 用自然流畅的简体中文撰写，像本地华人写的介绍
2. 开头说明商家类型和位置
3. 介绍主要服务/产品/特色
4. 如果有评分，提及口碑
5. 包含对华人顾客有用的信息（是否提供中文服务、支付方式等，如果网站有提到）
6. 不要编造不存在的信息
7. 不要加标题，直接输出介绍正文
8. 不要用"欢迎光临"等广告语`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  return (response.content[0] as { text: string }).text.trim();
}

async function main() {
  console.log('📝 AI Business Description Generator');
  console.log(`   Mode: ${applyChanges ? '✅ APPLY' : '👀 DRY RUN'}`);
  console.log(`   Limit: ${BATCH_LIMIT} businesses\n`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  // Get businesses needing full descriptions
  let query = 'businesses?select=*,business_locations(address_line1,city,state),business_categories(categories(name_zh))&is_active=eq.true&order=avg_rating.desc.nullslast';
  if (slugArg) query += `&slug=eq.${slugArg}`;

  const businesses = (await supaFetch(query) as AnyRow[])
    .filter(b => !(b.full_desc_zh || '').trim())
    .slice(0, BATCH_LIMIT);

  console.log(`🔎 Businesses needing description: ${businesses.length}\n`);

  let generated = 0, errors = 0;

  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    const displayName = (biz.display_name_zh || biz.display_name || '').slice(0, 30);
    const categories = (biz.business_categories || [])
      .map((bc: AnyRow) => bc.categories?.name_zh)
      .filter(Boolean) as string[];

    // Build address for context
    const loc = (biz.business_locations || [])[0];
    biz.address = loc ? `${loc.address_line1 || ''}, ${loc.city || ''}, ${loc.state || ''}` : '';

    process.stdout.write(`  [${i + 1}/${businesses.length}] ${displayName.padEnd(32)} `);

    try {
      // Scrape website if available
      let websiteContent = '';
      if (biz.website_url) {
        process.stdout.write('🌐 ');
        websiteContent = await scrapeWebsite(biz.website_url);
      }

      // Generate with AI
      const desc = await generateDescription(client, biz, websiteContent, categories);
      generated++;

      console.log(`✅ (${desc.length}字${websiteContent ? ' +website' : ''})`);
      console.log(`     ${desc.slice(0, 80)}...`);

      if (applyChanges) {
        await supaFetch(`businesses?id=eq.${biz.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ full_desc_zh: desc }),
        });
      }
    } catch (err) {
      errors++;
      console.log(`⚠️ ${err instanceof Error ? err.message.slice(0, 50) : 'error'}`);
    }

    // Rate limit
    if (i < businesses.length - 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log(`  ✅ Generated: ${generated}`);
  console.log(`  ⚠️ Errors: ${errors}`);
  if (!applyChanges && generated > 0) {
    console.log(`\n  👀 DRY RUN — add --apply to save. Use --limit=N to control batch size.`);
  }
  console.log('═'.repeat(70));
}

main().catch(console.error);
