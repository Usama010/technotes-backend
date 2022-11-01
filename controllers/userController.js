const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").lean();
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }
  res.json(users);
});

// @desc Create new users
// @route POST /users
// @access Private
const createNewuser = asyncHandler(async (req, res) => {
  const { username, password, roles } = req.body;

  if (!username || !password || !Array.isArray(roles) || !roles.length) {
    return res.status(404).json({ message: "All Fields are required" });
  }

  // Check for Updates
  // When we use async await we need to use .exec() after .lean()
  const dublicate = await User.findOne({ username }).lean().exec();
  if (dublicate) {
    return res.status(409).json({ message: "Dublicate username" });
  }

  // Hash Password
  const hashPwd = await bcrypt.hash(password, 10);

  const userObject = { username, password: hashPwd, roles };

  const user = await User.create(userObject);
  if (user) {
    return res.status(201).json({ messages: `New User ${username} Created` });
  } else {
    return res.status(400).json({ message: "Invalid User Data Recieved" });
  }
});

// @desc Update a users
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  const { id, username, roles, active, password } = req.body;

  // Confirm data
  if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== "boolean") {
    return res.status(400).json({ message: "All fields except password are required" });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User Not Found" });
  }
  // Check for Dublicates
  const dublicate = await User.findOne({ username }).lean().exec();

  if (dublicate && dublicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Dublicate username" });
  }

  user.username = username;
  user.active = active;
  user.roles = roles;

  if (password) {
    user.password = await bcrypt.hash(password, 10);
  }

  const updatedUser = await user.save();

  res.json({ message: `${updatedUser.username} updated` });
});

// @desc Delete a users
// @route Delete /users
// @access Private
const deleteuser = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ message: "User ID is required" });

  const notes = await Note.findOne({ user: id }).lean().exec();
  if (notes) {
    return res.status(400).json({ message: "User has assigned notes" });
  }

  const user = await User.findById(id).exec();
  if (!user) {
    return res.status(404).json({ message: "User Not Found" });
  }

  const result = await user.deleteOne();
  const reply = `Username ${result.username} with ID ${result._id} deleted`;

  res.json({ message: reply });
});

module.exports = {
  getAllUsers,
  createNewuser,
  updateUser,
  deleteuser,
};
