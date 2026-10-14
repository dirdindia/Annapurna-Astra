const express = require('express');
const router = express.Router();
const { getAllRooms, createRoom, updateRoom, deleteRoom } = require('../controllers/roomController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(protect, getAllRooms)
  .post(protect, admin, createRoom);

router.route('/:id')
  .put(protect, admin, updateRoom)
  .delete(protect, admin, deleteRoom);

module.exports = router;
