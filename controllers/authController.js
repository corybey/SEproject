/*
500 Internal Server Error
201 Created
400 Bad Request
200 OK
*/
//Import bcrypt and generate jwt
import bcrypt from "bcryptjs";
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
    //Access database
    const db = req.db;
    const users = db.collection('users');
    try {
        const { username, email, password, roleID } = req.body;

        //Check if user already exists
        const existingUser = await users.findOne({ email });
        if (existingUser) {
            //bad request
            return res.status(400).json({ message: "User already exists" });
        }
        //Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //Create new user
        const newUser = ({ username, 
            email, 
            password: hashedPassword, 
            roleID 
        });
        users.insertOne(newUser);
        

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
    //Access database
    const db = req.db;  
    const users = db.collection('users');
    try {
        const { email, password } = req.body;

        //Find user by email and flag t/f
        const user = await users.findOne({ email });
        if (!user) {
            //bad request
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        //Now compare user password and flag t/f
        const isMatch = await bcrypt.compare(password,user.password);
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
