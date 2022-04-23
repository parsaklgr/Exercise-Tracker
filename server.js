const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({ extended: false }));


const userSchema = new mongoose.Schema({
  username: String
});
const User = mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

const logSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
});
const Log = mongoose.model('Log', logSchema);

User.deleteMany({}, (err, users) => {
  if (err) return console.log(err);
});

Exercise.deleteMany({}, (err, users) => {
  if (err) return console.log(err);
});

app
  .route("/api/users")
  .post((req, res) => {
    // const id = Math.random().toString(20).slice(2) + Math.random().toString(20).slice(2);
    let newUser = new User({ username: req.body.username });
    newUser.save(function (err, data) {
      if (err) return console.error(err);
      res.json({ username: data.username, _id: data._id });
    });
  })
  .get((req, res) => {
    User.find({}).select({ __v: 0 }).exec((err, users) => {
      if (err) return console.log(err);
      res.send(users);
    });
  });

app
  .route("/api/users/:_id/exercises")
  .post((req, res) => {
    User.findById(req.params._id, (err, userfound) => {
      if (err) return console.log(err);
      let newExercise = {};
      let _date = new Date();
      if (req.body.date) {
        // console.log("1 " + " " + typeof userfound + " " + userfound["username"] + userfound["_id"]);
        _date = new Date(req.body.date);
        const dateString = _date.getUTCFullYear() + "-" + (_date.getUTCMonth() + 1).toString().padStart(2, "0") + "-" + _date.getUTCDate().toString().padStart(2, "0");
        newExercise = new Exercise({ username: userfound["username"], duration: parseInt(req.body.duration), description: req.body.description, date: dateString });
      } else {
        // console.log("2 " + " " + typeof userfound + " " + userfound["username"] +" " + userfound["_id"]);
        _date = new Date();
        const dateString = _date.getUTCFullYear() + "-" + (_date.getUTCMonth() + 1).toString().padStart(2, "0") + "-" + _date.getUTCDate().toString().padStart(2, "0");
        newExercise = new Exercise({ username: userfound["username"], duration: parseInt(req.body.duration), description: req.body.description, date: dateString });
      }
      newExercise.save((err, data) => {
        if (err) return console.error(err);
        // const resuser = {username: userfound["username"], _id: userfound["_id"], duration: req.body.duration, description: req.body.description, date: data.date};
        console.log(data);
        res.json({ _id: userfound["_id"], username: userfound["username"], date: _date.toDateString(), duration: parseInt(req.body.duration), description: req.body.description });
      });
    });
  });

app
  .route("/api/users/:_id/logs")
  .get((req, res) => {
    User.findById(req.params._id, (err, userfound) => {
      if (err) return console.log(err);
      let query = Exercise.find({ username: userfound.username });
      if (req.query.from) {
        console.log(req.query.from);
        query = query.find({ date: { $gte: req.query.from } });
      }
      if (req.query.to) {
        console.log(req.query.to);
        query = query.find({ date: { $lte: req.query.to } });
      }
      if (req.query.limit) {
        console.log(req.query.limit);
        query = query.limit(parseInt(req.query.limit));
      }
      query
        .select({ _id: 0, __v: 0 })
        .exec((err, exercisesFound) => {
          if (err) return console.error(err);
          let exercisesToSend = [];
          for (let e in exercisesFound) {
            let date = new Date(exercisesFound[e].date);
            let dateString = date.toDateString();
            exercisesToSend.push({ _id: userfound["_id"], username: exercisesFound[e].username, date: dateString, duration: exercisesFound[e].duration, description: exercisesFound[e].description })
          }
          console.log(exercisesToSend);
          res.json({ username: userfound["username"], _id: userfound["_id"], count: exercisesFound.length, log: exercisesToSend });
        });
    });
  });

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
