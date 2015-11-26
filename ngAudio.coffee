require 'angular'

angular.module('util.audio', [])
	
	.config ($sceDelegateProvider, $compileProvider) ->
		
		$sceDelegateProvider.resourceUrlWhitelist ['self', 'https://mob.myvnc.com/**', 'filesystem:**']
		
	.factory 'audioService', ($cordovaDevice) ->
	
		require './audio'