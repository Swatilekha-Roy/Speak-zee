/* Scroll to top arrow */
$(window).scroll(function () {
  if ($(this).scrollTop() >= 50) {
    $("#return-to-top").fadeIn(200);
  } else {
    $("#return-to-top").fadeOut(200);
  }
});
$("#return-to-top").click(function () {
  $("body,html").animate(
    {
      scrollTop: 0,
    },
    500
  );
});

/* Speech Analysis */
/* Teachable ML model */

const IMAGE_URL = "https://teachablemachine.withgoogle.com/models/MQcSCaPs8/";

const POSE_URL = "https://teachablemachine.withgoogle.com/models/gCKJy2yBv/";

const AUDIO_URL = "https://teachablemachine.withgoogle.com/models/1jaFMEKV8/";

let modelimage, webcamimage, imagelabelContainer, maxPredictionsimage;
let modelpose, webcampose, ctx, poselabelContainer, maxPredictionspose;

// for audio model
async function createModel() {
  const checkpointURL = AUDIO_URL + "model.json"; // model topology
  const metadataURL = AUDIO_URL + "metadata.json"; // model metadata

  const recognizer = speechCommands.create(
    "BROWSER_FFT", // fourier transform type, not useful to change
    undefined, // speech commands vocabulary feature, not useful for your models
    checkpointURL,
    metadataURL
  );

  // check that model and metadata are loaded via HTTPS requests.
  await recognizer.ensureModelLoaded();

  return recognizer;
}

// Declare the arrays for storing dynamic data
window.audio1arr = [];
window.audio2arr = [];
window.pose1arr = [];
window.pose2arr = [];
window.pose3arr = [];
window.pose4arr = [];
window.image1arr = [];
window.image2arr = [];
window.sumimagearr1 = 0;
window.sumimagearr2 = 0;
window.sumposearr1 = 0;
window.sumposearr2 = 0;
window.sumposearr3 = 0;
window.sumposearr4 = 0;
window.sumaudioarr1 = 0;
window.sumaudioarr2 = 0;
window.audiogr = [];
window.posegr = [];
window.imagegr = [];

// Load the image model and setup the webcam
async function init() {
  // Changing the button text
  document.querySelector("#record-btn").innerHTML = "Starting the magic...";

  // Changing final report visibility
  document.querySelector("#speech-final-rep").style.display = "none";

  const modelURLimage = IMAGE_URL + "model.json";
  const metadataURLimage = IMAGE_URL + "metadata.json";

  const modelURLpose = POSE_URL + "model.json";
  const metadataURLpose = POSE_URL + "metadata.json";

  // load the model and metadata
  modelimage = await tmImage.load(modelURLimage, metadataURLimage);
  maxPredictionsimage = modelimage.getTotalClasses();
  // load the model and metadata
  modelpose = await tmPose.load(modelURLpose, metadataURLpose);
  maxPredictionspose = modelpose.getTotalClasses();

  // Convenience function to setup a webcam
  const height = 350;
  const width = 350;
  const flip = true; // whether to flip the webcam

  webcamimage = new tmImage.Webcam(width, height, flip); // width, height, flip
  webcampose = new tmPose.Webcam(width, height, flip); // width, height, flip

  // Change button text
  document.querySelector("#record-btn").innerHTML = "Loading the model...";

  await webcampose.setup(); // request access to the webcam
  //await webcamimage.setup();
  await webcampose.play();
  //await webcamimage.play();
  window.requestAnimationFrame(loop);

  // Change button text
  document.querySelector("#record-btn").innerHTML = "Please Be patient...";

  // append elements to the DOM
  const canvas = document.getElementById("canvas");

  canvas.width = width;
  canvas.height = height;
  ctx = canvas.getContext("2d");

  poselabelContainer = document.getElementById("pose_label-container");
  for (let i = 0; i < maxPredictionspose; i++) {
    // and class labels
    poselabelContainer.appendChild(document.createElement("div"));
  }

  imagelabelContainer = document.getElementById("image_label-container");
  for (let i = 0; i < maxPredictionsimage; i++) {
    // and class labels
    imagelabelContainer.appendChild(document.createElement("div"));
  }

  // audio recogniser
  window.recognizer = await createModel();
  const classLabels = recognizer.wordLabels(); // get class labels
  const audiolabelContainer = document.getElementById("audio_label-container");
  for (let i = 0; i < classLabels.length; i++) {
    audiolabelContainer.appendChild(document.createElement("div"));
  }

  recognizer.listen(
    (result) => {
      // declare the arrays empty
      const scores = result.scores; // probability of prediction for each class
      // render the probability scores per class
      for (let i = 0; i < classLabels.length; i++) {
        const classPrediction =
          classLabels[i] + ": " + result.scores[i].toFixed(2) * 100 + "%";
        audiolabelContainer.childNodes[i].innerHTML = classPrediction;
      }

      // Store data in arrays
      audio1arr.push(result.scores[0].toFixed(2) * 100);
      audio2arr.push(result.scores[1].toFixed(2) * 100);

      // Store audio graph data
      audiogr.push(
        Math.round(
          100 -
            (result.scores[0].toFixed(2) * 100 +
              result.scores[1].toFixed(2) * 100)
        )
      );

      // Store array sum
      sumaudioarr1 += result.scores[0].toFixed(2) * 100;
      sumaudioarr2 += result.scores[1].toFixed(2) * 100;
    },
    {
      includeSpectrogram: true, // in case listen should return result.spectrogram
      probabilityThreshold: 0.75,
      invokeCallbackOnNoiseAndUnknown: true,
      overlapFactor: 0.5, // probably want between 0.5 and 0.75. More info in README
    }
  );

  // Change Button text
  document.querySelector("#filler-gif").style.display = "none";
  document.querySelector("#record-btn").innerHTML = "Recording...";
  document.querySelector("#speech-report").style.display = "block";
  //document.querySelector("#record-btn").style.float = "none";
  document.querySelector("#stop-record-btn").style.display = "flex";
  document.querySelector("#canvas").style.display = "block";

  // Recording start time
  window.starttime = Date.now();

  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    console.log({ stream });
    if (!MediaRecorder.isTypeSupported("audio/webm"))
      return alert("Browser not supported");
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm",
    });
    const socket = new WebSocket("wss://api.deepgram.com/v1/listen", [
      "token",
      "47ae7d40eae8a05537e2d38b5734ac43006ce8cc",
    ]);
    socket.onopen = () => {
      console.log({ event: "onopen" });
      mediaRecorder.addEventListener("dataavailable", async (event) => {
        if (event.data.size > 0 && socket.readyState == 1) {
          socket.send(event.data);
        }
      });
      mediaRecorder.start(1000);
    };

    socket.onmessage = (message) => {
      const received = JSON.parse(message.data);
      const transcript = received.channel.alternatives[0].transcript;

      if (transcript && received.is_final) {
        console.log(transcript);
        str_g = str_g + " " + transcript;
      }
    };

    console.log(str_g);
    socket.onclose = () => {
      console.log({ event: "onclose" });
    };

    socket.onerror = (error) => {
      console.log({ event: "onerror", error });
    };
  });
}

