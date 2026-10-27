import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isLoggedIn: false,
    authChecked: false, 
  },
  reducers: {
    login: (state) => {
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.isLoggedIn = false;
    },
    setAuthChecked: (state) => {
      state.authChecked = true;
    },
  },
});

export const authActions = authSlice.actions;
export default authSlice.reducer;
