const mongoose = require("mongoose");

const bookListingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    author: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    price: { type: Number, required: true, min: 1 },
    image: { type: String, trim: true, maxlength: 2048, default: "" },
    imageData: { type: Buffer, select: false },
    imageContentType: { type: String, enum: ["image/jpeg", ""], default: "" },
    condition: {
      type: String,
      enum: ["New", "Like new", "Good", "Acceptable"],
      default: "Good",
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userschema",
      required: true,
      index: true,
    },
    sellerName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("booklisting", bookListingSchema);