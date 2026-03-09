const { Client } = require('pg');

(async () => {
  const c = new Client({
    host: '100.103.88.37',
    port: 5432,
    database: 'chatbot',
    user: 'postgres',
    password: '123456',
  });
  await c.connect();
  console.log('Connected to PostgreSQL');

  // ─── Add new fields ──────────────────────────────────────────────
  const newFields = `
    INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active)
    VALUES
      -- Capacity: more detail
      ('beds_detail',        'Bed Details (e.g. 2 King, 1 Single)',  'textarea',    'capacity',    FALSE,  NULL, 24, TRUE),
      ('ensuite_bathrooms',  'En-suite Bathrooms',                    'number',      'capacity',    FALSE,  NULL, 25, TRUE),
      ('shared_bathrooms',   'Shared Bathrooms',                      'number',      'capacity',    FALSE,  NULL, 26, TRUE),
      ('living_rooms',       'Living Rooms',                          'number',      'capacity',    FALSE,  NULL, 27, TRUE),
      ('floors',             'Number of Floors',                      'number',      'capacity',    FALSE,  NULL, 28, TRUE),

      -- Parking section
      ('has_parking',        'Has Parking',                           'boolean',     'parking',     FALSE,  NULL, 60, TRUE),
      ('parking_spaces',     'Parking Spaces (Cars)',                 'number',      'parking',     FALSE,  NULL, 61, TRUE),
      ('parking_location',   'Parking Location',                      'select',      'parking',     FALSE,  '["In front of house","Inside compound","Garage","Street parking","Covered parking"]', 62, TRUE),
      ('parking_note',       'Parking Notes',                         'textarea',    'parking',     FALSE,  NULL, 63, TRUE),

      -- Pool & Outdoor section
      ('has_pool',           'Has Pool',                              'boolean',     'pool_outdoor', FALSE, NULL, 70, TRUE),
      ('pool_type',          'Pool Type',                             'select',      'pool_outdoor', FALSE, '["Private","Shared","Infinity","Rooftop","Plunge"]', 71, TRUE),
      ('pool_size',          'Pool Size (e.g. 4x8m)',                 'text',        'pool_outdoor', FALSE, NULL, 72, TRUE),
      ('pool_light_on',      'Pool Light On Time',                    'text',        'pool_outdoor', FALSE, NULL, 73, TRUE),
      ('pool_light_off',     'Pool Light Off Time',                   'text',        'pool_outdoor', FALSE, NULL, 74, TRUE),
      ('pool_heating',       'Pool Heating Available',                'boolean',     'pool_outdoor', FALSE, NULL, 75, TRUE),
      ('pool_rules',         'Pool Rules',                            'textarea',    'pool_outdoor', FALSE, NULL, 76, TRUE),
      ('garden',             'Garden / Yard',                         'boolean',     'pool_outdoor', FALSE, NULL, 77, TRUE),
      ('bbq_area',           'BBQ Area',                              'boolean',     'pool_outdoor', FALSE, NULL, 78, TRUE),
      ('outdoor_furniture',  'Outdoor Furniture',                     'boolean',     'pool_outdoor', FALSE, NULL, 79, TRUE),

      -- Utilities section (เปิดปิดไฟ / น้ำ / แอร์)
      ('electricity_included', 'Electricity Included',                'boolean',     'utilities',   FALSE, NULL, 80, TRUE),
      ('electricity_rate',     'Electricity Rate (THB/unit)',          'number',      'utilities',   FALSE, NULL, 81, TRUE),
      ('water_included',       'Water Included',                      'boolean',     'utilities',   FALSE, NULL, 82, TRUE),
      ('water_rate',           'Water Rate (THB/unit)',                'number',      'utilities',   FALSE, NULL, 83, TRUE),
      ('light_auto_off',       'Auto Light Off Time',                  'text',        'utilities',   FALSE, NULL, 84, TRUE),
      ('quiet_hours_start',    'Quiet Hours Start',                    'text',        'utilities',   FALSE, NULL, 85, TRUE),
      ('quiet_hours_end',      'Quiet Hours End',                      'text',        'utilities',   FALSE, NULL, 86, TRUE),
      ('backup_generator',     'Backup Generator',                     'boolean',     'utilities',   FALSE, NULL, 87, TRUE),

      -- Contact / Management
      ('host_name',            'Host / Manager Name',                  'text',        'contact',     FALSE, NULL, 90, TRUE),
      ('host_phone',           'Host Phone',                           'text',        'contact',     FALSE, NULL, 91, TRUE),
      ('host_line',            'Host LINE ID',                         'text',        'contact',     FALSE, NULL, 92, TRUE),
      ('emergency_contact',    'Emergency Contact',                    'text',        'contact',     FALSE, NULL, 93, TRUE),
      ('cleaning_contact',     'Cleaning Staff Contact',               'text',        'contact',     FALSE, NULL, 94, TRUE),
      ('maintenance_contact',  'Maintenance Contact',                  'text',        'contact',     FALSE, NULL, 95, TRUE)

    ON CONFLICT (field_key) DO NOTHING;
  `;

  await c.query(newFields);
  console.log('New fields inserted');

  // Update PT60 sample data with new fields
  const updatePT60 = `
    UPDATE properties SET data = data || '{
      "ensuite_bathrooms": 2,
      "shared_bathrooms": 1,
      "living_rooms": 1,
      "floors": 2,
      "beds_detail": "Master: 1 King bed\\nRoom 2: 1 Queen bed\\nRoom 3: 2 Single beds\\nRoom 4: 1 Double bed",
      "has_parking": true,
      "parking_spaces": 3,
      "parking_location": "In front of house",
      "has_pool": true,
      "pool_type": "Private",
      "pool_size": "4x8m",
      "pool_light_on": "18:00",
      "pool_light_off": "22:00",
      "pool_heating": false,
      "pool_rules": "No diving. Children under 12 must be supervised. No glass near pool.",
      "garden": true,
      "bbq_area": true,
      "outdoor_furniture": true,
      "electricity_included": false,
      "electricity_rate": 8,
      "water_included": true,
      "light_auto_off": "23:00",
      "quiet_hours_start": "22:00",
      "quiet_hours_end": "08:00",
      "host_name": "Khun Somchai",
      "host_phone": "089-123-4567",
      "host_line": "somchai_host",
      "emergency_contact": "191 (Police) / 1669 (Ambulance)",
      "cleaning_contact": "089-999-0000"
    }'::jsonb
    WHERE house_id = 'PT60';
  `;
  await c.query(updatePT60);
  console.log('PT60 updated with detailed data');

  // Verify
  const res = await c.query('SELECT count(*) as cnt FROM property_fields');
  console.log('Total fields now:', res.rows[0].cnt);

  await c.end();
  console.log('Done!');
})();
