require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get("/",(req, res)=>{
    res.json({ message: "API is working"});
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log(`server is running on ${PORT}`)
});