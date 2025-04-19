const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: [false, "Please enter your full name"],
      trim: true,
    },
    username: {
      type: String,
      required: [false, "Please enter your username"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [false, "Please enter your email"],
      unique: true,
      validate: [validator.isEmail, "Please enter a valid email address"],
      lowercase: true,
    },
    phone: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      match: [
        /^\+?[1-9]\d{1,14}$/,
        "Please provide a valid phone number with a country code",
      ],
      maxlength: [15, "Phone number cannot be longer than 15 characters"],
    },
    password: {
      type: String,
      required: [false, "Please enter your password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    otp: {
        type: String,
      },
      otpExpire: { // Fix spelling to match controller's property
        type: Date,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
    role: {
      type: String,
      enum: ["employee", "admin" ,"user"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    userProfile: {
      type: String,
      default:
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
    },
      verificationCode: {
    type: Number,
  },
  verificationCodeExpire: {
    type: Date,
  },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare entered password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

userSchema.methods.generateVerificationCode = function () {
    const generateRandomFiveDigitNumber = () => {
      const firstDigit = Math.floor(Math.random() * 9) + 1;
      const remainingDigits = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      return parseInt(firstDigit + remainingDigits);
    };
  
    const verificationCode = generateRandomFiveDigitNumber();
    this.verificationCode = verificationCode;
    this.verificationCodeExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiration
  
    return verificationCode;
};
module.exports = mongoose.model("Employe", userSchema);
