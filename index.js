// Imports
require("dotenv").config({ path: ".env" });
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const { Deepgram } = require("@deepgram/sdk");

// Intialize the app
const app = express();

// Body-parser middleware
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

// Template engine
app.set("view engine", "ejs");

// Loading static files
app.use(express.static("public"));
app.use(express.static("views"));

// Homepage rendering
app.get("/", (req, res) => {
  res.render("index");
});

// /** Your Deepgram API Key*/
// const deepgramApiKey = "47ae7d40eae8a05537e2d38b5734ac43006ce8cc";

// /** Name and extension of the file you downloaded (e.g., sample.wav) */
// const pathToFile = "audio.wav";

// /** Initialize the Deepgram SDK */
// const deepgram = new Deepgram(deepgramApiKey);

// /** Create a websocket connection to Deepgram */
// const deepgramSocket = deepgram.transcription.live({ punctuate: true });

// /** Listen for the connection to open and begin sending */
// deepgramSocket.addListener("open", () => {
//   console.log("Connection opened!");

//   /** Grab your audio file */
//   const fs = require("fs");
//   const contents = fs.readFileSync(pathToFile);

//   /** Send the audio to the Deepgram API in chunks of 1000 bytes */
//   const chunk_size = 1000;
//   for (i = 0; i < contents.length; i += chunk_size) {
//     const slice = contents.slice(i, i + chunk_size);
//     deepgramSocket.send(slice);
//   }

//   /** Close the websocket connection */
//   deepgramSocket.finish();
// });

// /** Listen for the connection to close */
// deepgramSocket.addListener("close", () => {
//   console.log("Connection closed.");
// });

// /**
//  * Receive transcripts based on sent streams and
//  * write them to the console
//  */
// deepgramSocket.addListener("transcriptReceived", (transcription) => {
//   console.log(transcription);
//   console.log(transcription.channel.alternatives.transcript);
// });

// Ports
var PORT = process.env.PORT || 3000;

// Running App on Port
app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});
