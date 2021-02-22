// Load plugins
var gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    minifycss = require('gulp-minify-css'),
    notify = require('gulp-notify'),
    rename = require('gulp-rename'),
    sass = require('gulp-sass');

const notifier = require('node-notifier');

/*

// String
notifier.notify('Message');

// Object
notifier.notify({
  title: 'My notification',
  message: 'Hello, there!'
});
*/

// Styles
gulp.task('styles', function() {
  return gulp.src('scss/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({ style: 'expanded', }))
    .pipe(sourcemaps.write('.'))
    //.pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest('public/css'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    //.pipe(livereload(server))
    .pipe(gulp.dest('public/css'))
    .pipe(notify({message:"Hello"}));
});


gulp.task('watch', function(){
  gulp.watch('scss/*.scss', gulp.series(['styles'])); 
})