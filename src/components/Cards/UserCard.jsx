import React from 'react';
import avatar from '../../assets/Avatar.png'; // Ensure this path is correct

const UserCard = ({ user }) => {
  return (
    <div className="flex flex-col items-center py-2 transition-transform transform hover:scale-105 rounded-lg">
      <img src={avatar} alt="User Avatar" className="w-10 h-10 rounded-full mb-1" />
      <h3 className="text-sm font-semibold text-gray-700">{user}</h3>
    </div>
  );
};

export default UserCard;
