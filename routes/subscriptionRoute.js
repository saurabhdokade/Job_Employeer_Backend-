const express = require('express');
const { 
  createSubscription,
  cancelSubscription,
  getAllPlans, 
  getAllSubscriptions, 
  getSubscriptionById, 
  updateSubscription, 
  getLatestSubscription,
  deleteSubscription,
  savePaymentCard,
  updatePaymentCard,
  getLatestInvoices 
} = require('../controller/subscriptionController');
const { isAuthenticatedUser } = require('../middlewares/auth');

const router = express.Router();

router.post('/plan/create', isAuthenticatedUser, createSubscription);
router.put('/plan/cancel', isAuthenticatedUser, cancelSubscription);
router.get('/plans/all', getAllPlans);
router.get("/invoices/all", getLatestInvoices);

router.get('/plan/all', getAllSubscriptions);
router.get('/:id', getSubscriptionById);
router.put('/:id', isAuthenticatedUser, updateSubscription);
router.delete('/:id', isAuthenticatedUser, deleteSubscription);
router.get('/latest/invoice',isAuthenticatedUser, getLatestSubscription);


//card
router.post('/save-card', savePaymentCard);
router.put('/card/:id', updatePaymentCard);

module.exports = router;
