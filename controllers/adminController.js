const jwt = require("jsonwebtoken");
const { getDb } = require("../db");
const AppError = require("../utils/appError");
const asyncHandler = require("express-async-handler");
const { promisify } = require("util");
const bcrypt = require("bcryptjs");
const categoryHelper = require("../helpers/categoryHelper");
const brandHelper = require("../helpers/brandHelper");
const cloudinary = require("../utils/cloudinary");
const productHelper = require("../helpers/productHelper");

module.exports = {
  // @desc render admin login page
  // @route /login GET
  renderLoginPage: async (req, res) => {
    if (req.cookies.adminjwt) {
      const isLoggedIn = await promisify(jwt.verify)(
        req.cookies.adminjwt,
        process.env.JWT_SECRET
      );
      if (isLoggedIn) {
        res.redirect("/admin");
      } else {
        res.render("adminLogin",{admin:true});
      }
    } else {
      res.render("adminLogin",{admin:true});
    }
  },

  // @desc render admin home page
  // @route / GET
  renderHomePage: (req, res) => {
    const dashboardClass="active";
    res.render("adminHome", { admin: true ,dashboardClass});
  },

  // @desc render product management page
  // @route /product GET
  renderProductPage: async(req, res) => {
    const productClass="active";
    const products=await productHelper.findAll();
    res.render("adminProduct", { admin: true ,products,productClass});
  },

  renderAddProduct: async (req, res) => {
    const productClass="active";
    const [categories,brands] = await Promise.all([
      categoryHelper.findAll(),
      brandHelper.findAll()
    ])
    const error=req.query.error;
    req.query.error=null;
    res.render("addProduct", { admin: true, categories, brands, productClass,error});
  },

  addProduct: async (req, res) => {
    try{ 
      const {name,description,price,category,brand,stock}=req.body;
      const images = await Promise.all(
        req.files.map(async (file) => {
          const {url} = await cloudinary.uploader.upload(file.path);
          return url;
        })
        )
        await productHelper.addProduct(name,description,price,category,brand,stock,images);
        res.redirect('/admin/product')
      }
      catch(err){
        res.redirect(`/admin/addproduct?error=${err.message}`)
      }
  },

  renderEditProduct:async(req,res)=>{
    const productId=req.params.id
    const [products,categories,brands]=await Promise.all([
      productHelper.findProduct(productId),
      categoryHelper.findAll(),
      brandHelper.findAll()
    ])
    res.render('editProduct',{admin:true,products,categories,brands})
  },

  renderCategoryPage: async (req, res) => {
    const categoryClass="active";
    const categories = await categoryHelper.findAll();
    res.render("adminCategory", { admin: true, categories, categoryClass});
  },

  renderAddCategory: (req, res) => {
    const categoryClass="active";
    res.render("addCategory", { admin: true ,categoryClass});
  },

  addCategory: async (req, res) => {
    const { name, description } = req.body;
    await categoryHelper.addCategory(name, description);
    res.redirect("/admin/category");
  },

  renderBrandPage: async (req, res) => {
    const brandClass="active";
    const brands = await brandHelper.findAll();
    res.render("adminBrand", { admin: true, brands, brandClass});
  },

  renderAddBrand: (req, res) => {
    const brandClass="active";
    res.render("addBrand", { admin: true ,brandClass});
  },

  addBrand: async (req, res) => {
    const { name, description } = req.body;
    await brandHelper.addBrand(name, description);
    res.redirect("/admin/brand");
  },

};
