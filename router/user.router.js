const express = require("express");
const router = express.Router();
const user = require("../models/user.models.js");
const {
    registerUser,
    loginUser,
    updateUser,
    deleteUser,
    getAllUsers
} = require("../controllers/users.controllers.js");

router.get("/", getAllUsers);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.patch("/update/:id", updateUser);
router.delete("/delete/:id", deleteUser);

module.exports = router;