const RoomBooking = require('../models/RoomBooking');
const Room = require('../models/Room');
const ExcelJS = require('exceljs');

// @desc    Get all room bookings
// @route   GET /api/room-bookings
// @access  Private
exports.getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, fromDate, toDate, paymentMode, search, status, roomId } = req.query;
    let query = { hotelId: req.user.hotelId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (roomId) {
      query.room = roomId;
    }

    const paymentOr = [];
    if (paymentMode && paymentMode !== 'all') {
      paymentOr.push({ advancePaymentMode: paymentMode }, { finalPaymentMode: paymentMode });
    }

    if (fromDate && toDate) {
      query.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(new Date(toDate).setHours(23, 59, 59, 999))
      };
    }

    // Search by guest name or room number
    let searchOr = [];
    if (search) {
      const matchingRooms = await Room.find({ roomNumber: { $regex: search, $options: 'i' } }).select('_id');
      const roomIds = matchingRooms.map(r => r._id);
      searchOr = [
        { 'guests.name': { $regex: search, $options: 'i' } },
        { room: { $in: roomIds } }
      ];
    }

    if (paymentOr.length > 0 && searchOr.length > 0) {
      query.$and = [{ $or: paymentOr }, { $or: searchOr }];
    } else if (paymentOr.length > 0) {
      query.$or = paymentOr;
    } else if (searchOr.length > 0) {
      query.$or = searchOr;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const totalBookings = await RoomBooking.countDocuments(query);
    const bookings = await RoomBooking.find(query)
      .populate('room', 'roomNumber type price')
      .populate('staffId', 'name')
      .populate('restaurantBills')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: bookings,
      pagination: {
        total: totalBookings,
        page: parseInt(page),
        pages: Math.ceil(totalBookings / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check In (Create a new booking)
// @route   POST /api/room-bookings/checkin
// @access  Private (Staff)
exports.checkIn = async (req, res) => {
  try {
    const { roomId, guests, advanceAmount, advancePaymentMode, hasGST, gstNumber, companyName, companyAddress, expectedCheckOutDate } = req.body;

    const room = await Room.findOne({ _id: roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found or unauthorized' });
    }

    if (room.status === 'Occupied') {
      return res.status(400).json({ success: false, message: 'Room is already occupied' });
    }
    
    if (!expectedCheckOutDate) {
      return res.status(400).json({ success: false, message: 'Expected Check-Out Date and Time is required' });
    }

    const startDate = new Date();
    const endDate = new Date(expectedCheckOutDate);
    
    // Check for overlap with advance bookings
    const conflictingBookings = await RoomBooking.find({
      room: roomId,
      status: 'Advance-Booked',
      expectedCheckInDate: { $lt: endDate },
      expectedCheckOutDate: { $gt: startDate }
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'This room has an advance booking during this time period.' 
      });
    }

    // Create Booking
    const booking = await RoomBooking.create({
      hotelId: req.user.hotelId,
      room: roomId,
      guests,
      advanceAmount: Number(advanceAmount) || 0,
      advancePaymentMode: advancePaymentMode || null,
      hasGST: hasGST || false,
      gstNumber: hasGST ? gstNumber : '',
      companyName: hasGST ? companyName : '',
      companyAddress: hasGST ? companyAddress : '',
      expectedCheckOutDate,
      staffId: req.user._id,
      status: 'Checked-In'
    });

    // Update Room Status
    room.status = 'Occupied';
    await room.save();

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Advance Room Booking
// @route   POST /api/room-bookings/advance
// @access  Private (Staff)
exports.advanceBooking = async (req, res) => {
  try {
    const { roomId, guests, advanceAmount, advancePaymentMode, hasGST, gstNumber, companyName, companyAddress, expectedCheckInDate, expectedCheckOutDate } = req.body;

    const room = await Room.findOne({ _id: roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found or unauthorized' });
    }

    // Removed restriction to allow multiple advance bookings for different dates

    if (!expectedCheckInDate || !expectedCheckOutDate) {
      return res.status(400).json({ success: false, message: 'Expected Check-In and Check-Out Date/Time are required' });
    }

    const startDate = new Date(expectedCheckInDate);
    const endDate = new Date(expectedCheckOutDate);

    // Check for overlap with any existing bookings (Checked-In or Advance-Booked)
    const conflictingBookings = await RoomBooking.find({
      room: roomId,
      status: { $in: ['Checked-In', 'Advance-Booked'] },
      $or: [
        {
          status: 'Advance-Booked',
          expectedCheckInDate: { $lt: endDate },
          expectedCheckOutDate: { $gt: startDate }
        },
        {
          status: 'Checked-In',
          checkInTime: { $lt: endDate },
          $or: [
            { expectedCheckOutDate: { $gt: startDate } },
            { expectedCheckOutDate: null }
          ]
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room is already booked during this time period.' 
      });
    }

    // Create Advance Booking
    const booking = await RoomBooking.create({
      hotelId: req.user.hotelId,
      room: roomId,
      guests,
      advanceAmount: Number(advanceAmount) || 0,
      advancePaymentMode: advancePaymentMode || null,
      hasGST: hasGST || false,
      gstNumber: hasGST ? gstNumber : '',
      companyName: hasGST ? companyName : '',
      companyAddress: hasGST ? companyAddress : '',
      expectedCheckInDate,
      expectedCheckOutDate,
      staffId: req.user._id,
      status: 'Advance-Booked'
    });

    // Update Room Status only if currently Available
    if (room.status === 'Available') {
      room.status = 'Advance-Booked';
      await room.save();
    }

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Convert Advance Booking to Check-In
// @route   PUT /api/room-bookings/convert/:id
// @access  Private (Staff)
exports.convertToCheckIn = async (req, res) => {
  try {
    const booking = await RoomBooking.findOne({ _id: req.params.id, hotelId: req.user.hotelId }).populate('room');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or unauthorized' });
    }

    if (booking.status !== 'Advance-Booked') {
      return res.status(400).json({ success: false, message: 'Booking is not in Advance-Booked status' });
    }

    // Update Booking status and checkInTime to now
    booking.status = 'Checked-In';
    booking.checkInTime = Date.now();
    await booking.save();

    // Update Room Status
    const room = await Room.findById(booking.room._id);
    room.status = 'Occupied';
    await room.save();

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check Out
// @route   POST /api/room-bookings/checkout/:id
// @access  Private (Staff)
exports.checkOut = async (req, res) => {
  try {
    const booking = await RoomBooking.findOne({ _id: req.params.id, hotelId: req.user.hotelId })
      .populate('room')
      .populate('restaurantBills');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or unauthorized' });
    }

    if (booking.status === 'Checked-Out') {
      return res.status(400).json({ success: false, message: 'Already checked out' });
    }

    booking.checkOutTime = Date.now();
    booking.status = 'Checked-Out';

    // Calculate total amount based on room price. 
    // In a real scenario, you'd calculate days between checkIn and checkOut.
    // For simplicity, we just charge the base price or day-based price.
    const checkInDate = new Date(booking.checkInTime);
    const checkOutDate = new Date(booking.checkOutTime);
    
    // Difference in milliseconds
    const diffTime = Math.abs(checkOutDate - checkInDate);
    
    // Removed grace period to strictly charge next day after 24 hours
    
    // Calculate days and ensure minimum of 1 day
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) diffDays = 1; // Minimum 1 day charge
    
    // Check if staff provided a manual override
    if (req.body.manualTotalAmount !== undefined && req.body.manualTotalAmount !== null) {
      booking.totalAmount = Number(req.body.manualTotalAmount);
    } else {
      let roomTotal = diffDays * booking.room.price;
      let restaurantTotal = 0;
      if (booking.restaurantBills && booking.restaurantBills.length > 0) {
        restaurantTotal = booking.restaurantBills.reduce((sum, bill) => sum + bill.grandTotal, 0);
      }
      booking.totalAmount = roomTotal + restaurantTotal;
    }
    
    if (req.body.finalPaymentMode !== undefined) {
      booking.finalPaymentMode = req.body.finalPaymentMode;
    }
    
    await booking.save();

    // Update Room Status
    const room = await Room.findById(booking.room._id);
    room.status = 'Available';
    await room.save();

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify GST Number
// @route   GET /api/room-bookings/verify-gst/:gstNumber
// @access  Private (Staff)
exports.verifyGST = async (req, res) => {
  try {
    const { gstNumber } = req.params;
    
    // Check if the user has provided an API key in the environment for AppyFlow or Razorpay
    // Example: process.env.GST_API_KEY
    
    if (process.env.GST_API_KEY) {
      const axios = require('axios');
      try {
        const response = await axios.get(`https://appyflow.in/api/verifyGST?gstNo=${gstNumber}&key_secret=${process.env.GST_API_KEY}`);
        
        if (response.data && !response.data.error) {
          // If the free limit is reached, AppyFlow returns error: false with this sandbox response
          if (response.data.message && response.data.message.includes('paid credits')) {
            return res.status(400).json({ success: false, message: 'GST API limit reached. Please enter details manually.' });
          }

          const info = response.data.taxpayerInfo || {};
          const addrObj = info.pradr?.addr || {};
          const addressString = `${addrObj.bno || ''} ${addrObj.st || ''} ${addrObj.loc || ''}, ${addrObj.dst || ''}, ${addrObj.stcd || ''} - ${addrObj.pncd || ''}`.replace(/\s+/g, ' ').trim() || "Address verified";

          return res.json({ 
            success: true, 
            data: {
              businessName: info.tradeNam || info.lgnm || "Unknown",
              address: addressString
            } 
          });
        } else {
          return res.status(400).json({ success: false, message: response.data?.message || 'Invalid GST or API Error' });
        }
      } catch (err) {
        console.error("GST API Error:", err.response?.data || err.message);
        return res.status(400).json({ 
          success: false, 
          message: err.response?.data?.message || err.response?.data?.error || "GST Verification failed from provider. Check API Key or GST No."
        });
      }
    }

    // Fallback: Mock provider response if no API key is provided so it still works for demo
    // In production, the client must configure their .env with a valid API Key
    const mockData = {
      businessName: "Verified Company Pvt Ltd (Mock)",
      address: "123 Business Avenue, City Center, 400001 (Mock Data)",
      status: "Active"
    };

    // A small delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 800));

    res.json({ success: true, data: mockData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get previous guest details by phone number
// @route   GET /api/room-bookings/guest/:phone
// @access  Private (Staff)
exports.getGuestByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    
    // Find the most recent booking that has a guest with this phone number
    const booking = await RoomBooking.findOne({ 'guests.phone': phone, hotelId: req.user.hotelId })
      .sort({ createdAt: -1 });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'No guest found with this phone number' });
    }

    // Extract the specific guest from the array
    const guest = booking.guests.find(g => g.phone === phone);

    if (!guest) {
      return res.status(404).json({ success: false, message: 'No guest found with this phone number' });
    }

    res.json({ success: true, data: guest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export room bookings to excel
// @route   GET /api/room-bookings/export
// @access  Private
exports.exportBookingsToExcel = async (req, res) => {
  try {
    const { fromDate, toDate, paymentMode, search, status } = req.query;
    let query = { hotelId: req.user.hotelId };

    if (status && status !== 'all') {
      query.status = status;
    }

    const paymentOr = [];
    if (paymentMode && paymentMode !== 'all') {
      paymentOr.push({ advancePaymentMode: paymentMode }, { finalPaymentMode: paymentMode });
    }

    if (fromDate && toDate) {
      query.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(new Date(toDate).setHours(23, 59, 59, 999))
      };
    }

    let searchOr = [];
    if (search) {
      const matchingRooms = await Room.find({ roomNumber: { $regex: search, $options: 'i' } }).select('_id');
      const roomIds = matchingRooms.map(r => r._id);
      searchOr = [
        { 'guests.name': { $regex: search, $options: 'i' } },
        { room: { $in: roomIds } }
      ];
    }

    if (paymentOr.length > 0 && searchOr.length > 0) {
      query.$and = [{ $or: paymentOr }, { $or: searchOr }];
    } else if (paymentOr.length > 0) {
      query.$or = paymentOr;
    } else if (searchOr.length > 0) {
      query.$or = searchOr;
    }

    const bookings = await RoomBooking.find(query)
      .populate('room', 'roomNumber type price')
      .populate('staffId', 'name')
      .populate('restaurantBills')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Room Bookings');

    worksheet.columns = [
      { header: 'Guest Name', key: 'guestName', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'ID Type', key: 'idType', width: 15 },
      { header: 'ID Number', key: 'idNumber', width: 20 },
      { header: 'Total Persons', key: 'totalPersons', width: 15 },
      { header: 'Room No', key: 'roomNo', width: 15 },
      { header: 'Room Type', key: 'roomType', width: 15 },
      { header: 'Check In', key: 'checkIn', width: 20 },
      { header: 'Check Out', key: 'checkOut', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      // { header: 'Amount (₹)', key: 'amount', width: 15 }
    ];

    bookings.forEach(b => {
      worksheet.addRow({
        guestName: b.guests && b.guests.length > 0 ? b.guests[0].name : 'N/A',
        phone: b.guests && b.guests.length > 0 ? b.guests[0].phone : 'N/A',
        idType: b.guests && b.guests.length > 0 ? b.guests[0].idType : 'N/A',
        idNumber: b.guests && b.guests.length > 0 ? b.guests[0].idNumber : 'N/A',
        totalPersons: b.guests ? b.guests.length : 0,
        roomNo: b.room ? b.room.roomNumber : 'N/A',
        roomType: b.room ? b.room.type : 'N/A',
        checkIn: b.checkInTime ? new Date(b.checkInTime).toLocaleString("en-IN") : 'N/A',
        checkOut: b.checkOutTime ? new Date(b.checkOutTime).toLocaleString("en-IN") : 'N/A',
        status: b.status,
        // amount: b.totalAmount || 0
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=RoomBookings.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Advance Booking
// @route   PUT /api/room-bookings/advance/:id
// @access  Private (Staff)
exports.updateAdvanceBooking = async (req, res) => {
  try {
    const { advanceAmount, advancePaymentMode, expectedCheckInDate, expectedCheckOutDate, guests, hasGST, gstNumber, companyName, companyAddress } = req.body;
    
    const booking = await RoomBooking.findOne({ _id: req.params.id, hotelId: req.user.hotelId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or unauthorized' });
    }

    if (booking.status !== 'Advance-Booked') {
      return res.status(400).json({ success: false, message: 'Only advance bookings can be updated' });
    }

    if (!expectedCheckInDate || !expectedCheckOutDate) {
      return res.status(400).json({ success: false, message: 'Expected Check-In and Check-Out Date/Time are required' });
    }

    const startDate = new Date(expectedCheckInDate);
    const endDate = new Date(expectedCheckOutDate);

    // Check for overlap excluding current booking
    const conflictingBookings = await RoomBooking.find({
      _id: { $ne: req.params.id },
      room: booking.room,
      status: { $in: ['Checked-In', 'Advance-Booked'] },
      $or: [
        {
          status: 'Advance-Booked',
          expectedCheckInDate: { $lt: endDate },
          expectedCheckOutDate: { $gt: startDate }
        },
        {
          status: 'Checked-In',
          checkInTime: { $lt: endDate },
          $or: [
            { expectedCheckOutDate: { $gt: startDate } },
            { expectedCheckOutDate: null }
          ]
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room is already booked during this time period.' 
      });
    }

    booking.advanceAmount = Number(advanceAmount) || 0;
    if (advancePaymentMode !== undefined) booking.advancePaymentMode = advancePaymentMode;
    booking.expectedCheckInDate = expectedCheckInDate;
    booking.expectedCheckOutDate = expectedCheckOutDate;
    
    if (guests && Array.isArray(guests)) booking.guests = guests;
    if (hasGST !== undefined) booking.hasGST = hasGST;
    if (gstNumber !== undefined) booking.gstNumber = gstNumber;
    if (companyName !== undefined) booking.companyName = companyName;
    if (companyAddress !== undefined) booking.companyAddress = companyAddress;
    
    await booking.save();
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Advance Booking
// @route   DELETE /api/room-bookings/advance/:id
// @access  Private (Staff/Admin)
exports.deleteAdvanceBooking = async (req, res) => {
  try {
    const booking = await RoomBooking.findOne({ _id: req.params.id, hotelId: req.user.hotelId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or unauthorized' });
    }

    if (booking.status !== 'Advance-Booked') {
      return res.status(400).json({ success: false, message: 'Only advance bookings can be deleted' });
    }

    const roomId = booking.room;
    await RoomBooking.deleteOne({ _id: booking._id });

    // Check if there are other advance bookings for this room
    const otherBookings = await RoomBooking.find({ room: roomId, status: 'Advance-Booked' });
    if (otherBookings.length === 0) {
      const room = await Room.findById(roomId);
      // Only change to Available if it was Advance-Booked (meaning it isn't Occupied)
      if (room && room.status === 'Advance-Booked') {
        room.status = 'Available';
        await room.save();
      }
    }

    res.json({ success: true, message: 'Advance booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
