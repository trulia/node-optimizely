# node-optimizely


Runs optimizely experiments in node using jsdom

## Install

```
npm install optimizely --save
```

## Usage

```
var optimizely = require('optimizely');
```

1. Attach jQuery code library

```
optimizely.setJquery(jquery);
```

2. Attach Optimizely code library

```
optimizely.setOptimizely(optimizelyCode);
```

3. Process html page

```
// req - http request
// res - http response
// callback – return path out of this middleware

var originalHtml = getFinalHtmlBeforeResponse();

optimizely(req, originalHtml, function(err, modifiedHtml, cookies)
{
  // only pass error if html isn't returned
  if (err && !html)
  {
    return callback(err);
  }

  // pass cookies to the browser
  // by adding them to the response object
  // it's not the way to do it
  // just here to illustate the logic
  res.cookie = cookies;

  // return modified html
  callback(null, html);  
});

```

## TODO

- Tests
- Autoload of optimizely code