async function loop() {
  webcampose.update(); // update the webcam frame
  webcamimage.update();
  await predict();
  window.requestAnimationFrame(loop);
}

// run the webcam image through the image model
async function predict() {
  const { pose, posenetOutput } = await modelpose.estimatePose(
    webcampose.canvas
  );

  const predictionpose = await modelpose.predict(posenetOutput);
  // predict can take in an image, video or canvas html element
  const predictionimage = await modelimage.predict(webcampose.canvas);

  // Image model texts
  imagelabelContainer.childNodes[0].innerHTML =
    predictionimage[0].className +
    ": " +
    predictionimage[0].probability.toFixed(2) * 100 +
    "%";
  imagelabelContainer.childNodes[0].style.color = "#0dd840";
  imagelabelContainer.childNodes[1].innerHTML =
    predictionimage[1].className +
    ": " +
    predictionimage[1].probability.toFixed(2) * 100 +
    "%";
  imagelabelContainer.childNodes[1].style.color = "#ee0a0a";

  // Store image data in array
  image1arr.push(predictionimage[0].probability.toFixed(2) * 100);
  image2arr.push(predictionimage[1].probability.toFixed(2) * 100);

  // Store image graph data
  imagegr.push(Math.round(predictionimage[1].probability.toFixed(2) * 100));

  // Store data array sum
  sumimagearr1 += predictionimage[0].probability.toFixed(2) * 100;
  sumimagearr2 += predictionimage[1].probability.toFixed(2) * 100;

  // Pose model texts
  poselabelContainer.childNodes[0].innerHTML =
    predictionpose[0].className +
    ": " +
    predictionpose[0].probability.toFixed(2) * 100 +
    "%";
  poselabelContainer.childNodes[0].style.color = "#0dd840"; //good eye contact
  poselabelContainer.childNodes[1].innerHTML =
    predictionpose[1].className +
    ": " +
    predictionpose[1].probability.toFixed(2) * 100 +
    "%";
  poselabelContainer.childNodes[1].style.color = "#ee0a0a"; //bad eye contact
  poselabelContainer.childNodes[2].innerHTML =
    predictionpose[2].className +
    ": " +
    predictionpose[2].probability.toFixed(2) * 100 +
    "%";
  poselabelContainer.childNodes[2].style.color = "#ee0a0a"; //fidgeting
  poselabelContainer.childNodes[3].innerHTML =
    predictionpose[3].className +
    ": " +
    predictionpose[3].probability.toFixed(3) * 100 +
    "%";
  poselabelContainer.childNodes[3].style.color = "#ee0a0a"; //slump

  // Store pose data in array
  pose1arr.push(predictionpose[0].probability.toFixed(2) * 100);
  pose2arr.push(predictionpose[1].probability.toFixed(2) * 100);
  pose3arr.push(predictionpose[2].probability.toFixed(2) * 100);
  pose4arr.push(predictionpose[3].probability.toFixed(2) * 100);

  // Store pose graph data
  posegr.push(
    Math.round(
      predictionpose[0].probability.toFixed(2) * 100 -
        (predictionpose[1].probability.toFixed(2) * 100 +
          predictionpose[2].probability.toFixed(2) * 100 +
          predictionpose[3].probability.toFixed(2) * 100)
    )
  );

  // Store data sum
  sumposearr1 += predictionpose[0].probability.toFixed(2) * 100;
  sumposearr2 += predictionpose[1].probability.toFixed(2) * 100;
  sumposearr3 += predictionpose[2].probability.toFixed(2) * 100;
  sumposearr4 += predictionpose[3].probability.toFixed(2) * 100;

  // finally draw the poses
  drawPose(pose);
}

