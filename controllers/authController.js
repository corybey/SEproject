const User = require('../models/User');

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Simple check (you'll want to hash password later!)
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered.' });

    const newUser = await User.create({ name, email, password, role });
    res.status(201).json({ message: 'User created!', user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { registerUser };

