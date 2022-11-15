const jwt = require("jsonwebtoken");
const { getDb } = require("../db");
const AppError = require("../utils/appError");
const asyncHandler = require("express-async-handler");
const { promisify } = require("util");
const bcrypt = require("bcryptjs");
const userService = require("../services/userService");
const mongodb = require("mongodb");
const walletService = require("../services/walletService");
const client = require("twilio")(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

module.exports = {
  // @desc verify admin login
  // @route /admin/login POST
  verifyAdminLogin: asyncHandler(async (req, res, next) => {
    const admin = await getDb().collection("adminData").findOne();
    const { email, password } = req.body;

    if (email !== admin.email) {
      throw new AppError("invalid credentials", 401);
    }
    const isPasswordCorrect = await bcrypt.compare(password, admin.password);
    if (!isPasswordCorrect) {
      throw new AppError("invalid credentials", 401);
    }
    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });
    res.cookie("adminjwt", token, {
      httpOnly: true,
      sameSite: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(204).json("success");
  }),

  // @desc register new user
  // @route /register POST
  userRegister: asyncHandler(async (req, res) => {
    let { name, email, password, phoneno } = req.body;
    const isExistingEmail = await userService.findExistingEmail(email);
    const isExistingPhoneno = await userService.findExistingPhoneno(phoneno);
    if (isExistingEmail) {
      res.json({
        status: "email",
        message: "this email already exists",
      });
    } else if (isExistingPhoneno) {
      res.json({
        status: "phoneno",
        message: "this phone number already exists",
      });
    } else {
      // generate salt to hash password
      const salt = await bcrypt.genSalt(10);
      // hashing password
      password = await bcrypt.hash(password, salt);
      const user = await userService.addUser(name, email, password, phoneno);
      const token = jwt.sign({ userId: user.insertedId }, process.env.JWT_SECRET, {
        expiresIn: "2d",
      });
      res.cookie("userjwt", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
      });
      await walletService.createWallet(user.insertedId)
      res.json({
        status: "success",
        message: "success",
      });
    }
  }),


  // @desc verify user login
  // @route login POST
  verifyUserLogin: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await userService.findExistingEmail(email);
    if(user.isBlocked){
      throw new AppError("this user is blocked by the company",401)
    }
    if (user) {
      const userId = mongodb.ObjectId(user._id);
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (isPasswordCorrect) {
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
          expiresIn: "2d",
        });
        res.cookie("userjwt", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: false,
          maxAge: 24 * 60 * 60 * 1000,
        });
        res.json({
          status: "success",
          message: "success",
        });
      } else {
        throw new AppError("Sorry, your password was incorrect. Please double-check your password",401)
      }
    } else {
      throw new AppError("this account doesn't exist",401);
    }
  }),

  sendOtp: async (req, res) => {
    try {
      const { phoneno } = req.body;
      const isExistingPhoneno = await userService.findExistingPhoneno(phoneno);
      if (isExistingPhoneno) {
        const result = await client.verify
          .services(process.env.TWILIO_SERVICE_ID)
          .verifications.create({
            to: `+91${phoneno}`,
            channel: "sms",
          });
        res.json({
          status: "success",
          message: "OTP send successfully",
        });
      } else {
        res.status(400).json({
          status: "failure",
          message: "Entered phone number is not a PEDALX user",
        });
      }
    } catch (err) {
      res.status(400).json({
        status: "error",
        message: "too many requests",
      });
    }
  },

  submitOtp: async (req, res) => {
    try {
      const data = await client.verify
        .services(process.env.TWILIO_SERVICE_ID)
        .verificationChecks.create({
          to: `+91${req.body.phoneno}`,
          code: req.body.otp,
        });
      console.log(data.status)
      if (data.status == "approved") {
        const user =await userService.findExistingPhoneno(req.body.phoneno);
        console.log({ user });
        const userId = mongodb.ObjectId(user._id);
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
          expiresIn: "2d",
        });
        res.cookie("userjwt", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: false,
          maxAge: 24 * 60 * 60 * 1000,
        });
        res.json({
          status: "success",
          message: "success",

        });
      } else {
        res.status(400).json({
          status: "failed",
          message: "Invalid OTP",
        });
      }
    } catch (err) {
      res.status(500).json({
        status: "failed",
        message: err.message,
      });
    }
  },

  userLogout: (req, res) => {
    res.cookie('userjwt', 'loggedout', {
      expiresIn: new Date(Date.now()),
      httpOnly: true
    })
    res.redirect('/');
  }
};
