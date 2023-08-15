const express = require('express');
const session = require('express-session');
const { Sequelize, DataTypes, Model, Op } = require('sequelize');
const passport = require('passport');
const app = express()
const path = require('path');
const authroutes = require('./authroutes');
const bodyParser = require('body-parser');
const auth = require('./auth');
const db = require("./database.js");
const { Book } = require("./database.js");
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



app.get('/explore', async function (req, res) {
  try {
      const searchQuery = req.query.search;
      let books;
      
      if (searchQuery) {
          // Rechercher des livres par auteur ou titre (insensible à la casse)
          books = await Book.findAll({
              where: {
                  [Op.or]: [
                      { author: { [Op.substring]: `%${searchQuery}%` } },
                      { title: { [Op.substring]: `%${searchQuery}%` } },
                      { category: { [Op.substring]: `%${searchQuery}%` } },
                      { suggestedEmail: { [Op.substring]: `%${searchQuery}%` } }
                  ],
                  validated: true
              }
          });
      } else {
          // Si aucune recherche n'est effectuée, afficher tous les livres validés
          books = await Book.findAll({ where: { validated: true } });
      }
      
      res.locals.user = req.user;
      res.render(path.join(__dirname, 'static/explore.ejs'), { books: books });
  } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).send('Error fetching books');
  }
});



app.get('/book', async function (req, res) {
    try {
        const userBooks = await Book.findAll({ where: { renterId: req.user.email } });
        res.locals.user = req.user;
        res.render(path.join(__dirname, 'static/book.ejs'), { userBooks: userBooks });
    } catch (error) {
        console.error('Error fetching user books:', error);
        res.status(500).send('Error fetching user books');
    }
});



app.get('/review', async function (req, res) {
    res.locals.user = req.user;
    const bookId = req.query.bookId; 
    res.render(path.join(__dirname, 'static/review.ejs'), { bookId: bookId });
});


 app.post('/review', async (req, res) => {
    if (req.user.role === 'normal') {
      // Utilisateur normal suggère un livre
      await db.pushBook(req.body.title, req.body.author, req.body.desc, req.body.gnr, req.user.email);
      res.redirect("/");
    } else if (req.user.role === 'bibliothécaire') {
      // Bibliothécaire valide un livre
      const bookId = req.body.bookId;
      await db.pushBook(req.body.title, req.body.author, req.body.desc, req.body.gnr, req.user.email, true);
      res.redirect("/");
    }
  });
  

  app.get('/admin', async function (req, res) {
    try {
      const books = await Book.findAll({ where: { validated: false } });
      res.locals.user = req.user;
      res.render(path.join(__dirname, 'static/admin.ejs'), { books: books });
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).send('Error fetching books');
    }
  });

  app.post('/validate', async (req, res) => {
    const bookId = req.body.bookId;
    const action = req.body.action; // Récupérer l'action depuis le formulaire

    try {
        const book = await db.Book.findByPk(bookId);

        if (book) {
            if (action === 'validate') {
              await book.update({ validated: true, librarianId: req.user.email });
              console.log('Book validated:', bookId);
            } else if (action === 'decline') {
                await book.destroy(); // Supprimer le livre de la base de données
                console.log('Book declined and removed:', bookId);
            }
        }

        res.redirect('/admin');
    } catch (error) {
        console.error('Error processing book action:', error);
        res.status(500).send('Error processing book action');
    }
});



  app.post('/rent', async (req, res) => {
    const bookId = req.body.bookId;
    const duration = req.body.duration;
  
    try {
      const book = await Book.findByPk(bookId);
      if (!book.rented) {
        const rentStartDate = new Date();
        const rentEndDate = new Date(rentStartDate);
        rentEndDate.setDate(rentEndDate.getDate() + (duration * 7));
  
        await book.update({
          rented: true,
          renterId: req.user.email,
          rentStartDate: rentStartDate,
          rentDuration: duration
        });
  
        res.redirect('/explore');
      } else {
        res.redirect('/explore');   // Livre déjà loué
      }
    } catch (error) {
      console.error('Error renting book:', error);
      res.status(500).send('Error renting book');
    }
  });

  app.get('/contact', async function (req, res) {
    res.render(path.join(__dirname, 'static/contact.ejs'));
});

app.get('/suggestion', async function (req, res) {
  try {
      const userBooks = await Book.findAll({ where: { validated: false, suggestedEmail: req.user.email  } });
      res.locals.user = req.user;
      res.render(path.join(__dirname, 'static/suggestion.ejs'), { userBooks: userBooks });
  } catch (error) {
      console.error('Error fetching user book suggestions:', error);
      res.status(500).send('Error fetching user book suggestions');
  }
});


app.get('/edit', async function (req, res) {
  try {
      const bookId = req.query.bookId;
      const book = await Book.findByPk(bookId);
      if (book && book.suggestedEmail === req.user.email) {
          res.locals.user = req.user;
          res.render(path.join(__dirname, 'static/edit.ejs'), { book: book });
      } else {
          res.status(403).send("Accès interdit.");
      }
  } catch (error) {
      console.error('Error fetching book for editing:', error);
      res.status(500).send('Error fetching book for editing');
  }
});

app.post('/edit', async (req, res) => {
  try {
      const bookId = req.body.bookId;
      const title = req.body.title;
      const author = req.body.author;
      const desc = req.body.desc;
      const gnr = req.body.gnr;
      
      const book = await Book.findByPk(bookId);
      if (book && book.suggestedEmail === req.user.email) {
          await book.update({
              title: title,
              author: author,
              summary: desc,
              category: gnr,
          });
          res.redirect('/suggestion');
      }
    } catch (error) {
      console.error('Error editing book:', error);
      res.status(500).send('Error editing book');
  }
});

  

app.post('/', async (req, res) => {
    if (req.isAuthenticated() && req.body.password === "belgoteek") { //mot de passe pour bibliothécaie 
        await db.User.update({ role: 'bibliothécaire' }, { where: { email: req.user.email } });
        res.redirect('/');
    } else {
        res.redirect('/');
    }
});
  

app.listen(8080, () => {
    console.log('Serveur démarré sur le port 8080');
});