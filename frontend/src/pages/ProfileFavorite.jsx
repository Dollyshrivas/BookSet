import React, { useState } from "react";
import books from "../data/books";
import { useOutletContext } from "react-router-dom";

const readStoredData = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch (error) {
    console.error(`Could not read ${key} from local storage`, error);
    return fallback;
  }
};

const ProfileFavorite = () => {
  const { userData } = useOutletContext() || {};
  const userKey = (userData && (userData.id || userData._id || userData.email)) || "guest";
  const [favorites, setFavorites] = useState(() =>
    readStoredData(`favorites_${userKey}`, {})
  );
  const [reviews] = useState(() => {
    const storedReviews = readStoredData("reviews", []);
    return Array.isArray(storedReviews)
      ? storedReviews.filter((review) => review.userKey === userKey)
      : [];
  });

  const removeFavorite = (id) => {
    const next = { ...favorites };
    delete next[id];
    setFavorites(next);
    try {
      localStorage.setItem(`favorites_${userKey}`, JSON.stringify(next));
    } catch (error) {
      console.error("Could not save favorite books", error);
    }
  };

  const favBooks = books.filter((b) => favorites[b.id]);

  if (!favBooks.length) {
    return (
      <div className="p-6 text-center text-gray-300">
        <h3 className="text-lg font-semibold text-white mb-2">No favorites yet</h3>
        <p>Add books to your favorites from the Bestsellers page.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-4">Your Favorite Books</h3>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {favBooks.map((book) => {
          const review = reviews.find(
            (item) => String(item.bookId) === String(book.id)
          );

          return (
            <div key={book.id} className="bg-zinc-800 p-4 rounded-lg">
              <img src={book.image} alt={book.title} className="w-full h-48 object-cover rounded-md mb-3" />
              <h4 className="font-semibold">{book.title}</h4>
              <p className="text-sm text-gray-400">{book.author}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-indigo-400 font-bold">₹{book.price}</span>
                <span className="ml-auto text-sm text-yellow-300">
                  {review ? `${review.rating}/5 ★` : "Not rated"}
                </span>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => removeFavorite(book.id)}
                  className="px-3 py-1 bg-red-600 rounded-md text-sm hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileFavorite;
