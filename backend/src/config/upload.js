// src/config/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Absolute path to uploads/ at the backend root
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// Safety net — recreate folder if it was deleted
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Storage: write to disk with collision-safe filenames ──────────────────────
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),

    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `faydaImage-${unique}${ext}`);
        // result: faydaImage-1693000000000-482910234.jpg
    },
});

// ── Accept JPEG / PNG / WEBP only ─────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, and WEBP images are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
});

module.exports = upload;
