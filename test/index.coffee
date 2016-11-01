require '../index.js'
	
angular
  .module 'starter', ['ionic', 'util.audio']
  .controller 'AudioController', ($scope, audioService) ->
    $scope.recorder = audioService.recorder
    audioService.recorder.on 'stop', ->
      $scope.$apply()
