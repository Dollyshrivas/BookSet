import React, { useEffect, useState } from "react";
import axios from "axios";
import { cartActions } from "../store/cart";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";

const Checkout = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [qrPayment, setQrPayment] = useState(null);
  const [showQr, setShowQr] = useState(false);

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price,
    0
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const createUpiQr = async () => {
    if (!formData.name || !formData.email || !formData.address) {
      setPaymentError("Please enter your name, email, and shipping address.");
      return;
    }

    setPaying(true);
    setPaymentError("");
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/orders/upi-qr`,
        {
          customer: formData,
          items: cartItems.map((item) => ({ id: item.id })),
        },
        { withCredentials: true }
      );
      setQrPayment(data);
      setShowQr(true);
    } catch (requestError) {
      setPaymentError(
        requestError.response?.data?.message ||
        "Could not create a payment QR. Your cart has been kept."
      );
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    if (!showQr || !qrPayment) return undefined;

    let active = true;
    let checking = false;
    const checkPayment = async () => {
      if (checking) return;
      checking = true;
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/orders/${qrPayment.orderId}/status`,
          { withCredentials: true }
        );
        if (active) setPaymentError("");
        if (active && data.paymentStatus === "paid") {
          dispatch(cartActions.clearCart());
          navigate("/profile/order");
        }
      } catch (requestError) {
        if (active) {
          setPaymentError(
            requestError.response?.data?.message ||
            "Could not check payment status. The QR will keep waiting."
          );
        }
      } finally {
        checking = false;
      }
    };

    checkPayment();
    const timer = window.setInterval(checkPayment, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [dispatch, navigate, qrPayment, showQr]);

  const viewOrders = () => {
    dispatch(cartActions.clearCart());
    navigate("/profile/order");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-purple-950 text-white px-4 md:px-20 py-12">

      <h1 className="text-4xl font-bold text-center mb-12 tracking-wide bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
        Checkout
      </h1>

      {cartItems.length === 0 ? (
        <p className="text-center text-gray-400 text-lg">
          Your cart is empty
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-12">

          
          <div className="space-y-10">

            
            <div className="bg-white/5 backdrop-blur-lg p-8 rounded-3xl border border-purple-800 shadow-2xl shadow-purple-900/40">
              <h2 className="text-2xl mb-6 font-semibold text-purple-300">
                Billing Details
              </h2>

              <div className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-xl bg-zinc-800 focus:ring-2 focus:ring-purple-600 outline-none"
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-xl bg-zinc-800 focus:ring-2 focus:ring-purple-600 outline-none"
                />

                <input
                  type="text"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl bg-zinc-800 focus:ring-2 focus:ring-purple-600 outline-none"
                />

                <textarea
                  name="address"
                  placeholder="Shipping Address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-xl bg-zinc-800 focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>
            </div>

          </div>

         
          <div className="bg-white/5 backdrop-blur-lg p-8 rounded-3xl border border-indigo-800 shadow-2xl shadow-indigo-900/40 h-fit">
            <h2 className="text-2xl font-semibold mb-6 text-indigo-300">
              Order Summary
            </h2>

            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm"
                >
                  <span>{item.title}</span>
                  <span>₹{item.price}</span>
                </div>
              ))}
            </div>

            <hr className="my-6 border-zinc-700" />

            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span className="text-purple-400">₹{totalPrice}</span>
            </div>

            <button
              onClick={createUpiQr}
              disabled={paying}
              className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-pink-600 hover:to-purple-600 transition-all duration-300 py-4 rounded-2xl text-lg font-semibold tracking-wide shadow-lg shadow-purple-900 disabled:cursor-wait disabled:opacity-60"
            >
              {paying ? "Preparing your QR..." : `Show QR · ₹${totalPrice}`}
            </button>
            {paymentError && <p role="alert" className="mt-4 text-sm text-red-300">{paymentError}</p>}
          </div>

        </div>
      )}
      {showQr && qrPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upi-qr-title"
        >
          <section className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-center shadow-2xl">
            <h2 id="upi-qr-title" className="text-2xl font-semibold text-white">
              Scan to pay
            </h2>
            <p className="mt-2 text-zinc-300">Scan with your UPI app. This QR has the order amount prefilled:</p>
            <p className="mt-1 text-3xl font-bold text-yellow-200">
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(qrPayment.amount)}
            </p>
            <img
              src={qrPayment.imageUrl}
              alt="Razorpay UPI QR with this order amount"
              className="mx-auto mt-5 aspect-square w-64 rounded-lg bg-white p-2"
            />
            <p role="status" className="mt-4 text-sm text-zinc-300">
              Waiting for Razorpay to confirm payment. You’ll be redirected to your orders automatically.
            </p>
            {paymentError && <p role="alert" className="mt-3 text-sm text-red-300">{paymentError}</p>}
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={viewOrders}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-white hover:bg-zinc-800"
              >
                Done — view my orders
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Checkout;