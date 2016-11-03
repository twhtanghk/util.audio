EventEmitter = require('events').EventEmitter

angular

  .module 'util.audio', []

  .constant 'Modernizr', Modernizr
  
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
          on-release="model.stop()"
          ng-if="Modernizr.getusermedia">
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

    controller: ($scope, audioService, Modernizr) ->
      $scope.model = audioService.recorder
      $scope.Modernizr = Modernizr

  .directive 'utilAudioPlayer', ->

    restrict: 'E'

    scope:
      src: '@'

    templateUrl: (elem, attr) ->
      attr.templateUrl || 'templates/util.audio/player.html'

    controller: ($scope, $attrs, audioService) ->
      $scope.model = new audioService.Player()
      $scope.numeral = require 'numeral'
      $attrs.$observe 'src', (newurl, oldurl) ->
        if newurl != oldurl
          $scope.model.connect newurl
      $scope.start = ->
        $scope.model.start()
      $scope.stop = ->
        $scope.model.stop()

  .factory 'audioService', ($http, $log) ->

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
            @source.connect @context.destination

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
      
      _instance = null

      @instance: ->
        _instance ?= new Recorder()

      constructor: ->
        @media = new Wad.Poly 
          recConfig: 
            workerPath: 'lib/Wad/src/Recorderjs/recorderWorker.js'
        if ! Modernizr?.getusermedia
          $log.error 'getusermedia not supported'
          return
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
        @mic?.stop()
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
                
    recorder: Recorder.instance()        
    Player: Player
