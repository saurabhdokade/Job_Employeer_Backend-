const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const User = require("../model/candidateModel");
// const CandidateProfile = require('../model/candidateProfileModel');
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const jwt = require('jsonwebtoken');
require("dotenv").config();

//SignUp User
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
    const { fullname, username, email, password, confirmPassword } = req.body;
  
    if (!fullname || !username || !email || !password || !confirmPassword) {
      return next(new ErrorHander("All required fields must be filled.", 400));
    }
  
    if (password !== confirmPassword) {
      return next(new ErrorHander("Passwords do not match.", 400));
    }
  
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorHander("User already exists with this email.", 400));
    }
  
    const newUser = await User.create({
      fullname,
      username,
      email,
      password,
      role: "employee", // <-- Set role explicitly
    });
  
    res.status(201).json({
      success: true,
      message: "User registered successfully. OTP sent to your email.",
      newUser,
    });
  });


exports.sendOTP = catchAsyncErrors(async(req, res) => {
    try {
      const { phone, email } = req.body;
  
      if (!phone && !email) {
        return res.status(400).json({ success: false, message: "Phone or Email is required" });
      }
  
      // Generate 6-digit OTP and set expiry (10 minutes)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpire = new Date(Date.now() + 10 * 60 * 1000);
      let user;
      let message = "OTP sent successfully.";
  
      if (phone) {
        user = await User.findOne({ phone });
  
        if (!user) {
          user = new User({ phone, otp, otpExpire, isVerified: false });
          message = "OTP sent for registration via phone.";
        } else {
          user.otp = otp;
          user.otpExpire = otpExpire;
          message = "OTP sent for login via phone.";
        }
  
        await user.save();
  
        // Optional: Log OTP in console for testing
        // console.log(`Phone OTP for ${phone}: ${otp}`);
  
        // Try sending OTP via Twilio
        try {
          await client.messages.create({
            body: `Your OTP is ${otp}. It expires in 10 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER || "+13612667244",
            to: phone,
          });
        } catch (twilioError) {
          console.error("⚠ Twilio Error:", twilioError);
          message += " (SMS sending failed, but OTP is generated.)";
        }
      }
  
      if (email) {
        user = await User.findOne({ email });
  
        if (!user) {
          user = new User({ email, otp, otpExpire, isVerified: false });
          message = "OTP sent for registration via email.";
        } else {
          user.otp = otp;
          user.otpExpire = otpExpire;
          message = "OTP sent for login via email.";
        }
  
        await user.save();
  
        // Optional: Log OTP in console for testing
        // console.log(`Email OTP for ${email}: ${otp}`);
  
        // Try sending OTP via Email
        try {
          await sendEmail({
            email: email,
            subject: "Your Verification Code",
            message: `Your OTP is ${otp}. It will expire in 10 minutes.`,
          });
        } catch (emailError) {
          console.error("⚠ Email Error:", emailError);
          message += " (Email sending failed, but OTP is generated.)";
        }
      }
  
      return res.status(200).json({ success: true, message });
  
    } catch (error) {
      console.error("❌ Error sending OTP:", error);
      return res.status(500).json({ success: false, message: "Failed to send OTP. Please try again." });
    }
});

exports.verifyEmailOTP = catchAsyncErrors(async (req, res, next) => {
    const { otp } = req.body;
  
    if (!otp) {
      return next(new ErrorHander("OTP is required", 400));
    }
  
    // Find user by OTP and ensure email is present (to differentiate)
    const user = await User.findOne({ otp, email: { $exists: true, $ne: null } });
  
    if (!user) {
      return next(new ErrorHander("Invalid or expired OTP for email", 404));
    }
  
    if (user.otpExpire < Date.now()) {
      return next(new ErrorHander("OTP has expired", 400));
    }
  
    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;
    await user.save();
  
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  
    return res.status(200).json({
      success: true,
      message: "Email OTP verified successfully.",
      token,
    });
  });

  exports.verifyPhoneOTP = catchAsyncErrors(async (req, res, next) => {
    const { otp } = req.body;
  
    if (!otp) {
      return next(new ErrorHander("OTP is required", 400));
    }
  
    // Find user by OTP and ensure phone is present (to differentiate)
    const user = await User.findOne({ otp, phone: { $exists: true, $ne: null } });
  
    if (!user) {
      return next(new ErrorHander("Invalid or expired OTP for phone", 404));
    }
  
    if (user.otpExpire < Date.now()) {
      return next(new ErrorHander("OTP has expired", 400));
    }
  
    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;
    await user.save();
  
    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  
    return res.status(200).json({
      success: true,
      message: "Phone OTP verified successfully.",
      token,
    });
  });
  
// Logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHander("Please enter email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");


  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHander("Invalid email or password", 401));
  }
  sendToken(user, 200, res);
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
  
    if (!user) {
      return next(new ErrorHander("User not found", 404));
    }
  
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; // valid for 10 mins
    await user.save({ validateBeforeSave: false });
  
    const message = `Your password reset OTP is: ${otp}. It is valid for 10 minutes.`;
  
    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset OTP",
        message,
      });
  
      res.status(200).json({
        success: true,
        message: `OTP sent to ${user.email} successfully`,
      });
    } catch (error) {
      user.otp = undefined;
      user.otpExpire = undefined;
      await user.save({ validateBeforeSave: false });
  
      return next(new ErrorHander("Failed to send OTP email", 500));
    }
  });
  
// Reset Password  
exports.verifyOtpAndResetPassword = catchAsyncErrors(async (req, res, next) => {
    const { otp, password, confirmPassword } = req.body;
  
    if (!otp || !password || !confirmPassword) {
      return next(new ErrorHander("All fields are required", 400));
    }
  
    // Find user by OTP and check if OTP is not expired
    const user = await User.findOne({
      otp,
      otpExpire: { $gt: Date.now() },
    });
  
    if (!user) {
      return next(new ErrorHander("Invalid or expired OTP", 400));
    }
  
    if (password !== confirmPassword) {
      return next(new ErrorHander("Passwords do not match", 400));
    }
  
    user.password = password;
    user.otp = undefined;
    user.otpExpire = undefined;
  
    await user.save();
  
    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  });


// -------------------------- Update User Details  --------------------------
exports.updateUser = catchAsyncErrors(async (req, res, next) => {
   try{
    const userId = req.params.id;
    const { fullname, username } = req.body;
  
    const user = await User.findById(userId);
  
    if (!user) {
      return next(new ErrorHander("User not found", 404));
    }
  
    // Update the user fields
    user.fullname = fullname || user.fullname;
    user.username = username || user.username;
  
    await user.save();
  
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
   }catch(error){
    console.log(error)
   }
  });
  
// -------------------------- Delete User (Admin Only) --------------------------
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHander("User not found", 404));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User deleted successfully!",
  });
});


//getAll condidate
exports.getAllCandidates = catchAsyncErrors(async (req, res, next) => {
  try {
    const candidates = await User.find({ role: "employee" }).select(
      "fullname username email createdAt"
    );

    const totalCount = await User.countDocuments({ role: "employee" });

    res.status(200).json({
      success: true,
      total: totalCount,
      candidates,
    });
  } catch (error) {
    return next(new ErrorHander("Failed to fetch candidates", 500));
  }
});




// 📥 Create a new candidate profile
// exports.createProfile = catchAsyncErrors(async (req, res, next) => {
//     const {
//       fullName,
//       dateOfBirth,
//       gender,
//       contactNumber,
//       email,
//       location,
//       education,
//       workExperience,
//       certifications,
//       skills,
//       jobTypes,
//       preferredDesignation,
//       preferredLocation,
//       desiredSalaryRange,
//       photo,
//       resume,
//       additionalDocuments,
//     } = req.body;
  
//     // Validate required fields
//     if (
//       !fullName || !dateOfBirth || !gender ||
//       !contactNumber || !email || !location ||
//       !education || education.length === 0 ||
//       !workExperience || workExperience.length === 0 ||
//       !skills || skills.length === 0 ||
//       !jobTypes || jobTypes.length === 0 ||
//       !preferredDesignation || !preferredLocation ||
//       !desiredSalaryRange?.min || !desiredSalaryRange?.max
//     ) {
//       return next(new ErrorHander("Please provide all required fields", 400));
//     }
  
//     // ✅ Check if profile already exists for this user
//     const existingProfile = await User.findOne({
//       $or: [
//         { email: email },
//         { contactNumber: contactNumber },
//         { user: req.user._id } // assuming you're storing user ref
//       ]
//     });
  
//     if (existingProfile) {
//       return res.status(200).json({
//         success: true,
//         message: "Profile already exists",
//         profile: existingProfile,
//       });
//     }
  
//     // 🆕 Create new profile
//     const profile = await User.create({
//       fullName,
//       dateOfBirth,
//       gender,
//       contactNumber,
//       email,
//       location,
//       education,
//       workExperience,
//       certifications,
//       skills,
//       jobTypes,
//       preferredDesignation,
//       preferredLocation,
//       desiredSalaryRange,
//       photo,
//       resume,
//       additionalDocuments,
//       user: req.user._id,
//     });
  
//     res.status(201).json({
//       success: true,
//       message: "Candidate profile created successfully",
//       profile,
//     });
//   });

exports.createOrUpdateProfile = catchAsyncErrors(async (req, res, next) => {
  const {
    fullName,
    dateOfBirth,
    gender,
    contactNumber,
    email,
    location,
    education,
    workExperience,
    certifications,
    skills,
    jobTypes,
    preferredDesignation,
    preferredLocation,
    desiredSalaryRange,
    photo,
    resume,
    additionalDocuments,
    coverletter,
    about
  } = req.body;

  // ✅ Validate required fields
  if (
    !fullName || !dateOfBirth || !gender || !coverletter || !about ||
    !contactNumber || !email || !location ||
    !Array.isArray(education) || education.length === 0 ||
    !Array.isArray(workExperience) || workExperience.length === 0 ||
    !Array.isArray(skills) || skills.length === 0 ||
    !Array.isArray(jobTypes) || jobTypes.length === 0 ||
    !preferredDesignation || !preferredLocation ||
    !desiredSalaryRange?.min || !desiredSalaryRange?.max
  ) {
    return next(new ErrorHander("Please provide all required fields", 400));
  }

  // ✅ Check if user is logged in
  if (!req.user || !req.user._id) {
    return next(new ErrorHander("Access Denied: Invalid User", 401));
  }

  // ✅ Calculate total experience from workExperience array
  let totalExperience = 0;
  if (Array.isArray(workExperience)) {
    workExperience.forEach((exp) => {
      if (!exp.startDate) return;

      const start = new Date(exp.startDate);
      const end = exp.currentlyWorking || !exp.endDate ? new Date() : new Date(exp.endDate);
      const duration = (end - start) / (1000 * 60 * 60 * 24 * 365.25); // convert to years
      totalExperience += duration;
    });

    totalExperience = Math.round(totalExperience * 10) / 10; // round to 1 decimal
  }

  // ✅ Update user profile
  const profile = await User.findByIdAndUpdate(
    req.user._id,
    {
      fullName,
      dateOfBirth,
      gender,
      contactNumber,
      email,
      location,
      education,
      workExperience,
      certifications,
      skills,
      jobTypes,
      preferredDesignation,
      preferredLocation,
      desiredSalaryRange,
      photo,
      resume,
      additionalDocuments,
      coverletter,
      about,
      totalExperience,
    },
    { new: true, runValidators: true }
  );

  if (!profile) {
    return next(new ErrorHander("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    profile,
  });
});




// // 📄 Get all profiles
// exports.getAllProfiles = catchAsyncErrors(async (req, res, next) => {
//   const profiles = await User.find();
//   res.status(200).json({ success: true, count: profiles.length, profiles });
// });

// 📄 Get all profiles with filters
const moment = require('moment');

exports.getAllProfiles = catchAsyncErrors(async (req, res, next) => {
  const {
    search,
    location,
    skills,
    experience,
    salaryMin,
    salaryMax,
    jobTypes,
    education
  } = req.query;

  const queryObj = {};

  // 🔍 Text Search (Fullname or Username)
  if (search) {
    queryObj.$or = [
      { fullname: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } }
    ];
  }

  // 📍 Location Filter
  if (location) {
    queryObj.location = { $regex: location, $options: "i" };
  }

  // 🛠 Skills Filter
  if (skills) {
    const skillsArray = Array.isArray(skills) ? skills : [skills];
    queryObj.skills = { $in: skillsArray };
  }

  // 💰 Salary Expectation Filter
  if (salaryMin || salaryMax) {
    queryObj["desiredSalaryRange.min"] = { $gte: Number(salaryMin || 0) };
    queryObj["desiredSalaryRange.max"] = { $lte: Number(salaryMax || 100000000) };
  }

  // 🕒 Job Type Filter
  if (jobTypes) {
    const jobArray = Array.isArray(jobTypes) ? jobTypes : [jobTypes];
    queryObj.jobTypes = { $in: jobArray };
  }

  // 🎓 Education Filter
  if (education) {
    const eduArray = Array.isArray(education) ? education : [education];
    queryObj["education.degree"] = { $in: eduArray };
  }

  // 🔎 Get all matching profiles
  let profiles = await User.find(queryObj).lean();

  // 🔁 Calculate totalExperience
  profiles = profiles.map(profile => {
    let totalMonths = 0;
    if (profile.workExperience && Array.isArray(profile.workExperience)) {
      profile.workExperience.forEach(exp => {
        const start = exp.startDate ? moment(exp.startDate) : null;
        const end = exp.currentlyWorking
          ? moment()
          : exp.endDate ? moment(exp.endDate) : null;

        if (start && end && end.isAfter(start)) {
          totalMonths += end.diff(start, 'months');
        }
      });
    }

    profile.totalExperience = Math.round((totalMonths / 12) * 10) / 10;
    return profile;
  });

  // 🧠 Experience Filter
  if (experience) {
    const experienceMap = {
      "Freshers": [0, 0.5],
      "1 - 2 Years": [1, 2],
      "2 - 4 Years": [2, 4],
      "4 - 6 Years": [4, 6],
      "10 - 15 Years": [10, 15],
      "15+ Years": [15, 100]
    };

    const cleanedExperience = experience.replace(/\s/g, ''); // remove spaces if needed
    const label = Object.keys(experienceMap).find(key => key.replace(/\s/g, '') === cleanedExperience);

    if (label) {
      const [minExp, maxExp] = experienceMap[label];
      profiles = profiles.filter(
        p => p.totalExperience >= minExp && p.totalExperience <= maxExp
      );
    }
  }

  res.status(200).json({
    success: true,
    count: profiles.length,
    profiles
  });
});



// 🔍 Get one profile
exports.getProfileById = catchAsyncErrors(async (req, res, next) => {
  const profile = await User.findById(req.params.id);
  if (!profile) return next(new ErrorHander("Profile not found", 404));
  res.status(200).json({ success: true, profile });
});

// ✏️ Update profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  let profile = await User.findById(req.params.id);
  if (!profile) return next(new ErrorHander("Profile not found", 404));

  profile = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, message: "Profile updated", profile });
});

// ❌ Delete profile
exports.deleteProfile = catchAsyncErrors(async (req, res, next) => {
  const profile = await User.findById(req.params.id);
  if (!profile) return next(new ErrorHander("Profile not found", 404));

  await profile.remove();
  res.status(200).json({ success: true, message: "Profile deleted" });
});

