import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-zinc-950 text-zinc-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:grid-cols-2 md:px-8 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-3 text-white">
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#eeeade]">
              <img
                src="/bookset-logo.png"
                alt=""
                className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#eeeade] absolute inset-0 h-full w-full scale-[1.5] object-cover object-center"
              />
            </span>
            <span className="text-xl font-semibold tracking-tight">BookSet</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
            A place for readers to discover their next favorite book and share
            stories with a community of book lovers.
          </p>
        </div>

        <nav aria-label="Explore">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Explore
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link to="/" className="transition hover:text-white">Home</Link></li>
            <li><Link to="/Bestsellers" className="transition hover:text-white">Browse books</Link></li>
            <li><Link to="/About" className="transition hover:text-white">About BookSet</Link></li>
          </ul>
        </nav>

        <nav aria-label="Help and account">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Help &amp; account
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link to="/contact" className="transition hover:text-white">Contact us</Link></li>
            <li><Link to="/profile" className="transition hover:text-white">My account</Link></li>
            <li><Link to="/cart" className="transition hover:text-white">Shopping cart</Link></li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p>&copy; {new Date().getFullYear()} BookSet. All rights reserved.</p>
          <p>Made for the love of reading❤️.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
