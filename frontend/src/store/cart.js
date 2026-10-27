import { createSlice } from "@reduxjs/toolkit";

const normalizePrice = (price) => {
  const numericPrice = typeof price === "number"
    ? price
    : Number(String(price).replace(/[^\d.-]/g, ""));
  return Number.isFinite(numericPrice) ? numericPrice : 0;
};

const loadStoredCart = () => {
  try {
    const storedItems = JSON.parse(localStorage.getItem("cartItems") || "[]");
    return Array.isArray(storedItems)
      ? storedItems.map((item) => ({ ...item, price: normalizePrice(item.price) }))
      : [];
  } catch {
    return [];
  }
};

const initialState = {
  items: loadStoredCart(),
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action) {
      const item = {
        ...action.payload,
        price: normalizePrice(action.payload.price),
      };

      const existingItem = state.items.find(
        (i) => i.id === item.id
      );

      if (!existingItem) {
        state.items.push(item);
      }

      // Save to localStorage
      localStorage.setItem("cartItems", JSON.stringify(state.items));
    },

    removeFromCart(state, action) {
      state.items = state.items.filter(
        (item) => item.id !== action.payload
      );

      localStorage.setItem("cartItems", JSON.stringify(state.items));
    },

    clearCart(state) {
      state.items = [];
      localStorage.removeItem("cartItems");
    },
  },
});

export const cartActions = cartSlice.actions;
export default cartSlice.reducer;