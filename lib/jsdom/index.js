/**
 * DOM handling and js isolation done via jsdom
 * slow and memory consuming, but somewhat "stable"
 * means great deal of bugs already discovered
 */

var fs = require('fs')
  , path = require('path')
  , jsdom = require('jsdom')
  , Oven = require('oven')
  , jqueryCode = fs.readFileSync(path.join(__dirname, 'jquery.js'), 'utf-8')
  , optimizelyCode
  ;

// public api
module.exports = optimizely;
module.exports.setOptimizely = setOptimizely;
// engine marker
module.exports.engine = 'jsdom';

// apply optimizely tests to the provided html
function optimizely(req, html, callback)
{
  var userAgent = req.headers['user-agent'];

  jsdom.env(
  {
    html: html,
    url: 'http://' + req.headers.host + req.url,
    src: [jqueryCode, optimizelyCode],
    document:
    {
      referrer: req.headers.referer
    },
    done: function optimizely_jsdomDone(err, window)
    {
      var optimizeledHtml
        , docCookie = new Oven({url: req.headers.host })
        , newCookie = new Oven({url: req.headers.host })
        , imagesList = []
        ;

      // something went wrong return unmodified html
      if (err)
      {
        return callback(err, html);
      }

      // preset cookies from the request
      docCookie.setCookies((req.headers.cookie || '').split('; '));

      // hack on jsdom's document.cookie hack
      // to track cookies set during optimizely run
      window.document.__defineSetter__('cookie', function optimizely_cookieSetter(cookie)
      {
        // store full cookie for later use
        docCookie.setCookie(cookie);
        // store new cookies separately
        newCookie.setCookie(cookie);
        return docCookie.getCookieHeader(req.url);
      });
      window.document.__defineGetter__('cookie', function optimizely_cookieGetter()
      {
        return docCookie.getCookieHeader(req.url);
      });

      // "pass" user agent
      window.navigator =
      {
        appVersion: userAgent.replace(/^Mozilla\//i, ''),
        userAgent: userAgent,
        // It's either Chrome or Safari disguise under Safari's user agent
        // Firefox has empty string for `vendor`, do we support IE yet?
        vendor: (userAgent.match(/Chrome\//) ? 'Google Inc.' : (userAgent.match(/Safari\//) ? 'Apple Computer, Inc.' : ''))
      };

      // massage environment
      window.$ = window.jQuery;

      // fake Image object
      window.Image = function(){};

      // handle src setters
      Object.defineProperty(window.Image.prototype, 'src',
      {
        enumerable: true,
        get: function()
        {
          return this._src || '';
        },
        set: function(value)
        {
          // store src to the common list for later handling
          imagesList.push(value);
          this._src = value;
        }
      });

      // try to run optimizely in a safe way
      try
      {
        // init optimizely code
        window.optimizelyCode();

        // activate tests
        window.optimizely = window.optimizely || [];
        window.optimizely.push(['activate']);
      }
      catch (e)
      {
        // go back to the original html
        return callback(e, html);
      }

      // get modified html
      optimizeledHtml = window.document.documentElement.innerHTML;

      // free memory
      window.close();

      // export DOM into html page
      optimizeledHtml = '<!doctype html>\n<html>' + optimizeledHtml + '</html>';

      // return modified html
      callback(null, optimizeledHtml, {images: imagesList, cookies: newCookie});
    }
  });
}

// Sets optimizely code
function setOptimizely(code)
{
  code = (code || '').replace(/\boptimizelyCode\(\);?/, '');
  // 2. Make it proper function calls, so fake objects of jsdom won't fail
  code = code.replace(/(new\s+[\w]+)\b([^\(]|$)/ig, '$1()$2');
  // save
  optimizelyCode = code;
}
