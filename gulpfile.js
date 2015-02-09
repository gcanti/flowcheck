'use strict';

var gulp = require('gulp');
var header = require('gulp-header');
var jshint = require('gulp-jshint');
var react = require('gulp-react');
var beautify = require('gulp-beautify');
var stylish = require('jshint-stylish');
var pkg = require('./package.json');

var banner = [
  '//     <%= pkg.name %> <%= pkg.version %>',
  '//     <%= pkg.homepage %>',
  '//     (c) 2015 <%= pkg.author %>',
  '//     <%= pkg.name %> may be freely distributed under the MIT license.',
  '//     (checked with Flow and transpiled with jsx)',
  ''
].join('\n');

var src = './src/**/*.js*';

gulp.task('transpile', function() {
  return gulp.src(src)
    .pipe(react({
      harmony: true,
      stripTypes: true
    }))
    .pipe(header(banner, {pkg: pkg}))
    .pipe(beautify({
      indentSize: 2,
      preserveNewlines: false
    }))
    .pipe(gulp.dest('.'));
});

gulp.task('lint', ['transpile'], function() {
  return gulp.src(['./assert.js', './transform.js', './visitors.js', './test/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

gulp.task('default', ['lint']);
