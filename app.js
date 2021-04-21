if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');

const app = express();

const methodOverride = require('method-override');

const mongoose = require('mongoose');

const session = require('express-session');

const flash = require('connect-flash');

const passport = require('passport');
const LocalStrategy = require('passport-local');

const User = require('./models/user');

const MongoDBStore = require("connect-mongo")(session);

const dbUrl = process.env.DB_URL;

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error'));

db.once('open', () => {
    console.log("Database connected");
});

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))

// parse application/json
app.use(express.json())

app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

const secret = process.env.SECRET || 'thisisasecret'

const store = new MongoDBStore({
    url: dbUrl,
    secret: secret,
    touchAfter: 24 * 60 * 60
});

store.on('error', (error) => {
    console.error('Session store error', error);
})

const sessionConfig = {
    store: store,
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

const userRoutes = require('./routes/users');
app.use('/', userRoutes);

const port = process.env.PORT || 3000;
app.listen(port, process.env.IP, () => {
    console.log(`PoliLime has been served on port ${port}`);
});