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
router.get('/product',adminAuth.adminAuthentication,adminController.renderProductPage);

router.route('/addProduct')
.get(adminAuth.adminAuthentication,adminController.renderAddProduct)
.post(adminAuth.adminAuthentication,upload.array('image',4), adminController.addProduct);

router.get('/edit-product/:id',adminAuth.adminAuthentication,adminController.renderEditProduct);

//@desc admin category management
router.get('/category',adminAuth.adminAuthentication,adminController.renderCategoryPage)

//@desc admin category adding page render
router.route('/addCategory')
.get(adminAuth.adminAuthentication,adminController.renderAddCategory)
//@desc admin category adding
.post(adminAuth.adminAuthentication,adminController.addCategory)

//@desc admin brand management
router.get('/brand',adminAuth.adminAuthentication,adminController.renderBrandPage)

//@desc admin category adding page render
router.route('/addBrand')
.get(adminAuth.adminAuthentication,adminController.renderAddBrand)
//@desc admin category adding
.post(adminAuth.adminAuthentication,adminController.addBrand)


module.exports = router;
