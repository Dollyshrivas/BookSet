const router = require("express").Router();
const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const BookListing = require("../models/booklisting");
const Order = require("../models/orders");
const catalogBooks = require("../../shared/books.json");

const requireUser = (req, res, next) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ message: "Please sign in to save and view your orders" });
  }

  next();
};

const databaseUnavailable = (res) =>
  res.status(503).json({ message: "Database not connected. Please try again in a moment." });

const getRazorpayConfig = () => ({
  keyId: process.env.RAZORPAY_KEY_ID || process.env.TEST_API_KEY,
  keySecret: process.env.RAZORPAY_KEY_SECRET || process.env.TEST_SECRET_KEY,
});

const createRazorpayClient = () => {
  const { keyId, keySecret } = getRazorpayConfig();
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const validSignature = (expectedHex, receivedHex) => {
  if (typeof receivedHex !== "string" || !/^[a-f0-9]{64}$/i.test(receivedHex)) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(receivedHex, "hex");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

const validateCustomer = (input) => {
  const customer = input || {};
  const name = typeof customer.name === "string" ? customer.name.trim() : "";
  const email = typeof customer.email === "string" ? customer.email.trim().toLowerCase() : "";
  const phone = typeof customer.phone === "string" ? customer.phone.trim() : "";
  const address = typeof customer.address === "string" ? customer.address.trim() : "";

  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { error: "Enter a valid name and email address" };
  }
  if (phone.length > 30 || !address || address.length > 1000) {
    return { error: "Enter a valid shipping address and phone number" };
  }

  return { customer: { name, email, phone, address } };
};

const loadPricedItems = async (rawItems, req) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 100) {
    throw Object.assign(new Error("Your order must contain between 1 and 100 books"), { status: 400 });
  }

  const ids = rawItems.map((item) =>
    typeof item?.id === "string" || typeof item?.id === "number" ? String(item.id) : ""
  );
  if (ids.some((id) => !id || id.length > 100) || new Set(ids).size !== ids.length) {
    throw Object.assign(new Error("Your cart contains an invalid or duplicate book"), { status: 400 });
  }

  const catalogById = new Map(catalogBooks.map((book) => [String(book.id), book]));
  const listingIds = ids.filter((id) => !catalogById.has(id));
  if (listingIds.some((id) => !mongoose.isValidObjectId(id))) {
    throw Object.assign(new Error("A book in your cart is no longer available"), { status: 400 });
  }

  const listings = listingIds.length
    ? await BookListing.find({ _id: { $in: listingIds } }).select("-imageData").lean()
    : [];
  const listingsById = new Map(listings.map((listing) => [String(listing._id), listing]));

  return ids.map((id) => {
    const book = catalogById.get(id);
    if (book) {
      return {
        productId: id,
        title: book.title,
        author: book.author,
        price: book.price,
        image: book.image,
      };
    }

    const listing = listingsById.get(id);
    if (!listing) {
      throw Object.assign(new Error("A book in your cart is no longer available"), { status: 400 });
    }

    return {
      productId: id,
      title: listing.title,
      author: listing.author,
      price: listing.price,
      image: listing.image || (listing.imageContentType
        ? `${req.protocol}://${req.get("host")}/api/v1/books/${id}/image`
        : ""),
    };
  });
};

router.get("/orders", requireUser, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

  try {
    const orders = await Order.find({ userId: req.session.user.id })
      .select("-paymentReference")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not load your orders" });
  }
});

router.post("/orders/cod", requireUser, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

  const customerResult = validateCustomer(req.body?.customer);
  if (customerResult.error) {
    return res.status(400).json({ message: customerResult.error });
  }

  try {
    const items = await loadPricedItems(req.body?.items, req);
    const total = items.reduce((sum, item) => sum + item.price, 0);
    const order = await Order.create({
      userId: req.session.user.id,
      customer: customerResult.customer,
      items,
      total,
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "placed",
    });
    return res.status(201).json({ orderId: order._id, message: "Cash on delivery order placed" });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    return res.status(500).json({ message: "Could not place your cash on delivery order" });
  }
});

