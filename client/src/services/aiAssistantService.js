/**
 * AI Assistant Service
 * 
 * Analyzes business data and generates intelligent, context-aware responses
 * to help users understand their financial status and navigate the system.
 */

/**
 * Format currency for display
 */
const formatCurrency = (amount, currency = 'INR') => {
  if (!amount && amount !== 0) return 'N/A'
  const currencySymbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  }
  const symbol = currencySymbols[currency] || currency
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(currency, symbol)
}

/**
 * Get page-specific quick actions (for "What can I do here?")
 */
const getPageQuickActions = (pathname) => {
  const actions = {
    '/dashboard': [
      { action: 'Create Invoice', description: 'Start a new invoice', path: '/invoices/new' },
      { action: 'Record Payment', description: 'Record a payment received', path: '/payments/new' },
      { action: 'Add Customer', description: 'Add a new customer in Master Data', path: '/master-data/new/customer-profile' },
      { action: 'Create PO', description: 'Create a new purchase order', path: '/po-entry/new' },
      { action: 'View Invoices', description: 'See all invoices', path: '/invoices' },
    ],
    '/invoices': [
      { action: 'New Invoice', description: 'Create a new invoice', path: '/invoices/new' },
      { action: 'View Dashboard', description: 'Back to overview', path: '/dashboard' },
    ],
    '/payments': [
      { action: 'Record Payment', description: 'Record a new payment', path: '/payments/new' },
      { action: 'View Invoices', description: 'See invoices', path: '/invoices' },
    ],
    '/po-entry': [
      { action: 'New PO', description: 'Create a new purchase order', path: '/po-entry/new' },
      { action: 'View Invoices', description: 'See invoices', path: '/invoices' },
    ],
    '/collection': [
      { action: 'View Invoices', description: 'See invoices to plan collections', path: '/invoices' },
      { action: 'View Dashboard', description: 'Back to overview', path: '/dashboard' },
    ],
    '/master-data': [
      { action: 'New Customer', description: 'Add customer profile', path: '/master-data/new/customer-profile' },
      { action: 'New Entry', description: 'Start new master data', path: '/master-data/new' },
    ],
    '/reports': [
      { action: 'View Dashboard', description: 'Back to overview', path: '/dashboard' },
    ],
    '/notifications': [
      { action: 'View Dashboard', description: 'Back to overview', path: '/dashboard' },
    ],
    '/profile': [
      { action: 'Settings', description: 'Open settings', path: '/settings' },
    ],
    '/support': [
      { action: 'Dashboard', description: 'Back to overview', path: '/dashboard' },
    ],
    '/settings': [
      { action: 'Profile', description: 'Edit your profile', path: '/profile' },
    ],
  }
  for (const [path, list] of Object.entries(actions)) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      return list
    }
  }
  return [
    { action: 'Dashboard', description: 'Go to overview', path: '/dashboard' },
    { action: 'Invoices', description: 'View invoices', path: '/invoices' },
    { action: 'Payments', description: 'View payments', path: '/payments' },
  ]
}

/**
 * Get page context based on current route
 */
