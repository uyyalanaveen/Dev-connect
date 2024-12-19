import React from 'react';
import avatar from '../../assets/avatar.png';
import { FiSettings } from 'react-icons/fi';
import UsersCard from './UserCard';

const RoomCard = () => {
  return (
    <div className='flex flex-col bg-transparent lg:w-96 border border-gray-700 rounded-lg shadow-lg transition-transform transform hover:scale-105'>
      {/* Room Header */}
      <div className='p-4 border-b border-gray-700 flex flex-col items-center'>
        <div className='flex items-center space-x-4 h-10'>
          {/* <img src={avatar} alt='Room Avatar' className='w-10 h-10 rounded-full' /> */}
          <h3 className='text-xl font-bold text-white'>Room Name</h3>
          <FiSettings className='text-2xl p-1 rounded-full text-gray-400 hover:text-gray-300 cursor-pointer transition-colors duration-200' />
        </div>
        <p className='text-sm text-gray-500 mt-2'>Room Description</p>
      </div>

      {/* User Cards Section */}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4'>
        {[...Array(8)].map((_, index) => (
          <UsersCard key={index} />
        ))}
      </div>

      {/* Join Room Button */}
      <button className='p-4 bg-blue-600 text-white font-semibold rounded-b-lg hover:bg-blue-700 transition-colors duration-200'>
        Join Room
      </button>
    </div>
  );
};

export default RoomCard;