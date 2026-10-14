import React, { useState, useEffect } from "react";
import api from "../../api";
import { PlusCircle, Utensils, Trash2, Image, ToggleLeft, ToggleRight, Sparkles, Loader2, Search, Edit } from "lucide-react";
import { showError, showConfirm } from "../../utils/alerts";

export default function AdminDishes() {
  const [dishes, setDishes] = useState([]);
  
  // Form fields
  const [dishId, setDishId] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(""); // Stores Cloudinary URL after upload
  const [editingDishId, setEditingDishId] = useState(null);
  
  // Custom states requested by user
  const [loading, setloading] = useState(""); // Tracks field being uploaded/loaded
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [categories, setCategories] = useState([]);
  
  // Recipe related states
  const [inventoryItems, setInventoryItems] = useState([]);
  const [recipe, setRecipe] = useState([]); // Array of { item: "", quantity: "", unit: "kg" }

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  useEffect(() => {
    fetchCategories();
    fetchInventoryItems();
  }, []);

  useEffect(() => {
    fetchDishes();
  }, [currentPage, search, filterCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory]);

  const fetchInventoryItems = async () => {
    try {
      const res = await api.get("/api/inventory/items?limit=1000");
      if (res.data.success) {
        setInventoryItems(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/lookups?limit=1000");
      if (res.data.success) {
        setCategories(res.data.data.filter(l => l.type === "DISH_CATEGORY" && l.isActive));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchDishes = async () => {
    try {
      const categoryParam = filterCategory === "All" ? "" : encodeURIComponent(filterCategory);
      const res = await api.get(`api/dishes?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(search)}&category=${categoryParam}`);
      if (res.data.success) {
        setDishes(res.data.dishes);
        if (res.data.pagination) {
          setServerTotalPages(res.data.pagination.totalPages || 1);
        }
      }
    } catch (error) {
      console.error("Error fetching dishes:", error);
    }
  };

  const generateDishId = async () => {
    if (!category) {
      showError("Category Required", "Please select a category first.");
      return;
    }
    try {
      const res = await api.get(`/api/dishes?category=${encodeURIComponent(category)}&limit=1`);
      const prefixMap = {
        "Salad": "SA", "Soup": "SO", "Continental Appetizers": "CA", "Pizza": "PZ",
        "Pasta": "PA", "Asian Appetizers": "AA", "Tandoor E Dastaan": "TD", "S.S Kebeb Platter": "SS",
        "Continental Main course": "CM", "Chinese Main course": "CH", "Indian Main Course": "IM",
        "Roti E Mela": "RM", "Desi chawal": "DC", "Biryani": "BI", "Chinese Rice & Noodles": "CN",
        "Desserts": "DE"
      };
      
      const count = res.data.pagination ? res.data.pagination.totalItems : 0;
      let prefix = prefixMap[category];
      if (!prefix) {
        const cleanCat = category.replace(/[^A-Za-z]/g, '');
        prefix = cleanCat.substring(0, 2).toUpperCase() || "XX";
      }
      const nextIndex = count + 1;
      setDishId(`${prefix}${nextIndex.toString().padStart(2, '0')}`);
      setMsg({ text: "Dish ID generated!", type: "success" });
    } catch (error) {
      console.error("Error generating dish id:", error);
      showError("Error", "Failed to generate Dish ID");
    }
  };

  // 🧩 Common upload handler (exactly aligned with User's code snippet)
  const handleFileChange = async (e, fieldName) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setloading(fieldName);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await api.post("api/upload/upload-files", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success && res.data.urls && res.data.urls.length > 0) {
        // Save the first URL as the dish image
        setImage(res.data.urls[0]);
        setMsg({ text: "Image uploaded successfully to Cloudinary!", type: "success" });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      showError("Upload Failed", "Image upload failed. Please try again.");
      setMsg({ text: "Image upload failed. Please try again.", type: "error" });
    } finally {
      setloading("");
    }
  };

  const handleSubmitDish = async (e) => {
    e.preventDefault();

    if (!category) {
      showError("Category Required", "Please select a category.");
      return;
    }

    setFormSubmitLoading(true);
    setMsg({ text: "", type: "" });

    try {
      // Filter out any recipe items that have no item selected or quantity <= 0
      const validRecipe = recipe.filter(r => r.item && Number(r.quantity) > 0).map(r => ({
        item: typeof r.item === 'object' && r.item !== null ? (r.item._id || r.item) : r.item,
        quantity: Number(r.quantity),
        unit: r.unit
      }));

      const payload = {
        dishId,
        name,
        price: Number(price),
        category,
        image,
        recipe: validRecipe,
      };

      let res;
      if (editingDishId) {
        res = await api.put(`api/dishes/${editingDishId}`, payload);
      } else {
        res = await api.post("api/dishes", payload);
      }

      if (res.data.success) {
        setMsg({ text: editingDishId ? "Dish updated successfully!" : "Dish added successfully to menu!", type: "success" });
        // Clear fields
        handleCancelEdit();
        
        // Refresh list
        fetchDishes();
      }
    } catch (error) {
      console.error("Failed to submit dish:", error);
      setMsg({
        text: error.response?.data?.message || "Failed to save dish.",
        type: "error",
      });
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const handleEditDish = (dish) => {
    setEditingDishId(dish._id);
    setDishId(dish.dishId || "");
    setName(dish.name);
    setPrice(dish.price);
    setCategory(dish.category);
    setImage(dish.image);
    
    const mappedRecipe = (dish.recipe || []).map(r => ({
      item: typeof r.item === 'object' && r.item !== null ? r.item._id : r.item,
      quantity: r.quantity,
      unit: r.unit
    }));
    setRecipe(mappedRecipe);
    setMsg({ text: "", type: "" });
  };

  const handleCancelEdit = () => {
    setEditingDishId(null);
    setDishId("");
    setName("");
    setPrice("");
    setCategory("");
    setImage("");
    setRecipe([]);
    setMsg({ text: "", type: "" });
  };

  const addRecipeRow = () => {
    setRecipe([...recipe, { item: "", quantity: "", unit: "kg" }]);
  };

  const removeRecipeRow = (index) => {
    const newRecipe = [...recipe];
    newRecipe.splice(index, 1);
    setRecipe(newRecipe);
  };

  const updateRecipeRow = (index, field, value) => {
    const newRecipe = [...recipe];
    newRecipe[index][field] = value;
    
    // Auto-fill unit if item is selected
    if (field === 'item' && value) {
      const selectedItem = inventoryItems.find(i => i._id === value);
      if (selectedItem && selectedItem.unit) {
        newRecipe[index].unit = selectedItem.unit;
      }
    }
    
    setRecipe(newRecipe);
  };

  const handleToggleAvailability = async (dish) => {
    try {
      const res = await api.put(`api/dishes/${dish._id}`, {
        available: !dish.available,
      });

      if (res.data.success) {
        fetchDishes();
      }
    } catch (error) {
      console.error("Failed to toggle availability:", error);
    }
  };

  const handleDeleteDish = async (id) => {
    const result = await showConfirm(
      "Are you sure?",
      "You want to delete this dish from the menu?",
      "Yes, Delete!"
    );
    if (!result.isConfirmed) return;

    try {
      const res = await api.delete(`api/dishes/${id}`);
      if (res.data.success) {
        fetchDishes();
      }
    } catch (error) {
      console.error("Failed to delete dish:", error);
      showError("Failed", error.response?.data?.message || "Failed to delete dish");
    }
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60";
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 overflow-x-hidden no-print">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-amber-500 flex items-center gap-3">
            <Utensils className="w-8 h-8" />
            Dishes Management
          </h1>
          <p className="text-slate-400 mt-1">Manage your restaurant menu items</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* LEFT: DISHES LIST */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
          
          {/* SEARCH & FILTER */}
          <div className="flex flex-col md:flex-row gap-4 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search dishes by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div className="w-full md:w-64">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500"
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {dishes.length > 0 ? (
              dishes.map((dish) => (
                <div
                  key={dish._id}
                  className={`glass-card rounded-xl overflow-hidden border transition-all ${
                    dish.available ? "border-gold-800/15" : "border-red-950/40 opacity-70"
                  }`}
                >
                  <div className="h-28 w-full bg-slate-850 relative">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent"></div>
                    <span className="absolute bottom-2 right-2 bg-slate-950/85 text-amber-500 border border-amber-500/25 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                      ₹{dish.price}
                    </span>
                  </div>

                  <div className="p-3.5 flex flex-col gap-2">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs text-slate-150 line-clamp-2 leading-tight">
                          {dish.name}
                        </h4>
                        {dish.dishId && <span className="shrink-0 text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap">{dish.dishId}</span>}
                      </div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">{dish.category}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5 mt-1">
                      <button
                        onClick={() => handleToggleAvailability(dish)}
                        className={`flex items-center gap-1 text-[10px] font-bold ${
                          dish.available ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {dish.available ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            <span>Sold Out</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditDish(dish)}
                          className="p-1 text-slate-500 hover:text-blue-400 rounded transition-all"
                          title="Edit Item"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDish(dish._id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded transition-all"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 text-center gap-2">
                <Utensils className="w-10 h-10 text-slate-650" />
                <p className="text-xs">No dishes added to menu yet.</p>
              </div>
            )}
          </div>

          {serverTotalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-4 border-t border-slate-800/60 mt-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors text-xs font-semibold"
              >
                Prev
              </button>
              <span className="text-slate-400 text-xs font-semibold">
                Page {currentPage} of {serverTotalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(serverTotalPages, p + 1))}
                disabled={currentPage === serverTotalPages}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors text-xs font-semibold"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: ADD DISH FORM */}
      <div className="w-full xl:w-80 shrink-0">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-sm text-slate-200">{editingDishId ? "Edit Menu Item" : "Add Menu Item"}</h2>
            </div>
            {editingDishId && (
              <button onClick={handleCancelEdit} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
                Cancel
              </button>
            )}
          </div>

          {msg.text && (
            <div className={`p-4 rounded-xl mb-4 text-xs border ${
              msg.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-red-500/10 border-red-500/20 text-red-300"
            }`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmitDish} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Dish/Item Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Veg Thali, Paneer Kadhai..."
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Price (INR)
              </label>
              <input
                type="number"
                required
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="₹ Amount"
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Menu Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500/60"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Dish ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={dishId}
                  onChange={(e) => setDishId(e.target.value)}
                  placeholder="e.g. PI01"
                  className="flex-1 bg-slate-900/60 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500/60"
                />
                <button
                  type="button"
                  onClick={generateDishId}
                  className="px-3 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-semibold hover:bg-amber-500/20 transition-colors whitespace-nowrap"
                >
                  Generate
                </button>
              </div>
            </div>

            {/* Cloudinary Image Upload Area */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Upload Dish Image
              </label>
              <div className="bg-slate-900/60 border border-dashed border-slate-800 hover:border-amber-500/40 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative min-h-[120px]">
                {loading === "dishImage" ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    <p className="text-[10px] text-slate-400 font-medium">Uploading to Cloudinary...</p>
                  </div>
                ) : image ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={image} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-slate-700" />
                    <p className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Ready to save</span>
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-500">
                    <Image className="w-6 h-6 stroke-[1.5]" />
                    <p className="text-[10px]">Select image file</p>
                    <p className="text-[8px] text-slate-600">JPG, PNG up to 5MB</p>
                  </div>
                )}
                
                {/* File input */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "dishImage")}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={loading === "dishImage"}
                />
              </div>
            </div>

            {/* Recipe Configuration */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Recipe (Optional)
                </label>
                <button
                  type="button"
                  onClick={addRecipeRow}
                  className="text-[10px] text-amber-500 hover:text-amber-400 flex items-center gap-1 font-bold"
                >
                  <PlusCircle className="w-3 h-3" /> Add Item
                </button>
              </div>
              
              {recipe.map((r, index) => (
                <div key={index} className="flex gap-2 mb-2 items-start">
                  <div className="flex-1">
                    <select
                      value={r.item}
                      onChange={(e) => updateRecipeRow(index, 'item', e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-amber-500/60"
                    >
                      <option value="">Select Inventory Item</option>
                      {inventoryItems.map(inv => (
                        <option key={inv._id} value={inv._id}>{inv.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-16">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={r.quantity}
                      onChange={(e) => updateRecipeRow(index, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-amber-500/60"
                    />
                  </div>
                  <div className="w-12">
                    <input
                      type="text"
                      value={r.unit}
                      readOnly
                      className="w-full bg-slate-800 border border-slate-800 text-slate-400 rounded-lg px-2 py-1.5 text-xs outline-none text-center cursor-not-allowed"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRecipeRow(index)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {recipe.length === 0 && (
                <p className="text-[10px] text-slate-500 text-center py-2 bg-slate-900/30 rounded-lg border border-dashed border-slate-800">
                  No recipe items added.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={formSubmitLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-600/15 active:scale-[0.98] transition-all flex items-center justify-center text-xs disabled:opacity-50"
            >
              {formSubmitLoading ? "Saving..." : (editingDishId ? "Update Dish" : "Add to Catalog")}
            </button>
          </form>
        </div>
      </div>

    </div>
    </div>
  );
}
