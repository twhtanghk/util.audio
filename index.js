var _, dateformat, now, numeral, url,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

require('angular');

require('angular-animate');

require('angular-sanitize');

require('angular-ui-router');

require('ionic');

_ = require('lodash');

numeral = require('numeral');

url = require('url');

dateformat = require('dateformat');

now = function() {
  var ret;
  ret = new Date();
  return dateformat(new Date(), 'yyyymmddHHMMss');
};

angular.module('util.audio', ['util.audio.template', 'ionic']).config(function($sceDelegateProvider, $compileProvider) {
  return $sceDelegateProvider.resourceUrlWhitelist(['self', 'https://mob.myvnc.com/**', 'filesystem:**', 'blob:**']);
}).factory('audioService', function($http, $interval, $log) {
  var Audio, Player, Recorder, Wad, beep;
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
    Recorder.prototype.recording = false;

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
          _this.recording = true;
          _this.media.rec.clear();
          _this.media.output.disconnect(_this.media.destination);
          _this.media.rec.record();
          return _this.mic.play();
        };
      })(this));
    };

    Recorder.prototype.stop = function() {
      return new Promise((function(_this) {
        return function(fulfill, reject) {
          return beep(500, function() {
            _this.mic.stop();
            _this.media.rec.stop();
            _this.media.output.connect(_this.media.destination);
            _this.recording = false;
            return _this.file().then(function(file) {
              _this.url = URL.createObjectURL(file);
              return fulfill(_this);
            });
          });
        };
      })(this));
    };

    Recorder.prototype.file = function(name) {
      if (name == null) {
        name = (now()) + ".wav";
      }
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
    var _instance;

    function Player() {}

    Player.AudioContext = window.AudioContext || webkitAudioContext;

    Player.context = new Player.AudioContext();

    Player.interval = .33;

    _instance = null;

    Player.instance = function() {
      return _instance != null ? _instance : _instance = new Player();
    };

    Player.prototype.connect = function(audio) {
      var ref;
      if ((ref = this.audio) != null ? ref.playing : void 0) {
        this.pause();
      }
      this.audio = audio;
      this.source = Player.context.createBufferSource();
      this.source.buffer = audio.buffer;
      this.source.connect(audio.gain);
      audio.gain.connect(Player.context.destination);
      return this;
    };

    Player.prototype.play = function(audio) {
      var id, progress;
      this.connect(audio);
      audio.playing = true;
      progress = (function(_this) {
        return function() {
          return audio.offset += Player.interval;
        };
      })(this);
      id = $interval(progress, Player.interval * 1000);
      this.source.onended = (function(_this) {
        return function() {
          $interval.cancel(id);
          if (audio.duration() - audio.offset < Player.interval) {
            audio.offset = 0;
            return audio.playing = false;
          }
        };
      })(this);
      this.source.start(0, audio.offset);
      return this;
    };

    Player.prototype.pause = function() {
      var ref;
      if ((ref = this.source) != null) {
        ref.stop();
      }
      this.audio.playing = false;
      return this;
    };

    return Player;

  })();
  Audio = (function() {
    Audio.defaultVol = 1;

    Audio.prototype.url = '';

    Audio.prototype.playing = false;

    Audio.prototype.offset = 0;

    Audio.formatTime = function(sec) {
      return numeral(sec).format('00:00:00');
    };

    function Audio(url1) {
      this.url = url1;
      this.toggleVol = bind(this.toggleVol, this);
      this.gain = Player.context.createGain();
      this.volume = this.gain.gain;
      this.fetch()["catch"]($log.error);
    }

    Audio.prototype.fetch = function(opts) {
      if (opts == null) {
        opts = {};
      }
      this.url = opts.url || this.url;
      return new Promise((function(_this) {
        return function(fulfill, reject) {
          if (_this.url) {
            return $http.get(_this.url, _.defaults(opts, {
              responseType: 'arraybuffer'
            })).then(function(res) {
              return _this.decode(res.data).then(function() {
                return fulfill(_this);
              });
            })["catch"](reject);
          } else {
            return fulfill(_this);
          }
        };
      })(this));
    };

    Audio.prototype.decode = function(data) {
      return new Promise((function(_this) {
        return function(fulfill, reject) {
          return Player.context.decodeAudioData(data, function(buffer) {
            _this.buffer = buffer;
            return fulfill(_this);
          });
        };
      })(this));
    };

    Audio.prototype.duration = function() {
      if (this.buffer) {
        return this.buffer.duration;
      } else {
        return 0;
      }
    };

    Audio.prototype.play = function() {
      return Player.instance().play(this);
    };

    Audio.prototype.pause = function() {
      return Player.instance().pause();
    };

    Audio.prototype.toggle = function() {
      if (this.playing) {
        this.pause();
      } else {
        this.play();
      }
      return this;
    };

    Audio.prototype.seek = function(pos) {
      if (pos == null) {
        pos = this.offset;
      }
      this.offset = pos;
      if (typeof this.offset === 'string') {
        this.offset = parseFloat(this.offset);
      }
      if (this.playing) {
        Player.instance().play(this);
      }
      return this;
    };

    Audio.prototype.mute = function() {
      this.defaultVol = this.volume.value;
      this.volume.value = 0;
      return this;
    };

    Audio.prototype.unmute = function() {
      this.volume.value = this.defaultVol;
      return this;
    };

    Audio.prototype.toggleVol = function() {
      if (this.volume.value === 0) {
        return this.unmute();
      } else {
        return this.mute();
      }
    };

    return Audio;

  })();
  return {
    Audio: Audio,
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
      var audio;
      audio = new audioService.Audio($scope.src);
      $scope.$watch('src', function(newurl, oldurl) {
        if (newurl !== oldurl) {
          return audio.fetch({
            url: newurl
          })["catch"]($log.error);
        }
      });
      return _.extend($scope, {
        model: audio,
        duration: function() {
          return audioService.Audio.formatTime(audio.duration());
        },
        offset: function() {
          return audioService.Audio.formatTime(audio.offset);
        },
        volume: function() {
          var value;
          value = audio.volume.value;
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
