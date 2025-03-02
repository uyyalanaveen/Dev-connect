import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const CreateRoomForm = ({ onRoomCreated, onClose, createdBy }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxParticipants: 10,
    technologies: [],
    otherTechnology: "",
    isPrivate: false,
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle technology selection
  const handleTechnologyChange = (e) => {
    const value = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({ ...prev, technologies: value }));
  };

  // Handle form submission
  const handleCreateRoom = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    // Validation
    const errors = [];
    if (!formData.name.trim()) errors.push("Room name is required");
    if (!formData.description.trim()) errors.push("Room description is required");
    if (formData.technologies.length === 0) errors.push("Select at least one technology");
    if (formData.technologies.includes("Others") && !formData.otherTechnology.trim()) {
      errors.push("Please specify the other technology");
    }

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setIsLoading(true);
    try {
      const newRoom = {
        name: formData.name,
        description: formData.description,
        maxParticipants: formData.maxParticipants === "unlimited" ? null : formData.maxParticipants,
        technology: formData.technologies.includes("Others")
          ? [...formData.technologies.filter((t) => t !== "Others"), formData.otherTechnology]
          : formData.technologies,
        isPrivate: formData.isPrivate,
        createdBy: createdBy, // Include createdBy in the payload
      };

      const response = await axios.post("https://devconnect-backend-6opy.onrender.com/api/create-room", newRoom, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Room created successfully");
      onRoomCreated(response.data.room);
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to create room";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-black border border-white p-8 rounded-md shadow-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl mb-4 text-white">Create Room</h2>
        <p className="text-white mb-4">Created By: {createdBy}</p> {/* ✅ Display "Created By" */}

        <form className="space-y-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 border text-white border-gray-300 rounded outline-none bg-black"
            placeholder="Room Name"
          />

          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded bg-black text-white"
            placeholder="Room Description"
          />

          <select
            name="technologies"
            multiple
            value={formData.technologies}
            onChange={handleTechnologyChange}
            className="w-full p-2 border border-gray-300 rounded bg-black text-white"
          >
            <option value="JavaScript">JavaScript</option>
            <option value="React">React</option>
            <option value="Node.js">Node.js</option>
            <option value="Others">Others</option>
          </select>

          {formData.technologies.includes("Others") && (
            <input
              type="text"
              name="otherTechnology"
              value={formData.otherTechnology}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded bg-black text-white"
              placeholder="Other Technology"
            />
          )}

          <div className="flex items-center space-x-4">
            <label className="text-white">
              Max Participants:
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                min="2"
                max="100"
                className="p-2 border border-gray-300 rounded bg-black text-white ml-2"
              />
            </label>
            <label className="text-white">
              Private:
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleInputChange}
                className="ml-2"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleCreateRoom}
            className="w-full py-3 bg-blue-500 text-white rounded mt-4"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Room"}
          </button>
        </form>

        <ToastContainer />
      </div>
    </div>
  );
};

export default CreateRoomForm;
