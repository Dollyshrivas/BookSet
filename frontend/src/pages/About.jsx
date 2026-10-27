import React from "react";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate(); 
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-indigo-950 text-white px-6 py-16">
      
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto text-center mb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          About <span className="text-indigo-400">Bookset</span> 📚
        </h1>
        <p className="text-gray-400 text-lg max-w-3xl mx-auto">
          Bookset is more than just a bookstore — it's a digital home for readers.
          We connect stories with souls, ideas with minds, and books with the
          people who need them most.
        </p>
      </div>

      {/* Our Story Section */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center mb-20">
        
        <div>
          <h2 className="text-3xl font-bold mb-6 text-purple-400">
            Our Story ✨
          </h2>
          <p className="text-gray-300 mb-4">
            Bookset was created with a simple vision — to make discovering books
            easier, smarter, and more enjoyable. In a fast-moving digital world,
            we believe reading remains the most powerful tool for growth.
          </p>
          <p className="text-gray-400">
            Whether you're into fiction, self-development, technology, or academic
            learning, Bookset curates the best collections for every reader.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 
        p-8 rounded-2xl shadow-2xl">
          <h3 className="text-2xl font-semibold mb-4 text-indigo-400">
            Why Choose Bookset?
          </h3>
          <ul className="space-y-3 text-gray-300">
            <li>📚 Wide range of genres</li>
            <li>🚀 Fast and seamless browsing</li>
            <li>💎 Carefully curated bestsellers</li>
            <li>🔒 Secure and smooth checkout</li>
            <li>📖 Reader-first experience</li>
          </ul>
        </div>

      </div>

      {/* Values Section */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mb-20">
        
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 
        p-8 rounded-2xl shadow-xl hover:scale-105 transition duration-500">
          <h3 className="text-xl font-semibold mb-4 text-pink-400">
            📖 Passion for Reading
          </h3>
          <p className="text-gray-300">
            We believe books inspire imagination, build knowledge,
            and transform lives.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 
        p-8 rounded-2xl shadow-xl hover:scale-105 transition duration-500">
          <h3 className="text-xl font-semibold mb-4 text-indigo-400">
            🌍 Community Driven
          </h3>
          <p className="text-gray-300">
            Bookset connects readers worldwide and creates a
            shared space for literary exploration.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 
        p-8 rounded-2xl shadow-xl hover:scale-105 transition duration-500">
          <h3 className="text-xl font-semibold mb-4 text-purple-400">
            💡 Innovation
          </h3>
          <p className="text-gray-300">
            We combine technology and creativity to deliver
            a smooth and enjoyable bookstore experience.
          </p>
        </div>

      </div>

      {/* CTA Section */}
      <div className="text-center">
        <h3 className="text-3xl font-bold mb-4">
          Discover Your Next Favorite Book 📚
        </h3>
        <p className="text-gray-400 mb-6">
          Join Bookset today and start your reading journey.
        </p>
        <button
         className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg hover:scale-105 transition duration-300"
         onClick={() => navigate("/Bestsellers")}
         >
          Explore Books
        </button>
      </div>

    </div>
  );
};

export default About;
