# podcast-dl

download podcasts from onsen.ag and hibiki-radio.jp

# how to use it

```
git clone https://github.com/umgi/podcast-dl
npm install
```

Then you should create .env file and provide some paths

```
FFMPEG=c:/bin/ffmpeg/ffmpeg.exe # windows
FFMPEG=/usr/bin/ffmpeg # linux

WORKDIR=D:/podcast/

# set empty if you wanna download a preview of the show
# SKIP_TRIAL=yes

# optional - always download, read history or readwrite history
HISTORY_FILE=./cache/_history
HISTORY_LOCK_FILE=./cache/_history_lock
WRITE_HISTORY=1  #optional

# how many chunks of audio will be downloaded at the same time
# if vpn is used, then it is better to put 6. as the connection will be interrupted
AUDIO_LIMIT=10

# ignore shows you don't want to download
# HIBIKI_IGNORE_NAMES=ff llss morfonica animania katsugeki rakuon yuzuradi
# ONSEN_IGNORE_NAMES=

# debug output
# DEBUG=1

# verbose output
# VERBOSE=1
```

# Launch

```
node index.js hibiki
node index.js onsen
```
