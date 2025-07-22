const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\//, 'Please use a valid URL with HTTP/HTTPS']
  },
  industry: { 
    type: [String],
    required: true,
    index: true
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+'],
    required: true
  },
  foundedYear: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear()
  },
  headquarters: {
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  contact: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
    },
    phone: String,
    firstName: String,
    lastName: String,
    position: String
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String,
    github: String
  },
  benefits: [{
    type: String,
    trim: true
  }],
  techStack: [{
    type: String,
    trim: true
  }],
  companyType: {
    type: String,
    enum: ['Public', 'Private', 'Nonprofit', 'Government', 'Startup', 'Enterprise', 'Agency', 'Education'],
    required: true
  },
  fundingRounds: [{
    round: String,
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    date: Date,
    investors: [String]
  }],
  companyCulture: {
    type: Map,
    of: String
  },
  isHiring: {
    type: Boolean,
    default: false
  },
  openPositions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  applicationProcess: {
    type: String,
    enum: ['Direct Application', 'Agency', 'Referral Required', 'Other'],
    default: 'Direct Application'
  },
  hiringManager: {
    name: String,
    email: String,
    phone: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationDocuments: [{
      type: String // URLs to verification documents
    }]
  }
}, {
  timestamps: true
});

// Add text index for search functionality
companySchema.index({
  name: 'text',
  description: 'text',
  industry: 'text',
  'headquarters.city': 'text',
  'headquarters.country': 'text',
  'contact.position': 'text',
  'techStack': 'text',
  'companyCulture': 'text'
});

// Virtual for company's full address
companySchema.virtual('fullAddress').get(function() {
  return `${this.headquarters.address || ''}, ${this.headquarters.city || ''}, ${this.headquarters.state || ''} ${this.headquarters.postalCode || ''}, ${this.headquarters.country || ''}`.replace(/\s*,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '');
});

// Virtual for company's primary contact name
companySchema.virtual('primaryContact').get(function() {
  return this.contact.firstName && this.contact.lastName 
    ? `${this.contact.firstName} ${this.contact.lastName}`
    : this.contact.email;
});

module.exports = mongoose.model("Company", companySchema);
