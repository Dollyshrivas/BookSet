import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { cartActions } from "../store/cart";
import books from "../data/books";
import BookCover from "../components/BookCover";
import { API_BASE_URL } from "../api";

const sampleReviews = [
  { bookId: 1, userName: "Mira", rating: 5, text: "Atomic Habits helped me build better daily routines. Highly recommend!" },
  { bookId: 1, userName: "Rahul", rating: 4, text: "Great practical tips, especially the small habit focus." },
  { bookId: 2, userName: "Priya", rating: 5, text: "I learned so much from this book about money psychology." },
  { bookId: 2, userName: "Jon", rating: 4, text: "Easy to read and full of useful insights." },
  { bookId: 3, userName: "Ayesha", rating: 5, text: "Ikigai gave me a peaceful perspective on purpose." },
  { bookId: 3, userName: "Vikram", rating: 4, text: "Beautiful lessons on life balance and meaning." },
  { bookId: 4, userName: "Nina", rating: 5, text: "Rich Dad Poor Dad changed my approach to money." },
  { bookId: 4, userName: "Sahil", rating: 4, text: "Simple, direct cash-flow ideas that actually work." },
];

const Bestsellers = () => {
  const dispatch = useDispatch();
  const [userKey, setUserKey] = useState("guest");
  const [userName, setUserName] = useState("Guest");
  const [favorites, setFavorites] = useState({});
  const [ratings, setRatings] = useState({});
  const [reviews, setReviews] = useState([]);
  const [sellerListings, setSellerListings] = useState([]);
  const loggedIn = userKey !== "guest";
  const randomBookReviews = useMemo(() => {
    return books.reduce((map, book) => {
      const matches = sampleReviews.filter((r) => r.bookId === book.id);
      const shuffled = [...matches].sort(() => Math.random() - 0.5);
      map[book.id] = shuffled.slice(0, 2);
      return map;
    }, {});
  }, []);

  const randomRatingInfo = useMemo(() => {
    return books.reduce((map, book) => {
      const matches = sampleReviews.filter((r) => r.bookId === book.id);
      const avg = matches.length
        ? matches.reduce((sum, item) => sum + item.rating, 0) / matches.length
        : 4.5;
      map[book.id] = {
        avg: Number((avg + Math.random() * 0.4 - 0.2).toFixed(1)),
        count: Math.floor(Math.random() * 60) + 20,
      };
      return map;
    }, {});
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/books/marketplace`)
      .then(({ data }) => {
        setSellerListings(data.map((listing) => ({
          ...listing,
          id: listing._id,
          price: Number(listing.price),
        })));
      })
      .catch(() => setSellerListings([]));
  }, []);

  // Load current user identifier and user-scoped favorites/ratings
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/get-user-information`,
          { withCredentials: true }
        );

        const user = res.data.user || res.data || null;
        const key = user?.id || user?._id || user?.email || "guest";
        const name = user?.name || user?.username || user?.email || "Guest";
        if (!mounted) return;
        setUserKey(key);
        setUserName(name);

        try {
          const fav = JSON.parse(localStorage.getItem(`favorites_${key}`)) || {};
          setFavorites(fav);
        } catch {
          setFavorites({});
        }

        try {
          const r = JSON.parse(localStorage.getItem(`ratings_${key}`)) || {};
          setRatings(r);
        } catch {
          setRatings({});
        }
        try {
          const all = JSON.parse(localStorage.getItem("reviews")) || [];
          setReviews(all);
        } catch {
          setReviews([]);
        }
      } catch (err) {
        // not logged in or error; fall back to guest key
        const key = "guest";
        if (!mounted) return;
        setUserKey(key);
        try {
          const fav = JSON.parse(localStorage.getItem(`favorites_${key}`)) || {};
          setFavorites(fav);
        } catch {
          setFavorites({});
        }
        try {
          const r = JSON.parse(localStorage.getItem(`ratings_${key}`)) || {};
          setRatings(r);
        } catch {
          setRatings({});
        }
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const addHandler = (book) => {
    dispatch(cartActions.addToCart(book));
    alert("Book added to cart 🛒");
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(`favorites_${userKey}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const setRating = (id, value) => {
    setRatings((prev) => {
      const next = { ...prev, [id]: value };
      try {
        localStorage.setItem(`ratings_${userKey}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const saveReviews = (next) => {
    setReviews(next);
    try {
      localStorage.setItem("reviews", JSON.stringify(next));
    } catch {}
  };

  const addOrUpdateReview = (bookId, text, rating) => {
    const now = Date.now();
    // check if user already has review for book
    const existing = reviews.find((r) => r.bookId === bookId && r.userKey === userKey);
    let next;
    if (existing) {
      next = reviews.map((r) =>
        r.id === existing.id ? { ...r, text, rating, updatedAt: now } : r
      );
    } else {
      const book = books.find((item) => item.id === bookId);
      const newReview = {
        id: `${userKey}_${bookId}_${now}`,
        bookId,
        bookTitle: book?.title || "Unknown Book",
        userKey,
        userName,
        text,
        rating,
        createdAt: now,
        updatedAt: now,
      };
      next = [newReview, ...reviews];
    }
    saveReviews(next);
  };

  const removeReview = (id) => {
    const next = reviews.filter((r) => r.id !== id);
    saveReviews(next);
  };

  // Inline form component for adding/editing a review for a book
  const ReviewForm = ({ bookId, existing, onSave }) => {
    // Only allow creating a new review from the Bestsellers page.
    // If an existing review is present, direct the user to edit in their Profile.
    const [text, setText] = useState("");
    const [ratingLocal, setRatingLocal] = useState(0);

    useEffect(() => {
      if (!existing) {
        setText("");
        setRatingLocal(0);
      }
    }, [existing]);

    if (existing) {
      return (
        <div className="bg-zinc-900/40 p-3 rounded text-sm text-gray-300">
          You have already reviewed this book. Edit your review from your profile.
          <div className="mt-2">
            <a href="/profile/reviews" className="text-blue-400 underline">Go to My Reviews</a>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-zinc-900/40 p-3 rounded">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your review..."
          className="w-full p-2 rounded bg-zinc-800 text-white text-sm mb-2"
        />

        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} onClick={() => setRatingLocal(i)} className="p-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={i <= ratingLocal ? "currentColor" : "none"} stroke="currentColor" className={`w-4 h-4 ${i <= ratingLocal ? "text-yellow-400" : "text-yellow-300"}`}>
                  <path d="M12 .587l3.668 7.431L23.327 9.9l-5.659 5.523L18.9 24 12 19.897 5.1 24l1.233-8.577L.674 9.9l7.659-1.882L12 .587z" />
                </svg>
              </button>
            ))}
          </div>

          <button
            onClick={() => onSave(text, ratingLocal)}
            className="ml-auto px-3 py-1 bg-green-600 rounded text-sm"
          >
            Submit
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-indigo-950 text-white px-6 py-16">
      
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">
          📚 Bestseller Books
        </h1>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-white/10 backdrop-blur-xl border border-white/20 
              rounded-2xl p-4 shadow-xl hover:scale-105 transition duration-500"
            >
              <BookCover
                src={book.image}
                alt={`${book.title} cover`}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />

              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-lg font-semibold">{book.title}</h2>
                  <p className="text-gray-400 text-sm">{book.author}</p>
                </div>

                <button
                  onClick={() => toggleFavorite(book.id)}
                  aria-label={favorites[book.id] ? "Unfavorite" : "Favorite"}
                  className="p-2 rounded-full hover:scale-110 transition"
                >
                  {favorites[book.id] ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-pink-500">
                      <path d="M11.99 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41 1 4.5 2.09C12.09 5 13.76 4 15.5 4 18 4 20 6 20 8.5c0 3.78-3.4 6.86-8.54 11.54L11.99 21.35z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-pink-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.5c0 3.78-3.4 6.86-8.54 11.54L12 21l-.46-.36C6.4 15.36 3 12.28 3 8.5 3 6 5 4 7.5 4c1.74 0 3.41 1 4.5 2.09C13.09 5 14.76 4 16.5 4 19 4 21 6 21 8.5z" />
                    </svg>
                  )}
                </button>
              </div>

              <p className="text-indigo-400 font-bold mb-2">₹{book.price}</p>
              {(() => {
                const bookReviews = reviews.filter((r) => r.bookId === book.id);
                const displayReviews = bookReviews.length > 0 ? bookReviews : randomBookReviews[book.id] || [];
                const avgRating = bookReviews.length > 0
                  ? (displayReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / displayReviews.length).toFixed(1)
                  : randomRatingInfo[book.id]?.avg.toFixed(1);
                const count = bookReviews.length > 0 ? displayReviews.length : randomRatingInfo[book.id]?.count;
                return (
                  <div className="flex items-center justify-between gap-2 mb-4 text-sm text-gray-300">
                    <span className="text-yellow-400">{avgRating} ★</span>
                    <span>{count} reviews</span>
                  </div>
                );
              })()}

              

              

              {/* Reviews list (shared or sample) */}
              <div className="mb-4">
                <h3 className="text-sm text-gray-200 font-medium mb-2">Customer Reviews</h3>
                <div className="flex flex-col gap-2 max-h-48 overflow-auto pr-2">
                  {(() => {
                    const bookReviews = reviews.filter((r) => r.bookId === book.id);
                    const displayReviews = bookReviews.length > 0 ? bookReviews : randomBookReviews[book.id] || [];
                    return displayReviews.map((r) => (
                      <div key={r.id || `${book.id}-${r.userName}-${r.rating}`} className="text-sm bg-zinc-900/50 p-2 rounded">
                        <div className="flex items-center justify-between">
                          <strong className="text-white">{r.userName || 'User'}</strong>
                          <div className="text-yellow-400">{r.rating || 0}</div>
                        </div>
                        <p className="text-gray-300 text-sm">{r.text}</p>
                        {r.userKey === userKey && r.id && (
                          <div className="mt-1 flex gap-2">
                            <button onClick={() => removeReview(r.id)} className="text-xs text-red-400">Delete</button>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Add review form only for logged-in users */}
              {userKey !== "guest" ? (
                <div className="mb-4">
                  <ReviewForm
                    bookId={book.id}
                    existing={reviews.find((r) => r.bookId === book.id && r.userKey === userKey)}
                    onSave={(text, rating) => addOrUpdateReview(book.id, text, rating)}
                  />
                </div>
              ) : (
                <div className="mb-4 bg-zinc-900/40 p-3 rounded text-sm text-gray-300">
                  <p>You must <a href="/login" className="text-blue-400 underline">log in</a> to write a review.</p>
                </div>
              )}

              <button
                onClick={() => addHandler(book)}
                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:scale-105 transition duration-300"
              >
                Add to Cart 🛒
              </button>
            </div>
          ))}
        </div>

        {sellerListings.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 border-b border-zinc-700 pb-4">
              <p className="text-sm font-semibold uppercase text-yellow-200">Community marketplace</p>
              <h2 className="mt-2 text-2xl font-semibold">Books from independent sellers</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {sellerListings.map((book) => (
                <article key={book.id} className="flex flex-col rounded-lg border border-zinc-700 bg-zinc-800 p-4">
                  <div className="aspect-[3/4] overflow-hidden rounded-md bg-zinc-900">
                    <BookCover
                      src={book.image}
                      alt={`${book.title} cover`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h3 className="mt-4 font-semibold">{book.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{book.author}</p>
                  <p className="mt-2 text-xs text-zinc-500">{book.condition} · Listed by {book.sellerName}</p>
                  {book.description && <p className="mt-3 line-clamp-3 text-sm text-zinc-300">{book.description}</p>}
                  <p className="mt-auto pt-4 font-semibold text-yellow-200">₹{book.price}</p>
                  <button
                    type="button"
                    onClick={() => addHandler(book)}
                    className="mt-3 w-full rounded-md bg-yellow-100 py-2 font-semibold text-zinc-900 hover:bg-yellow-200"
                  >
                    Add to cart
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Bestsellers;
