/**
 * Backfill Business Hours from Google Places API
 *
 * Searches each business on Google Places and saves regularOpeningHours
 * to business_locations.hours_json in the format our detail page expects:
 * { "mon": { "open": "09:00", "close": "19:00" }, ... }
 *
 * Usage:
 *   # Dry run
 *   source apps/web/.env.local && npx tsx scripts/backfill-hours-google.ts
 *
 *   # Apply
 *   source apps/web/.env.local && npx tsx scripts/backfill-hours-google.ts --apply
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
  'places.regularOpeningHours',
  'places.nationalPhoneNumber',
].join(',');

const DAY_MAP: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

interface HoursJson {
  [day: string]: { open: string; close: string };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function parseHours(regularOpeningHours: AnyRow): HoursJson | null {
  const periods = regularOpeningHours?.periods;
  if (!Array.isArray(periods) || periods.length === 0) return null;

  const hours: HoursJson = {};

  for (const period of periods) {
    const openDay = period.open?.day;
    const openHour = period.open?.hour ?? 0;
    const openMin = period.open?.minute ?? 0;
    const closeHour = period.close?.hour ?? 0;
    const closeMin = period.close?.minute ?? 0;

    const dayKey = DAY_MAP[openDay];
    if (!dayKey) continue;

    hours[dayKey] = {
      open: `${pad(openHour)}:${pad(openMin)}`,
      close: `${pad(closeHour)}:${pad(closeMin)}`,
    };
  }

  return Object.keys(hours).length > 0 ? hours : null;
}

function formatHoursPreview(hours: HoursJson): string {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const labels: Record<string, string> = {
    mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su',
  };

  // Group consecutive days with same hours
  const parts: string[] = [];
  for (const d of days) {
    if (hours[d]) {
      parts.push(`${labels[d]}${hours[d].open}-${hours[d].close}`);
    }
  }
  // Show first and last to keep it short
  if (parts.length > 3) return `${parts[0]}...${parts[parts.length - 1]} (${parts.length}d)`;
  return parts.join(' ');
}

async function searchGooglePlaces(query: string): Promise<{ hours: HoursJson | null; matchedName: string | null; matchedPhone: string | null }> {
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
    if (res.status === 429) throw new Error('RATE_LIMITED');
    throw new Error(`Google API ${res.status}`);
  }

  const data = await res.json();
  const place = data.places?.[0];
  if (!place) return { hours: null, matchedName: null, matchedPhone: null };

  return {
    hours: parseHours(place.regularOpeningHours),
    matchedName: place.displayName?.text || null,
    matchedPhone: place.nationalPhoneNumber || null,
  };
}

function normalizePhone(phone: string): string {
  return (phone || '').replace(/[^0-9]/g, '');
}

async function main() {
  console.log('🕐 Business Hours Backfill — Google Places API');
  console.log(`   Mode: ${applyChanges ? '✅ APPLY' : '👀 DRY RUN'}\n`);

  if (!GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_PLACES_API_KEY not set');
    process.exit(1);
  }

  // Get all businesses with their locations
  const businesses = await supaFetch(
    'businesses?select=id,slug,display_name,display_name_zh,phone,business_locations(id,hours_json,city,state)&is_active=eq.true&order=slug.asc'
  ) as AnyRow[];

  // Filter to businesses that have a location record but no hours
  const needsHours = businesses.filter((b: AnyRow) => {
    const locs = b.business_locations || [];
    if (locs.length === 0) return false;
    const loc = locs[0];
    // Skip if hours already populated
    if (loc.hours_json && Object.keys(loc.hours_json).length > 0) return false;
    return true;
  });

  console.log(`📊 Total businesses: ${businesses.length}`);
  console.log(`🔎 Need hours (have location, no hours): ${needsHours.length}\n`);

  let found = 0, notFound = 0, noMatch = 0, errors = 0, rateLimited = 0;

  for (let i = 0; i < needsHours.length; i++) {
    const biz = needsHours[i];
    const loc = biz.business_locations[0];
    const name = biz.display_name || biz.display_name_zh || biz.slug;
    const city = loc.city || 'Flushing';
    const state = loc.state || 'NY';
    const searchQuery = `${name} ${city} ${state}`;

    const displayName = (biz.display_name_zh || biz.display_name || '').slice(0, 30);
    process.stdout.write(`  [${i + 1}/${needsHours.length}] ${displayName.padEnd(32)} `);

    try {
      const { hours, matchedName, matchedPhone } = await searchGooglePlaces(searchQuery);

      if (!matchedName) {
        noMatch++;
        console.log('❌ no match');
      } else if (!hours) {
        notFound++;
        console.log(`⏭️ no hours (${matchedName})`);
      } else {
        // Verify match by phone if possible
        const ourPhone = normalizePhone(biz.phone || '');
        const googlePhone = normalizePhone(matchedPhone || '');
        if (ourPhone && googlePhone && ourPhone.slice(-7) !== googlePhone.slice(-7)) {
          noMatch++;
          console.log(`⚠️ phone mismatch (ours:${ourPhone.slice(-4)} vs google:${googlePhone.slice(-4)})`);
          // Still continue — phone might differ, name match is usually correct
        }

        found++;
        console.log(`✅ ${formatHoursPreview(hours)}`);

        if (applyChanges) {
          await supaFetch(`business_locations?id=eq.${loc.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ hours_json: hours }),
          });
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'RATE_LIMITED') {
        rateLimited++;
        console.log('⏳ rate limited — waiting 30s');
        await new Promise(r => setTimeout(r, 30000));
        i--;
        continue;
      }
      errors++;
      console.log(`⚠️ ${err instanceof Error ? err.message.slice(0, 40) : 'error'}`);
    }

    // Rate limit: 500ms
    if (i < needsHours.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log(`  ✅ Hours found: ${found}`);
  console.log(`  ⏭️ No hours on Google: ${notFound}`);
  console.log(`  ❌ No match: ${noMatch}`);
  console.log(`  ⏳ Rate limited: ${rateLimited}`);
  console.log(`  ⚠️ Errors: ${errors}`);
  console.log(`  📊 Hit rate: ${(found + notFound + noMatch) > 0 ? Math.round(found * 100 / (found + notFound + noMatch)) : 0}%`);
  if (!applyChanges && found > 0) {
    console.log(`\n  👀 DRY RUN — add --apply to save ${found} business hours`);
  }
  console.log('═'.repeat(70));
}

main().catch(console.error);
