import Department from '../models/departmentModel.js';

const createDepartment = async (req, res) => {
  try {
    console.log('object');
    const { departmentName, manager } = req.body;

    console.log(req.body);
    if (!departmentName) {
      return res.json({
        error: 'Please provide the department name',
        status: 400,
        success: false,
      });
    }

    const isExisting = await Department.findOne({ departmentName });
    if (isExisting) {
      return res.json({
        error: 'This department already exists',
        status: 400,
        success: false,
      });
    }

    const newDepartment = await new Department({
      departmentName,
      manager: manager && manager,
    }).save();

    if (!newDepartment) {
      return res.json({
        error: 'Unable to create department',
        status: 400,
        success: false,
      });
    } else {
      return res.json({
        message: 'Department created successfully',
        status: 200,
        success: true,
        department: newDepartment,
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

// const createDepartment = async (req, res) => {
//   try {
//   } catch (error) {
//     return res.json({
//       error: error.message,
//       success: false,
//       status: 500,
//       message: 'Something happened'
//     });

//   }
// };

// const createDepartment = async (req, res) => {
//   try {
//   } catch (error) {
//     return res.json({
//       error: error.message,
//       success: false,
//       status: 500,
//       message: 'Something happened'
//     });

//   }

// };

// const createDepartment = async (req, res) => {
//   try {
//   } catch (error) {
//     return res.json({
//       error: error.message,
//       success: false,
//       status: 500,
//       message: 'Something happened'
//     });

//   }
// };

export { createDepartment };
