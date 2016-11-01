gulp = require 'gulp'
browserify = require 'browserify'
source = require 'vinyl-source-stream'
sass = require 'gulp-sass'
cleanCSS = require 'gulp-clean-css'
rename = require 'gulp-rename'
streamify = require 'gulp-streamify'
uglify = require 'gulp-uglify'

gulp.task 'coffee', ->
  browserify entries: ['index.coffee']
    .transform 'coffeeify'
    .transform 'debowerify'
    .bundle()
    .pipe source 'index.js'
    .pipe gulp.dest './'
    .pipe streamify uglify()
    .pipe rename extname: '.min.js'
    .pipe gulp.dest './'

gulp.task 'default', ['coffee'], ->
  browserify entries: ['test/index.coffee']
    .transform 'coffeeify'
    .transform 'debowerify'
    .bundle()
    .pipe source 'index.js'
    .pipe gulp.dest 'test/'
    .pipe streamify uglify()
    .pipe rename extname: '.min.js'
    .pipe gulp.dest 'test/'
