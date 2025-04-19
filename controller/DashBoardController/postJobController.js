const Job = require("../../model/jobPostModel");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const ErrorHandler = require("../../utils/errorhandler");
const sendEmail = require("../../utils/sendEmail");
const Apply = require("../../model/JobApplication")
const path = require('path');
const moment = require("moment")
const Subscription = require("../../model/subscriptionModel")
// const moment = require("moment")
const fs = require('fs');
// const moment = require('moment'); 
const JobApplication = require('../../model/JobApplication');
const User = require("../../model/candidateModel")
//Create a JOb 
// exports.createJobPost = catchAsyncErrors(async (req, res, next) => {
//     // Destructure the required fields from the request body
//     const {
//         jobTitle,
//         tags,
//         jobRole,
//         salary,
//         advanceInfo,
//         applyMethod,
//         description,
//         responsibilities,
//         expirationDate,
//     } = req.body;

//     // Validate required fields
//     if (!jobTitle || !jobRole) {
//         return next(new ErrorHandler("Job title and job role are required.", 400));
//     }

//     // Log the employer ID (user ID) for debugging purposes
//     const userId = req.user ? req.user.id : null; // Ensure we have the user ID from authentication
//     if (!userId) {
//         return next(new ErrorHandler("Employer not authenticated.", 401));
//     }

//     console.log('Employer ID:', userId);

//     // Create the job post
//     const jobPost = await Job.create({
//         userId: userId,  // Link the job post with the authenticated user's ID
//         jobTitle,
//         tags,
//         jobRole,
//         salary,
//         advanceInfo,
//         applyMethod,
//         description,
//         responsibilities,
//         expirationDate,
//     });

//     // Return success response
//     res.status(201).json({
//         success: true,
//         message: "Job post created successfully",
//         jobPost,
//     });
// });


exports.createJobPost = catchAsyncErrors(async (req, res, next) => {
  const {
    jobTitle,
    tags,
    jobRole,
    salary,
    advanceInfo,
    applyMethod,
    description,
    responsibilities,
    expirationDate,
  } = req.body;

  if (!jobTitle || !jobRole) {
    return next(new ErrorHandler('Job title and job role are required.', 400));
  }

  const userId = req.user?._id;
  if (!userId) {
    return next(new ErrorHandler('Employer not authenticated.', 401));
  }

  // ❌ Disabled subscription validation
  // const subscription = await Subscription.findOne({ ... });
  // if (!subscription) { return next(...); }
  // const postedJobsCount = await Job.countDocuments({ userId });
  // if (postedJobsCount >= subscription.postLimit) { return next(...); }

  // ✅ Proceed to create the job post
  const jobPost = await Job.create({
    userId,
    jobTitle,
    tags,
    jobRole,
    salary,
    advanceInfo,
    applyMethod,
    description,
    responsibilities,
    expirationDate,
  });

  res.status(201).json({
    success: true,
    message: 'Job post created successfully.',
    jobPost,
  });
});


