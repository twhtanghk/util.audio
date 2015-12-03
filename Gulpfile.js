var browserify, coffee, gulp, gutil, minifyCss, rename, sass, source;

gulp = require('gulp');

browserify = require('browserify');

source = require('vinyl-source-stream');

coffee = require('gulp-coffee');

gutil = require('gulp-util');

sass = require('gulp-sass');

minifyCss = require('gulp-minify-css');

rename = require('gulp-rename');

gulp.task('default', ['test']);

gulp.task('sass', function(done) {
  gulp.src('./*.scss').pipe(sass()).pipe(gulp.dest('./'));
  return gulp.src('./test/*.scss').pipe(sass()).pipe(gulp.dest('./test/'));
});

gulp.task('coffee', function() {
  return gulp.src('./*.coffee').pipe(coffee({
    bare: true
  }).on('error', gutil.log)).pipe(gulp.dest('./'));
});

gulp.task('test', ['coffee', 'sass'], function() {
  return browserify({
    entries: ['./test/index.coffee']
  }).transform('coffeeify').transform('debowerify').bundle().pipe(source('index.js')).pipe(gulp.dest('./test/'));
});
