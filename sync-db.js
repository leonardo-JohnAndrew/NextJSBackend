const  sequelize  = require('./db/connection');
// const User  = require('./db/models/index');
// // import models to sync with db 
// const SMS = require('./db/models/index');
const {User , SMS , Purchase , PurchaseItems , Comport ,Extract} = require ("./db/models/index")
sequelize.sync({ alter: true }) // creates tables if they don't exist
  .then(() => console.log('Database synced'))
  .catch((err) => console.error(err)); 

sequelize.authenticate()
  .then(() => console.log('Database connection established successfully!'))
  .catch((err) => console.error('Unable to connect to the database:', err)); 


  