const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/employerModel");
const Candidate = require("../model/candidateModel")
// exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
//   const token = req.cookies.token; // Token from cookies

//   if (!token) {
//     return next(new ErrorHander("Unauthorized access. Token required.", 401));
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = await User.findById(decoded.userId); // Find user by ID in MongoDB

//     if (!req.user) {
//       return next(new ErrorHander("User not found.", 404));
//     }

//     next();
//   } catch (error) {
//     return next(new ErrorHander("Invalid or expired token.", 401));
//   }
// });

// exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
//   const token = req.header("Authorization"); // Token from Authorization header

//   if (!token || !token.startsWith("Bearer ")) {
//     return next(new ErrorHander("Unauthorized access. Token required.", 401));
//   }

//   try {
//     const tokenValue = token.split(" ")[1]; // Extract token after "Bearer"
//     const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET || "HFFNSJGKFDAUGJDGDNBJ444GDGGhbhFGDU");
//     req.user = await User.findById(decoded.userId); // Find user by ID in MongoDB

//     // if (!req.user) {
//     //   return next(new ErrorHander("User not found.", 404));
//     // }

//     next();
//   } catch (error) {
//     return next(new ErrorHander("Invalid or expired token.", 401));
//   }
// });
// exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
//   const token = req.header("Authorization"); // Token from Authorization header

//   // Check if the token exists and starts with "Bearer "
//   if (!token || !token.startsWith("Bearer ")) {
//     return next(new ErrorHander("Unauthorized access. Token required.", 401));
//   }

//   try {
//     // Extract the token value after "Bearer "
//     const tokenValue = token.split(" ")[1];
    
//     // Verify the token and decode it
//     const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);

//     // Fetch user from database based on the decoded user ID
//     req.user = await User.findById(decoded.userId);

//     // If no user found, return an error
//     if (!req.user) {
//       return next(new ErrorHander("User not found.", 404));
//     }

//     // Proceed to the next middleware or route handler
//     next();
//   } catch (error) {
//     // Handle errors such as invalid token or expired token
//     return next(new ErrorHander("Invalid or expired token.", 401));
//   }
// });
exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  try {
      let token = req.header("Authorization");

      // console.log("Token:", token); // Log the token for debugging

      if (!token || !token.startsWith("Bearer ")) {
          return res.status(401).json({ msg: "Access Denied: No token provided" });
      }

      token = token.split(" ")[1];
      // console.log("Token after split:", token); // Log the token for debugging

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("Decoded:", decoded); // Log the decoded payload for debugging

      const user = await User.findById(decoded.id).select("-password");
      if (!user)
          return res.status(401).json({ msg: "Access Denied: Invalid User" });

      req.user = user;
      next();
  } catch (error) {
      console.error("Token verification error:", error); // Log the error for debugging
      res.status(401).json({ msg: "Invalid token!" });
  }
});

exports.isAuthenticatedCandidate = catchAsyncErrors(async (req, res, next) => {
  try {
      let token = req.header("Authorization");

      // console.log("Token:", token); // Log the token for debugging

      if (!token || !token.startsWith("Bearer ")) {
          return res.status(401).json({ msg: "Access Denied: No token provided" });
      }

      token = token.split(" ")[1];
      // console.log("Token after split:", token); // Log the token for debugging

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("Decoded:", decoded); // Log the decoded payload for debugging

      const user = await Candidate.findById(decoded.id).select("-password");
      if (!user)
          return res.status(401).json({ msg: "Access Denied: Invalid User" });

      req.user = user;
      next();
  } catch (error) {
      console.error("Token verification error:", error); // Log the error for debugging
      res.status(401).json({ msg: "Invalid token!" });
  }
});

exports.authorizeRoles = (...roles) =>{

    return(req,res,next)=>{
       if(!roles.includes(req.user.role)){
       return next(new ErrorHander(
            `Role: ${req.user.role} is not allowed to access this resource`,
            403
          )
         )
       }
       
      next();
    }
}

exports.authorizeRolesAgent = (...roles) =>{

  return(req,res,next)=>{
     if(!roles.includes(req.user.role)){
     return next(new ErrorHander(
          `Role: ${req.agent.role} is not allowed to access this resource`,
          403
        )
       )
     }
     
    next();
  }
}