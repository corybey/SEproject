/*
500 Internal Server Error
201 Created
400 Bad Request
200 OK
*/
import express from "express";
import { loginUser, registerUser, getAllUsers } from "../controllers/authController.js";


const router = express.Router();
//Call controller functions directly
//Create routes to register and login users
//Functions not called directly
router.post("/register", async (req, res) => {
    try {
        await registerUser(req, res);
    } catch (error) {
        console.error("Error in registration route:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

//Create login route
router.post("/login", async (req, res) => {
    try {
        await loginUser(req, res);
    } catch (error) {
        console.error("Error in login route:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


//export
export default router;