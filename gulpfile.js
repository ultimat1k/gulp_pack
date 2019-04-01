const gulp = require('gulp');
var pug = require('gulp-pug');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cssmin = require('gulp-cssmin');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const minify = require('gulp-minify');
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
const fs = require('fs');
const wiredep = require('gulp-wiredep');
var mainBowerFiles = require('main-bower-files');
var uglify = require('gulp-uglify');
var useref = require('gulp-useref');
var gulpif = require('gulp-if');
var clean = require('gulp-clean');


//clean
gulp.task('clean', function () {
    return gulp.src('prod/')
        .pipe(clean({read: false}))
});

//пути
const cssAddonsPath = './app/scss/modules/';
var reload = browserSync.reload;

var path = {

  build : {
    html : 'prod/',
    css : 'app/css/',
    js : 'app/js/'
  },

  src : {
    html : 'app/*.html',
    js : 'app/js/common/*.js',
    css : 'app/css/*.css',
    bower : 'app/*.html'
  },

  js : {
    entry : 'app/js/main.js'
  },

  jade : {
    src : 'app/markups/pages/*.pug',
    dist : './app/'
  },

  scss : {
    src : 'app/scss/**/*.scss',
    dist : 'app/css/',
    entry : 'app/scss/main.scss'
  },

  watch : {
    html : 'app/*.html',
    jade : 'app/markups/pages/*.jade',
    js : 'app/js/**/*.js',
    css : 'app/css/*.css',
    scss : 'app/scss/**/*'
  },

}  
//BOWER
gulp.task('bower', function () {
  gulp.src(path.src.bower)
    .pipe(wiredep({
      directory: './app/bower/', 
      bowerJson: require('./bower.json'), 
      ignorePath: './app'
    }))
    .pipe(gulp.dest('./app'))
});
// Шаблонизатор PUG - Jade
gulp.task('pug', function() {
  var YOUR_LOCALS = {};
 
    gulp.src(path.jade.src)
    .pipe(pug({
      locals: YOUR_LOCALS,
      pretty : '\t',
    }))
    .pipe(gulp.dest(path.jade.dist));
});
// Сборка страниц html
gulp.task('html-build', function () {

  gulp.src(path.src.html)
  .pipe(gulp.dest(path.build.html))

})
// Сборка main JS
gulp.task('js-build', function() {

  gulp.src(path.src.js)
    .pipe(concat('main.js'))
    .pipe(gulp.dest(path.build.js));

    // gulp.start('js-lite-build');
    // gulp.start('js-minify');

});
// Сборщик стилей
gulp.task('css-build', function() {
  gulp.src(path.scss.entry)
    .pipe(sass({outputStyle: 'nested'}).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 10 versions'],
      cascade: false
    }))
    .pipe(concat('main.css'))
    // .pipe(gulp.dest('./app/css/'))
    // .pipe(gulpif('*.css', cssmin()))
    .pipe(gulp.dest(path.scss.dist))

    // gulp.start('css-compile-modules');
});
// Сборка проекта на продакшен
gulp.task('useref', function () {

     return gulp.src(path.src.html)
        .pipe(useref())
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', cssmin()))

        .pipe(gulp.dest('prod'))
        // gulp.start('img')
});
//работа с пакетами bower
gulp.task('mainfiles', function() {
    return gulp.src(mainBowerFiles())
        .pipe(gulp.dest('prod/mainfiles'))
});
// Cборщик изображений
gulp.task('img-build', function() {
  gulp.src('./app/img/*')
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 5}),
      imagemin.svgo({
        plugins: [
          {removeViewBox: true},
          {cleanupIDs: false}
        ]
      })
    ]))
    .pipe(gulp.dest('./prod/img'));
});

// Cборка модулей CSS
gulp.task('css-compile-modules', function() {
  gulp.src('app/scss/**/modules/**/*.scss')
    .pipe(sass({outputStyle: 'nested'}).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 10 versions'],
      cascade: false
    }))
    .pipe(rename({ dirname: cssAddonsPath }))
    .pipe(gulp.dest('./prod/'));
});


gulp.task('css-minify', function() {
    gulp.src(['./app/css/*.css', '!./prod/css/*.min.css', '!./app/css/main.css'])
      .pipe(cssmin())
      .pipe(rename({suffix: '.min'}))
      .pipe(gulp.dest('./app/css'));

    gulp.start('css-minify-modules');
});

gulp.task('css-minify-modules', function() {
  gulp.src(['./app/css/modules/*.css', '!./app/css/modules/*.min.css'])
    .pipe(cssmin())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./app/css/modules'));
});
// Сборка на продакшен

gulp.task('build',['css-build','js-build','useref',]);

// Локальный сервер
gulp.task('live-server', function() {
  browserSync.init({
    server: {
      baseDir: "./app/",
      directory: true
    },
    notify: false
  });

  gulp.watch("**/*", {cwd: './app/'}, reload);
});

//Cлежка за изменениями в проекте
gulp.task('default', function() {
  gulp.start('live-server');
  // gulp.start('useref');
  gulp.watch(path.jade.src, ['pug']); //jade
  gulp.watch(path.src.html, ['bower']); //bower-wiredep
  gulp.watch(path.watch.scss, ['css-build']);
  gulp.watch(path.watch.js);
  // gulp.watch(["app/css/*.css", "!prod/css/*.min.css"], ['css-minify']);
  // gulp.watch(["prod/js/*.js", "!prod/js/*.min.js"], ['js-minify']);
  gulp.watch("**/*", {cwd: 'app/img/'}, ['img-compression']);
});

function getJSModules() {
  delete require.cache[require.resolve('./prod/js/modules.js')];
  return require('./prod/js/');
}