const getPageContext = (pathname) => {
  const contexts = {
    '/dashboard': {
      name: 'Dashboard',
      description: 'Your business overview and financial control center',
      keyMetrics: ['outstanding', 'collected', 'overdue', 'targets'],
    },
    '/finance': {
      name: 'Finance',
      description: 'Financial transactions and cash flow management',
      keyMetrics: ['transactions', 'balance', 'income', 'expenses'],
    },
    '/invoices': {
      name: 'Invoices',
      description: 'Invoice management and tracking',
      keyMetrics: ['invoice_count', 'outstanding', 'overdue', 'status'],
    },
    '/payments': {
      name: 'Payments',
      description: 'Payment recording and tracking',
      keyMetrics: ['payments', 'collected', 'pending', 'cleared'],
    },
    '/collection': {
      name: 'Collection Plan',
      description: 'Collection planning and follow-up management',
      keyMetrics: ['plans', 'targets', 'achieved', 'upcoming'],
    },
    '/master-data': {
      name: 'Master Data',
      description: 'Customer, vendor, and business data management',
      keyMetrics: ['customers', 'vendors', 'products', 'entities'],
    },
    '/po-entry': {
      name: 'PO Entry',
      description: 'Create and manage purchase orders',
      keyMetrics: ['pos', 'pending', 'approved', 'invoiced'],
    },
    '/reports': {
      name: 'Reports',
      description: 'Business reports and analytics',
      keyMetrics: ['reports', 'analytics', 'insights', 'trends'],
    },
    '/notifications': {
      name: 'Notifications',
      description: 'System and activity notifications',
      keyMetrics: ['notifications', 'unread'],
    },
    '/subscription': {
      name: 'Subscription',
      description: 'Subscription and usage management',
      keyMetrics: ['plan', 'usage', 'storage'],
    },
    '/profile': {
      name: 'My Profile',
      description: 'Your profile and account details',
      keyMetrics: ['profile', 'account'],
    },
    '/support': {
      name: 'Support',
      description: 'Contact support and help',
      keyMetrics: ['tickets', 'help'],
    },
    '/settings': {
      name: 'Settings',
      description: 'Application settings and configuration',
      keyMetrics: ['preferences', 'account', 'notifications'],
    },
  }

  // Find matching context
  for (const [path, context] of Object.entries(contexts)) {
    if (pathname.startsWith(path)) {
      return context
    }
  }

  return {
    name: 'Application',
    description: 'Business finance and operations management',
    keyMetrics: [],
  }
}

/**
 * Generate comprehensive business summary
 */
export const generateBusinessSummary = (dashboardData, currentPage) => {
  if (!dashboardData) {
    return {
      summary: "I'm here to help you understand your business, but I need to load your data first. Please wait a moment while I gather your financial information.",
      insights: [],
      recommendations: [],
    }
  }

  const kpis = dashboardData.kpis || {}
  const invoiceInsights = dashboardData.invoiceInsights || {}
  const paymentsCollections = dashboardData.paymentsCollections || {}
  const currency = dashboardData.kpis?.currency || 'INR'

  const totalOutstanding = kpis.totalOutstanding || 0
  const totalCollected = kpis.totalCollected || 0
  const totalOverdue = kpis.totalOverdue || 0
  const collectionTarget = kpis.collectionTarget || 0
  const collectionAchieved = kpis.collectionAchieved || 0
  const targetAchieved = kpis.collectionTargetAchieved || 0
  const duesCurrentMonth = kpis.duesCurrentMonth || 0

  const insights = []
  const recommendations = []

  // Build summary
  let summary = `Here's a complete overview of your business right now:\n\n`

  // Financial Health
  summary += `**Financial Overview:**\n`
  summary += `You have ${formatCurrency(totalOutstanding, currency)} in outstanding receivables. `
  summary += `So far, you've collected ${formatCurrency(totalCollected, currency)} in payments. `

  if (totalOverdue > 0) {
    summary += `⚠️ **Important:** You have ${formatCurrency(totalOverdue, currency)} in overdue amounts that need immediate attention. `
    insights.push({
      type: 'warning',
      title: 'Overdue Amounts',
      message: `${formatCurrency(totalOverdue, currency)} in overdue invoices require immediate follow-up.`,
    })
    recommendations.push({
      priority: 'high',
      action: 'Review overdue invoices',
      description: 'Check the Invoices page to see which customers have overdue payments and follow up with them.',
      path: '/invoices',
    })
  }

  if (duesCurrentMonth > 0) {
    summary += `This month, you have ${formatCurrency(duesCurrentMonth, currency)} coming due. `
  }

  // Collection Performance
  if (collectionTarget > 0) {
    summary += `\n\n**Collection Performance:**\n`
    summary += `Your collection target is ${formatCurrency(collectionTarget, currency)}, and you've achieved ${targetAchieved.toFixed(1)}% of it. `
    
    if (targetAchieved < 70) {
      summary += `You're below target and may want to focus on collections. `
      insights.push({
        type: 'info',
        title: 'Collection Target',
        message: `You're at ${targetAchieved.toFixed(1)}% of your collection target. Consider prioritizing follow-ups.`,
      })
      recommendations.push({
        priority: 'medium',
        action: 'Review Collection Plan',
        description: 'Check your collection plan to see upcoming follow-ups and prioritize high-value invoices.',
        path: '/collection',
      })
    } else if (targetAchieved >= 100) {
      summary += `Excellent! You've exceeded your target. `
      insights.push({
        type: 'success',
        title: 'Target Achieved',
        message: `Congratulations! You've exceeded your collection target.`,
      })
    } else {
      summary += `You're making good progress. `
    }
  }

  // Invoice Status
  const invoiceStatus = invoiceInsights.byStatus || []
  if (invoiceStatus.length > 0) {
    summary += `\n\n**Invoice Status:**\n`
    const statusSummary = invoiceStatus
      .map(s => `${s.count} ${s.status}`)
      .join(', ')
    summary += `You have ${statusSummary} invoices. `
  }

  // Upcoming Follow-ups
  const upcomingFollowUps = paymentsCollections.upcomingFollowUps || []
  if (upcomingFollowUps.length > 0) {
    summary += `\n\n**Upcoming Actions:**\n`
    summary += `You have ${upcomingFollowUps.length} follow-up(s) scheduled. `
    if (upcomingFollowUps.length > 5) {
      insights.push({
        type: 'info',
        title: 'Multiple Follow-ups',
        message: `You have ${upcomingFollowUps.length} follow-ups scheduled. Consider prioritizing by amount or due date.`,
      })
    }
  }

  // Recommendations based on data
  if (totalOutstanding > 0 && totalCollected === 0) {
    recommendations.push({
      priority: 'medium',
      action: 'Record Payments',
      description: 'Start recording payments to track your collections and improve cash flow visibility.',
      path: '/payments/new',
    })
  }

  if (invoiceStatus.find(s => s.status === 'draft' && s.count > 0)) {
    recommendations.push({
      priority: 'low',
      action: 'Review Draft Invoices',
      description: 'You have draft invoices that can be finalized and sent to customers.',
      path: '/invoices',
    })
  }

  return {
    summary,
    insights: insights.slice(0, 3), // Limit to top 3
    recommendations: recommendations.slice(0, 3), // Limit to top 3
  }
}

