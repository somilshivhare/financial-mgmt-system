# Data Import & Migration – How We Can Do It

## Goal

Allow companies to bring **existing historical data** (invoices, payments, POs, customers, documents) into the platform so they can:

- Use the same analytics, reports, and workflows as for new data
- Transition from Excel/old software without losing history
- Optionally accept bulk uploads, API-based import, and manual bulk entry

---

## 1. Current System Snapshot (What We Have)

| Data type        | Stored in                         | Used by                          |
|------------------|-----------------------------------|----------------------------------|
| Companies        | `master_data` (type: company-profile) | Master Data, POs, Invoices       |
| Customers        | `customers` table + `master_data` (customer-profile) | POs, Invoices, Payments          |
| Purchase orders  | `purchase_orders` + `purchase_order_lines` | Invoices (invoice needs PO)      |
| Invoices         | `invoices` + `invoice_lines`      | Payments, Dashboard, Reports      |
| Payments         | `payments`                        | Invoices (updates amount_paid)   |
| Products         | `products` table                 | PO lines, Invoice lines          |
| Master profiles  | `master_data` (JSON)              | Company/Customer/Consignee/Payer |

**Important:** Invoices are linked to **PO** and **customer**. Payments are linked to **invoice**. So a typical import order is: **Customers → POs (optional) → Invoices → Payments**.

---

## 2. High-Level Approach

1. **Same storage**  
   Imported rows go into the **same tables** as new data (e.g. `invoices`, `payments`, `customers`, `master_data`). No separate “historical” store. That way:
   - Existing reports, dashboard, and analytics work as-is
   - Filters (e.g. date range) naturally include old and new data

2. **Mapping layer**  
   External data (CSV/Excel/API) rarely matches our schema exactly. We add a **mapping** step:
   - User picks or defines: “Column A = invoice_number, B = issue_date, C = total_amount…”
   - Optional: provide **templates** (e.g. “Download sample CSV for invoices”) so users align their file to our fields

3. **Reference resolution**  
   - **Customer:** Match by name/email/code, or create new customer (in `customers` or `master_data` depending on how we wire it) and use its ID.
   - **Invoice → PO:** If their data has no PO, we can create a “placeholder” or “import” PO per invoice (or one per customer) so FK is satisfied.
   - **Payment → Invoice:** Match by invoice number (or external ID) to get `invoice_id`.

4. **Validation & errors**  
   - Validate each row (required fields, types, dates, positive amounts).
   - Either **fail fast** (stop on first error) or **best effort** (skip bad rows, return a summary: X imported, Y failed with reasons).
   - Return a clear report (e.g. “Row 5: invalid date; Row 7: customer not found”).

5. **Idempotency / duplicates**  
   - Use business keys (e.g. invoice_number, payment reference + invoice + amount + date) to detect duplicates.
   - Option: “Skip”, “Update”, or “Allow duplicate” per import.

---

## 3. Four Ways to Get Data In (As You Asked)

### 3.1 CSV / Excel upload

- **Flow:** User uploads a file → backend parses it (e.g. `xlsx` / `csv-parse` on Node) → map columns to our schema → resolve references (customer, PO, invoice) → insert into DB.
- **Where:** New “Import” or “Data migration” section in the app (e.g. under Settings or a dedicated “Import” page).
- **Tech:** Multipart upload to something like `POST /api/v1/import/invoices` (or `/import/upload` with `entityType=invoices`). Use existing auth; optional: role restriction (e.g. admin only).
- **Limits:** Max file size (e.g. 5–10 MB), max rows per file (e.g. 1000). For larger files, use background job + status/polling or chunked upload.

### 3.2 Bulk document / dataset upload

- **Flow:** User uploads multiple files (e.g. PDFs, images, or one ZIP of CSVs/Excels). Backend:
  - If structured (CSV/Excel): same as 3.1 (parse and import).
  - If documents: store in existing `storage_files` (or similar), optionally attach to an entity (e.g. invoice_id) if we have a way to match (e.g. filename = invoice number).
- **Tech:** `POST /api/v1/import/bulk` with `multipart/form-data`; optional background job for large batches.

### 3.3 API-based import from other software

- **Flow:** External system calls our API with a list of records (e.g. invoices, payments). We authenticate them (API key or OAuth), validate, map, and insert.
- **Endpoints (examples):**
  - `POST /api/v1/import/invoices` – body: `{ "records": [ { "invoice_number": "...", "customer_name": "...", ... } ] }`
  - `POST /api/v1/import/payments` – body: `{ "records": [ { "invoice_number": "...", "amount": 100, "paid_at": "..." } ] }`
- **Tech:** Same mapping and validation as 3.1; optional webhook or response with `job_id` for async processing.

### 3.4 Manual bulk entry

- **Flow:** UI with a table or repeated form: user pastes or types many rows (e.g. 20–50 at a time), then clicks “Import”. Backend receives the same payload as API import and processes it.
- **Tech:** Reuse the same import service as 3.1 and 3.3; only the source of the payload changes (form vs file vs API).

---

## 4. What to Implement First (Phased Plan)

