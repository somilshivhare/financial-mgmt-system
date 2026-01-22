const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
const supportAttachmentsDir = path.join(uploadsDir, 'support-attachments');

[uploadsDir, profilesDir, supportAttachmentsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId-timestamp-uuid.extension
    const ext = path.extname(file.originalname);
    const filename = `${req.user.id}-${Date.now()}-${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// File filter for profile photos
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPG, and WEBP images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
});

// Middleware for single profile photo upload
const uploadProfilePhoto = upload.single('photo');

// Storage for support ticket attachments
const supportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, supportAttachmentsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${req.user.id}-${Date.now()}-${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// File filter for support attachments
const supportFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, text, and Office documents are allowed.'), false);
  }
};

// Configure multer for support attachments
const supportUpload = multer({
  storage: supportStorage,
  fileFilter: supportFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
  },
});

// Middleware for multiple support ticket attachments
const uploadSupportAttachments = supportUpload.array('attachments', 5);

module.exports = { uploadProfilePhoto, profilesDir, uploadSupportAttachments, supportAttachmentsDir };

