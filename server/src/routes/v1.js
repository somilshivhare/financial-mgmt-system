const express = require('express');
const authRoutes = require('./v1/auth');
const dashboardRoutes = require('./v1/dashboard');
const masterDataRoutes = require('./v1/masterData');
const poRoutes = require('./v1/po');
const invoiceRoutes = require('./v1/invoice');
const paymentRoutes = require('./v1/payment');
const collectionRoutes = require('./v1/collection');
const momRoutes = require('./v1/mom');
const alertsRoutes = require('./v1/alerts');
const settingsRoutes = require('./v1/settings');
const subscriptionRoutes = require('./v1/subscription');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/master-data', masterDataRoutes);
router.use('/pos', poRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/collections', collectionRoutes);
router.use('/mom', momRoutes);
router.use('/alerts', alertsRoutes);
router.use('/settings', settingsRoutes);
router.use('/subscription', subscriptionRoutes);

module.exports = router;