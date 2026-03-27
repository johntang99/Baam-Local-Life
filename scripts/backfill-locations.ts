/**
 * Backfill business_locations with address + lat/lng from Google Places
 * Run: source apps/web/.env.local && npx tsx scripts/backfill-locations.ts
 */

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars.');
  process.exit(1);
}

async function main() {
  // Get all businesses without locations
  const bizRes = await fetch(`${SUPABASE_URL}/rest/v1/businesses?select=id,display_name,display_name_zh,slug&order=created_at`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const allBiz = await bizRes.json();

  const locRes = await fetch(`${SUPABASE_URL}/rest/v1/business_locations?select=business_id`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const existingLocs = new Set((await locRes.json()).map((l: any) => l.business_id));

  const needsLocation = allBiz.filter((b: any) => !existingLocs.has(b.id));
  console.log(`\n📍 Backfilling locations for ${needsLocation.length} businesses (${existingLocs.size} already have locations)\n`);

  // Get region ID
  const regRes = await fetch(`${SUPABASE_URL}/rest/v1/regions?slug=eq.flushing-ny&select=id`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const regionId = (await regRes.json())[0]?.id || null;

  let saved = 0, failed = 0;

  for (let i = 0; i < needsLocation.length; i++) {
    const biz = needsLocation[i];
    const searchName = biz.display_name_zh || biz.display_name;
    process.stdout.write(`[${i + 1}/${needsLocation.length}] ${searchName}...`);

    try {
      // Search for the business to get place ID
      const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'places.id',
        },
        body: JSON.stringify({ textQuery: `${biz.display_name} Flushing NY`, maxResultCount: 1 }),
      });
      const searchData = await searchRes.json();
      const placeId = searchData.places?.[0]?.id;

      if (!placeId) {
        console.log(' ⏭️ not found');
        failed++;
        continue;
      }

      // Get details
      const detailRes = await fetch(`https://places.googleapis.com/v1/${placeId}`, {
        headers: {
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'nationalPhoneNumber,location,shortFormattedAddress,formattedAddress',
        },
      });
      const detailText = await detailRes.text();
      if (!detailText.trim()) { console.log(' ⏭️ empty response'); failed++; continue; }
      const detail = JSON.parse(detailText);

      const lat = detail.location?.latitude || null;
      const lng = detail.location?.longitude || null;
      const fullAddress = detail.formattedAddress || detail.shortFormattedAddress || '';
      const phone = detail.nationalPhoneNumber || '';

      // Parse address
      const parts = fullAddress.split(',').map((s: string) => s.trim());
      const addressLine1 = parts[0] || '';
      const city = parts.length >= 3 ? parts[parts.length - 3] : 'Flushing';
      const stateZipCountry = parts.length >= 2 ? parts[parts.length - 2] : 'NY';
      const state = stateZipCountry.split(' ')[0] || 'NY';
      const zipCode = stateZipCountry.split(' ')[1] || '';

      // Save location
      const locBody = {
        business_id: biz.id,
        address_line1: addressLine1,
        city: city.replace(/[^a-zA-Z\s]/g, '').trim() || 'Flushing',
        state: state.length <= 2 ? state : 'NY',
        zip_code: zipCode,
        latitude: lat,
        longitude: lng,
        region_id: regionId,
        is_primary: true,
      };

      const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/business_locations`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(locBody),
      });

      if (!saveRes.ok) {
        const err = await saveRes.text();
        console.log(` ❌ ${err.slice(0, 60)}`);
        failed++;
        continue;
      }

      // Also update phone on business if missing
      if (phone) {
        await fetch(`${SUPABASE_URL}/rest/v1/businesses?id=eq.${biz.id}`, {
          method: 'PATCH',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });
      }

      console.log(` ✅ ${lat?.toFixed(4)},${lng?.toFixed(4)} | ${addressLine1.slice(0, 30)} | ${phone || 'no phone'}`);
      saved++;

      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.log(` ❌ ${err instanceof Error ? err.message.slice(0, 50) : 'error'}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${saved} locations saved, ${failed} failed`);
}

main().catch(console.error);
