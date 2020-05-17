var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');

// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function () {
	return gulp.src("./styles/*.scss")
		.pipe(sass())
		.on('error', function (err) {
			console.error('Error!', err.message);
		})
		.pipe(gulp.dest("./styles"))
		.pipe(browserSync.stream());
});
gulp.task('sass-temp', function () {
	return gulp.src("./temp/asr_presentation/css/impress-demo.scss")
		.pipe(sass())
		.on('error', function (err) {
			console.error('Error!', err.message);
		})
		.pipe(gulp.dest("./temp/asr_presentation/css"))
		.pipe(browserSync.stream());
});

// Static Server + watching scss/html files
gulp.task('serve', gulp.series('sass', function () {

	browserSync.init({
		server: "./"
	});

	gulp.watch("./styles/*.scss", gulp.series('sass'));
	gulp.watch("./temp/asr_presentation/css/impress-demo.scss", gulp.series('sass-temp'));
	gulp.watch("*.html").on('change', browserSync.reload);
	gulp.watch("./pages/**/**/*.html").on('change', browserSync.reload);
	gulp.watch("./scripts/**/*.js").on('change', browserSync.reload);
}));

gulp.task('default', gulp.series('serve'));
