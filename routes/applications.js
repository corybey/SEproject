const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const Application = require("../models/Application");

router.post("/apply", upload.single("resume"), async (req, res) => {
  const app = await Application.create({
    user_id: req.body.user_id,
    job_id: req.body.job_id,
    resume_file_id: req.file.id
  });
  res.status(201).json(app);
});

router.get("/user/:id/applications", async (req, res) => {
  const apps = await Application.find({ user_id: req.params.id });
  res.json(apps);
});

module.exports = router;
