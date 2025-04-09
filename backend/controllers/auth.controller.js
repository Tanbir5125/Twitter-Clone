import { generateTokenAndSetCookie } from "../utils/generateToken.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

/**
 * User signup controller
 * Handles new user registration with input validation and password hashing
 */
export const signup = async (req, res) => {
    try {
        // Extract user data from request body
        const { fullName, username, email, password } = req.body;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // Check if username is already taken
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username is already taken" });
        }

        // Check if email is already registered
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: "Email is already taken" });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }

        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user instance
        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword,
        });

        if (newUser) {
            // Generate JWT token and set cookie
            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save();

            // Return new user data without password
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                followers: newUser.followers,
                following: newUser.following,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg,
            });
        } else {
            res.status(400).json({ error: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * User login controller
 * Authenticates user credentials and generates JWT token
 */
export const login = async (req, res) => {
    try {
        // Extract login credentials
        const { username, password } = req.body;
        
        // Find user and verify password
        const user = await User.findOne({ username });
        const isPasswordValid = await bcrypt.compare(password, user?.password || "");

        if (!user || !isPasswordValid) {
            return res.status(401).json({ error: "Invalid Credentials" });
        }

        // Generate JWT token and set cookie
        generateTokenAndSetCookie(user._id, res);
 
        // Return user data without password
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg,
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * User logout controller
 * Clears the JWT cookie
 */
export const logout = async (req, res) => {
    try {
        res.clearCookie("jwt");
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Get current user controller
 * Returns the authenticated user's data
 */
export const getMe = async (req, res) => {
    try {
        // Find user by ID and exclude password from response
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getMe controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}