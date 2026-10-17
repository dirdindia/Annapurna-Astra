import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../api";
import { showSuccess, showError, showConfirm } from "../../utils/alerts";
import { Database, Plus, Edit2, Trash2, ListTree, ChevronLeft, ChevronRight, Search, CheckCircle2, X } from "lucide-react";
import MagneticButton from "../../components/MagneticButton";

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
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-saffron-400" />
              Lookups Master Data
            </h1>
            <p className="text-slate-300 mt-1 text-sm">
              Manage system-wide dropdown values, categories, and hierarchical lists.
            </p>
          </div>
          
          <MagneticButton>
            <button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-300 hover:to-saffron-400 text-slate-950 px-6 py-2.5 rounded-xl font-extrabold transition-all shadow-lg shadow-saffron-500/20 flex items-center gap-2 cursor-pointer text-sm"
            >
              <Plus className="w-5 h-5" />
              Add New Lookup
            </button>
          </MagneticButton>
        </div>
      )}

      {/* FILTER & COMPONENT HEADER */}
      {isComponent && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search lookups..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[#061C1C]/80 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 shadow-inner"
            />
          </div>
          <MagneticButton>
            <button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-300 hover:to-saffron-400 text-slate-950 px-5 py-2.5 rounded-xl font-extrabold transition-all shadow-lg shadow-saffron-500/20 flex items-center gap-2 text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Lookup
            </button>
          </MagneticButton>
        </div>
      )}

      {/* SEARCH FOR NON-COMPONENT */}
      {!isComponent && (
        <div className="flex justify-end mb-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-saffron-400" />
            <input
              type="text"
              placeholder="Search lookups by name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[#061C1C]/90 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 shadow-inner"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-saffron-400 font-bold animate-pulse py-8 text-center text-sm">Loading lookups...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.keys(groupedLookups).map((type) => {
            const typeLabel = lookupTypes.find(t => t.value === type)?.label || type;
            return (
              <div key={type} className="glass-card rounded-2xl p-6 border border-white/10 bg-[#0A2F2F]/40 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-saffron-500/15 border border-saffron-500/20 text-saffron-400">
                      <ListTree className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-extrabold text-white font-display tracking-wide">{typeLabel}</h2>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                    {groupedLookups[type].length} items
                  </span>
                </div>
                
                <div className="space-y-2.5">
                  {groupedLookups[type].map(lookup => (
                    <div key={lookup._id} className="flex justify-between items-center bg-[#061C1C]/60 p-3.5 rounded-xl border border-white/10 hover:border-saffron-500/40 hover:bg-[#061C1C]/90 transition-all">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className={`font-semibold text-sm ${lookup.isActive ? 'text-white' : 'text-slate-400 line-through'}`}>
                            {lookup.name}
                          </span>
                          {!lookup.isActive && (
                            <span className="text-[10px] uppercase font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md">
                              Disabled
                            </span>
                          )}
                        </div>
                        {lookup.parent && (
                          <p className="text-xs text-saffron-400/90 mt-1 flex items-center gap-1 font-medium">
                            <ListTree className="w-3.5 h-3.5" />
                            Parent: {lookup.parent.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleOpenModal(lookup)} 
                          title="Edit"
                          className="p-2 rounded-lg text-slate-300 hover:text-saffron-400 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(lookup._id)} 
                          title="Delete"
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
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
            <div className="col-span-full text-center py-14 text-slate-300 bg-[#061C1C]/40 rounded-2xl border border-white/10">
              <Database className="w-10 h-10 text-saffron-400/50 mx-auto mb-2" />
              <p className="font-semibold text-sm">No lookups found.</p>
              <p className="text-xs text-slate-400 mt-1">Add items to configure categories and dropdown lists.</p>
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

      {/* ADD/EDIT MODAL - Portaled to document.body to break free of tab container height */}
      {showModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto w-screen h-screen">
          <div className="bg-[#0A2F2F] border border-white/20 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-fade-in lookup-modal-card relative z-[100000]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-[#061C1C]/80 shrink-0 lookup-modal-header">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 flex items-center justify-center font-bold shadow-md shadow-saffron-500/10 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white font-display tracking-wide">
                    {formData.id ? "Edit Lookup Value" : "Add New Lookup Item"}
                  </h2>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Configure master classification & dropdown tags
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)} 
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 shrink-0 ml-2"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Modal Form */}
            <div className="p-5 sm:p-7 overflow-y-auto custom-scrollbar flex-1">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                    Lookup Classification Type <span className="text-saffron-400">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value, parent: "" })}
                    className="w-full bg-[#061C1C]/90 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-400/20 transition-all shadow-inner cursor-pointer"
                  >
                    {lookupTypes.map(t => (
                      <option key={t.value} value={t.value} className="bg-[#0A2F2F] text-white py-2">
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-300 mt-1.5 font-medium">
                    Select where this lookup will be populated (e.g. Dish Catalog or Inventory categories).
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                    Item / Category Name <span className="text-saffron-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Basmati Rice, Starters, Beverages, Toiletries..."
                    className="w-full bg-[#061C1C]/90 border border-white/20 rounded-xl px-4 py-3 text-white font-medium placeholder-slate-400 focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-400/20 transition-all shadow-inner"
                  />
                  <p className="text-[11px] text-slate-300 mt-1.5 font-medium">
                    A clear, distinct name shown in dropdowns and reports.
                  </p>
                </div>

                {/* Optional Parent Lookup */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                    Parent Lookup (Optional)
                  </label>
                  <select
                    value={formData.parent}
                    onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                    className="w-full bg-[#061C1C]/90 border border-white/20 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-400/20 transition-all shadow-inner cursor-pointer"
                  >
                    <option value="" className="bg-[#0A2F2F] text-slate-300">None (Top-Level Category)</option>
                    {allLookups
                      .filter(l => l._id !== formData.id && l.type === formData.type)
                      .map(l => (
                        <option key={l._id} value={l._id} className="bg-[#0A2F2F] text-white">
                          {l.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-slate-300 mt-1.5 font-medium">
                    Nest this under an existing parent tag if creating sub-categories.
                  </p>
                </div>

                {/* Status Toggle Box */}
                <div className="p-4 rounded-2xl bg-[#061C1C]/70 border border-white/15 flex items-center justify-between shadow-sm lookup-status-box">
                  <div className="pr-4">
                    <label htmlFor="isActive" className="text-sm font-bold text-white block cursor-pointer">
                      Status: {formData.isActive ? "Active (Enabled)" : "Inactive (Disabled)"}
                    </label>
                    <p className="text-xs text-slate-300 mt-0.5 font-medium">
                      Available for selection across hotel billing, catalog & inventory modules
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-white/30 bg-[#061C1C] text-saffron-500 focus:ring-saffron-400/50 cursor-pointer accent-saffron-500"
                  />
                </div>

                {/* Centered Actions with generous horizontal padding */}
                <div className="pt-4 pb-1 border-t border-white/10 flex flex-wrap justify-center items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-8 py-3 rounded-xl font-bold text-slate-200 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer border border-white/15 min-w-[120px] text-center"
                  >
                    Cancel
                  </button>
                  <MagneticButton>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-300 hover:to-saffron-400 text-slate-950 px-10 py-3.5 rounded-xl font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-xl shadow-saffron-500/25 min-w-[200px] justify-center tracking-wide"
                    >
                      <CheckCircle2 className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                      {isSubmitting ? "Saving..." : (formData.id ? "Update Lookup" : "Save Lookup")}
                    </button>
                  </MagneticButton>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
