import mongoose, { Schema } from 'mongoose';
import { StaffPositions } from '../enums.js';

const employeeSchema = new mongoose.Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    department: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      enum: StaffPositions,
      default: StaffPositions[0],
      required: true,
    },
    salary: { type: Number, required: true },
  },
  { timestamps: true }
);

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
