const express = require('express');
const app = express();

// Your routes here
app.get('/', (req, res) => {
  res.send('Hello from backend on Vercel!');
});

// Export for Vercel
module.exports = app;
