require 'angular'
require 'angular-animate'
require 'angular-sanitize'
require 'angular-ui-router'
require 'ionic'
_ = require 'lodash'
numeral = require 'numeral'
url = require 'url'
dateformat = require 'dateformat'

now = ->
	ret = new Date()
	dateformat new Date(), 'yyyymmddHHMMss'
	
angular.module('util.audio', ['util.audio.template', 'ionic'])
	
	.config ($sceDelegateProvider, $compileProvider) ->
		
		$sceDelegateProvider.resourceUrlWhitelist ['self', 'https://mob.myvnc.com/**', 'filesystem:**', 'blob:**']
		
	.factory 'audioService', ($http, $interval, $log) ->
	
		Wad = require 'Wad/build/wad.js'
	
		beep = (ms, cb) ->
			sine = new Wad source: 'sine'
			sine.play()
			callback = ->
				sine.stop()
				cb()
			_.delay callback, ms 
		
		class Recorder
			
			recording:	false
			
			constructor: ->
				@media = new Wad.Poly 
					recConfig: 
						workerPath: 'lib/Wad/src/Recorderjs/recorderWorker.js'
				@mic = new Wad
					source: 		'mic'
				@media
					.add @mic
				
			start: ->
				beep 1000, =>
					@recording = true
					@media.rec.clear()
					@media.output.disconnect(@media.destination)
					@media.rec.record()
					@mic.play()
				
			stop: ->
				new Promise (fulfill, reject) =>
					beep 500, =>
						@mic.stop()
						@media.rec.stop()
						@media.output.connect(@media.destination)
						@recording = false
						@file().then (file) =>
							@url = URL.createObjectURL file
							fulfill @

			file: (name = "#{now()}.wav") ->
				new Promise (fulfill, reject) =>
					@media.rec.exportWAV (blob) ->
						_.extend blob,
							name:			 	name
							lastModifiedDate: 	new Date()
						fulfill blob
		
		class Player
			
			@AudioContext: window.AudioContext || webkitAudioContext
				
			@context: new Player.AudioContext()
		
			@interval: .33
			
			_instance = null
			
			@instance: ->
				_instance ?= new Player()
			
			connect: (audio) ->
				if @audio?.playing
					@pause()
				@audio = audio
				@source = Player.context.createBufferSource()
				@source.buffer = audio.buffer
				@source.connect audio.gain
				audio.gain.connect Player.context.destination
				return @
			
			play: (audio) ->
				@connect(audio)
				audio.playing = true
				
				progress = =>
					audio.offset += Player.interval
				id = $interval progress, Player.interval * 1000
				@source.onended = =>
					$interval.cancel id
					if audio.duration() - audio.offset < Player.interval
						audio.offset = 0
						audio.playing = false
					
				@source.start 0, audio.offset
				return @
									 
			pause: ->
				@source?.stop()
				@audio.playing = false
				return @
				
		class Audio
		
			@defaultVol:	1
			
			url:	''
		
			playing:	false
			
			offset:		0
			
			@formatTime: (sec) ->
				numeral(sec).format('00:00:00')
			
			constructor: (@url) ->
				@gain = Player.context.createGain()
				@volume = @gain.gain
				@fetch().catch $log.error
				
			fetch: (opts = {}) ->
				@url = opts.url || @url
				new Promise (fulfill, reject) =>
					if @url
						$http.get @url, _.defaults(opts, responseType: 'arraybuffer')
							.then (res) =>
								@decode(res.data).then =>
									fulfill @
							.catch reject
					else
						fulfill @
						
			decode: (data) ->
				new Promise (fulfill, reject) =>
					Player.context.decodeAudioData data, (buffer) =>
						@buffer = buffer
						fulfill @

			duration: ->
				if @buffer then @buffer.duration else 0
			
			play: ->
				Player.instance().play @
				
			pause: ->
				Player.instance().pause()
					
			seek: (pos = @offset) ->
				@offset = pos
				# input[type=range] value is defined as string type
				# to be fixed by angular later
				if typeof @offset == 'string'
					@offset = parseFloat @offset
				if @playing
					Player.instance().play(@)
				return @
					
			toggle: ->
				if @playing
					@pause()
				else
					@play()
				return @
					
			mute: ->
				@defaultVol = @volume.value 
				@volume.value = 0
				return @
								
			unmute: ->
				@volume.value = @defaultVol
				return @
				
			toggleVol: =>
				if @volume.value == 0
					@unmute()
				else
					@mute()
	
		Audio:		Audio
		Recorder:	Recorder
		Player:		Player
		
	.directive 'utilAudio', ($log) ->
		
		restrict:	'E'
		
		scope:
			src: 			'@'
		
		templateUrl: (elem, attr) ->
			attr.templateUrl || "audio.html"
		
		controller: ($scope, $attrs, audioService) ->
			audio = new audioService.Audio($scope.src)
			
			$attrs.$observe 'src', (newurl, oldurl) ->
				if newurl != oldurl
					audio.fetch(url: newurl)
						.catch $log.error
				
			_.extend $scope, 
				model: audio
				duration: ->
					audioService.Audio.formatTime audio.duration()
				offset: ->
					audioService.Audio.formatTime audio.offset
				volume: ->
					value = audio.volume.value
					switch true
						when .66 < value and value <= 1
							'ion-volume-high'
						when .33 < value and value <= .66
							'ion-volume-medium'
						when 0 < value and value <= .33
							'ion-volume-low'
						else
							'ion-volume-mute'

angular.module 'util.audio.template', []
	.run ($templateCache) ->
		$templateCache.put 'audio.html', """
			<span class='audio'>
				<button ng-disabled="! model.buffer" class='button button-clear icon' ng-class="model.playing ? 'ion-pause' : 'ion-play'" ng-click='model.toggle()'></button>
				<input type='range' ng-model='model.offset' min='0' max='{{model.duration()}}' step='0.1' ng-change='model.seek()'></input>
				<span ng-if='model.offset'>{{offset()}}</span>
				<span ng-if='model.offset == 0'>{{duration()}}</span>
				<button ng-disabled="! model.buffer" class='button button-clear icon' ng-class='volume()' ng-click='model.toggleVol()'></button>
				<input type='range' ng-model='model.volume.value' min='0' max='1' step='0.1'></input>
			</span>
		"""