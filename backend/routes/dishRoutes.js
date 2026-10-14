const express = require("express");
const router = express.Router();
const {
  getDishes,
  addDish,
  updateDish,
  deleteDish,
} = require("../controllers/dishController");
const { protect, admin } = require("../middleware/auth");

router.route("/")
  .get(protect, getDishes)
  .post(protect, admin, addDish);

router.route("/:id")
  .put(protect, admin, updateDish)
  .delete(protect, admin, deleteDish);

module.exports = router;
