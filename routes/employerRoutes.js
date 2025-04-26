const express = require("express");
const {
  registerUser,
  sendOTP,
  verifyEmailOTP,
  verifyPhoneOTP,
  loginUser,
  forgotPassword,
  verifyOtpAndResetPassword,
  updateUser,
  getAllUsers,
  deleteUser,
  socialLoginCallback,
  // getCandidateDetails,
  // saveCandidate,
  logout,

} = require("../controller/empoyerController");

const { isAuthenticatedUser } = require("../middlewares/auth");
const upload = require("../utils/multer");
const { getSavedCandidates, unsaveCandidate, saveCandidate, getCandidateDetails, sendInvitation } = require("../controller/savedCandidateController");
const { saveUserSettings, getUserSettings } = require("../controller/settingController");


const router = express.Router();
router.route("/employee/signup").post(registerUser);
router.route("/send-otp").post(sendOTP)
router.route("/verify-email-otp").post(verifyEmailOTP);
router.route("/verify-phone-otp").post(verifyPhoneOTP);
router.route("/employee/login").post(loginUser);
router.route("/logout").get(logout);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset").put(verifyOtpAndResetPassword);
router.route("/users/:id").put(isAuthenticatedUser, upload.single("userProfile"), updateUser)
router.route("/users/:id").delete(isAuthenticatedUser, deleteUser);




//social login



const passport = require("passport");


// Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false }), socialLoginCallback);

// Facebook
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));
router.get("/facebook/callback", passport.authenticate("facebook", { session: false }), socialLoginCallback);

// LinkedIn
router.get("/linkedin", passport.authenticate("linkedin"));
router.get("/linkedin/callback", passport.authenticate("linkedin", { session: false }), socialLoginCallback);




//all employee
router.get("/admin/users", getAllUsers);


//SaveCandidate
router.post('/save/:jobId', isAuthenticatedUser, saveCandidate);
router.get('/getsaved', isAuthenticatedUser, getSavedCandidates);
router.delete('/:id', isAuthenticatedUser, unsaveCandidate);
router.get('/candidates/:userId', isAuthenticatedUser, getCandidateDetails);

//sendInvitaion
router.post("/invite/:candidateId", isAuthenticatedUser, sendInvitation);


//setting
router.post('/settings', isAuthenticatedUser, saveUserSettings);
router.get('/settings', isAuthenticatedUser, getUserSettings);
module.exports = router;