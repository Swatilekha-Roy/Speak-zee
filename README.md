# Song Search

Say (or sing) song lyrics and have the top 3 matches returned to you using Deepgram and the Genius API. This project accompanies a blog post available at https://developers.deepgram.com/blog/2021/12/song-search-js/

You will need:

- A Deepgram API Key - [get one here](https://console.deepgram.com/signup).
- A Genius API Access Token - [get one here](https://genius.com/api-clients).

## Setup

```
git clone https://github.com/deepgram-devs/song-search.git
cd song-search
npm install
mv .env.example .env
```

Set your keys in `.env`

## Usage

```
node index.js
```

Open <https://localhost:3000> in the browser, get lyrics out of your mouth, and click the button when you're done.
