const { Sequelize } = require('sequelize')
const path = require('path')

const sequelize = new Sequelize({
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  storage: path.join(__dirname, '../db.sqlite'),
});

const force = process.env.NODE_ENV !== 'production'

if (force) {
  sequelize.sync({ force }).then(() => {
    console.log("All models were synchronized successfully.");
  })
}

module.exports = {
  sequelize,
}