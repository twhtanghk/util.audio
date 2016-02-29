# util.audio
util.audio is an angular module implemented with angular service 'audioService.recorder' Web Audio  

## Usage
Install the required packages
```
bower install util.audio Wad

npm install dateformat lodash
```

Audio recording by audioService.recorder
```
require 'util.audio'

angular.module 'starter', ['util.audio']
	.controller 'AudioController', ($scope, audioService) ->
		$scope.recorder = audioService.recorder
		$scope.refresh = ->
			$scope.$apply()
```

html with record button and player below. Press once to start, release to stop recording, and play button to play the last recording. The recording saved in local File "recorder.url" in '.wav' format can then be uploaded to remote server for processing (e.g. mp3 conversion).
```
<html ng-app='starter'>
	<head>
		<script src="lib/ionic/js/ionic.bundle.js"></script>
		<script src="cordova.js"></script>
		<script type="text/javascript" src="js/index.js"></script>
		<link href="css/ionic.app.css" rel="stylesheet">
	</head>
	<body ng-controller='AudioController'>
		<button class="button icon ion-record" on-hold='recorder.start()' on-release='recorder.stop().then(refresh)'></button>
		<audio ng-src="{{recorder.url}}" controls="conrtols">
			<i>Your browser does not support the audio element.</i>
		</audio>
	</body>
</html>
```

## Demo
Open browser to visit http://mob.myvnc.com/util.audio/. Press record button for audio recording and release to stop. Then, press play button to play the last recording.

Deploy to local testing server
```
  git clone https://github.com/twhtanghk/util.audio.git
  cd util.audio/test
  npm install && bower install
  node_modules/.bin/gulp
  cordova platform add browser
  cordova build browser
  node_modules/.bin/http-server
```
open browser to visit http://localhost:8080/platforms/browser/www/