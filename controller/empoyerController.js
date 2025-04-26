const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const User = require("../model/employerModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const jwt = require('jsonwebtoken');
require("dotenv").config();

exports.socialLoginCallback = async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ success: false, message: "Authentication failed" });
  }

  // Send JWT token
  sendToken(user, 200, res);
};


//SignUp User
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  // console.log(req.body)
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

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const otpExpire = Date.now() + 15 * 60 * 1000; // Expires in 15 minutes

  const newUser = await User.create({
    fullname,
    username,
    email,
    password,
    role: "employee",
    otp,
    otpExpire,
  });

  // Send OTP email
  const message = `Your OTP for registration is: ${otp}. It will expire in 15 minutes.`;
  try {
    await sendEmail({
      email: newUser.email,
      subject: "OTP Verification - Registration",
      message,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully. OTP sent to your email.",
      newUser,
    });
  } catch (error) {
    await User.findByIdAndDelete(newUser._id); // Delete the user if email sending fails
    return next(new ErrorHander("Email could not be sent", 500));
  }
});



exports.sendOTP = catchAsyncErrors(async (req, res) => {
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

  if (!user) {
    return next(new ErrorHander("User does not exist. Please register.", 404));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHander("Incorrect password.", 401));
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
  try {
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
  } catch (error) {
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


//all employers
exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();

  const count = await User.countDocuments(); // total user count

  res.status(200).json({
    success: true,
    count,
    users,
  });
});
