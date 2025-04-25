const EmployerProfile = require("../../model/overviewModel");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const ErrorHander = require("../../utils/errorhandler");

// Create Employer Profile
// exports.createEmployerProfile = catchAsyncErrors(async (req, res, next) => {
//   const {
//     companyInfo,
//     foundingInfo,
//     socialMedia,
//     accountSettings
//   } = req.body;

//   // ✅ Validate required fields from companyInfo
//   if (!companyInfo?.companyName || !foundingInfo?.organizationType || !foundingInfo?.industryType || !foundingInfo?.teamSize || !accountSettings?.phone?.number || !accountSettings?.email) {
//     return next(new ErrorHander("Missing required fields.", 400));
//   }

//   // 📧 Check if email already exists
//   const existingProfile = await EmployerProfile.findOne({ "accountSettings.email": accountSettings.email });
//   if (existingProfile) {
//     return next(new ErrorHander("Employer profile already exists with this email.", 400));
//   }

//   // 🛠 Create new employer profile
//   const newProfile = await EmployerProfile.create({
//     companyInfo,
//     foundingInfo,
//     socialMedia,
//     accountSettings
//   });

//   res.status(201).json({
//     success: true,
//     message: "Employer profile created successfully.",
//     profile: newProfile
//   });
// });




// exports.createEmployerProfile = catchAsyncErrors(async (req, res, next) => {
//     const {
//       companyInfo: companyInfoBody,
//       foundingInfo,
//       socialMedia,
//       accountSettings,
//     } = req.body;

//     // Extract uploaded file paths
//     const logo = req.files?.logo?.[0]?.path || null;
//     const banner = req.files?.banner?.[0]?.path || null;

//     // Construct companyInfo with uploaded file URLs
//     const companyInfo = {
//       ...JSON.parse(companyInfoBody), // Because multipart sends it as string
//       logoUrl: logo,
//       bannerUrl: banner,
//     };

//     // Validate required fields
//     if (
//       !companyInfo?.companyName ||
//       !foundingInfo?.organizationType ||
//       !foundingInfo?.industryType ||
//       !foundingInfo?.teamSize ||
//       !accountSettings?.phone?.number ||
//       !accountSettings?.email
//     ) {
//       return next(new ErrorHander("Missing required fields.", 400));
//     }

//     // Check for existing profile by email
//     const existingProfile = await EmployerProfile.findOne({
//       "accountSettings.email": accountSettings.email,
//     });
//     if (existingProfile) {
//       return next(
//         new ErrorHander("Employer profile already exists with this email.", 400)
//       );
//     }

//     const newProfile = await EmployerProfile.create({
//       companyInfo,
//       foundingInfo,
//       socialMedia,
//       accountSettings,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Employer profile created successfully.",
//       profile: newProfile,
//     });
// });


exports.createEmployerProfile = catchAsyncErrors(async (req, res, next) => {
  const {
    companyInfo: companyInfoBody,
    foundingInfo,
    socialMedia,
    accountSettings,
  } = req.body;

  // Get current logged-in user
  const userId = req.user._id;

  const logo = req.files?.logo?.[0]?.path || null;
  const banner = req.files?.banner?.[0]?.path || null;

  const companyInfo = {
    ...JSON.parse(companyInfoBody),
    logoUrl: logo,
    bannerUrl: banner,
  };

  if (
    !companyInfo?.companyName ||
    !foundingInfo?.organizationType ||
    !foundingInfo?.industryType ||
    !foundingInfo?.teamSize ||
    !accountSettings?.phone?.number ||
    !accountSettings?.email
  ) {
    return next(new ErrorHander("Missing required fields.", 400));
  }

  const existingProfile = await EmployerProfile.findOne({
    "accountSettings.email": accountSettings.email,
  });
  if (existingProfile) {
    return next(
      new ErrorHander("Employer profile already exists with this email.", 400)
    );
  }

  const newProfile = await EmployerProfile.create({
    user: userId, // 🔥 store employer's user ID
    companyInfo,
    foundingInfo,
    socialMedia,
    accountSettings,
  });

  res.status(201).json({
    success: true,
    message: "Employer profile created successfully.",
    profile: newProfile,
  });
});


// exports.updateEmployerProfile = catchAsyncErrors(async (req, res, next) => {
//   const {
//     companyInfo: companyInfoBody,
//     foundingInfo,
//     socialMedia,
//     accountSettings,
//   } = req.body;

//   const userId = req.user._id;

//   const logo = req.files?.logo?.[0]?.path;
//   const banner = req.files?.banner?.[0]?.path;

//   const companyInfoParsed = JSON.parse(companyInfoBody) || {};
//   if (logo) companyInfoParsed.logoUrl = logo;
//   if (banner) companyInfoParsed.bannerUrl = banner;

//   if (
//     !companyInfoParsed?.companyName ||
//     !foundingInfo?.organizationType ||
//     !foundingInfo?.industryType ||
//     !foundingInfo?.teamSize ||
//     !accountSettings?.phone?.number ||
//     !accountSettings?.email
//   ) {
//     return next(new ErrorHander("Missing required fields.", 400));
//   }

//   // Find and update the existing profile
//   const existingProfile = await EmployerProfile.findOne({ user: userId });

//   if (!existingProfile) {
//     return next(new ErrorHander("Employer profile not found.", 404));
//   }

//   existingProfile.companyInfo = {
//     ...existingProfile.companyInfo,
//     ...companyInfoParsed,
//   };

//   existingProfile.foundingInfo = {
//     ...existingProfile.foundingInfo,
//     ...foundingInfo,
//   };

