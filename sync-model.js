const sequelize = require("./db/connection"); 

const {ALists , ELists} = require("./db/models/index"); 
sequelize.sync() // creates tables if they don't exist
    .then(() => console.log('Database synced'))
    .catch((err) => console.error(err));

sequelize.authenticate()
    .then(() => console.log('Database connection established successfully!'))
    .catch((err) => console.error('Unable to connect to the database:', err));