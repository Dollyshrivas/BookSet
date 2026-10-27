import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { cartActions } from "../store/cart";
import { useNavigate } from "react-router-dom";



const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);

  const totalPrice = cartItems.reduce(
    (total, item) =>  total +item.price,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-purple-950 text-white px-4 md:px-20 py-12">
      <h1 className="text-4xl font-bold mb-10 text-center">
        🛒 Your Cart
      </h1>

      {cartItems.length === 0 ? (
        <p className="text-center text-gray-400 text-lg">
          Your cart is empty
        </p>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-6 bg-white/10 p-4 rounded-xl"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-24 h-32 object-cover rounded-lg"
                />

                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {item.title}
                    </h2>
                    <p className="text-gray-400">
                      {item.author}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <span className="text-indigo-400 font-bold">
                      ₹{item.price}
                    </span>

                    <button
                      onClick={() =>
                        dispatch(
                          cartActions.removeFromCart(item.id)
                        )
                      }
                      className="bg-red-500 px-4 py-1 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/10 p-6 rounded-xl h-fit">
            <h2 className="text-2xl font-bold mb-6">
              Order Summary
            </h2>

            <div className="flex justify-between mb-4">
              <span>Total Items:</span>
              <span>{cartItems.length}</span>
            </div>

            <div className="flex justify-between mb-6 text-lg font-semibold">
              <span>Total Price:</span>
              <span>₹{totalPrice}</span>
            </div>

            <button
  onClick={() => navigate("/checkout")}
  className="w-full bg-indigo-600 py-3 rounded-lg"
>
  Proceed to Checkout
</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;