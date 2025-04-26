const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const User = require("../model/employerModel");

// Serialize/Deserialize user if needed
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || "772146215356-vofbc6i2a4i2jm6b05gsqc0joku37b1i.apps.googleusercontent.com",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "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",
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: profile.displayName,
      email,
      password: "GOOGLE_LOGIN" // dummy password
    });
  }

  done(null, user);
}));

// Facebook Strategy
// passport.use(new FacebookStrategy({
//   clientID: process.env.FB_APP_ID,
//   clientSecret: process.env.FB_APP_SECRET,
//   callbackURL: "/auth/facebook/callback",
//   profileFields: ["id", "emails", "name"]
// }, async (accessToken, refreshToken, profile, done) => {
//   const email = profile.emails?.[0]?.value;
//   if (!email) return done(new Error("No email associated"));

//   let user = await User.findOne({ email });
//   if (!user) {
//     user = await User.create({
//       name: `${profile.name.givenName} ${profile.name.familyName}`,
//       email,
//       password: "FACEBOOK_LOGIN"
//     });
//   }

//   done(null, user);
// }));

// LinkedIn Strategy
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID || "86r02c2go4zonw",
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "WPL_AP1.hlZNAdHO6Yj5pwpp.MGop5w==",
  callbackURL: "/auth/linkedin/callback",
  scope: ["r_emailaddress", "r_liteprofile"],
}, async (accessToken, tokenSecret, profile, done) => {
  const email = profile.emails[0].value;
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: profile.displayName,
      email,
      password: "LINKEDIN_LOGIN"
    });
  }

  done(null, user);
}));