/**
 * Generate page-specific context and guidance
 */
export const generatePageContext = (pathname, pageData) => {
  const context = getPageContext(pathname)
  
  let guidance = `You're currently on the **${context.name}** page. `
  guidance += `${context.description}.\n\n`

  switch (pathname) {
    case '/dashboard':
      guidance += `**What you can do here:**\n`
      guidance += `• View your financial KPIs and metrics at a glance\n`
      guidance += `• See recent invoices, payments, and collections\n`
      guidance += `• Check notifications\n`
      guidance += `• Access quick actions to create invoices, record payments, or add customers\n`
      guidance += `• Analyze trends with interactive charts\n\n`
      guidance += `**Quick Tips:**\n`
      guidance += `• Use the date range filter to view different time periods\n`
      guidance += `• Click on any KPI card to see more details\n`
      guidance += `• Use the search and filters to find specific invoices\n`
      break

    case '/finance':
      guidance += `**What you can do here:**\n`
      guidance += `• View all financial transactions\n`
      guidance += `• Track income and expenses\n`
      guidance += `• Analyze cash flow trends\n`
      guidance += `• Export financial reports\n\n`
      break

    case '/invoices':
    case '/invoices/new':
      guidance += `**What you can do here:**\n`
      guidance += `• View all your invoices\n`
      guidance += `• Create new invoices\n`
      guidance += `• Track invoice status (draft, open, paid, overdue)\n`
      guidance += `• Filter by customer, date, or status\n`
      guidance += `• See which invoices need attention\n\n`
      if (pathname === '/invoices') {
        guidance += `**To create a new invoice:** Click the "New Invoice" button or use the quick action on the Dashboard.\n`
      }
      break

    case '/payments':
    case '/payments/new':
      guidance += `**What you can do here:**\n`
      guidance += `• Record payments received from customers\n`
      guidance += `• Track payment status (pending, cleared)\n`
      guidance += `• View payment history\n`
      guidance += `• Link payments to specific invoices\n\n`
      if (pathname === '/payments') {
        guidance += `**To record a payment:** Click the "New Payment" button.\n`
      }
      break

    case '/collection':
      guidance += `**What you can do here:**\n`
      guidance += `• Create collection plans for invoices\n`
      guidance += `• Schedule follow-ups with customers\n`
      guidance += `• Track collection targets and achievements\n`
      guidance += `• View upcoming follow-up dates\n\n`
      break

    case '/master-data':
      guidance += `**What you can do here:**\n`
      guidance += `• Manage customer profiles\n`
      guidance += `• Add vendors and suppliers\n`
      guidance += `• Maintain product and service catalogs\n`
      guidance += `• Review and approve master data entries\n\n`
      break

    case '/reports':
      guidance += `**What you can do here:**\n`
      guidance += `• Generate financial reports\n`
      guidance += `• View analytics and insights\n`
      guidance += `• Export data for external analysis\n`
      guidance += `• Filter reports by date, customer, or other criteria\n\n`
      break

    case '/po-entry':
    case '/po-entry/new':
      guidance += `**What you can do here:**\n`
      guidance += `• Create new purchase orders (POs)\n`
      guidance += `• Link POs to customers and line items\n`
      guidance += `• Set payment terms and delivery details\n`
      guidance += `• View and edit existing POs\n\n`
      if (pathname === '/po-entry') {
        guidance += `**To create a new PO:** Click "New PO" or go to PO Entry from the sidebar.\n`
      }
      break

    case '/notifications':
      guidance += `**What you can do here:**\n`
      guidance += `• View system and activity notifications\n`
      guidance += `• Mark notifications as read\n`
      guidance += `• Stay updated on invoices, payments, and approvals\n\n`
      break

    case '/notifications':
      guidance += `**What you can do here:**\n`
      guidance += `• View system and activity notifications\n`
      guidance += `• Mark notifications as read\n`
      guidance += `• Stay updated on invoices, payments, and approvals\n\n`
      break

    case '/subscription':
      guidance += `**What you can do here:**\n`
      guidance += `• View your current plan and usage\n`
      guidance += `• Check storage and limits\n`
      guidance += `• Upgrade or manage subscription\n\n`
      break

    case '/profile':
      guidance += `**What you can do here:**\n`
      guidance += `• View and edit your profile\n`
      guidance += `• Update contact and account details\n`
      guidance += `• Change password if needed\n\n`
      break

    case '/support':
      guidance += `**What you can do here:**\n`
      guidance += `• Create support tickets\n`
      guidance += `• View ticket status and history\n`
      guidance += `• Get help from the support team\n\n`
      break

    case '/settings':
      guidance += `**What you can do here:**\n`
      guidance += `• Configure application settings\n`
      guidance += `• Manage your account preferences\n`
      guidance += `• Set up notifications\n`
      guidance += `• Update business information\n\n`
      break

    default:
      guidance += `Use the sidebar navigation to access different sections of the application.\n`
  }

  return {
    pageName: context.name,
    description: context.description,
    guidance,
  }
}

