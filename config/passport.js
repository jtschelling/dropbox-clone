const LocalStrategy = require('passport-local').Strategy;

module.exports = (passport, db) => {
    passport.use(new LocalStrategy((username, password, callback) => {
        db.compare_pass(username, password, (res) => {
            if(res.code === 1) {
                console.log('good');
                callback(null, { id: res.id, username: res.username, type: res.type})
            } else if(res.code === 0){
                console.log('wrong');
                callback(null, false);
            } else {
                console.log('err');
                callback(null, user);
            }
        });
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, callback) => {
        db.query('SELECT id, username, type FROM users WHERE id=$1', [parseInt(id), 10], (err, res) => {
            callback(null, res.rows[0]);
        });
    });
};