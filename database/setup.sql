-- ============================================================================
-- PropAdmin — PostgreSQL Database Setup
-- ============================================================================
-- Run this script against your PostgreSQL database to create the required
-- tables and seed data.  PostgREST will expose these tables automatically.
-- ============================================================================

-- ─── 1. property_fields ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS property_fields (
  id           SERIAL PRIMARY KEY,
  field_key    TEXT        NOT NULL UNIQUE,
  label        TEXT        NOT NULL,
  type         TEXT        NOT NULL CHECK (type IN ('text','number','boolean','select','textarea','multiselect')),
  section      TEXT        NOT NULL DEFAULT 'basic_info',
  required     BOOLEAN     NOT NULL DEFAULT FALSE,
  options      JSONB       DEFAULT NULL,          -- array of strings for select / multiselect
  order_index  INTEGER     NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE property_fields IS 'Schema-driven field definitions for property forms.';

-- ─── 2. properties ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS properties (
  id           SERIAL PRIMARY KEY,
  house_id     TEXT        NOT NULL UNIQUE,
  data         JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_properties_updated_at ON properties;
CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE properties IS 'Property listings with dynamic JSONB data column.';

-- ─── 3. Seed: property_fields ──────────────────────────────────────────────

INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active)
VALUES
  -- Basic Info
  ('house_name',      'House Name',        'text',        'basic_info',  TRUE,   NULL, 1,  TRUE),
  ('description',     'Description',       'textarea',    'basic_info',  FALSE,  NULL, 2,  TRUE),
  ('property_type',   'Property Type',     'select',      'basic_info',  FALSE,  '["Villa","Condo","House","Apartment"]', 3, TRUE),

  -- Location
  ('location',        'Location',          'text',        'location',    TRUE,   NULL, 10, TRUE),
  ('address',         'Full Address',      'textarea',    'location',    FALSE,  NULL, 11, TRUE),
  ('google_maps_url', 'Google Maps URL',   'text',        'location',    FALSE,  NULL, 12, TRUE),

  -- Capacity
  ('max_guests',      'Max Guests',        'number',      'capacity',    TRUE,   NULL, 20, TRUE),
  ('bedrooms',        'Bedrooms',          'number',      'capacity',    FALSE,  NULL, 21, TRUE),
  ('bathrooms',       'Bathrooms',         'number',      'capacity',    FALSE,  NULL, 22, TRUE),
  ('beds',            'Beds',              'number',      'capacity',    FALSE,  NULL, 23, TRUE),

  -- Facilities
  ('private_pool',    'Private Pool',      'boolean',     'facilities',  FALSE,  NULL, 30, TRUE),
  ('wifi',            'WiFi',              'boolean',     'facilities',  FALSE,  NULL, 31, TRUE),
  ('parking',         'Parking',           'boolean',     'facilities',  FALSE,  NULL, 32, TRUE),
  ('air_conditioning','Air Conditioning',  'boolean',     'facilities',  FALSE,  NULL, 33, TRUE),
  ('kitchen',         'Kitchen',           'boolean',     'facilities',  FALSE,  NULL, 34, TRUE),
  ('amenities',       'Amenities',         'multiselect', 'facilities',  FALSE,  '["TV","Washing Machine","Dryer","Iron","Hair Dryer","BBQ Grill","Gym","Sauna"]', 35, TRUE),

  -- Pricing
  ('price_weekday',   'Weekday Price',     'number',      'pricing',     FALSE,  NULL, 40, TRUE),
  ('price_fri',       'Friday Price',      'number',      'pricing',     FALSE,  NULL, 41, TRUE),
  ('price_sat',       'Saturday Price',    'number',      'pricing',     FALSE,  NULL, 42, TRUE),
  ('price_sun',       'Sunday Price',      'number',      'pricing',     FALSE,  NULL, 43, TRUE),
  ('price_holiday',   'Holiday Price',     'number',      'pricing',     FALSE,  NULL, 44, TRUE),
  ('currency',        'Currency',          'select',      'pricing',     FALSE,  '["THB","USD","EUR"]', 45, TRUE),

  -- Rules
  ('check_in_time',   'Check-in Time',     'text',        'rules',       FALSE,  NULL, 50, TRUE),
  ('check_out_time',  'Check-out Time',    'text',        'rules',       FALSE,  NULL, 51, TRUE),
  ('pets_allowed',    'Pets Allowed',      'boolean',     'rules',       FALSE,  NULL, 52, TRUE),
  ('smoking_allowed', 'Smoking Allowed',   'boolean',     'rules',       FALSE,  NULL, 53, TRUE),
  ('house_rules',     'House Rules',       'textarea',    'rules',       FALSE,  NULL, 54, TRUE)
ON CONFLICT (field_key) DO NOTHING;

-- ─── 4. Seed: sample properties ────────────────────────────────────────────

INSERT INTO properties (house_id, data)
VALUES
  ('PT60', '{
    "house_name": "PT60 Pattaya Pool Villa",
    "description": "Stunning 4-bedroom pool villa in the heart of Pattaya, perfect for group getaways.",
    "property_type": "Villa",
    "location": "Pattaya",
    "address": "123 Soi Pattaya 10, Banglamung, Chonburi 20150",
    "max_guests": 10,
    "bedrooms": 4,
    "bathrooms": 3,
    "beds": 5,
    "private_pool": true,
    "wifi": true,
    "parking": true,
    "air_conditioning": true,
    "kitchen": true,
    "amenities": ["TV","Washing Machine","BBQ Grill"],
    "price_weekday": 4500,
    "price_fri": 5500,
    "price_sat": 5900,
    "price_sun": 5000,
    "price_holiday": 7500,
    "currency": "THB",
    "check_in_time": "14:00",
    "check_out_time": "11:00",
    "pets_allowed": false,
    "smoking_allowed": false
  }'),
  ('HH12', '{
    "house_name": "HH12 Hua Hin Beach House",
    "property_type": "House",
    "location": "Hua Hin",
    "max_guests": 6,
    "bedrooms": 3,
    "bathrooms": 2,
    "private_pool": false,
    "wifi": true,
    "price_sat": 3500,
    "currency": "THB"
  }')
ON CONFLICT (house_id) DO NOTHING;

-- ─── 5. PostgREST permissions (adjust role as needed) ──────────────────────

-- If you use a dedicated "web_anon" or "authenticator" role, grant access:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON property_fields TO web_anon;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON properties       TO web_anon;
-- GRANT USAGE, SELECT ON SEQUENCE property_fields_id_seq   TO web_anon;
-- GRANT USAGE, SELECT ON SEQUENCE properties_id_seq        TO web_anon;
