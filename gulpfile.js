const path = require('path')
const fs = require('fs')
const childProcess = require('child_process')
const argv = require('yargs').argv
const gulp = require('gulp')
const gulpif = require('gulp-if')
const less = require('gulp-less')
const autoprefixer = require('gulp-autoprefixer')
const cleanCss = require('gulp-clean-css')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify');
const rename = require('gulp-rename')
const replace = require('gulp-replace')
const rev = require('gulp-rev')
const revRewrite = require('gulp-rev-rewrite')
const revDelete = require('gulp-rev-delete-original')
const awspublish = require('gulp-awspublish')
const del = require('del')
const config = require('./lib/config')

const lessc = require('less')

const dest = 'public/assets/'
const paths = {
  styles: {
    watch: 'assets/css/**/*',
    src: 'assets/css/**/*.css.less',
    dest: `${dest}css/`
  },
  scripts: {
    solo: {
      src: [
        'assets/js/pages/**/*.js',
        '!assets/js/pages/signup.js'
      ],
      dest: `${dest}js/pages/`
    },
    concat: {
      main: {
        src: [
          'node_modules/jquery/dist/jquery.slim.js',
          'node_modules/stickyfilljs/dist/stickyfill.js',
          'node_modules/autofill-event/src/autofill-event.js',
          'node_modules/tablesort/src/tablesort.js',
          'node_modules/tablesort/src/sorts/tablesort.number.js',
          'node_modules/bootstrap/js/transition.js',
          'node_modules/bootstrap/js/alert.js',
          'node_modules/bootstrap/js/collapse.js',
          'node_modules/bootstrap/js/dropdown.js',
          'node_modules/bootstrap/js/tooltip.js',
          'node_modules/bootstrap/js/tab.js',
          'node_modules/js-cookie/src/js.cookie.js',
          'node_modules/autosize/dist/autosize.js',
          'assets/js/lib/fromNow.js',
          'assets/js/lib/markdownEditor.js',
          'assets/js/lib/cookieNotice.js',
          'assets/js/main.js'
        ],
        name: 'main.js',
        dest: `${dest}js/`
      },
      signup: {
        src: [
          'node_modules/validator/validator.js',
          'assets/js/pages/signup.js'
        ],
        name: 'signup.js',
        dest: `${dest}js/pages/`
      }
    }
  },
  copy: {
    src: [
      'assets/{fonts,img}/**/*',
      '!assets/fonts/*.ttf',
      '!assets/fonts/selection.json'
    ],
    dest: `${dest}`
  },
  deploy: [
    `${dest}**/*`,
    `!${dest}manifest.json`
  ]
}
const isProd = process.env['NODE_ENV'] === 'production' ? true : false

/**
 * Clean
 */
exports.clean = function clean() {
  return del([dest])
}

/**
 * Styles
 */
exports.styles = function styles() {
  return gulp.src(paths.styles.src)
    .pipe(less())
    .pipe(autoprefixer())
    .pipe(gulpif(isProd, cleanCss()))
    .pipe(rename(file => {
      file.basename = file.basename.replace('.css', '')
    }))
    .pipe(gulp.dest(paths.styles.dest))
}

/**
 * Scripts
 */
function script(meta, multi) {
  return gulp.src(meta.src)
    .pipe(gulpif(multi, concat(meta.name || 'a.js')))
    .pipe(replace('%%vanityBlacklist%%', config.blacklist.vanity.join(',')))
    .pipe(gulpif(isProd, uglify()))
    .pipe(gulp.dest(meta.dest))
}

exports.concatScripts = function concatScripts() {
  return Promise.all(Object.keys(paths.scripts.concat).map(key => {
    new Promise(function(resolve, reject) {
      script(paths.scripts.concat[key], true).on('end', resolve)
    })
  }))
}

exports.soloScripts = function soloScripts() {
  return script(paths.scripts.solo)
}

exports.scripts = function scripts() {
  return gulp.parallel(concatScripts, soloScripts)
}

/**
 * Copy
 */
