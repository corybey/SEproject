const express = require("express");
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const upload = require("../middleware/upload");
const Application = require("../models/Application");
const User = require("../models/User");
const Job = require("../models/Job");
const Company = require("../models/Company");
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// Validation middleware
const validateApplication = [
  body('job')
    .notEmpty().withMessage('Job ID is required')
    .custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid Job ID'),
  body('coverLetter').optional().isString().withMessage('Cover letter must be a string'),
  body('source').optional().isIn(['job_board', 'company_website', 'referral', 'recruiter', 'other'])
    .withMessage('Invalid application source')
];

const validateApplicationUpdate = [
  body('status').optional().isIn([
    'applied', 'under_review', 'shortlisted', 'interviewing', 
    'reference_check', 'offer_pending', 'offer_extended', 
    'offer_accepted', 'offer_declined', 'rejected', 'withdrawn'
  ]).withMessage('Invalid application status'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('notes').optional().isArray().withMessage('Notes must be an array')
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
      message: 'Duplicate application', 
      field: Object.keys(error.keyPattern)[0] 
    });
  }
  return res.status(500).json({ 
    success: false, 
    message: `Error processing ${resource.toLowerCase()}`,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

// ==================== APPLICATION ROUTES ====================

// Apply for a job with resume upload
router.post(
  "/", 
  auth, 
  upload.single("resume"), 
  validateApplication,
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'Resume file is required' 
        });
      }

      const { job, coverLetter, source = 'job_board' } = req.body;
      const userId = req.user.id;

      // Check if job exists
      const jobExists = await Job.findById(job);
      if (!jobExists) {
        return res.status(404).json({ 
          success: false, 
          message: 'Job not found' 
        });
      }

      // Check if user has already applied to this job
      const existingApplication = await Application.findOne({ 
        user: userId, 
        job: job 
      });

      if (existingApplication) {
        return res.status(400).json({ 
          success: false, 
          message: 'You have already applied to this job' 
        });
      }

      // Create the application
      const application = new Application({
        user: userId,
        job: job,
        company: jobExists.company,
        resume: req.file.id,
        coverLetter,
        source,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          referrer: req.get('Referer')
        }
      });

      // Add to timeline
      application.timeline.push({
        status: 'applied',
        description: 'Application submitted',
        metadata: { 
          resumeId: req.file.id,
          resumeName: req.file.originalname
        }
      });

      await application.save();

      // Update user's applications array
      await User.findByIdAndUpdate(userId, {
        $push: { applications: application._id }
      });

      // Update job's applications array
      await Job.findByIdAndUpdate(job, {
        $push: { applications: application._id },
        $inc: { applicationCount: 1 }
      });

      res.status(201).json({
        success: true,
        data: application
      });
    } catch (error) {
      handleErrors(res, error, 'job application');
    }
  }
);

// Get all applications (with filtering and pagination)
router.get("/", 
  auth,
  [
    query('status').optional().isIn([
      'applied', 'under_review', 'shortlisted', 'interviewing', 
      'reference_check', 'offer_pending', 'offer_extended', 
      'offer_accepted', 'offer_declined', 'rejected', 'withdrawn'
    ]),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('sortBy').optional().isIn(['appliedDate', 'updatedAt', 'status']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  async (req, res) => {
    try {
      // Validate query params
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { 
        status, 
        limit = 10, 
        page = 1, 
        sortBy = 'appliedDate',
        sortOrder = 'desc'
      } = req.query;

      const query = { user: req.user.id };
      
      if (status) {
        query.status = status;
      }

      // Sorting
      const sortOptions = {};
      if (sortBy === 'appliedDate') {
        sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
      } else {
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
      }

      // Pagination
      const skip = (page - 1) * limit;

      const [applications, total] = await Promise.all([
        Application.find(query)
          .populate('job', 'title company location type')
          .populate('company', 'name logo')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        Application.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: applications,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      });
    } catch (error) {
      handleErrors(res, error, 'applications list');
    }
  }
);

// Get application by ID
router.get(
  "/:id",
  auth,
  [
    param('id').isMongoId().withMessage('Invalid application ID')
  ],
  async (req, res) => {
    try {
      const application = await Application.findOne({
        _id: req.params.id,
        $or: [
          { user: req.user.id },
          { 'company.admins': { $in: [req.user.id] } }
        ]
      })
        .populate('user', 'name email phone')
        .populate('job', 'title description requirements')
        .populate('company', 'name logo')
        .populate('resume', 'filename contentType uploadDate')
        .lean();

      if (!application) {
        return res.status(404).json({ 
          success: false, 
          message: 'Application not found or access denied' 
        });
      }

      res.json({
        success: true,
        data: application
      });
    } catch (error) {
      handleErrors(res, error, 'application');
    }
  }
);

// Update application status
router.patch(
  "/:id/status",
  auth,
  checkPermission('update:application'),
  [
    param('id').isMongoId().withMessage('Invalid application ID'),
    body('status').isIn([
      'under_review', 'shortlisted', 'interviewing', 
      'reference_check', 'offer_pending', 'offer_extended', 
      'offer_accepted', 'offer_declined', 'rejected', 'withdrawn'
    ]).withMessage('Invalid status'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { status, notes } = req.body;
      const application = await Application.findById(req.params.id);

      if (!application) {
        return res.status(404).json({ 
          success: false, 
          message: 'Application not found' 
        });
      }

      // Check permissions
      const isAdmin = req.user.roles.includes('admin');
      const isCompanyAdmin = application.company.admins && 
        application.company.admins.includes(req.user.id);
      
      if (!isAdmin && !isCompanyAdmin && application.user.toString() !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to update this application' 
        });
      }

      // Update status and add to timeline
      application.status = status;
      
      if (notes) {
        application.notes.push({
          content: notes,
          createdBy: req.user.id,
          visibility: isAdmin || isCompanyAdmin ? 'internal' : 'public'
        });
      }

      await application.save();

      // TODO: Send notification to the other party
      // e.g., email to candidate or hiring manager

      res.json({
        success: true,
        data: application
      });
    } catch (error) {
      handleErrors(res, error, 'application status update');
    }
  }
);

