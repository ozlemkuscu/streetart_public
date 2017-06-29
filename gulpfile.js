/*
 A 'starting point' gulpfile for WRP web apps using the core library combined with bower and gulp.
 Get started by updating the PROJECT VARS below, and then using and customizing the various gulp tasks below.
 Note that this file uses es6 syntax.
 http://gulpjs.com/
 */

//require stuff
const gulp = require('gulp');
const awsPublish = require('gulp-awspublish');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const rename = require('gulp-rename');
const useref = require('gulp-useref');
const gulpIf = require('gulp-if');
const uglify = require('gulp-uglify');
const cssnano = require('gulp-cssnano');
const htmlmin = require('gulp-htmlmin');
const cache = require('gulp-cache');
const notify = require('gulp-notify');
const imagemin = require('gulp-imagemin');
const inject = require('gulp-inject');
const eslint = require('gulp-eslint');
const size = require('gulp-size');
const tap = require('gulp-tap');
const zip = require('gulp-zip');
const del = require('del');
const browserSync = require('browser-sync').create();
const env = require('node-env-file');
const runSequence = require('run-sequence');
const pkg = require('./package.json'); //note that this is cached during the watch task
const coreGulpHelper = require('./bower_components/core/gulp_helper');
const proxy = require('proxy-agent');


//PROJECT VARS
//where are the source files and what should the distribution folder be called?
const workingDir = 'src';
const distDir = 'dist';
//these should all be inside of the working (source) directory, and will be placed inside the dist directory:
const fontDir = 'fonts';
const imageDir = 'img';
const scriptDir = 'scripts';
const styleDir = 'styles';
//where is this app deployed? can be overridden locally in your env file
const devDeployPath = 'O:\\work\\decom\\graffiti_exemption_public\\';
const qaDeployPath = 'O:\\work\\decom\\graffiti_exemption_public_qa\\';
//what the aws deploy info?
const awsRegion = 'us-east-1';
const awsBucket = 'wrp-wp-resource-dev-0';
const awsDeployPath = 'resources/webapps/' + pkg.name + '/';

//should we minify stuff during tasks? this is set to true in deploy tasks
let compress = false;
let deployment_environment = 'dev';
try {
  env('./.env'); //load env variables
} catch(err) {
  process.stdout.write('Warning: no .env file found');
}


