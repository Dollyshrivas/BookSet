import React from "react";
import placeholderCover from "../assets/book-cover-placeholder.svg";

const BookCover = ({ src, alt, className, loading = "lazy" }) => (
  <img
    src={src || placeholderCover}
    alt={alt}
    loading={loading}
    className={className}
    onError={(event) => {
      if (event.currentTarget.dataset.fallback !== "true") {
        event.currentTarget.dataset.fallback = "true";
        event.currentTarget.src = placeholderCover;
      }
    }}
  />
);

export default BookCover;
