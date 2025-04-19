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
  deleteUser,
  logout,
  createOrUpdateProfile,
  getAllProfiles,
  getProfileById,
  updateProfile,
  deleteProfile,
  getAllCandidates

} = require("../controller/candidateController");

const { isAuthenticatedCandidate } = require("../middlewares/auth");
const upload = require("../utils/multer");

const router = express.Router();
router.route("/candidate/signup").post(registerUser);
router.route("/send-otp").post(sendOTP)
router.route("/verify-email-otp").post(verifyEmailOTP);
router.route("/verify-phone-otp").post(verifyPhoneOTP);
router.route("/candidate/login").post(loginUser);
router.route("/logout").get(logout);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/").put(verifyOtpAndResetPassword);
router.route("/users/:id").put(isAuthenticatedCandidate, upload.single("userProfile"),updateUser) 
router.route("/users/:id").delete(isAuthenticatedCandidate, deleteUser); 
router.get("/candidates", getAllCandidates);

// ✅ Create profile (isAuthenticatedCandidateed)
router.put('/create/profile',isAuthenticatedCandidate, createOrUpdateProfile);

// ✅ Get all profiles (optional: public/admin use)
router.get('/all', getAllProfiles);

// ✅ Get single profile by ID
router.get('/:id', getProfileById);

// ✅ Update profile by ID (isAuthenticatedCandidateed)
router.put('/:id', isAuthenticatedCandidate, updateProfile);

// ✅ Delete profile by ID (isAuthenticatedCandidateed)
router.delete('/:id', isAuthenticatedCandidate, deleteProfile);

module.exports = router;