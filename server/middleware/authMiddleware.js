const User = require("../models/User");
const jwt = require("jsonwebtoken");

const protect = async (req, res, next) =>{
    try{
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer")){
            return res.status(401).json({
                message: "Unauthorized or no token provided"
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

         const user = await User.findById(decoded.id).select("-passwordHash");

         if (!user) {
      return res.status(401).json({
        message: "Not authorized, user not found",
      });
    }

    req.user = user;
    next();
    }catch(error){
        console.log("server error", error);
        return res.status(401).json({
            message: "Unauthorized User or invalid token",
        });
    }
};

module.exports = protect;