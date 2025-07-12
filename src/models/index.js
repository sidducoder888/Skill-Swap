const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
// Example: db.User = require('./user')(sequelize, Sequelize.DataTypes);

module.exports = db; 