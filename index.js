var EventEmitter,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

EventEmitter = require('events').EventEmitter;

angular.module('util.audio', []).constant('Modernizr', Modernizr).config(function($sceDelegateProvider) {
  return $sceDelegateProvider.resourceUrlWhitelist(['self', 'filesystem:**', 'blob:**']);
}).run(function($templateCache) {
  $templateCache.put('templates/util.audio/recorder.html', "<button \n  class=\"button\" \n  on-hold=\"model.start()\"\n  on-release=\"model.stop()\"\n  ng-if=\"Modernizr.getusermedia\">\n  <i class=\"icon ion-mic-a\"></i>\n</button>");
  return $templateCache.put('templates/util.audio/player.html', "<button class=\"button\" ng-click=\"start()\" style=\"vertical-align: middle\">\n  <i class=\"icon ion-play\"></i>\n</button>\n<span style=\"vertical-align: middle\">\n  {{numeral(model.source.buffer.duration).format('00:00')}}\n  {{model.source.buffer.paused}}\n</span>");
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
    controller: function($scope, $attrs, audioService) {
      $scope.model = new audioService.Player();
      $scope.numeral = require('numeral');
      $attrs.$observe('src', function(newurl, oldurl) {
        if (newurl !== oldurl) {
          return $scope.model.connect(newurl);
        }
      });
      $scope.start = function() {
        return $scope.model.start();
      };
      return $scope.stop = function() {
        return $scope.model.stop();
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
      this.url = url;
      return $http.get(this.url, {
        responseType: 'arraybuffer'
      }).then((function(_this) {
        return function(res) {
          return new Promise(function(resolve, reject) {
            return _this.context.decodeAudioData(res.data, function(buffer) {
              return resolve(buffer);
            });
          });
        };
      })(this)).then((function(_this) {
        return function(buffer) {
          _this.source = _this.context.createBufferSource();
          _this.source.buffer = buffer;
          return _this.source.connect(_this.context.destination);
        };
      })(this));
    };

    Player.prototype.start = function() {
      this.connect(this.url).then((function(_this) {
        return function() {
          var ref;
          if ((ref = _this.source) != null) {
            ref.start();
          }
          return _this.emit('start');
        };
      })(this));
      return this;
    };

    Player.prototype.stop = function() {
      var ref;
      if ((ref = this.source) != null) {
        ref.stop();
      }
      this.emit('stop');
      return this;
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
      if (!(typeof Modernizr !== "undefined" && Modernizr !== null ? Modernizr.getusermedia : void 0)) {
        $log.error('getusermedia not supported');
        return;
      }
      this.mic = new Wad({
        source: 'mic'
      });
      this.media.add(this.mic);
    }

    Recorder.prototype.start = function() {
      this.media.rec.clear();
      this.media.output.disconnect(this.media.destination);
      this.media.rec.record();
      this.mic.play();
      this.emit('start');
      return this;
    };

    Recorder.prototype.stop = function() {
      var ref;
      if ((ref = this.mic) != null) {
        ref.stop();
      }
      this.media.rec.stop();
      this.media.output.connect(this.media.destination);
      this.media.rec.exportWAV((function(_this) {
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
      return this;
    };

    return Recorder;

  })(EventEmitter);
  return {
    recorder: Recorder.instance(),
    Player: Player
  };
});
