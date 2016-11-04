var EventEmitter, numeral,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

numeral = require('numeral');

EventEmitter = require('events').EventEmitter;

angular.module('util.audio', []).constant('Modernizr', Modernizr).config(function($sceDelegateProvider) {
  return $sceDelegateProvider.resourceUrlWhitelist(['self', 'filesystem:**', 'blob:**']);
}).run(function($templateCache) {
  $templateCache.put('templates/util.audio/recorder.html', "<button \n  class=\"button\" \n  on-hold=\"model.start()\"\n  on-release=\"model.stop()\"\n  ng-if=\"Modernizr.getusermedia\">\n  <i class=\"icon ion-mic-a\"></i>\n</button>");
  return $templateCache.put('templates/util.audio/player.html', "<button class=\"button\" ng-click=\"start()\" style=\"vertical-align: middle\">\n  <i class=\"icon ion-play\"></i>\n</button>\n<span style=\"vertical-align: middle\">\n  {{duration}}\n</span>");
}).directive('utilAudioRecorder', function() {
  return {
    restict: 'E',
    templateUrl: function(elem, attr) {
      return attr.templateUrl || 'templates/util.audio/recorder.html';
    },
    controller: function($scope, audioService, Modernizr) {
      $scope.model = audioService.recorder;
      return $scope.Modernizr = Modernizr;
    }
  };
}).directive('utilAudioPlayer', function() {
  return {
    restrict: 'E',
    scope: {
      src: '@'
    },
    templateUrl: function(elem, attr) {
      return attr.templateUrl || 'templates/util.audio/player.html';
    },
    controller: function($scope, $attrs, $log, audioService) {
      $attrs.$observe('src', function(newurl, oldurl) {
        if (newurl !== oldurl) {
          return audioService.player.connect(newurl).then(function(source) {
            return $scope.duration = numeral(source.buffer.duration).format('00:00');
          })["catch"]($log.error);
        }
      });
      $scope.start = function() {
        return audioService.player.start($attrs.src)["catch"]($log.error);
      };
      return $scope.stop = function() {
        return audioService.player.stop();
      };
    }
  };
}).factory('audioService', function($http, $log) {
  var Player, Recorder, Wad;
  Wad = require('Wad/build/wad.js');
  Player = (function(superClass) {
    var _instance;

    extend(Player, superClass);

    Player.AudioContext = window.AudioContext || webkitAudioContext;

    _instance = null;

    Player.instance = function() {
      return _instance != null ? _instance : _instance = new Player();
    };

    function Player() {
      this.context = new Player.AudioContext();
    }

    Player.prototype.connect = function(url) {
      return $http.get(url, {
        responseType: 'arraybuffer'
      }).then((function(_this) {
        return function(res) {
          return new Promise(function(resolve, reject) {
            return _this.context.decodeAudioData(res.data, resolve, reject);
          });
        };
      })(this)).then((function(_this) {
        return function(buffer) {
          var source;
          source = _this.context.createBufferSource();
          source.buffer = buffer;
          return source;
        };
      })(this));
    };

    Player.prototype.start = function(url) {
      return this.connect(url).then((function(_this) {
        return function(source) {
          source.connect(_this.context.destination);
          source.start();
          return _this.emit('start');
        };
      })(this));
    };

    Player.prototype.stop = function() {
      var ref;
      if ((ref = this.source) != null) {
        ref.stop();
      }
      return this.emit('stop');
    };

    return Player;

  })(EventEmitter);
  Recorder = (function(superClass) {
    var _instance;

    extend(Recorder, superClass);

    _instance = null;

    Recorder.instance = function() {
      return _instance != null ? _instance : _instance = new Recorder();
    };

    function Recorder() {
      this.media = new Wad.Poly({
        recConfig: {
          workerPath: 'lib/Wad/src/Recorderjs/recorderWorker.js'
        }
      });
      if (typeof Modernizr !== "undefined" && Modernizr !== null ? Modernizr.getusermedia : void 0) {
        this.mic = new Wad({
          source: 'mic'
        });
        this.media.add(this.mic);
      }
    }

    Recorder.prototype.start = function() {
      this.media.rec.clear();
      this.media.output.disconnect(this.media.destination);
      this.media.rec.record();
      this.mic.play();
      return this.emit('start');
    };

    Recorder.prototype.stop = function() {
      var ref;
      if ((ref = this.mic) != null) {
        ref.stop();
      }
      this.media.rec.stop();
      this.media.output.connect(this.media.destination);
      return this.media.rec.exportWAV((function(_this) {
        return function(blob) {
          blob.name = "audio.wav";
          blob.lastModifiedDate = new Date();
          _this.file = blob;
          if (_this.url) {
            URL.revokeObjectURL(_this.url);
          }
          _this.url = URL.createObjectURL(_this.file);
          return _this.emit('stop');
        };
      })(this));
    };

    return Recorder;

  })(EventEmitter);
  return {
    recorder: Recorder.instance(),
    player: Player.instance()
  };
});
