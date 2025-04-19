const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userProfile",
    required: false
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobPost",
    required: false
  },
  resume: {
    type: String, // Could be a file path or URL
    required: true
  },
  coverLetter: {
    type: String,
    required: false
  },
  screeningAnswer: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ["Applied", "Shortlisted", "Interview", "Hired", "Rejected"],
    default: "Applied",
},
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
