import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import User from '../models/userModel.js';
import Employee from '../models/employeeModel.js';
import Department from '../models/departmentModel.js';
import { roles } from '../enums.js';
import { sendMessageToQueue } from '../utils/aws/awsSqs.js';
import { generateUserId } from '../utils/middleware.js';
import { verifyEmail } from '../utils/nodemailer.js';
import Token from '../models/tokenModel.js';

const forbiddenCharsRegex = /[|!{}()&=[\]===><>]/;

const token = () => {
  const getToken =
    crypto.randomBytes(32).toString('hex') +
    crypto.randomBytes(32).toString('hex');
  return getToken;
};

const validateInput = (input) => {
  const regex =
    /^(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[A-Z]{2}-\d{6}|[a-zA-Z0-9._ -]+)$/;
  return regex.test(input);
};

const regUser = async (req, res) => {
  const user = req.user;

  try {
    const {
      username,
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      phoneNumber,
      address,
      dateOfBirth,
      role,
      position,
      salary,
      department,
    } = req.body;

    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !address ||
      !dateOfBirth ||
      !role ||
      !department ||
      !salary
    ) {
      return res.json({
        error: 'All fields are required',
        status: 400,
        success: false,
      });
    }

    // return res.json(position);

    const trimmedUsername = username.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedAddress = address.trim();
    const trimmedEmail = email.trim();

    if (forbiddenCharsRegex.test(trimmedUsername)) {
      return res.json({
        error: 'Forbidden character in field username',
        status: 403,
        success: false,
      });
    }

    if (forbiddenCharsRegex.test(trimmedFirstName)) {
      return res.json({
        error: 'Forbidden character in field first name',
        status: 403,
        success: false,
      });
    }

    if (forbiddenCharsRegex.test(trimmedLastName)) {
      return res.json({
        error: 'Forbidden character in field last name',
        success: false,
        status: 403,
      });
    }

    if (forbiddenCharsRegex.test(trimmedAddress)) {
      return res.json({
        error: 'Forbidden character in field address',
        status: 403,
        success: false,
      });
    }

    // check the email field to prevent input of unwanted characters
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.json({
        message: 'Invalid input for email...',
        status: 403,
        success: false,
      });
    }

    // strong password check
    if (
      !/^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,20}$/.test(
        password
      )
    ) {
      return res.json({
        message:
          'Password must contain at least 1 special character, 1 lowercase letter, and 1 uppercase letter. Also it must be minimum of 8 characters and maximum of 20 characters',
        success: false,
        status: 401,
      });
    }

    if (password !== confirmPassword) {
      return response.json({
        error: 'Password do not match',
        status: 401,
        success: false,
      });
    }

    const userExist = await User.findOne({
      $or: [
        {
          email: trimmedEmail,
        },
        { username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') } },
      ],
    });

    if (userExist) {
      return res.json({
        error: 'User already exists',
        success: false,
        status: 400,
      });
    }

    const userId = await generateUserId(department);

    const hashedPassword = await bcrypt.hash(password, 10);

    // then i can create new user. Save the user into user and save part of his info into employee and department
    // then i can send email verification link to the email address of the user

    if (role === 'Employee') {
      // const checkManager = await Department.findOne({
      //   manager: user._id,
      // });

      // if (!checkManager) {
      //   return res.json({
      //     error: 'You are not the department manager',
      //     status: 403,
      //     success: false,
      //   });
      // }

      const newUser = await new User({
        username,
        userId,
        email: trimmedEmail,
        password: hashedPassword,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        phoneNumber,
        address: trimmedAddress,
        dateOfBirth,
        role,
      }).save();

      // push the employee into the department array
      const newEmployee = await new Employee({
        user: newUser._id,
        department,
        position: position,
        salary: salary,
      }).save();

      // update the department document
      const updateDepartment = await Department.findOneAndUpdate(
        {
          departmentName: department,
        },
        {
          $push: { employees: newUser._id },
        },
        {
          new: true,
        }
      );

      const genToken = token();
      const link = `${process.env.FRONTEND_URL}/email-verification?userId=${newUser._id}&token=${genToken}`;

      const newToken = await new Token({
        userId: newUser._id,
        token: genToken,
      }).save();

      // const addToQueue = await sendMessageToQueue({
      //   userId: newUser._id,
      //   link: link,
      //   email: email,
      //   firstName: firstName,
      //   messageTitle: 'Email verification',
      // });

      const verifyUser = await verifyEmail({ email, firstName, link });

      if (verifyUser.response.includes('OK')) {
        console.log(verifyUser);
        console.log('Mail delivered successfully');
        return res.json({
          message: 'Please verify your email address',
          status: 201,
          success: true,
        });
      }
    } else if (role === 'Department Manager') {
      const managerAlreadyExist = await Department.findOne({
        departmentName: department,
      });

      if (
        managerAlreadyExist.manager !== null ||
        managerAlreadyExist.manager !== undefined
      ) {
        return res.json({
          error: 'This department already has a manager',
          status: 400,
          success: false,
        });
      }

      const newUser = await new User({
        username,
        userId,
        email: trimmedEmail,
        password: hashedPassword,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        phoneNumber,
        address: trimmedAddress,
        dateOfBirth,
        role,
        managedDepartment: department,
      }).save();

      // push the employee into the department array
      const newEmployee = await new Employee({
        user: newUser._id,
        department,
        position: position,
        salary: salary,
      }).save();

      // update the department document
      const updateDepartment = await Department.findOneAndUpdate(
        {
          departmentName: department,
        },
        {
          $set: { manager: newUser._id },
        },
        {
          $push: { employees: newUser._id },
        },
        {
          new: true,
        }
      );

      // send email verification to the new employee
      /*
    verification link, first name, username and password
    Please click the link below to verify your email. then after the verification, login details of the employee will be sent to him
    */

      const genToken = token();
      const link = `${process.env.FRONTEND_URL}/email-verification?userId=${newUser._id}&token=${genToken}`;

      const newToken = await new Token({
        userId: newUser._id,
        token: genToken,
      }).save();

      // const addToQueue = await sendMessageToQueue({
      //   userId: newUser._id,
      //   link: link,
      //   email: email,
      //   firstName: firstName,
      //   messageTitle: 'Email verification',
      // });

      const verifyUser = await verifyEmail({ email, firstName, link });

      if (verifyUser.response.includes('OK')) {
        console.log(verifyUser);
        console.log('Mail delivered successfully');
        return res.json({
          message: 'Please verify your email address',
          status: 201,
          success: true,
        });
      }
    } else if (role === 'Super Admin') {
      const newUser = await new User({
        username,
        userId,
        email: trimmedEmail,
        password: hashedPassword,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        phoneNumber,
        address: trimmedAddress,
        dateOfBirth,
        role,
      }).save();

      // push the employee into the department array
      const newEmployee = await new Employee({
        user: newUser._id,
        department,
        position: position,
        salary: salary,
      }).save();

      // update the department document
      const updateDepartment = await Department.findOneAndUpdate(
        {
          departmentName: department,
        },
        {
          $push: { employees: newUser._id },
        },
        {
          new: true,
        }
      );

      // send email verification to the new employee
      /*
    verification link, first name, username and password
    Please click the link below to verify your email. then after the verification, login details of the employee will be sent to him
    */

      const genToken = token();
      const link = `${process.env.FRONTEND_URL}/email-verification?userId=${newUser._id}&token=${genToken}`;

      const newToken = await new Token({
        userId: newUser._id,
        token: genToken,
      }).save();

      // const addToQueue = await sendMessageToQueue({
      //   userId: newUser._id,
      //   link: link,
      //   email: email,
      //   firstName: firstName,
      //   messageTitle: 'Email verification',
      // });

      const verifyUser = await verifyEmail({ email, firstName, link });

      if (verifyUser.response.includes('OK')) {
        console.log(verifyUser);
        console.log('Mail delivered successfully');
        return res.json({
          message: 'Please verify your email address',
          status: 201,
          success: true,
        });
      }
    }
  } catch (error) {
    return res.json({
      error: error.message,
      success: false,
      status: 500,
      message: 'Something happened',
    });
  }
};

