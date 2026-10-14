const Lookup = require("../models/Lookup");

// @desc    Create a new lookup
// @route   POST /api/lookups
// @access  Private (Admin)
exports.createLookup = async (req, res) => {
  try {
    const { name, type, parent, isActive } = req.body;

    // Optional: check if lookup with same name and type already exists
    const existing = await Lookup.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, type, hotelId: req.user.hotelId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Lookup with this name and type already exists" });
    }

    const lookup = await Lookup.create({
      hotelId: req.user.hotelId,
      name,
      type,
      parent: parent || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ success: true, data: lookup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get lookups with optional filters and pagination
// @route   GET /api/lookups
// @access  Public or Private (depending on usage)
exports.getLookups = async (req, res) => {
  try {
    const { type, isActive, parent, page = 1, limit = 10, search } = req.query;
    
    let query = { hotelId: req.user.hotelId };
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (parent) query.parent = parent;
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const total = await Lookup.countDocuments(query);
    const lookups = await Lookup.find(query)
      .populate("parent", "name type")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({ 
      success: true, 
      count: lookups.length, 
      data: lookups,
      total,
      pages: Math.ceil(total / limitNumber),
      currentPage: pageNumber
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a lookup
// @route   PUT /api/lookups/:id
// @access  Private (Admin)
exports.updateLookup = async (req, res) => {
  try {
    const { name, type, parent, isActive } = req.body;

    let lookup = await Lookup.findOne({ _id: req.params.id, hotelId: req.user.hotelId });
    if (!lookup) {
      return res.status(404).json({ success: false, message: "Lookup not found" });
    }

    lookup.name = name || lookup.name;
    lookup.type = type || lookup.type;
    
    if (parent !== undefined) {
      lookup.parent = parent === "" ? null : parent;
    }
    
    if (isActive !== undefined) {
      lookup.isActive = isActive;
    }

    await lookup.save();

    res.status(200).json({ success: true, data: lookup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a lookup
// @route   DELETE /api/lookups/:id
// @access  Private (Admin)
exports.deleteLookup = async (req, res) => {
  try {
    const lookup = await Lookup.findOne({ _id: req.params.id, hotelId: req.user.hotelId });
    if (!lookup) {
      return res.status(404).json({ success: false, message: "Lookup not found" });
    }

    // Optional: Prevent deletion if it has children
    const children = await Lookup.find({ parent: req.params.id, hotelId: req.user.hotelId });
    if (children.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot delete lookup because it has child lookups dependent on it." 
      });
    }

    await lookup.deleteOne();

    res.status(200).json({ success: true, message: "Lookup deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
