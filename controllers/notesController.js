const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = async (req, res) => {
  // Get all notes from MongoDB
  const notes = await Note.find().lean();

  // If no notes
  if (!notes?.length) {
    return res.status(400).json({ message: "No notes found" });
  }

  const notesWithUser = await Promise.all(
    notes.map(async (note) => {
      const user = await User.findById(note.user).lean().exec();
      return { ...note, username: user.username };
    })
  );

  res.json(notesWithUser);
};

// @desc Create new note
// @route POST /notes
// @access Private
const createNewNote = async (req, res) => {
  const { user, title, text } = req.body;
  try {
    if (!user || !title || !text) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    // Check user exists or not
    const userExists = await User.findById({ _id: user }).lean().exec();
    if (!userExists) {
      return res.status(400).json({ message: "User not found" });
    }
    // Check Dublicate Title
    const dublicate = await Note.findOne({ title }).collation({ locale: "en", strength: 2 }).lean().exec();

    if (dublicate) {
      return res.status(409).json({ message: "Duplicate note title" });
    }

    // Create Note and Save into DB
    const note = await Note.create({ user, title, text });

    return note
      ? res.status(201).json({ message: "New note created" })
      : res.status(400).json({ message: "Invalid note data received" });
  } catch (err) {
    console.log(err);
  }
};

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = async (req, res) => {
  const { id, title, user, text, completed } = req.body;

  if (!id || !title || !user || typeof completed !== "boolean") {
    return res.status(400).json({ message: "Please fill all the fields" });
  }

  // Check note exists
  const note = await Note.findById(id).exec();

  if (!note) {
    return res.status(404).json({ message: "Note not found" });
  }

  const duplicate = await Note.findOne({ title }).collation({ locale: "en", strength: 2 }).lean().exec();

  if (duplicate && duplicate._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate note title" });
  }

  note.user = user;
  note.title = title;
  note.text = text;
  note.completed = completed;

  const updatedNote = await note.save();

  res.json(`'${updatedNote.title}' updated`);
};

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = async (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ messages: "Note id Required" });

  // confirms note exists
  const note = await Note.findById(id).exec();

  if (!note) {
    return res.status(400).json({ message: "Note not found" });
  }

  const result = await note.deleteOne();
  const reply = `Note '${result.title}' with ID ${result._id} deleted`;

  res.json(reply);
};

module.exports = {
  getAllNotes,
  createNewNote,
  updateNote,
  deleteNote,
};
