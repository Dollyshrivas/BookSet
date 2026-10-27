import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { API_BASE_URL } from "../api";

const Signup = () => {
  const [Values, setValues ] = useState({
    username: "",
    email: "",
    password: "",
    address: "",
  });
  const navigate = useNavigate();

  const change = (e) =>{
    const { name,value } = e.target;
    setValues({ ...Values, [name]: value });
  };

  const submit = async (e) => {
  e.preventDefault();

  if (!Values.username || !Values.email || !Values.password || !Values.address) {
    alert("All fields are required");
    return;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/sign-up`,
      Values
    );

    console.log(response.data);
    alert("Signup successful!");
    navigate("/Login");
  } catch (error) {
    console.log(error.response?.data || error.message);
    alert(error.response?.data?.message || "Something went wrong");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-zinc-900 to-black px-4">
      
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-zinc-700">
        
        {/* Heading */}
        <h2 className="text-3xl font-bold text-center text-white">
          Create Account
        </h2>
        <p className="text-center text-zinc-400 mt-2">
          Join us and start your journey ✨
        </p>

        {/* Form */}
        <form className="mt-8 space-y-5" onSubmit={submit}>
  
  <input
    type="text"
    name="username"
    placeholder="Username"
    required
    className="w-full px-4 py-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    value={Values.username}
    onChange={change}
  />

  <input
    type="email"
    name="email"
    placeholder="Email address"
    required
    className="w-full px-4 py-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    value={Values.email}
    onChange={change}
  />

  <input
    type="password"
    name="password"
    placeholder="Password"
    required
    className="w-full px-4 py-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    value={Values.password}
    onChange={change}
  />

  <textarea
    rows="3"
    name="address"
    placeholder="Address"
    required
    className="w-full px-4 py-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    value={Values.address}
    onChange={change}
  ></textarea>

  <button
    type="submit"
    className="w-full p-3 rounded-lg bg-gradient-to-r 
    from-indigo-600 to-purple-600 text-white font-semibold 
    shadow-lg hover:shadow-indigo-500/50 
    hover:scale-[1.02] transition-all duration-300"
  >
    Sign Up
  </button>

</form>

        {/* Footer */}
        <p className="text-center text-zinc-400 mt-6">
          Already have an account?
          <span
          onClick={() => navigate("/login")}
          className="text-indigo-500 font-semibold cursor-pointer ml-1 hover:underline">
            Login
          </span>
        </p>
      </div>
    </div>


  )
}

export default Signup
