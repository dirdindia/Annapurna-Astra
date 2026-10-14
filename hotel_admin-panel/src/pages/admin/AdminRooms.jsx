import React, { useState, useEffect } from "react";
import { BedDouble, Plus, Edit, Trash2, X } from "lucide-react";
import api from "../../api";
import { showError, showSuccess, showConfirm, showAlert } from "../../utils/alerts";

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: "",
    type: "AC",
    price: 1500,
    beds: 1,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/rooms");
      setRooms(res.data.data);
    } catch (error) {
      console.error(error);
      showError("Error", "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === "price" || name === "beds") ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/api/rooms/${editingId}`, formData);
        showSuccess("Success", "Room updated successfully");
      } else {
        await api.post("/api/rooms", formData);
        showSuccess("Success", "Room added successfully");
      }
      setShowModal(false);
      fetchRooms();
    } catch (error) {
      showError("Error", error.response?.data?.message || "Failed to save room");
    }
  };

  const openEditModal = (room) => {
    setIsEditing(true);
    setEditingId(room._id);
    setFormData({
      roomNumber: room.roomNumber,
      type: room.type,
      price: room.price,
      beds: room.beds || 1,
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      roomNumber: "",
      type: "AC",
      price: 1500,
      beds: 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await showConfirm(
      "Are you sure?",
      "You won't be able to revert this!",
      "Yes, delete it!"
    );

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/rooms/${id}`);
        showSuccess("Deleted!", "Room has been deleted.");
        fetchRooms();
      } catch (error) {
        showError("Error", "Failed to delete room");
      }
    }
  };

  // Seed default rooms
  const handleSeedRooms = async () => {
    const result = await showConfirm(
      "Seed Default Rooms?",
      "This will add 10 AC, 10 Non-AC, and 20 Hall beds automatically.",
      "Yes, Seed Now"
    );

    if (result.isConfirmed) {
      try {
        setLoading(true);
        // AC
        for(let i=1; i<=10; i++) {
          await api.post("/api/rooms", { roomNumber: `AC-${100+i}`, type: "AC", price: 1500 });
        }
        // Non-AC
        for(let i=1; i<=10; i++) {
          await api.post("/api/rooms", { roomNumber: `NAC-${200+i}`, type: "Non-AC", price: 500 });
        }
        // Hall
        for(let i=1; i<=20; i++) {
          await api.post("/api/rooms", { roomNumber: `Hall-Bed-${i}`, type: "Hall", price: 150 });
        }
        showSuccess("Success", "Default rooms seeded successfully");
        fetchRooms();
      } catch (error) {
        showAlert("Notice", "Some rooms might already exist. Check list.", "info");
        fetchRooms();
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-amber-500 flex items-center gap-3">
            <BedDouble className="w-8 h-8" />
            Rooms Management
          </h1>
          <p className="text-slate-400 mt-1">Manage all hotel rooms and prices</p>
        </div>
        <div className="flex gap-2">
          {/* <button
            onClick={handleSeedRooms}
            className="px-4 py-2 bg-slate-800 text-amber-500 rounded-xl hover:bg-slate-700 transition-colors border border-amber-500/20"
          >
            Seed Defaults
          </button> */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded-xl hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Room
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl border border-gold-800/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 border-b border-gold-800/20">
              <tr>
                <th className="px-6 py-4 text-slate-300 font-semibold">Room No</th>
                <th className="px-6 py-4 text-slate-300 font-semibold">Type</th>
                <th className="px-6 py-4 text-slate-300 font-semibold">Beds</th>
                <th className="px-6 py-4 text-slate-300 font-semibold">Price</th>
                <th className="px-6 py-4 text-slate-300 font-semibold">Status</th>
                <th className="px-6 py-4 text-right text-slate-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-800/10">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">Loading rooms...</td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">No rooms found. Add a room or click "Seed Defaults".</td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room._id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">{room.roomNumber}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        room.type === 'AC' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        room.type === 'Non-AC' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        room.type === 'Hall' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                      }`}>
                        {room.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{room.beds || 1} Bed{room.beds > 1 ? 's' : ''}</td>
                    <td className="px-6 py-4 text-amber-500 font-semibold">₹{room.price}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        room.status === 'Available' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(room)}
                          className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(room._id)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-gold-800/30 p-6 rounded-2xl w-full max-w-md relative shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-amber-500 mb-6 flex items-center gap-2">
              <BedDouble className="w-5 h-5" />
              {isEditing ? "Edit Room" : "Add Room"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Room / Bed Number</label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  placeholder="e.g. 101 or Hall-Bed-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Room Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={(e) => {
                    handleInputChange(e);
                    // auto set default prices if creating
                    if (!isEditing) {
                      if(e.target.value === 'AC') setFormData(prev => ({...prev, price: 1500}));
                      if(e.target.value === 'Non-AC') setFormData(prev => ({...prev, price: 500}));
                      if(e.target.value === 'Hall') setFormData(prev => ({...prev, price: 150}));
                      if(e.target.value === 'Mini Hall') setFormData(prev => ({...prev, price: 800}));
                    }
                  }}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="AC">AC</option>
                  <option value="Non-AC">Non-AC</option>
                  <option value="Hall">Hall</option>
                  <option value="Mini Hall">Mini Hall</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Number of Beds</label>
                <input
                  type="number"
                  name="beds"
                  value={formData.beds}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 mb-4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl transition-all"
                >
                  {isEditing ? "Update Room" : "Save Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
