const { getDb } = require("../db")
const {ObjectId}=require('mongodb')
const asyncHandler = require("express-async-handler");

module.exports={
    findAll:asyncHandler( async()=>{
        const products=await getDb().collection('products').aggregate([
            {
                $lookup:{
                    from:"category",
                    localField:"category",
                    foreignField:"_id",
                    as:"categoryDetails"
                }
            },
            {
                $lookup:{
                    from:"brand",
                    localField:"brand",
                    foreignField:"_id",
                    as:"brandDetails"
                }
            } 
        ]).toArray();
        return products;
    }),


    addProduct:asyncHandler(async (name,description,price,category,brand,stock,images)=>{
        price=parseInt(price)
        stock=parseInt(stock)
        await getDb().collection('products').insertOne({name,description,price,offerPrice:price,category:ObjectId(category),brand:ObjectId(brand),stock,images})
    }),

    findProduct:asyncHandler(async(id)=>{
        const product=await getDb().collection('products').aggregate([
            {
               $match:{
                _id:ObjectId(id)
               }
            },
            {
                $lookup:{
                    from:"category",
                    localField:"category",
                    foreignField:"_id",
                    as:"categoryDetails"
                }
            },
            {
                $lookup:{
                    from:"brand",
                    localField:"brand",
                    foreignField:"_id",
                    as:"brandDetails"
                }
            } 
        ]).toArray();
        return product;
    }),

    findProductForEdit:asyncHandler(async(productId)=>{
        const product=await getDb().collection('products').findOne({_id:ObjectId(productId)})
        return product;
    }),

    updateProduct:asyncHandler(async(productId,name,description,price,category,brand,stock,images)=>{
      category=ObjectId(category)
      brand=ObjectId(brand)
      productId=ObjectId(productId)
      price=parseInt(price);
      stock=parseInt(stock);
      result=await getDb().collection('products').updateOne({_id:productId},
        {
          $set:{name,description,price:price,category:category,brand:brand,stock:stock,images:images}
        })
    console.log(result);
    }),

    updateStock:asyncHandler(async(productId,quantity)=>{
        await getDb().collection('products').updateOne({_id:ObjectId(productId)},{
          $inc:{stock: quantity}
        });
        
    }),

    findAllCycles:asyncHandler( async(dbQuery,sortOrder,pageNo,limit)=>{
        pageNo=parseInt(pageNo)
        limit=parseInt(limit)
        const products=await getDb().collection('products').find(dbQuery).sort(sortOrder).skip(pageNo*limit).limit(limit).toArray();
        return products;
    }),

    changeOfferPrice:asyncHandler(async(id,discount,typeOfOffer)=>{
        discount=parseInt(discount)
        let matchquery={}
        if(typeOfOffer==="productOffer"){
          matchquery={_id:ObjectId(id)}
        }else if(typeOfOffer==="categoryOffer"){
            matchquery={category:ObjectId(id)}
        }
        await getDb().collection('products').updateMany(matchquery,[
            {
            $set:{
              [typeOfOffer]:discount
            }
          },
            {
              $set:{
                discount:{
                  $switch:{
                    branches:[
                      {
                        case: {$gte:['$categoryOffer','$productOffer']},
                        then:'$categoryOffer'
                      },
                      {
                        case: {$gte:['$productOffer','$categoryOffer']},
                        then:'$productOffer'
                      }
                    ],
                    default:0
                  }
                }
              }
            },
            {
              $set:{
                offerPrice:{
                 $trunc:[
                  {$subtract:['$price',{$multiply:[{$divide:['$discount',100]},'$price']}]},0]
                }
              }
            }
          ])

    }),

    findAllInCategory:asyncHandler(async(dbQuery)=>{
       const products=await getDb().collection('products').find(dbQuery).toArray();
       return products;
    })
}