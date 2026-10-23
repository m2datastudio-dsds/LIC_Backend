import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres:vasumathi@localhost:5432/LIC',
});

const run = async () => {
  await client.connect();

  await client.query('CREATE SCHEMA IF NOT EXISTS "Insurance";');
  await client.query('ALTER DATABASE "LIC" SET search_path TO "Insurance";');
  await client.query('ALTER ROLE postgres SET search_path TO "Insurance";');

  const result = await client.query("SHOW search_path;");
  console.log('search_path after change:', result.rows[0].search_path);

  const tables = await client.query(`SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='Insurance' AND table_name IN ('User','Category','Product','Service','Enquiry') ORDER BY table_name;`);
  console.log('tables:', JSON.stringify(tables.rows, null, 2));

  await client.end();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