| Phase | What | Why first |
|-------|------|-----------|
| **1** | **Master data / Companies & customers** | Invoices and POs depend on customers. Importing customers (or company/customer profiles) unblocks later steps. |
| **2** | **Invoices (CSV/Excel + API)** | Highest value: historical invoices drive aging, reports, and dashboard. Support “invoice without PO” (e.g. placeholder PO) if their data has no POs. |
| **3** | **Payments (CSV/Excel + API)** | After invoices exist, link payments by invoice number (or ID). Update `invoices.amount_paid` / `balance` / `status` as today. |
| **4** | **POs (optional)** | If they have PO history, import POs then link invoices to them; otherwise keep using placeholder POs for invoice-only import. |
| **5** | **Bulk documents + API import** | Attach documents to imported (or existing) entities; expand API for other systems. |

---

## 5. Technical Components (Backend)

- **Routes:** e.g. `POST /api/v1/import/customers`, `POST /api/v1/import/invoices`, `POST /api/v1/import/payments`, `POST /api/v1/import/upload` (file).
- **Services:** `importService` (or `invoiceImportService`, `paymentImportService`) that:
  - Parse CSV/Excel (streaming for large files).
  - Map row → our schema (with optional user-defined or template mapping).
  - Resolve customer_id (and po_id if needed), create placeholder PO/customer when configured.
  - Validate row; then insert (reuse or extend existing `invoiceService.createInvoice`, `paymentService.createPayment`, etc.) in a transaction where possible.
- **Validation:** Reuse/align with existing validators; add import-specific rules (e.g. date format, allowed enums).
- **Auth:** All import endpoints behind `requireAuth`; optional `requireRole('admin')` or “import” permission.
- **Rate / size limits:** Limit request size and number of rows per request to avoid overload.

---

## 6. Technical Components (Frontend)

- **Import UI:** Page(s) under e.g. **Settings → Data import** or **Master Data → Import**:
  - Choose entity (Customers, Invoices, Payments).
  - Upload file (CSV/Excel) or paste / manual table.
  - Optional: download “template” CSV/Excel with our column names and one sample row.
  - Optional: column mapping (if we allow arbitrary column names).
  - “Import” button → call API → show progress and result (success count, errors per row).
- **Templates:** Provide sample files so users can fill them and re-upload.

---

## 7. Storing and Showing Old Data

- **Storage:** All imported rows go into the **same tables** (e.g. `invoices`, `payments`, `customers`, `master_data`). No separate “historical” table; optional `source` or `import_id` column later if we need to mark “imported” vs “created in app”.
- **Display:** No change needed: existing list pages, filters, and reports already read from these tables. Date range and status filters will include imported data.
- **Analytics:** Dashboard and reports use the same queries; they will automatically include imported data.

---

## 8. Order of Implementation (Concrete Steps)

1. **Design mapping for one entity (e.g. Invoices)**  
   - List required and optional fields.  
   - Define how to resolve customer (by name/code/create-if-missing) and PO (placeholder vs real).

2. **Backend: import service for that entity**  
   - Parse CSV/Excel (e.g. `xlsx` library; you already have it).  
   - Map columns (fixed or configurable).  
   - Resolve references; insert via existing services (or minimal new INSERTs that match existing logic).  
   - Return summary + per-row errors.

3. **Backend: POST /api/v1/import/invoices** (and optionally customers first).  
   - Auth, rate limit, max body size.  
   - Call import service; return JSON result.

4. **Frontend: Import page**  
   - Upload file (or paste) → send to API → show result.  
   - Optional: template download.

5. **Repeat for Payments** (and optionally Customers/POs).  
6. **Add API-based import** (same service, different entry point).  
7. **Optional: bulk document upload** and linking to entities.

---

## 9. Risks and Mitigations

| Risk | Mitigation |
|------|-------------|
| Duplicate imports | Use business key (e.g. invoice_number) to skip or update; show “already exists” in result. |
| Bad data | Validation + per-row errors; don’t fail entire file if one row is bad (configurable). |
| Large files | Streaming parse; chunked processing; background job + status endpoint. |
| Wrong mapping | Provide templates; optional “preview” (first 5 rows) before full import. |
| FK failures (e.g. customer not found) | Create customer on-the-fly (optional) or return clear error and row number. |

---

## 10. Summary: “How We Can Do It”

- **Same structure:** Import into the same tables as new data so reports and analytics work seamlessly.
- **Four entry points:** (1) CSV/Excel upload, (2) bulk document upload, (3) API import, (4) manual bulk entry in UI.
- **One pipeline per entity:** Mapping → validation → reference resolution (customer, PO, invoice) → insert.
- **Phased:** Start with customers/master data, then invoices, then payments, then POs and documents.
- **Backend:** New import routes + import service(s) that reuse existing create services where possible.
- **Frontend:** Import page(s) with file upload, optional template and mapping, and clear success/error report.

If you tell me which entity you want to implement first (e.g. **Invoices** or **Customers**), the next step is to define the exact CSV/Excel format and the mapping rules, then implement the backend import endpoint and a minimal Import UI for that entity.
