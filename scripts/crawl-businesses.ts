/**
 * Crawl businesses from Google Places API and import to Supabase
 * Run with: source apps/web/.env.local && npx tsx scripts/crawl-businesses.ts
 */

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;

if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars. Run: source apps/web/.env.local && npx tsx scripts/crawl-businesses.ts');
  process.exit(1);
}

// ─── Search queries to crawl ──────────────────────────────────────────

const SEARCH_QUERIES = [
  // Food
  { query: 'Chinese restaurant Flushing NY', category: 'food-dining', limit: 10 },
  { query: 'dim sum Flushing NY', category: 'food-dining', limit: 5 },
  { query: 'bubble tea Flushing NY', category: 'food-bubble-tea', limit: 3 },
  // Medical
  { query: 'Chinese doctor Flushing NY', category: 'medical-health', limit: 5 },
  { query: 'Chinese dentist Flushing NY', category: 'medical-dental', limit: 3 },
  { query: 'acupuncture Flushing NY', category: 'medical-chinese-medicine', limit: 3 },
  // Legal
  { query: 'Chinese immigration lawyer Flushing NY', category: 'legal-immigration', limit: 3 },
  // Finance
  { query: 'Chinese CPA accountant Flushing NY', category: 'finance-accounting', limit: 3 },
  { query: 'tax preparation Flushing NY Chinese', category: 'finance-tax-prep', limit: 3 },
  // Real Estate
  { query: 'Chinese real estate agent Flushing NY', category: 'realestate-agent', limit: 3 },
  // Education
  { query: 'tutoring center Flushing NY', category: 'edu-tutoring', limit: 3 },
  // Services
  { query: 'Chinese moving company Flushing NY', category: 'home-moving', limit: 2 },
  { query: 'Chinese renovation contractor Flushing NY', category: 'home-renovation', limit: 2 },
];

interface PlaceResult {
  name: string;
  nameZh: string;
  address: string;
  phone: string;
  rating: number;
  ratingCount: number;
  website: string;
  types: string[];
  placeId: string;
}

// ─── Google Places API ────────────────────────────────────────────────

async function searchPlaces(query: string, limit: number): Promise<PlaceResult[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.websiteUri,places.types',
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'en',
      maxResultCount: limit,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  // Also get Chinese names
  const resZh = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName',
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'zh-CN',
      maxResultCount: limit,
    }),
  });
  const dataZh = await resZh.json();
  const zhNames: Record<string, string> = {};
  for (const p of dataZh.places || []) {
    zhNames[p.id] = p.displayName?.text || '';
  }

  return (data.places || []).map((p: any) => ({
    name: p.displayName?.text || '',
    nameZh: zhNames[p.id] || p.displayName?.text || '',
    address: p.formattedAddress || '',
    phone: p.nationalPhoneNumber || '',
    rating: p.rating || 0,
    ratingCount: p.userRatingCount || 0,
    website: p.websiteUri || '',
    types: p.types || [],
    placeId: p.id || '',
  }));
}

// ─── Generate Chinese description via AI ──────────────────────────────

async function generateDescription(place: PlaceResult, categoryName: string): Promise<{ descZh: string; descEn: string; tags: string[] }> {
  if (!ANTHROPIC_KEY) return { descZh: '', descEn: '', tags: [] };

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: '你是纽约华人社区平台的编辑。为商家写简短的中文介绍（2-3句话）和3-5个标签。返回JSON格式：{"desc_zh":"中文介绍","desc_en":"English description","tags":["标签1","标签2"]}。不要markdown代码块。',
      messages: [{ role: 'user', content: `商家：${place.nameZh || place.name}\n地址：${place.address}\n类别：${categoryName}\n评分：${place.rating}（${place.ratingCount}条评价）\n电话：${place.phone}` }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    // Extract JSON
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        descZh: parsed.desc_zh || '',
        descEn: parsed.desc_en || '',
        tags: parsed.tags || [],
      };
    }
  } catch (e) {
    // AI is optional
  }
  return { descZh: '', descEn: '', tags: [] };
}

