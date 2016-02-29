_ = require 'lodash'
dateformat = require 'dateformat'

now = ->
	ret = new Date()
	dateformat new Date(), 'yyyymmddHHMMss'
	
angular.module('util.audio', [])
	
	.config ($sceDelegateProvider) ->
		
		$sceDelegateProvider.resourceUrlWhitelist ['self', 'https://mob.myvnc.com/**', 'filesystem:**', 'blob:**']
		
	.factory 'audioService', ->

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
		
		recorder:	new Recorder()