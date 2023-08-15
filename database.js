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
  rentDuration: {
    type: Sequelize.DataTypes.INTEGER,
    allowNull: true
  }
}, 
{});



module.exports = {
  getUser: async function (email) {
    return await User.findOne({where: { email: email }});
  },
  pushBook: async function (title, author, desc, gnr, suggestedEmail, validated = false) {
    const newBook = await Book.create({ title: title, author: author, summary: desc, category: gnr, suggestedEmail: suggestedEmail, validated: validated });
    console.log('New book saved on database!');
},
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