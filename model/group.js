const { sequelize } = require("./db")
const { DataTypes } = require('sequelize')

const Group = sequelize.define('Group', {
  files: DataTypes.JSON,
  directory: DataTypes.STRING,
});


module.exports = {
  Group,
}
