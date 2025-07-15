const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// GET /jobs/search?keyword=developer&location=Remote&company=TechNova
router.get('/search', async (req, res) => {
  const { keyword, location, company } = req.query;

  const query = {};

  // Search by keyword in title or description
  if (keyword) {
    query.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } }
    ];
  }

  // Optional: Filter by location
  if (location) {
    query.location = { $regex: location, $options: 'i' };
  }

  // Optional: Filter by company
  if (company) {
    query.company = { $regex: company, $options: 'i' };
  }

  try {
    const jobs = await Job.find(query);
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
