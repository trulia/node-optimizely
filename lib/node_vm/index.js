/**
 * DOM handling done via cheerio (abstracted via custom jquery layer)
 * js isolation done via node native vm module (singleton reuse)
 * fast and low memory footprint, but somewhat "unstable"
 * means bleeding edge and all the bugs still await.
 */

var vm = require('vm')
  , Oven = require('oven')
  , jquery = require('./jquery')
  , optimizelyCode
  , jqueryCode
  , theContext
  ;

// public api
module.exports = optimizely;
module.exports.setOptimizely = setOptimizely;
// engine marker
module.exports.engine = 'node_vm';

// apply optimizely tests to the provided html
function optimizely(req, html, callback)
{
  // create "jquery"
  var $ = jquery(html)
    , context = getContext(req, $)
    , result
    ;

  vm.runInContext(optimizelyCode, context, 'optimizely.vm');

  result = $.html();

  callback(null, result, {
    images: context.__node_optimizely_imagesList || null,
    cookies: context.__node_optimizely_newCookie || null
  });
}

// Sets optimizely code
function setOptimizely(code)
{
  // Make it proper function calls, so fake objects of jsdom won't fail
  code = code.replace(/(new\s+[\w]+)\b([^\(]|$)/ig, '$1()$2');
  // save
  optimizelyCode = code;
}

// Context "singleton"
function getContext(req, $)
{
  var userAgent = req.headers['user-agent']
      // oven doesn't like custom port
    , docCookie = new Oven({url: req.headers.host })
    , newCookie = new Oven({url: req.headers.host })
    , sandbox
    , document
    , location
    , navigator
    , window
      // fake DOM objects
    , Image = function(){}
    , imagesList = []
    ;

  // preset cookies from the request
  docCookie.setCookies((req.headers.cookie || '').split('; '));

  // store Image.src for later handling
  Object.defineProperty(Image.prototype, 'src',
  {
    enumerable: true,
    get: function()
    {
      return this._src || '';
    },
    set: function(value)
    {
      imagesList.push(value);
      this._src = value;
    }
  });

  navigator =
  {
    appVersion: userAgent.replace(/^Mozilla\//i, ''),
    userAgent: userAgent,
    // It's either Chrome or Safari disguise under Safari's user agent
    // Firefox has empty string for `vendor`, do we support IE yet?
    vendor: (userAgent.match(/Chrome\//) ? 'Google Inc.' : (userAgent.match(/Safari\//) ? 'Apple Computer, Inc.' : ''))
  };

  location =
  {
    hostname: req.headers.host,
    href: 'http://' + req.headers.host + req.url,
    protocol: 'http:',
    hash: '',
    search: ''
  };

  document =
  {
    cookie: req.headers.cookie,
    location: location
  };

  window =
  {
    document: document,
    location: location,
    navigator: navigator
  };

  document.__defineSetter__('cookie', function optimizely_cookieSetter(cookie)
  {
    // store full cookie for later use
    docCookie.setCookie(cookie);
    // store new cookies separately
    newCookie.setCookie(cookie);
    return docCookie.getCookieHeader(req.url);
  });
  document.__defineGetter__('cookie', function optimizely_cookieGetter()
  {
    return docCookie.getCookieHeader(req.url);
  });

  if (theContext)
  {
    // update current context
    theContext.navigator = navigator;
    theContext.document = document;
    theContext.window = window;
    theContext.$ = $;
    theContext.jQuery = $;
    // pass working objects via context
    theContext.__node_optimizely_imagesList = imagesList;
    theContext.__node_optimizely_newCookie = newCookie;
  }
  else
  {
    sandbox =
    {
      window: window,
      document: document,
      navigator: navigator,
      $: $,
      jQuery: $,
      Image: Image,
      XMLHttpRequest: noop,
      setTimeout: noop,
      console: console,
      // pass working objects via context
      __node_optimizely_imagesList: imagesList,
      __node_optimizely_newCookie: newCookie
    };

    theContext = vm.createContext(sandbox);
  }

  return theContext;
}

// shortcut
function noop()
{
}
