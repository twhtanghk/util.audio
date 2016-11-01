# util.audio
Angular module with 
* angular service audioService.recorder and audioService.player
* angular directive util-audio-recorder and util-audio-player

## Usage
Install the required packages
```
bower install util.audio
```

Audio recording via audioService.recorder where recorder.file and recorder.url are the recording content and local file url respectively. See [test/index.coffee](https://github.com/twhtanghk/util.audio/blob/master/test/index.coffee).

util-audio-player directive with play button and util-audio-recorder directive with mic button to start recording if press and hold, to stop recording if release the button. See [test/index.html](https://github.com/twhtanghk/util.audio/blob/master/test/index.html).

## Demo
Click [here](https://rawgit.com/twhtanghk/util.audio/master/test/index.html) for demo
