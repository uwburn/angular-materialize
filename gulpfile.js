/* File: gulpfile.js */

// grab our gulp packages
var gulp  = require('gulp'),
    clean = require('gulp-clean'),
    debug = require('gulp-debug'),
    uglify = require('gulp-uglify'),
    cleanCSS = require('gulp-clean-css'),
    gulpif = require('gulp-if'),
    jshint = require('gulp-jshint');

var path = {
    root: "./",
    src: {
        root: "./src",
    },
    dist: {
        root: "./dist",
    }
};

gulp.task('src:app:jshint', function() {
    return gulp.src([
        path.src.root + '/**/*.js'
    ]).pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('src:app', gulp.series('src:app:jshint'));

gulp.task('src', gulp.series('src:app'));

gulp.task('dist:clean', function() {
    return gulp.src(path.dist.root + '/*', {
        read: false
    }).pipe(clean());
});

gulp.task('dist:app:copy', function() {
    return gulp.src([
        path.src.root + '/**/*',
        '!' + path.src.root + '/**/*.js',
        '!' + path.src.root + '/**/*.css'
    ]).pipe(gulp.dest(path.dist.root));
});

gulp.task('dist:app:uglify', function() {
    return gulp.src(path.src.root + '/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(path.dist.root));
});

gulp.task('dist:app:clean', function() {
    return gulp.src(path.src.root + '/*.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest(path.dist.root));
});

gulp.task('dist:app', gulp.series('dist:app:copy', 'dist:app:uglify', 'dist:app:clean'));

gulp.task('dist', gulp.series('dist:clean', 'dist:app'));

gulp.task('default', gulp.series('src', 'dist'));
