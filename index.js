const http = require('http');
const { Client } = require('pg');

const port = process.env.PORT || 5000;
const { DATABASE_URL } = process.env;
const server = http.createServer((req, res) => {
  const client = new Client({
    connectionString: DATABASE_URL,
  });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  client.connect()
    .then(() => client.query('SELECT * FROM testingtable'))
    .then((result) => {
      res.end(`${result.rows[0].name}\n`);
      client.end();
    })
    .catch(() => {
      res.end('is this what im getting');
      client.end();
    });
});
server.listen(port, () => {
  // eslint-disable-next-line
  console.log(`Server running on port ${port}`);
});
