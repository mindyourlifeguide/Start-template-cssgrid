var syntax = 'sass'; // Syntax: sass or scss;

var gulp					= require('gulp'),															// подключаем Gulp
		gutil					= require('gulp-util'), 												// логирование, подсветка вывода в консоли и так далее
		sass					= require('gulp-sass'),													// подключаем Sass пакет
		browserSync		= require('browser-sync'),											// автообновление страниц
		concat				= require('gulp-concat'),												// подключаем gulp-concat (для инклюдов файлов)
		uglify				= require('gulp-uglify'),												// подключаем gulp-uglify (для сжатия JS)
		cleancss			= require('gulp-clean-css'),										// минификация cs
		rename				= require('gulp-rename'),												// подключаем библиотеку для переименования файлов
		autoprefixer	= require('gulp-autoprefixer'),									// подключаем библиотеку для автоматического добавления префиксов
		notify				= require('gulp-notify'),												// выводит ошибки при сборке Gulp в виде системных сообщений
		rsync					= require('gulp-rsync'),												// моментальный деплой средних и крупных проектов
		imagemin			= require('gulp-imagemin'),											// подключаем библиотеку для работы с изображениями
		pngquant			= require('imagemin-pngquant'),									// подключаем библиотеку для работы с png
		cache					= require('gulp-cache'),												// подключаем библиотеку кеширования
		sourcemaps		= require('gulp-sourcemaps'),										// способ связать минифицированный/объединённый файл с фа йлами, из которых он получился
		rigger				= require('gulp-rigger'),												// работа с инклюдами в html и js
		plumber				= require('gulp-plumber'),											// предохранитель для остановки гальпа
		rimraf				= require('rimraf'),														// очистка
		gcmq					= require('gulp-group-css-media-queries'),			// группировка медиа запросов
		csscomb				= require('gulp-csscomb');											// красивый CSS


gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: 'dist'
		},
		notify: false,
		open: true,
		// online: false, // Work Offline Without Internet Connection
		// tunnel: true, tunnel: "projectname", // Demonstration page: http://projectname.localtunnel.me
	})
});

// чистим папку билда
gulp.task('clean', function(cb) {
	rimraf('dist/', cb)
});

// билдинг html
gulp.task('html', function() {
	return gulp.src('app/index.html') //Выберем файлы по нужному пути
		.pipe(plumber())
		.pipe(rigger()) //Прогоним через rigger
		.pipe(gulp.dest('dist')) //выгрузим их в папку build
		.pipe(browserSync.stream())
});

// билдинг  css
gulp.task('styles', function() {
	return gulp.src('app/'+syntax+'/**/*.'+syntax+'')//Выберем наш основной файл стилей
		.pipe(sourcemaps.init()) //инициализируем sourcemap
		.pipe(plumber())
		.pipe(sass({ outputStyle: 'expanded' }).on("error", notify.onError())) //Скомпилируем Sass
		.pipe(rename({ suffix: '.min', prefix : '' }))
		.pipe(autoprefixer(['last 15 versions']))
		.pipe(cleancss( {level: { 1: { specialComments: 0 } } })) // Opt., comment out when debugging
		.pipe(csscomb())
		.pipe(gcmq())
		.pipe(sourcemaps.write()) //Пропишем карты
		.pipe(gulp.dest('dist/css'))
		.pipe(browserSync.stream())
});

// билдинг js
gulp.task('js', function() {
	return gulp.src([
			'app/libs/jquery/dist/jquery.min.js',
			'app/js/common.js', // Always at the end
		])
		.pipe(sourcemaps.init()) //Инициализируем sourcemap
		.pipe(plumber())
		.pipe(concat('scripts.min.js'))
		// .pipe(uglify()) // Mifify js (opt.)
		.pipe(sourcemaps.write()) //Пропишем карты
		.pipe(gulp.dest('dist/js'))
		.pipe(browserSync.reload({
			stream: true
		}))
});

// билдим изображения
gulp.task('img', function() {
	return gulp.src('app/img/**/*.*') //Выберем наши картинки
		.pipe(plumber())
		.pipe(cache(imagemin({ //Сожмем их
			progressive: true, //сжатие .jpg
			svgoPlugins: [{
				removeViewBox: false
			}], //сжатие .svg
			use: [pngquant()],
			interlaced: true, //сжатие .gif
			optimizationLevel: 3 //степень сжатия от 0 до 7
		})))
		.pipe(gulp.dest('dist/img')) //выгрузим в dist
		.pipe(browserSync.stream());
});

// билдим шрифты
gulp.task('fonts', function() {
	return gulp.src('app/fonts/**/*.*')
		.pipe(plumber())
		.pipe(gulp.dest('dist/fonts')) //выгружаем в build
		.pipe(browserSync.stream());
});
// билдим библиотеки
gulp.task('libs', function() {
	return gulp.src('app/libs/**/*.*')
		.pipe(plumber())
		.pipe(gulp.dest('dist/libs')) //выгружаем в build
});

gulp.task('rsync', function() {
	return gulp.src('app/**')
		.pipe(rsync({
			root: 'app/',
			hostname: 'username@yousite.com',
			destination: 'yousite/public_html/',
			// include: ['*.htaccess'], // Includes files to deploy
			exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excludes files from deploy
			recursive: true,
			archive: true,
			silent: false,
			compress: true
		}))
});

gulp.task('watch', function() {
	gulp.watch('app/' + syntax + '/**/*.' + syntax + '', ['styles']).on('change', browserSync.reload);
	gulp.watch(['libs/**/*.js', 'app/js/common.js'], ['js']);
	gulp.watch('app/img/*.*', ['img']);
	gulp.watch('app/fonts/*.*', ['fonts']);
	gulp.watch('app/*.html', ['html']);
});


gulp.task('build', ['html', 'styles', 'js', 'fonts','img', 'libs']);

gulp.task('default', ['build', 'watch', 'browser-sync']);