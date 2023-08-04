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
      primaryKey: true,
    },
    password: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false
    }
  }, 
{});

module.exports = {
  getUser: async function (email) {
    return await User.findOne({where: { email:email }});
  },
};

(async () => {
  try {
     await sequelize.authenticate();
     console.log('Connection to the database has been established successfully.');
     await sequelize.sync({ force: false });
     console.log('User table synced successfully.');
    }catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  })
  ();

  module.exports = {User ,sequelize};