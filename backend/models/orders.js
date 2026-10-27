const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, maxlength: 100 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    author: { type: String, trim: true, maxlength: 120, default: "" },
    price: { type: Number, required: true, min: 1 },
    image: { type: String, trim: true, maxlength: 2048, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userschema",
      required: true,
      index: true,
    },
    customer: {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
      phone: { type: String, trim: true, maxlength: 30, default: "" },
      address: { type: String, required: true, trim: true, maxlength: 1000 },
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0 && items.length <= 100,
        message: "An order must contain between 1 and 100 books",
      },
    },
    total: { type: Number, required: true, min: 1 },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "upi_qr", "cod", "paytm", "gpay", "paypal"],
      default: "razorpay",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "demo"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
      default: "placed",
    },
    razorpayOrderId: { type: String, sparse: true, unique: true },
    razorpayPaymentId: { type: String, sparse: true, unique: true },
    razorpayQrCodeId: { type: String, sparse: true, unique: true },
    razorpayQrCodeImageUrl: { type: String, trim: true, maxlength: 2048, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("orders", orderSchema);
