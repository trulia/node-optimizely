# Optimizely [![Build Status](https://travis-ci.org/trulia/node-optimizely.svg?branch=master)](https://travis-ci.org/alexindigo/node-optimizely)

Runs optimizely experiments in node using either jsdom (slow & stable) or cheerio+node-vm (young blood)

## Install

```
npm install optimizely --save
```

## Usage

1. Load processing environment

```
// jsdom
var optimizely = require('optimizely')('jsdom');

// node vm
var optimizely = require('optimizely')('node_vm');

```

2. Attach Optimizely code library

```
optimizely.setOptimizely(optimizelyCode);
```

3. Process html page

```
// req - http request
// callback – return path out of this middleware

var originalHtml = getFinalHtmlBeforeResponse();

optimizely(req, originalHtml, function(err, modifiedHtml, extras)
{
  // only pass error if html isn't returned
  if (err && !html)
  {
    return callback(err);
  }

  // extras.images – array of image-src;
  // extras.cookies – cookie object;

  // return modified html
  callback(null, html);  
});

```

## Notes

### jQuery

In [jsdom](https://www.npmjs.org/package/jsdom) processor trimmed version of jQuery is used, which is provided by optimizely itself and bundled with the module.
In turn [node_vm](http://nodejs.org/api/vm.html) processor is relying on augmented [cheerio](https://www.npmjs.org/package/cheerio) module.

### Cookies

Module [oven](https://www.npmjs.org/package/oven) is used for cookie handling and it's cookie jar instance is returned in callback.
Method `extras.cookies.getCookieHeader()` could be used to get cookie header formated string
and `extras.cookies.getCookies()` to get list of cookie objects.

### Images

Along with creating new cookies, optimizely adds images to track performed experiments, to make it slim and less opinionated,
list of images passed to callback (`extras.images`) instead of modifying html in place.

## TODO

- More tests
- Autoload of optimizely code
