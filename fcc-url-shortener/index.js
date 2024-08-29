// require("dotenv").config();
const express = require("express");
const cors = require("cors");
const NodeCache = require("node-cache");
const bodyParser = require("body-parser");
const DNS = require("dns");
const URL = require("url");

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

const ID_KEY = "_ID";
const idCache = new NodeCache();
if (!idCache.get(ID_KEY)) {
  idCache.set(ID_KEY, 1);
}
const cacheById = new NodeCache();
const cacheByUrl = new NodeCache();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl", function (req, res) {
  const urlParam = req.body.url;
  const url = URL.parse(urlParam);

  console.log("url is", url);

  DNS.lookup(url.hostname, (err, addr, family) => {
    if (err || !url.hostname) {
      return invalidUrl(res, urlParam);
    }
    let id;
    let cached = cacheByUrl.get(urlParam);

    if (cached) {
      id = cached;
      console.log(`${url} already cached with id ${id}`);
    } else {
      id = idCache.get(ID_KEY);
      idCache.set(ID_KEY, id + 1); // MT issues!
      cacheByUrl.set(urlParam, id);
      cacheById.set(id, urlParam);

      console.log(`${urlParam} added with id ${id}`);
    }

    res.json({ original_url: urlParam, short_url: id });
  });
});

app.get("/api/shorturl/:id", (req, res) => {
  const id = req.params.id;
  if (!id) {
    return invalidUrl(res, id);
  }

  const url = cacheById.get(id);
  if (!url) {
    console.log(id, "not found in cache");
    return invalidUrl(res, id);
  }
  console.log("request id", id);
  res.redirect(url);
});

function invalidUrl(res, url) {
  console.log("invalid url", url);
  return res.json({ error: "invalid url" });
}

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
