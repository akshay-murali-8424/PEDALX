const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const asyncHandler = require("express-async-handler");
const { promisify } = require("util");
const categoryHelper = require("../helpers/categoryHelper");
const brandHelper = require("../helpers/brandHelper");
const cloudinary = require("../utils/cloudinary");
const productHelper = require("../helpers/productHelper");
const userHelper = require("../helpers/userHelper");
const orderHelper = require("../helpers/orderHelper");

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
    console.log(products);
    res.render('editProduct',{admin:true,products,categories,brands})
  },

  editProduct:async (req,res)=>{
    try{
      const productId=req.params.id;
      console.log(req.body)
      const {name,description,price,category,brand,stock}=req.body;
      const images = await Promise.all(
        req.files.map(async (file) => {
          const {url} = await cloudinary.uploader.upload(file.path);
          return url;
        }))
      const product=await productHelper.findProductForEdit(productId);
      const newImages=[...product.images.slice(images.length),...images]
      await productHelper.updateProduct(productId,name,description,price,category,brand,stock,newImages)
      res.redirect('/admin/product');
      }catch(err){
        console.log(err);
      }
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
  
  renderUserManagement:async(req,res)=>{
    try{
      const usersClass="active";
      const users=await userHelper.findAll();
      console.log(users)
      res.render("adminUserManagement",{admin:true,users,usersClass})
    }catch(err){
      console.log(err);
    } 
  },

  renderOrdersPage:async(req,res)=>{
   try{
    const ordersClass="active";
    const orders=await orderHelper.findAll()
    res.render("adminOrders",{admin:true,ordersClass,orders})
   }catch(err){
    console.log(err)
   }
  },

  changeOrderStatus:async(req,res)=>{
    try{
       const orderId=req.params.id;
       const {orderStatus}=req.body;
       await orderHelper.changeOrderStatus(orderId,orderStatus)
       res.redirect('/admin/orders')
    }catch(err){
        console.log(err)
    }
  }
};