router.post("/orders/upi-qr/static", requireUser, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

  const customerResult = validateCustomer(req.body?.customer);
  if (customerResult.error) {
    return res.status(400).json({ message: customerResult.error });
  }

  try {
    const items = await loadPricedItems(req.body?.items, req);
    const totalPaise = items.reduce((sum, item) => sum + Math.round(item.price * 100), 0);
    if (!Number.isSafeInteger(totalPaise) || totalPaise < 100) {
      return res.status(400).json({ message: "The order total is invalid" });
    }

    const order = await Order.create({
      userId: req.session.user.id,
      customer: customerResult.customer,
      items,
      total: totalPaise / 100,
      paymentMethod: "upi_qr",
      paymentStatus: "pending",
      orderStatus: "placed",
    });

    return res.status(201).json({
      orderId: order._id,
      amount: order.total,
      status: order.paymentStatus,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    return res.status(500).json({ message: "Could not place your QR payment order" });
  }
});

router.post("/orders/upi-qr", requireUser, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

  const razorpay = createRazorpayClient();
  if (!razorpay) {
    return res.status(503).json({
      message: "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, or TEST_API_KEY and TEST_SECRET_KEY, in the backend environment.",
    });
  }

  const customerResult = validateCustomer(req.body?.customer);
  if (customerResult.error) {
    return res.status(400).json({ message: customerResult.error });
  }

  try {
    const items = await loadPricedItems(req.body?.items, req);
    const amountPaise = items.reduce((sum, item) => sum + Math.round(item.price * 100), 0);
    if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) {
      return res.status(400).json({ message: "The order total is invalid" });
    }

    const order = await Order.create({
      userId: req.session.user.id,
      customer: customerResult.customer,
      items,
      total: amountPaise / 100,
      paymentMethod: "upi_qr",
      paymentStatus: "pending",
      orderStatus: "placed",
    });

    try {
      const qrCode = await razorpay.qrCode.create({
        type: "upi_qr",
        name: `Book order ${order._id.toString().slice(-8)}`,
        usage: "single_use",
        fixed_amount: true,
        payment_amount: amountPaise,
        description: `Book order ${order._id}`,
        close_by: Math.floor(Date.now() / 1000) + 60 * 60,
        notes: { order_id: order._id.toString() },
      });
      order.razorpayQrCodeId = qrCode.id;
      order.razorpayQrCodeImageUrl = qrCode.image_url;
      await order.save();

      return res.status(201).json({
        orderId: order._id,
        qrCodeId: qrCode.id,
        imageUrl: qrCode.image_url,
        amount: order.total,
        status: order.paymentStatus,
      });
    } catch (error) {
      order.paymentStatus = "failed";
      await order.save();
      throw error;
    }
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    return res.status(502).json({ message: "Could not create your payment QR. Please try again." });
  }
});

router.get("/orders/:orderId/status", requireUser, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

  if (!mongoose.isValidObjectId(req.params.orderId)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.session.user.id,
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.paymentStatus === "paid" || order.paymentMethod === "cod") {
      return res.status(200).json({
        paymentStatus: order.paymentStatus,
        qrCodeImageUrl: order.razorpayQrCodeImageUrl,
      });
    }
    if (order.paymentMethod !== "upi_qr" || !order.razorpayQrCodeId) {
      return res.status(200).json({ paymentStatus: order.paymentStatus });
    }

    const razorpay = createRazorpayClient();
    if (!razorpay) {
      return res.status(503).json({ message: "Razorpay is not configured on the server" });
    }

    const { items } = await razorpay.qrCode.fetchAllPayments(order.razorpayQrCodeId, { count: 100 });
    const payment = items.find((item) =>
      item.status === "captured" &&
      item.amount === Math.round(order.total * 100) &&
      item.currency === "INR"
    );
    if (payment) {
      order.paymentStatus = "paid";
      order.razorpayPaymentId = payment.id;
      await order.save();
    }

    return res.status(200).json({
      paymentStatus: order.paymentStatus,
      qrCodeImageUrl: order.razorpayQrCodeImageUrl,
    });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ message: "Could not check payment status. Please try again." });
  }
});

router.post("/orders/checkout", requireUser, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

  const razorpay = createRazorpayClient();
  if (!razorpay) {
    return res.status(503).json({
      message: "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, or TEST_API_KEY and TEST_SECRET_KEY, in the backend environment.",
    });
  }

  const customerResult = validateCustomer(req.body?.customer);
  if (customerResult.error) {
    return res.status(400).json({ message: customerResult.error });
  }

  try {
    const items = await loadPricedItems(req.body?.items, req);
    const amountPaise = items.reduce((sum, item) => sum + Math.round(item.price * 100), 0);
    if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) {
      return res.status(400).json({ message: "The order total is invalid" });
    }

    const order = new Order({
      userId: req.session.user.id,
      customer: customerResult.customer,
      items,
      total: amountPaise / 100,
      paymentMethod: "razorpay",
      paymentStatus: "pending",
    });
    await order.save();

    try {
      const gatewayOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: order._id.toString(),
      });
      order.razorpayOrderId = gatewayOrder.id;
      await order.save();

      return res.status(201).json({
        orderId: order._id,
        razorpayOrderId: gatewayOrder.id,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency,
        keyId: getRazorpayConfig().keyId,
      });
    } catch (error) {
      order.paymentStatus = "failed";
      await order.save();
      throw error;
    }
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    return res.status(502).json({ message: "Could not start Razorpay checkout. Please try again." });
  }
});

