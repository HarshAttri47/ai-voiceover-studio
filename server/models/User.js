const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);


userSchema.pre("save", async function(next){
    if(!this.isModified("passwordHash")){
        return next();
    }
    this.passwordHash = await bcrypt.hash(this.passwordHash,10);
    next()
});


const  User = mongoose.model("User", userSchema);
module.exports = User;