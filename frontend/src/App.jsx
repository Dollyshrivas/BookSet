import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import Navbar from "./components/Navbar/Navbar"
import Footer from "./components/Footer/Footer";
import Home from "./pages/Home";
import Bestsellers from "./pages/Bestsellers";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import ProfileFavorite from "./pages/ProfileFavorite";
import ProfileReviews from "./pages/ProfileReviews";
import ProfileOrders from "./pages/ProfileOrders";
import About from "./pages/About";
import Contact from './pages/Contact';
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import SellerDashboard from "./components/Profile/SellerDashboard";


import { authActions } from "./store/auth";
import { API_BASE_URL } from "./api";

const App = () => {
  const dispatch = useDispatch();
  const authChecked = useSelector((state) => state.auth.authChecked);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(
          `${API_BASE_URL}/get-user-information`,
          { withCredentials: true }
        );

        dispatch(authActions.login());
      } catch {
        dispatch(authActions.logout());
      } finally {
        dispatch(authActions.setAuthChecked());
      }
    };

    checkAuth();
  }, [dispatch]);

  if (!authChecked) return null;

  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Bestsellers" element={<Bestsellers />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />}>
          <Route index element={<SellerDashboard />} />
          <Route path="favorite" element={<ProfileFavorite />} />
          <Route path="reviews" element={<ProfileReviews />} />
          <Route path="order" element={<ProfileOrders />} />
        </Route>
        <Route path="/About" element={<About/>} />
        <Route path="/contact" element={<Contact/>} />
        <Route path="/cart" element={<Cart/>} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>

      <Footer />
    </>
  );
};

export default App;
