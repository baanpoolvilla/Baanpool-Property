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

  const f = await c.query('SELECT count(*) as cnt FROM property_fields');
  console.log('property_fields count:', f.rows[0].cnt);

  const p = await c.query('SELECT count(*) as cnt FROM properties');
  console.log('properties count:', p.rows[0].cnt);

  const s = await c.query('SELECT house_id FROM properties');
  console.log('properties:', s.rows.map(r => r.house_id).join(', '));

  const r = await c.query("SELECT rolname FROM pg_roles WHERE rolname='web_anon'");
  console.log('web_anon role:', r.rows.length > 0 ? 'EXISTS' : 'NOT FOUND');

  await c.end();
  console.log('Database verification complete!');
})();