// Add interview details
router.post(
  "/:id/interviews",
  auth,
  checkPermission('update:application'),
  [
    param('id').isMongoId().withMessage('Invalid application ID'),
    body('type').isIn(['phone', 'video', 'onsite', 'technical', 'hr', 'final', 'other'])
      .withMessage('Invalid interview type'),
    body('scheduledAt').isISO8601().withMessage('Invalid date format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const application = await Application.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            interviewDetails: {
              ...req.body,
              scheduledBy: req.user.id
            }
          },
          $set: { status: 'interviewing' }
        },
        { new: true, runValidators: true }
      );

      if (!application) {
        return res.status(404).json({ 
          success: false, 
          message: 'Application not found' 
        });
      }

      // Add to timeline
      application.timeline.push({
        status: 'interviewing',
        description: `Interview scheduled: ${req.body.type}`,
        metadata: {
          interviewType: req.body.type,
          scheduledAt: req.body.scheduledAt
        }
      });

      await application.save();

      // TODO: Send calendar invite and notification

      res.status(201).json({
        success: true,
        data: application.interviewDetails[application.interviewDetails.length - 1]
      });
    } catch (error) {
      handleErrors(res, error, 'interview scheduling');
    }
  }
);

// Get application statistics
router.get("/stats/overview", auth, async (req, res) => {
  try {
    const stats = await Application.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      {
        $facet: {
          statusCounts: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          monthlyApplications: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $limit: 6 }
          ],
          topCompanies: [
            {
              $lookup: {
                from: 'companies',
                localField: 'company',
                foreignField: '_id',
                as: 'companyInfo'
              }
            },
            { $unwind: '$companyInfo' },
            {
              $group: {
                _id: '$company',
                name: { $first: '$companyInfo.name' },
                logo: { $first: '$companyInfo.logo' },
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    // Format the response
    const result = {
      statusCounts: stats[0].statusCounts.reduce((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      }, {}),
      monthlyApplications: stats[0].monthlyApplications.map(item => ({
        year: item._id.year,
        month: item._id.month,
        count: item.count
      })),
      topCompanies: stats[0].topCompanies
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    handleErrors(res, error, 'application statistics');
  }
});

// Upload additional documents for an application
router.post(
  "/:id/documents",
  auth,
  upload.array('documents', 5), // Max 5 files
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No files uploaded' 
        });
      }

      const application = await Application.findById(req.params.id);
      
      if (!application) {
        return res.status(404).json({ 
          success: false, 
          message: 'Application not found' 
        });
      }

      // Check permissions
      if (application.user.toString() !== req.user.id && 
          !req.user.roles.includes('admin') && 
          !application.company.admins?.includes(req.user.id)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to update this application' 
        });
      }

      // Add document references to application
      const documents = req.files.map(file => ({
        fileId: file.id,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        uploadedBy: req.user.id,
        uploadedAt: new Date()
      }));

      application.documents = application.documents || [];
      application.documents.push(...documents);
      
      // Add to timeline
      application.timeline.push({
        status: application.status,
        description: `${documents.length} document(s) uploaded`,
        metadata: {
          documentCount: documents.length,
          documentNames: documents.map(doc => doc.name)
        }
      });

      await application.save();

      res.status(201).json({
        success: true,
        data: documents
      });
    } catch (error) {
      handleErrors(res, error, 'document upload');
    }
  }
);

module.exports = router;
