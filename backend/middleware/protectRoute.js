import { ENV_VARS } from "../config/envVars.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies["jwt"];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No Token Provided" });
        }

        const decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);

        if(!decoded) {
            return res.status(401).json({ error: "Unauthorized: Invalid Token" });
        }

        const user = await User.findById(decoded.id).select("-password");

        if(!user){
            return res.status(401).json({ error: "User not found" });
        }

        req.user = user;
        
        next();

    } catch (error) {
        console.log("Error in protect route middleware", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}