import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { authActions } from '../../store/auth'
import axios from 'axios'
import { API_BASE_URL } from "../../api";

const Sidebar = ({ data }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!data) return null;

  const logoutHandler = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/logout`,
        {},
        { withCredentials: true }
      );

      dispatch(authActions.logout());
      navigate("/login");

    } catch (error) {
      console.log(error.response?.data);
    }
  };

  return (
    <div className='bg-zinc-800 p-6 rounded-lg flex flex-col items-center gap-6'>
      
      {/* Avatar */}
      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-yellow-100 text-3xl font-semibold uppercase text-zinc-900">
        {data.avatar ? (
          <img
            src={data.avatar}
            alt="User Avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          (data.username?.trim()?.charAt(0) || data.email?.trim()?.charAt(0) || "U").toUpperCase()
        )}
      </div>

      {/* User Info */}
      <div className="text-center">
        <h2 className="text-white text-xl font-semibold">
          {data?.username}
        </h2>
        <p className="text-zinc-400 text-sm">
          {data?.email}
        </p>
      </div>

      {/* Navigation */}
      <div className="w-full flex flex-col gap-3 mt-4">

        <NavLink
          to="/profile"
          end
          className={({ isActive }) =>
            `p-3 rounded-lg text-center font-medium transition ${
              isActive
                ? "bg-white text-black"
                : "bg-zinc-700 text-white hover:bg-zinc-600"
            }`
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/profile/settings"
          className={({ isActive }) =>
            `p-3 rounded-lg text-center font-medium transition ${
              isActive
                ? "bg-white text-black"
                : "bg-zinc-700 text-white hover:bg-zinc-600"
            }`
          }
        >
          Settings
        </NavLink>

        <NavLink
          to="/profile/favorite"
          className={({ isActive }) =>
            `p-3 rounded-lg text-center font-medium transition ${
              isActive
                ? "bg-white text-black"
                : "bg-zinc-700 text-white hover:bg-zinc-600"
            }`
          }
        >
          Favorite
        </NavLink>

        <NavLink
          to="/profile/reviews"
          className={({ isActive }) =>
            `p-3 rounded-lg text-center font-medium transition ${
              isActive
                ? "bg-white text-black"
                : "bg-zinc-700 text-white hover:bg-zinc-600"
            }`
          }
        >
          My Reviews
        </NavLink>

        <NavLink
          to="/profile/order"
          className={({ isActive }) =>
            `p-3 rounded-lg text-center font-medium transition ${
              isActive
                ? "bg-white text-black"
                : "bg-zinc-700 text-white hover:bg-zinc-600"
            }`
          }
        >
          Orders
        </NavLink>

        {/* Logout Button */}
        <button
          onClick={logoutHandler}
          className="p-3 rounded-lg text-center font-medium bg-red-600 text-white hover:bg-red-700 transition mt-4"
        >
          Logout
        </button>

      </div>
    </div>
  );
};

export default Sidebar;