# util.audio
util.audio is an angular module implemented with angular service 'audioService' and directive 'util-audio' for browser with Web Audio API support 

## Usage
Install the required packages
```
bower install util.audio Wad angular angular-animate angular-sanitize angular-ui-router ionic lodash  numeral

npm install dateformat
```

Create audio player by directive 
```
	<util-audio src='http://static.kevvv.in/sounds/callmemaybe.mp3'></util-audio>
```

Create audioService.Recorder
```
	require 'util.audio'
	
	angular.module 'app', ['util.audio']
		.controller 'AudioController', ($scope, audioService) ->
			_.extend $scope,
				recorder:	new audioService.Recorder()
				recordCompleted: ->
					$scope.$apply('recorder.url')
```

html with record button and player
```
	<div>
		<button class="button icon ion-record" on-hold='recorder.start()' on-release='recorder.stop().then(recordCompleted)'></button>
		<util-audio ng-src="{{recorder.url}}"></util-audio>
	</div>
```

## Demo
Open browser to visit http://mob.myvnc.com/util.audio/. Press record button for audio recording and release to stop. Then, press play button to play the last recording.

Deploy to local testing server
```
  git clone https://github.com/twhtanghk/util.audio.git
  cd util.audio
  npm install && bower install
  node_modules/.bin/gulp
  node_modules/.bin/http-server ./test -p 8080
```
open browser to visit http://localhost:8080/