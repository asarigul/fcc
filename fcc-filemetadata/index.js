const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");

const app = express();
app.use(cors());
app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

const UPLOADS_DIR = "uploads/";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + file.originalname);
  },
});
const upload = multer({ storage: storage });

app.post("/api/fileanalyse", upload.single("upfile"), (req, res) => {
  const data = {
    name: req.file.originalname,
    size: req.file.size,
    type: req.file.mimetype,
  };

  const path = req.file.path;
  fs.unlink(path, (err) => {
    if (err) {
      console.log(`cannot delete ${path}`, err);
    } else {
      console.log(`deleted ${path}`);
    }
  });

  res.status(200).json(data);
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Your app is listening on port " + port);
});
