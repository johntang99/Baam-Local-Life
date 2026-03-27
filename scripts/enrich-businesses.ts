/**
 * Comprehensive business enrichment:
 * 1. Google types → subcategory mapping
 * 2. Website scraping → extract emails
 * 3. GBP status detection (claimed vs unclaimed)
 * 4. Store Google types for future reference
 *
 * Run: source apps/web/.env.local && npx tsx scripts/enrich-businesses.ts
 */

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars.');
  process.exit(1);
}

// ─── Google type → our subcategory slug mapping ───────────────────────

const GOOGLE_TYPE_MAP: Record<string, string> = {
  // Food
  'chinese_restaurant': 'food-chinese',
  'japanese_restaurant': 'food-japanese',
  'korean_restaurant': 'food-korean',
  'thai_restaurant': 'food-thai',
  'vietnamese_restaurant': 'food-vietnamese',
  'indian_restaurant': 'food-dining',
  'seafood_restaurant': 'food-dining',
  'ramen_restaurant': 'food-japanese',
  'sushi_restaurant': 'food-japanese',
  'bakery': 'food-bakery',
  'cafe': 'food-bubble-tea',
  'tea_house': 'food-bubble-tea',
  'bar': 'food-dining',
  'meal_delivery': 'food-dining',
  'meal_takeaway': 'food-dining',
  // Medical
  'doctor': 'medical-health',
  'dentist': 'medical-dental',
  'physiotherapist': 'medical-health',
  'pharmacy': 'medical-health',
  'hospital': 'medical-health',
  'health': 'medical-health',
  // Legal
  'lawyer': 'legal-immigration',
  'law_firm': 'legal-immigration',
  // Finance
  'accounting': 'finance-accounting',
  'insurance_agency': 'finance-insurance',
  'bank': 'finance-tax',
  // Real estate
  'real_estate_agency': 'realestate-agent',
  // Education
  'school': 'edu-tutoring',
  'university': 'edu-language',
  // Services
  'hair_care': 'beauty-wellness',
  'beauty_salon': 'beauty-wellness',
  'spa': 'beauty-wellness',
  'moving_company': 'home-moving',
  'plumber': 'home-plumbing',
  'electrician': 'home-electrical',
  'painter': 'home-painting',
  'car_repair': 'auto',
  'car_dealer': 'auto',
  'car_wash': 'auto',
  // Grocery
  'grocery_or_supermarket': 'food-dining',
  'supermarket': 'food-dining',
};

// ─── Email extraction from website HTML ───────────────────────────────

async function extractEmailFromWebsite(url: string): Promise<string | null> {
  if (!url) return null;

  try {
    // Ensure URL has protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(fullUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BaamBot/1.0)' },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();

    // Extract emails using regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = [...new Set(html.match(emailRegex) || [])];

    // Filter out common non-business emails
    const filtered = emails.filter(e => {
      const lower = e.toLowerCase();
      return !lower.includes('example.com') &&
        !lower.includes('wixpress') &&
        !lower.includes('sentry.io') &&
        !lower.includes('wordpress') &&
        !lower.includes('google.com') &&
        !lower.includes('.png') &&
        !lower.includes('.jpg') &&
        !lower.endsWith('.js') &&
        !lower.endsWith('.css') &&
        e.length < 60;
    });

    return filtered[0] || null;
  } catch {
    return null;
  }
}

// ─── GBP status assessment ────────────────────────────────────────────

interface GbpStatus {
  hasGbp: boolean;
  likelyClaimed: boolean;
  claimSignals: string[];
  businessStatus: string;
  photoCount: number;
  hasWebsite: boolean;
  hasPhone: boolean;
}

function assessGbpStatus(place: any): GbpStatus {
  const signals: string[] = [];
  const photos = place.photos?.length || 0;
  const hasWebsite = !!place.websiteUri;
  const hasPhone = !!place.nationalPhoneNumber;
  const status = place.businessStatus || 'UNKNOWN';

  if (photos >= 5) signals.push('has_photos');
  if (hasWebsite) signals.push('has_website');
  if (hasPhone) signals.push('has_phone');
  if (place.currentOpeningHours) signals.push('has_hours');
  if (place.editorialSummary?.text) signals.push('has_description');
  if ((place.userRatingCount || 0) >= 10) signals.push('has_reviews');

  // Likely claimed if has 3+ signals
  const likelyClaimed = signals.length >= 3;

  return {
    hasGbp: true,
    likelyClaimed,
    claimSignals: signals,
    businessStatus: status,
    photoCount: photos,
    hasWebsite,
    hasPhone,
  };
}

