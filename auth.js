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
  function (email, password, done) {
      getUser(email)
          .then(function (user) {
              if (!user) {
                  return done(null, false, { message: 'Adresse e-mail incorrecte.' });
              }
              if (bcrypt.compareSync(password, user.password)) {
                return done(null, user);
              }
              return done(null, false, { message: 'Mot de passe incorrect.' });
          })
          .catch(err => done(err));
  }  
));

//serializer le mdp du user
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, user.id);
  });
});
  
  //deserializer le mdp du user
  passport.deserializeUser(function (id, done) {
    User.findByPk(id)
      .then(user => {
        done(null, user);
      })
      .catch(err => done(err));
  });
