const mongoose = require('mongoose');
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const candidateProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
      },
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
    // phone: {
    //     type: String,
    //     required: false,
    //     unique: true,
    //     sparse: true,
    //     match: [
    //         /^\+?[1-9]\d{1,14}$/,
    //         "Please provide a valid phone number with a country code",
    //     ],
    //     maxlength: [15, "Phone number cannot be longer than 15 characters"],
    // },
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
        enum: ["employee", "admin", "user"],
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

    // 👤 Basic Details
    fullName: String,
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    contactNumber: String,
    email: String,
    location: String,
    about: {
        type: String,
    },

    // 🎓 Education
    education: [{
        degree: String,
        institution: String,
        graduationYear: Number,
        specialization: String
    }],

    // 💼 Work Experience
    workExperience: [{
        jobTitle: String,
        companyName: String,
        startDate: Date,
        endDate: Date,
        currentlyWorking: Boolean,
        responsibilities: String
    }],

    // 🏅 Certifications
    certifications: [{
        name: String,
        issuingOrganization: String,
        credentialId: String,
        dateOfCompletion: Date
    }],

    // 🛠 Skills & Preferences
    skills: [String],
    jobTypes: [String], // e.g., ["Full Time", "Freelance"]
    preferredDesignation: String,
    preferredLocation: String,
    desiredSalaryRange: {
        min: Number,
        max: Number
    },

    totalExperience: {
        type: Number,
        default: 0
      },
    // 📄 Documents
    photo: String, // URL or file path
    resume: String,
    additionalDocuments: [String],
    coverletter:String,
    // ⏱ Timestamp
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
candidateProfileSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

candidateProfileSchema.pre('save', function (next) {
    let totalExp = 0;
  
    if (this.workExperience && Array.isArray(this.workExperience)) {
      this.workExperience.forEach(exp => {
        if (!exp.startDate) return;
  
        const start = new Date(exp.startDate);
        const end = exp.currentlyWorking || !exp.endDate ? new Date() : new Date(exp.endDate);
        const years = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
        totalExp += years;
      });
    }
  
    this.totalExperience = Math.round(totalExp * 10) / 10; // round to 1 decimal place
    next();
  });
  
// Compare entered password
candidateProfileSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
candidateProfileSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "7d",
    });
};

// Generate password reset token
candidateProfileSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    return resetToken;
};

candidateProfileSchema.methods.generateVerificationCode = function () {
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

module.exports = mongoose.model('userProfile', candidateProfileSchema);
