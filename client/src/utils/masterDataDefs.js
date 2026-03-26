export const FORM_DEFS = {
  'company-profile': {
    title: 'Company Profile',
    description: 'Create or update your organization master details.',
    groups: [
      {
        title: 'Company Information',
        fields: [
          { key: 'logo', label: 'Logo', type: 'file', accept: 'image/*' },
          { key: 'companyName', label: 'Company Name / Legal Entity Name', type: 'text', required: true },
        ],
      },
      {
        title: 'Corporate Office Address',
        fields: [
          { key: 'corporateOfficeAddress', label: 'Corporate Office Address', type: 'textarea' },
          { key: 'corporateDistrict', label: 'District', type: 'text' },
          { key: 'corporateState', label: 'State', type: 'state' },
          { key: 'corporateCountry', label: 'Country', type: 'country' },
          { key: 'corporatePinCode', label: 'Pin Code', type: 'text' },
        ],
      },
      {
        title: 'Correspondence Address',
        fields: [
          { key: 'correspondenceAddress', label: 'Correspondence Address', type: 'textarea' },
          { key: 'correspondenceDistrict', label: 'District', type: 'text' },
          { key: 'correspondenceState', label: 'State', type: 'state' },
          { key: 'correspondenceCountry', label: 'Country', type: 'country' },
          { key: 'correspondencePinCode', label: 'Pin Code', type: 'text' },
        ],
      },
      {
        title: 'Other Office / Plant Details',
        allowMultiple: true,
        fields: [
          { key: 'officeType', label: 'Other Office / Plant Details', type: 'select', options: ['Plant Address', 'Site Office', 'Marketing Office'] },
          { key: 'otherOfficeAddress', label: 'Address', type: 'textarea' },
          { key: 'otherOfficeGST', label: 'GST No', type: 'text' },
          { key: 'otherOfficeDistrict', label: 'District', type: 'text' },
          { key: 'otherOfficeState', label: 'State', type: 'state' },
          { key: 'otherOfficeCountry', label: 'Country', type: 'country' },
          { key: 'otherOfficePinCode', label: 'Pin Code', type: 'text' },
        ],
      },
      {
        title: 'Contact Information',
        fields: [
          { key: 'contactPersonName', label: 'Contact Person Name', type: 'text' },
          { key: 'contactNumber', label: 'Contact Number', type: 'tel' },
          { key: 'emailId', label: 'Email ID', type: 'email' },
        ],
      },
    ],
  },
  'customer-profile': {
    title: 'Customer Profile',
    description: 'Maintain customer master for invoicing and follow-ups.',
    groups: [
      {
        title: 'Customer Information',
        fields: [
          { key: 'logo', label: 'Logo', type: 'file', accept: 'image/*' },
          { key: 'customerName', label: 'Customer Name', type: 'text', required: true },
          { key: 'legalEntityName', label: 'Legal Entity Name', type: 'text' },
        ],
      },
      {
        title: 'Corporate Office Address',
        allowMultiple: true,
        fields: [
          { key: 'corporateOfficeAddress', label: 'Corporate Office Address', type: 'textarea' },
        ],
      },
      {
        title: 'Correspondence Address',
        allowMultiple: true,
        fields: [
          { key: 'correspondenceAddress', label: 'Correspondence Address', type: 'textarea' },
          { key: 'district', label: 'District', type: 'text' },
          { key: 'state', label: 'State', type: 'state' },
          { key: 'country', label: 'Country', type: 'country' },
          { key: 'pinCode', label: 'Pin Code', type: 'text' },
        ],
      },
      {
        title: 'Business Details',
        fields: [
          { key: 'segment', label: 'Segment', type: 'select', options: ['Domestic', 'Export'] },
          { key: 'gstNo', label: 'GST No', type: 'text' },
        ],
      },
      {
        title: 'Contact Information',
        fields: [
          { key: 'poIssuingAuthority', label: 'PO Issuing Authority / Contact Person Name', type: 'text' },
          { key: 'designation', label: 'Designation', type: 'text' },
          { key: 'contactPersonContactNo', label: 'Contact Person Contact No', type: 'tel' },
          { key: 'emailId', label: 'Email ID', type: 'email' },
        ],
      },
    ],
  },
  'consignee-profile': {
    title: 'Consignee Profile',
    description: 'Ship-to location master for delivery and compliance.',
    groups: [
      {
        title: 'Consignee Information',
        allowMultiple: true,
        fields: [
          { key: 'logo', label: 'Logo', type: 'file', accept: 'image/*' },
          { key: 'consigneeName', label: 'Consignee Name', type: 'text', required: true },
        ],
      },
      {
        title: 'Consignee Address',
        allowMultiple: true,
        fields: [
          { key: 'consigneeAddress', label: 'Consignee Address', type: 'textarea' },
        ],
      },
      {
        title: 'Customer Details',
        allowMultiple: true,
        fields: [
          { key: 'customerName', label: 'Customer Name', type: 'customerSelect', optionValueKey: 'customerName', optionLabelKey: 'customerName' },
          { key: 'legalEntityName', label: 'Legal Entity Name', type: 'customerSelect', optionValueKey: 'legalEntityName', optionLabelKey: 'legalEntityName' },
        ],
      },
      {
        title: 'Location Details',
        allowMultiple: true,
        fields: [
          { key: 'city', label: 'City', type: 'text' },
          { key: 'state', label: 'State', type: 'state' },
          { key: 'country', label: 'Country', type: 'country' },
          { key: 'consigneeGSTNo', label: 'Consignee GST No', type: 'text' },
        ],
      },
      {
        title: 'Contact Information',
        allowMultiple: true,
        fields: [
          { key: 'contactPersonName', label: 'Contact Person Name', type: 'text' },
          { key: 'designation', label: 'Designation', type: 'text' },
          { key: 'contactPersonContactNo', label: 'Contact Person Contact No', type: 'tel' },
          { key: 'emailId', label: 'Email ID', type: 'email' },
        ],
      },
    ],
  },
  'payer-profile': {
    title: 'Payer Profile',
    description: 'Bill-to party master for payments and credit control.',
    groups: [
      {
        title: 'Payer Information',
        allowMultiple: true,
        fields: [
          { key: 'logo', label: 'Logo', type: 'file', accept: 'image/*' },
          { key: 'payerName', label: 'Payer Name', type: 'text', required: true },
        ],
      },
      {
        title: 'Payer Address',
        allowMultiple: true,
        fields: [
          { key: 'payerAddress', label: 'Payer Address', type: 'textarea' },
        ],
      },
      {
        title: 'Customer Details',
        allowMultiple: true,
        fields: [
          { key: 'customerName', label: 'Customer Name', type: 'customerSelect', optionValueKey: 'customerName', optionLabelKey: 'customerName' },
          { key: 'legalEntityName', label: 'Legal Entity Name', type: 'customerSelect', optionValueKey: 'legalEntityName', optionLabelKey: 'legalEntityName' },
        ],
      },
      {
        title: 'Location Details',
        allowMultiple: true,
        fields: [
          { key: 'city', label: 'City', type: 'text' },
          { key: 'state', label: 'State', type: 'state' },
          { key: 'country', label: 'Country', type: 'country' },
          { key: 'payerGSTNo', label: 'Payer GST No', type: 'text' },
        ],
      },
      {
        title: 'Contact Information',
        allowMultiple: true,
        fields: [
          { key: 'contactPersonName', label: 'Contact Person Name', type: 'text' },
          { key: 'designation', label: 'Designation', type: 'text' },
          { key: 'contactPersonContactNo', label: 'Contact Person Contact No', type: 'tel' },
          { key: 'emailId', label: 'Email ID', type: 'email' },
        ],
      },
    ],
  },
  'employee-profile': {
    title: 'Employee Profile',
    description: 'Employee master for sales operations and approvals.',
    groups: [
      {
        title: 'Role & Identity',
        allowMultiple: true,
        fields: [
          { key: 'role', label: 'Role', type: 'select', options: ['Sales Manager', 'Sales Head', 'Business Head', 'Collection Incharge', 'Sales Agent', 'Collection Agent', 'Project Manager', 'Project Head', 'Transporter'] },
          { key: 'photo', label: 'Photo', type: 'file', accept: 'image/*' },
          { key: 'nameOfEmployee', label: 'Name of Employee', type: 'text', required: true },
          { key: 'designation', label: 'Designation', type: 'text' },
          { key: 'transporterName', label: 'Transporter Name', type: 'text' },
        ],
      },
      {
        title: 'Contact Information',
        allowMultiple: true,
        fields: [
          { key: 'contactNo', label: 'Contact No', type: 'tel' },
          { key: 'emailId', label: 'Email ID', type: 'email' },
        ],
      },
      {
        title: 'Employment Details',
        allowMultiple: true,
        fields: [
          { key: 'department', label: 'Department', type: 'text' },
          { key: 'jobRole', label: 'Job Role', type: 'text' },
        ],
      },
    ],
  },
};

export const FORM_STEPS = [
  { key: 'company-profile', order: 1 },
  { key: 'customer-profile', order: 2 },
  { key: 'consignee-profile', order: 3 },
  { key: 'payer-profile', order: 4 },
  { key: 'employee-profile', order: 5 },
  { key: 'review-submit', order: 6 },
];

export const FORM_TYPES = FORM_STEPS.filter(step => step.key !== 'review-submit').map(step => step.key);
