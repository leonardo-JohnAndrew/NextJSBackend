require('dotenv').config();
const mysql2 = require('mysql2'); // ensure mysql2 is loaded for Sequelize
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,    
        dialect: 'mysql',
        timezone: "+08:00", 
        dialectModule : mysql2, 
        logging: false, // disable logging, set to console.log to see SQL queries
    }
)

module.exports = sequelize; // export instance directly