/**
 * Generate response to user query
 */
export const generateResponse = (query, context) => {
  const lowerQuery = query.toLowerCase().trim()

  // Handle overview/summary requests
  if (
    lowerQuery.includes('summary') ||
    lowerQuery.includes('overview') ||
    lowerQuery.includes('explain everything') ||
    lowerQuery.includes('what is happening') ||
    lowerQuery.includes('tell me about') ||
    lowerQuery.includes('give me a full')
  ) {
    if (context.dashboardData) {
      const businessSummary = generateBusinessSummary(context.dashboardData, context.pathname)
      return {
        response: businessSummary.summary,
        insights: businessSummary.insights,
        recommendations: businessSummary.recommendations,
        type: 'summary',
      }
    }
    return {
      response: "I'd be happy to give you a complete overview! However, I need to load your dashboard data first. Please wait a moment, or try asking again in a few seconds.",
      type: 'info',
    }
  }

  // Handle specific questions
  if (lowerQuery.includes('outstanding') || lowerQuery.includes('receivables')) {
    const outstanding = context.dashboardData?.kpis?.totalOutstanding || 0
    const currency = context.dashboardData?.kpis?.currency || 'INR'
    return {
      response: `Your total outstanding receivables are **${formatCurrency(outstanding, currency)}**. This is the amount that customers owe you but haven't paid yet. You can view detailed invoice information on the Invoices page.`,
      type: 'info',
    }
  }

  if (lowerQuery.includes('overdue') || lowerQuery.includes('late')) {
    const overdue = context.dashboardData?.kpis?.totalOverdue || 0
    const currency = context.dashboardData?.kpis?.currency || 'INR'
    if (overdue > 0) {
      return {
        response: `You have **${formatCurrency(overdue, currency)}** in overdue amounts. These are invoices that have passed their due date and need immediate attention. I recommend reviewing the Invoices page and following up with these customers.`,
        type: 'warning',
        recommendations: [{
          priority: 'high',
          action: 'Review Overdue Invoices',
          description: 'Check the Invoices page to see which invoices are overdue.',
          path: '/invoices',
        }],
      }
    }
    return {
      response: `Great news! You don't have any overdue invoices right now. Keep up the good work with your collections!`,
      type: 'success',
    }
  }

  if (lowerQuery.includes('collected') || lowerQuery.includes('payments received')) {
    const collected = context.dashboardData?.kpis?.totalCollected || 0
    const currency = context.dashboardData?.kpis?.currency || 'INR'
    return {
      response: `You've collected **${formatCurrency(collected, currency)}** in payments so far. This represents the total amount you've received from customers. You can view detailed payment records on the Payments page.`,
      type: 'info',
    }
  }

  // "Take me to" / "Open" / "Go to" navigation
  if (
    lowerQuery.includes('take me to') ||
    lowerQuery.includes('open ') ||
    lowerQuery.includes('go to ') ||
    lowerQuery.includes('show me ')
  ) {
    const navTargets = [
      { match: 'collection', path: '/collection', label: 'Collection Plan', description: 'Plan follow-ups and track collection targets.' },
      { match: 'master data', path: '/master-data', label: 'Master Data', description: 'Manage customers, vendors, and business data.' },
      { match: 'reports', path: '/reports', label: 'Reports', description: 'View reports and analytics.' },
      { match: 'invoices', path: '/invoices', label: 'Invoices', description: 'View and manage invoices.' },
      { match: 'payments', path: '/payments', label: 'Payments', description: 'View and record payments.' },
      { match: 'dashboard', path: '/dashboard', label: 'Dashboard', description: 'Your business overview and quick actions.' },
      { match: 'po entry', path: '/po-entry', label: 'PO Entry', description: 'Create and manage purchase orders.' },
      { match: 'subscription', path: '/subscription', label: 'Subscription', description: 'View plan and usage.' },
      { match: 'profile', path: '/profile', label: 'My Profile', description: 'Your profile and account.' },
      { match: 'support', path: '/support', label: 'Support', description: 'Contact support and help.' },
      { match: 'settings', path: '/settings', label: 'Settings', description: 'Application settings.' },
    ]
    for (const t of navTargets) {
      if (lowerQuery.includes(t.match)) {
        return {
          response: `Opening **${t.label}** for you. ${t.description}`,
          type: 'navigation',
          recommendations: [{
            priority: 'high',
            action: `Go to ${t.label}`,
            description: t.description,
            path: t.path,
          }],
        }
      }
    }
  }

  if (lowerQuery.includes('open reports') || lowerQuery.includes('show reports')) {
    return {
      response: 'Opening Reports. You can generate and view financial reports and analytics there.',
      type: 'navigation',
      recommendations: [{ priority: 'high', action: 'Open Reports', description: 'View reports and analytics.', path: '/reports' }],
    }
  }

  // "What can I do here?" – page-specific actions
  if (
    lowerQuery.includes('what can i do') ||
    lowerQuery.includes('what can i do here') ||
    lowerQuery.includes('help me with this page')
  ) {
    const pageContext = generatePageContext(context.pathname, context.pageData)
    const actions = getPageQuickActions(context.pathname)
    let response = `${pageContext.guidance}\n\n`
    if (actions.length > 0) {
      response += `**Quick actions you can take:**\n`
      actions.forEach((a) => {
        response += `• **${a.action}** – ${a.description}\n`
      })
    }
    return {
      response,
      type: 'guidance',
      recommendations: actions,
    }
  }

  if (lowerQuery.includes('how to') || lowerQuery.includes('how do i')) {
    // Specific how-to with navigation
    if (lowerQuery.includes('record a payment') || lowerQuery.includes('record payment')) {
      return {
        response: `**How to record a payment:**\n\n• Go to **Payments** from the sidebar\n• Click **"New Payment"** or **"Record Payment"**\n• Select the customer and link the payment to the relevant invoice(s)\n• Enter the amount, date, and payment method\n• Save to update invoice balances and collection status\n\nI can take you to the Payments page to record a payment now.`,
        type: 'guidance',
        recommendations: [
          { priority: 'high', action: 'Record Payment', description: 'Go to Payments to record a new payment.', path: '/payments/new' },
        ],
      }
    }
    if (lowerQuery.includes('create a po') || lowerQuery.includes('create po') || lowerQuery.includes('purchase order')) {
      return {
        response: `**How to create a PO (Purchase Order):**\n\n• Go to **PO Entry** from the sidebar\n• Click **"New PO"** to create a new purchase order\n• Select the customer and add line items (products/services)\n• Set payment terms, delivery details, and dates\n• Save or submit for approval\n• Once approved, you can create invoices from the PO\n\nI can take you to PO Entry to create a new PO.`,
        type: 'guidance',
        recommendations: [
          { priority: 'high', action: 'Create PO', description: 'Go to PO Entry to create a new purchase order.', path: '/po-entry/new' },
        ],
      }
    }
    if (lowerQuery.includes('create an invoice') || lowerQuery.includes('create invoice')) {
      return {
        response: `**How to create an invoice:**\n\n• Go to **Invoices** from the sidebar\n• Click **"New Invoice"** or use the quick action on the Dashboard\n• Select the customer and add line items (or link to a PO)\n• Set due date, payment terms, and tax if needed\n• Save as draft or submit\n• Track status (draft, open, paid, overdue) on the Invoices page\n\nI can take you to create a new invoice.`,
        type: 'guidance',
        recommendations: [
          { priority: 'high', action: 'Create Invoice', description: 'Go to Invoices to create a new invoice.', path: '/invoices/new' },
        ],
      }
    }
    if (lowerQuery.includes('add customer') || lowerQuery.includes('add a customer')) {
      return {
        response: `**How to add a customer:**\n\n• Go to **Master Data** from the sidebar\n• Click **"New"** and choose **Customer Profile**\n• Enter customer name, contact details, and address\n• Set payment terms and other defaults if needed\n• Save and review in Master Data\n\nI can take you to Master Data to add a customer.`,
        type: 'guidance',
        recommendations: [
          { priority: 'high', action: 'Add Customer', description: 'Go to Master Data to add a new customer.', path: '/master-data/new/customer-profile' },
        ],
      }
    }
    const pageContext = generatePageContext(context.pathname, context.pageData)
    return {
      response: pageContext.guidance,
      type: 'guidance',
    }
  }

  if (lowerQuery.includes('what is') || lowerQuery.includes('what does')) {
    if (lowerQuery.includes('dashboard')) {
      return {
        response: `The Dashboard is your business control center. It shows you:\n\n• **Financial KPIs**: Outstanding amounts, collections, overdue invoices\n• **Recent Activity**: Latest invoices, payments, and follow-ups\n• **Analytics**: Charts showing trends over time\n• **Quick Actions**: Fast access to create invoices, record payments, or add customers\n• **Notifications**: Important updates about your business\n\nUse the date range filter to view different time periods, and click on any card to see more details.`,
        type: 'info',
      }
    }
    if (lowerQuery.includes('invoice')) {
      return {
        response: `An invoice is a document you send to customers requesting payment for goods or services. In this system, you can:\n\n• Create invoices with line items\n• Track invoice status (draft, open, paid, overdue)\n• Set due dates and payment terms\n• Link invoices to purchase orders\n• View invoice history and analytics\n\nTo create a new invoice, go to the Invoices page and click "New Invoice".`,
        type: 'info',
      }
    }
  }

  // Default response
  const pageContext = generatePageContext(context.pathname, context.pageData)
  return {
    response: `I'm here to help! You can ask me:\n\n• **"Give me a summary"** – Overview of your business and receivables\n• **"What's overdue?"** – Check overdue invoices\n• **"Total outstanding?"** – See total receivables\n• **"How do I create an invoice?"** – Step-by-step guide\n• **"How do I record a payment?"** – Record a payment\n• **"How do I create a PO?"** – Create a purchase order\n• **"Open Collection Plan"** / **"Open Master Data"** / **"Open Reports"** – Go to that section\n• **"What can I do here?"** – Actions on this page\n• **"Show notifications"** – View notifications\n\nYou're on **${pageContext.pageName}**. ${pageContext.description}. What would you like to do?`,
    type: 'help',
  }
}

