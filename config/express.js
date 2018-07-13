const helmet = require('helmet');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const ejs = require('ejs');




module.exports = (app, passport, pool) => {
    //  View Engine
    app.set('views', './views');
    app.engine('html', ejs.renderFile);

    // Express Middleware
    app.use(helmet());
    
    app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
    app.use(expressValidator());

    app.use(methodOverride(function (req) {
		if (req.body && typeof req.body === 'object' && '_method' in req.body) {
			var method = req.body._method
			delete req.body._method
			return method
		}
    }));
    
    app.use(cookieParser());
	app.use(session({
		store: new pgSession({
			pool
		}),
        secret: process.env.SESSION_SECRET,
        saveUninitialized: true,
		resave: false,
        cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
	}));
    
    app.use(passport.initialize());
    app.use(passport.session());
}