//   existingProfile.socialMedia = {
//     ...existingProfile.socialMedia,
//     ...socialMedia,
//   };

//   existingProfile.accountSettings = {
//     ...existingProfile.accountSettings,
//     ...accountSettings,
//   };

//   await existingProfile.save();

//   res.status(200).json({
//     success: true,
//     message: "Employer profile updated successfully.",
//     profile: existingProfile,
//   });
// });



exports.getEmployerProfile = catchAsyncErrors(async (req, res, next) => {

  const userId = req.user._id;



  const profile = await EmployerProfile.findOne({ user: userId }).populate("user");



  if (!profile) {

    return res.status(404).json({

      success: false,

      message: "Employer profile not found",

    });

  }



  res.status(200).json({

    success: true,

    message: "Employer profile fetched successfully",

    profile,

  });

});


const qs = require('qs');

exports.updateCompanyInfo = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user?._id;

  // console.log("🔐 User ID from token:", userId);
  // console.log("📦 Raw req.body:", req.body);
  // console.log("🖼️ Uploaded files:", req.files);

  if (!userId) {
    return next(new ErrorHander("Unauthorized: user ID not found.", 401));
  }

  const parsedBody = qs.parse(req.body);
  let { companyInfo } = parsedBody;

  try {
    if (typeof companyInfo === "string") {
      companyInfo = JSON.parse(companyInfo);
    }
  } catch (error) {
    return next(new ErrorHander("Invalid companyInfo JSON format.", 400));
  }

  const logo = req.files?.logo?.[0]?.path;
  const banner = req.files?.banner?.[0]?.path;

  if (!companyInfo || !companyInfo.companyName) {
    return next(new ErrorHander("companyName is required.", 400));
  }

  if (logo) companyInfo.logoUrl = logo;
  if (banner) companyInfo.bannerUrl = banner;

  // 🔍 Try to find existing profile
  let existingProfile = await EmployerProfile.findOne({ user: userId });

  if (!existingProfile) {
    // console.log("ℹ️ No profile found. Creating new one...");
    existingProfile = new EmployerProfile({
      user: userId,
      companyInfo: companyInfo,
    });
    await existingProfile.save();

    return res.status(201).json({
      success: true,
      message: "New profile created and company info added.",
      companyInfo: existingProfile.companyInfo,
    });
  }

  // ✅ Update profile
  existingProfile.companyInfo = {
    ...existingProfile.companyInfo,
    ...companyInfo,
  };

  await existingProfile.save();

  res.status(200).json({
    success: true,
    message: "Company info updated successfully.",
    companyInfo: existingProfile.companyInfo,
  });
});


exports.updateFoundingInfo = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;

  let foundingInfo;
  try {
    foundingInfo = JSON.parse(req.body.foundingInfo); // ✅ Use JSON.parse instead of qs.parse
  } catch (err) {
    return next(new ErrorHander("Invalid foundingInfo format.", 400));
  }

  if (
    !foundingInfo?.organizationType ||
    !foundingInfo?.industryType ||
    !foundingInfo?.teamSize
  ) {
    return next(new ErrorHander("Missing founding info fields.", 400));
  }

  const profile = await EmployerProfile.findOne({ user: userId });
  if (!profile) {
    return next(new ErrorHander("Employer profile not found.", 404));
  }

  // Convert year string to Date (if provided)
  if (foundingInfo.yearOfEstablishment) {
    foundingInfo.establishmentYear = new Date(foundingInfo.yearOfEstablishment);
    delete foundingInfo.yearOfEstablishment;
  }

  profile.foundingInfo = {
    ...profile.foundingInfo,
    ...foundingInfo,
  };

  await profile.save();

  res.status(200).json({
    success: true,
    message: "Founding info updated.",
    foundingInfo: profile.foundingInfo,
  });
});




exports.updateSocialMedia = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;
  const { socialMedia } = req.body; // Social media should be an array

  // Check if socialMedia is an array
  if (!Array.isArray(socialMedia)) {
    return next(new ErrorHander("Social media should be an array.", 400));
  }

  const profile = await EmployerProfile.findOne({ user: userId });
  if (!profile) {
    return next(new ErrorHander("Employer profile not found.", 404));
  }

  profile.socialMedia = socialMedia;
  await profile.save();

  res.status(200).json({
    success: true,
    message: "Social media updated successfully.",
    socialMedia: profile.socialMedia,
  });
});



exports.updateAccountSettings = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;
  const { accountSettings } = req.body; // No need for qs.parse
  // console.log("🔐 User ID from token:", userId);
  // console.log("📦 Raw req.body:", req.body);

  // Check if phone number and email are provided
  if (!accountSettings?.phone?.number || !accountSettings?.email) {
    return next(new ErrorHander("Phone number and email are required.", 400));
  }

  // Find the employer profile
  const profile = await EmployerProfile.findOne({ user: userId });
  if (!profile) {
    return next(new ErrorHander("Employer profile not found.", 404));
  }

  // Update account settings
  profile.accountSettings = {
    ...profile.accountSettings,
    ...accountSettings,
  };

  await profile.save();

  // Send success response
  res.status(200).json({
    success: true,
    message: "Account settings updated.",
    accountSettings: profile.accountSettings,
  });
});





exports.getAllEmployerProfiles = catchAsyncErrors(async (req, res, next) => {
  const profiles = await EmployerProfile.find().populate("user");
  const totalCount = await EmployerProfile.countDocuments();

  res.status(200).json({
    success: true,
    message: "All employer profiles fetched successfully",
    totalCount,
    profiles,
  });
});