const express = require("express");
const router = express.Router();
const user = require("../models/user.models.js");
const {
  getAllUsers,
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
} = require("../controllers/users.controllers.js");
const { verifyToken } = require("../middleware/auth.middleware.js");
router.get("/", getAllUsers);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.patch("/update/:id", verifyToken, updateUser);
router.delete("/delete/:id", verifyToken, deleteUser);

module.exports = router;
