const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")


async function registerUser(req, res) {
  try {
    const { username, email, password, fullName: { firstName, lastName } } = req.body;
  
    const isUserAlreadyExists = await userModel.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });

    if (isUserAlreadyExists) {
      return res.status(409).json({ message: "Username or Email Already Exists" })
    }

    const hashPassword = await bcrypt.hash(password, 10);
  
    const user = await userModel.create({
      username: username,
      email: email,
      password: hashPassword,
      fullName: {
        firstName: firstName,
        lastName: lastName
      }
    });

    const token = jwt.sign({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }, process.env.JWT_SECRET, { expiresIn: "1d" });
  
    res.cookie("token", token, {
      httpOnly: true,
      maxage: 24 * 60 * 60 * 1000,
      secure: true
    });

    res.status(201).json({
      message: "user registered Successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        addresses: user.addresses
      }
    })
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }

}

async function loginUser(req, res) {
  try {
    const { username, email, password } = req.body;

    const user = await userModel.findOne({ $or: [{ email: email }, { username: username }] }).select("+password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.cookie("token", token, {
      httpOnly: true,
      maxage: 24 * 60 * 60 * 1000,
      secure: true
    });

    res.status(200).json({
      message: "User logged in successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        addresses: user.addresses
      }
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getCurrentUser(req, res) {
  
}
module.exports = {
  registerUser,
  loginUser
}