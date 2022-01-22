// Require
require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const { Deepgram } = require('@deepgram/sdk')
const axios = require('axios')

// Configure
app.use(express.static('public'))
const deepgram = new Deepgram(process.env.DG_KEY)
const deepgramLive = deepgram.transcription.live({ utterances: true })

// Logic
io.on('connection', socket => {
  console.log(`Connected at ${new Date().toISOString()}`)

  socket.on('microphone-stream', data => {
    deepgramLive.send(data)
  })

  socket.on('search', async () => {
    console.log('search event', transcript)
    const { data } = await axios({
      method: 'GET',
      url: `https://api.genius.com/search?q=${transcript}`,
      headers: {
        Authorization: `Bearer ${process.env.GENIUS_TOKEN}`
      }
    })
    const topThree = data.response.hits.slice(0, 3)

    socket.emit('result', topThree)
  })
})

let transcript = ''
deepgramLive.addListener('transcriptReceived', data => {
  const result = JSON.parse(data)
  const utterance = result.channel.alternatives[0].transcript
  if (result.is_final && utterance) {
    transcript += ' ' + utterance
    console.log(transcript)
  }
})

// Run
http.listen(3000, console.log(`Started at ${new Date().toISOString()}`))
