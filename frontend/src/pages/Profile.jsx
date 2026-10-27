import React, { useEffect, useState } from "react";
import Sidebar from "../components/Profile/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../api";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/get-user-information`,
          {
            withCredentials: true,
          }
        );

        const user = res.data.user || res.data;
        setUserData(user);
      } catch (error) {
        console.log(
          "ERROR:",
          error.response?.data || error.message
        );

        if (error.response?.status === 401) {
          navigate("/login");
        } else {
          setError("Failed to load user data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // Loading UI
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-white">
        <p className="text-lg animate-pulse">
          Loading profile...
        </p>
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  // No Data
  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-gray-400">
        <p>No user data found</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 min-h-screen px-4 md:px-12 py-8 text-white">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <div className="w-full md:w-1/5 md:sticky md:top-6 h-fit">
          <Sidebar data={userData} />
        </div>

        {/* Main Content */}
        <main className="w-full md:w-4/5 rounded-lg bg-zinc-800 p-5 md:p-8">
          <Outlet context={{ userData }} />
        </main>
      </div>
    </div>
  );
};

export default Profile;