const emailVerification = async (req, res) => {
  try {
    const { userId, token } = req.params;

    const userToken = await Token.findOne({
      userId,
      token,
    });

    if (!userToken) {
      return res.json({
        error: 'Token not found',
        success: false,
        status: 404,
      });
    }

    const user = await User.findOneAndUpdate(
      { _id: userToken.userId },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.json({
        error: 'Unable to verify user',
        success: false,
        status: 400,
      });
    } else {
      userToken.deleteOne();
      return res.json({
        message: `${user.firstName}, your email address has been verified successfully, you can now login`,
        success: true,
        status: 200,
      });
    }
  } catch (error) {
    return res.json({
      error: error.message,
      success: false,
      status: 500,
      message: 'Something happened',
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { userInput, password } = req.body;

    if (!userInput || !password) {
      return res.json({
        error: 'All fields are required',
        success: false,
        status: 400,
      });
    }

    const trimmedUserInput = userInput.trim();

    if (!validateInput(trimmedUserInput)) {
      return res.json({
        error: 'Invalid character',
        success: false,
        status: 400,
      });
    }

    const regex = new RegExp(`^${trimmedUserInput}$`, 'i');

    const findUser = await User.findOne({
      $or: [
        { userId: trimmedUserInput },
        { email: trimmedUserInput },
        { username: regex },
      ],
    });

    return res.json({
      findUser,
    });
  } catch (error) {
    return res.json({
      error: error.message,
      success: false,
      status: 500,
      message: 'Something happened',
    });
  }
};

const regAdmin = async (req, res) => {
  try {
  } catch (error) {
    return res.json({
      error: error.message,
      success: false,
      status: 500,
      message: 'Something happened',
    });
  }
};

// const regUser = async (req, res) => {
//   try {
//   } catch (error) {
//     return res.json({
//       error: error.message,
//       success: false,
//       status: 500,
//       message: 'Something happened',
//     });
//   }
// };

const regSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await User.findOne({
      $and: [{ role: 'Super Admin' }, { email: 'ayodejiadebolu@gmail.com' }],
    });

    if (existingSuperAdmin) {
      console.log('Super Admin already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash(
      process.env.SUPER_ADMIN_PASSWORD,
      10
    );

    const userId = 'SA001';

    const superAdmin = await new User({
      username: process.env.SUPER_ADMIN_USERNAME,
      email: process.env.SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      firstName: process.env.SUPER_ADMIN_FIRST_NAME,
      lastName: process.env.SUPER_ADMIN_LAST_NAME,
      phoneNumber: process.env.SUPER_ADMIN_PHONE_NUMBER,
      address: process.env.SUPER_ADMIN_ADDRESS,
      dateOfBirth: process.env.SUPER_ADMIN_DATE_OF_BIRTH,
      role: process.env.SUPER_ADMIN_ROLE,
      userId,
    }).save();

    if (superAdmin) {
      console.log('Super Admin created');
      return;
    }
  } catch (error) {
    console.log(error.message);
  }
};

setImmediate(() => {
  regSuperAdmin();
});

export { regUser, emailVerification, loginUser, regAdmin };
