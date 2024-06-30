import Department from '../models/departmentModel.js';
import User from '../models/userModel.js';

const generateUserId = async (department) => {
  try {
    const departmentInfo = await Department.findOne({
      departmentName: department,
    });

    if (!departmentInfo) {
      return resizeBy.json({
        error: 'Could not find department',
        status: 404,
        success: false,
      });
    }

    const words = department.split(' ');
    const departmentPrefix = `${words[0][0]}${words[1][0]}`.toUpperCase();

    const lastUser = await User.findOne({
      userId: { $regex: `^${departmentPrefix}` },
    }).sort({ createdAt: -1 });

    let userNumber;
    if (!lastUser || lastUser === null) {
      userNumber = 1;
    } else {
      const lastUserId = lastUser.userId;

      const spliting = lastUserId.split('-');
      userNumber = parseInt(spliting[1]) + 1;
    }

    const userId = `${departmentPrefix}-${userNumber
      .toString()
      .padStart(6, '0')}`;

    return userId;
  } catch (error) {
    console.log(error);
  }
};

export { generateUserId };
