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
  function Player() {}

  Player.prototype.track = {};

  Player.prototype.start = function(url) {
    if (!this.track[url]) {
      this.track[url] = new Wad({
        source: url,
        env: {
          hold: 400
        }
      });
    }
    return this.track[url].play();
  };

  Player.prototype.stop = function(url) {
    return this.track[url].stop();
  };

  return Player;

})();

module.exports = {
  beep: beep,
  recorder: new Recorder(),
  player: new Player()
};