function drawPose(pose) {
  if (webcampose.canvas) {
    ctx.drawImage(webcampose.canvas, 0, 0);
    // draw the keypoints and skeleton
    if (pose) {
      const minPartConfidence = 0.5;
      tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
      tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
    }
  }
}

async function initstop() {
  await webcampose.stop();
  recognizer.stopListening();
  endtime = Date.now();
  timeslot = (endtime - starttime) / 1000;
  if (timeslot < 60) {
    window.timeprint = timeslot + " seconds";
  } else {
    minutes = Math.floor(timeslot / 60);
    seconds = Math.floor(timeslot - minutes * 60);
    window.timeprint = minutes + " minutes and " + seconds + " seconds";
  }

  const myArray = str_g.split(" ");
  let wpm = myArray.length / (timeslot * 60);

  sumaudioarr1 /= audio1arr.length;
  sumaudioarr2 /= audio2arr.length;
  sumimagearr1 /= image1arr.length;
  sumimagearr2 /= image2arr.length;
  sumposearr1 /= pose1arr.length;
  sumposearr2 /= pose2arr.length;
  sumposearr3 /= pose3arr.length;
  sumposearr4 /= pose4arr.length;

  window.posesc = Math.round(
    sumposearr1 - (sumposearr2 + sumposearr3 + sumposearr4)
  );
  window.audiosc = Math.round(100 - (sumaudioarr1 + sumaudioarr2) / 2);
  window.imagesc = Math.round(sumimagearr1 - sumimagearr2);

  document.querySelector("#speech-report-div").style.display = "none";
  document.querySelector("#pose-rep").innerHTML = posesc + "% near perfect";
  document.querySelector("#audio-rep").innerHTML =
    audiosc + "% confident voice";
  document.querySelector("#image-rep").innerHTML = imagesc + "% unassisted";
  document.querySelector("#time-rep").innerHTML = timeprint;

  speechgraph(window.posesc, window.audiosc, window.imagesc, window.timeprint);
  document.querySelector("#speech-final-rep").style.display = "block";
  document.querySelector("#record-btn").innerHTML = "Start Recording";
  document.querySelector("#stop-record-btn").style.display = "none";

  console.log(str_g);
}

