import mongoose, { Schema } from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    departmentName: { type: String, required: true },
    manager: { type: Schema.Types.ObjectId, ref: 'User' },
    employees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const Department = mongoose.model('Department', departmentSchema);
export default Department;

/*
 I need to create token model and create token to verify email address of users
 */
