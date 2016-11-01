EventEmitter = require('events').EventEmitter

angular

  .module 'util.audio', []
  
  .config ($sceDelegateProvider) ->
    
    $sceDelegateProvider.resourceUrlWhitelist [
      'self'
      'filesystem:**'
      'blob:**'
    ]
    
  .run ($templateCache) ->
    $templateCache.put 'templates/util.audio/recorder.html',
      """
        <button 
          class="button" 
          on-hold="model.start()"
          on-release="model.stop()">
          <i class="icon ion-mic-a"></i>
        </button>
      """

    $templateCache.put 'templates/util.audio/player.html',
      """
        <button class="button" ng-click="start()" style="vertical-align: middle">
          <i class="icon ion-play"></i>
        </button>
        <span style="vertical-align: middle">
          {{numeral(model.source.buffer.duration).format('00:00')}}
          {{model.source.buffer.paused}}
        </span>
      """

  .directive 'utilAudioRecorder', ->

    restict: 'E'

    templateUrl: (elem, attr) ->
      attr.templateUrl || 'templates/util.audio/recorder.html'

    controller: ($scope, audioService) ->
      $scope.model = audioService.recorder

  .directive 'utilAudioPlayer', ->

    restrict: 'E'

    scope:
      src: '@'

    templateUrl: (elem, attr) ->
      attr.templateUrl || 'templates/util.audio/player.html'

    controller: ($scope, $attrs, audioService) ->
      $scope.model = audioService.player
      $scope.numeral = require 'numeral'
      $attrs.$observe 'src', (newurl, oldurl) ->
        if newurl != oldurl
          $scope.model.connect newurl
      $scope.start = ->
        $scope.model.start()
      $scope.stop = ->
        $scope.model.stop()

  .factory 'audioService', ($http) ->

    Wad = require 'Wad/build/wad.js'
    
    class Player extends EventEmitter

      @AudioContext: window.AudioContext || webkitAudioContext

      _instance = null

      @instance: ->
        _instance ?= new Player()

      constructor: ->
        @context = new Player.AudioContext()

      connect: (@url) ->
        $http
          .get @url, responseType: 'arraybuffer'
          .then (res) =>
            new Promise (resolve, reject) =>
              @context.decodeAudioData res.data, (buffer) =>
                resolve buffer
          .then (buffer) =>
            @source = @context.createBufferSource()
            @source.buffer = buffer
            @source
              .connect @context.createGain()
              .connect @context.destination

      start: ->
        @connect @url
          .then =>
            @source?.start()
            @emit 'start'
        @

      stop: ->
        @source?.stop()
        @emit 'stop'
        @

    class Recorder extends EventEmitter
      
      constructor: ->
        @media = new Wad.Poly 
          recConfig: 
            workerPath: 'lib/Wad/src/Recorderjs/recorderWorker.js'
        @mic = new Wad
          source:     'mic'
        @media
          .add @mic
          
      start: ->
        @media.rec.clear()
        @media.output.disconnect(@media.destination)
        @media.rec.record()
        @mic.play()
        @emit 'start'
        @
            
      stop: ->
        @mic.stop()
        @media.rec.stop()
        @media.output.connect(@media.destination)
        @media.rec.exportWAV (blob) =>
          blob.name = "audio.wav"
          blob.lastModifiedDate = new Date()
          @file = blob
          if @url
            URL.revokeObjectURL @url
          @url = URL.createObjectURL @file
          @emit 'stop'
        @
                
    recorder: new Recorder()        
    player: Player.instance()
