gulp = require 'gulp'
browserify = require 'browserify'
source = require 'vinyl-source-stream'
sass = require 'gulp-sass'
rename = require 'gulp-rename'
minifyCss = require 'gulp-minify-css'
sh = require 'shelljs'

gulp.task 'default', ['test']

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

gulp.task 'test', ['coffee', 'sass'], ->
	platform = 'browser'
	sh.exec "cordova platform add #{platform}"
	sh.exec "ionic resources"
	sh.exec "cordova build #{platform}"