const user = require("../models/user.models");
const Portfolio = require("../models/portfolio.models");
const trade = require("../models/trade.models");
const bcrypt = require("bcrypt");
const { createToken } = require("../middleware/auth.middleware");

async function registerUser(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const hash = await bcrypt.hash(password, 7);
    const newUser = new user({ username, email, password: hash });
    await newUser.save();
    await Portfolio.create({ userId: newUser._id, remainingBalance: 10000, funds: [] });
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const existingUser = await user.findOne({ email });
    if (!existingUser) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const accessToken = createToken(existingUser);
    res.json({ message: "Login successful", userId: existingUser._id, accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function updateUser(req, res) {
  try {
    const id = req.user.userId;
    const { username, email, password } = req.body;
    const hash = await bcrypt.hash(password, 7);
    const updatedUser = await user.findByIdAndUpdate(
      id,
      { username, email, password: hash },
      { new: true },
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteUser(req, res) {
  try {
    const id = req.user.userId;
    await Portfolio.deleteOne({ userId: id });
    await trade.deleteMany({ userId: id });
    const deletedUser = await user.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
};