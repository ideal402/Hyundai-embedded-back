const express = require('express');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const indexRouter = require("./routes/index.js");


require("dotenv").config();
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use("/api", indexRouter);

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