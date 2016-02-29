gulp = require 'gulp'
browserify = require 'browserify'
source = require 'vinyl-source-stream'
coffee = require 'gulp-coffee'
gutil = require 'gulp-util'
sass = require 'gulp-sass'
rename = require 'gulp-rename'

gulp.task 'default', ['coffee']

gulp.task 'coffee', ->
	browserify(entries: ['./index.coffee'])
	  	.transform('coffeeify')
	    .bundle()
	    .pipe(source('index.js'))
	    .pipe(gulp.dest('./'))