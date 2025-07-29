import express from "express";
import dotenv from 'dotenv';
import {connectToDB} from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";

//Load environment variables

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

//Paerse JSON
app.use(express.json());

// MongoDB connection
connectToDB()
    .then((db) => {       
        console.log("Connected to MongoDB");

        //Add database to app requests
        app.use((req, res, next) => {
            req.db = db;
            next();
        });

        //Use auth routes
        app.use("/", authRoutes);
        //Use job routes
        app.use("/api", jobRoutes);
        //Use auth routes for user management
        app.use("/api/auth", authRoutes);


    
        // Start server
        app.listen(PORT, () => {
            console.log("Server is running on port", {PORT});
        });
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB:", error);
    });