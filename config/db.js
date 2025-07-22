//Mongo connection helper
import { MongoClient } from "mongodb";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

//Use local Mongo
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "JobBoardApp";

//Empty DB
let db = null;

//Connect once and reuse
export const connectToDB = async () => {
    if (db) return db; // Return existing connection
    try {
        const client = await MongoClient.connect(MONGO_URI);
        //Start connection
        db = client.db(DB_NAME);
        console.log("Connecting to MongoDB");
        return db;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
};