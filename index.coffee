require 'angular'
_ = require 'lodash'
numeral = require 'numeral'

angular.module('util.audio', ['util.audio.template'])
	
	.config ($sceDelegateProvider, $compileProvider) ->
		
		$sceDelegateProvider.resourceUrlWhitelist ['self', 'https://mob.myvnc.com/**', 'filesystem:**']
		
	.factory 'audioService', ($http, $interval) ->
	
		Wad = require 'Wad/build/wad.js'
	
		beep = (ms, cb) ->
			sine = new Wad source: 'sine'
			sine.play()
			callback = ->
				sine.stop()
				cb()
			_.delay callback, ms 
		
		class Recorder
			
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
					@media.rec.clear()
					@media.output.disconnect(@media.destination)
					@media.rec.record()
					@mic.play()
				
			stop: ->
				beep 500, =>
					@mic.stop()
					@media.rec.stop()
					@media.output.connect(@media.destination)
				
			file: (name) ->
				new Promise (fulfill, reject) =>
					@media.rec.exportWAV (blob) ->
						_.extend blob,
							name:			 	name
							lastModifiedDate: 	new Date()
						fulfill blob
		
		class Player
			
			@defaultVol: 1.0
			
			@interval: .33

			@formatTime: (sec) ->
				numeral(sec).format('00:00:00')
			
			playing:	false
			
			offset:		0
			
			constructor: (@url) ->
				AudioContext = window.AudioContext || webkitAudioContext
				@context = new AudioContext()
				@gain = @context.createGain()
				@volume = @gain.gain
				
			fetch: (opts = {}) ->
				new Promise (fulfill, reject) =>
					$http.get @url, _.defaults(opts, responseType: 'arraybuffer')
						.then (res) =>
							@decode(res).then =>
								@connect()
								fulfill @
						.catch reject
						
			decode: (res) ->
				new Promise (fulfill, reject) =>
					@context.decodeAudioData res.data, (buffer) =>
						@buffer = buffer
						fulfill @
					
			connect: ->
				if @playing
					@pause()
				@source = @context.createBufferSource()
				@source.buffer = @buffer
				@source.connect @gain
				@gain.connect @context.destination
				return @
			
			duration: ->
				if @buffer then @buffer.duration else 0
				
			play: (offset = @offset) ->
				@connect()
				@playing = true
				
				progress = =>
					@offset += Player.interval
				id = $interval progress, Player.interval * 1000
				@source.onended = =>
					$interval.cancel id
					if @duration() - @offset < Player.interval
						@offset = 0
						@playing = false
					
				@source.start 0, offset
				return @
									 
			pause: ->
				@source?.stop()
				@playing = false
				return @
			
			seek: ->
				if typeof @offset == 'string'
					@offset = parseFloat @offset
				if @playing
					@play()
				return @
					
			toggle: ->
				if @playing
					@pause()
				else
					@play()
				return @
					
			mute: ->
				Player.defaultVol = @volume.value 
				@volume.value = 0
				return @
								
			unmute: ->
				@volume.value = Player.defaultVol
				return @
				
			toggleVol: =>
				if @volume.value == 0
					@unmute()
				else
					@mute()
					
		Recorder:	Recorder
		Player:		Player
		
	.directive 'utilAudio', ($log) ->
		
		restrict:	'E'
		
		scope:
			src: 			'@'
		
		templateUrl: (elem, attr) ->
			attr.templateUrl || "audio.html"
		
		controller: ($scope, audioService) ->
			player = new audioService.Player($scope.src)
			player.fetch()
				.catch $log.error
			_.extend $scope, 
				model: player
				duration: ->
					audioService.Player.formatTime player.duration()
				offset: ->
					audioService.Player.formatTime player.offset
				volume: ->
					value = player.volume.value
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