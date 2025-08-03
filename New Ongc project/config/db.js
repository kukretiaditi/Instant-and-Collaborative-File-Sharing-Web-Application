const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use a MongoDB Atlas free tier connection string or local MongoDB if available
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fileShareApp', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    console.log('Continuing without database connection. Some features may not work.');
    // Don't exit the process to allow the app to run without a database
  }
};

module.exports = connectDB; 