// ─── Save to Supabase ─────────────────────────────────────────────────

async function getExistingSlugs(): Promise<Set<string>> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/businesses?select=slug`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const data = await res.json();
  return new Set(data.map((d: any) => d.slug));
}

async function getCategoryId(slug: string): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/categories?slug=eq.${slug}&select=id`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const data = await res.json();
  return data[0]?.id || null;
}

async function getRegionId(): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/regions?slug=eq.flushing-ny&select=id`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const data = await res.json();
  return data[0]?.id || null;
}

async function saveBusiness(place: PlaceResult, categorySlug: string, desc: { descZh: string; descEn: string; tags: string[] }, regionId: string | null) {
  const slug = (place.name || place.nameZh)
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  // Parse address components
  const addressParts = place.address.split(',').map(s => s.trim());
  const city = addressParts.length >= 3 ? addressParts[addressParts.length - 3] : 'Flushing';
  const stateZip = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : 'NY';
  const state = stateZip.split(' ')[0] || 'NY';
  const zipCode = stateZip.split(' ')[1] || '';

  const body = {
    slug,
    display_name: place.name,
    display_name_zh: place.nameZh !== place.name ? place.nameZh : null,
    short_desc_en: desc.descEn || null,
    short_desc_zh: desc.descZh || null,
    phone: place.phone || null,
    website_url: place.website || null,
    status: 'active',
    verification_status: 'unverified',
    current_plan: 'free',
    ai_tags: desc.tags.length > 0 ? desc.tags : null,
    ai_summary_zh: desc.descZh || null,
    avg_rating: place.rating || null,
    review_count: place.ratingCount || 0,
    is_featured: false,
    is_active: true,
    languages_served: ['zh', 'en'],
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/businesses`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Save failed: ${err}`);
  }

  const saved = await res.json();
  const businessId = saved[0]?.id;

  // Add category link
  if (businessId) {
    const categoryId = await getCategoryId(categorySlug);
    if (categoryId) {
      await fetch(`${SUPABASE_URL}/rest/v1/business_categories`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ business_id: businessId, category_id: categoryId, is_primary: true }),
      });
    }

    // Add location
    if (place.address) {
      await fetch(`${SUPABASE_URL}/rest/v1/business_locations`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: businessId,
          address_full: place.address,
          city: city.replace(/[^a-zA-Z\s]/g, '').trim(),
          state,
          zip_code: zipCode,
          region_id: regionId,
          is_primary: true,
        }),
      });
    }
  }

  return businessId;
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏪 Crawling businesses from Google Places...\n');

  const existingSlugs = await getExistingSlugs();
  const regionId = await getRegionId();
  let total = 0;
  let saved = 0;
  let skipped = 0;

  for (const search of SEARCH_QUERIES) {
    console.log(`\n📍 Searching: "${search.query}" (limit: ${search.limit})`);

    try {
      const places = await searchPlaces(search.query, search.limit);

      for (const place of places) {
        total++;
        const slug = (place.name || place.nameZh).toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

        if (existingSlugs.has(slug)) {
          console.log(`  ⏭️ Skip (exists): ${place.nameZh || place.name}`);
          skipped++;
          continue;
        }

        try {
          // Generate AI description
          const desc = await generateDescription(place, search.category);

          // Save to Supabase
          await saveBusiness(place, search.category, desc, regionId);
          existingSlugs.add(slug);
          saved++;

          const zhName = place.nameZh !== place.name ? ` (${place.nameZh})` : '';
          console.log(`  ✅ ${place.name}${zhName} | ⭐${place.rating} | ${place.phone}`);

          // Rate limit
          await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
          console.log(`  ❌ ${place.name}: ${err instanceof Error ? err.message : 'error'}`);
        }
      }
    } catch (err) {
      console.log(`  ❌ Search failed: ${err instanceof Error ? err.message : 'error'}`);
    }

    // Delay between searches
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n📊 Results: ${saved} saved, ${skipped} skipped, ${total} total crawled`);
}

main().catch(console.error);
