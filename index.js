var _, numeral,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

require('angular');

_ = require('lodash');

numeral = require('numeral');

angular.module('util.audio', ['util.audio.template']).config(function($sceDelegateProvider, $compileProvider) {
  return $sceDelegateProvider.resourceUrlWhitelist(['self', 'https://mob.myvnc.com/**', 'filesystem:**']);
}).factory('audioService', function($http, $interval) {
  var Player, Recorder, Wad, beep;
  Wad = require('Wad/build/wad.js');
  beep = function(ms, cb) {
    var callback, sine;
    sine = new Wad({
      source: 'sine'
    });
    sine.play();
    callback = function() {
      sine.stop();
      return cb();
    };
    return _.delay(callback, ms);
  };
  Recorder = (function() {
    function Recorder() {
      this.media = new Wad.Poly({
        recConfig: {
          workerPath: 'lib/Wad/src/Recorderjs/recorderWorker.js'
        }
      });
      this.mic = new Wad({
        source: 'mic'
      });
      this.media.add(this.mic);
    }

    Recorder.prototype.start = function() {
      return beep(1000, (function(_this) {
        return function() {
          _this.media.rec.clear();
          _this.media.output.disconnect(_this.media.destination);
          _this.media.rec.record();
          return _this.mic.play();
        };
      })(this));
    };

    Recorder.prototype.stop = function() {
      return beep(500, (function(_this) {
        return function() {
          _this.mic.stop();
          _this.media.rec.stop();
          return _this.media.output.connect(_this.media.destination);
        };
      })(this));
    };

    Recorder.prototype.file = function(name) {
      return new Promise((function(_this) {
        return function(fulfill, reject) {
          return _this.media.rec.exportWAV(function(blob) {
            _.extend(blob, {
              name: name,
              lastModifiedDate: new Date()
            });
            return fulfill(blob);
          });
        };
      })(this));
    };

    return Recorder;

  })();
  Player = (function() {
    Player.defaultVol = 1.0;

    Player.interval = .33;

    Player.formatTime = function(sec) {
      return numeral(sec).format('00:00:00');
    };

    Player.prototype.playing = false;

    Player.prototype.offset = 0;

    function Player(url) {
      var AudioContext;
      this.url = url;
      this.toggleVol = bind(this.toggleVol, this);
      AudioContext = window.AudioContext || webkitAudioContext;
      this.context = new AudioContext();
      this.gain = this.context.createGain();
      this.volume = this.gain.gain;
    }

    Player.prototype.fetch = function(opts) {
      if (opts == null) {
        opts = {};
      }
      return new Promise((function(_this) {
        return function(fulfill, reject) {
          return $http.get(_this.url, _.defaults(opts, {
            responseType: 'arraybuffer'
          })).then(function(res) {
            return _this.decode(res).then(function() {
              _this.connect();
              return fulfill(_this);
            });
          })["catch"](reject);
        };
      })(this));
    };

    Player.prototype.decode = function(res) {
      return new Promise((function(_this) {
        return function(fulfill, reject) {
          return _this.context.decodeAudioData(res.data, function(buffer) {
            _this.buffer = buffer;
            return fulfill(_this);
          });
        };
      })(this));
    };

    Player.prototype.connect = function() {
      if (this.playing) {
        this.pause();
      }
      this.source = this.context.createBufferSource();
      this.source.buffer = this.buffer;
      this.source.connect(this.gain);
      this.gain.connect(this.context.destination);
      return this;
    };

    Player.prototype.duration = function() {
      if (this.buffer) {
        return this.buffer.duration;
      } else {
        return 0;
      }
    };

    Player.prototype.play = function(offset) {
      var id, progress;
      if (offset == null) {
        offset = this.offset;
      }
      this.connect();
      this.playing = true;
      progress = (function(_this) {
        return function() {
          return _this.offset += Player.interval;
        };
      })(this);
      id = $interval(progress, Player.interval * 1000);
      this.source.onended = (function(_this) {
        return function() {
          $interval.cancel(id);
          if (_this.duration() - _this.offset < Player.interval) {
            _this.offset = 0;
            return _this.playing = false;
          }
        };
      })(this);
      this.source.start(0, offset);
      return this;
    };

    Player.prototype.pause = function() {
      var ref;
      if ((ref = this.source) != null) {
        ref.stop();
      }
      this.playing = false;
      return this;
    };

    Player.prototype.seek = function() {
      if (typeof this.offset === 'string') {
        this.offset = parseFloat(this.offset);
      }
      if (this.playing) {
        this.play();
      }
      return this;
    };

    Player.prototype.toggle = function() {
      if (this.playing) {
        this.pause();
      } else {
        this.play();
      }
      return this;
    };

    Player.prototype.mute = function() {
      Player.defaultVol = this.volume.value;
      this.volume.value = 0;
      return this;
    };

    Player.prototype.unmute = function() {
      this.volume.value = Player.defaultVol;
      return this;
    };

    Player.prototype.toggleVol = function() {
      if (this.volume.value === 0) {
        return this.unmute();
      } else {
        return this.mute();
      }
    };

    return Player;

  })();
  return {
    Recorder: Recorder,
    Player: Player
  };
}).directive('utilAudio', function($log) {
  return {
    restrict: 'E',
    scope: {
      src: '@'
    },
    templateUrl: function(elem, attr) {
      return attr.templateUrl || "audio.html";
    },
    controller: function($scope, audioService) {
      var player;
      player = new audioService.Player($scope.src);
      player.fetch()["catch"]($log.error);
      return _.extend($scope, {
        model: player,
        duration: function() {
          return audioService.Player.formatTime(player.duration());
        },
        offset: function() {
          return audioService.Player.formatTime(player.offset);
        },
        volume: function() {
          var value;
          value = player.volume.value;
          switch (true) {
            case .66 < value && value <= 1:
              return 'ion-volume-high';
            case .33 < value && value <= .66:
              return 'ion-volume-medium';
            case 0 < value && value <= .33:
              return 'ion-volume-low';
            default:
              return 'ion-volume-mute';
          }
        }
      });
    }
  };
});

angular.module('util.audio.template', []).run(function($templateCache) {
  return $templateCache.put('audio.html', "<span class='audio'>\n	<button ng-disabled=\"! model.buffer\" class='button button-clear icon' ng-class=\"model.playing ? 'ion-pause' : 'ion-play'\" ng-click='model.toggle()'></button>\n	<input type='range' ng-model='model.offset' min='0' max='{{model.duration()}}' step='0.1' ng-change='model.seek()'></input>\n	<span ng-if='model.offset'>{{offset()}}</span>\n	<span ng-if='model.offset == 0'>{{duration()}}</span>\n	<button ng-disabled=\"! model.buffer\" class='button button-clear icon' ng-class='volume()' ng-click='model.toggleVol()'></button>\n	<input type='range' ng-model='model.volume.value' min='0' max='1' step='0.1'></input>\n</span>");
});
