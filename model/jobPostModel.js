const mongoose = require('mongoose');

const JobPostSchema = new mongoose.Schema({
    promotion: {
        type: String,
        enum: ['none', 'featured', 'highlighted'],
        default: 'none',
      },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employe",
        required: true
    },
    jobApplication: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobApplication", // Make sure this matches the name of your JobApplication model
}],
    jobTitle: {
        type: String,
        required: true,
    },
    tags: {
        type: [String],
        default: [],
    },
    jobRole: {
        type: [String],  // This allows multiple roles (array of strings)
        required: true,
        enum: [
            'Developer', 'Designer', 'Manager', 'QA', 'HR', 'Sales', 'Marketing', 'Support',
            'Software Engineer', 'Product Manager', 'Business Analyst', 'Data Scientist', 'UI/UX Designer',
            'System Architect', 'Backend Developer', 'Frontend Developer', 'Full Stack Developer',
            'Database Administrator', 'Network Engineer', 'DevOps Engineer', 'IT Support', 'Cloud Engineer',
            'Project Manager', 'Scrum Master', 'QA Tester', 'Product Owner', 'Operations Manager',
            'Technical Lead', 'Security Engineer', 'Sales Manager', 'Customer Support', 'Technical Writer',
            'Content Writer', 'SEO Specialist', 'Digital Marketing Manager', 'Social Media Manager',
            'E-commerce Manager', 'Product Designer', 'Business Development', 'Financial Analyst',
            'Accountant', 'Compliance Officer', 'Legal Counsel', 'Chief Technology Officer',
            'Chief Executive Officer', 'Chief Operating Officer', 'Chief Marketing Officer',
            'Chief Financial Officer', 'Chief Information Officer', 'Chief Human Resources Officer',
            'VP of Engineering', 'VP of Sales', 'VP of Marketing', 'Senior Software Engineer',
            'Junior Developer', 'Lead Developer', 'Mobile Developer', 'Frontend Engineer', 'Backend Engineer',
            'Data Analyst', 'Cloud Architect', 'IT Consultant', 'Game Developer', 'Blockchain Developer',
            'AI Engineer', 'Machine Learning Engineer', 'Business Intelligence Analyst', 'HR Manager',
            'Recruiter', 'E-learning Specialist', 'Sales Engineer', 'Business Consultant', 'Operations Analyst',
            'Data Engineer', 'Cloud Consultant', 'Penetration Tester', 'Product Marketing Manager',
            'Customer Success Manager', 'IT Project Manager', 'Retail Manager', 'Sales Consultant',
            'Marketing Consultant', 'Operations Director', 'Product Marketing Specialist', 'HR Director',
            'Network Administrator', 'Systems Administrator', 'JavaScript Developer', 'Python Developer',
            'Ruby Developer', 'Java Developer', 'PHP Developer', 'C++ Developer', 'C# Developer',
            'Perl Developer', 'Swift Developer', 'Scala Developer', 'Go Developer', 'Rust Developer',
            'Android Developer', 'iOS Developer', 'React Developer', 'Vue.js Developer', 'Angular Developer',
            'TypeScript Developer', 'SQL Developer', 'NoSQL Developer', 'Cybersecurity Analyst',
            'Security Consultant', 'Ethical Hacker', 'Chief Data Officer', 'Business Systems Analyst',
            'Data Visualization Specialist', 'Technical Support Engineer', 'Product Support Specialist',
            'Systems Engineer', 'Solution Architect', 'Salesforce Developer', 'SAP Consultant',
            'Azure Developer', 'AWS Engineer', 'Google Cloud Engineer', 'Digital Transformation Consultant',
            'Network Architect', 'Site Reliability Engineer', 'Marketing Analyst', 'Business Strategist',
            'Lead Architect', 'Frontend Architect', 'Backend Architect', 'Game Designer', 'Network Security Specialist'
        ],  // Add your roles here
        message: '{VALUE} is not a valid job role'  // Custom error message for invalid roles
    },

    salary: {
        min: {
            type: Number,
            required: false,
        },
        max: {
            type: Number,
            required: false,
        },
        salarytype: {
            type: String,
            enum: ['Hourly', 'Daily', 'Weekly', 'Monthly', 'Yearly'],
            required: false,
        },
        currency: {
            type: String,
            default: 'USD',
        },
    },
    advanceInfo: {
        education: {
            type: String,
        },
        experience: {
            type: String,
        },
        jobType: {
            type: String,
            enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Other'],
        },
        vacancies: {
            type: Number,
        },
        expirationDate: {
            type: Date,
        },
        jobLevel: {
            type: String,
            enum: ['Entry', 'Mid', 'Senior', 'Executive', 'Other'],
        },
    },
    applyMethod: {
        type: String,
        enum: ['Jobpilot', 'External', 'Email'],
        default: 'Jobpilot',
    },
    description: {
        type: String,
    },
    responsibilities: {
        type: String,
    },
    status: {
        type: String,
        enum: ["Active", "Closed", "Expired"],
        default: "Active",
    },
    expiryDate: {
        type: Date,
        default: null
    },
}, {
    timestamps: true,
});

// Optional: middleware to update status on save
JobPostSchema.pre('save', function (next) {
    if (this.expirationDate && new Date() > this.expirationDate) {
        this.status = 'Expired';
    }
    next();
});

const JobPost = mongoose.model('JobPost', JobPostSchema);
module.exports = JobPost;
