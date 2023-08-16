const { Sequelize , DataTypes , Model } = require(
    'sequelize')
const sequelize = new Sequelize ('my-db','user','pass',{ 
    dialect: "sqlite",
    storage: "database.sqlite"
});

const User = sequelize.define('User', {
    username: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
      unique: true,
      primaryKey: true,
    },
    password: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      defaultValue: 'normal' // Par défaut, un utilisateur est "normal"
    }
  }, 
{});

const Book = sequelize.define('Book', {
  title: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false
  },
  author: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false
  },
  summary: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false
  },
  suggestedEmail: {
    type: Sequelize.DataTypes.STRING,
    allowNull: true
  },
  validated: {
    type: Sequelize.DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false 
  },
  isbn: {
    type: Sequelize.DataTypes.STRING, 
    allowNull: true,
    unique: true,
    primaryKey: true
  },
  librarianId: {
    type: Sequelize.DataTypes.STRING,
    allowNull: true
  },
  rented: {
    type: Sequelize.DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  renterId: {
    type: Sequelize.DataTypes.STRING,
    allowNull: true
  },
  rentStartDate: {
    type: Sequelize.DataTypes.DATE,
    allowNull: true
  },
  rentEndDate:{
    type: Sequelize.DataTypes.STRING,
    allowNull: true
  },
  rentDuration: {
    type: Sequelize.DataTypes.INTEGER,
    allowNull: true
  },
  likes: {
    type: Sequelize.DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, 
{});

const Rating = sequelize.define('Rating', {
  id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
  },
  isbn: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      references: {
          model: 'Books', // Nom de la table des livres
          key: 'isbn'
      }
  },
  userId: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      references: {
          model: 'Users', // Nom de la table des utilisateurs
          key: 'email'
      }
  },
  rating: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
  },
  review: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true
  },
});




module.exports = {
  getUser: async function (email) {
    return await User.findOne({where: { email: email }});
  },
  pushBook: async function (title, author, desc, gnr, isbn, suggestedEmail, librarianId, validated = false) {
    const existingBook = await Book.findOne({ where: { isbn: isbn } });
  
    if (existingBook) {
      console.log('A book with the same ISBN already exists:', existingBook.title);
      return; // Ne pas créer de nouveau livre avec le même ISBN
    }

    const newBook = await Book.create({
      title: title,
      author: author,
      summary: desc,
      category: gnr,
      isbn: isbn.toString(),
      suggestedEmail: suggestedEmail,
      librarianId: librarianId,
      validated: validated
    });
    console.log('New book saved on database!');
  },
  pushRating: async function (isbn, userId, rating, review, liked) {
    try {
        await Rating.create({
            isbn: isbn,
            userId: userId,
            rating: rating,
            review: review,
            liked: liked
        });
        console.log('New rating saved in database!');
    } catch (error) {
        console.error('Error saving rating to database:', error);
    }
  },
  Rating,
  Book,
  User,
  sequelize
};

(async () => {
  try {
     await sequelize.authenticate();
     console.log('Connection to the database has been established successfully.');
     await sequelize.sync({ force: false });//mettre true pour que la table soit réinitialisée 
     console.log('User table synced successfully.');
    }catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  })
  ();