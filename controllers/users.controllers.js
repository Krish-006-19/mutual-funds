const user = require("../models/user.models");
const Portfolio = require("../models/portfolio.models");
const trade = require("../models/trade.models");
const bcrypt = require("bcrypt");
const { createToken } = require("../middleware/auth.middleware");
const mongoose = require("mongoose");

async function registerUser(req, res) {
  const session = await mongoose.startSession();
  try {
    const { username, password } = req.body;
    const email = req.body.email.trim().toLowerCase();
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const hash = await bcrypt.hash(password, 7);
    await session.withTransaction(async () => {
      const newUser = new user({ username, email, password: hash });
      await newUser.save({ session });
      await Portfolio.create(
        [{ userId: newUser._id, remainingBalance: 10000, username, funds: [] }],
        { session },
      );
    });
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await session.endSession();
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
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const accessToken = createToken(existingUser);
    res.json({
      message: "Login successful",
      userId: existingUser._id,
      accessToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function deleteUser(req, res) {
  const session = await mongoose.startSession();

  try {
    const id = req.user.userId;
    let deletedUser;

    await session.withTransaction(async () => {
      deletedUser = await user.findByIdAndDelete(id, { session });

      if (!deletedUser) {
        return;
      }

      await Portfolio.deleteOne({ userId: id }, { session });
      await trade.deleteMany({ userId: id }, { session });
    });

    if (!deletedUser) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Internal server error",
    });
  } finally {
    await session.endSession();
  }
}

module.exports = {
  registerUser,
  loginUser,
  deleteUser,
};
