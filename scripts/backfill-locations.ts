/**
 * Backfill business_locations with address + lat/lng from Google Places
 * Uses Text Search with full field mask (like baam-platform/gbp-lookup)
 * Run: source apps/web/.env.local && npx tsx scripts/backfill-locations.ts
 */

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars.');
  process.exit(1);
}

// Full field mask — get everything in one Text Search call (no Place Details needed)
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.location',
  'places.currentOpeningHours',
  'places.businessStatus',
  'places.types',
  'places.googleMapsUri',
  'places.editorialSummary',
].join(',');

async function searchPlace(query: string): Promise<any | null> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.places?.[0] || null;
}

async function main() {
  // Get all businesses
  const bizRes = await fetch(`${SUPABASE_URL}/rest/v1/businesses?select=id,display_name,display_name_zh,phone&order=created_at`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const allBiz = await bizRes.json();

  // Get existing locations
  const locRes = await fetch(`${SUPABASE_URL}/rest/v1/business_locations?select=business_id`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const existingLocs = new Set((await locRes.json()).map((l: any) => l.business_id));

  const needsLocation = allBiz.filter((b: any) => !existingLocs.has(b.id));
  console.log(`\n📍 Backfilling ${needsLocation.length} businesses (${existingLocs.size} already done)\n`);

  // Get region ID
  const regRes = await fetch(`${SUPABASE_URL}/rest/v1/regions?slug=eq.flushing-ny&select=id`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const regionId = (await regRes.json())[0]?.id || null;

  let saved = 0, failed = 0, noResult = 0;

  for (let i = 0; i < needsLocation.length; i++) {
    const biz = needsLocation[i];
    const searchName = biz.display_name;
    const num = `[${i + 1}/${needsLocation.length}]`;
    process.stdout.write(`${num} ${biz.display_name_zh || searchName}...`);

    try {
      const place = await searchPlace(`${searchName} Flushing NY`);

      if (!place) {
        console.log(' ⏭️ not found');
        noResult++;
        await new Promise(r => setTimeout(r, 300));
        continue;
      }

      const lat = place.location?.latitude || null;
      const lng = place.location?.longitude || null;
      const fullAddress = place.formattedAddress || '';
      const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || '';
      const website = place.websiteUri || '';

      // Parse address
      const parts = fullAddress.split(',').map((s: string) => s.trim());
      const addressLine1 = parts[0] || '';
      let city = 'Flushing', state = 'NY', zipCode = '';
      if (parts.length >= 3) {
        city = parts[parts.length - 3]?.replace(/[^a-zA-Z\s]/g, '').trim() || 'Flushing';
        const stateZip = parts[parts.length - 2] || '';
        state = stateZip.split(' ')[0] || 'NY';
        zipCode = stateZip.split(' ')[1] || '';
      }

      // Save location
      const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/business_locations`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: biz.id,
          address_line1: addressLine1,
          city: city.length > 1 ? city : 'Flushing',
          state: state.length <= 2 ? state : 'NY',
          zip_code: zipCode,
          latitude: lat,
          longitude: lng,
          region_id: regionId,
          is_primary: true,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.text();
        console.log(` ❌ ${err.slice(0, 50)}`);
        failed++;
        continue;
      }

      // Update phone + website on business if missing
      const updates: Record<string, any> = {};
      if (phone && !biz.phone) updates.phone = phone;
      if (website) updates.website_url = website;
      if (Object.keys(updates).length > 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/businesses?id=eq.${biz.id}`, {
          method: 'PATCH',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
      }

      console.log(` ✅ ${lat?.toFixed(4)},${lng?.toFixed(4)} | ${addressLine1.slice(0, 30)} | ${phone || 'no phone'}`);
      saved++;

      await new Promise(r => setTimeout(r, 1000)); // 1s delay
    } catch (err) {
      console.log(` ❌ ${err instanceof Error ? err.message.slice(0, 50) : 'error'}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${saved} saved, ${noResult} not found, ${failed} failed`);
}

main().catch(console.error);