router.post("/orders/verify-payment", requireUser, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

  const razorpay = createRazorpayClient();
  if (!razorpay) {
    return res.status(503).json({ message: "Razorpay is not configured on the server" });
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
  if (
    typeof orderId !== "string" ||
    !mongoose.isValidObjectId(orderId) ||
    typeof razorpayOrderId !== "string" ||
    typeof razorpayPaymentId !== "string" ||
    typeof razorpaySignature !== "string"
  ) {
    return res.status(400).json({ message: "Invalid payment verification details" });
  }

  try {
    const order = await Order.findOne({ _id: orderId, userId: req.session.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ message: "Payment does not match this order" });
    }
    if (order.paymentStatus === "paid") {
      if (order.razorpayPaymentId === razorpayPaymentId) {
        return res.status(200).json({ message: "Payment already verified", orderId: order._id });
      }
      return res.status(409).json({ message: "This order has already been paid" });
    }
    if (!["pending", "failed"].includes(order.paymentStatus)) {
      return res.status(409).json({ message: "This order is no longer awaiting payment" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");
    if (!validSignature(expectedSignature, razorpaySignature)) {
      return res.status(400).json({ message: "Payment signature could not be verified" });
    }

    let payment = await razorpay.payments.fetch(razorpayPaymentId);
    const expectedAmount = Math.round(order.total * 100);
    if (
      payment.order_id !== razorpayOrderId ||
      payment.amount !== expectedAmount ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({ message: "Payment details do not match this order" });
    }

    if (payment.status === "authorized") {
      payment = await razorpay.payments.capture(razorpayPaymentId, expectedAmount, "INR");
    }
    if (payment.status !== "captured") {
      return res.status(409).json({ message: "Payment has not been captured yet" });
    }

    order.paymentStatus = "paid";
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();
    return res.status(200).json({ message: "Payment verified", orderId: order._id });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ message: "Could not verify payment. Contact support before trying again." });
  }
});

router.post("/orders/razorpay-webhook", async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const receivedSignature = req.get("x-razorpay-signature");
  if (!webhookSecret || !Buffer.isBuffer(req.body)) {
    return res.status(503).json({ message: "Razorpay webhook is not configured" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.body)
    .digest("hex");
  if (!validSignature(expectedSignature, receivedSignature)) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  try {
    const event = JSON.parse(req.body.toString("utf8"));
    const payment = event.payload?.payment?.entity;
    const qrCodeId = event.payload?.qr_code?.entity?.id || payment?.qr_code_id;
    if (qrCodeId) {
      const order = await Order.findOne({ razorpayQrCodeId: qrCodeId });
      if (!order) return res.status(200).json({ received: true });

      const razorpay = createRazorpayClient();
      if (!razorpay) return res.status(503).json({ message: "Razorpay is not configured" });
      const { items } = await razorpay.qrCode.fetchAllPayments(qrCodeId, { count: 100 });
      const capturedPayment = items.find((item) =>
        item.status === "captured" &&
        item.amount === Math.round(order.total * 100) &&
        item.currency === "INR"
      );
      if (capturedPayment) {
        order.paymentStatus = "paid";
        order.razorpayPaymentId = capturedPayment.id;
        await order.save();
      }
      return res.status(200).json({ received: true });
    }

    if (!payment?.order_id || !payment.id) {
      return res.status(200).json({ received: true });
    }

    const order = await Order.findOne({ razorpayOrderId: payment.order_id });
    if (!order) return res.status(200).json({ received: true });

    if (
      event.event === "payment.captured" &&
      payment.amount === Math.round(order.total * 100) &&
      payment.currency === "INR"
    ) {
      order.paymentStatus = "paid";
      order.razorpayPaymentId = payment.id;
      await order.save();
    } else if (event.event === "payment.failed" && order.paymentStatus === "pending") {
      order.paymentStatus = "failed";
      await order.save();
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not process Razorpay webhook" });
  }
});

module.exports = router;
