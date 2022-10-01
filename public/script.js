const socket = io("/");
const videoGrid = document.getElementById("video-grid");
// const myPeer = new Peer(undefined, {
//   // host: "http://elliottchong.com/", // main pov
//   // host: "/", // local testing
//   // port: "3001",
// });

const myPeer = new Peer(undefined);
const myVideo = document.createElement("video");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const calling = document.getElementById("calling");
var transcriptContainer = document.getElementById("transcript");

var seconds = 00;
var tens = 00;
var interval;

myVideo.muted = true;
const peers = {};
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        initCall();
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      initCall();
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (id) => {
  console.log(id);
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function initCall() {
  transcriptContainer.classList.remove("opacity-0");
  calling.innerHTML = `<span id="appendMin">00</span>:<span id="appendSeconds">00</span>`;
  clearInterval(interval);
  interval = setInterval(startTimer, 1000);
}

function startTimer() {
  var appendMin = document.getElementById("appendMin");
  var appendSeconds = document.getElementById("appendSeconds");
  tens++;
  if (tens <= 9) {
    appendSeconds.innerHTML = "0" + tens;
  }
  if (tens > 9) {
    appendSeconds.innerHTML = tens;
  }
  if (tens > 60) {
    console.log("seconds");
    seconds++;
    appendMin.innerHTML = "0" + seconds;
    tens = 0;
    appendSeconds.innerHTML = "0" + 0;
  }
  if (seconds > 9) {
    appendMin.innerHTML = seconds;
  }
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
  let chunks = [];
  let mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.start();
  console.log(mediaRecorder.state);
  mediaRecorder.ondataavailable = (ev) => {
    console.log(ev.data);
    chunks.push(ev.data);
    console.log(chunks);
  };
  mediaRecorder.onstop = (ev) => {
    let blob = new Blob(chunks, { type: "video/mp4" });
    chunks = [];
    let videoURL = window.URL.createObjectURL(blob);
    console.log(videoURL);
  };
}
