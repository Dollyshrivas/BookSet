import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const change = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError("");
    setNotice("");

    try {
      const { data } = await axios.post(`${API_BASE_URL}/contact`, form);
      setForm({ name: "", email: "", message: "" });
      setNotice(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-indigo-950 text-white px-6 py-16">
      
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left Side Info */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Get In Touch 💬
          </h1>
          <p className="text-gray-400 mb-8">
            Have questions, ideas, or feedback? We'd love to hear from you.
            Fill out the form and our team will respond as soon as possible.
          </p>

          <div className="space-y-4 text-gray-300">
            <p>📍 Location: New Delhi,India</p>
            <p>📧 Email: dollyshrivas2005@gmail.com</p>
            <p>📞 Phone: +91 9971018840</p>
          </div>
        </div>

        {/* Right Side Form */}
        <form
          onSubmit={submit}
          className="bg-white/10 backdrop-blur-xl border border-white/20 
        p-8 rounded-2xl shadow-2xl space-y-6"
        >
          
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={form.name}
            onChange={change}
            maxLength={120}
            required
            aria-label="Your name"
            className="w-full p-3 rounded-lg bg-zinc-800/70 border border-zinc-600 
            focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
          />

          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={form.email}
            onChange={change}
            maxLength={254}
            required
            aria-label="Your email"
            className="w-full p-3 rounded-lg bg-zinc-800/70 border border-zinc-600 
            focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
          />

          <textarea
            name="message"
            rows="4"
            placeholder="Your Message"
            value={form.message}
            onChange={change}
            maxLength={5000}
            required
            aria-label="Your message"
            className="w-full p-3 rounded-lg bg-zinc-800/70 border border-zinc-600 
            focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
          />

          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          {notice && <p role="status" className="text-sm text-green-300">{notice}</p>}

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 
            rounded-lg shadow-lg hover:scale-105 transition duration-300 disabled:cursor-wait disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send Message"}
          </button>

        </form>

      </div>
    </div>
  );
};

export default Contact;
