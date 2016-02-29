require '../../../index.js'
	
angular.module 'starter', ['ionic', 'util.audio']
	.controller 'AudioController', ($scope, audioService) ->
		$scope.recorder = audioService.recorder
		$scope.refresh = ->
			$scope.$apply()