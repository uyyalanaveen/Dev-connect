import React, { useEffect, useState } from 'react';
import { Plus, Loader2, Search, MessageCircle, X, MinusIcon } from 'lucide-react';
import RoomCard from '../../components/Cards/RoomCard';
import CreateRoomForm from '../../components/RoomComponents/CreateRoomForm';

const Home = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    setUser(storedUser);
    fetchRooms();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRooms(rooms);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const filtered = rooms.filter(room => 
        room.name.toLowerCase().includes(lowerCaseSearchTerm) || 
        (room.technologies && Array.isArray(room.technologies) && room.technologies.some(tech => 
          tech.toLowerCase().includes(lowerCaseSearchTerm)
        ))
      );
      setFilteredRooms(filtered);
    }
  }, [searchTerm, rooms]);

  const fetchRooms = async () => {
    try {
      const response = await fetch('https://devconnect-backend-6opy.onrender.com/api/get-rooms', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch rooms');
      }

      const roomsWithTech = data.rooms.map(room => ({
        ...room,
        technologies: room.technology || []
      }));

      setRooms(roomsWithTech);
      setFilteredRooms(roomsWithTech);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoomClick = () => {
    setIsModalOpen(true);
  };

  const handleRoomCreated = (newRoom) => {
    const roomWithTech = {
      ...newRoom,
      technologies: newRoom.technologies || []
    };
    
    setRooms(prevRooms => [roomWithTech, ...prevRooms]);
    setIsModalOpen(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">DevConnect Rooms</h1>
        <button 
          onClick={handleCreateRoomClick} 
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white flex items-center transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" /> Create Room
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="bg-gray-800 text-white w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Search by room name or technology..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {isLoading ? (
        <div className="flex justify-center items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span>Loading rooms...</span>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center text-lg text-gray-400">
          {rooms.length === 0 
            ? "No rooms available. Create your first room!" 
            : "No rooms match your search criteria."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room._id}
              roomName={room.name}
              roomDescription={room.description}
              users={room.participants || []}
              roomId={room._id}
              maxParticipants={room.maxParticipants}
              ispublic={!room.isPrivate}
              createdBy={room.createdBy?.fullname}
              technologies={room.technologies}
              onJoinSuccess={fetchRooms}
            />
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      {isModalOpen && (
        <CreateRoomForm 
          onRoomCreated={handleRoomCreated} 
          onClose={() => setIsModalOpen(false)} 
          createdBy={user?.fullname} 
        />
      )}
    </div>
  );
};

export default Home;