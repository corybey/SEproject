//Import everything we need
import express from 'express';
import {  
    createJob,
    getAllJobs,
    getJobById, 
    updateJob, 
    deleteJob 
} from '../controllers/jobController';

//Create a router instance
const router = express.Router();

/*Routes for postman
Passing route functions directly 
so no need for async/await here
*/
router.post('/jobs', createJob);
router.get('/jobs', getAllJobs);
router.get('/jobs/:id', getJobById);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);

export default router;