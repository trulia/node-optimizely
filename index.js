/**
 * Run optimizely experiments on the server side
 */

var jsdom = require('jsdom')
  , optimizelyCode
  , jqueryCode
  ;

// export definition
module.exports = optimizely;

// support functions
module.exports.setJquery = setJquery;
module.exports.setOptimizely = setOptimizely;

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
      referrer: req.headers.referer,
      cookie: (req.headers.cookie || '').split('; '),
      cookieDomain: req.headers.host
    },
    done: function optimizely_jsdomDone(err, window)
    {
      var optimizeledHtml
        , imagesList = []
        , cookieList = []
        ;

      // something went wrong return unmodified html
      if (err)
      {
        return callback(err, html);
      }

      // hack on jsdom's document.cookie hack
      // to track cookies set during optimizely run
      // like regular method wrapper but with setter
      // getter gets killed when setter is updated
      // for "wrap" setter along the way
      window.document.__defineSetter__('_optimizely_cookie', window.document.__lookupSetter__('cookie'));
      window.document.__defineGetter__('_optimizely_cookie', window.document.__lookupGetter__('cookie'));

      window.document.__defineSetter__('cookie', function optimizely_cookieSetter(cookie)
      {
        // store full cookie for later use
        cookieList.push(cookie);
        return this._optimizely_cookie = cookie;
      });
      window.document.__defineGetter__('cookie', function optimizely_cookieGetter()
      {
        // fix jsdom's bug of the first cookie
        return this._optimizely_cookie.replace(/^; /, '');
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

      // clean up after ourselves
      window.close();

      // append images to allow optimizely tracking
      imagesList.forEach(function(src)
      {
        var imgTag = '<img src="'+src+'">';
        optimizeledHtml = optimizeledHtml.replace(/(<\/body>\s*)$/, imgTag + '$1');
      });

      // export DOM into html page
      optimizeledHtml = '<!doctype html><html lang="en">' + optimizeledHtml + '</html>';

      // return modified html
      callback(null, optimizeledHtml, cookieList);
    }
  });
}

// Sets optimizely code
function setOptimizely(code)
{
  optimizelyCode = code;
}

// Sets jquery code
function setJquery(code)
{
  jqueryCode = code;
}
