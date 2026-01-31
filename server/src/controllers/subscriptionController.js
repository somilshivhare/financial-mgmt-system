const { apiSuccess } = require('../utils/apiResponse');
const subscriptionService = require('../services/subscriptionService');
const dashboardService = require('../services/dashboardService');

const PLAN_PRICE_INR = {
  trial: 0,
  basic: 4999,
  professional: 14999,
  enterprise: 'Custom',
};

const buildSubscriptionUiModel = (sub) => {
  if (!sub) return null;
  const plan = (sub.plan || 'trial').toLowerCase();
  const now = new Date();
  const nextBillingDate = new Date(now);
  nextBillingDate.setDate(nextBillingDate.getDate() + 30);

  // If we have an explicit ends_at for trial, compute remaining days
  let trialDaysRemaining = null;
  if ((sub.status || '').toLowerCase() === 'trial' && sub.ends_at) {
    const endsAt = new Date(sub.ends_at);
    const diffDays = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    trialDaysRemaining = Number.isFinite(diffDays) ? Math.max(diffDays, 0) : null;
  }

  return {
    planName: plan,
    planDisplayName: sub.display_name || sub.plan,
    billingCycle: 'Monthly',
    amount: PLAN_PRICE_INR[plan] ?? 'Custom',
    nextBillingDate: nextBillingDate.toISOString(),
    status: sub.status || 'trial',
    trialDaysRemaining,
  };
};

const getSubscription = async (_req, res, next) => {
  try {
    // Backward-compatible admin/global endpoint (legacy)
    const sub = await subscriptionService.getSubscription();
    res.json(apiSuccess(sub));
  } catch (err) {
    next(err);
  }
};

const upsertSubscription = async (req, res, next) => {
  try {
    const sub = await subscriptionService.upsertSubscription(req.body);
    res.status(201).json(apiSuccess(sub, 'Subscription saved'));
  } catch (err) {
    next(err);
  }
};

// New endpoints used by the Subscription page
const getMySubscription = async (req, res, next) => {
  try {
    const sub = await subscriptionService.getSubscriptionForUser(req.user.id);
    res.json(apiSuccess(buildSubscriptionUiModel(sub)));
  } catch (err) {
    next(err);
  }
};

const getPlans = async (_req, res, next) => {
  try {
    const plans = await subscriptionService.listActivePlans();
    const uiPlans = plans.map((p) => {
      const plan = (p.plan_name || '').toLowerCase();
      const maxUsers = p.features?.max_users;
      const supportLevel = p.features?.support_level;

      const features = [];
      if (maxUsers !== undefined) {
        features.push(maxUsers === -1 ? 'Unlimited users' : `Up to ${maxUsers} users`);
      }
      if (p.storage_limit_gb !== undefined && p.storage_limit_gb !== null) {
        features.push(`${Number(p.storage_limit_gb)} GB storage`);
      }
      if (supportLevel) features.push(`${String(supportLevel)} support`);

      return {
        id: plan,
        name: (p.display_name || plan).replace(/\s*plan\s*$/i, '').trim() || plan,
        price: PLAN_PRICE_INR[plan] ?? 'Custom',
        billingCycle: '/month',
        featured: plan === 'professional',
        features,
        limits: {
          users: maxUsers === -1 ? 'Unlimited' : maxUsers,
          storage: p.storage_limit_gb !== undefined && p.storage_limit_gb !== null ? Number(p.storage_limit_gb) : undefined,
        },
      };
    });
    res.json(apiSuccess(uiPlans));
  } catch (err) {
    next(err);
  }
};

const getBilling = async (req, res, next) => {
  try {
    const bundle = await subscriptionService.getBillingBundleForUser(req.user.id);
    res.json(apiSuccess(bundle));
  } catch (err) {
    next(err);
  }
};

const upgrade = async (req, res, next) => {
  try {
    const planId = String(req.params.planId || '').toLowerCase();
    const allowed = new Set(['trial', 'basic', 'professional', 'enterprise']);
    if (!allowed.has(planId)) {
      return res.status(400).json(apiSuccess(null, `Unknown plan: ${planId}`));
    }

    const existing = await subscriptionService.getSubscriptionForUser(req.user.id);
    const fromPlan = existing?.plan || null;

    const updated = await subscriptionService.upsertSubscriptionForUser(req.user.id, {
      plan: planId,
      status: planId === 'trial' ? 'trial' : 'active',
    });

    await subscriptionService.appendSubscriptionHistory(req.user.id, {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: new Date().toISOString(),
      action: 'Plan changed',
      from: fromPlan,
      to: planId,
      amount: typeof PLAN_PRICE_INR[planId] === 'number' ? PLAN_PRICE_INR[planId] : 0,
    });

    res.json(apiSuccess(buildSubscriptionUiModel(updated), 'Subscription updated'));
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const existing = await subscriptionService.getSubscriptionForUser(req.user.id);
    const updated = await subscriptionService.upsertSubscriptionForUser(req.user.id, {
      status: 'canceled',
    });

    await subscriptionService.appendSubscriptionHistory(req.user.id, {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: new Date().toISOString(),
      action: 'Subscription canceled',
      from: existing?.plan || null,
      to: existing?.plan || null,
      amount: 0,
    });

    res.json(apiSuccess(buildSubscriptionUiModel(updated), 'Subscription canceled'));
  } catch (err) {
    next(err);
  }
};

const getUsage = async (req, res, next) => {
  try {
    const usage = await dashboardService.getSubscriptionUsage(req.user.id);
    res.json(apiSuccess(usage));
  } catch (err) {
    next(err);
  }
};

const downloadInvoice = async (req, res, next) => {
  try {
    const invoiceId = String(req.params.invoiceId || '').trim();
    if (!invoiceId) {
      return res.status(400).json(apiSuccess(null, 'Missing invoice id'));
    }

    // Placeholder PDF so the UI download button works even without a billing provider.
    // Minimal valid PDF content:
    const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 120 >>
stream
BT
/F1 18 Tf
72 720 Td
(Invoice ${invoiceId}) Tj
0 -30 Td
(This is a placeholder PDF.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000062 00000 n 
0000000117 00000 n 
0000000241 00000 n 
0000000416 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
486
%%EOF`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceId}.pdf"`);
    res.send(Buffer.from(pdf, 'utf8'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  // legacy (admin/global)
  getSubscription,
  upsertSubscription,

  // subscription page
  getMySubscription,
  getPlans,
  getBilling,
  upgrade,
  cancel,
  getUsage,
  downloadInvoice,
};

