# NB Aurum – User View Report

**Document purpose:** This report explains the NB Aurum application from an end-user perspective: what the system is, who uses it, and how to work with it day to day.

---

## 1. What is NB Aurum?

**NB Aurum** is a business management application that helps companies:

- Manage **customer and company information** (master data)
- Create and track **purchase orders (POs)**
- Issue and manage **invoices**
- Record and track **payments**
- Plan and monitor **collections**
- View **reports** and a **dashboard**
- Handle **support requests** and **notifications**

It is used over the web: you log in and work in your browser. The system remembers your role (e.g. Admin, Finance, Sales) and shows you the screens and actions that fit your job.

---

## 2. Who Uses the System?

Users have different **roles**. What you see and can do depends on your role:

| Role        | Typical use |
|------------|-------------|
| **Admin**  | Full access: users, settings, master data, POs, invoices, payments, collections, reports, support. |
| **Finance**| Invoices, payments, collections, reports, and related master data. |
| **Operations** | POs, master data (customers, consignees, payers, etc.), and related workflows. |
| **Sales**  | Customers, POs, and sales-related data. |
| **Viewer** | Read-only access to view data as allowed by the system. |

When you log in, the **Dashboard** and menu options are adjusted to your role.

---

## 3. Logging In and Getting Started

1. Open the application in your browser and go to the **Login** page.
2. Enter your **email** and **password** and sign in.
3. After login you are taken to the **Dashboard**.

From the Dashboard you can:

- See a summary of business metrics (e.g. invoices, payments, collections).
- Use **quick actions** (e.g. Create Invoice, Record Payment, Add Customer, Create PO) if your role allows them.
- Open **notifications** to see important updates.
- Navigate to other sections using the main menu or links.

---

## 4. Main Areas of the Application

### 4.1 Dashboard

- Central place after login.
- Shows high-level numbers and charts (e.g. revenue, outstanding amounts, status of invoices and payments).
- Quick links to create invoices, record payments, add customers, and create POs (depending on your role).
- You can use date ranges and filters to focus on a specific period or customer.

### 4.2 Master Data

Master data is the **foundation information** used across the system: your company, customers, consignees, payers, employees, and payment terms.

**How it works:**

- You can fill master data in a **step-by-step flow** (wizard) or go to a specific step.
- **Steps** typically include:
  1. **Company Profile** – Your organisation’s name, addresses, contact, logo.
  2. **Customer Profile** – One or more customers (you can add multiple with “Add Another Customer”).
  3. **Consignee Profile** – Ship-to parties; you can pick Customer Name and Legal Entity from the Customer step.
  4. **Payer Profile** – Bill-to parties; again you can select from customers entered earlier.
  5. **Employee Profile** – People (e.g. sales, collection).
  6. **Payment Terms** – How and when you get paid (e.g. due dates, basic/freight/taxes).
  7. **Review** – Check all data and publish.

- You can **save as draft** and continue later, or **publish** when ready.
- After publishing, this data is used when creating POs, invoices, and payments.

**Important for users:**

- All fields you enter in master data are saved.
- In **Consignee** and **Payer** steps, “Customer Name” and “Legal Entity Name” can be chosen from a **dropdown** filled from the Customer step, or you can choose “Other” and type a value.

### 4.3 Purchase Orders (PO Entry)

- Create and manage **purchase orders**.
- You can link a PO to a **customer** from master data.
- Typical flow: create PO → add lines → submit. You can also edit and view existing POs.
- POs feed into invoicing and tracking.

### 4.4 Invoices

- **Create** new invoices (e.g. from POs or manually).
- **View** and **edit** existing invoices.
- Track status (e.g. draft, sent, paid, overdue).
- Invoices appear in the dashboard and reports.

### 4.5 Payments

- **Record payments** received against invoices.
- View payment history and link payments to customers/invoices.
- Payment data is used in collections and reports.

### 4.6 Collection Plan

- Plan and monitor **collections** (what is due, from whom, and when).
- Uses customer and payment data to help prioritise follow-ups.
- Often used by finance and operations.

### 4.7 Reports

- **Reports** give you summaries and lists (e.g. by customer, period, or type).
- You can use them to analyse revenue, outstanding amounts, and performance.
- Access depends on your role.

### 4.8 Notifications

- **Notifications** alert you to important events (e.g. new invoice, payment received, master data changes).
- You can open the Notifications screen to see and manage them.
- Unread count is often shown in the header or dashboard.

### 4.9 Profile and Settings

- **My Profile** – Update your name, email, password, and view your permissions.
- **Settings** – Configure application preferences (e.g. company name, defaults). Often restricted to admins.

### 4.10 Support

- **Support** (or Contact Support) lets you raise **support tickets** or contact the team.
- You can describe your issue or request and submit it from the application.

### 4.11 Subscription

- **Subscription** is where you can view or manage your **subscription plan** (if the organisation uses paid plans).
- What you see here depends on how your company uses the product.

### 4.12 Meetings / MoM (Minutes of Meeting)

- **Meetings** and **MoM** (Minutes of Meeting) allow you to create and edit meeting records.
- Useful for tracking decisions and action items from internal or customer meetings.

### 4.13 Admin Dashboard

- Available to **admin** users.
- Used to manage **users**, **roles**, and **system-wide settings**.
- Not visible to standard users.

---

## 5. Typical User Journeys (Examples)

### Setting up the company and customers

1. Log in and go to **Master Data**.
2. Start the wizard or open **Company Profile** and enter your company details (name, addresses, contact). Save.
3. Go to **Customer Profile** and add one or more customers (use “Add Another Customer” if needed). Save.
4. In **Consignee** and **Payer** steps, select “Customer Name” and “Legal Entity Name” from the dropdowns (filled from the Customer step), or choose “Other” and type. Save.
5. Complete **Employee** and **Payment Terms** as needed.
6. Use **Review** to check everything, then **Publish**.

### Creating an invoice and recording payment

1. From the Dashboard or menu, go to **Invoices** → **Create** (or New).
2. Fill in the invoice (customer, amounts, etc.) and save/submit.
3. When payment is received, go to **Payments** → **Record Payment** (or New).
4. Enter the payment and link it to the correct invoice/customer. Save.
5. The dashboard and reports will reflect the new payment and updated outstanding balance.

### Checking what is due (collections)

1. Go to **Collection Plan**.
2. Use the view to see what is due from which customers and when.
3. Use this to prioritise follow-ups and update payments in the system as money is received.

---

## 6. Data and Saving

- **Master data:** All fields you enter in the 6 steps (Company, Customer, Consignee, Payer, Employee, Payment Terms) are saved. You can save each step as draft and come back, or publish when ready.
- **Other screens:** Buttons like **Save**, **Save Draft**, **Save & Continue**, and **Publish** are used depending on the screen. Success messages or modals (e.g. “Save & Exit”, “Save & Create Another”) appear after a successful save; your data is already stored at that point.

---

## 7. Getting Help

- Use **Notifications** to see system alerts and reminders.
- Use **Support** (or Contact Support) to send a question or report an issue.
- Check **My Profile** to see your permissions if something is missing from the menu.
- For access or role changes, contact your **administrator**.

---

## 8. Summary

**NB Aurum** is a web-based business management application for:

- **Master data** (company, customers, consignees, payers, employees, payment terms),
- **Purchase orders**, **invoices**, and **payments**,
- **Collections** and **reports**,
- **Notifications**, **support**, and **profile/settings**.

What you see and can do depends on your **role** (Admin, Finance, Operations, Sales, or Viewer). The report above describes the application from a **user’s point of view** so that anyone can understand the purpose of each area and how to use it in daily work.
