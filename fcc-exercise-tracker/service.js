const config = require("dotenv").config();
let mongoose = require("mongoose");

try {
  const connection = mongoose.connect(process.env.MONGO_URI);
  console.log("db connected");
} catch (err) {
  console.log("db NOT connected", err);
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  exercises: [
    {
      description: {
        type: String,
        required: true,
      },
      duration: {
        type: Number,
        required: true,
        min: 0,
        max: 999,
      },
      date: {
        type: Date,
        required: true,
      },
    },
  ],
});

let UserModel = mongoose.model("User", userSchema);

const createAndSaveUser = (username, cb) => {
  UserModel.findOne({ username: username })
    .then((user) => {
      if (user) {
        console.log("existing user", username, user);
        cb(null, user);
      } else {
        let user = new UserModel({
          username: username,
          exercise: [],
        });
        user.save().then((user) => cb(null, user));
      }
    })
    .catch((err) => {
      console.log(err);
      cb(err);
    });
};

const getUsers = (cb) => {
  UserModel.find({})
    .then((users) => {
      cb(null, users);
    })
    .catch((err) => {
      console.log(err);
      cb(err);
    });
};

const saveExercise = (userId, description, duration, dateStr, cb) => {
  date = checkDate(dateStr);
  UserModel.findByIdAndUpdate(
    userId,
    {
      $push: {
        exercises: {
          description: description,
          duration: duration,
          date: date,
        },
      },
    },
    { new: true }
  )
    .then((user) => {
      cb(null, {
        _id: user._id,
        username: user.username,
        date: date.toDateString(),
        duration: duration,
        description: description,
      });
    })
    .catch((err) => {
      console.log(err);
      cb(err);
    });
};

const checkDate = (dateStr) => {
  if (!dateStr) {
    return new Date(Date.now());
  } else {
    const parts = dateStr.split("-");
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);

    const utcDate = new Date(Date.UTC(year, month, day));
    return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
  }
};

const getExerciseLog = (userId, fromDate, toDate, limit, cb) => {
  let query;

  console.log(userId, fromDate, toDate, limit);

  if (fromDate && toDate) {
    query = UserModel.findById(userId, {
      // Filter exercises based on the date range
      exercises: {
        $filter: {
          input: "$exercises",
          as: "exercise",
          cond: {
            $and: [
              { $gte: ["$$exercise.date", checkDate(fromDate)] },
              { $lte: ["$$exercise.date", checkDate(toDate)] },
            ],
          },
        },
      },
    });
  } else {
    query = UserModel.findById(userId);
  }

  query
    .then((user) => {
      const limitedExercises = limit
        ? user.exercises.slice(0, limit)
        : user.exercises;
      cb(null, {
        _id: user._id,
        username: user.username,
        count: limitedExercises.length,
        log: limitedExercises.map((d) => ({
          description: d.description,
          duration: d.duration,
          date: d.date.toDateString(),
        })),
      });
    })
    .catch((ex) => {
      console.log(ex);
    });
};

exports.createAndSaveUser = createAndSaveUser;
exports.getUsers = getUsers;
exports.saveExercise = saveExercise;
exports.getExerciseLog = getExerciseLog;
