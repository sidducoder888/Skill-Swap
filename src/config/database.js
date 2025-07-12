const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'skill_swap_db',
    process.env.DB_USER || 'skill_swap_user',
    process.env.DB_PASSWORD || 'skill_swap_password',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
    }
);

module.exports = sequelize; 