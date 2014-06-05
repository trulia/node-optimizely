/**
 * Abstraction layer for jquery in node implementation – cheerio
 * Adds missing methods and allows better flexibility and maintainability
 */

// workaround for :eq(x) in cheerio->CSSselect
var pseudos = require('cheerio/node_modules/CSSselect/lib/pseudos');
pseudos.filters['unique'] = function pseudos_filters_unique(next, token)
{
  // make sure token is string if exists
  token = token ? ''+token : null;
  return function unique(elem)
  {
    // make sure marker is string
    var _unique = ''+elem._unique;
    return next(elem) && _unique === token;
  };
}

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
    var i, result, parts, selector, unique;

    if (typeof selector == 'string' && selector.indexOf(':eq(') > -1)
    {
      parts = selector.split(/\:eq\((\d+)\)/);

      // initiate chin with the first element
      result = _$(parts[0], context, r, opts);

      for (i=1; i<parts.length; i++)
      {

        // skip empty strings
        if (parts[i].length == 0)
        {
          continue;
        }
        // perform :eq(0) as separate function call
        else if (!isNaN(+parts[i]))
        {
          result = result.eq(parts[i]);
        }
        else
        {
          // add unqiue marker to the top element of each search
          // to make sure proper selector chain execution
          // it's a temporary solution, until proper fix will be landed into CSSselect
          // only works for single "root" element which is supposed to be the case
          // don't do anything if there is more than one root element
          if (result.length == 1)
          {
            unique = ''+Math.floor(Math.random()*1e9);
            selector = ':unique('+unique+') '+parts[i];
            result[0]._unique = unique;
          }
          else
          {
            selector = parts[i];
          }
          result = result.find(selector);
        }

      }
    }
    else
    {
      result = _$(selector, context, r, opts);
    }

    return result;
  };

  // allow all the same properties
  $.prototype = cheerio.prototype;
  $.__proto__ = _$.__proto__;
  $._root     = _$._root;
  $._options  = _$._options;

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
