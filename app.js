const express = require('express');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const indexRouter = require("./routes/index.js");
console.log("🚀 ~ app start:")


require("dotenv").config();
console.log("🚀 ~ app start1:")

app.use(cors());
console.log("🚀 ~ app start2:")

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use("/api", indexRouter);
console.log("🚀 ~ app start3:")


const mongoURI = process.env.DB_ADDRESS;
console.log("🚀 ~ mongoURI:", mongoURI)

mongoose
.connect(mongoURI)
.then(()=>console.log("mongoose connected"))
.catch((error) => console.log("DB connected fail:", error));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});