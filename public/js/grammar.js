/* Grammar Page Javascript */

navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    console.log({ stream })
    if (!MediaRecorder.isTypeSupported('audio/webm'))
        return alert('Browser not supported')
    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
    })
    const socket = new WebSocket('wss://api.deepgram.com/v1/listen', [
        'token',
        '47ae7d40eae8a05537e2d38b5734ac43006ce8cc',
    ])
    socket.onopen = () => {
        document.querySelector('#status').textContent = 'Connected'
        console.log({ event: 'onopen' })
        mediaRecorder.addEventListener('dataavailable', async (event) => {
            if (event.data.size > 0 && socket.readyState == 1) {
                socket.send(event.data)
            }
        })
        mediaRecorder.start(1000)
    }

    socket.onmessage = (message) => {
        const received = JSON.parse(message.data)
        const transcript = received.channel.alternatives[0].transcript
        if (transcript && received.is_final) {
            console.log(transcript)
            document.querySelector('#transcript').textContent +=
                transcript + ' '
        }
    }

    socket.onclose = () => {
        console.log({ event: 'onclose' })
    }

    socket.onerror = (error) => {
        console.log({ event: 'onerror', error })
    }
})
// var stream;
// const socket = io("http://localhost:3000/");
// var bufferSize = 1024 * 16;


// // Existing code unchanged.
// var audioContext = new AudioContext();
// // createScriptProcessor is deprecated. Let me know if anyone find alternative
// var processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
// processor.connect(audioContext.destination);

// navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then(handleMicStream).catch(err => {
//     console.log('error from getUserMedia', err);
// });

// // One-liner to resume playback when user interacted with the page.
// document.querySelector('.btn').addEventListener('click', function () {
//     audioContext.resume().then(() => {
//         console.log('Playback resumed successfully');
//     });
// });

// function handleMicStream(streamObj) {
//     // keep the context in a global variable
//     stream = streamObj;

//     input = audioContext.createMediaStreamSource(stream);

//     input.connect(processor);

//     processor.onaudioprocess = e => {
//         microphoneProcess(e); // receives data from microphone
//     };
// }


// function microphoneProcess(e) {
//     console.log("processing")
//     const left = e.inputBuffer.getChannelData(0); // get only one audio channel
//     socket.emit('micBinaryStream', left); // send to server via web socket
// }

// // Converts data to BINARY16
// function convertFloat32ToInt16(buffer) {
//     let l = buffer.length;
//     const buf = new Int16Array(l / 3);

//     while (l--) {
//         if (l % 3 === 0) {
//             buf[l / 3] = buffer[l] * 0xFFFF;
//         }
//     }
//     return buf.buffer;
// }


// const recordAudio = () => {
//     return new Promise(resolve => {
//         navigator.mediaDevices.getUserMedia({ audio: true })
//             .then(stream => {
//                 const mediaRecorder = new MediaRecorder(stream);
//                 const audioChunks = [];

//                 mediaRecorder.addEventListener("dataavailable", event => {
//                     audioChunks.push(event.data);
//                 });

//                 const start = () => {
//                     mediaRecorder.start();
//                 };

//                 const stop = () => {
//                     return new Promise(resolve => {
//                         mediaRecorder.addEventListener("stop", () => {
//                             const audioBlob = new Blob(audioChunks);
//                             const audioUrl = URL.createObjectURL(audioBlob);
//                             const audio = new Audio(audioUrl);
//                             const play = () => {
//                                 audio.play();
//                             };

//                             resolve({ audioBlob, audioUrl, play });
//                         });

//                         mediaRecorder.stop();
//                     });
//                 };

//                 resolve({ start, stop });
//             });
//     });
// };


// (async () => {
//     const recorder = await recordAudio();
//     recorder.start();

//     setTimeout(async () => {
//         const audio = await recorder.stop();
//         audio.play();
//     }, 3000);
// })();