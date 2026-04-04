-- Lower East Side / East Village (Manhattan) + Murray Hill, Queens (Northern Blvd belt)
-- Complements Flushing-adjacent coverage without duplicating flushing-ny slug.

INSERT INTO regions (slug, name_en, name_zh, type, timezone, latitude, longitude, parent_id)
SELECT
  'lower-east-side-ny',
  'Lower East Side & East Village',
  '曼哈顿东村',
  'neighborhood',
  'America/New_York',
  40.7250,
  -73.9850,
  (SELECT id FROM regions WHERE slug = 'new-york-city' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM regions WHERE slug = 'lower-east-side-ny');

INSERT INTO regions (slug, name_en, name_zh, type, timezone, latitude, longitude, parent_id)
SELECT
  'murray-hill-queens-ny',
  'Murray Hill, Queens (Northern Blvd)',
  '皇后默里山',
  'neighborhood',
  'America/New_York',
  40.7627,
  -73.8155,
  (SELECT id FROM regions WHERE slug = 'queens-ny' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM regions WHERE slug = 'murray-hill-queens-ny');
