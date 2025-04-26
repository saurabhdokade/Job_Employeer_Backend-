const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const cors = require('cors');

// Middlewares
const errorMiddleware = require("./middlewares/error");
const userRoutes = require("./routes/employerRoutes");
const overviewRoutes = require("./routes/overviewRoutes");
const postJobRouts = require("./routes/jobPostRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const SubscriptionRoutes = require("./routes/subscriptionRoute");



// Initialize Express App
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*", credentials: true }));
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Serve Static Uploads Folder
// app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1", overviewRoutes);
app.use("/api/v1/", postJobRouts);
app.use("/api/v1", candidateRoutes);
app.use("/api/v1/", SubscriptionRoutes);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  keyGenerator: (req) => req.ip,
});
app.use(limiter);

const passport = require("passport");
require("../Backend/config/passport");

app.use(passport.initialize());


// Error Handling
app.use(errorMiddleware);

module.exports = app;
