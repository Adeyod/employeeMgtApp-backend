import express from 'express';
import userRoute from './routes/userRoute.js';
import departmentRoute from './routes/departmentRoute.js';
import { DbConfig } from './DbConfig.js';
DbConfig();

const app = express();

const port = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', userRoute);
app.use('/api/departments', departmentRoute);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

/*
WHEN USERS GET TO THE HOMEPAGE, THERE WILL BE A LOGIN BUTTON. WHEN THE USER LOGIN, IF THE USER HAS AN ADMIN ROLE, IT WILL NAVIGATE TO THE ADMIN DASHBOARD AND IF NOT IT WILL GO TO THE USER PROFILE. THE ADMIN DASHBOARD WILL HAVE THE REGISTER BUTTON TO REGISTER NEW USERS
1) User registration: Department manager will fill all the information of the new employee at registration point. I will save the employee, get the ID of the user and save the neccessary departmental information to the department schema. Also i will save the necessary employee information to the employee schema too.
2) Admin 
*/
