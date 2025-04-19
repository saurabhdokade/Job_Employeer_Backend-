const express = require("express");
const router = express.Router();
const multer = require("multer"); // ✅ This is required
const upload = require("../utils/multerr");
const textOnlyUpload = multer(); // ✅ For text-only multipart/form-data

const {
  createEmployerProfile,
  getEmployerProfileById,
  updateEmployerProfile,
  deleteEmployerProfile,
  getAllEmployerProfiles,
  getEmployerProfile,
  updateCompanyInfo,
  updateFoundingInfo,
  updateSocialMedia,
  updateAccountSettings
} = require("../controller/DashBoardController/overviewController");
const { isAuthenticatedUser } = require("../middlewares/auth");

// router.post("/employer-profile", createEmployerProfile);
router.post(
  "/employer-profile",
  isAuthenticatedUser,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  createEmployerProfile
);
router.get("/employer-profile/me", isAuthenticatedUser, getEmployerProfile);


router.put(
  "/employer-profile/company-info",
  isAuthenticatedUser,
  upload.fields([{ name: "logo" }, { name: "banner" }]),
  updateCompanyInfo
);

router.put('/employer-profile/founding-info', textOnlyUpload.none(), isAuthenticatedUser, updateFoundingInfo);

router.put('/employer-profile/social-media', isAuthenticatedUser, updateSocialMedia);

router.put('/employer-profile/account-settings', isAuthenticatedUser, updateAccountSettings);

router.get("/employer-profiles", getAllEmployerProfiles);

module.exports = router;
