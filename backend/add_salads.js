const mongoose = require("mongoose");
const Dish = require("./models/Dish");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const category = "Desserts";
    
    const getNextDishId = async (cat) => {
       const count = await Dish.countDocuments({ category: cat });
       const prefixMap = {
        "Salad": "SA", "Soup": "SO", "Continental Appetizers": "CA", "Pizza": "PZ",
        "Pasta": "PA", "Asian Appetizers": "AA", "Tandoor E Dastaan": "TD", "S.S Kebeb Platter": "SS",
        "Continental Main course": "CM", "Chinese Main course": "CH", "Indian Main Course": "IM",
        "Roti E Mela": "RM", "Desi chawal": "DC", "Biryani": "BI", "Chinese Rice & Noodles": "CN",
        "Desserts": "DE"
      };
      
      let prefix = prefixMap[cat];
      if (!prefix) {
        const cleanCat = cat.replace(/[^A-Za-z]/g, '');
        prefix = cleanCat.substring(0, 2).toUpperCase() || "XX";
      }
      return `${prefix}${String(count + 1).padStart(2, '0')}`;
    };

    const dishesToAdd = [
      { name: "ZAFFRANI FIRNI", price: 149, category },
      { name: "SHAHI TUKDA", price: 149, category },
      { name: "GAJAR KA HALWA", price: 179, category },
      { name: "DARSAAN WITH VANILLA ICE CREAM", price: 219, category },
      { name: "MANGO PANCAKE WITH ICE CREAM", price: 259, category },
      { name: "HOT GULAB JAMUN", price: 120, category }
    ];

    for (let d of dishesToAdd) {
       const dishExists = await Dish.findOne({ name: d.name });
       if (!dishExists) {
         const dishId = await getNextDishId(category);
         const defaultImage = "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&auto=format&fit=crop&q=60"; 
         
         await Dish.create({
           dishId,
           name: d.name,
           price: d.price,
           category: d.category,
           image: defaultImage
         });
         console.log("Added:", d.name);
       } else {
         console.log("Exists:", d.name);
       }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
});
