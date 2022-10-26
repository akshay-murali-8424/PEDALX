const express = require('express');
const path= require('path');
const multer = require('multer');
const adminAuth = require('../middlewares/adminAuth');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');

const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req,file,cb){
  cb(null,file.fieldname+'-'+Date.now()+
  path.extname(file.originalname))}
});

const upload=multer({
  storage:storage
});



var router = express.Router();

//@desc render admin login page 
//@request get 
router.route('/login')
.get(adminController.renderLoginPage)
// @desc verify admin login
// post request 
.post(authController.verifyAdminLogin)

//@desc admin home page 
router.get('/',adminAuth.adminAuthentication,adminController.renderHomePage)

//@desc admin product management
router.get('/product',adminController.renderProductPage);

router.route('/addProduct')
.get(adminController.renderAddProduct)
.post(upload.array('image',4), adminController.addProduct);

//@desc admin category management
router.get('/category',adminController.renderCategoryPage)

//@desc admin category adding page render
router.route('/addCategory')
.get(adminController.renderAddCategory)
//@desc admin category adding
.post(adminController.addCategory)

//@desc admin brand management
router.get('/brand',adminController.renderBrandPage)

//@desc admin category adding page render
router.route('/addBrand')
.get(adminController.renderAddBrand)
//@desc admin category adding
.post(adminController.addBrand)


module.exports = router;
