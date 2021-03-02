# podcast-dl

download podcasts from onsen.ag and hibiki-radio.jp

# how to use it

```
git clone https://github.com/umgi/podcast-dl
npm install
```

Then you should create .env file and provide some paths

```
FFMPEG=D:/bin/ffmpeg/ffmpeg.exe
WORKDIR=D:/podcast/

# set empty if you wanna download a preview of the show
# SKIP_TRIAL=yes

# set empty if you want not to check or save download history
# CHECK_HISTORY=1
# WRITE_HISTORY=1
# HISTORY_FILE=D:/git/somefile.tsv

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
