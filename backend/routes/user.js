const router = require("express").Router();
const userSchema = require("../models/userschema");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findUserByUsername = (username) => {
  const normalizedUsername = normalizeText(username);
  if (!normalizedUsername) return null;

  return userSchema.findOne({
    username: { $regex: new RegExp(`^${escapeRegex(normalizedUsername)}$`, "i") },
  });
};

const findUserByEmail = (email) => {
  const normalizedEmail = normalizeText(email).toLowerCase();
  if (!normalizedEmail) return null;

  return userSchema.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i") },
  });
};

router.post("/sign-up", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database not connected. Please try again in a moment.",
      });
    }

    const username = normalizeText(req.body?.username);
    const email = normalizeText(req.body?.email).toLowerCase();
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const address = normalizeText(req.body?.address);

    if (!username || username.length < 4) {
      return res.status(400).json({
        message: "Username length should be greater than 3",
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (!address || address.length < 3) {
      return res.status(400).json({ message: "Address is required" });
    }

    if (!password || password.length <= 5) {
      return res.status(400).json({
        message: "Password length should be greater than 5",
      });
    }

    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userSchema({
      username,
      email,
      password: hashedPassword,
      address,
    });

    await newUser.save();

    return res.status(201).json({
      message: "Sign-up successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

//sign-in option
router.post("/sign-in", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database not connected. Please try again in a moment.",
      });
    }

    const username = normalizeText(req.body?.username);
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    // check fields
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    // check username
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(400).json({
        message: "Invalid Username or password",
      });
    }
    if (!user.password || typeof user.password !== "string") {
      return res.status(400).json({
        message: "Invalid Username or password",
      });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid Username or password",
      });
    }

    // create session
    req.session.user = {
      id: user._id,
      email: user.email,
      username: user.username,
    };

    return res.status(200).json({
      message: "Sign-in successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

//get-user-information
router.get("/get-user-information", async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const data = await userSchema.findById(req.session.user.id).select("-password");
    if (!data) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

//logout handle
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }

    res.clearCookie("connect.sid"); // default session cookie
    return res.status(200).json({
      message: "Logged out successfully",
    });
  });
});

module.exports = router;
