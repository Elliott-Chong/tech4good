const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
  // host: "http://elliottchong.com/", // main pov
  host: "/", // local testing
  port: "3001",
});
const myVideo = document.createElement("video");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
myVideo.muted = true;
const peers = {};
navigator.mediaDevices
  .getUserMedia({
    video: false,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      console.log(call);
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
        let chunks = [];
        let mediaRecorder = new MediaRecorder(userVideoStream);
        mediaRecorder.start();
        console.log(mediaRecorder.state);
        // startBtn.addEventListener("click", (ev) => {
        //   mediaRecorder.start();
        //   console.log(mediaRecorder.state);
        // });
        stopBtn.addEventListener("click", (ev) => {
          mediaRecorder.stop();
          console.log(mediaRecorder.state);
        });
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
      });
    });

    socket.on("user-connected", (userId) => {
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

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}
