const productHelper = require("../helpers/productHelper")

module.exports=({
    renderHomePage:(req,res)=>{
        res.render("index",{user:true})
    },

    renderLoginPage:(req,res)=>{
       res.render("userLogin",{user:true});
    },

    renderLoginWithOtp:(req,res)=>{
       res.render("loginWithOtp",{user:true});
    },

    renderRegisterPage:(req,res)=>{
       res.render("userRegister",{user:true})
    },

    renderCyclePage:async (req,res)=>{
        const products=await productHelper.findAll();
        res.render("allCycles",{user:true,products})
    },

    renderViewProduct:async (req,res)=>{
        const productId=req.params.id;
        const product=await productHelper.findProduct(productId);
        console.log(product);
        res.render("viewProduct",{user:true,product});
    }
})