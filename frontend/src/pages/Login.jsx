import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authActions } from "../store/auth";
import { useDispatch } from "react-redux";
import axios from "axios";
import { API_BASE_URL } from "../api";

const Login = () => {
  const [Values, setValues] = useState({
    username: "",
    password: "",
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const change = (e) => {
    const { name, value } = e.target;
    setValues({ ...Values, [name]: value });
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!Values.username || !Values.password) {
      alert("All fields are required");
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/sign-in`,
        Values,
        { withCredentials: true }
      );

      dispatch(authActions.login());  // ⭐ Important
      navigate("/profile");
      alert("Login successful!");
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-zinc-900 to-black px-4">
    
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

    <form
      onSubmit={submit}
      className="relative w-full max-w-md p-8 rounded-2xl 
      bg-white/10 backdrop-blur-xl border border-white/20 
      shadow-2xl transition-all duration-500 hover:scale-[1.02]"
    >
      
      <h2 className="text-3xl font-bold text-center text-white mb-6">
        Welcome Back 👋
      </h2>

      {/* Username */}
      <div className="mb-4">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={Values.username}
          onChange={change}
          className="w-full p-3 rounded-lg bg-zinc-800/70 text-white 
          border border-zinc-600 focus:border-indigo-500 
          focus:ring-2 focus:ring-indigo-500 outline-none 
          transition-all duration-300"
        />
      </div>

      {/* Password */}
      <div className="mb-2">
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={Values.password}
          onChange={change}
          className="w-full p-3 rounded-lg bg-zinc-800/70 text-white 
          border border-zinc-600 focus:border-indigo-500 
          focus:ring-2 focus:ring-indigo-500 outline-none 
          transition-all duration-300"
        />
      </div>

      {/* Remember + Forgot */}
      <div className="flex justify-between items-center mb-6 text-sm text-gray-300">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-indigo-600" />
          Remember me
        </label>

        <span className="hover:text-indigo-400 cursor-pointer transition">
          Forgot password?
        </span>
      </div>

      {/* Button */}
      <button
        type="submit"
        className="w-full p-3 rounded-lg bg-gradient-to-r 
        from-indigo-600 to-purple-600 text-white font-semibold 
        shadow-lg hover:shadow-indigo-500/50 
        hover:scale-[1.02] transition-all duration-300"
      >
        Login
      </button>

      {/* Signup */}
      <p className="text-center text-gray-400 mt-6">
        Don’t have an account?{" "}
        <span
          onClick={() => navigate("/signup")}
          className="text-indigo-400 hover:text-indigo-300 cursor-pointer transition"
        >
          Sign up
        </span>
      </p>
    </form>
  </div>
);
};

export default Login;
