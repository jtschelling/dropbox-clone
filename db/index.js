const { Pool } = require('pg');

const pool = new Pool(process.env.DATABASE_URL);

module.exports = {
    compare_pass: (username, password, callback) => {
        pool.query(`SELECT EXISTS(SELECT * FROM users WHERE email=$1 AND password=crypt($2,password))`, [username, password], (err, res) => {
            if (err) {
                // eslint-disable-next-line
                console.log(`${ err }\nOccurred in db.compare_pass()`);
                callback(-1);
            } else if (res.rows[0].exists === true) {
                callback(0);
            } else if (res.rows[0].exists === false) {
                callback(1);
            }
        })
    },
    query: (text, params, callback) => {
        // pool.connect((err, client, done) => {
        //     if(err) {
        //         console.log(`${ err }\nOccurred in db.query.pool.connect()`);
        //     }
        const start = Date.now();
        return pool.query(text, params, (err, res) => {
            const duration = Date.now() - start;
            // eslint-disable-next-line
            console.log(`executed query ${ text }`);
            // done();
            callback(err, res);
        });
        // });
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