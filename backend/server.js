import express from 'express';
import cookieParser from 'cookie-parser';
import {v2 as cloudinary} from 'cloudinary';

import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import postRoutes from './routes/post.route.js';
import notificationRoutes from './routes/notification.route.js';

import connectDB from './config/db.js';
import { ENV_VARS } from './config/envVars.js';

cloudinary.config({
    cloud_name: ENV_VARS.CLOUDINARY_CLOUD_NAME,
    api_key: ENV_VARS.CLOUDINARY_API_KEY,
    api_secret: ENV_VARS.CLOUDINARY_API_SECRET
})

const app = express();
const PORT = ENV_VARS.PORT;

app.use(express.json({limit:"5mb"})); // to parse req.body as JSON
app.use(express.urlencoded({ extended: true })); // to parse req.body as URL-encoded form data

app.use(cookieParser()); // to parse cookies from req.headers.cookie

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);

app.listen(8080, ()=>{ 
    console.log(`Server is running on port ${PORT}`);
    connectDB();
})