//a task to process scss project files and autoprefix their CSS classes
gulp.task('_styles', () => {
  return gulp.src(workingDir + '/' + styleDir + '/*.scss')
  // .pipe(plumber()) //TODO: do we need plumber? Maybe if we start seeing gulp errors
  // .pipe(sourcemaps.init()) //TODO: maybe use sourcemaps in the future to debug with source files in the browser
    .pipe(sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', sass.logError))
    .pipe(autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
    // .pipe(sourcemaps.write())
    .pipe(gulp.dest('.tmp/' + styleDir));
});

//a task to transform es2015 syntax in project javascript files into boring old javascript
gulp.task('_scripts', () => {
  return gulp.src(workingDir + '/' + scriptDir + '/**/*.js')
  // .pipe(plumber())
  // .pipe(sourcemaps.init())
    .pipe(babel({presets: ['es2015']})).on("error", notify.onError( function(error) {return error.message;}))
    // .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp/' + scriptDir));
});

//a task to:
// go through all project HTML files,
// grab the css/js files they reference (including those from bower_components or anywhere else on local),
// minify them,
// and place everything in the distribution folder
gulp.task('_html', ['_styles', '_scripts'], () => {
  let options = pkg.coreConfig || {};
  options['environment'] = deployment_environment;
  return coreGulpHelper.inject(gulp, inject, gulp.src(workingDir + '/**/*.html'), options)
    .pipe(useref({newLine: '\n', searchPath: ['.tmp', workingDir, '.']})) //whatever new files are generated here, are now in the stream
    .pipe(gulpIf(compress, gulpIf('*.js', uglify())))
    .pipe(gulpIf(compress, gulpIf('*.css', cssnano({safe: true}))))
    .pipe(gulpIf(compress, gulpIf('*.html', htmlmin({collapseWhitespace: false}))))
    .pipe(gulp.dest(distDir));
});

//a task to grab all project image files, compact them, and place them in the distribution folder
gulp.task('_images', () => {
  return gulp.src([workingDir + '/' + imageDir + '/**/*'])
    .pipe(gulpIf(compress, cache(imagemin())))
    .pipe(gulp.dest(distDir + '/' + imageDir));
});

//a task to grab all project font files and copy them to distribution
gulp.task('_fonts', () => {
  return gulp.src([workingDir + '/' + fontDir + '/**/*'])
    .pipe(gulp.dest(distDir + '/' + fontDir));
});

//a task to copy over any other files in the root of the working directory into the distribution
gulp.task('_extras', () => {
  return gulp.src([
    workingDir + '/*',
    '!' + workingDir + '/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest(distDir));
});

//a task to copy over any files from bower components into distribution that:
// are not pulled in by the useref part of the html task (are not referenced by any project HTML files)
gulp.task('_bower_extras', () => {
  return coreGulpHelper.distExtras(gulp, distDir, pkg.coreConfig || {});
});




//a task to prepare for deployment to an outside environment
gulp.task('_deploy_prep', () => {
  //compress = true;
  return new Promise(resolve => {
    runSequence('clear_image_cache', 'clean', 'build', resolve);
  });
});

gulp.task('_deploy_prep:qa', () => {
  deployment_environment = 'qa';
  return new Promise(resolve => {
    runSequence('_deploy_prep', resolve);
  });
});

/*
 Begin CLI tasks
 */

//a task to lint javascript project files
gulp.task('lint', () => {
  return gulp.src(workingDir + '/' + scriptDir + '/**/*.js')
    .pipe(eslint({fix: true}))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(gulp.dest(workingDir + '/' + scriptDir));
});

//a task to clear the gulp-cache in case images get stuck in there
gulp.task('clear_image_cache', (done) => {
  return cache.clearAll(done);
});

//a task to remove the temp and dist directories
gulp.task('clean', () => {
  del.sync(['.tmp', distDir]);
});

//a task to build the project and create the distribution folder
gulp.task('build', ['_html', '_images', '_fonts', '_extras', '_bower_extras'], () => {
  return gulp.src(distDir + '/**/*').pipe(gulpIf(compress, size({title: 'build', gzip: true})));
});

//a task to watch for file changes and automatically update the contents of the distribution folder
gulp.task('watch', ['clean', 'build'], () => {
  gulp.watch(workingDir + '/' + fontDir + '/*', ['_fonts']);
  gulp.watch(workingDir + '/' + imageDir + '/*', ['_images']);
  gulp.watch([workingDir + '/*', '!' + workingDir + '/*.html'], ['_extras']);
  gulp.watch([workingDir + '/*.html',
    workingDir + '/' + scriptDir + '/**/*.js',
    workingDir + '/' + styleDir + '/**/*.scss'], ['_html']);
});

gulp.task('serve', ['watch'], () => {
  browserSync.init({
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
  //could get fancy here and use the stream method for things like CSS, to avoid reloading the whole page
  gulp.watch(distDir + '/**/*').on('change', browserSync.reload);
});

//a task to deploy to CoT dev servers
gulp.task('deploy:dev', ['_deploy_prep'], () => {
  let path = process.env['DEV_DEPLOY_PATH'] || devDeployPath;
  del.sync(path, {force: true});
  process.stdout.write('Deploying to ' + path);
  return gulp.src([distDir + '/**/*'])
    .pipe(gulp.dest(path));
});

gulp.task('deploy:qa', ['_deploy_prep:qa'], () => {
  let path = process.env['QA_DEPLOY_PATH'] || qaDeployPath;
  let now = new Date();
  let fileName = pkg.name + '_qa_deployment_' + now.getHours() + now.getMinutes() + '_' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + '.zip';
  process.stdout.write('Zip file location: ' + path + fileName);
  gulp.src('dist/**/*')
    .pipe(tap(function(file) {
      if (file.isDirectory()) {
        file.stat.mode = parseInt('40777', 8); //fix directory permissions when running on windows
      }
    }))
    .pipe(zip(fileName))
    .pipe(gulp.dest(path));
});

//a task to deploy the project to AWS S3
function uploadToS3(region, Bucket, path, useProxy) {
  //see https://www.npmjs.com/package/gulp-awspublish

  //note, had to set up a bucket policy in AWS for this to work.
  /*
   {
   "Version": "2012-10-17",
   "Statement": [
   {
   "Effect": "Allow",
   "Principal": {
   "AWS": "arn:aws:iam::944505772603:root"
   },
   "Action": "s3:ListBucket",
   "Resource": "arn:aws:s3:::jtcot.toronto.ca"
   },
   {
   "Effect": "Allow",
   "Principal": {
   "AWS": "arn:aws:iam::944505772603:root"
   },
   "Action": [
   "s3:PutObject",
   "s3:PutObjectAcl",
   "s3:GetObject",
   "s3:GetObjectAcl",
   "s3:DeleteObject",
   "s3:ListMultipartUploadParts",
   "s3:AbortMultipartUpload"
   ],
   "Resource": "arn:aws:s3:::jtcot.toronto.ca/*"
   }
   ]
   }
   */
  // create a new publisher using S3 options
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property
  let httpOptions = !useProxy ? {} :  {agent: proxy(process.env['PROXY'] || 'http://proxy.toronto.ca:8080')};
  let publisher = awsPublish.create({
    region,
    params: {
      Bucket
    },
    httpOptions
  },{});

  // optionally define custom headers (pass to publish method below)
  // var headers = {
  //   'Cache-Control': 'max-age=315360000, no-transform, public'
  //   // ...
  // };

  return gulp.src(distDir + "/**")

    .pipe(rename((p) => {
      p.dirname = path + p.dirname; //rename to the desired s3 path
    }))

    // publisher will add Content-Length, Content-Type and headers specified above
    // If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish())

    //sync to delete files from s3 that are not in the dist folder.
    //dirname is important, otherwise this will delete everything in the bucket except this app
    .pipe(publisher.sync(path,[]))

    // print upload updates to console
    .pipe(awsPublish.reporter({}));
}
gulp.task('deploy:aws', ['_deploy_prep'], () => {
  //AWS credentials are stored in ~/.aws/credentials
  //see http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html
  return uploadToS3(awsRegion, awsBucket, awsDeployPath, process.argv.indexOf('--use-proxy') != -1);
});

//the default task, clean and build the project
gulp.task('default', () => {
  return new Promise(resolve => {
    runSequence('clean','lint', 'build', resolve);
  });
});
