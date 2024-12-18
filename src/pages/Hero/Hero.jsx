import React from 'react'

const Hero = () => {
    return (
        <div className="h-screen text-white flex flex-col items-center justify-center text-center  p-10 bg-black overflow-hidden">
            <h1 className="text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-green-400">Dev Connect</h1>
            <p className="text-lg opacity-80 mb-6">Your platform for developer collaboration and learning.</p>
            <a className="bg-gradient-to-r from-blue-500 to-green-400 text-black py-3 px-6 rounded-xl shadow-md text-lg font-semibold hover:scale-105 transition"
                href='/login'
            >
                Join Now
            </a>
        </div>

    )
}

export default Hero