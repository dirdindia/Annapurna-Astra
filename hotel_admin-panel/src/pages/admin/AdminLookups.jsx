import React, { useState, useEffect } from "react";
import api from "../../api";
import { showSuccess, showError, showConfirm } from "../../utils/alerts";
import { Database, Plus, Edit2, Trash2, ListTree, ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function AdminLookups({ isComponent = false }) {
  const [lookups, setLookups] = useState([]);
  const [allLookups, setAllLookups] = useState([]); // For parent dropdown
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    type: "INVENTORY_ITEM",
    parent: "",
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lookupTypes = [
    { value: "INVENTORY_ITEM", label: "Inventory Item" },
    { value: "DISH_CATEGORY", label: "Dish Category" },
    { value: "OTHER", label: "Other" }
  ];

  useEffect(() => {
    fetchLookups();
  }, [page, search]);

  useEffect(() => {
    fetchAllLookups();
  }, []);

  const fetchAllLookups = async () => {
    try {
      const res = await api.get("/api/lookups?limit=1000");
      if (res.data.success) {
        setAllLookups(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLookups = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/lookups?page=${page}&limit=${limit}&search=${search}`);
      if (res.data.success) {
        setLookups(res.data.data);
        setTotalPages(res.data.pages);
      }
    } catch (err) {
      console.error("Failed to fetch lookups:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (lookup = null) => {
    if (lookup) {
      setFormData({
        id: lookup._id,
        name: lookup.name,
        type: lookup.type,
        parent: lookup.parent?._id || "",
        isActive: lookup.isActive
      });
    } else {
      setFormData({
        id: null,
        name: "",
        type: "INVENTORY_ITEM",
        parent: "",
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        parent: formData.parent || null,
        isActive: formData.isActive
      };

      if (formData.id) {
        // Update
        const res = await api.put(`/api/lookups/${formData.id}`, payload);
        if (res.data.success) {
          showSuccess("Success", "Lookup updated successfully");
        }
      } else {
        // Create
        const res = await api.post("/api/lookups", payload);
        if (res.data.success) {
          showSuccess("Success", "Lookup created successfully");
        }
      }
      setShowModal(false);
      fetchLookups();
      fetchAllLookups();
    } catch (error) {
      showError("Error", error.response?.data?.message || "Failed to save lookup");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await showConfirm(
      "Are you sure?",
      "This will permanently delete the lookup.",
      "Yes, delete it!"
    );

    if (result.isConfirmed) {
      try {
        const res = await api.delete(`/api/lookups/${id}`);
        if (res.data.success) {
          showSuccess("Deleted!", "Lookup has been deleted.");
          fetchLookups();
          fetchAllLookups();
        }
      } catch (error) {
        showError("Error", error.response?.data?.message || "Failed to delete");
      }
    }
  };

  // Helper to group lookups by type
  const groupedLookups = lookups.reduce((acc, curr) => {
    if (!acc[curr.type]) acc[curr.type] = [];
    acc[curr.type].push(curr);
    return acc;
  }, {});

  return (
    <div className={`${isComponent ? '' : 'flex-1 p-6 space-y-8'} overflow-x-hidden h-full flex flex-col`}>
      
      {/* HEADER SECTION */}
      {!isComponent && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 no-print">
          <div>
            <h1 className="text-3xl font-bold text-amber-500 flex items-center gap-3">
              <Database className="w-8 h-8" />
              Lookups Master Data
            </h1>
            <p className="text-slate-400 mt-1">
              Manage system-wide dropdown values, categories, and hierarchical lists.
            </p>
          </div>
          
          <button
            onClick={() => handleOpenModal()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Lookup
          </button>
        </div>
      )}

      {/* FILTER & COMPONENT HEADER */}
      {isComponent && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search lookups..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Lookup
          </button>
        </div>
      )}

      {/* SEARCH FOR NON-COMPONENT */}
      {!isComponent && (
        <div className="flex justify-end mb-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search lookups by name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-amber-500 font-semibold animate-pulse">Loading lookups...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {Object.keys(groupedLookups).map((type) => {
            const typeLabel = lookupTypes.find(t => t.value === type)?.label || type;
            return (
              <div key={type} className="glass-card rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                  <ListTree className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-slate-200">{typeLabel}</h2>
                </div>
                
                <div className="space-y-3">
                  {groupedLookups[type].map(lookup => (
                    <div key={lookup._id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800/60 hover:border-slate-700 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${lookup.isActive ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                            {lookup.name}
                          </span>
                          {!lookup.isActive && <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">Inactive</span>}
                        </div>
                        {lookup.parent && (
                          <p className="text-xs text-amber-500/70 mt-1 flex items-center gap-1">
                            <ListTree className="w-3 h-3" />
                            Parent: {lookup.parent.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenModal(lookup)} className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(lookup._id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.keys(groupedLookups).length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800/50">
              No lookups found. Add some to get started.
            </div>
          )}
        </div>
      )}
      
      {/* PAGINATION CONTROLS */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm font-medium text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                {formData.id ? "Edit Lookup" : "Add Lookup"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto overflow-x-hidden">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Lookup Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value, parent: "" })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
                  >
                    {lookupTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rice, Veg, Dairy..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Parent (Optional)</label>
                  <select
                    value={formData.parent}
                    onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
                  >
                    <option value="">-- No Parent --</option>
                    
                    {allLookups
                      .filter(l => l.type === formData.type && l._id !== formData.id)
                      .map(l => (
                        <option key={l._id} value={l._id}>{l.name}</option>
                    ))}
                  </select>
                </div> */}

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/50"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-300">
                    Active (Available in dropdowns)
                  </label>
                </div>

                <div className="pt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-amber-500 text-slate-950 px-5 py-2.5 rounded-xl font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Lookup"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
