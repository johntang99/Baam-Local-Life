-- ============================================================
-- SITES TABLE — Maps sites to regions (many-to-many)
-- A site = a deployable portal (e.g., "NY Chinese", "OC English")
-- Each site covers multiple regions that can be added over time
-- ============================================================

CREATE TABLE sites (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,           -- "New York Chinese"
  name_zh       TEXT,                    -- "纽约中文站"
  locale        content_lang NOT NULL DEFAULT 'zh',  -- primary language
  domain        TEXT,                    -- "ny.baam.us"
  description   TEXT,
  status        TEXT DEFAULT 'active',   -- active | planned | disabled
  is_default    BOOLEAN DEFAULT FALSE,   -- default site for new content
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Site ↔ Region mapping (many-to-many)
-- A site can cover many regions; a region can belong to multiple sites
CREATE TABLE site_regions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  region_id   UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  is_primary  BOOLEAN DEFAULT FALSE,  -- primary region for this site
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, region_id)
);

CREATE INDEX idx_site_regions_site ON site_regions(site_id);
CREATE INDEX idx_site_regions_region ON site_regions(region_id);

-- Seed initial sites
INSERT INTO sites (slug, name, name_zh, locale, domain, description, status, is_default) VALUES
('ny-zh', 'New York Chinese', '纽约中文站', 'zh', 'ny.baam.us',
 '面向纽约华人社区，覆盖法拉盛、皇后区、曼哈顿等地区', 'active', true),
('oc-en', 'Middletown OC English', 'Middletown英文站', 'en', 'oc.baam.us',
 'Local portal for Orange County area: Middletown, Wallkill, Goshen and surrounding communities', 'planned', false);

-- Map regions to sites
-- NY Chinese: covers Flushing, Queens, NYC (can add Brooklyn, Manhattan later)
INSERT INTO site_regions (site_id, region_id, is_primary) VALUES
((SELECT id FROM sites WHERE slug = 'ny-zh'), (SELECT id FROM regions WHERE slug = 'flushing-ny'), true),
((SELECT id FROM sites WHERE slug = 'ny-zh'), (SELECT id FROM regions WHERE slug = 'queens-ny'), false),
((SELECT id FROM sites WHERE slug = 'ny-zh'), (SELECT id FROM regions WHERE slug = 'new-york-city'), false),
((SELECT id FROM sites WHERE slug = 'ny-zh'), (SELECT id FROM regions WHERE slug = 'new-york-state'), false);

-- OC English: covers Middletown, Orange County (can add Wallkill, Goshen later)
INSERT INTO site_regions (site_id, region_id, is_primary) VALUES
((SELECT id FROM sites WHERE slug = 'oc-en'), (SELECT id FROM regions WHERE slug = 'middletown-ny'), true),
((SELECT id FROM sites WHERE slug = 'oc-en'), (SELECT id FROM regions WHERE slug = 'orange-county-ny'), false);
