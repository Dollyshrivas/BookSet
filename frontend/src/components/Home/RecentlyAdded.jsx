import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import { cartActions } from "../../store/cart";
import books from "../../data/books";
import BookCover from "../BookCover";
import { API_BASE_URL } from "../../api";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

const RecentlyAdded = () => {
  const dispatch = useDispatch();
  const [sellerListings, setSellerListings] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/books/marketplace`)
      .then(({ data }) => {
        setSellerListings(data.map((listing) => ({
          ...listing,
          id: listing._id,
          price: Number(listing.price),
          isSellerListing: true,
        })));
      })
      .catch(() => setSellerListings([]));
  }, []);

  const displayedBooks = [...sellerListings, ...books].slice(0, 4);

  const addToCart = (book) => {
    dispatch(cartActions.addToCart(book));
    window.alert(`${book.title} added to cart`);
  };

  return (
    <section className="mt-8 px-4 py-10 md:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium uppercase text-yellow-200">
            From the shelves
          </p>
          <h2 className="text-3xl font-semibold text-white">Recently added books</h2>
        </div>
        <Link
          to="/Bestsellers"
          className="text-sm font-semibold text-yellow-100 underline decoration-yellow-100/50 underline-offset-4 hover:text-white"
        >
          Browse all books
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {displayedBooks.map((book) => (
          <article
            key={book.id}
            className="flex h-full flex-col rounded-lg border border-zinc-700 bg-zinc-800 p-3 transition-colors hover:border-yellow-200/70 sm:p-4"
          >
            <div className="aspect-[3/4] overflow-hidden rounded-md bg-zinc-900">
              <BookCover
                src={book.image}
                alt={`${book.title} cover`}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col pt-4">
              <h3 className="min-h-12 font-semibold text-white">{book.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{book.author}</p>
              {book.isSellerListing && (
                <p className="mt-1 text-xs text-zinc-500">Listed by {book.sellerName}</p>
              )}
              <p className="mt-3 font-semibold text-yellow-200">{formatPrice(book.price)}</p>
              <button
                type="button"
                onClick={() => addToCart(book)}
                className="mt-4 w-full rounded-md bg-yellow-100 px-3 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-yellow-200"
              >
                Add to cart
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default RecentlyAdded;
