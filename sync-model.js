const sequelize = require("./db/connection"); 

const {Extracted} = require("./db/models/index"); 
sequelize.sync({ alter: true }) // creates tables if they don't exist
    .then(() => console.log('Database synced'))
    .catch((err) => console.error(err));

sequelize.authenticate()
    .then(() => console.log('Database connection established successfully!'))
    .catch((err) => console.error('Unable to connect to the database:', err));