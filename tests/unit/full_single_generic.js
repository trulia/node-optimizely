var test  = require('tap').test
  , fs    = require('fs')
  , path  = require('path')
  , optly = require('../../index.js')

    // get fixtures
  , req = require('../fixture/request/generic.json')
  , optimizelyCode = fs.readFileSync(path.join(__dirname, '../fixture/js/optly_single_test.js'), 'utf-8')
  , originalHtml = fs.readFileSync(path.join(__dirname, '../fixture/html/generic.html'), 'utf-8')
  ;

// test jsdom
test('jsdom', function(t)
{
  var optimizely = optly('jsdom');

  runTests(t, optimizely);
});

// test node_vm
test('node_vm', function(t)
{
  var optimizely = optly('node_vm');

  runTests(t, optimizely);
});

// execute same tests for the different engines
function runTests(t, optimizely)
{
  // prepare env
  optimizely.setOptimizely(optimizelyCode);

  // planning tests
  t.plan(7);

  // check that test line doesn't exists in teh original html
  t.equal(originalHtml.indexOf('Experiment: Text Change'), -1);

  // run the thing
  optimizely(req, originalHtml, function(err, html, extra)
  {
    t.equal(err, null);
    // check updated content
    t.inequal(html.indexOf('Experiment: Text Change'), -1);

    // check extras
    t.inequal(extra.images, null);
    t.equal(extra.images.length, 2);

    t.inequal(extra.cookies, null);
    t.inequal(extra.cookies.getCookieHeader().length, 0);
  });

}
