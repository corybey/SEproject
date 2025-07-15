const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Job = require('./models/job'); // Adjust if needed based on your file structure

dotenv.config(); // Load .env variables

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ Connected to MongoDB');

  // Sample jobs
  const jobs = [
    {
      title: 'Frontend Developer',
      description: 'React developer needed for startup',
      company: 'TechNova',
      location: 'Remote',
      salary: '$70k - $90k'
    },
    {
      title: 'Backend Developer',
      description: 'Node.js and MongoDB experience required',
      company: 'CodeLabs',
      location: 'New York, NY',
      salary: '$80k - $100k'
    },
    {
      title: 'Full Stack Engineer',
      description: 'Work on both client and server-side code',
      company: 'Innovatech',
      location: 'San Francisco, CA',
      salary: '$95k - $120k'
    }
  ];

  // Clear existing jobs and insert new ones
  await Job.deleteMany({});
  await Job.insertMany(jobs);
  console.log('✅ Sample jobs inserted');
  process.exit();
}).catch(err => {
  console.error('❌ Error connecting to MongoDB:', err.message);
});

