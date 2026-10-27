const router = require("express").Router();
const mongoose = require("mongoose");
const BookListing = require("../models/booklisting");

const imageUrlFor = (id, req) =>
  `${req.protocol}://${req.get("host")}/api/v1/books/${id}/image`;

const serializeListing = (listing, req) => {
  const record = typeof listing.toObject === "function" ? listing.toObject() : listing;
  const image = record.image || (record.imageContentType ? imageUrlFor(record._id, req) : "");
  delete record.imageData;
  return { ...record, image };
};

const requireUser = (req, res, next) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ message: "Please sign in to manage listings" });
  }

  next();
};

const databaseUnavailable = (res) =>
  res.status(503).json({ message: "Database not connected. Please try again in a moment." });

router.get("/books/marketplace", async (req, res) => {
  if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

  try {
    const listings = await BookListing.find()
      .select("-imageData")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return res.status(200).json(listings.map((listing) => serializeListing(listing, req)));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not load book listings" });
  }
});

router.get("/books/:id/image", async (req, res) => {
  if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid listing id" });
  }

  try {
    const listing = await BookListing.findById(req.params.id)
      .select("imageData imageContentType");
    if (!listing?.imageData || !listing.imageContentType) {
      return res.status(404).json({ message: "Book image not found" });
    }

    res.set("Content-Type", listing.imageContentType);
    res.set("Cache-Control", "public, max-age=86400");
    return res.send(listing.imageData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not load book image" });
  }
});

router.get("/seller/listings", requireUser, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

  try {
    const listings = await BookListing.find({ sellerId: req.session.user.id })
      .select("-imageData")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json(listings.map((listing) => serializeListing(listing, req)));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not load your listings" });
  }
});

router.post("/seller/listings", requireUser, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

  const body = req.body || {};
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const author = typeof body.author === "string" ? body.author.trim() : "";
  const price = Number(body.price);
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const allowedConditions = ["New", "Like new", "Good", "Acceptable"];
  const condition = allowedConditions.includes(body.condition) ? body.condition : "Good";

  if (!title || title.length > 160 || !author || author.length > 120) {
    return res.status(400).json({ message: "Enter a title and author within the allowed length" });
  }
  if (!Number.isFinite(price) || price < 1) {
    return res.status(400).json({ message: "Price must be at least ₹1" });
  }
  if (description.length > 2000) {
    return res.status(400).json({ message: "Description must be 2000 characters or fewer" });
  }
  let imageUrl = "";
  let imageData;
  let imageContentType = "";
  if (image.startsWith("data:")) {
    const match = image.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match) {
      return res.status(400).json({ message: "Uploaded cover must be a JPEG image" });
    }
    imageData = Buffer.from(match[1], "base64");
    if (imageData.length === 0 || imageData.length > 1_000_000) {
      return res.status(413).json({ message: "Cover image must be smaller than 1 MB" });
    }
    if (!imageData.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
      return res.status(400).json({ message: "Uploaded cover is not a valid JPEG image" });
    }
    imageContentType = "image/jpeg";
  } else if (image) {
    if (image.length > 2048) {
      return res.status(400).json({ message: "Cover image URL is too long" });
    }
    try {
      const parsedImageUrl = new URL(image);
      if (!["http:", "https:"].includes(parsedImageUrl.protocol)) {
        throw new Error("Unsupported protocol");
      }
      imageUrl = image;
    } catch {
      return res.status(400).json({ message: "Cover image must be a valid HTTP or HTTPS URL" });
    }
  }

  try {
    const listing = await BookListing.create({
      title,
      author,
      price,
      image: imageUrl,
      imageData,
      imageContentType,
      description,
      condition,
      sellerId: req.session.user.id,
      sellerName: req.session.user.username || "Book seller",
    });
    return res.status(201).json(serializeListing(listing, req));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not create book listing" });
  }
});

router.delete("/seller/listings/:id", requireUser, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid listing id" });
  }

  try {
    const listing = await BookListing.findOneAndDelete({
      _id: req.params.id,
      sellerId: req.session.user.id,
    });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    return res.status(200).json({ message: "Listing removed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not remove listing" });
  }
});

module.exports = router;