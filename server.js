const pg = require('pg');
const aws = require('aws-sdk');
const ejs = require('ejs');
const express = require('express');
const helmet = require('helmet');

/*
  * you can only use a postgresql api client once,
  * when you call client.end() you have to new pg.Client()
  * each time you want to access the db.
  * i had to declare this here because each database access
  * takes place in a mutliple use express response?
  *
*/
let client;

/*
  * TODO: make the app clean itself up nicely on exit
*/
process.on('SIGINT', () => {
  // eslint-disable-next-line
  console.log('dickebute');
  process.exit(0);
});

// SETUP AWS S3 BUCKET & CONFIGURATIONS
const S3_BUCKET = process.env.S3_BUCKET_NAME;
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION,
});
const s3 = new aws.S3();

// SETUP EXPRESS
const app = express();
app.use(helmet());
app.set('views', './views');
app.engine('html', ejs.renderFile);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  // eslint-disable-next-line
  console.log(`app listening on port ${port}`);
});

/* SETUP COMPLETE */
/* ROUTING LOGIC BELOW */

// LOGIN PAGE
app.get('/', (req, res) => res.render('login.html'));

// USER HOMEPAGE
app.get('/homepage', (req, res) => res.render('homepage.html'));

/*
  * api for authenicating a user's credentials against
  * the postgresql database 'users' table
*/
app.get('/auth', (req, res) => {
  res.statusCode = 401;
  const { username, password } = req.query;

  // query that returns true if $password matches $username and false if it does not match
  const query = `SELECT EXISTS(SELECT * FROM users WHERE email='${username}' AND password=crypt('${password}',password))`;

  // a new client object needs to be created each db access
  client = new pg.Client(process.env.DATABASE_URL);
  client.connect();

  //
  client.query(query, (err, queryres) => {
    if (err) {
      // eslint-disable-next-line
      console.log(`error: ${ err } has occurred`);
      res.statusCode = 500;
      res.end();
    } else if (queryres.rows[0].exists === true) {
      res.statusCode = 302;
      const returnData = {
        url: `${req.protocol}://${req.get('host')}/homepage`,
      };
      res.write(JSON.stringify(returnData));
      res.end();
    } else {
      res.statusCode = 401;
      res.end();
    }
    client.end();
  });
});

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
    ACL: 'public-read',
  };

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if (err) {
      // eslint-disable-next-line
      console.log(err);
      res.end();
    }
    const returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`,
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });
});

// /*
//  * Respond to POST requests to /save-details.
//  */
// app.post('/save-details', (req, res) => {
//   // TODO: Read POSTed form data and do something useful
// });
