import React from 'react'
import { Link } from "react-router-dom";

const hero = () => {
  return (
    <div className='h-[75vh] flex flex-col md:flex-row item-center justify-center'>
      <div className='w-full mb-12 md:mb-0 lg:w-3/6 flex flex-col items-center lg:items-start justify-center'>
      <h1 className='text-6xl font-semibold text-yellow-100 text-center lg:text-left'>
        Discover Your Next Great Read</h1>
        <p className='mt-4 text-xl text-zinc-300'>Uncover captiviating stories, enriching knowlege,
             and endless inspiration in our curated collection of books</p>
             <div className='mt-8'>
                <Link 
                to="/Bestsellers" className='text-yellow-100 text-2xl font-semibold border border-yellow-100 px-10 py-3 hover:bg-zinc-800 rounded-full'>
                Discover Books
             </Link>
             </div>
      </div>
      <div className='lg:w-3/6'>
      <img src="./Hero.png" alt="hero" />
      </div>
    </div>
  )
}

export default hero