// plotting the graph and making the speech report
function speechgraph(posesc, audiosc, imagesc, timeprint) {
  var doc = new jsPDF();

  var posex = [];
  var audiox = [];
  var imagex = [];
  for (i = 0; i < posegr.length; i++) {
    posex.push(i);
  }
  for (i = 0; i < audiogr.length; i++) {
    audiox.push(i);
  }
  for (i = 0; i < imagegr.length; i++) {
    imagex.push(i);
  }
  $("#speech-report-btn").click(function () {
    var posture = {
      x: posex,
      y: posegr,
      mode: "lines+markers",
      name: "Posture",
    };

    var voice = {
      x: audiox,
      y: audiogr,
      mode: "lines+markers",
      name: "Voice Modulation",
    };

    var help = {
      x: imagex,
      y: imagegr,
      mode: "markers",
      name: "External Aid",
    };

    var data = [posture, voice, help];

    var img_jpg = d3.select("#jpg-export");
    var layout = {
      title: "Speech Report Graph",
      xaxis: {
        title: "Duration",
      },
      yaxis: {
        title: "Speech Parameters",
      },
    };

    // Plotting the Graph
    Plotly.newPlot("graph-div", data, layout)

      // static image in png format
      .then(function (gd) {
        Plotly.toImage(gd, { height: 300, width: 700 }).then(function (gr_url) {
          img_jpg.attr("src", gr_url);
          report(gr_url);
        });
      });

    function report(gr_url) {
      doc.setFont("times", "bold");

      doc.setFontSize(39);
      doc.text("Speak-zee Speech Report", 105, 25, null, null, "center");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(18);
      doc.text(
        "Following is a report of an analysis of your speaking skills that\n" +
          "you conducted on our web platform:",
        20,
        40
      );

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Posture Feedback: ", 20, 60);
      doc.setFont("helvetica", "normal");
      posestr = posesc.toString();
      doc.text(posestr, 75, 60);
      doc.text(" % near perfect", 82, 60);
      doc.setFont("helvetica", "bold");
      doc.text("Voice Feedback: ", 20, 70);
      doc.setFont("helvetica", "normal");
      audiostr = audiosc.toString();
      doc.text(audiostr, 68, 70);
      doc.text(" % confident voice", 75, 70);
      doc.setFont("helvetica", "bold");
      doc.text("Fly Solo Feedback: ", 20, 80);
      doc.setFont("helvetica", "normal");
      imagestr = imagesc.toString();
      doc.text(imagestr, 76, 80);
      doc.text(" % unassisted.", 83, 80);

      doc.setFont("helvetica", "bold");
      doc.text("Total Speech Duration: ", 20, 100);
      doc.setFont("helvetica", "normal");
      timesc = timeprint.toString();
      doc.text(timesc, 85, 100);

      doc.addImage(gr_url, "png", 15, 130);

      doc.setFontSize(13);
      doc.text("P.T.O. for speech tips.", 20, 285);
      //doc.addImage(myimg, "png", 100, 250, 100, 35);

      doc.addPage("a4", "2");
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Some Do-s for improving your speaking skills", 20, 20);

      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.setLineWidth(1);
      doc.setDrawColor(0);
      doc.setFillColor(0, 204, 0);
      doc.circle(20, 30, 2, "FD");
      doc.text("Do utilize strategic pauses.", 25, 32);
      doc.setLineWidth(1);
      doc.setDrawColor(0);
      doc.setFillColor(0, 204, 0);
      doc.circle(20, 40, 2, "FD");
      doc.text("Do maintain good eye contact.", 25, 42);
      doc.setLineWidth(1);
      doc.setDrawColor(0);
      doc.setFillColor(0, 204, 0);
      doc.circle(20, 50, 2, "FD");
      doc.text("Do smile- we love seeing it!", 25, 52);
      doc.setLineWidth(1);
      doc.setDrawColor(0);
      doc.setFillColor(0, 204, 0);
      doc.circle(20, 60, 2, "FD");
      doc.text("Do keep an eye on the clock.", 25, 62);
      doc.setLineWidth(1);
      doc.setDrawColor(0);
      doc.setFillColor(0, 204, 0);
      doc.circle(20, 70, 2, "FD");
      doc.text("Do have confidence in yourself.", 25, 72);

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Some Don't-s for improving your speaking skills", 20, 90);

      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.setLineWidth(1);
      doc.setDrawColor(0);
      doc.setFillColor(255, 0, 0);
      doc.circle(20, 100, 2, "FD");
      doc.text("Don't just wing it.", 25, 102);
      doc.setLineWidth(1);
      doc.setDrawColor(0);
      doc.setFillColor(255, 0, 0);
      doc.circle(20, 110, 2, "FD");
      doc.text(
        "Don't use your speaking aids (eg., paper or mobile phone) too much.",
        25,
        112
      );
      doc.setLineWidth(1);
      doc.setDrawColor(0);
      doc.setFillColor(255, 0, 0);
      doc.circle(20, 120, 2, "FD");
      doc.text("Don’t be shy to go virtual.", 25, 122);
      doc.setLineWidth(1);
      doc.setDrawColor(0);
      doc.setFillColor(255, 0, 0);
      doc.circle(20, 130, 2, "FD");
      doc.text("Don’t fidget or pace- it makes you look nervous.", 25, 132);
      doc.setLineWidth(1);
      doc.setDrawColor(0);
      doc.setFillColor(255, 0, 0);
      doc.circle(20, 140, 2, "FD");
      doc.text("Don't be afraid to try again and again!", 25, 142);

      doc.setFontSize(16);
      doc.setFont("helvetica", "italic");
      doc.text(
        "“You can speak well if your\n" +
          "tongue can deliver\n" +
          "the message of your heart.” - John Ford",
        100,
        180,
        null,
        null,
        "center"
      );

      //doc.addImage(myimg, "png", 100, 250, 100, 35);
      doc.save("Speak-zee_speech-report.pdf");
    }
  });
}

/* Grammar Page Javascript */

var str_g = "";

// function grammar() {

// }
