const mongoose=require("mongoose")


const users=mongoose.Schema({
  username:String,
  password:String,
})


const Users=mongoose.model("Users",users)

module.exports=Users