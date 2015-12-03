require '../index.js'
_ = require 'lodash'

angular.module 'app', ['util.audio']
	.controller 'AudioController', ($scope, audioService) ->
		_.extend $scope,
			url:		'http://hpr.dogphilosophy.net/test/mp3.mp3'
			player:		audioService.player
			recorder:	audioService.recorder