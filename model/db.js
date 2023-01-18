const { Sequelize } = require('sequelize')
const path = require('path')

const sequelize = new Sequelize({
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  query: { raw: true },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  storage: path.join(__dirname, '../db.sqlite'),
});

// const alter = process.env.NODE_ENV === 'development'

// sequelize.sync({ alter }).then(() => {
//   console.log("All models were synchronized successfully.");
// })

module.exports = {
  sequelize,
}