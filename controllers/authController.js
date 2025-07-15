//Import User model and generate jwt
import User from "../models/user.js";
import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

//Generate a JWT token for the user
const generateToken = (user) => {
    //Create token with user details
    return jwt.sign(
        { id: user._id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

//====================================================
//Register a new user

export const registerUser = async (req, res) => {
    try {
        const { username, email, password, roleID } = req.body;

        //Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            //bad request
            return res.status(400).json({ message: "User already exists" });
        }

        //Create new user
        const newUser = new User({ username, email, password, roleID });
        await newUser.save();

        //Generate token
        const token = generateToken(newUser);

        //201 for when api creates a resource
        res.status(201).json({ 
            message: "User registered successfully", token,
        success: true,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                roleID: newUser.roleID
            }
        });
    } catch (error) {
        console.error("Error registering user:", error);
        //server related error
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

//====================================================
//Login user

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        //Find user by email and flag t/f
        const user = await User.findOne({ email });
        if (!user) {
            //bad request
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        //Now compare user password and flag t/f
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            //bad request
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        //Generate token
        const token = generateToken(user);
        //Return user info and token
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                roleID: user.roleID
            }
        });
        //otherwise return error
    } catch (error) {
        console.error("Error logging in user:", error);
        //server related error
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
