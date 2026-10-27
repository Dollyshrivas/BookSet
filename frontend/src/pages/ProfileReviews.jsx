import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import books from "../data/books";

const REVIEWS_KEY = "reviews"; // shared across users

const ProfileReviews = () => {
  const { userData } = useOutletContext() || {};
  const userKey = (userData && (userData.id || userData._id || userData.email)) || "guest";

  const [reviews, setReviews] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem(REVIEWS_KEY)) || [];
      setReviews(all);
    } catch {
      setReviews([]);
    }
  }, []);

  const saveAll = (next) => {
    setReviews(next);
    try {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(next));
    } catch {}
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setEditText(r.text || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const submitEdit = () => {
    const next = reviews.map((r) =>
      r.id === editingId ? { ...r, text: editText, updatedAt: Date.now() } : r
    );
    saveAll(next);
    cancelEdit();
  };

  const remove = (id) => {
    const next = reviews.filter((r) => r.id !== id);
    saveAll(next);
  };

  const myReviews = reviews.filter((r) => r.userKey === userKey);

  if (!myReviews.length) {
    return (
      <div className="p-6 text-gray-300">
        <h3 className="text-lg text-white font-semibold mb-2">You have no reviews yet</h3>
        <p>Write reviews from the Bestsellers page and you'll see them here for editing.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-4">My Reviews</h3>

      <div className="flex flex-col gap-4">
        {myReviews.map((r) => (
          <div key={r.id} className="bg-zinc-800 p-4 rounded-md">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <strong className="text-white">{r.userName || "You"}</strong>
                    <span className="text-sm text-gray-400">· {new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-indigo-300">Book: {r.bookTitle || books.find((b) => b.id === r.bookId)?.title || "Unknown Book"}</div>
                </div>
                <p className="text-sm text-gray-300 mt-2">{r.text}</p>
                <div className="text-sm text-yellow-400 mt-2">Rating: {r.rating || 0}</div>
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={() => startEdit(r)} className="px-3 py-1 bg-blue-600 rounded text-sm">Edit</button>
                <button onClick={() => remove(r.id)} className="px-3 py-1 bg-red-600 rounded text-sm">Delete</button>
              </div>
            </div>

            {editingId === r.id && (
              <div className="mt-3">
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full p-2 rounded bg-zinc-700 text-white" />
                <div className="flex gap-2 mt-2">
                  <button onClick={submitEdit} className="px-3 py-1 bg-green-600 rounded text-sm">Save</button>
                  <button onClick={cancelEdit} className="px-3 py-1 bg-zinc-600 rounded text-sm">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileReviews;
