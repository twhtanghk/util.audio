# util.audio
Angular module with 
* angular service audioService.recorder and audioService.player
* angular directive util-audio-recorder and util-audio-player

## Usage
Install the required packages
```
bower install util.audio
```
Audio playing and recording via audioService.player and recorder where player.url, recorder.file and recorder.url are the audio content, recording content file and local file url respectively. See [test/index.coffee](https://github.com/twhtanghk/util.audio/blob/master/test/index.coffee).

util-audio-player directive with play button and util-audio-recorder directive with mic button to start recording if press and hold, to stop recording if release the button. See [test/index.html](https://github.com/twhtanghk/util.audio/blob/master/test/index.html).

## Demo
Click [here](https://rawgit.com/twhtanghk/util.audio/master/test/index.html) for demo
