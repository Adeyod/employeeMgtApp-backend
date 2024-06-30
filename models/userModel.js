import mongoose, { Schema } from 'mongoose';
import { roles } from '../enums.js';

const userImage = {
  url: String,
  signature: String,
  accessId: String,
  publicId: String,
};

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    profileImage: userImage,
    phoneNumber: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    isUpdated: { type: Boolean, default: false },
    address: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    role: {
      type: String,
      enum: roles,
      default: roles[4],
    },
    managedDepartment: { type: String },

    /*
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    position: { type: String, required: true },
    salary: { type: Number, required: true },
    joiningDate: { type: String, required: true },
    activeEmployee: { type: Boolean, required: true },
    */
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
