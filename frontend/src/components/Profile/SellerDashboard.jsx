import React, { useEffect, useState } from "react";
import axios from "axios";
import BookCover from "../BookCover";
import { API_BASE_URL } from "../../api";

const initialForm = {
  title: "",
  author: "",
  price: "",
  image: "",
  condition: "Good",
  description: "",
};

const MAX_COVER_SIZE = 1_000_000;

const compressCover = async (file) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file");
  }
  if (file.size > 15_000_000) {
    throw new Error("Choose an image smaller than 15 MB");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let compressed;
    for (const quality of [0.82, 0.72, 0.62, 0.52]) {
      compressed = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!compressed) throw new Error("Could not process this image");
      if (compressed.size <= MAX_COVER_SIZE) break;
    }
    if (compressed.size > MAX_COVER_SIZE) {
      throw new Error("This image cannot be reduced below 1 MB");
    }

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read this image"));
      reader.readAsDataURL(compressed);
    });
  } finally {
    bitmap.close();
  }
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

const SellerDashboard = () => {
  const [form, setForm] = useState(initialForm);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [uploadedCover, setUploadedCover] = useState("");
  const [coverName, setCoverName] = useState("");
  const [processingCover, setProcessingCover] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    axios
      .get(`${API_BASE_URL}/seller/listings`, { withCredentials: true })
      .then(({ data }) => {
        if (active) setListings(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || "Could not load your listings");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const change = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    if (event.target.name === "image") {
      setUploadedCover("");
      setCoverName("");
    }
  };

  const chooseCover = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    setProcessingCover(true);
    setError("");
    setNotice("");
    try {
      setUploadedCover(await compressCover(file));
      setCoverName(file.name);
    } catch (uploadError) {
      setUploadedCover("");
      setCoverName("");
      setError(uploadError.message || "Could not process this image");
    } finally {
      setProcessingCover(false);
      input.value = "";
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/seller/listings`,
        { ...form, image: uploadedCover || form.image, price: Number(form.price) },
        { withCredentials: true }
      );
      setListings((current) => [data, ...current]);
      setForm(initialForm);
      setUploadedCover("");
      setCoverName("");
      setNotice("Your book is now listed for sale.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not publish this book");
    } finally {
      setSaving(false);
    }
  };

  const removeListing = async (listingId) => {
    setDeletingId(listingId);
    setError("");

    try {
      await axios.delete(`${API_BASE_URL}/seller/listings/${listingId}`, {
        withCredentials: true,
      });
      setListings((current) => current.filter((listing) => listing._id !== listingId));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not remove this listing");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <section className="space-y-10">
      <header className="border-b border-zinc-700 pb-6">
        <p className="text-sm font-semibold uppercase text-yellow-200">Seller dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Sell a book</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Publish a book to the marketplace and manage your active listings.
        </p>
      </header>

      <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-zinc-300">
          Book title
          <input
            name="title"
            value={form.title}
            onChange={change}
            required
            maxLength={160}
            placeholder="The book title"
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white outline-none focus:border-yellow-200"
          />
        </label>
        <label className="space-y-2 text-sm text-zinc-300">
          Author
          <input
            name="author"
            value={form.author}
            onChange={change}
            required
            maxLength={120}
            placeholder="Author name"
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white outline-none focus:border-yellow-200"
          />
        </label>
        <label className="space-y-2 text-sm text-zinc-300">
          Price (INR)
          <input
            name="price"
            type="number"
            min="1"
            step="1"
            value={form.price}
            onChange={change}
            required
            placeholder="499"
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white outline-none focus:border-yellow-200"
          />
        </label>
        <label className="space-y-2 text-sm text-zinc-300">
          Condition
          <select
            name="condition"
            value={form.condition}
            onChange={change}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white outline-none focus:border-yellow-200"
          >
            <option>New</option>
            <option>Like new</option>
            <option>Good</option>
            <option>Acceptable</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-zinc-300 sm:col-span-2">
          Cover image URL <span className="text-zinc-500">(optional)</span>
          <input
            name="image"
            type="url"
            value={form.image}
            onChange={change}
            placeholder="https://example.com/book-cover.jpg"
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white outline-none focus:border-yellow-200"
          />
        </label>
        <div className="space-y-2 text-sm text-zinc-300 sm:col-span-2">
          <label htmlFor="book-cover-upload" className="block">Take a photo or choose from device</label>
          <input
            id="book-cover-upload"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={chooseCover}
            className="block w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 text-sm text-zinc-300 file:mr-4 file:border-0 file:bg-yellow-100 file:px-4 file:py-2.5 file:font-semibold file:text-zinc-900 hover:file:bg-yellow-200"
          />
          <p className="text-xs text-zinc-500">Images are resized before upload. Maximum stored size: 1 MB.</p>
          {processingCover && <p role="status" className="text-xs text-yellow-200">Preparing photo...</p>}
          {uploadedCover && (
            <div className="flex items-center gap-3 pt-2">
              <img src={uploadedCover} alt="Selected book cover preview" className="h-20 w-14 rounded object-cover" />
              <span className="min-w-0 flex-1 truncate text-xs text-zinc-400">{coverName}</span>
              <button
                type="button"
                onClick={() => { setUploadedCover(""); setCoverName(""); }}
                className="rounded px-2 py-1 text-xs text-red-300 hover:bg-red-950"
              >
                Remove photo
              </button>
            </div>
          )}
        </div>
        <label className="space-y-2 text-sm text-zinc-300 sm:col-span-2">
          Description <span className="text-zinc-500">(optional)</span>
          <textarea
            name="description"
            value={form.description}
            onChange={change}
            maxLength={2000}
            rows={3}
            placeholder="Edition, language, or other details"
            className="w-full resize-y rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white outline-none focus:border-yellow-200"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving || processingCover}
            className="rounded-md bg-yellow-100 px-5 py-2.5 font-semibold text-zinc-900 transition-colors hover:bg-yellow-200 disabled:cursor-wait disabled:opacity-60"
          >
            {processingCover ? "Preparing photo..." : saving ? "Publishing..." : "Publish listing"}
          </button>
        </div>
      </form>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {notice && <p role="status" className="text-sm text-green-300">{notice}</p>}

      <section>
        <div className="mb-5 flex items-end justify-between border-b border-zinc-700 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Your listings</h2>
            <p className="mt-1 text-sm text-zinc-400">{listings.length} books for sale</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading listings...</p>
        ) : listings.length === 0 ? (
          <p className="py-6 text-sm text-zinc-400">You have not listed any books yet.</p>
        ) : (
          <div className="divide-y divide-zinc-700">
            {listings.map((listing) => (
              <article key={listing._id} className="flex items-center gap-4 py-4">
                <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-700 text-xs text-zinc-400">
                  <BookCover
                    src={listing.image}
                    alt={`${listing.title} cover`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-white">{listing.title}</h3>
                  <p className="text-sm text-zinc-400">{listing.author} · {listing.condition}</p>
                </div>
                <strong className="whitespace-nowrap text-yellow-200">{formatPrice(listing.price)}</strong>
                <button
                  type="button"
                  onClick={() => removeListing(listing._id)}
                  disabled={deletingId === listing._id}
                  aria-label={`Remove ${listing.title}`}
                  className="rounded-md px-3 py-2 text-sm text-red-300 hover:bg-red-950 disabled:opacity-50"
                >
                  {deletingId === listing._id ? "Removing..." : "Remove"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
};

export default SellerDashboard;