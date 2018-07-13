const LocalStrategy = require('passport-local').Strategy;

module.exports = (passport, db) => {
    passport.use(new LocalStrategy((username, password, callback) => {
        db.compare_pass(username, password, (res) => {
            if(res.code === 1) {
                callback(null, { id: res.id, username: res.username, type: res.type})
            } else if(res.code === 0){
                callback(null, false);
            } else {
                callback(null, user);
            }
        });
    }));

    passport.serializeUser((user, callback) => {
        callback(null, user.id);
    });

    passport.deserializeUser((id, callback) => {
        db.query('SELECT id, username, type FROM users WHERE id=$1', [id], (err, res) => {
            callback(null, res.rows[0]);
        });
    });
};