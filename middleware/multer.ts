/**
 * Multer strategy to upload images
 * @author Yousuf Kalim
 */
const multer = require("multer");

// Multer strategy for local uploading. (Read multer's documentation for more details)
exports.upload = multer({
  // to store images
  storage: multer.diskStorage({
    // Defining the path where we have to store the image
    destination: function (req: any, file: any, cb: any) {
      cb(null, "./uploads"); // Callback
    },
    // Creating a unique filename to avoid duplication error
    filename: function (req: any, file: any, cb: any) {
      cb(null, Date.now() + "-" + file.originalname); // Callback
    },
  }),
  // File size limit upto 5 mb
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});
