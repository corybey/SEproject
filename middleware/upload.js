const multer = require("multer");

let storage;

// If you're in a test environment, skip GridFS
if (process.env.NODE_ENV === "test") {
  storage = multer.memoryStorage();
} else {
  const { GridFsStorage } = require("multer-gridfs-storage");
  storage = new GridFsStorage({
    url: process.env.MONGO_URI,
    file: (req, file) => {
      return {
        filename: `${Date.now()}-${file.originalname}`
      };
    }
  });
}

module.exports = multer({ storage });

