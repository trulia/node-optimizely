var test  = require('tap').test
  , fs    = require('fs')
  , path  = require('path')
  , Optly = require('../../index.js')

    // get fixtures
  , req = require('../fixture/request/generic.json')
  , optimizelyCode = fs.readFileSync(path.join(__dirname, '../fixture/js/optly_no_tests.js'), 'utf8')
  , originalHtml = fs.readFileSync(path.join(__dirname, '../fixture/html/generic.html'), 'utf8')
  , simpleHtml = fs.readFileSync(path.join(__dirname, '../fixture/html/simple.html'), 'utf8')
  ;

// test jsdom
test('jsdom', function(t)
{
  var optimizely = Optly('jsdom');

  // test simple html
  t.test('simple html', function(t)
  {
    runTests(t, optimizely, simpleHtml);
  });

  // test real world html
  t.test('real world html', function(t)
  {
    runTests(t, optimizely, originalHtml);
  });
});

// test node_vm
test('node_vm', function(t)
{
  var optimizely = Optly('node_vm');

  // test simple html
  t.test('simple html', function(t)
  {
    runTests(t, optimizely, simpleHtml);
  });

  // test real world html
  t.test('real world html', function(t)
  {
    runTests(t, optimizely, originalHtml);
  });
});

// execute same tests for the different engines
function runTests(t, optimizely, html, cb)
{
  // prepare env
  optimizely.setOptimizely(optimizelyCode);

  // planning tests
  t.plan(6);

  // run the thing
  optimizely(req, html, function(err, result, extra)
  {
    t.equal(err, null, 'optimizely should return no error');
    // should be same as original, but ignore whitespace
    t.equal(result.trim(), html.trim(), 'original and result html should be the same');

    // check extras
    t.inequal(extra.images, null, 'images should be present');
    t.equal(extra.images.length, 3, 'expecting 3 images'); // 2 regular and 1 snippet_installed trigger

    t.inequal(extra.cookies, null, 'cookies should be present');
    t.equal(extra.cookies.getCookies().length, 4, 'expecting 4 cookies');
  });

}
