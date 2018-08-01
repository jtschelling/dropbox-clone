const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

module.exports = {
    pool,
    query: (text, params, callback) => {
        // pool.connect((err, client, done) => {
        //     if(err) {
        //         console.log(`${ err }\nOccurred in db.query.pool.connect()`);
        //     }
        const start = Date.now();
        return pool.query(text, params, (err, res) => {
            const duration = Date.now() - start;
            // eslint-disable-next-line
            console.log(`executed query ${ text }`, params);
            // done();
            callback(err, res);
        });
        // });
    },
    compare_pass: (username, password, callback) => {
        pool.query(`SELECT * FROM users WHERE username=$1 AND password=crypt($2,password)`, [username, password], (err, res) => {
            if (err) {
                // eslint-disable-next-line
                console.log(`${ err }\nOccurred in db.compare_pass()`);
                callback({ code: -1 });
            } else if (res.rows.length > 0) {
                callback({ id: res.rows[0].id, username: res.rows[0].username, type: res.rows[0].type, code: 1});
            } else {
                callback({code: 0});
            }
        })
    },
    getUserFiles: (params, callback) => {
        const queryStr = `SELECT * FROM files WHERE files.userid = $1`;
        return pool.query(queryStr, params, (err, res) => {
            if(err) {
                console.log(err);
            }
            callback(res);
        });
    },
    getFileKey: (params, callback) => {
        const queryStr = `SELECT filekey, filetype, filesize FROM files WHERE userid=$1 AND filename=$2`;
        return pool.query(queryStr, params, (err, res) => {
            if(err) {
                console.log(err);
            }
            callback(res);
        })
    },
    newFile: (params, callback) => {
        const queryStr = `INSERT INTO files (userid, filename, filekey, filetype, uploaded, filesize) values ($1, $2, $3, $4, now(), $5)`;
        return pool.query(queryStr, params, (err, res) => {
            if(err) {
                console.log(err);
            }
            callback(res);
        });
    },
    newUser: (params, callback) => {
        const queryStr = `INSERT INTO users (username, password, type) values ($1, crypt($2, gen_salt('bf')), 'user')`;
        return pool.query(queryStr, params, (err, res) => {
            if(err) {
                console.log(err);
            }
            callback(res);
        });
    },
    end: () => {
        pool.end((err) => {
            if(err) {
                // eslint-disable-next-line
                console.log(`${ err }\nOccurred in db.end.pool.end()`);
            }
        });
    }
}