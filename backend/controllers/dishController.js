const Dish = require("../models/Dish");

// @desc    Get all dishes
// @route   GET /api/dishes
// @access  Private (both staff and admin)
const getDishes = async (req, res) => {
  try {
    const { page, limit, search, category } = req.query;
    
    let query = { hotelId: req.user.hotelId };
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (category && category !== "All") {
      query.category = category;
    }

    if (!page && !limit) {
      // Backward compatibility: return all
      const dishes = await Dish.find(query).populate("recipe.item", "name unit currentStock");
      return res.json({ success: true, dishes });
    }

    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 8;
    const skip = (pageNumber - 1) * pageSize;

    const dishes = await Dish.find(query)
      .populate("recipe.item", "name unit currentStock")
      .skip(skip)
      .limit(pageSize);
      
    const totalDishes = await Dish.countDocuments(query);
    const totalPages = Math.ceil(totalDishes / pageSize);

    res.json({ 
      success: true, 
      dishes,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalItems: totalDishes
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDefaultImageForCategory = (category) => {
  const cat = (category || "").toLowerCase();
  
  if (cat === "salad") return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=60";
  if (cat === "soup") return "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=60";
  if (cat === "continental appetizers") return "https://images.unsplash.com/photo-1626804475297-41609ea004eb?w=600&auto=format&fit=crop&q=60";
  if (cat === "pizza") return "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=60";
  if (cat === "pasta") return "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&auto=format&fit=crop&q=60";
  if (cat === "asian appetizers") return "https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&auto=format&fit=crop&q=60";
  if (cat === "tandoor e dastaan") return "https://images.unsplash.com/photo-1603894584373-5ac82b6ae398?w=600&auto=format&fit=crop&q=60"; // Tandoori
  if (cat === "s.s kebeb platter") return "https://images.unsplash.com/photo-1599487405270-45ab10e303d8?w=600&auto=format&fit=crop&q=60"; // Kebab
  if (cat === "continental main course") return "https://images.unsplash.com/photo-1544025162-811c7fae1363?w=600&auto=format&fit=crop&q=60"; // Steak / Continental
  if (cat === "chinese main course") return "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&auto=format&fit=crop&q=60";
  if (cat === "indian main course") return "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=60";
  if (cat === "roti e mela") return "https://images.unsplash.com/photo-1626082895617-2c6ab38fc6f2?w=600&auto=format&fit=crop&q=60"; // Naan / Roti
  if (cat === "desi chawal") return "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&auto=format&fit=crop&q=60"; // Plain rice
  if (cat === "biryani") return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=60";
  if (cat === "chinese rice & noodles") return "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=60"; // Noodles
  if (cat === "desserts") return "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&auto=format&fit=crop&q=60";

  // Default General Food Image for anything else
  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60";
};

// @desc    Add a new dish
// @route   POST /api/dishes
// @access  Private/Admin
const addDish = async (req, res) => {
  const { name, price, image, category, recipe, dishId } = req.body;

  try {
    if (!name || !price) {
      return res.status(400).json({ success: false, message: "Please enter name and price" });
    }

    const dishExists = await Dish.findOne({ name, hotelId: req.user.hotelId });
    if (dishExists) {
      return res.status(400).json({ success: false, message: "Dish with this name already exists" });
    }

    const dish = await Dish.create({
      hotelId: req.user.hotelId,
      dishId,
      name,
      price: Number(price),
      image: image || getDefaultImageForCategory(category),
      category: category || "General",
      recipe: recipe || [],
    });

    res.status(201).json({ success: true, dish });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a dish
// @route   PUT /api/dishes/:id
// @access  Private/Admin
const updateDish = async (req, res) => {
  const { name, price, image, category, available, recipe, dishId } = req.body;

  try {
    const dish = await Dish.findOne({ _id: req.params.id, hotelId: req.user.hotelId });

    if (!dish) {
      return res.status(404).json({ success: false, message: "Dish not found or unauthorized" });
    }

    dish.name = name || dish.name;
    dish.price = price !== undefined ? Number(price) : dish.price;
    dish.image = image || dish.image;
    dish.category = category || dish.category;
    dish.available = available !== undefined ? available : dish.available;
    if (dishId) dish.dishId = dishId;
    if (recipe !== undefined) {
      dish.recipe = recipe;
    }

    const updatedDish = await dish.save();
    res.json({ success: true, dish: updatedDish });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a dish
// @route   DELETE /api/dishes/:id
// @access  Private/Admin
const deleteDish = async (req, res) => {
  try {
    const dish = await Dish.findOne({ _id: req.params.id, hotelId: req.user.hotelId });

    if (!dish) {
      return res.status(404).json({ success: false, message: "Dish not found or unauthorized" });
    }

    await Dish.findOneAndDelete({ _id: req.params.id, hotelId: req.user.hotelId });
    res.json({ success: true, message: "Dish deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDishes,
  addDish,
  updateDish,
  deleteDish,
};
