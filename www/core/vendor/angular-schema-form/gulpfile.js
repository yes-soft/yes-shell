var gulp = require('gulp'),
    path = require('path'),
    fs = require("fs"),
    del = require('del'),
    inject = require('gulp-inject'),
    annotate = require('gulp-ng-annotate'),
    markdown = require('gulp-markdown'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    replace = require('gulp-replace'),
    templateCache = require('gulp-angular-templatecache'),
    uglify = require('gulp-uglify');


var dist = "./dist/";
var distBase = dist + "core/";
var scripts = "scripts";

var coreVersion = "3.2.0";

/**
 *
 * 打包生成目录要求
 *
 * core
 *    css
 *    scripts
 *    themes
 *    vendor
 *
 * **/


gulp.task('clean', function (cb) {
    return del([
        dist
    ], cb);
});

gulp.task('schema-form-bundle', function () {
    return gulp.src(
        [
            "object-path.js",
            "tv4.js",
            "schema-form.js",
            "bootstrap-decorator.js"
        ])
        .pipe(concat('schema.js'))
        .pipe(gulp.dest(distBase + scripts))
        .pipe(uglify())
        .pipe(rename({extname: '.min.js'}))
        .pipe(gulp.dest(distBase + scripts));
});


