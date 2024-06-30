import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const DbConfig = () => {
  mongoose.connect(process.env.MONGODB_URL);
  mongoose.connection.on('connected', () => {
    console.log(
      `MongoDB Connected successfully to ${mongoose.connection.host}`
    );
  });
  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB Connection Error');
    process.exit(1);
  });
};
