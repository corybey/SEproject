const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Company = require("../models/Company");

// User CRUD
router.post("/user", async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
});

router.get("/user/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});

router.put("/user/:id", async (req, res) => {
  const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete("/user/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

// Company CRUD
router.post("/company", async (req, res) => {
  const company = await Company.create(req.body);
  res.status(201).json(company);
});

router.get("/company/:id", async (req, res) => {
  const company = await Company.findById(req.params.id);
  res.json(company);
});

router.put("/company/:id", async (req, res) => {
  const updated = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete("/company/:id", async (req, res) => {
  await Company.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

module.exports = router;
