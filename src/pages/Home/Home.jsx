
import React, { useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import RoomCard from '../../components/Cards/RoomCard';
import CreateRoomForm from '../../components/RoomComponents/CreateRoomForm';

const Home = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user details from session storage
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    setUser(storedUser);

    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('https://dev-conncet-backend.onrender.com/api/get-rooms', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
     

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch rooms');
      }

      setRooms(data.rooms);
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
    setRooms(prevRooms => [newRoom, ...prevRooms]); // Add new room to list
    setIsModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">DevConnect Rooms</h1>
        <button onClick={handleCreateRoomClick} className="bg-green-600 px-4 py-2 rounded-lg text-white flex items-center">
          <Plus className="h-4 w-4 mr-2" /> Create Room
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {isLoading ? (
        <div className="flex justify-center items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span>Loading rooms...</span>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center text-lg text-gray-400">No rooms available. Create your first room!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard
              key={room._id}
              roomName={room.name}
              roomDescription={room.description}
              users={room.participants || []}
              roomId={room._id}
              maxParticipants={room.maxParticipants}
              ispublic={!room.isPrivate}
              createdBy={room.createdBy?.fullname} // Pass creator's ID
              onJoinSuccess={fetchRooms}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <CreateRoomForm onRoomCreated={handleRoomCreated} onClose={() => setIsModalOpen(false)} createdBy={user?.fullname} />
      )}
    </div>
  );
};

export default Home;
