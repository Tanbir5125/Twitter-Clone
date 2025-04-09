import jwt from 'jsonwebtoken';
import { ENV_VARS } from '../config/envVars.js';

export const generateTokenAndSetCookie = (id, res) => {
    const token = jwt.sign({ id }, ENV_VARS.JWT_SECRET, {
        expiresIn: '15d',
    }); 
    res.cookie('jwt', token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
        httpOnly: true,
        sameSite: 'strict',
        secure: ENV_VARS.NODE_ENV !== 'development',
    });
}