const { sequelize } = require("./db")
const { DataTypes } = require('sequelize')

const Group = sequelize.define('Group', {
  originalnames: DataTypes.JSON,
  names: DataTypes.JSON,
  directory: DataTypes.STRING,
});


module.exports = {
  Group,
}
