require('dotenv').config();

const express = require("express");
const { neon } = require("@neondatabase/serverless");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(function (_, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type",
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;

const sql = neon(DATABASE_URL);

const cors = require("cors");
app.use(cors());

app.listen(port, () =>
  console.log(` My App listening at http://localhost:${PORT}`),
);
