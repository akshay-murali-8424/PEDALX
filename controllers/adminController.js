const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const asyncHandler = require("express-async-handler");
const { promisify } = require("util");
const categoryService = require("../services/categoryService");
const brandService = require("../services/brandService");
const cloudinary = require("../utils/cloudinary");
const productService = require("../services/productService");
const userService = require("../services/userService");
const orderService = require("../services/orderService");

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
    const products=await productService.findAll();
    res.render("adminProduct", { admin: true ,products,productClass});
  },

  renderAddProduct: async (req, res) => {
    const productClass="active";
    const [categories,brands] = await Promise.all([
      categoryService.findAll(),
      brandService.findAll()
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
        await productService.addProduct(name,description,price,category,brand,stock,images);
        res.redirect('/admin/product')
      }
      catch(err){
        res.redirect(`/admin/addproduct?error=${err.message}`)
      }
  },

  renderEditProduct:async(req,res)=>{
    const productId=req.params.id
    const [products,categories,brands]=await Promise.all([
      productService.findProduct(productId),
      categoryService.findAll(),
      brandService.findAll()
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
      const product=await productService.findProductForEdit(productId);
      const newImages=[...product.images.slice(images.length),...images]
      await productService.updateProduct(productId,name,description,price,category,brand,stock,newImages)
      res.redirect('/admin/product');
      }catch(err){
        console.log(err);
      }
  },

  renderCategoryPage: async (req, res) => {
    const categoryClass="active";
    const categories = await categoryService.findAll();
    res.render("adminCategory", { admin: true, categories, categoryClass});
  },

  renderAddCategory: (req, res) => {
    const categoryClass="active";
    res.render("addCategory", { admin: true ,categoryClass});
  },

  addCategory: async (req, res) => {
    const { name, description } = req.body;
    await categoryService.addCategory(name, description);
    res.redirect("/admin/category");
  },

  editCategory:async(req,res)=>{
    const categoryId=req.params.id;
    const {name,description}=req.body;
    await categoryService.editCategory(categoryId,name,description);
    res.redirect('/admin/category')
  },

  renderBrandPage: async (req, res) => {
    const brandClass="active";
    const brands = await brandService.findAll();
    res.render("adminBrand", { admin: true, brands, brandClass});
  },

  renderAddBrand: (req, res) => {
    const brandClass="active";
    res.render("addBrand", { admin: true ,brandClass});
  },

  addBrand: async (req, res) => {
    const { name, description } = req.body;
    await brandService.addBrand(name, description);
    res.redirect("/admin/brand");
  },

  editBrand:async(req,res)=>{
    const brandId=req.params.id;
    const {name,description}=req.body;
    await brandService.editBrand(brandId,name,description);
    res.redirect('/admin/brand')
  },
  
  renderUserManagement:async(req,res)=>{
    try{
      const usersClass="active";
      const users=await userService.findAll();
      console.log(users)
      res.render("adminUserManagement",{admin:true,users,usersClass})
    }catch(err){
      console.log(err);
    } 
  },

  renderOrdersPage:async(req,res)=>{
   try{
    const ordersClass="active";
    const orders=await orderService.findAll()
    res.render("adminOrders",{admin:true,ordersClass,orders})
   }catch(err){
    console.log(err)
   }
  },

  changeOrderStatus:async(req,res)=>{
    try{
       const orderId=req.params.id;
       const {orderStatus}=req.body;
       await orderService.changeOrderStatus(orderId,orderStatus)
       res.redirect('/admin/orders')
    }catch(err){
        console.log(err)
    }
  },

  changeUserStatus:async(req,res)=>{
    try{
       const userId=req.params.id;
       await userService.changeUserStatus(userId);
       res.redirect('/admin/user-management');
    }catch(err){
      console.log(err)
    }
  }
};