// ─── Supabase helpers ─────────────────────────────────────────────────

async function supaFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', ...options?.headers },
  });
  if (options?.method === 'PATCH' || options?.method === 'POST') return res;
  return res.json();
}

async function getCategoryIdBySlug(slug: string): Promise<string | null> {
  const data = await supaFetch(`categories?slug=eq.${slug}&select=id`);
  return data[0]?.id || null;
}

async function getExistingSubcategories(businessId: string): Promise<Set<string>> {
  const data = await supaFetch(`business_categories?business_id=eq.${businessId}&select=category_id`);
  return new Set(data.map((d: any) => d.category_id));
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔍 Enriching 335 businesses: subcategories + emails + GBP status\n');

  // Get all businesses
  const businesses = await supaFetch('businesses?select=id,display_name,display_name_zh,phone,email,website_url,slug&order=created_at');

  // Pre-cache category IDs
  const categoryCache: Record<string, string | null> = {};
  for (const slug of Object.values(GOOGLE_TYPE_MAP)) {
    if (!categoryCache[slug]) {
      categoryCache[slug] = await getCategoryIdBySlug(slug);
    }
  }

  let emailsFound = 0, subcatsAdded = 0, gbpClaimed = 0, gbpUnclaimed = 0;

  const FIELD_MASK = 'places.id,places.displayName,places.types,places.photos,places.websiteUri,places.nationalPhoneNumber,places.currentOpeningHours,places.businessStatus,places.editorialSummary,places.userRatingCount';

  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    const num = `[${i + 1}/${businesses.length}]`;
    process.stdout.write(`${num} ${(biz.display_name_zh || biz.display_name).slice(0, 30)}...`);

    try {
      // Step 1: Get Google types + GBP status via Text Search
      const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify({ textQuery: `${biz.display_name} Flushing NY`, maxResultCount: 1 }),
      });
      const searchData = await searchRes.json();
      const place = searchData.places?.[0];

      if (!place) {
        console.log(' ⏭️ not found');
        continue;
      }

      // Step 2: Assess GBP status
      const gbp = assessGbpStatus(place);
      if (gbp.likelyClaimed) gbpClaimed++;
      else gbpUnclaimed++;

      // Step 3: Map Google types → subcategories
      const googleTypes = place.types || [];
      const existingCats = await getExistingSubcategories(biz.id);
      let newSubcats = 0;

      for (const gType of googleTypes) {
        const ourSlug = GOOGLE_TYPE_MAP[gType];
        if (ourSlug && categoryCache[ourSlug]) {
          const catId = categoryCache[ourSlug]!;
          if (!existingCats.has(catId)) {
            await supaFetch('business_categories', {
              method: 'POST',
              body: JSON.stringify({ business_id: biz.id, category_id: catId, is_primary: false }),
            });
            existingCats.add(catId);
            newSubcats++;
            subcatsAdded++;
          }
        }
      }

      // Step 4: Extract email from website
      let email = biz.email;
      const websiteUrl = biz.website_url || place.websiteUri;
      if (!email && websiteUrl) {
        email = await extractEmailFromWebsite(websiteUrl);
        if (email) emailsFound++;
      }

      // Step 5: Update business record
      const updates: Record<string, any> = {};
      if (email && !biz.email) updates.email = email;
      if (googleTypes.length > 0) updates.google_types = googleTypes;
      // Store GBP status in ai_tags if not already present
      if (gbp.likelyClaimed && !(biz.ai_tags || []).includes('GBP已认领')) {
        updates.ai_tags = [...(biz.ai_tags || []), 'GBP已认领'];
      }

      if (Object.keys(updates).length > 0) {
        await supaFetch(`businesses?id=eq.${biz.id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
      }

      const emailIcon = email ? ` 📧${email.slice(0, 20)}` : '';
      const gbpIcon = gbp.likelyClaimed ? '🟢' : '🟡';
      const subcatIcon = newSubcats > 0 ? ` +${newSubcats}cat` : '';
      console.log(` ${gbpIcon}${emailIcon}${subcatIcon} [${googleTypes.slice(0, 3).join(',')}]`);

      await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      console.log(` ❌ ${err instanceof Error ? err.message.slice(0, 40) : 'error'}`);
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`  Emails found: ${emailsFound}`);
  console.log(`  Subcategories added: ${subcatsAdded}`);
  console.log(`  GBP likely claimed: ${gbpClaimed}`);
  console.log(`  GBP unclaimed/basic: ${gbpUnclaimed}`);
}

main().catch(console.error);
