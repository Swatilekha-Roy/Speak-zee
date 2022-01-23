// Imports
require("dotenv").config({ path: ".env" });
const bodyparser = require("body-parser");
const ejs = require("ejs");
// Require
var express = require('express');
const app = express();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
  // ...
});
const { Deepgram } = require('@deepgram/sdk')
const axios = require('axios')

// Intialize the app

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

// Grammar page rendering
app.get("/grammar", (req, res) => {
  res.render("grammar");
});



/** Your Deepgram API Key*/
const deepgramApiKey = "47ae7d40eae8a05537e2d38b5734ac43006ce8cc";

/** Initialize the Deepgram SDK */
const deepgram = new Deepgram(deepgramApiKey);

/** Create a websocket connection to Deepgram */
const deepgramSocket = deepgram.transcription.live({ punctuate: true });

/** Listen for the connection to open and begin sending */
deepgramSocket.addListener("micBinaryStream", left16 => {
  console.log("Connection opened!");
  deepgramLive.send(left16)

  /** Close the websocket connection */
  deepgramSocket.finish();
});

/** Listen for the connection to close */
// deepgramSocket.addListener("close", () => {
//   console.log("Connection closed.");
// });

/**
 * Receive transcripts based on sent streams and
 * write them to the console
 */
deepgramSocket.addListener("transcriptReceived", (transcription) => {
  console.log(JSON.parse(transcription)["channel"]["alternatives"][0]["transcript"]);
});

// Ports
// var PORT = process.env.PORT || 3000;

// // Running App on Port
// app.listen(PORT, () => {
//   console.log(`Server Running on Port ${PORT}`);
// });
httpServer.listen(3000);
