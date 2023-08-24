// Module importer
const express = require('express');
const session = require('express-session');
const { Sequelize, DataTypes, Model, Op } = require('sequelize');
const passport = require('passport');
const app = express()
const path = require('path');
const authroutes = require('./authroutes');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const auth = require('./auth');
const db = require("./database.js");
const { Book, Rating } = require("./database.js");
const LocalStrategy = require('passport-local').Strategy;

//configuration Express
app.use(express.static(path.join(__dirname, 'static')));
app.set('view engine', 'ejs')

// Configuration des paramètres de session
app.use(session({
    secret: 'keyboard cat', //définition cléf secrete pour signer les cookies de session
    resave: false, 
    saveUninitialized: false, 
    cookie: { //configuration options cookies de session.
        path: "/",
        httpOnly: true,
        maxAge: 3600000 //durée de vie cookie en sec => 1heure
    }
}));

app.use(bodyParser.json());
app.use(express.static('static'))
app.use(express.json());
app.use(passport.initialize());// Initialise le middleware Passport qui gère l'authentification dans l'application.
app.use(passport.session());// Configure Passport pour gérer les sessions d'authentification.
require('./authroutes.js')(app, passport);

app.get('/', function (req, res) {
    res.locals.user = req.user;
    res.render(path.join(__dirname, 'static/index.ejs')); // Le chemin vers index.ejs
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
          // Search bar
          books = await Book.findAll({
              where: {
                  [Op.or]: [//OP.or == tableau combiné avec une logique ou. Cela signifie que si au moins l'une des conditions est vraie, elle sera incluse dans le résultat
                      { author: { [Op.substring]: `%${searchQuery}%` } }, // [Op.substring] indique que l'on recherche une correspondance partielle dans le champs auteur
                      { title: { [Op.substring]: `%${searchQuery}%` } },// `%${searchQuery}%` c'est la chaine que le user entre 
                      { category: { [Op.substring]: `%${searchQuery}%` } },
                      { suggestedEmail: { [Op.substring]: `%${searchQuery}%` } },
                      { isbn: searchQuery } // different car c'est une recherche exacte et non partielle on cherche l'isbn exacte et non la moitié de l'isbn !

                  ],
                  validated: true
              }
          });
      } else {
        
          books = await Book.findAll({ where: { validated: true } });// variable book récupère tous les enregistrements de la table "Book" qui ont été validés 
      }
      
      res.locals.user = req.user;
      res.render(path.join(__dirname, 'static/explore.ejs'), { books: books });
  } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).send('Error fetching books');//status indique juste a l'user que quelque chose s'est mal passé coté serveur et que son action n'est pas valide/se realisera pas
  }
});



app.get('/book', async function (req, res) {
    try {
        const userBooks = await Book.findAll({ where: { renterId: req.user.email } });// variable userBooks récupère tous les enregistrements de la table "Book" où l'utilisateur actuellement authentifié est répertorié comme le locataire (renter) du livre
        res.locals.user = req.user;
        res.render(path.join(__dirname, 'static/book.ejs'), { userBooks: userBooks });//données userBooks sont transmises pour cette page
    } catch (error) {
        console.error('Error fetching user books:', error);
        res.status(500).send('Error fetching user books');
    }
});



app.get('/review', async function (req, res) {
    res.locals.user = req.user;
    const ISBN = req.query.isbn; //récupère la valeur du paramètre de requête "isbn" de la requête HTTP en cours 
    res.render(path.join(__dirname, 'static/review.ejs'), { isbn: ISBN });
});  

