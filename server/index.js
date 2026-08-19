require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoute = require("./routes/authRoutes");
// const protect = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoute)

connectDB();

app.get("/",(req, res)=>{
    res.json({ message: "API is working"});
});

const PORT = process.env.PORT || 5000;


app.listen(PORT, ()=>{
    console.log(`server is running on ${PORT}`)
});