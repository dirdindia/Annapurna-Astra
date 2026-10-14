const express = require("express");
const { createTable, getTables, updateTable, deleteTable } = require("../controllers/tableController");
const { protect, admin } = require("../middleware/auth");

const router = express.Router();

router.route("/").post(protect, admin, createTable).get(protect, getTables);
router.route("/:id").put(protect, admin, updateTable).delete(protect, admin, deleteTable);

module.exports = router;