app.post('/review', async (req, res) => {
  if (req.user.role === 'normal') {
      await db.pushBook(
          req.body.title,
          req.body.author,
          req.body.desc,
          req.body.gnr,
          req.body.isbn,
          req.user.email
      );
      res.redirect("/");
  } else if (req.user.role === 'bibliothécaire') {
      await db.pushBook(
          req.body.title,
          req.body.author,
          req.body.desc,
          req.body.gnr,
          req.body.isbn, 
          req.user.email,
          true
      );
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

  app.post('/delete', async (req, res) => {
    if (req.isAuthenticated() && req.user.role === 'bibliothécaire') {
      const ISBN = req.body.isbn;
      try {
        const book = await Book.findByPk(ISBN); //findByPk sert a faire une recherche dans la db en fonction de sa clé primaire
        if (ISBN) {
          await book.destroy();  //detruit le livre 
          console.log('Book deleted:', ISBN);
        }
        res.redirect('/explore'); 
      } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).send('Error deleting book');
      }
    } else {
      res.redirect('/'); 
    }
  });

  app.post('/validate', async (req, res) => {
    const ISBN = req.body.isbn;
    const action = req.body.action; // recupere l'action qu'a fait le user soit 'validate' ou 'decline'

    try {
        const book = await db.Book.findByPk(ISBN);

        if (book) {
            if (action === 'validate') {
              await book.update({ validated: true, librarianId: req.user.email }); // modifie le livre
              console.log('Book validated:', ISBN);
            } else if (action === 'decline') {
                await book.destroy(); 
                console.log('Book declined and removed:', ISBN);
            }
        }

        res.redirect('/admin');
    } catch (error) {
        console.error('Error processing book action:', error);
        res.status(500).send('Error processing book action');
    }
});



app.post('/rent', async (req, res) => {
  const ISBN = req.body.isbn;
  const duration = req.body.duration; //recupere la durée 2->6 semaines

  try {
    const book = await Book.findByPk(ISBN);

    if (book && book.copies > 0) {
      const rentStartDate = new Date();
      const rentEndDate = new Date(rentStartDate);
      rentEndDate.setDate(rentEndDate.getDate() + (duration * 7));
      const formattedRentEndDate = rentEndDate.toISOString().split('T')[0]; //met en forme la durée 

      await book.update({
        copies: book.copies - 1,
        rented: true,
        renterId: req.user.email,
        rentStartDate: rentStartDate,
        rentEndDate: formattedRentEndDate,
        rentDuration: duration
      });

      res.redirect('/explore');
    } else {
      res.redirect('/explore');
    }
  } catch (error) {
    console.error('Error renting book:', error);
    res.status(500).send('Error renting book');
  }
});


  app.post('/return', async (req, res) => {
    const ISBN = req.body.isbn;
  
    try {
      const book = await Book.findByPk(ISBN);
      if (book && book.renterId === req.user.email) {
        await book.update({
          copies: book.copies + 1,
          rented: false,
          renterId: null,
          rentStartDate: null,
          rentEndDate: null,
          rentDuration: null
        });
      }
  
      res.redirect('/');
    } catch (error) {
      console.error('Error returning book:', error);
      res.status(500).send('Error returning book');
    }
  });
  

app.get('/rating', async function (req, res) {
  res.locals.user = req.user;
  const ISBN = req.query.isbn; 
  const book = await Book.findByPk(ISBN);
  res.render(path.join(__dirname, 'static/rating.ejs'), { isbn: ISBN, book: book });
});

app.post('/rate', async (req, res) => {
  const isbn = req.body.isbn;
  const userId = req.user.email; 
  const rating = req.body.rating;
  const review = req.body.review;

  try {
    const newRating = await Rating.create({
      isbn: isbn, 
      userId: userId,
      rating: rating,
      review: review
    });

    await Book.increment('likes', { where: { isbn: isbn } }); // augmente de 1 le like pour le livre correspond a l'isbn

    res.redirect('/');
  } catch (error) {
    console.error('Error creating rating:', error);
    res.status(500).send('An error occurred while creating the rating.');
  }
});



app.get('/rating_list', async function (req, res) {
  try {
      const ISBN = req.query.isbn;
      const book = await Book.findByPk(ISBN);
      if (!book) {
          res.status(404).send('Livre non trouvé.');
          return;
      }

      const ratings = await Rating.findAll({ where: { isbn: ISBN } });

      res.render(path.join(__dirname, 'static/rating_list.ejs'), { book: book, ratings: ratings });
  } catch (error) {
      console.error('Error fetching ratings for book:', error);
      res.status(500).send('Error fetching ratings for book');
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
      const ISBN = req.query.isbn;
      const book = await Book.findByPk(ISBN); // recupere un livre en fonction de son ISBN
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
      const ISBN = req.body.isbn;
      const title = req.body.title;
      const author = req.body.author;
      const desc = req.body.desc;
      const gnr = req.body.gnr;
      const copies = req.body.copies; 
      const book = await Book.findByPk(ISBN);

      if (book && book.suggestedEmail === req.user.email) {
        if (action === 'edit') {
          await book.update({title: title,author: author,summary: desc,category: gnr,copies: copies,});
          console.log('Book edited:', ISBN);
        } else if (action === 'decline') {
            await book.destroy(); 
            console.log('Book removed:' ,ISBN);
          }
        }
          res.redirect('/');
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

// crée serveur HTTPS sécurisé
https.createServer({ 
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),
  passphrase: "ingi"
}, app).listen(8080);

console.log('Serveur démarré sur le port 8080');
