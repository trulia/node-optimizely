/**
 * Abstraction layer for jquery in node implementation – cheerio
 * Adds missing methods and allows better flexibility and maintainability
 */

var cheerio = require('cheerio');

// another hack to fix behavior buried deep down in the modules
var entities = require('cheerio/node_modules/entities');
// don't do escaping of the attribute values and text nodes
// and so far it's the only place where it's used
entities.escape = function(str)
{
  return str;
}
entities.encodeXML = function(str)
{
  return str;
}

// public api
module.exports = jquery;

// returns augmented jquery object
// with provided html as context
function jquery(html)
{
  var _$ = cheerio.load(html, {decodeEntities: false});

  // augment selector search
  function $(selector, context, r, opts)
  {
    var result, match;
    // replace `:eq(#)` with .eq(#)
    if (typeof selector == 'string' && (match = selector.match(/^(.+)(\:eq\((\d+)\))\s*$/)) )
    {
      // update selector with the part without :eq()
      selector = match[1];
      result = _$(selector, context, r, opts).eq(match[3]);
    }
    else
    {
      result = _$(selector, context, r, opts);
    }

    return result;
  };

  // allow all the same properties
  $.prototype = cheerio;
  $.__proto__ = _$.__proto__;
  $._root     = _$._root;

  // don't care about bind/unbind that much
  cheerio.prototype.bind = noop;
  cheerio.prototype.unbind = noop;

  // care about stuff
  $.isFunction = function(it)
  {
    return Object.prototype.toString.call(it) == '[object Function]';
  }
  $.each = jquery_each;
  $.trim = function(s) { return String.prototype.trim.call(s || ''); };

  $.fn = cheerio.prototype;

  // augment selector search
  return $;
}

// --- Helpers

function noop()
{
}

// --- Make it even more like jQuery, copied from the source

var class2type = {};

// Populate the class2type map
jquery_each('Boolean Number String Function Array Date RegExp Object Error'.split(' '), function(i, name) {
  class2type[ '[object ' + name + ']' ] = name.toLowerCase();
});

function jquery_each(obj, callback, args)
{
  var value,
    i = 0,
    length = obj.length,
    isArray = jquery_isArraylike(obj);

  if (args) {
    if (isArray) {
      for (; i < length; i++) {
        value = callback.apply(obj[i], args);

        if (value === false) {
          break;
        }
      }
    } else {
      for (i in obj) {
        value = callback.apply(obj[i], args);

        if (value === false) {
          break;
        }
      }
    }

    // A special, fast, case for the most common use of each
  } else {
    if (isArray) {
      for (; i < length; i++) {
        value = callback.call(obj[i], i, obj[i]);

        if (value === false) {
          break;
        }
      }
    } else {
      for (i in obj) {
        value = callback.call(obj[i], i, obj[i]);

        if (value === false) {
          break;
        }
      }
    }
  }

  return obj;
}

function jquery_isArraylike(obj)
{
  var length = obj.length,
    type = jquery_type(obj);

  if (type === "function") {
    return false;
  }

  if (obj.nodeType === 1 && length) {
    return true;
  }

  return type === "array" || length === 0 || typeof length === "number" && length > 0 && (length - 1) in obj;
}

function jquery_type(obj)
{
  if (obj == null) {
    return obj + "";
  }
  // Support: Android < 4.0, iOS < 6 (functionish RegExp)
  return typeof obj === "object" || typeof obj === "function" ?
    class2type[toString.call(obj)] || "object" :
    typeof obj;
}
