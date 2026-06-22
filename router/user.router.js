const express = require("express");
const router = express.Router();
const user = require("../models/user.models.js");
const {
  registerUser,
  loginUser,
  deleteUser,
} = require("../controllers/users.controllers.js");
const { verifyToken } = require("../middleware/auth.middleware.js");
router.post("/register", registerUser);
router.post("/login", loginUser);
router.delete("/delete", verifyToken, deleteUser);

module.exports = router;
