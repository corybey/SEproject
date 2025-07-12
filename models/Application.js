const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  job_id: { type: String, required: true },
  resume_file_id: { type: mongoose.Schema.Types.ObjectId },
  applied_on: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Application", applicationSchema);
