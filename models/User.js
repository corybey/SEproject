const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  professionalTitle: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: [{
    title: String,
    company: String,
    location: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String
  }],
  education: [{
    school: String,
    degree: String,
    fieldOfStudy: String,
    startDate: Date,
    endDate: Date,
    description: String
  }],
  resume: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'fs.files' // Reference to GridFS file
  },
  profilePicture: {
    type: String,
    default: ''
  },
  socialLinks: {
    linkedin: String,
    github: String,
    portfolio: String,
    twitter: String
  },
  settings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    jobAlerts: {
      type: Boolean,
      default: true
    },
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'recruiters_only'],
      default: 'public'
    }
  },
  lastLogin: Date,
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'deactivated'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Add text index for search functionality
userSchema.index({
  name: 'text',
  email: 'text',
  'professionalTitle': 'text',
  'skills': 'text',
  'experience.title': 'text',
  'experience.company': 'text',
  'experience.description': 'text',
  'education.school': 'text',
  'education.fieldOfStudy': 'text'
});

module.exports = mongoose.model("User", userSchema);
