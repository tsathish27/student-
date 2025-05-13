const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30s
      socketTimeoutMS: 45000,
      family: 4,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('MongoDB connected successfully to:', conn.connection.host);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.log('Please make sure:');
    console.log('1. Your IP is whitelisted in MongoDB Atlas');
    console.log('2. Your internet connection is stable');
    console.log('3. The database server is running');
    process.exit(1);
  }
};

module.exports = connectDB;