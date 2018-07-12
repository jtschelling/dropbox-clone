// const pg = require('pg');
const db = require('./db');
const aws = require('aws-sdk');
const ejs = require('ejs');
const express = require('express');
const helmet = require('helmet');

/*
  * TODO: make the app clean itself up nicely on exit
  *
*/
process.on('SIGINT', () => {
  db.end();
  // eslint-disable-next-line
  console.log('dickebute');
  process.exit(0);
});

/*
  * SETUP AWS S3 BUCKET & CONFIGURATIONS
  *
*/
const S3_BUCKET = process.env.S3_BUCKET_NAME;
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION,
});
const s3 = new aws.S3();

/*
  * SETUP EXPRESS
  *
*/
// Begin
const app = express();

//  View Engine
app.set('views', './views');
app.engine('html', ejs.renderFile);

// Express Middleware
app.use(helmet());

// Start Express listener
const port = process.env.PORT || 5000;
app.listen(port, () => {
  // eslint-disable-next-line
  console.log(`app listening on port ${port}`);
});

/* SETUP COMPLETE */
/* ROUTING LOGIC BELOW */

/*
  * LOGIN PAGE
  *
*/
app.get('/', (req, res) => res.render('login.html'));

/*
  * User dashboard generated from postgres database
  * Values needed:  RefID for AWS S3 file
  *                 Username
  *                 User defined filename
  *                 filetype
*/
app.get('/dashboard', (req, res) => res.render('dashboard.html'));

/*
  * api for authenicating a user's credentials against
  * the postgresql database 'users' table
  *
*/
app.get('/auth', (req, res) => {
  res.statusCode = 401;
  const { username, password } = req.query;

  db.compare_pass(username, password, (resCode) => {
    if (resCode === -1) {
      // eslint-disable-next-line
      console.log(`${ err }\nOccurred in server/get/auth db.query()`);
      res.statusCode = 500;
      res.end();
    } else if (resCode === 0) {
      res.statusCode = 302;
      const returnData = {
        url: `${req.protocol}://${req.get('host')}/dashboard`,
      };
      res.write(JSON.stringify(returnData));
      res.end();
    } else if (resCode === 1) {
      res.statusCode = 401;
      res.end();
    } else {
      res.statusCode = 500;
      res.end();
    }
  });
});

/*
 * Respond to GET requests to /sign-s3.
 * Upon request, return JSON containing the temporarily-signed S3 request and
 * the anticipated URL of the image.
 *
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
