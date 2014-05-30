var test  = require('tap').test
  , fs    = require('fs')
  , path  = require('path')
  , glob  = require('glob')
  , Optly = require('../../index.js')

    // get fixtures
  , req = require('../fixture/request/generic.json')
  , optimizelyCode = fs.readFileSync(path.join(__dirname, '../fixture/js/optly_no_tests.js'), 'utf8')

  , htmlDir = path.join(__dirname, '../fixture/html')
  , htmls = {}
  ;

glob.sync('*.html', {cwd: htmlDir}).forEach(function(f)
{
  htmls[path.basename(f, '.html')] = fs.readFileSync(path.join(htmlDir, f), 'utf8');
});

// test jsdom
// test('jsdom', function(t)
// {
//   var optimizely = Optly('jsdom');
//
//   runExperiments(t, optimizely);
// });

// test node_vm
test('node_vm', function(t)
{
  var optimizely = Optly('node_vm');

  runExperiments(t, optimizely);
});

// run tests with different experiments
function runExperiments(t, optimizely)
{
  Object.keys(htmls).forEach(function(name)
  {
    // run it as subtest
    t.test('preserve html: '+name, function(t)
    {
      runTests(name, t, optimizely);
    });
  });
}

// execute same tests for the different engines
function runTests(name, t, optimizely)
{
  // prepare env
  optimizely.setOptimizely(optimizelyCode);

  // planning tests
  t.plan(6);

  // run the thing
  optimizely(req, htmls[name], function(err, result, extra)
  {
    t.equal(err, null, 'optimizely should return no error');
    // should be same as original, but ignore whitespace
    t.equal(result.trim(), htmls[name].trim(), 'original and result html should be the same');

    // check extras
    t.inequal(extra.images, null, 'images should be present');
    t.equal(extra.images.length, 3, 'expecting 3 images'); // 2 regular and 1 snippet_installed trigger

    t.inequal(extra.cookies, null, 'cookies should be present');
    t.equal(extra.cookies.getCookies().length, 4, 'expecting 4 cookies');
  });

}
