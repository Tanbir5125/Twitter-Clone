import express from 'express';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import { ENV_VARS } from './config/envVars.js';

import authRoutes from './routes/auth.route.js';


const app = express();
const PORT = ENV_VARS.PORT;

app.use(express.json()); // to parse req.body as JSON
app.use(express.urlencoded({ extended: true })); // to parse req.body as URL-encoded form data

app.use(cookieParser()); // to parse cookies from req.headers.cookie

app.use("/api/auth", authRoutes);

app.listen(8080, ()=>{
    console.log(`Server is running on port ${PORT}`);
    connectDB();
})