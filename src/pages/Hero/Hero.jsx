import React from 'react'
import { Link } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';

const Hero = () => {
    return (
        <div className="h-full text-white flex flex-col items-center justify-center text-center  p-10 bg-black overflow-hidden mt-36">
            <h1 className="text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-green-400">Dev Connect</h1>
            <p className="text-lg opacity-80 mb-6">Your platform for developer collaboration and learning.</p>
            <Link className="bg-gradient-to-r from-blue-500 to-green-400 text-black py-3 px-6 rounded-xl shadow-md text-lg font-semibold hover:scale-105 transition"
                to='/login'
            >
                Join Now
            </Link>
            <ToastContainer />
        </div>

    )
}

export default Hero