const express = require("express");
const {
    createJobPost,
    getAllJobs,
    getApplicationsByJobId,
    updateJobPost,
    deleteJobPost,
    applyToJob,
    deleteApplication,
    getCandidateUserDetails,
    sendEmailToCandidate,
    getApplicationsByShortJobId,
    downloadCandidateCV,
    getCombinedApplicationsByJobId,
    makeJobExpire,
    getMyJobs,
    getRecentlyPostedJobs,
    getActiveJobs,
    getShortlistedApplicationsByJobId,
    promoteJob
} = require("../controller/DashBoardController/postJobController");
const  {isAuthenticatedUser, isAuthenticatedCandidate}  = require("../middlewares/auth");
const upload = require("../utils/multer")
const router = express.Router();

router.route("/postJob/job").post(isAuthenticatedUser, createJobPost);
router.put('/promote/:jobPostId', isAuthenticatedUser,promoteJob);
router.get("/alljob", getAllJobs);
router.get('/my-jobs', isAuthenticatedUser, getMyJobs);
router.get("/jobs/active", getActiveJobs);
router.get("/recent-jobs", getRecentlyPostedJobs);


router.get("/applications/:jobId", getApplicationsByJobId);

//getsingle job wise return shortlisted 
router.get('/job/:jobId/shortlisted', getShortlistedApplicationsByJobId);
router.get('/job/:jobId/applications/combined', getCombinedApplicationsByJobId);

//job id by return applciation and shortlisted
router.get("/applicationsShort/:jobId", getApplicationsByShortJobId);
router.get("/candidate/:userId",getCandidateUserDetails)
router.put("/updateJob/:id", isAuthenticatedUser, updateJobPost);

router.delete("/deleteJob/:id", isAuthenticatedUser, deleteJobPost);

//JOb expire 
router.patch("/jobExpire/:jobId/expire", makeJobExpire);

// Send email to candidate
router.post('/application/:applicationId/email', sendEmailToCandidate);

// Download candidate CV
router.get('/application/:applicationId/cv', downloadCandidateCV);

// Delete job application
router.delete('/application/:applicationId', deleteApplication);
//Apply for Job

router.post(
    "/apply/:jobId",
    isAuthenticatedCandidate,
    upload.fields([
      { name: "resume", maxCount: 1 },
      { name: "coverLetter", maxCount: 1 }
    ]),   applyToJob);

module.exports = router;
