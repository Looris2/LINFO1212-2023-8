const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const passport = require('passport-local');
const bcrypt = require('bcrypt');
const db = require("./database.js");
const { User } = require('./database');
const {salt} = require('./auth');
const { Book } = require("./database.js");

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
       //redirige le nouv user vers la page home ou il est deja connecté
       passport.authenticate('local')(req, res, function () {
        res.redirect('/');
    });
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

  //delete a book
  app.post('/delete', async (req, res) => {
    if (req.isAuthenticated() && req.user.role === 'bibliothécaire') {
      const bookId = req.body.bookId;
      try {
        const book = await Book.findByPk(bookId);
        if (book) {
          await book.destroy(); // Supprimer le livre de la base de données
          console.log('Book deleted:', bookId);
        }
        res.redirect('/explore'); 
      } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).send('Error deleting book');
      }
    } else {
      res.redirect('/'); // Rediriger vers la page d'accueil si l'utilisateur n'est pas bibliothécaire
    }
  });

  app.post('/review', async (req, res) => {
    if (req.user.role === 'normal') {
      // Utilisateur normal suggère un livre avec l'ISBN
      await db.pushBook(req.body.title, req.body.author, req.body.desc, req.body.gnr, req.body.isbn, req.user.email);
      res.redirect("/");
    } else if (req.user.role === 'bibliothécaire') {
      // Bibliothécaire valide un livre avec l'ISBN
      const bookId = req.body.bookId;
      await db.pushBook(req.body.title, req.body.author, req.body.desc, req.body.gnr, req.body.isbn, req.user.email, true);
      res.redirect("/");
    }
  });
  
}
