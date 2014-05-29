var test  = require('tap').test
  , fs    = require('fs')
  , path  = require('path')
  , glob  = require('glob')
  , Optly = require('../../index.js')

    // get fixtures
  , req = require('../fixture/request/generic.json')
  , originalHtml = fs.readFileSync(path.join(__dirname, '../fixture/html/simple.html'), 'utf8')

  , experimentsDir = path.join(__dirname, '../experiments')
  , experiments = {}
  , expected = {}
  ;

// get experiments
glob.sync('*.js', {cwd: experimentsDir}).forEach(function(f)
{
  experiments[path.basename(f, '.js')] = fs.readFileSync(path.join(experimentsDir, f), 'utf8');
});

glob.sync('*.html', {cwd: experimentsDir}).forEach(function(f)
{
  expected[path.basename(f, '.html')] = fs.readFileSync(path.join(experimentsDir, f), 'utf8');
});

// test jsdom
test('jsdom', function(t)
{
  var optimizely = Optly('jsdom');

  runExperiments(t, optimizely);
});

// test node_vm
test('node_vm', function(t)
{
  var optimizely = Optly('node_vm');

  runExperiments(t, optimizely);
});

// run tests with different experiments
function runExperiments(t, optimizely)
{
  Object.keys(experiments).forEach(function(name)
  {
    // prepare isolated experiments code
    var code = 'optimizelyCode = function() {\n' + experiments[name] + '\n};\noptimizelyCode();\n';

    optimizely.setOptimizely(code);

    // run it as subtest
    t.test('isolated '+name, function(t)
    {
      runTests(name, t, optimizely);
    });
  });
}

// execute same tests for the different engines
function runTests(name, t, optimizely)
{
  // planning three tests
  t.plan(2);

  // run the thing
  optimizely(req, originalHtml, function(err, html, extra)
  {
    t.equal(err, null);

    // check updated content, whitespace doesn't matter
    t.equal(html.trim(), expected[name].trim());
  });

}
