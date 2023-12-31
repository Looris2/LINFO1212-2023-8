const { getUser,User } = require('./database');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

module.exports = {
  salt,saltRounds
}

//checker si l'user entre les bonnes informations
passport.use(new LocalStrategy(
  { usernameField: 'email' }, 
  async function (email, password, done) {
    try {
      const user = await getUser(email);
      if (!user) {
        return done(null, false, { message: 'Adresse e-mail incorrecte.' });
      }
      if (bcrypt.compareSync(password, user.password)) {
        return done(null, user);
      }
      return done(null, false, { message: 'Mot de passe incorrect.' });
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser(function (user, cb) {
  cb(null, user.email);
});
  

  passport.deserializeUser(function (email, done) {
    User.findOne({ where: { email } })
      .then(user => {
        done(null, user);
      })
      .catch(err => done(err));
  });
