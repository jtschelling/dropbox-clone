const db = require('./db');
const aws = require('aws-sdk');
const express = require('express');
const passport = require('passport');
const { requiresLogin } = require('./config/middleware/authorization');
const crypto = require('crypto');
// const mime = require('mime');

/*
  * TODO: clean up nicely on exit
  *
*/
process.on('SIGINT', () => {
  db.end();
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
const port = process.env.PORT || 5000;
const app = express();

require('./config/passport')(passport, db);
require('./config/express')(app, passport, db.pool);

// Start Express listener
app.listen(port, () => {
  // eslint-disable-next-line
  console.log(`app listening on port ${port}`);
});

/* SETUP COMPLETE */
/* ROUTING LOGIC BELOW */

/*
  * ROOT URL
  *
*/
app.get('/', (req, res) => res.redirect('/login'));

/*
  * LOGIN PAGE
  *
*/
app.get('/login', (req, res) => res.render('login.html'));

app.get('/logout', (req, res) => {
  req.logout();
  res.statusCode = 302;
  const returnData = {
    url: `${req.protocol}://${req.get('host')}/login`,
  };
  res.write(JSON.stringify(returnData));
  res.end();
});

app.post('/newuser', (req, res) => {
  if (req.body.username.length < 1 || req.body.password.length < 1) {
    res.statusCode = 500;
    res.end();
  }

  const params = [req.body.username, req.body.password];
  db.newUser(params, () => {
    res.statusCode = 200;
    res.end();
  });
});

/*
  * User dashboard generated from postgres database
  * Values needed:  RefID for AWS S3 file
  *                 Username
  *                 User defined filename
  *                 filetype
*/
app.get('/dashboard', requiresLogin, (req, res) => {
  res.render('dashboard.html');
});

app.get('/dashboard/userdata', requiresLogin, (req, res) => {
  const userid = req.user.id;
  db.getUserFiles([userid], (dbres) => {
    res.statusCode = 200;
    res.send(dbres.rows);
    res.end();
  });
});

/*
  * api for authenicating a user's credentials against
  * the postgresql database 'users' table
  *
*/
app.post('/auth', passport.authenticate('local'), (req, res) => {
  res.statusCode = 302;
  const returnData = {
    url: `${req.protocol}://${req.get('host')}/dashboard`,
  };
  res.write(JSON.stringify(returnData));
  res.end();
});

/*
 * Respond to GET requests to /sign-s3.
 * Upon request, return JSON containing the temporarily-signed S3 request and
 * the anticipated URL of the image.
 *
*/
app.get('/sign-s3-put-request', requiresLogin, (req, res) => {
  const fileType = req.query['file-type'];
  const fileKey = crypto.randomBytes(8).toString('hex');

  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileKey,
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
      fileKey,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileKey}`,
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });
});

app.get('/sign-s3-get-request', requiresLogin, (req, res) => {
  const userid = req.user.id;
  const filename = req.query['file-name'];

  db.getFileKey([userid, filename], (keyres) => {
    const s3Params = {
      Bucket: S3_BUCKET,
      Key: keyres.rows[0].filekey,
      ResponseContentDisposition: `attachment; filename=${filename}`,
      Expires: 60,
    };

    s3.getSignedUrl('getObject', s3Params, (err, data) => {
      if (err) {
        // eslint-disable-next-line
        console.log(err);
        res.end();
      }
      const returnData = {
        signedRequest: data,
        url: `https://${S3_BUCKET}.s3.amazonaws.com/${keyres.rows[0].filekey}`,
      };
      res.write(JSON.stringify(returnData));
      res.end();
    });
  });
});

app.post('/save-file-details', requiresLogin, (req, res) => {
  const params = [req.user.id, req.body.filename, req.body.filekey,
    req.body.filetype, req.body.filesize];

  db.newFile(params, () => {

  });
  res.end();
});
