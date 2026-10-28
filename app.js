const express = require("express");
const app = express();
require("dotenv").config();
const iconv = require("iconv-lite");
if (!iconv.encodingExists("utf-8")) {
  throw new Error("Could not load the UTF-8 codec required for JSON request bodies");
}
const mongoose = require("mongoose");
const cors = require("cors");
const user = require("./backend/routes/user");
const books = require("./backend/routes/books");
const contact = require("./backend/routes/contact");
const orders = require("./backend/routes/orders");
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET || (isProduction ? "" : "dev-only-change-me");
if (
  !sessionSecret ||
  (isProduction && (
    sessionSecret.length < 32 ||
    sessionSecret === "replace_with_a_long_random_secret"
  ))
) {
  throw new Error("Set SESSION_SECRET to a unique random value of at least 32 characters");
}

// DB
const connectToDatabase = async () => {
  if (!process.env.DB_URI) {
    console.error("Mongo connection error: DB_URI is not set");
    return;
  }

  let attempt = 0;
  while (mongoose.connection.readyState !== 1) {
    attempt += 1;
    try {
      await mongoose.connect(process.env.DB_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log("DB Connected");
    } catch (error) {
      const delay = Math.min(1000 * 2 ** Math.min(attempt - 1, 5), 30000);
      console.error(`Mongo connection error (attempt ${attempt}):`, error.message);
      console.log(`Retrying MongoDB connection in ${delay / 1000} seconds`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

connectToDatabase();

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true
}));

app.use(
  "/api/v1/orders/razorpay-webhook",
  express.raw({ type: "application/json" })
);

// Middleware
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);

// Session
const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const sessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  }
};

if (process.env.DB_URI) {
  sessionOptions.store = MongoStore.create({
    mongoUrl: process.env.DB_URI,
    collectionName: "sessions",
  });
}

app.use(session(sessionOptions));

// Routes
app.use("/api/v1", user);
app.use("/api/v1", books);
app.use("/api/v1", contact);
app.use("/api/v1", orders);

app.get("/", (req, res) => {
  res.send("hello");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// LOCAL ONLY
app.listen(process.env.PORT || 4000, () => {
  console.log(`Server running on http://localhost:4000`);
});
