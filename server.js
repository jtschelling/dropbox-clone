const pg = require('pg');
const aws = require('aws-sdk');
const ejs = require('ejs');
const express = require('express');

// exit cleanly on SIGINT
process.on('SIGINT', () => {
  // eslint-disable-next-line
  console.log('dickebute');
  process.exit(0);
});

// SETUP BUCKET CONFIG
const S3_BUCKET = process.env.S3_BUCKET_NAME;
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION,
});
const s3 = new aws.S3();

// EXPRESS SETUP
const app = express();
app.set('views', './views');
app.use(express.static('./public'));
app.engine('html', ejs.renderFile);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  // eslint-disable-next-line
  console.log(`app listening on port ${port}`);
});

/* SETUP COMPLETE */
/* ROUTING LOGIC BELOW */

// LOGIN PAGE
app.get('/', (req,res) => res.render('login.html'));

// USER HOMEPAGE
app.get('/homepage', (req, res) => res.render('homepage.html'));

/*
 * Respond to GET requests to /sign-s3.
 * Upon request, return JSON containing the temporarily-signed S3 request and
 * the anticipated URL of the image.
 */
app.get('/sign-s3', (req, res) => {
  const fileName = req.query['file-name'];
  const fileType = req.query['file-type'];
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if(err){
      console.log(err);
      return res.end();
    }
    const returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });
});

/* VERIFY USER IDENTITY IN DATABASE */
app.get('/auth', (req, res) => {
  res.statusCode = 401;
  const username = req.query['username'];
  const password = req.query['password'];

  const query = 'SELECT EXISTS(SELECT * FROM users WHERE email=\'' + username + '\' AND password=crypt(\'' + password + '\',password))';

  client = new pg.Client(process.env.DATABASE_URL);
  client.connect()

  client.query(query, (err, queryres) => {
    if(queryres.rows[0].exists == true) {
      res.statusCode = 200;
      res.end();
    } else {
      res.statusCode = 401;
      res.end();
    }
    client.end();
  });
});

/*
 * Respond to POST requests to /save-details.
 */
app.post('/save-details', (req, res) => {
  // TODO: Read POSTed form data and do something useful
});
