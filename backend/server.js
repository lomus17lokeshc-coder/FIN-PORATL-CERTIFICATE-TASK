
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { Pool } = require("pg");
const multer = require("multer");

const PORT = process.env.PORT || 5000;
const UPLOAD_DIR = path.resolve(__dirname, process.env.UPLOAD_DIR || "uploads");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  password: process.env.DB_PASSWORD,
});

function createApp(database = pool, uploadDirectory = UPLOAD_DIR) {
  fs.mkdirSync(uploadDirectory, { recursive: true });

  const app = express();
  const allowedExtensions = new Set([".pdf", ".png", ".jpg", ".jpeg"]);
  const allowedMimeTypes = new Set(["application/pdf", "image/png", "image/jpeg"]);
  const storage = multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const originalName = file.originalname.replace(/[\\/]/g, "/").split("/").pop();
      const baseName = path.parse(originalName).name
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 80) || "certificate";
      callback(null, `${randomUUID()}-${baseName}${extension}`);
    },
  });
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 2, fieldSize: 1024 },
    fileFilter: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, allowedExtensions.has(extension) && allowedMimeTypes.has(file.mimetype));
    },
  });
  const removeUpload = async (filePath) => {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  };

  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
  app.use(express.json({ limit: "32kb" }));

  app.get("/", (_req, res) => {
    res.json({ message: "Certificate Management Backend is running!" });
  });

  app.get("/test", (_req, res) => {
    res.send("TEST ROUTE WORKING");
  });

  app.get("/api/certificates", async (_req, res) => {
    try {
      const result = await database.query(
        `SELECT id, student_name, certificate_name, file_name, status, uploaded_at
         FROM certificates
         ORDER BY uploaded_at DESC`
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching certificates:", error.message);
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  app.post("/api/certificates", async (req, res) => {
    try {
      await new Promise((resolve, reject) => {
        upload.single("certificate")(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    } catch (error) {
      const tooLarge = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";
      const message = tooLarge
        ? "Certificate files must be 5 MB or smaller."
        : error instanceof multer.MulterError
          ? "The upload must contain one certificate file and valid form fields."
          : "Only PDF, PNG, and JPEG certificate files are accepted.";
      res.status(tooLarge ? 413 : 400).json({ message });
      return;
    }

    const file = req.file;
    const studentName = typeof req.body.student_name === "string" ? req.body.student_name.trim() : "";
    const certificateName = typeof req.body.certificate_name === "string"
      ? req.body.certificate_name.trim()
      : "";

    if (!file || !studentName || studentName.length > 150 || !certificateName || certificateName.length > 200) {
      if (file) {
        try {
          await removeUpload(file.path);
        } catch (error) {
          console.error("Failed to remove invalid certificate upload:", error.message);
          res.status(500).json({ message: "Failed to discard invalid certificate upload" });
          return;
        }
      }
      res.status(400).json({
        message: "Provide a student name (up to 150 characters), certificate name (up to 200 characters), and a PDF, PNG, or JPEG file.",
      });
      return;
    }

    try {
      const content = await fs.promises.readFile(file.path);
      const isPdf = file.mimetype === "application/pdf" && content.subarray(0, 5).toString() === "%PDF-";
      const isPng = file.mimetype === "image/png" &&
        content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const isJpeg = file.mimetype === "image/jpeg" &&
        content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff;

      if (!isPdf && !isPng && !isJpeg) {
        await removeUpload(file.path);
        res.status(400).json({ message: "The uploaded file content does not match a supported PDF or image." });
        return;
      }

      const result = await database.query(
        `INSERT INTO certificates (student_name, certificate_name, file_name, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id, student_name, certificate_name, file_name, status, uploaded_at`,
        [studentName, certificateName, file.filename, "Pending Review"]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      try {
        await removeUpload(file.path);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") {
          console.error("Failed to remove rejected certificate upload:", cleanupError.message);
        }
      }
      console.error("Error saving certificate:", error.message);
      res.status(500).json({ message: "Failed to save certificate" });
    }
  });

  return app;
}

module.exports = { createApp };

if (require.main === module) {
  const app = createApp();
  pool.query("SELECT NOW()")
    .then(() => console.log("PostgreSQL connected successfully!"))
    .catch((error) => console.error("Database connection failed:", error.message));

  const server = app.listen(PORT, () => {
    console.log(`Backend server loaded from ${__filename}`);
    console.log(`Backend server running at http://localhost:${PORT}`);
  });
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Stop the other server or choose a different PORT.`);
      process.exitCode = 1;
      return;
    }
    console.error("Backend server failed to start:", error.message);
    process.exitCode = 1;
  });
}
