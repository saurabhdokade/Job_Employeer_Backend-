const express = require('express');
const app = express();

// Your routes here
app.get('/', (req, res) => {
  res.send('Hello from backend on Vercel!');
});

const postJobRouts = require("../routes/jobPostRoutes");

app.use("/api/v1/", postJobRouts);
// Export for Vercel
module.exports = app;
