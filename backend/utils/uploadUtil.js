/**
 * ── File Upload Utility (Multer) ───────────────────────────────
 * Configures Multer for disk storage with:
 *  • unique filenames (timestamp + random suffix)
 *  • 5 MB max file size
 *  • image & PDF file-type filter
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ── Storage engine ─────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

// ── File filter ────────────────────────────────────────────────
const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
];

const fileFilter = (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP) and PDFs are allowed'), false);
    }
};

// ── Export configured multer instance ──────────────────────────
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024 },
});

module.exports = upload;
