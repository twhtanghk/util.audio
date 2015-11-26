require('angular');

angular.module('util.audio', []).config(function($sceDelegateProvider, $compileProvider) {
  return $sceDelegateProvider.resourceUrlWhitelist(['self', 'https://mob.myvnc.com/**', 'filesystem:**']);
}).factory('audioService', function($cordovaDevice) {
  return require('./audio');
});
