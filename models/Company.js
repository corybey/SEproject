const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  industry: { type: String }
});

module.exports = mongoose.model("Company", companySchema);
