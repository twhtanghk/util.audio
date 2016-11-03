gulp = require 'gulp'
browserify = require 'browserify'
source = require 'vinyl-source-stream'
sass = require 'gulp-sass'
cleanCSS = require 'gulp-clean-css'
rename = require 'gulp-rename'
streamify = require 'gulp-streamify'
uglify = require 'gulp-uglify'
coffee = require 'gulp-coffee'
gutil = require 'gulp-util'
del = require 'del'
modernizr = require 'modernizr'
stream = require 'stream'

class StringStream extends stream.Readable
  constructor: (@str) ->
    super()

  _read: (size) ->
    @push @str
    @push null

gulp.task 'modernizr', ->
  modernizr.build 'feature-detects': ['webrtc/getusermedia'], (test) ->
    new StringStream test
      .pipe source 'detect.js'
      .pipe gulp.dest 'test/'

gulp.task 'coffee', ->
  gulp.src 'index.coffee'
    .pipe coffee bare: true
    .on 'error', gutil.log
    .pipe gulp.dest './'
    .pipe streamify uglify()
    .pipe rename extname: '.min.js'
    .pipe gulp.dest './'

gulp.task 'default', ['coffee', 'modernizr'], ->
  browserify entries: ['test/index.coffee']
    .transform 'coffeeify'
    .transform 'debowerify'
    .bundle()
    .pipe source 'index.js'
    .pipe gulp.dest 'test/'
    .pipe streamify uglify()
    .pipe rename extname: '.min.js'
    .pipe gulp.dest 'test/'

gulp.task 'clean', ->
  del [
    'index.js'
    'index.min.js'
    'test/index.js'
    'test/index.min.js'
    'test/detect.js'
    'node_modules'
    'test/lib'
  ]
