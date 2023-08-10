const express = require('express');
const session = require('express-session');
const passport = require('passport');
const app = express()
const path = require('path');
const authroutes = require('./authroutes');
const bodyParser = require('body-parser');
const auth = require('./auth');
const db = require("./database.js");
const LocalStrategy = require('passport-local').Strategy;

app.use(express.static(path.join(__dirname, 'static')));
app.set('view engine', 'ejs')

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
        path: "/",
        httpOnly: true,
        maxAge: 3600000
    }
}));

app.use(bodyParser.json());
app.use(express.static('static'))
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());
require('./authroutes.js')(app, passport);

app.get('/', function (req, res) {
    res.locals.user = req.user;
    res.render(path.join(__dirname, 'static/index.ejs'));
});

app.post('/auth', (req, res) => {
    req.session.id = user.id;
  });

app.get('/auth', function (req, res) {
    res.render(path.join(__dirname, 'static/auth.ejs'));
});

app.get('/selection', function (req, res) {
     res.locals.user = req.user;
    res.render(path.join(__dirname, 'static/selection.ejs'));
});

app.get('/explore', function (req, res) {
    res.locals.user = req.user;
   res.render(path.join(__dirname, 'static/explore.ejs'));
});

app.post('/review',(req, res) =>{
    db.pushBook(req.body.title, req.body.author, req.body.desc, req.body.gnr, req.user.email);
    res.redirect("/");
 });

app.get('/review', function (req, res) {
    res.locals.user = req.user;
   res.render(path.join(__dirname, 'static/review.ejs'));
});

app.listen(8080, () => {
    console.log('Serveur démarré sur le port 8080');
});