exports.copy = function copy() {
  return gulp.src(paths.copy.src).pipe(gulp.dest(paths.copy.dest))
}

/**
 * Hash
 */
exports.hash = function hash() {
  if(!isProd) return Promise.resolve()

  return gulp.src(`${dest}**/*`)
    .pipe(rev())
    .pipe(revDelete())
    .pipe(revRewrite())
    .pipe(gulp.dest(dest))
    .pipe(rev.manifest('manifest.json'))
    .pipe(gulp.dest(dest))
}

/**
 * Default
 */
exports.default = exports.build = gulp.series(
  exports.clean,
  gulp.parallel(
    exports.styles,
    exports.concatScripts,
    exports.soloScripts,
    exports.copy
  ),
  exports.hash
)

/**
 * Watch / dev
 */
exports.dev = exports.watch = function watch(done) {
  exports.build()
  gulp.watch(paths.scripts.solo.src, exports.soloScripts)
  gulp.watch(paths.styles.watch, exports.styles)
  gulp.watch(paths.copy.src, exports.copy)

  for(file in paths.scripts.concat) {
    gulp.watch(paths.scripts.concat[file].src, exports.concatScripts)
  }

  function quit() {
    done()
    process.exit(0)
  }

  process.on('SIGINT', quit)
  process.on('SIGTERM', quit)
}

/**
 * Revupdate
 */
exports.revupdate = function revupdate(done) {
  let rev = childProcess.execSync('git rev-parse HEAD').toString()
  let pug = 'a.footer-rev(href=\'https://github.com/gamekeller/next/commit/' + rev.replace('\n', '') + '\') rev. ' + rev.substr(0, 10)

  fs.writeFile(path.resolve(process.cwd(), 'views/partials/rev.pug'), pug, done)
}

/**
 * Deploy
 */
exports.deploy = function deploy(done) {
  let credentials = require('./.aws-deploy.json')
  let publisher = awspublish.create(Object.assign({}, credentials, {
    region: 'eu-central-1',
    params: {
      Bucket: 'gamekeller'
    }
  }))

  return gulp.src(paths.deploy)
    .pipe(rename(function(destpath) {
      destpath.dirname = path.join('assets', destpath.dirname)
    }))
    .pipe(publisher.publish({
      'x-amz-acl': 'private'
    }, {
      createOnly: true
    }))
    .pipe(publisher.cache())
    .pipe(awspublish.reporter({
      states: ['create', 'update', 'delete']
    }))
}

/**
 * Database
 */
const mongoose = require('mongoose')
var connected = false
var redis
var User

// TODO: DB tasks don't exit properly after reporting done
function connect(done) {
  if(connected) return done()

  redis = require('./lib/redis')
  require('./lib/mongo').then(function() {
    User = require('./lib/models/User')
    connected = true
    done()
  })
}

exports.addUser = function addUser(done, args) {
  if (!args.email) args = argv
  console.log(args)
  connect(function() {
    let user = new User({
      username: args.name,
      email: args.email,
      password: args.pass,
      admin: (args.admin == true)
    })

    user.save(function(err) {
      if(err) return done(err)

      console.log(`Added user "${user.username}"`)
      done()
    })
  })
}

exports.dropDb = function dropDb(done) {
  connect(function() {
    mongoose.connection.db.dropDatabase(function(err) {
      if(err) return done(err)

      console.log('Successfully dropped Mongo database.')

      redis.$.flushdb()
      redis.$.quit()

      console.log('Successfully dropped Redis database.')

      done()
    })
  })
}

exports.seedDb = function seedDb(done) {
  console.log('Adding users "admin" and "bob" to the database.')

  exports.addUser(function (err) {
    if (err) return done(err)
    exports.addUser(done, {
      name: 'bob',
      email: 'bob@example.com',
      pass: 'password',
      admin: false
    })
  }, {
    name: 'masteruser',
    email: 'master@example.com',
    pass: 'password',
    admin: true
  })

  return true
}

exports.db = gulp.series(exports.dropDb, exports.seedDb)