gulp = require 'gulp'
browserify = require 'browserify'
source = require 'vinyl-source-stream'
coffee = require 'gulp-coffee'
gutil = require 'gulp-util'
sass = require 'gulp-sass'
rename = require 'gulp-rename'
minifyCss = require 'gulp-minify-css'

gulp.task 'default', ['coffee']

gulp.task 'sass', (done) ->
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))

gulp.task 'coffee', ->
	browserify(entries: ['./www/js/index.coffee'])
	  	.transform('coffeeify')
	    .transform('debowerify')
	    .bundle()
	    .pipe(source('index.js'))
	    .pipe(gulp.dest('./www/js/'))

gulp.task 'browser', ['test'], ->
	sh.exec "(cd test; cordova build browser)"
  
gulp.task 'android', ['test'], ->
	sh.exec "(cd test; cordova build android)"