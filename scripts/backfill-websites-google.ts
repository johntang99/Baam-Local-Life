/**
 * Backfill Business Websites from Google Places API
 *
 * For businesses missing website_url, searches Google Places by name + location,
 * extracts websiteUri from the result.
 *
 * Usage:
 *   # Dry run
 *   source apps/web/.env.local && npx tsx scripts/backfill-websites-google.ts
 *
 *   # Apply
 *   source apps/web/.env.local && npx tsx scripts/backfill-websites-google.ts --apply
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;

const args = process.argv.slice(2);
const applyChanges = args.includes('--apply');

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

const FIELD_MASK = [
  'places.displayName',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.formattedAddress',
].join(',');

async function searchGooglePlaces(query: string): Promise<{ website: string | null; matchedName: string | null }> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'en',
      maxResultCount: 1,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error('RATE_LIMITED');
    throw new Error(`Google API ${res.status}: ${text.slice(0, 100)}`);
  }

  const data = await res.json();
  const place = data.places?.[0];
  if (!place) return { website: null, matchedName: null };

  return {
    website: place.websiteUri || null,
    matchedName: place.displayName?.text || null,
  };
}

async function main() {
  console.log('🌐 Website Backfill — Google Places API');
  console.log(`   Mode: ${applyChanges ? '✅ APPLY' : '👀 DRY RUN'}\n`);

  if (!GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_PLACES_API_KEY not set');
    process.exit(1);
  }

  // Get businesses missing website, with their location for better search
  const businesses = await supaFetch(
    'businesses?select=id,slug,display_name,display_name_zh,phone,website_url,business_locations(address_line1,city,state)&is_active=eq.true&order=slug.asc'
  ) as AnyRow[];

  const needsWebsite = businesses.filter((b: AnyRow) => !(b.website_url || '').trim());

  console.log(`📊 Total businesses: ${businesses.length}`);
  console.log(`🔎 Missing website: ${needsWebsite.length}\n`);

  let found = 0, notFound = 0, errors = 0, rateLimited = 0;
  const results: Array<{ name: string; website: string; google_name: string }> = [];

  for (let i = 0; i < needsWebsite.length; i++) {
    const biz = needsWebsite[i];
    const name = biz.display_name || biz.display_name_zh || biz.slug;
    const loc = Array.isArray(biz.business_locations) ? biz.business_locations[0] : null;
    const city = loc?.city || 'Flushing';
    const state = loc?.state || 'NY';

    // Build search query: business name + city
    const searchQuery = `${name} ${city} ${state}`;
    const displayName = (biz.display_name_zh || biz.display_name || '').slice(0, 35);

    process.stdout.write(`  [${i + 1}/${needsWebsite.length}] ${displayName.padEnd(37)} `);

    try {
      const { website, matchedName } = await searchGooglePlaces(searchQuery);

      if (website) {
        found++;
        results.push({ name, website, google_name: matchedName || '' });
        console.log(`✅ → ${website}`);

        if (applyChanges) {
          await supaFetch(`businesses?id=eq.${biz.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ website_url: website }),
          });
        }
      } else {
        notFound++;
        console.log(`❌ ${matchedName ? `(found "${matchedName}" but no website)` : '(no match)'}`);
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'RATE_LIMITED') {
        rateLimited++;
        console.log('⏳ rate limited — waiting 30s');
        await new Promise(r => setTimeout(r, 30000));
        i--; // retry
        continue;
      }
      errors++;
      console.log(`⚠️ ${err instanceof Error ? err.message.slice(0, 50) : 'error'}`);
    }

    // Rate limit: 500ms between requests (Google allows ~10 QPS)
    if (i < needsWebsite.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log(`  ✅ Websites found: ${found}`);
  console.log(`  ❌ Not found / no website: ${notFound}`);
  console.log(`  ⏳ Rate limited: ${rateLimited}`);
  console.log(`  ⚠️ Errors: ${errors}`);
  console.log(`  📊 Hit rate: ${(found + notFound) > 0 ? Math.round(found * 100 / (found + notFound)) : 0}%`);

  if (results.length > 0) {
    console.log('\n  MATCHES:');
    for (const r of results) {
      console.log(`    ${r.name.slice(0, 30).padEnd(32)} → ${r.website}`);
    }
  }

  if (!applyChanges && found > 0) {
    console.log(`\n  👀 DRY RUN — add --apply to save ${found} websites`);
  }
  console.log('═'.repeat(70));
}

main().catch(console.error);
