const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  job: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job',
    required: true 
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  resume: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'fs.files',
    required: true
  },
  coverLetter: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: [
      'applied',          // Application submitted
      'under_review',     // Application is being reviewed
      'shortlisted',      // Passed initial screening
      'interviewing',     // In interview process
      'reference_check',  // Checking references
      'offer_pending',    // Offer is being prepared
      'offer_extended',   // Offer has been made
      'offer_accepted',   // Offer accepted
      'offer_declined',   // Offer declined
      'rejected',         // Application rejected
      'withdrawn'         // Candidate withdrew
    ],
    default: 'applied'
  },
  source: {
    type: String,
    enum: ['job_board', 'company_website', 'referral', 'recruiter', 'other'],
    default: 'job_board'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'internal'],
      default: 'internal'
    }
  }],
  timeline: [{
    status: String,
    date: {
      type: Date,
      default: Date.now
    },
    description: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  interviewDetails: [{
    type: {
      type: String,
      enum: ['phone', 'video', 'onsite', 'technical', 'hr', 'final', 'other']
    },
    scheduledAt: Date,
    duration: Number, // in minutes
    interviewers: [String],
    location: String,
    notes: String,
    feedback: String,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no_show']
    },
    meetingLink: String
  }],
  offer: {
    position: String,
    salary: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    benefits: [String],
    startDate: Date,
    notes: String,
    expirationDate: Date,
    status: {
      type: String,
      enum: ['draft', 'pending', 'accepted', 'rejected', 'expired', 'withdrawn']
    }
  },
  customFields: mongoose.Schema.Types.Mixed,
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String
  },
  archived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  archivedReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster querying
applicationSchema.index({ user: 1, job: 1 }, { unique: true });
applicationSchema.index({ status: 1 });
applicationSchema.index({ company: 1 });
applicationSchema.index({ 'timeline.date': -1 });
applicationSchema.index({ createdAt: -1 });

// Virtual for application status history
applicationSchema.virtual('statusHistory').get(function() {
  return this.timeline
    .sort((a, b) => b.date - a.date)
    .map(event => ({
      status: event.status,
      date: event.date,
      description: event.description
    }));
});

// Pre-save hook to track status changes
applicationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      description: `Status changed to ${this.status}`,
      metadata: { 
        changedAt: new Date(),
        previousStatus: this.previous('status')
      }
    });
  }
  next();
});

// Static method to get application statistics
applicationSchema.statics.getStats = async function(userId) {
  const stats = await this.aggregate([
    { 
      $match: { 
        user: userId,
        isActive: true 
      } 
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        status: '$_id',
        count: 1
      }
    }
  ]);

  // Convert array to object for easier access
  return stats.reduce((acc, { status, count }) => {
    acc[status] = count;
    return acc;
  }, {});
};

module.exports = mongoose.model("Application", applicationSchema);
