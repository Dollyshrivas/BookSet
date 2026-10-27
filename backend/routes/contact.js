const router = require("express").Router();
const mongoose = require("mongoose");
const Contact = require("../models/contact");

router.post("/contact", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "Database not connected. Please try again in a moment.",
    });
  }

  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

  if (!name || name.length > 120) {
    return res.status(400).json({ message: "Enter your name (up to 120 characters)" });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address" });
  }
  if (!message || message.length > 5000) {
    return res.status(400).json({ message: "Message is required and must be 5000 characters or fewer" });
  }

  try {
    await Contact.create({ name, email, message });
    return res.status(201).json({ message: "Your message has been sent successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not save your message. Please try again." });
  }
});

module.exports = router;
