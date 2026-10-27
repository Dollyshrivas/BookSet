import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaGripLines } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { authActions } from "../../store/auth";
import { API_BASE_URL } from "../../api";
import BackButton from "../BackButton";

const Navbar = () => {
  const dispatch = useDispatch();
  const { isLoggedIn, authChecked } = useSelector((state) => state.auth);

  const [mobileNav, setMobileNav] = useState(false);

  // Prevent flicker before auth check completes
  if (!authChecked) return null;

  const publicLinks = [
    { title: "Home", link: "/" },
    { title: "About", link: "/About" },
    { title: "Bestsellers", link: "/Bestsellers" },
    { title: "Contact", link: "/contact" },
  ];

  const protectedLinks = [
    { title: "Cart", link: "/cart" },
    { title: "Profile", link: "/profile" },
  ];

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/logout`,
        {},
        { withCredentials: true }
      );

      dispatch(authActions.logout());
      setMobileNav(false);
    } catch (error) {
      console.log(error.response?.data);
    }
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="z-50 relative flex bg-zinc-800 text-white px-8 py-4 items-center justify-between">
        <div className="flex shrink-0 items-center gap-2">
          <BackButton />
          <Link
            to="/"
            aria-label="BookSet home"
            className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#eeeade]"
          >
            <img
              src="/bookset-logo.png"
              alt="BookSet"
              className="absolute inset-0 h-full w-full scale-[1.5] object-cover object-center"
            />
          </Link>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {publicLinks.map((item, i) => (
            <Link
              key={i}
              to={item.link}
              className="hover:text-blue-500 transition"
            >
              {item.title}
            </Link>
          ))}

          {isLoggedIn &&
            protectedLinks.map((item, i) => (
              <Link
                key={i}
                to={item.link}
                className="hover:text-blue-500 transition"
              >
                {item.title}
              </Link>
            ))}

          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="px-4 py-2 border border-blue-500 rounded hover:bg-white hover:text-zinc-800 transition"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="px-4 py-2 bg-blue-500 rounded hover:bg-white hover:text-zinc-800 transition"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMobileNav(!mobileNav)}
        >
          <FaGripLines />
        </button>
      </nav>

      {/* MOBILE MENU */}
      {mobileNav && (
        <div className="md:hidden bg-zinc-800 h-screen fixed top-0 left-0 w-full z-40 flex flex-col items-center justify-center">
          {publicLinks.map((item, i) => (
            <Link
              key={i}
              to={item.link}
              className="text-white text-2xl mb-6 font-semibold hover:text-blue-500"
              onClick={() => setMobileNav(false)}
            >
              {item.title}
            </Link>
          ))}

          {isLoggedIn &&
            protectedLinks.map((item, i) => (
              <Link
                key={i}
                to={item.link}
                className="text-white text-2xl mb-6 font-semibold hover:text-blue-500"
                onClick={() => setMobileNav(false)}
              >
                {item.title}
              </Link>
            ))}

          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="px-6 py-2 mb-4 border border-blue-500 rounded text-xl"
                onClick={() => setMobileNav(false)}
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="px-6 py-2 bg-blue-500 rounded text-xl"
                onClick={() => setMobileNav(false)}
              >
                Sign Up
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500 rounded text-xl"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;
