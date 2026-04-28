const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.gzsjgqekudrgaqknqxvn:@@mergulhodb@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
});

client.connect()
  .then(() => {
    console.log('Connected successfully!');
    client.end();
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
