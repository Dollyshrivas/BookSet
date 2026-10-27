import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname === "/") return null;

  const canGoBack = window.history.state?.idx > 0;

  const goBack = () => {
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Go back"
      title="Go back"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
    </button>
  );
};

export default BackButton;
