import express from "express";
import { MongoClient } from "mongodb";
//import authRouthes from "./routes/authRoutes.js";
// Importing dotenv for environment variable management
import dotenv from 'dotenv';

dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;
const url = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "JobBoardApp";

// MongoDB connection
//Mark parser and toplogy true to avoid deprecation warnings
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log("Connected to MongoDB");

        //store database with appLocal 
        const db = client.db(dbName);
        app.locals.db = db;

        app.get("/home", (req, res) => {
            res.send("Welcome to the Job Board App");
            console.log("Home route accessed");
        });
        // Start server
        app.listen(PORT, () => {
            console.log("Server is running on port", {PORT});
        });
    })