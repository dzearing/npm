var path = require('path')
var mkdirp = require('mkdirp')
var osenv = require('osenv')
var rimraf = require('rimraf')
var cacheFile = require('npm-cache-filename')
var test = require('tap').test
var Tacks = require('tacks')
var File = Tacks.File

var common = require('../common-tap.js')

var PKG_DIR = path.resolve(__dirname, 'search')
var CACHE_DIR = path.resolve(PKG_DIR, 'cache')
var cacheBase = cacheFile(CACHE_DIR)(common.registry + '/-/all')
var cachePath = path.join(cacheBase, '.cache.json')

test('setup', function (t) {
  t.pass('all set up')
  t.done()
})

test('notifies when there are no results', function (t) {
  setup()
  var now = Date.now()
  var cacheContents = {
    '_updated': now,
    bar: { name: 'bar', version: '1.0.0' },
    cool: { name: 'cool', version: '1.0.0' },
    foo: { name: 'foo', version: '2.0.0' },
    other: { name: 'other', version: '1.0.0' }
  }
  var fixture = new Tacks(File(cacheContents))
  fixture.create(cachePath)
  common.npm([
    'search', 'nomatcheswhatsoeverfromthis',
    '--registry', common.registry,
    '--loglevel', 'error',
    '--cache', CACHE_DIR
  ], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.equal(stderr, '', 'no error output')
    t.equal(code, 0, 'search gives 0 error code even if no matches')
    t.match(stdout, /No matches found/, 'Useful message on search failure')
    t.done()
  })
})

test('spits out a useful error when no cache nor network', function (t) {
  setup()
  var cacheContents = {}
  var fixture = new Tacks(File(cacheContents))
  fixture.create(cachePath)
  common.npm([
    'search', 'foo',
    '--registry', common.registry,
    '--loglevel', 'silly',
    '--fetch-retry-mintimeout', 0,
    '--fetch-retry-maxtimeout', 0,
    '--cache', CACHE_DIR
  ], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.equal(code, 1, 'non-zero exit code')
    t.equal(stdout, '', 'no stdout output')
    t.match(stderr, /No search sources available/, 'useful error')
    t.done()
  })
})

test('can switch to JSON mode', function (t) {
  setup()
  var now = Date.now()
  var cacheContents = {
    '_updated': now,
    bar: { name: 'bar', version: '1.0.0' },
    cool: { name: 'cool', version: '1.0.0' },
    foo: { name: 'foo', version: '2.0.0' },
    other: { name: 'other', version: '1.0.0' }
  }
  var fixture = new Tacks(File(cacheContents))
  fixture.create(cachePath)
  common.npm([
    'search', 'oo',
    '--json',
    '--registry', common.registry,
    '--loglevel', 'error',
    '--cache', CACHE_DIR
  ], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.deepEquals(JSON.parse(stdout), [
      { name: 'cool', version: '1.0.0' },
      { name: 'foo', version: '2.0.0' }
    ], 'results returned as valid json')
    t.equal(stderr, '', 'no error output')
    t.equal(code, 0, 'search gives 0 error code even if no matches')
    t.done()
  })
})

test('JSON mode does not notify on empty', function (t) {
  setup()
  var now = Date.now()
  var cacheContents = {
    '_updated': now,
    bar: { name: 'bar', version: '1.0.0' },
    cool: { name: 'cool', version: '1.0.0' },
    foo: { name: 'foo', version: '2.0.0' },
    other: { name: 'other', version: '1.0.0' }
  }
  var fixture = new Tacks(File(cacheContents))
  fixture.create(cachePath)
  common.npm([
    'search', 'nomatcheswhatsoeverfromthis',
    '--json',
    '--registry', common.registry,
    '--loglevel', 'error',
    '--cache', CACHE_DIR
  ], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.deepEquals(JSON.parse(stdout), [], 'no notification about no results')
    t.equal(stderr, '', 'no error output')
    t.equal(code, 0, 'search gives 0 error code even if no matches')
    t.done()
  })
})

test('can switch to tab separated mode', function (t) {
  setup()
  var now = Date.now()
  var cacheContents = {
    '_updated': now,
    bar: { name: 'bar', version: '1.0.0' },
    cool: { name: 'cool', version: '1.0.0' },
    foo: { name: 'foo', version: '2.0.0' },
    other: { name: 'other', version: '1.0.0' }
  }
  var fixture = new Tacks(File(cacheContents))
  fixture.create(cachePath)
  common.npm([
    'search', 'oo',
    '--tab-separated',
    '--registry', common.registry,
    '--loglevel', 'error',
    '--cache', CACHE_DIR
  ], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.equal(stdout, 'cool\t\t\tprehistoric\t\t\nfoo\t\t\tprehistoric\t\t\n', 'no notification about no results')
    t.equal(stderr, '', 'no error output')
    t.equal(code, 0, 'search gives 0 error code even if no matches')
    t.done()
  })
})

test('tab mode does not notify on empty', function (t) {
  setup()
  var now = Date.now()
  var cacheContents = {
    '_updated': now,
    bar: { name: 'bar', version: '1.0.0' },
    cool: { name: 'cool', version: '1.0.0' },
    foo: { name: 'foo', version: '2.0.0' },
    other: { name: 'other', version: '1.0.0' }
  }
  var fixture = new Tacks(File(cacheContents))
  fixture.create(cachePath)
  common.npm([
    'search', 'nomatcheswhatsoeverfromthis',
    '--tab-separated',
    '--registry', common.registry,
    '--loglevel', 'error',
    '--cache', CACHE_DIR
  ], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.equal(stdout, '', 'no notification about no results')
    t.equal(stderr, '', 'no error output')
    t.equal(code, 0, 'search gives 0 error code even if no matches')
    t.done()
  })
})

test('no arguments provided should error', function (t) {
  cleanup()
  common.npm(['search'], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.equal(code, 1, 'search finished unsuccessfully')

    t.match(
        stderr,
        /search must be called with arguments/,
        'should have correct error message'
    )
    t.end()
  })
})

var searches = [
  {
    term: 'cool',
    description: 'non-regex',
    location: 103
  },
  {
    term: '/cool/',
    description: 'regex',
    location: 103
  }
]

searches.forEach(function (search) {
  test(search.description + ' search in color', function (t) {
    setup()
    var now = Date.now()
    var cacheContents = {
      '_updated': now,
      bar: { name: 'bar', version: '1.0.0' },
      cool: { name: 'cool', version: '1.0.0' },
      foo: { name: 'foo', version: '2.0.0' },
      other: { name: 'other', version: '1.0.0' }
    }
    var fixture = new Tacks(File(cacheContents))
    fixture.create(cachePath)
    common.npm([
      'search', search.term,
      '--registry', common.registry,
      '--cache', CACHE_DIR,
      '--loglevel', 'error',
      '--color', 'always'
    ],
    {},
    function (err, code, stdout, stderr) {
      t.equal(stderr, '', 'no error output')
      t.notEqual(stdout, '', 'got output')
      t.equal(code, 0, 'search finished successfully')
      t.ifErr(err, 'search finished successfully')
      // \033 == \u001B
      var markStart = '\u001B\\[[0-9][0-9]m'
      var markEnd = '\u001B\\[0m'

      var re = new RegExp(markStart + '.*?' + markEnd)

      var cnt = stdout.search(re)
      t.equal(
        cnt,
        search.location,
        search.description + ' search for ' + search.term
      )
      t.end()
    })
  })
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})

function setup () {
  cleanup()
  mkdirp.sync(cacheBase)
}

function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(PKG_DIR)
}
