require '../index.js'
_ = require 'lodash'

angular.module 'app', ['util.audio']
	.controller 'AudioController', ($scope, audioService) ->
		_.extend $scope,
			recorder:	new audioService.Recorder()
			recordCompleted: ->
				$scope.$apply('recorder.url')