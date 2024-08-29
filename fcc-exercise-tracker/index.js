const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const service = require("./service");

const app = express();
app.use(cors());
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//

app.post("/api/users", (req, resp) => {
  const username = req.body.username;
  if (!username) {
    return resp.json({ error: "username required" });
  }

  service.createAndSaveUser(username, (err, data) => {
    if (err) {
      return resp.send(err);
    }

    resp.json(toResponse(data));
  });
});
//

function toResponse(user) {
  return { _id: user._id, username: user.username };
}

app.get("/api/users", (req, resp) => {
  service.getUsers((err, data) => {
    if (err) {
      return resp.send(err);
    }

    resp.json(data.map((d) => toResponse(d)));
  });
});

app.post("/api/users/:_id/exercises", (req, resp) => {
  const description = req.body.description;
  const duration = +req.body.duration;
  const userId = req.params._id;
  const date = req.body.date;

  if (!description || !duration || duration < 1) {
    return resp.json({ error: "invalid request" });
  }

  service.saveExercise(userId, description, duration, date, (err, data) => {
    if (err) {
      return resp.send(err);
    }
    resp.json(data);
  });
});

app.get("/api/users/:_id/logs", (req, resp) => {
  service.getExerciseLog(
    req.params._id,
    req.query.from,
    req.query.to,
    req.query.limit,
    (err, data) => {
      resp.json(data);
    }
  );
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("App is listening on port " + listener.address().port);
});
