// models/SavedCandidate.js
const mongoose = require('mongoose');

const savedCandidateSchema = new mongoose.Schema({
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobApplication',
        required: true
    },    
    recruiterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employ',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userProfile',
        required: true
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobPost',
        required: true
    },
    savedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SavedCandidate', savedCandidateSchema);
