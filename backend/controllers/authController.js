const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Hotel = require('../models/Hotel');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Get permissions from hotel_admin user if current user is staff
      let permissions = user.staffPermissions;
      if (user.role === 'staff') {
        const adminUser = await User.findOne({ hotelId: user.hotelId, role: 'hotel_admin' });
        if (adminUser) {
          permissions = adminUser.staffPermissions;
        }
      }

      // Fetch the associated hotel
      const hotel = await Hotel.findById(user.hotelId);

      // Staff Login Subscription Restriction:
      // When a hotel registers, subscription is none/inactive. Hotel admin can log in to update profile and buy subscription.
      // Staff CANNOT log in until hotel admin purchases an active subscription.
      if (user.role === 'staff') {
        const isExpired = hotel?.subscription?.validUntil ? new Date(hotel.subscription.validUntil) < new Date() : false;
        const isSubActive = Boolean(hotel && hotel.subscription && hotel.subscription.isActive && hotel.subscription.plan !== 'none' && !isExpired);

        if (!isSubActive) {
          return res.status(403).json({
            success: false,
            message: 'Hotel subscription is inactive or expired. Please contact your Hotel Administrator to purchase/renew the subscription.'
          });
        }
      }

      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mobile: user.mobile,
          age: user.age,
          address: user.address,
          city: user.city || '',
          hotelId: user.hotelId,
          hotelName: hotel ? hotel.name : 'Unknown Hotel',
          hotelEmail: hotel ? hotel.email : '',
          hotelContact: hotel ? hotel.phone : '',
          hotelAddress: hotel ? hotel.address : '',
          hotelCity: hotel ? hotel.city : '',
          hotelState: hotel ? hotel.state : '',
          hotelPincode: hotel ? hotel.pincode : '',
          hotelType: hotel ? hotel.type : 'Hotel',
          hotelLogo: hotel ? hotel.logo : '',
          gstin: hotel ? hotel.gstin || '' : '',
          fssaiNumber: hotel ? hotel.fssaiNumber || '' : '',
          panNumber: hotel ? hotel.panNumber || '' : '',
          tradeLicenseNumber: hotel ? hotel.tradeLicenseNumber || '' : '',
          checkInTime: hotel ? hotel.checkInTime || '12:00 PM' : '12:00 PM',
          checkOutTime: hotel ? hotel.checkOutTime || '11:00 AM' : '11:00 AM',
          invoicePrefixRestaurant: hotel ? hotel.invoicePrefixRestaurant || 'REST-' : 'REST-',
          invoicePrefixRoom: hotel ? hotel.invoicePrefixRoom || 'ROOM-' : 'ROOM-',
          invoiceTerms: hotel ? hotel.invoiceTerms || '' : '',
          upiId: hotel ? hotel.upiId || '' : '',
          bankName: hotel ? hotel.bankName || '' : '',
          bankAccountNumber: hotel ? hotel.bankAccountNumber || '' : '',
          bankIfscCode: hotel ? hotel.bankIfscCode || '' : '',
          bankAccountName: hotel ? hotel.bankAccountName || '' : '',
          receptionPhone: hotel ? hotel.receptionPhone || '' : '',
          websiteUrl: hotel ? hotel.websiteUrl || '' : '',
          googleMapsUrl: hotel ? hotel.googleMapsUrl || '' : '',
          instagramUrl: hotel ? hotel.instagramUrl || '' : '',
          facebookUrl: hotel ? hotel.facebookUrl || '' : '',
          starRating: hotel ? hotel.starRating || '3-Star' : '3-Star',
          foodGstRate: hotel && hotel.foodGstRate !== undefined ? hotel.foodGstRate : 5,
          roomGstRate: hotel && hotel.roomGstRate !== undefined ? hotel.roomGstRate : 12,
          idProofPolicy: hotel ? hotel.idProofPolicy || 'Aadhaar Card, Passport, Driving License, or Voter ID required at check-in' : 'Aadhaar Card, Passport, Driving License, or Voter ID required at check-in',
          staffPermissions: permissions || {
            restaurant: true,
            roomBooking: true,
            kot: true,
            advanceBooking: true,
            grc: true
          },
          subscriptionPlan: hotel && hotel.subscription ? hotel.subscription.plan : 'none',
          subscriptionStatus: hotel && hotel.subscription ? (hotel.subscription.isActive ? 'active' : 'inactive') : 'inactive',
          subscriptionExpiresAt: hotel && hotel.subscription ? hotel.subscription.validUntil : null,
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new hotel and admin
// @route   POST /api/auth/register-hotel
// @access  Public
const registerHotel = async (req, res) => {
  const { hotel, owner, email, phone, city, type, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    const hotelExists = await Hotel.findOne({ email });

    if (userExists || hotelExists) {
      return res.status(400).json({ success: false, message: 'User or Hotel with this email already exists' });
    }

    // Create Hotel with initial inactive subscription (plan: 'none', hasClaimedTrial: false)
    // The hotel admin will manually claim their 7-day free trial from the admin dashboard when they are ready
    const newHotel = await Hotel.create({
      name: hotel,
      email,
      phone,
      city,
      type: type || 'Hotel',
      subscription: {
        plan: 'none',
        isActive: false,
        validUntil: null,
        hasClaimedTrial: false,
        trialClaimedAt: null,
      },
    });

    // Create User
    const adminUser = await User.create({
      name: owner,
      email,
      password,
      role: 'hotel_admin',
      mobile: phone,
      age: 30, // Default age
      address: city,
      hotelId: newHotel._id,
    });

    res.status(201).json({
      success: true,
      message: 'Hotel registered successfully. Sign in to your portal to claim your 7-day free trial.',
      hotel: newHotel,
      user: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new staff member
// @route   POST /api/auth/register-staff
// @access  Private/Admin
const registerStaff = async (req, res) => {
  const { name, email, password, mobile, age, address } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'Staff with this email already exists' });
    }

    const staff = await User.create({
      name,
      email,
      password,
      role: 'staff',
      mobile,
      age,
      address,
      hotelId: req.user.hotelId, // Assign to the same hotel as the creator (hotel_admin)
    });

    if (staff) {
      res.status(201).json({
        success: true,
        message: 'Staff member registered successfully',
        staff: {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          mobile: staff.mobile,
          age: staff.age,
          address: staff.address,
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid staff data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all staff members
// @route   GET /api/auth/staff
// @access  Private/Admin
const getStaff = async (req, res) => {
  try {
    const staffMembers = await User.find({ role: 'staff', hotelId: req.user.hotelId }).select('-password');
    res.json({ success: true, staff: staffMembers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a staff member
// @route   DELETE /api/auth/staff/:id
// @access  Private/Admin
const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.id, hotelId: req.user.hotelId });

    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ success: false, message: 'Staff member not found or unauthorized' });
    }

    await staff.deleteOne();
    res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update admin password
// @route   PUT /api/auth/update-password
// @access  Private/Admin
const updateAdminPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    const user = await User.findById(req.user._id);
    if (user && (await user.matchPassword(currentPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ success: true, message: 'Password updated successfully' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid current password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update staff permissions
// @route   PUT /api/auth/update-staff-permissions
// @access  Private/Admin
const updateStaffPermissions = async (req, res) => {
  const { permissions } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (user && (user.role === 'admin' || user.role === 'hotel_admin' || user.role === 'super_admin')) {
      user.staffPermissions = permissions;
      await user.save();
      res.json({ success: true, message: 'Permissions updated successfully', staffPermissions: user.staffPermissions });
    } else {
      res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = async (req, res) => {
  const { 
    name, email, mobile, age, address, city,
    hotelName, hotelEmail, hotelPhone, hotelAddress, hotelCity, hotelState, hotelPincode, hotelLogo, hotelType,
    gstin, fssaiNumber, panNumber, tradeLicenseNumber,
    checkInTime, checkOutTime, invoicePrefixRestaurant, invoicePrefixRoom, invoiceTerms,
    foodGstRate, roomGstRate, idProofPolicy,
    upiId, bankName, bankAccountNumber, bankIfscCode, bankAccountName,
    receptionPhone, websiteUrl, googleMapsUrl, instagramUrl, facebookUrl, starRating,
    telegramAlertsEnabled, telegramChatId, antiTheftOtpRequired
  } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'User email already in use' });
      }
      user.email = email;
    }

    user.name = name || user.name;
    user.mobile = mobile || user.mobile;
    user.age = age || user.age;
    user.address = address || user.address;
    user.city = city || user.city;

    await user.save();

    let hotel = await Hotel.findById(user.hotelId);
    if (hotel) {
      if (hotelEmail && hotelEmail !== hotel.email) {
        const hotelEmailExists = await Hotel.findOne({ email: hotelEmail });
        if (hotelEmailExists) {
           return res.status(400).json({ success: false, message: 'Hotel email already in use' });
        }
        hotel.email = hotelEmail;
      }
      
      hotel.name = hotelName || hotel.name;
      hotel.phone = hotelPhone || hotel.phone;
      hotel.address = hotelAddress || hotel.address;
      hotel.city = hotelCity || hotel.city;
      hotel.state = hotelState || hotel.state;
      hotel.pincode = hotelPincode || hotel.pincode;
      if (hotelLogo !== undefined) hotel.logo = hotelLogo;
      hotel.type = hotelType || hotel.type;

      // Legal & Tax
      if (gstin !== undefined) hotel.gstin = gstin;
      if (fssaiNumber !== undefined) hotel.fssaiNumber = fssaiNumber;
      if (panNumber !== undefined) hotel.panNumber = panNumber;
      if (tradeLicenseNumber !== undefined) hotel.tradeLicenseNumber = tradeLicenseNumber;

      // Timings & Invoicing
      if (checkInTime !== undefined) hotel.checkInTime = checkInTime;
      if (checkOutTime !== undefined) hotel.checkOutTime = checkOutTime;
      if (invoicePrefixRestaurant !== undefined) hotel.invoicePrefixRestaurant = invoicePrefixRestaurant;
      if (invoicePrefixRoom !== undefined) hotel.invoicePrefixRoom = invoicePrefixRoom;
      if (invoiceTerms !== undefined) hotel.invoiceTerms = invoiceTerms;
      if (foodGstRate !== undefined) hotel.foodGstRate = Number(foodGstRate) || 0;
      if (roomGstRate !== undefined) hotel.roomGstRate = Number(roomGstRate) || 0;
      if (idProofPolicy !== undefined) hotel.idProofPolicy = idProofPolicy;

      // Banking & Payments
      if (upiId !== undefined) hotel.upiId = upiId;
      if (bankName !== undefined) hotel.bankName = bankName;
      if (bankAccountNumber !== undefined) hotel.bankAccountNumber = bankAccountNumber;
      if (bankIfscCode !== undefined) hotel.bankIfscCode = bankIfscCode;
      if (bankAccountName !== undefined) hotel.bankAccountName = bankAccountName;

      // Contact & Web
      if (receptionPhone !== undefined) hotel.receptionPhone = receptionPhone;
      if (websiteUrl !== undefined) hotel.websiteUrl = websiteUrl;
      if (googleMapsUrl !== undefined) hotel.googleMapsUrl = googleMapsUrl;
      if (instagramUrl !== undefined) hotel.instagramUrl = instagramUrl;
      if (facebookUrl !== undefined) hotel.facebookUrl = facebookUrl;
      if (starRating !== undefined) hotel.starRating = starRating;

      // Anti-theft & Telegram Alerts
      if (telegramAlertsEnabled !== undefined) hotel.telegramAlertsEnabled = Boolean(telegramAlertsEnabled);
      if (telegramChatId !== undefined) hotel.telegramChatId = String(telegramChatId).trim();
      if (antiTheftOtpRequired !== undefined) hotel.antiTheftOtpRequired = Boolean(antiTheftOtpRequired);

      await hotel.save();
    }

    res.json({
      success: true,
      message: 'Profile and Hotel details updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        age: user.age,
        address: user.address,
        city: user.city || '',
        hotelId: user.hotelId,
        hotelName: hotel ? hotel.name : 'Unknown Hotel',
        hotelEmail: hotel ? hotel.email : '',
        hotelContact: hotel ? hotel.phone : '',
        hotelAddress: hotel ? hotel.address : '',
        hotelCity: hotel ? hotel.city : '',
        hotelState: hotel ? hotel.state : '',
        hotelPincode: hotel ? hotel.pincode : '',
        hotelLogo: hotel ? hotel.logo : '',
        hotelType: hotel ? hotel.type : '',
        gstin: hotel ? hotel.gstin || '' : '',
        fssaiNumber: hotel ? hotel.fssaiNumber || '' : '',
        panNumber: hotel ? hotel.panNumber || '' : '',
        tradeLicenseNumber: hotel ? hotel.tradeLicenseNumber || '' : '',
        checkInTime: hotel ? hotel.checkInTime || '12:00 PM' : '12:00 PM',
        checkOutTime: hotel ? hotel.checkOutTime || '11:00 AM' : '11:00 AM',
        invoicePrefixRestaurant: hotel ? hotel.invoicePrefixRestaurant || 'REST-' : 'REST-',
        invoicePrefixRoom: hotel ? hotel.invoicePrefixRoom || 'ROOM-' : 'ROOM-',
        invoiceTerms: hotel ? hotel.invoiceTerms || '' : '',
        upiId: hotel ? hotel.upiId || '' : '',
        bankName: hotel ? hotel.bankName || '' : '',
        bankAccountNumber: hotel ? hotel.bankAccountNumber || '' : '',
        bankIfscCode: hotel ? hotel.bankIfscCode || '' : '',
        bankAccountName: hotel ? hotel.bankAccountName || '' : '',
        receptionPhone: hotel ? hotel.receptionPhone || '' : '',
        websiteUrl: hotel ? hotel.websiteUrl || '' : '',
        googleMapsUrl: hotel ? hotel.googleMapsUrl || '' : '',
        instagramUrl: hotel ? hotel.instagramUrl || '' : '',
        facebookUrl: hotel ? hotel.facebookUrl || '' : '',
        starRating: hotel ? hotel.starRating || '3-Star' : '3-Star',
        foodGstRate: hotel && hotel.foodGstRate !== undefined ? hotel.foodGstRate : 5,
        roomGstRate: hotel && hotel.roomGstRate !== undefined ? hotel.roomGstRate : 12,
        idProofPolicy: hotel ? hotel.idProofPolicy || 'Aadhaar Card, Passport, Driving License, or Voter ID required at check-in' : 'Aadhaar Card, Passport, Driving License, or Voter ID required at check-in',
        subscriptionPlan: hotel && hotel.subscription ? hotel.subscription.plan : 'none',
        subscriptionStatus: hotel && hotel.subscription ? (hotel.subscription.isActive ? 'active' : 'inactive') : 'inactive',
        subscriptionExpiresAt: hotel && hotel.subscription ? hotel.subscription.validUntil : null,
        telegramAlertsEnabled: hotel ? Boolean(hotel.telegramAlertsEnabled) : false,
        telegramChatId: hotel ? hotel.telegramChatId || '' : '',
        antiTheftOtpRequired: hotel && hotel.antiTheftOtpRequired !== undefined ? Boolean(hotel.antiTheftOtpRequired) : true,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const hotel = await Hotel.findById(user.hotelId);
    
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        age: user.age,
        address: user.address,
        city: user.city || '',
        hotelId: user.hotelId,
        hotelName: hotel ? hotel.name : 'Unknown Hotel',
        hotelEmail: hotel ? hotel.email : '',
        hotelContact: hotel ? hotel.phone : '',
        hotelAddress: hotel ? hotel.address : '',
        hotelCity: hotel ? hotel.city : '',
        hotelState: hotel ? hotel.state : '',
        hotelPincode: hotel ? hotel.pincode : '',
        hotelType: hotel ? hotel.type : 'Hotel',
        hotelLogo: hotel ? hotel.logo : '',
        gstin: hotel ? hotel.gstin || '' : '',
        fssaiNumber: hotel ? hotel.fssaiNumber || '' : '',
        panNumber: hotel ? hotel.panNumber || '' : '',
        tradeLicenseNumber: hotel ? hotel.tradeLicenseNumber || '' : '',
        checkInTime: hotel ? hotel.checkInTime || '12:00 PM' : '12:00 PM',
        checkOutTime: hotel ? hotel.checkOutTime || '11:00 AM' : '11:00 AM',
        invoicePrefixRestaurant: hotel ? hotel.invoicePrefixRestaurant || 'REST-' : 'REST-',
        invoicePrefixRoom: hotel ? hotel.invoicePrefixRoom || 'ROOM-' : 'ROOM-',
        invoiceTerms: hotel ? hotel.invoiceTerms || '' : '',
        upiId: hotel ? hotel.upiId || '' : '',
        bankName: hotel ? hotel.bankName || '' : '',
        bankAccountNumber: hotel ? hotel.bankAccountNumber || '' : '',
        bankIfscCode: hotel ? hotel.bankIfscCode || '' : '',
        bankAccountName: hotel ? hotel.bankAccountName || '' : '',
        receptionPhone: hotel ? hotel.receptionPhone || '' : '',
        websiteUrl: hotel ? hotel.websiteUrl || '' : '',
        googleMapsUrl: hotel ? hotel.googleMapsUrl || '' : '',
        instagramUrl: hotel ? hotel.instagramUrl || '' : '',
        facebookUrl: hotel ? hotel.facebookUrl || '' : '',
        starRating: hotel ? hotel.starRating || '3-Star' : '3-Star',
        foodGstRate: hotel && hotel.foodGstRate !== undefined ? hotel.foodGstRate : 5,
        roomGstRate: hotel && hotel.roomGstRate !== undefined ? hotel.roomGstRate : 12,
        idProofPolicy: hotel ? hotel.idProofPolicy || 'Aadhaar Card, Passport, Driving License, or Voter ID required at check-in' : 'Aadhaar Card, Passport, Driving License, or Voter ID required at check-in',
        staffPermissions: user.staffPermissions,
        subscriptionPlan: hotel && hotel.subscription ? hotel.subscription.plan : 'none',
        subscriptionStatus: hotel && hotel.subscription ? (hotel.subscription.isActive ? 'active' : 'inactive') : 'inactive',
        subscriptionExpiresAt: hotel && hotel.subscription ? hotel.subscription.validUntil : null,
        telegramAlertsEnabled: hotel ? Boolean(hotel.telegramAlertsEnabled) : false,
        telegramChatId: hotel ? hotel.telegramChatId || '' : '',
        antiTheftOtpRequired: hotel && hotel.antiTheftOtpRequired !== undefined ? Boolean(hotel.antiTheftOtpRequired) : true,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  loginUser,
  registerHotel,
  registerStaff,
  getStaff,
  deleteStaff,
  updateAdminPassword,
  updateStaffPermissions,
  updateProfile,
  getProfile,
};
