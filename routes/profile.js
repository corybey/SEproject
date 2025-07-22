const express = require("express");
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require("../models/User");
const Company = require("../models/Company");
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// Validation middleware
const validateUser = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('location').optional().isObject().withMessage('Location must be an object'),
  body('skills').optional().isArray().withMessage('Skills must be an array')
];

const validateCompany = [
  body('name').trim().notEmpty().withMessage('Company name is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('website').optional().isURL().withMessage('Please provide a valid URL'),
  body('industry').isArray({ min: 1 }).withMessage('At least one industry is required'),
  body('companySize').isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+'])
    .withMessage('Invalid company size')
];

// Helper function to handle errors
const handleErrors = (res, error, resource = 'Resource') => {
  console.error(error);
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation Error', 
      errors: error.errors 
    });
  } else if (error.code === 11000) {
    return res.status(400).json({ 
      success: false, 
      message: 'Duplicate key error', 
      field: Object.keys(error.keyPattern)[0] 
    });
  }
  return res.status(500).json({ 
    success: false, 
    message: `Error processing ${resource.toLowerCase()}` 
  });
};

// ==================== USER PROFILE ROUTES ====================

// Create a new user profile
router.post("/user", validateUser, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already in use' 
      });
    }

    const user = new User(req.body);
    await user.save();
    
    // Remove sensitive data before sending response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    handleErrors(res, error, 'user profile');
  }
});

// Get user profile by ID
router.get("/user/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password') // Exclude password from response
      .populate('resume', 'filename contentType uploadDate');
      
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    handleErrors(res, error, 'user profile');
  }
});

// Update user profile
router.put("/user/:id", auth, checkPermission('update:profile'), validateUser, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Don't allow updating email through this endpoint
    if (req.body.email) {
      delete req.body.email;
    }
    
    // Don't allow updating password through this endpoint
    if (req.body.password) {
      delete req.body.password;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: updatedUser 
    });
  } catch (error) {
    handleErrors(res, error, 'user profile');
  }
});

// Delete user profile
router.delete("/user/:id", auth, checkPermission('delete:profile'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // TODO: Clean up associated data (applications, files, etc.)
    
    res.status(204).send();
  } catch (error) {
    handleErrors(res, error, 'user profile');
  }
});

// ==================== COMPANY PROFILE ROUTES ====================

// Create a new company profile
router.post("/company", auth, checkPermission('create:company'), validateCompany, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const existingCompany = await Company.findOne({ name: req.body.name });
    if (existingCompany) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company with this name already exists' 
      });
    }

    const company = new Company({
      ...req.body,
      createdBy: req.user.id
    });
    
    await company.save();
    
    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    handleErrors(res, error, 'company profile');
  }
});

// Get company profile by ID
router.get("/company/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('openPositions', 'title location type')
      .populate('verification.verifiedBy', 'name email');
      
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: company 
    });
  } catch (error) {
    handleErrors(res, error, 'company profile');
  }
});

// Update company profile
router.put("/company/:id", auth, checkPermission('update:company'), validateCompany, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!updatedCompany) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: updatedCompany 
    });
  } catch (error) {
    handleErrors(res, error, 'company profile');
  }
});

// Delete company profile
router.delete("/company/:id", auth, checkPermission('delete:company'), async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }
    
    // TODO: Clean up associated data (jobs, applications, etc.)
    
    res.status(204).send();
  } catch (error) {
    handleErrors(res, error, 'company profile');
  }
});

// ==================== SEARCH AND LISTING ROUTES ====================

// Search users
router.get("/users/search", async (req, res) => {
  try {
    const { q, skills, location } = req.query;
    const query = {};
    
    if (q) {
      query.$text = { $search: q };
    }
    
    if (skills) {
      query.skills = { $all: skills.split(',').map(skill => skill.trim()) };
    }
    
    if (location) {
      query['location.city'] = new RegExp(location, 'i');
    }
    
    const users = await User.find(query)
      .select('name email professionalTitle skills location')
      .limit(20);
      
    res.json({ 
      success: true, 
      count: users.length,
      data: users 
    });
  } catch (error) {
    handleErrors(res, error, 'user search');
  }
});

// Search companies
router.get("/companies/search", async (req, res) => {
  try {
    const { q, industry, location } = req.query;
    const query = { status: 'active' };
    
    if (q) {
      query.$text = { $search: q };
    }
    
    if (industry) {
      query.industry = { $in: industry.split(',').map(i => i.trim()) };
    }
    
    if (location) {
      query['headquarters.city'] = new RegExp(location, 'i');
    }
    
    const companies = await Company.find(query)
      .select('name description industry headquarters companySize')
      .limit(20);
      
    res.json({ 
      success: true, 
      count: companies.length,
      data: companies 
    });
  } catch (error) {
    handleErrors(res, error, 'company search');
  }
});

module.exports = router;
