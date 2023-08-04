const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const passport = require('passport-local');
const bcrypt = require('bcrypt');
const { User } = require('./database');
const {salt} = require('./auth');

module.exports = function (app, passport) {

  app.use((bodyparser.urlencoded({ extended: true })))
  app.use(bodyparser.json());

  app.get('/signup', function (req, res) {
    res.render('index');
  })
  app.get('/login', function (req, res) {
    res.send({
      username: req.body.username
    })
  });

  //singup
  app.post('/signup', async function (req, res) {
    try{
      const { username, name, email } = req.body;
      const existingUser = await User.findOne({where: { email } })

      if (existingUser){
        console.log('User already exists!');
        res.redirect('/auth');
      }else{
        User.create({
          username,
          name,
          email,
          password: bcrypt.hashSync(req.body.password, salt),
        });
       console.log('New user created successfully!');
        res.redirect('/');
      }
    } catch (error){
      console.error('Error creating user:', error.message);
      throw error;
    };
  });
  
  //login
  app.post('/login', passport.authenticate('local', { successRedirect:'/', failureRedirect: '/auth' }));

  //logout
  app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next("test",err); }
      res.redirect('/');
    });
  });
}
