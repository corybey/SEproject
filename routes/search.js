const express = require('express');
const router = express.Router();

// Dummy jobs for testing
const dummyJobs = [
  { title: 'Software Developer', description: 'Looking for a React developer' },
  { title: 'UX Designer', description: 'Design job' },
  { title: 'Backend Developer', description: 'Node.js and MongoDB' }
];

// GET /jobs/search?keyword=developer
router.get('/search', (req, res) => {
  const keyword = req.query.keyword?.toLowerCase();

  if (!keyword) {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  const filteredJobs = dummyJobs.filter(job =>
    job.title.toLowerCase().includes(keyword) ||
    job.description.toLowerCase().includes(keyword)
  );

  res.json({ jobs: filteredJobs });
});

module.exports = router;
