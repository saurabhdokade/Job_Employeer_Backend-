const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
    employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employe", // or Employer model if separate
        required: true,
    },
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userProfile", // or Candidate model
        required: true,
    },
    jobPostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobPost",
        required: false, // optional if not directly linked to a job post
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Invitation", invitationSchema);
