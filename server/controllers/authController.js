const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const registerUser = async(req, res)=>{
    try {
        const {name, email, password} = req.body;
            if(!name || !email || !password){
                return res.status(400).json({message: "Name, email and password is required", });
            }
        

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({ message: "User already exist", });
        }

        const createUser = await User.create({
                name,
                email,
                passwordHash: password,
        });

        const token =generateToken(createUser._id);

            return res.status(201).json({
                user: {
                    _id: createUser._id,
                    name: createUser.name,
                    email: createUser.email,
                },
                token,
            });
     
}
    catch(error){
        console.log("Register Error", error);
        return res.status(500).json({
            message: "server error",
        });
    }
};


const loginUser = async(req, res)=>{
    try {
        const { email, password} = req.body;
        if(!email ||!password){
            return res.status(400).json({message: "email and password both are required", });
        }

        const user = await User.findOne({email});

        if(!user){
            return res.status(401).json({
                message: "invalid crendetials"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if(!isPasswordCorrect){
            return res.status(401).json({
                message: "invalid credentials",
            });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
           user:{
                _id: user._id,
                name: user.name,
                email: user.email,
                },
            token, 
        });
    }catch(error){
        console.log("login failed" , error);
        return res.status(500).json({message: "server error",});
    }
};

module.exports ={
    registerUser,
    loginUser,
};