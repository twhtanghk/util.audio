dateformat = require 'dateformat'

now = ->
	ret = new Date()
	dateformat new Date(), 'yyyymmddHHMMss'
	
angular.module 'util.audio', []
	
	.config ($sceDelegateProvider) ->
		
		$sceDelegateProvider.resourceUrlWhitelist ['self', 'https://mob.myvnc.com/**', 'filesystem:**', 'blob:**']
		
	.factory 'audioService', ->

		Wad = require 'Wad/build/wad.js'
		
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
				@media.rec.clear()
				@media.output.disconnect(@media.destination)
				@media.rec.record()
				@mic.play()
						
			stop: ->
				@mic.stop()
				@media.rec.stop()
				@media.output.connect(@media.destination)
				new Promise (resolve, reject) =>
					@media.rec.exportWAV (blob) =>
						blob.name =	"#{now()}.wav"
						blob.lastModifiedDate = new Date()
						@file = blob
						if @url
							URL.revokeObjectURL @url
						@url = URL.createObjectURL @file
						resolve @
								
		recorder: new Recorder()			  