const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const Subscription = require('../model/subscriptionModel');
const ErrorHander = require("../utils/errorhandler")
const moment = require("moment");
exports.createSubscription = catchAsyncErrors(async (req, res, next) => {
  const { price } = req.body;

  let planName;
  let postLimit;

  // 🎯 Auto Set Plan Name and Post Limit Based on Price
  switch (price) {
    case 99:
      planName = 'Basic';
      postLimit = 10;
      break;
    case 299:
      planName = 'Standard';
      postLimit = 50;
      break;
    case 499:
      planName = 'Premium';
      postLimit = 100;
      break;
    default:
      return next(new ErrorHander('Invalid Subscription Plan. Please select a valid plan (99, 299, 499)', 400));
  }

  const userId = req.user?._id;

  if (!userId) {
    return next(new ErrorHander('Unauthorized Access. Please login.', 401));
  }

  // ✅ Check for existing active subscription
  const existingSubscription = await Subscription.findOne({ userId, status: 'Active' });

  if (existingSubscription) {
    return next(new ErrorHander('You already have an active subscription', 400));
  }

  // ✅ Create new subscription
  const subscription = await Subscription.create({
    userId,
    planName,
    price,
    postLimit,
    status: 'Active',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 Days
  });

  res.status(201).json({
    success: true,
    message: 'Subscription Plan Created Successfully',
    subscription
  });
});

  // ✅ Cancel Subscription Controller
exports.cancelSubscription = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;
  
    // ✅ Check if User has an Active Subscription
    const subscription = await Subscription.findOne({ userId, status: 'Active' });
  
    if (!subscription) {
      return next(new ErrorHander('No Active Subscription Found', 404));
    }
  
    // ✅ Cancel Subscription (Change Status to Expired)
    subscription.status = 'Expired';
    await subscription.save();
  
    res.status(200).json({
      success: true,
      message: 'Subscription Canceled Successfully'
    });
  });

// Get All Subscription Plans
exports.getAllSubscriptions = catchAsyncErrors(async (req, res, next) => {
  const subscriptions = await Subscription.find();

  res.status(200).json({
    success: true,
    subscriptions
  });
});


exports.getLatestInvoices = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const [subscriptions, total] = await Promise.all([
    Subscription.find()
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .lean(),

    Subscription.countDocuments()
  ]);

  const invoices = subscriptions.map(sub => ({
    id: `#${sub._id.toString().slice(-6)}`, // last 6 chars as invoice ID
    date: moment(sub.createdAt).format("MMM D, YYYY HH:mm"),
    plan: sub.planName,
    amount: `₹${sub.price}`
  }));

  res.status(200).json({
    success: true,
    totalInvoices: total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    invoices
  });
});
// Get Single Subscription Plan
exports.getSubscriptionById = catchAsyncErrors(async (req, res, next) => {
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return next(new ErrorHander('Subscription not found', 404));
  }

  res.status(200).json({
    success: true,
    subscription
  });
});

// Update Subscription Plan
exports.updateSubscription = catchAsyncErrors(async (req, res, next) => {
  const subscription = await Subscription.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'Subscription Plan Updated Successfully',
    subscription
  });
});

// Delete Subscription Plan
exports.deleteSubscription = catchAsyncErrors(async (req, res, next) => {
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return next(new ErrorHander('Subscription not found', 404));
  }

  await subscription.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Subscription Plan Deleted Successfully'
  });
});


exports.getAllPlans = catchAsyncErrors(async (req, res, next) => {
    const plans = [
      {
        planName: 'Basic',
        price: 99,
        postLimit: 10,
        validity: '30 Days'
      },
      {
        planName: 'Standard',
        price: 299,
        postLimit: 50,
        validity: '30 Days'
      },
      {
        planName: 'Premium',
        price: 499,
        postLimit: 100,
        validity: '30 Days'
      }
    ];
  
    res.status(200).json({
      success: true,
      message: 'All Subscription Plans Fetched Successfully',
      plans
    });
  });
  

  exports.getLatestSubscription = async (req, res) => {
    try {
      const employerId = req.user.id; // assuming auth middleware sets req.user
  
      const latestSubscription = await Subscription.findOne({ 
        userId: employerId, 
        status: "Active" 
      }).sort({ createdAt: -1 });
  
      if (!latestSubscription) {
        return res.status(404).json({ 
          success: false, 
          message: "No active subscription found" 
        });
      }
  
      res.status(200).json({
        success: true,
        subscription: {
          planName: latestSubscription.planName,
          price: latestSubscription.price,
          postLimit: latestSubscription.postLimit,
          status: latestSubscription.status,
          createdAt: latestSubscription.createdAt,
          expiresAt: latestSubscription.expiresAt,
        },
      });
  
    } catch (error) {
      console.error("Error fetching latest subscription:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };



const PaymentCard = require('../model/paymentCard.js'); // Adjust path as needed

exports.savePaymentCard = async (req, res) => {
  try {
    const { cardHolderName, cardNumber, expiryDate, cvv } = req.body;

    // Basic validation (optional, better to validate via middleware like Joi)
    if (!cardHolderName || !cardNumber || !expiryDate || !cvv) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const newCard = new PaymentCard({
      cardHolderName,
      cardNumber,
      expiryDate,
      cvv // ⚠️ Only store for mock/testing purposes
    });

    await newCard.save();

    res.status(201).json({
      success: true,
      message: 'Card saved successfully (mock)',
      data: {
        cardHolderName: newCard.cardHolderName,
        cardNumber: `**** **** **** ${newCard.cardNumber.slice(-4)}`,
        expiryDate: newCard.expiryDate
        // Do NOT return CVV in real-world apps
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

  

exports.updatePaymentCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { cardHolderName, cardNumber, expiryDate, cvv } = req.body;

    // Basic validation
    if (!cardHolderName || !cardNumber || !expiryDate || !cvv) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Find and update the card
    const updatedCard = await PaymentCard.findByIdAndUpdate(
      id,
      {
        cardHolderName,
        cardNumber,
        expiryDate,
        cvv // ⚠️ Avoid storing this in production
      },
      { new: true, runValidators: true }
    );

    if (!updatedCard) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Card updated successfully (mock)',
      data: {
        cardHolderName: updatedCard.cardHolderName,
        cardNumber: `**** **** **** ${updatedCard.cardNumber.slice(-4)}`,
        expiryDate: updatedCard.expiryDate
      }
    });

  } catch (err) {
    console.error("Error updating card:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
