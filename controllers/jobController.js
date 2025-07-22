/*
500 Internal Server Error
201 Created
400 Bad Request
200 OK
*/

//======================================================
import { ObjectId } from 'mongodb';
//Create a new job listing
export const createJob = async (req, res) => {
    const db = req.db;
    const jobs = db.collection('jobs');
    try {
        const { title, description, jobType, location, postedBy, salary } = req.body

        //Validate input
        if (!title || !description || !jobType || !location || !postedBy) {
            return res.status(400).json({ 
                success: false, 
                message: "All fields are required" 
            });
        }

        //Create job object
        const newJob = {
            title,
            description,
            //postedBy
            jobType,
            location,
            //default pay to N/A if not provided
            salary: salary || "N/A",
            postedBy: new ObjectId(postedBy), // Convert postedBy to ObjectId
            createdAt: new Date(),
        };

        //Insert job into database
        const result = await jobs.insertOne(newJob);
        //Response
        res.status(201).json({
            success: true,
            message: "Job created successfully",
            job: result.insertedId
        });
    } catch (error) {
        console.error("Error creating job:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: error.message 
        });
    }
};

//======================================================
//Gather all job listings
export const getAllJobs = async (req, res) => {
    const db = req.db;
    const jobs = db.collection('jobBoard');
    try {
        //Fetch all jobs
        const jobList = await jobs.find({}).toArray();
        res.status(200).json({
            success: true,
            jobs: jobList
        });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: error.message 
        });
    }
};
//======================================================
//Get a single job listing by ID
//Access database and fetch job by ID
export const getJobById = async (req, res) => {
    const db = req.db;
    const jobs = db.collection('jobs');

    try {
        const { id } = req.params;

        //Validate ID
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid job ID" 
            });
        }

        //Fetch job by ID using ID as PK
        const job = await jobs.findOne({ 
            _id: new ObjectId(id) 
        });
        //Check if job exists
        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: "Job not found" 
            });
        } 
        return res.status(200).json({
            success: true,
            job
        });
    } catch (error) {
        console.error("Error fetching job:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: error.message 
        });
    }
};  

//======================================================
//Update a job listing by ID
export const updateJob = async (req, res) => {
    const db = req.db;
    const jobs = db.collection('jobs');
    //Access database and update job by ID
    try {
        const { id } = req.params;
        const { title, description, jobType, location, salary } = req.body;

        //Validate ID
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid job ID" 
            });
        }

        //Check if job exists
        const existingJob = await jobs.findOne({ _id: new ObjectId(id) });
        if (!existingJob) {
            return res.status(404).json({ 
                success: false, 
                message: "Job not found" 
            });
        }

        //Update job object
        await jobs.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    title,
                    description,
                    jobType,
                    location,
                    salary: salary || "N/A",
                    updatedAt: new Date()
                }
            } 
        );
        //Check if update was successful
        res.status(200).json({
            success: true,
            message: "Job updated successfully"
        });
    } catch (error) {
        console.error("Error updating job:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: error.message 
        });
    }
};
//======================================================
//Delete a job listing by ID
export const deleteJob = async (req, res) => {
    const db = req.db;
    const jobs = db.collection('jobs');
    //Access database and delete job by ID
    try {
        const { id } = req.params;

        //Validate ID
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid job ID" 
            });
        }

        //Check if job exists
        const existingJob = await jobs.findOne({ _id: new ObjectId(id) });
        if (!existingJob) {
            return res.status(404).json({ 
                success: false, 
                message: "Job not found" 
            });
        }

        //Delete job
        await jobs.deleteOne({ _id: new ObjectId(id) });
        res.status(200).json({
            success: true,
            message: "Job deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting job:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: error.message 
        });
    }
};