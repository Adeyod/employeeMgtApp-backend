import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    date: { type: String, required: true },
    status: { type: String, required: true },
  },
  { timestamps: true }
);

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
