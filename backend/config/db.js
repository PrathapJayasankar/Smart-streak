const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = async () => {
      try {
          await mongoose.connect(process.env.MONGO_URI, {
              // The useNewUrlParser and useUnifiedTopology options are deprecated in Mongoose 6.x+
              // but are harmless to include for broader compatibility.
              // For Mongoose 6.x+, these are the defaults.
              useNewUrlParser: true,
              useUnifiedTopology: true,
          });
          console.log('MongoDB Connected...');
      } catch (err) {
          console.error(err.message);
          process.exit(1); // Exit process with failure
      }
  };

  module.exports = connectDB;
  