const http = require('http');
// const { Client } = require('pg');
// const fs = require('fs');
const AWS = require('aws-sdk');

// SETUP BUCKET CONFIG
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-2',
});
const s3 = new AWS.S3();


const params = {
  Bucket: process.env.S3_BUCKET_NAME,
  Key: '50qeV.png',
};


// const { DATABASE_URL } = process.env;


const port = process.env.PORT || 5000;
const server = http.createServer((req, res) => {
//   const client = new Client({
//     connectionString: DATABASE_URL,
//   });
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   client.connect()
//     .then(() => client.query('SELECT * FROM testingtable'))
//     .then((result) => {
//       res.end(`${result.rows[0].name}\n`);
//       client.end();
//     })
//     .catch(() => {
//       res.end('is this what im getting');
//       client.end();
//     });
  s3.getObject(params).createReadStream().pipe(res);
});
server.listen(port, () => {
  // eslint-disable-next-line
  console.log(`Server running on port ${port}`);
});
