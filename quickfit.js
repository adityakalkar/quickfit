require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const path = require("path");
const readline = require("readline");

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); 
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));




const username = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const db_name = process.env.MONGO_DB_NAME;

const collection_name = process.env.MONGO_COLLECTION;


const uri = `mongodb+srv://adityakalkar07:W2CBCjs14MlsiEC9@cluster0.pz1djju.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri);

async function main() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(db_name);
    const workouts = db.collection("workouts");


    app.get("/", (req, res) => {
      res.render("index");
    });

    const fetch = (...args) =>
      import("node-fetch").then(({ default: fetch }) => fetch(...args));






     app.get("/generate", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.api-ninjas.com/v1/exercises",
      {
        headers: {
          "X-Api-Key": process.env.EXERCISE_API_KEY,
        },
      }
    );

    const exercises = await response.json();

    if (!Array.isArray(exercises) || exercises.length === 0) {
      return res.send("No exercises found. Try again later.");
    }

    const random = exercises[Math.floor(Math.random() * exercises.length)];
    res.render("generate", { workout: random });
  } catch (err) {
    console.error("API fetch error:", err);
    res.send("Error fetching workout.");
  }
});




   app.post("/save", async (req, res) => {
     const { name, type, muscle, difficulty, instructions, notes, rating } = req.body;

     const db = client.db(db_name);
     const workouts = db.collection("workouts");

     await workouts.insertOne({name, type, muscle, difficulty, instructions, notes, rating: parseInt(rating), date: new Date().toISOString(),});

     res.render("saved", { name });
   });




    app.get("/history", async (req, res) => {
      const db = client.db(db_name);
      const workouts = db.collection("workouts");

      const savedWorkouts = await workouts.find().sort({ date: -1 }).toArray();
      res.render("history", { workouts: savedWorkouts });
    });
    app.post("/clear", async (req, res) => {
      const db = client.db(db_name);
      const workouts = db.collection("workouts");

      const result = await workouts.deleteMany({});
      console.log(`Cleared ${result.deletedCount} workouts`);

      res.redirect("/history");
    });




    // START SERVER
    app.listen(PORT, () => {
      console.log(`QuickFit running at http://localhost:${PORT}`);
      console.log('Type "stop" to shut down the server:');

      const cli = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      cli.on("line", (input) => {
        if (input.trim().toLowerCase() === "stop") {
          console.log("Shutting down server");
          process.exit(0);
        }
      });
    });
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

main();
