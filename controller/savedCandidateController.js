const SavedCandidate = require('../model/SavedCandidate');
const Job = require('../model/jobPostModel');
const User = require('../model/candidateModel');
const Application = require("../model/JobApplication")

// Save a candidate for a job
// exports.saveCandidate = async (req, res) => {
//     try {
//         const { jobId } = req.params; // Get jobId from URL
//         const { userId, note } = req.body; // Candidate to be saved
//         const recruiterId = req.user._id; // Set from auth middleware

//         // 1. Check if job and user exist
//         const [job, user] = await Promise.all([
//             Job.findById(jobId),
//             User.findById(userId)
//         ]);

//         if (!job) {
//             return res.status(404).json({ success: false, message: "Job not found" });
//         }

//         // if (!user) {
//         //     return res.status(404).json({ success: false, message: "User not found" });
//         // }

//         // 2. Check for duplicate save
//         const existing = await SavedCandidate.findOne({ recruiterId, jobId, userId });
//         if (existing) {
//             return res.status(400).json({ success: false, message: "Candidate already saved for this job" });
//         }

//         // 3. Save candidate
//         const saved = await SavedCandidate.create({
//             recruiterId,
//             jobId,
//             userId,
//             note,
//             savedAt: new Date()
//         });

//         res.status(201).json({
//             success: true,
//             message: "Candidate saved successfully",
//             saved
//         });

//     } catch (error) {
//         console.error("Save Candidate Error:", error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// exports.saveCandidate = async (req, res) => {
//     try {
//         const { jobId } = req.params;
//         const { applicationId } = req.body;
//         const recruiterId = req.user._id;

//         // 1. Find the application and populate related data
//         const application = await Application.findById(applicationId)
//             .populate('userId')
//             .populate('jobId');

//         if (!application) {
//             return res.status(404).json({ success: false, message: "Application not found" });
//         }

//         // 2. Ensure the jobId in param matches the one in application
//         if (application.jobId._id.toString() !== jobId) {
//             return res.status(400).json({ success: false, message: "Job ID mismatch" });
//         }

//         const userId = application.userId._id;

//         // 3. Check for existing save
//         const existing = await SavedCandidate.findOne({ recruiterId, jobId, userId });
//         if (existing) {
//             return res.status(400).json({ success: false, message: "Candidate already saved" });
//         }

//         // 4. Save the candidate
//         const saved = await SavedCandidate.create({
//             recruiterId,
//             jobId,
//             userId,
//             applicationId,
//             savedAt: new Date()
//         });

//         return res.status(201).json({
//             success: true,
//             message: "Candidate saved successfully",
//             data: saved
//         });

//     } catch (error) {
//         console.error("Save Candidate Error:", error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };
exports.saveCandidate = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { applicationId } = req.body;
        const recruiterId = req.user._id;

        // 1. Find the application and populate related data
        const application = await Application.findById(applicationId)
            .populate('userId')
            .populate('jobId');

        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        // 2. Ensure jobId matches
        if (application.jobId._id.toString() !== jobId) {
            return res.status(400).json({ success: false, message: "Job ID mismatch" });
        }

        const userId = application.userId._id;

        // 3. Check if candidate is already saved
        const existing = await SavedCandidate.findOne({ recruiterId, jobId, userId });

        if (existing) {
            // If exists, unsave (remove from saved)
            await SavedCandidate.deleteOne({ _id: existing._id });
            return res.status(200).json({
                success: true,
                message: "Candidate unsaved successfully",
                data: null,
                saved: false
            });
        }

        // 4. Otherwise, save candidate
        const saved = await SavedCandidate.create({
            recruiterId,
            jobId,
            userId,
            applicationId,
            savedAt: new Date()
        });

        return res.status(201).json({
            success: true,
            message: "Candidate saved successfully",
            data: saved,
            saved: true
        });

    } catch (error) {
        console.error("Save Candidate Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// Get all saved candidates for a recruiter (No jobId required)
exports.getSavedCandidates = async (req, res) => {
    try {
        const recruiterId = req.user._id;

        const candidates = await SavedCandidate.find({ recruiterId })
            .populate({
                path: 'userId',
                select: 'fullname userProfile skills email resume',
            });

        // format output
        const formatted = candidates.map((item) => ({
            email: item.userId?.email || '',
            resume: item.resume || '',
            userId: item.userId?._id || '',
            fullname: item.userId?.fullname || '',
            userProfile: item.userId?.userProfile || '',
            skills: item.userId?.skills || '',
        }));

        res.status(200).json({
            success: true,
            total: formatted.length,
            candidates: formatted,
        });
    } catch (error) {
        console.error("Get Saved Candidates Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCandidateDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        const candidate = await User.findById(userId).lean();

        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found'
            });
        }

        res.status(200).json({
            success: true,
            data: candidate
        });

    } catch (error) {
        console.error("Error fetching candidate details:", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};

exports.unsaveCandidate = async (req, res) => {
    try {
        const { id } = req.params; // SavedCandidate _id

        const result = await SavedCandidate.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ success: false, message: 'Saved candidate not found' });
        }

        res.status(200).json({ success: true, message: 'Candidate unsaved successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



const Invitation = require("../model/invitation.js");
const sendEmail = require("../utils/sendEmail");

exports.sendInvitation = async (req, res) => {
    try {
        const { title, message } = req.body;
        const candidateId = req.params.candidateId;
        const employerId = req.user.id; // assuming auth middleware sets req.user

        // Save to DB
        const newInvite = new Invitation({
            employerId,
            candidateId,
            title,
            message,
        });

        await newInvite.save();

        // Fetch candidate email
        const candidate = await User.findById(candidateId);
        if (!candidate || !candidate.email) {
            return res.status(404).json({ success: false, message: "Candidate email not found" });
        }

        // Send Email
        const subject = `Job Invitation: ${title}`;
        await sendEmail({
            email: candidate.email,
            subject,
            message,
        });

        res.status(201).json({
            success: true,
            message: "Invitation sent successfully",
            data: newInvite,
        });
    } catch (error) {
        console.error("Error sending invitation:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

