import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import BookCover from "../components/BookCover";
import { API_BASE_URL } from "../api";
import { cartActions } from "../store/cart";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

const ProfileOrders = () => {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    axios
      .get(`${API_BASE_URL}/orders`, { withCredentials: true })
      .then(({ data }) => {
        if (active) setOrders(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || "Could not load your orders");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const pendingQrOrders = orders.filter(
      (order) =>
        order.paymentMethod === "upi_qr" &&
        order.paymentStatus === "pending" &&
        order.razorpayQrCodeId
    );
    if (pendingQrOrders.length === 0) return undefined;

    let active = true;
    let checking = false;
    const checkPayments = async () => {
      if (checking) return;
      checking = true;
      try {
        const results = await Promise.all(pendingQrOrders.map(async (order) => {
          const { data } = await axios.get(
            `${API_BASE_URL}/orders/${order._id}/status`,
            { withCredentials: true }
          );
          return { orderId: order._id, paymentStatus: data.paymentStatus };
        }));
        if (!active) return;
        setError("");

        const paidIds = new Set(
          results.filter((result) => result.paymentStatus === "paid").map((result) => result.orderId)
        );
        if (paidIds.size > 0) {
          setOrders((current) => current.map((order) =>
            paidIds.has(order._id) ? { ...order, paymentStatus: "paid" } : order
          ));
          dispatch(cartActions.clearCart());
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.message ||
            "Could not refresh pending QR payment status. Please try again."
          );
        }
      } finally {
        checking = false;
      }
    };

    checkPayments();
    const timer = window.setInterval(checkPayments, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [dispatch, orders]);

  if (loading) return <p className="text-zinc-300">Loading your orders...</p>;
  if (error && orders.length === 0) return <p role="alert" className="text-red-300">{error}</p>;
  if (orders.length === 0) {
    return (
      <div className="p-6 text-center text-zinc-300">
        <h2 className="mb-2 text-lg font-semibold text-white">No orders yet</h2>
        <p>Books you order will appear here.</p>
        <Link to="/Bestsellers" className="mt-4 inline-block text-yellow-200 underline">
          Browse books
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">My Orders</h1>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {orders.map((order) => (
        <article key={order._id} className="rounded-lg border border-zinc-700 bg-zinc-900 p-5">
          <header className="mb-4 flex flex-wrap justify-between gap-2 border-b border-zinc-700 pb-3">
            <div>
              <h2 className="font-semibold text-white">Order #{order._id.slice(-8)}</h2>
              <p className="mt-1 text-sm text-zinc-400">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <span className={`text-sm ${order.paymentStatus === "paid" ? "text-green-300" : "text-yellow-200"}`}>
              {order.paymentStatus === "paid"
                ? "Paid"
                : order.paymentMethod === "cod"
                  ? "Cash on delivery · Pay when delivered"
                  : order.paymentStatus === "pending" && order.paymentMethod === "upi_qr"
                    ? "Payment pending · UPI QR"
                    : order.paymentStatus === "pending" ? "Payment pending" : order.paymentStatus}
            </span>
          </header>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={`${order._id}-${item.productId}-${index}`} className="flex items-center gap-3">
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-zinc-800">
                  <BookCover src={item.image} alt={`${item.title} cover`} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium text-white">{item.title}</h3>
                  {item.author && <p className="text-sm text-zinc-400">{item.author}</p>}
                </div>
                <span className="font-medium text-yellow-200">{formatPrice(item.price)}</span>
              </div>
            ))}
          </div>
          <footer className="mt-4 border-t border-zinc-700 pt-3 text-right font-semibold text-white">
            Total: {formatPrice(order.total)}
          </footer>
          {order.paymentMethod === "upi_qr" &&
            order.paymentStatus === "pending" &&
            (
              <div className="mt-4 flex flex-col items-center gap-3 rounded-lg bg-zinc-800 p-4 sm:flex-row">
                <img
                  src={order.razorpayQrCodeImageUrl || "/upi-payment-qr.jpeg"}
                  alt="UPI payment QR code"
                  className="aspect-square w-40 rounded bg-white p-1"
                />
                <div className="text-center sm:text-left">
                  <p className="font-semibold text-white">
                    Scan to pay {formatPrice(order.total)}
                  </p>
                  <p role="status" className="mt-1 text-sm text-zinc-300">
                    {order.razorpayQrCodeImageUrl
                      ? "Waiting for payment confirmation."
                      : "Enter this amount in your UPI app. This static QR cannot confirm payment automatically."}
                  </p>
                </div>
              </div>
            )}
        </article>
      ))}
    </section>
  );
};

export default ProfileOrders;
