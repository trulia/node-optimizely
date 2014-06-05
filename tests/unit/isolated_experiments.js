var test  = require('tap').test
  , fs    = require('fs')
  , path  = require('path')
  , glob  = require('glob')
  , optly = require('../../index.js')

    // get fixtures
  , req = require('../fixture/request/generic.json')
  , genericHtml = fs.readFileSync(path.join(__dirname, '../fixture/html/simple.html'), 'utf8')

  , experimentsDir = path.join(__dirname, '../experiments')
  , experiments = {}
  , htmls = {}
  ;

// get experiments
glob.sync('*.js', {cwd: experimentsDir}).forEach(function(f)
{
  experiments[path.basename(f, '.js')] = fs.readFileSync(path.join(experimentsDir, f), 'utf8');
});

glob.sync('*.html', {cwd: experimentsDir}).forEach(function(f)
{
  htmls[path.basename(f, '.html')] = fs.readFileSync(path.join(experimentsDir, f), 'utf8');
});

// test jsdom
test('jsdom', function(t)
{
  var optimizely = optly('jsdom');

  runExperiments(t, optimizely);
});

// test node_vm
test('node_vm', function(t)
{
  var optimizely = optly('node_vm');

  runExperiments(t, optimizely);
});

// run tests with different experiments
function runExperiments(t, optimizely)
{
  Object.keys(experiments).forEach(function(name)
  {
    // prepare isolated experiments code
    var code = 'optimizelyCode = function() {\n' + experiments[name] + '\n};\noptimizelyCode();\n';

    // run it as subtest
    t.test('isolated '+name, function(t)
    {
      optimizely.setOptimizely(code);

      runTests(name, t, optimizely);
    });
  });
}

// execute same tests for the different engines
function runTests(name, t, optimizely)
{
  // planning tests
  t.plan(2);

  // run the thing, with custom input html or use generic one
  optimizely(req, (htmls[name+'.input'] || genericHtml), function(err, html)
  {
    t.equal(err, null);

    // check updated content, trailing whitespace doesn't matter
    // check for same name html (as a shortcut) or fallback to .output.html
    t.equal(html.trim(), (htmls[name] || htmls[name+'.output']).trim());
  });

}