//Promote Jobs
exports.promoteJob = async (req, res) => {
  try {
    const { jobPostId } = req.params;
    const { promotionType } = req.body;

    const validTypes = ['featured', 'highlighted', 'none'];
    if (!validTypes.includes(promotionType)) {
      return res.status(400).json({ success: false, message: 'Invalid promotion type' });
    }

    const job = await Job.findByIdAndUpdate(
      jobPostId,
      { promotion: promotionType },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.status(200).json({
      success: true,
      message: `Job promoted as "${promotionType}" successfully`,
      data: job,
    });
  } catch (err) {
    console.error('Error promoting job:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

//getAll Jobs
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().lean();
    const jobIds = jobs.map(job => job._id);

    // Count applications per job
    const applicationCounts = await JobApplication.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: "$jobId", count: { $sum: 1 } } }
    ]);

    // Map application count per job
    const appCountMap = {};
    applicationCounts.forEach(app => {
      appCountMap[app._id.toString()] = app.count;
    });

    const formattedJobs = jobs.map(job => {
      const jobIdStr = job._id.toString();
      const now = new Date();

      // Determine expiry date
      let expiry = job.expiryDate ? new Date(job.expiryDate) : new Date(job.createdAt);
      if (!job.expiryDate) {
        expiry.setDate(expiry.getDate() + 30); // default: 30 days from createdAt
      }

      // Calculate days remaining
      let daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0) daysRemaining = null;

      return {
        _id: job._id,
        jobTitle: Array.isArray(job.jobRole) ? job.jobRole.join(", ") : job.jobRole || "N/A",
        jobType: job.jobType || "Full Time",
        status: job.status || "Active",
        daysRemaining: job.status === "Active" ? daysRemaining : undefined,
        expiryDate: job.status === "Expire" ? moment(expiry).format("MMM D, YYYY") : undefined,
        expiryTime: moment(expiry).format("YYYY-MM-DD HH:mm:ss"), // Always include
        applications: appCountMap[jobIdStr] || 0
      };
    });

    res.status(200).json({
      success: true, totalActiveJobs: formattedJobs.length,
      jobs: formattedJobs
    });

  } catch (error) {
    console.error("Error in getAllJobs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecentlyPostedJobs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const jobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const jobIds = jobs.map(job => job._id);

    const applicationCounts = await JobApplication.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: "$jobId", count: { $sum: 1 } } }
    ]);

    const appCountMap = {};
    applicationCounts.forEach(app => {
      appCountMap[app._id.toString()] = app.count;
    });

    const now = new Date();
    const formattedJobs = jobs.map(job => {
      const jobIdStr = job._id.toString();

      let expiry = job.expiryDate ? new Date(job.expiryDate) : new Date(job.createdAt);
      if (!job.expiryDate) {
        expiry.setDate(expiry.getDate() + 30);
      }

      let daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0) daysRemaining = null;

      return {
        jobTitle: Array.isArray(job.jobRole) ? job.jobRole.join(", ") : job.jobRole || "N/A",
        jobType: job.jobType || "Full Time",
        status: job.status || "Active",
        daysRemaining: job.status === "Active" ? daysRemaining : undefined,
        expiryDate: job.status === "Expire" ? moment(expiry).format("MMM D, YYYY") : undefined,
        expiryTime: moment(expiry).format("YYYY-MM-DD HH:mm:ss"),
        applications: appCountMap[jobIdStr] || 0,
        createdAt: moment(job.createdAt).format("MMM D, YYYY"),
        minSalary: job.salary?.min || 0,
        maxSalary: job.salary?.max || 0
      };
    });

    res.status(200).json({
      success: true,
      totalRecentJobs: formattedJobs.length,
      jobs: formattedJobs
    });

  } catch (error) {
    console.error("Error in getRecentlyPostedJobs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
//My Jobs
exports.getMyJobs = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find jobs created by this user
    const jobs = await Job.find({ userId }).lean();
    const jobIds = jobs.map(job => job._id);

    // Count applications per job
    const applicationCounts = await JobApplication.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: "$jobId", count: { $sum: 1 } } }
    ]);

    // Map application count per job
    const appCountMap = {};
    applicationCounts.forEach(app => {
      appCountMap[app._id.toString()] = app.count;
    });

    const formattedJobs = jobs.map(job => {
      const jobIdStr = job._id.toString();
      const now = new Date();

      let expiry = job.expiryDate ? new Date(job.expiryDate) : new Date(job.createdAt);
      if (!job.expiryDate) {
        expiry.setDate(expiry.getDate() + 30); // Default 30 days
      }

      let daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0) daysRemaining = null;

      return {
        jobTitle: Array.isArray(job.jobRole) ? job.jobRole.join(", ") : job.jobRole || "N/A",
        jobType: job.advanceInfo?.jobType || "Full-time",
        status: job.status || "Active",
        daysRemaining: job.status === "Active" ? daysRemaining : undefined,
        expiryDate: job.status === "Expired" ? moment(expiry).format("MMM D, YYYY") : undefined,
        expiryTime: moment(expiry).format("YYYY-MM-DD HH:mm:ss"),
        applications: appCountMap[jobIdStr] || 0
      };
    });

    res.status(200).json({
      success: true, totalActiveJobs: formattedJobs.length,
      jobs: formattedJobs
    });
  } catch (error) {
    console.error("Error in getMyJobs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// const moment = require("moment"); // Make sure you have moment installed

exports.getActiveJobs = async (req, res) => {
  try {
    // Fetch only jobs where status is "Active"
    const jobs = await Job.find({ status: "Active" }).lean();
    const jobIds = jobs.map(job => job._id);

    // Count applications per job
    const applicationCounts = await JobApplication.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: "$jobId", count: { $sum: 1 } } }
    ]);

    // Create a map of application counts
    const appCountMap = {};
    applicationCounts.forEach(app => {
      appCountMap[app._id.toString()] = app.count;
    });

    // Format jobs data
    const formattedJobs = jobs.map(job => {
      const jobIdStr = job._id.toString();
      const now = new Date();

      // Determine expiry
      let expiry = job.expiryDate ? new Date(job.expiryDate) : new Date(job.createdAt);
      if (!job.expiryDate) {
        expiry.setDate(expiry.getDate() + 30);
      }

      let daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0) daysRemaining = null;

      return {
        jobTitle: Array.isArray(job.jobRole) ? job.jobRole.join(", ") : job.jobRole || "N/A",
        jobType: job.jobType || "Full Time",
        status: job.status,
        daysRemaining,
        expiryDate: moment(expiry).format("MMM D, YYYY"),
        expiryTime: moment(expiry).format("YYYY-MM-DD HH:mm:ss"),
        applications: appCountMap[jobIdStr] || 0
      };
    });

    res.status(200).json({
      success: true, totalActiveJobs: formattedJobs.length,
      jobs: formattedJobs
    });
  } catch (error) {
    console.error("Error in getActiveJobs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



//getJob Job wise application list 
//getJob Job wise application list 
exports.getApplicationsByJobId = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Validate job existence
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Find applications & populate selected fields
    const applications = await JobApplication.find({ jobId })
      .populate("userId", "fullName email userProfile skills resume");

    // Shape the response to only return user details
    const formatted = applications.map(app => ({
      applicationId: app._id,
      email: app.userId?.email || '',
      resume: app.resume || '',
      userId: app.userId?._id || '',
      fullName: app.userId?.fullName || '',
      userProfile: app.userId?.userProfile || '',
      skills: app.userId?.skills || []
    }));

    res.status(200).json({
      success: true,
      total: formatted.length,
      applicants: formatted
    });

  } catch (err) {
    console.error("Error fetching applicants:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.getShortlistedApplicationsByJobId = async (req, res) => {
  try {
    const { jobId } = req.params;

    // 1. Validate job existence
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // 2. Fetch shortlisted applications
    const shortlisted = await JobApplication.find({ jobId, status: "Shortlisted" })
      .populate("userId", "fullName userProfile skills");

    // 3. Shape response
    const formatted = shortlisted.map(app => ({
      fullName: app.userId?.fullName || '',
      userProfile: app.userId?.userProfile || '',
      skills: app.userId?.skills || []
    }));

    // 4. Send response
    res.status(200).json({
      success: true,
      totalShortlisted: formatted.length,
      shortlistedApplicants: formatted
    });

  } catch (err) {
    console.error("Error fetching shortlisted applicants:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


exports.getCombinedApplicationsByJobId = async (req, res) => {
  try {
    const { jobId } = req.params;
    const sortOrder = req.query.sort === "oldest" ? 1 : -1;

    // Validate job existence
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Fetch all applications and populate user fields
    const applications = await JobApplication.find({ jobId })
      .sort({ appliedAt: sortOrder })
      .populate("userId", "fullName userProfile skills education resume workExperience");

    const allApplications = [];
    const shortlistedApplications = [];

    applications.forEach((app) => {
      const user = app.userId || {};

      const experience =
        Array.isArray(user.workExperience) && user.workExperience.length > 0
          ? `${user.workExperience.length} Years Experience`
          : "N/A";

      const formattedApp = {
        fullName: user.fullName || "N/A",
        userProfile: user.userProfile || "",
        skills: user.skills || [],
        education: user.education || "N/A",
        appliedDate: moment(app.appliedAt).format("MMM D, YYYY"),
        resumeLink: user.resume || "#",
      };

      if (app.status === "Shortlisted") {
        shortlistedApplications.push(formattedApp);
      }

      allApplications.push(formattedApp);
    });

    res.status(200).json({
      success: true,
      jobId,
      jobTitle: job.jobRole || "N/A",
      totalApplications: allApplications.length,
      totalShortlisted: shortlistedApplications.length,
      allApplications,
      shortlistedApplications,
    });
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};





//ShortListed Cndidate and All application 
exports.getApplicationsByShortJobId = async (req, res) => {
  try {
    const { jobId } = req.params;
    const sortOrder = req.query.sort === "oldest" ? 1 : -1;

    // 1. Check job existence
    const job = await Job.findById(jobId).lean();
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // 2. Fetch job applications and populate user data
    const applications = await JobApplication.find({ jobId })
      .sort({ appliedAt: sortOrder })
      .populate("userId", "fullName userProfile workExperience education resume skills")
      .lean();

    // 3. Process and format the applications
    const allApplications = [];
    const shortlistedApplications = [];

    applications.forEach((app) => {
      const user = app.userId || {};
      const experience = Array.isArray(user.workExperience)
        ? `${user.workExperience.length} Years Experience`
        : "N/A";

      const appCard = {
        fullName: user.fullName || "N/A",
        skills: user.skills || [],
        experience,
        education: user.education || "N/A",
        appliedDate: moment(app.appliedAt).format("MMM D, YYYY"),
        resumeLink: user.resume || "#",
        userProfile: user.userProfile || "",
      };

      if (app.status === "Shortlisted") {
        shortlistedApplications.push(appCard);
      } else {
        allApplications.push(appCard);
      }
    });

    // 4. Send formatted response
    res.status(200).json({
      success: true,
      jobId,
      // jobTitle: job.jobRole || "N/A",
      totalApplications: applications.length,
      totalShortlisted: shortlistedApplications.length,
      allApplications,
      shortlistedApplications,
    });

  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};




//getApplications User Detils
exports.getCandidateUserDetails = async (req, res) => {
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

//send email to candidate
// exports.sendEmailToCandidate = async (req, res) => {
//     try {
//         const { applicationId } = req.params;

//         const application = await JobApplication.findById(applicationId).populate('userId', 'email fullname');
//         console.log("Loaded application:", application);

//         if (!application) {
//             return res.status(404).json({ success: false, message: 'Application not found' });
//         }

//         const user = application.userId;
//         console.log("userId:", user); // ✅ Check user object

//         const recipient = user?.email;
//         const name = user?.fullname;

//         console.log("Recipient email:", recipient); // ✅ Should not be undefined

//         if (!recipient) {
//             return res.status(400).json({ success: false, message: 'Recipient email not found' });
//         }

//         const subject = "Follow-up Regarding Your Job Application";
//         const message = `Hi ${name},\n\nThanks for applying!`;

//         await sendEmail({
//             emal:user.email,
//             to: recipient,
//             subject,
//             text: message,
//             html: `<p>${message}</p>`
//         });

//         res.status(200).json({ success: true, message: `Email sent to ${recipient}` });

//     } catch (err) {
//         console.error("mail error:", err);
//         res.status(500).json({ success: false, message: "Failed to send email." });
//     }
// };
// controllers/jobApplication.controller.js
exports.sendEmailToCandidate = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await JobApplication.findById(applicationId).populate('userId', 'email fullname');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const user = application.userId;
    const recipient = user?.email;
    const name = user?.fullname;

    if (!recipient) {
      return res.status(400).json({ success: false, message: 'Recipient email not found' });
    }

    const subject = "Follow-up Regarding Your Job Application";
    const message = `Hi ${name},\n\nThanks for applying!`;

    // Generate Gmail redirect URL
    const gmailRedirectUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

    res.status(200).json({
      success: true,
      gmailRedirectUrl,
      message: `Redirecting to Gmail for ${recipient}`
    });

  } catch (err) {
    console.error("mail error:", err);
    res.status(500).json({ success: false, message: "Failed to prepare Gmail redirect URL." });
  }
};


//download cv
// exports.downloadCandidateCV = async (req, res) => {
//     try {
//         const { applicationId } = req.params;
//         const application = await JobApplication.findById(applicationId);

//         if (!application || !application.resume) {
//             return res.status(404).json({ success: false, message: 'CV not found' });
//         }

//         const resumeFileName = path.basename(application.resume); 
//         const resumePath = path.join(__dirname, "../../uploads/signup", resumeFileName); // ✅ 2 levels up

//         console.log("Resume full path:", resumePath);

//         if (!fs.existsSync(resumePath)) {
//             return res.status(404).json({ success: false, message: 'CV file does not exist on server' });
//         }

//         return res.download(resumePath, resumeFileName); 
//     } catch (err) {
//         console.error('Error downloading CV:', err);
//         return res.status(500).json({ success: false, message: err.message });
//     }
// };

exports.downloadCandidateCV = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await JobApplication.findById(applicationId);
    if (!application || !application.resume) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }

    const resumeFileName = path.basename(application.resume); // e.g., "resume.pdf"
    const resumePath = path.join(__dirname, "../../uploads/signup", resumeFileName);

    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ success: false, message: 'CV file does not exist on server' });
    }

    res.download(resumePath, resumeFileName); // Force download
  } catch (err) {
    console.error('Error downloading CV:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
//delete application  
exports.deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const deletedApplication = await JobApplication.findByIdAndDelete(applicationId);

    if (!deletedApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
      data: deletedApplication,
    });
  } catch (err) {
    console.error('Error deleting application:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};



// Update a job post by ID
exports.updateJobPost = catchAsyncErrors(async (req, res, next) => {
  const jobPost = await JobModel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!jobPost) {
    return next(new ErrorHandler("Job post not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Job post updated successfully",
    jobPost,
  });
});

// Delete a job post by ID
exports.deleteJobPost = catchAsyncErrors(async (req, res, next) => {
  const jobPost = await JobModel.findByIdAndDelete(req.params.id);

  if (!jobPost) {
    return next(new ErrorHandler("Job post not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Job post deleted successfully",
  });
});



//make it expire

exports.makeJobExpire = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    job.status = "Expired";
    await job.save();

    res.status(200).json({ success: true, message: "Job status updated to Expire." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Apply for Job 



// exports.applyToJob = catchAsyncErrors(async (req, res, next) => {
//     const { resume, coverLetter, screeningAnswer } = req.body;
//     const jobId = req.params.jobId;
//     const userId = req.user._id;

//     if (!jobId || !resume) {
//       return next(new ErrorHander("Job ID and Resume are required", 400));
//     }

//     // Optional: Prevent duplicate applications
//     const alreadyApplied = await JobApplication.findOne({ userId, jobId });

//     if (alreadyApplied) {
//       return res.status(200).json({
//         success: true,
//         message: "You have already applied to this job",
//         application: alreadyApplied,
//       });
//     }

//     const application = await JobApplication.create({
//       userId,
//       jobId,
//       resume,
//       coverLetter,
//       screeningAnswer,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Application submitted successfully",
//       application,
//     });
//   });


// exports.applyToJob = catchAsyncErrors(async (req, res, next) => {
//     const { jobId } = req.params;
//     const userId = req.user._id;
//     // const { screeningAnswer } = req.body;

//     const resume = req.files?.resume?.[0]?.path;
//     const coverLetter = req.files?.coverLetter?.[0]?.path;

//     const existing = await Apply.findOne({ jobId, userId });
//     if (existing) {
//       return next(new ErrorHandler("You have already applied to this job", 400));
//     }

//     const application = await Apply.create({
//       jobId,
//       userId,
//       resume,
//       coverLetter,
//     //   screeningAnswer,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Application submitted successfully",
//       application,
//     });
//   });


exports.applyToJob = catchAsyncErrors(async (req, res, next) => {
  const { jobId } = req.params;
  const userId = req.user._id;

  const resume = req.files?.resume?.[0]?.path;
  const coverLetter = req.files?.coverLetter?.[0]?.path;

  // Check if user already applied
  const existing = await Apply.findOne({ jobId, userId });
  if (existing) {
    return next(new ErrorHandler("You have already applied to this job", 400));
  }

  // Create new application
  const application = await Apply.create({
    jobId,
    userId,
    resume,
    coverLetter,
  });

  // ✅ Add application reference to Job model's jobApplication array
  await Job.findByIdAndUpdate(
    jobId,
    { $push: { jobApplication: application._id } },
    { new: true }
  );

  res.status(201).json({
    success: true,
    message: "Application submitted successfully",
    application,
  });
});
