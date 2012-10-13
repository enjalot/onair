/*! Socket.IO.js build:0.9.10, development. Copyright(c) 2011 LearnBoost <dev@learnboost.com> MIT Licensed */

var io = ('undefined' === typeof module ? {} : module.exports);
(function() {

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * IO namespace.
   *
   * @namespace
   */

  var io = exports;

  /**
   * Socket.IO version
   *
   * @api public
   */

  io.version = '0.9.10';

  /**
   * Protocol implemented.
   *
   * @api public
   */

  io.protocol = 1;

  /**
   * Available transports, these will be populated with the available transports
   *
   * @api public
   */

  io.transports = [];

  /**
   * Keep track of jsonp callbacks.
   *
   * @api private
   */

  io.j = [];

  /**
   * Keep track of our io.Sockets
   *
   * @api private
   */
  io.sockets = {};


  /**
   * Manages connections to hosts.
   *
   * @param {String} uri
   * @Param {Boolean} force creation of new socket (defaults to false)
   * @api public
   */

  io.connect = function (host, details) {
    var uri = io.util.parseUri(host)
      , uuri
      , socket;

    if (global && global.location) {
      uri.protocol = uri.protocol || global.location.protocol.slice(0, -1);
      uri.host = uri.host || (global.document
        ? global.document.domain : global.location.hostname);
      uri.port = uri.port || global.location.port;
    }

    uuri = io.util.uniqueUri(uri);

    var options = {
        host: uri.host
      , secure: 'https' == uri.protocol
      , port: uri.port || ('https' == uri.protocol ? 443 : 80)
      , query: uri.query || ''
    };

    io.util.merge(options, details);

    if (options['force new connection'] || !io.sockets[uuri]) {
      socket = new io.Socket(options);
    }

    if (!options['force new connection'] && socket) {
      io.sockets[uuri] = socket;
    }

    socket = socket || io.sockets[uuri];

    // if path is different from '' or /
    return socket.of(uri.path.length > 1 ? uri.path : '');
  };

})('object' === typeof module ? module.exports : (this.io = {}), this);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * Utilities namespace.
   *
   * @namespace
   */

  var util = exports.util = {};

  /**
   * Parses an URI
   *
   * @author Steven Levithan <stevenlevithan.com> (MIT license)
   * @api public
   */

  var re = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

  var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password',
               'host', 'port', 'relative', 'path', 'directory', 'file', 'query',
               'anchor'];

  util.parseUri = function (str) {
    var m = re.exec(str || '')
      , uri = {}
      , i = 14;

    while (i--) {
      uri[parts[i]] = m[i] || '';
    }

    return uri;
  };

  /**
   * Produces a unique url that identifies a Socket.IO connection.
   *
   * @param {Object} uri
   * @api public
   */

  util.uniqueUri = function (uri) {
    var protocol = uri.protocol
      , host = uri.host
      , port = uri.port;

    if ('document' in global) {
      host = host || document.domain;
      port = port || (protocol == 'https'
        && document.location.protocol !== 'https:' ? 443 : document.location.port);
    } else {
      host = host || 'localhost';

      if (!port && protocol == 'https') {
        port = 443;
      }
    }

    return (protocol || 'http') + '://' + host + ':' + (port || 80);
  };

  /**
   * Mergest 2 query strings in to once unique query string
   *
   * @param {String} base
   * @param {String} addition
   * @api public
   */

  util.query = function (base, addition) {
    var query = util.chunkQuery(base || '')
      , components = [];

    util.merge(query, util.chunkQuery(addition || ''));
    for (var part in query) {
      if (query.hasOwnProperty(part)) {
        components.push(part + '=' + query[part]);
      }
    }

    return components.length ? '?' + components.join('&') : '';
  };

  /**
   * Transforms a querystring in to an object
   *
   * @param {String} qs
   * @api public
   */

  util.chunkQuery = function (qs) {
    var query = {}
      , params = qs.split('&')
      , i = 0
      , l = params.length
      , kv;

    for (; i < l; ++i) {
      kv = params[i].split('=');
      if (kv[0]) {
        query[kv[0]] = kv[1];
      }
    }

    return query;
  };

  /**
   * Executes the given function when the page is loaded.
   *
   *     io.util.load(function () { console.log('page loaded'); });
   *
   * @param {Function} fn
   * @api public
   */

  var pageLoaded = false;

  util.load = function (fn) {
    if ('document' in global && document.readyState === 'complete' || pageLoaded) {
      return fn();
    }

    util.on(global, 'load', fn, false);
  };

  /**
   * Adds an event.
   *
   * @api private
   */

  util.on = function (element, event, fn, capture) {
    if (element.attachEvent) {
      element.attachEvent('on' + event, fn);
    } else if (element.addEventListener) {
      element.addEventListener(event, fn, capture);
    }
  };

  /**
   * Generates the correct `XMLHttpRequest` for regular and cross domain requests.
   *
   * @param {Boolean} [xdomain] Create a request that can be used cross domain.
   * @returns {XMLHttpRequest|false} If we can create a XMLHttpRequest.
   * @api private
   */

  util.request = function (xdomain) {

    if (xdomain && 'undefined' != typeof XDomainRequest) {
      return new XDomainRequest();
    }

    if ('undefined' != typeof XMLHttpRequest && (!xdomain || util.ua.hasCORS)) {
      return new XMLHttpRequest();
    }

    if (!xdomain) {
      try {
        return new window[(['Active'].concat('Object').join('X'))]('Microsoft.XMLHTTP');
      } catch(e) { }
    }

    return null;
  };

  /**
   * XHR based transport constructor.
   *
   * @constructor
   * @api public
   */

  /**
   * Change the internal pageLoaded value.
   */

  if ('undefined' != typeof window) {
    util.load(function () {
      pageLoaded = true;
    });
  }

  /**
   * Defers a function to ensure a spinner is not displayed by the browser
   *
   * @param {Function} fn
   * @api public
   */

  util.defer = function (fn) {
    if (!util.ua.webkit || 'undefined' != typeof importScripts) {
      return fn();
    }

    util.load(function () {
      setTimeout(fn, 100);
    });
  };

  /**
   * Merges two objects.
   *
   * @api public
   */
  
  util.merge = function merge (target, additional, deep, lastseen) {
    var seen = lastseen || []
      , depth = typeof deep == 'undefined' ? 2 : deep
      , prop;

    for (prop in additional) {
      if (additional.hasOwnProperty(prop) && util.indexOf(seen, prop) < 0) {
        if (typeof target[prop] !== 'object' || !depth) {
          target[prop] = additional[prop];
          seen.push(additional[prop]);
        } else {
          util.merge(target[prop], additional[prop], depth - 1, seen);
        }
      }
    }

    return target;
  };

  /**
   * Merges prototypes from objects
   *
   * @api public
   */
  
  util.mixin = function (ctor, ctor2) {
    util.merge(ctor.prototype, ctor2.prototype);
  };

  /**
   * Shortcut for prototypical and static inheritance.
   *
   * @api private
   */

  util.inherit = function (ctor, ctor2) {
    function f() {};
    f.prototype = ctor2.prototype;
    ctor.prototype = new f;
  };

  /**
   * Checks if the given object is an Array.
   *
   *     io.util.isArray([]); // true
   *     io.util.isArray({}); // false
   *
   * @param Object obj
   * @api public
   */

  util.isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  /**
   * Intersects values of two arrays into a third
   *
   * @api public
   */

  util.intersect = function (arr, arr2) {
    var ret = []
      , longest = arr.length > arr2.length ? arr : arr2
      , shortest = arr.length > arr2.length ? arr2 : arr;

    for (var i = 0, l = shortest.length; i < l; i++) {
      if (~util.indexOf(longest, shortest[i]))
        ret.push(shortest[i]);
    }

    return ret;
  }

  /**
   * Array indexOf compatibility.
   *
   * @see bit.ly/a5Dxa2
   * @api public
   */

  util.indexOf = function (arr, o, i) {
    
    for (var j = arr.length, i = i < 0 ? i + j < 0 ? 0 : i + j : i || 0; 
         i < j && arr[i] !== o; i++) {}

    return j <= i ? -1 : i;
  };

  /**
   * Converts enumerables to array.
   *
   * @api public
   */

  util.toArray = function (enu) {
    var arr = [];

    for (var i = 0, l = enu.length; i < l; i++)
      arr.push(enu[i]);

    return arr;
  };

  /**
   * UA / engines detection namespace.
   *
   * @namespace
   */

  util.ua = {};

  /**
   * Whether the UA supports CORS for XHR.
   *
   * @api public
   */

  util.ua.hasCORS = 'undefined' != typeof XMLHttpRequest && (function () {
    try {
      var a = new XMLHttpRequest();
    } catch (e) {
      return false;
    }

    return a.withCredentials != undefined;
  })();

  /**
   * Detect webkit.
   *
   * @api public
   */

  util.ua.webkit = 'undefined' != typeof navigator
    && /webkit/i.test(navigator.userAgent);

   /**
   * Detect iPad/iPhone/iPod.
   *
   * @api public
   */

  util.ua.iDevice = 'undefined' != typeof navigator
      && /iPad|iPhone|iPod/i.test(navigator.userAgent);

})('undefined' != typeof io ? io : module.exports, this);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.EventEmitter = EventEmitter;

  /**
   * Event emitter constructor.
   *
   * @api public.
   */

  function EventEmitter () {};

  /**
   * Adds a listener
   *
   * @api public
   */

  EventEmitter.prototype.on = function (name, fn) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = fn;
    } else if (io.util.isArray(this.$events[name])) {
      this.$events[name].push(fn);
    } else {
      this.$events[name] = [this.$events[name], fn];
    }

    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  /**
   * Adds a volatile listener.
   *
   * @api public
   */

  EventEmitter.prototype.once = function (name, fn) {
    var self = this;

    function on () {
      self.removeListener(name, on);
      fn.apply(this, arguments);
    };

    on.listener = fn;
    this.on(name, on);

    return this;
  };

  /**
   * Removes a listener.
   *
   * @api public
   */

  EventEmitter.prototype.removeListener = function (name, fn) {
    if (this.$events && this.$events[name]) {
      var list = this.$events[name];

      if (io.util.isArray(list)) {
        var pos = -1;

        for (var i = 0, l = list.length; i < l; i++) {
          if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
            pos = i;
            break;
          }
        }

        if (pos < 0) {
          return this;
        }

        list.splice(pos, 1);

        if (!list.length) {
          delete this.$events[name];
        }
      } else if (list === fn || (list.listener && list.listener === fn)) {
        delete this.$events[name];
      }
    }

    return this;
  };

  /**
   * Removes all listeners for an event.
   *
   * @api public
   */

  EventEmitter.prototype.removeAllListeners = function (name) {
    if (name === undefined) {
      this.$events = {};
      return this;
    }

    if (this.$events && this.$events[name]) {
      this.$events[name] = null;
    }

    return this;
  };

  /**
   * Gets all listeners for a certain event.
   *
   * @api publci
   */

  EventEmitter.prototype.listeners = function (name) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = [];
    }

    if (!io.util.isArray(this.$events[name])) {
      this.$events[name] = [this.$events[name]];
    }

    return this.$events[name];
  };

  /**
   * Emits an event.
   *
   * @api public
   */

  EventEmitter.prototype.emit = function (name) {
    if (!this.$events) {
      return false;
    }

    var handler = this.$events[name];

    if (!handler) {
      return false;
    }

    var args = Array.prototype.slice.call(arguments, 1);

    if ('function' == typeof handler) {
      handler.apply(this, args);
    } else if (io.util.isArray(handler)) {
      var listeners = handler.slice();

      for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i].apply(this, args);
      }
    } else {
      return false;
    }

    return true;
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Based on JSON2 (http://www.JSON.org/js.html).
 */

(function (exports, nativeJSON) {
  "use strict";

  // use native JSON if it's available
  if (nativeJSON && nativeJSON.parse){
    return exports.JSON = {
      parse: nativeJSON.parse
    , stringify: nativeJSON.stringify
    }
  }

  var JSON = exports.JSON = {};

  function f(n) {
      // Format integers to have at least two digits.
      return n < 10 ? '0' + n : n;
  }

  function date(d, key) {
    return isFinite(d.valueOf()) ?
        d.getUTCFullYear()     + '-' +
        f(d.getUTCMonth() + 1) + '-' +
        f(d.getUTCDate())      + 'T' +
        f(d.getUTCHours())     + ':' +
        f(d.getUTCMinutes())   + ':' +
        f(d.getUTCSeconds())   + 'Z' : null;
  };

  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      gap,
      indent,
      meta = {    // table of character substitutions
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"' : '\\"',
          '\\': '\\\\'
      },
      rep;


  function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

      escapable.lastIndex = 0;
      return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
          var c = meta[a];
          return typeof c === 'string' ? c :
              '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      }) + '"' : '"' + string + '"';
  }


  function str(key, holder) {

// Produce a string from holder[key].

      var i,          // The loop counter.
          k,          // The member key.
          v,          // The member value.
          length,
          mind = gap,
          partial,
          value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

      if (value instanceof Date) {
          value = date(key);
      }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

      if (typeof rep === 'function') {
          value = rep.call(holder, key, value);
      }

// What happens next depends on the value's type.

      switch (typeof value) {
      case 'string':
          return quote(value);

      case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

          return isFinite(value) ? String(value) : 'null';

      case 'boolean':
      case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

          return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

      case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

          if (!value) {
              return 'null';
          }

// Make an array to hold the partial results of stringifying this object value.

          gap += indent;
          partial = [];

// Is the value an array?

          if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

              length = value.length;
              for (i = 0; i < length; i += 1) {
                  partial[i] = str(i, value) || 'null';
              }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

              v = partial.length === 0 ? '[]' : gap ?
                  '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                  '[' + partial.join(',') + ']';
              gap = mind;
              return v;
          }

// If the replacer is an array, use it to select the members to be stringified.

          if (rep && typeof rep === 'object') {
              length = rep.length;
              for (i = 0; i < length; i += 1) {
                  if (typeof rep[i] === 'string') {
                      k = rep[i];
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          } else {

// Otherwise, iterate through all of the keys in the object.

              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

          v = partial.length === 0 ? '{}' : gap ?
              '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
              '{' + partial.join(',') + '}';
          gap = mind;
          return v;
      }
  }

// If the JSON object does not yet have a stringify method, give it one.

  JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

      var i;
      gap = '';
      indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

      if (typeof space === 'number') {
          for (i = 0; i < space; i += 1) {
              indent += ' ';
          }

// If the space parameter is a string, it will be used as the indent string.

      } else if (typeof space === 'string') {
          indent = space;
      }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

      rep = replacer;
      if (replacer && typeof replacer !== 'function' &&
              (typeof replacer !== 'object' ||
              typeof replacer.length !== 'number')) {
          throw new Error('JSON.stringify');
      }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

      return str('', {'': value});
  };

// If the JSON object does not yet have a parse method, give it one.

  JSON.parse = function (text, reviver) {
  // The parse method takes a text and an optional reviver function, and returns
  // a JavaScript value if the text is a valid JSON text.

      var j;

      function walk(holder, key) {

  // The walk method is used to recursively walk the resulting structure so
  // that modifications can be made.

          var k, v, value = holder[key];
          if (value && typeof value === 'object') {
              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = walk(value, k);
                      if (v !== undefined) {
                          value[k] = v;
                      } else {
                          delete value[k];
                      }
                  }
              }
          }
          return reviver.call(holder, key, value);
      }


  // Parsing happens in four stages. In the first stage, we replace certain
  // Unicode characters with escape sequences. JavaScript handles many characters
  // incorrectly, either silently deleting them, or treating them as line endings.

      text = String(text);
      cx.lastIndex = 0;
      if (cx.test(text)) {
          text = text.replace(cx, function (a) {
              return '\\u' +
                  ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
          });
      }

  // In the second stage, we run the text against regular expressions that look
  // for non-JSON patterns. We are especially concerned with '()' and 'new'
  // because they can cause invocation, and '=' because it can cause mutation.
  // But just to be safe, we want to reject all unexpected forms.

  // We split the second stage into 4 regexp operations in order to work around
  // crippling inefficiencies in IE's and Safari's regexp engines. First we
  // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
  // replace all simple value tokens with ']' characters. Third, we delete all
  // open brackets that follow a colon or comma or that begin the text. Finally,
  // we look to see that the remaining characters are only whitespace or ']' or
  // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

      if (/^[\],:{}\s]*$/
              .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                  .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                  .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

  // In the third stage we use the eval function to compile the text into a
  // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
  // in JavaScript: it can begin a block or an object literal. We wrap the text
  // in parens to eliminate the ambiguity.

          j = eval('(' + text + ')');

  // In the optional fourth stage, we recursively walk the new structure, passing
  // each name/value pair to a reviver function for possible transformation.

          return typeof reviver === 'function' ?
              walk({'': j}, '') : j;
      }

  // If the text is not JSON parseable, then a SyntaxError is thrown.

      throw new SyntaxError('JSON.parse');
  };

})(
    'undefined' != typeof io ? io : module.exports
  , typeof JSON !== 'undefined' ? JSON : undefined
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Parser namespace.
   *
   * @namespace
   */

  var parser = exports.parser = {};

  /**
   * Packet types.
   */

  var packets = parser.packets = [
      'disconnect'
    , 'connect'
    , 'heartbeat'
    , 'message'
    , 'json'
    , 'event'
    , 'ack'
    , 'error'
    , 'noop'
  ];

  /**
   * Errors reasons.
   */

  var reasons = parser.reasons = [
      'transport not supported'
    , 'client not handshaken'
    , 'unauthorized'
  ];

  /**
   * Errors advice.
   */

  var advice = parser.advice = [
      'reconnect'
  ];

  /**
   * Shortcuts.
   */

  var JSON = io.JSON
    , indexOf = io.util.indexOf;

  /**
   * Encodes a packet.
   *
   * @api private
   */

  parser.encodePacket = function (packet) {
    var type = indexOf(packets, packet.type)
      , id = packet.id || ''
      , endpoint = packet.endpoint || ''
      , ack = packet.ack
      , data = null;

    switch (packet.type) {
      case 'error':
        var reason = packet.reason ? indexOf(reasons, packet.reason) : ''
          , adv = packet.advice ? indexOf(advice, packet.advice) : '';

        if (reason !== '' || adv !== '')
          data = reason + (adv !== '' ? ('+' + adv) : '');

        break;

      case 'message':
        if (packet.data !== '')
          data = packet.data;
        break;

      case 'event':
        var ev = { name: packet.name };

        if (packet.args && packet.args.length) {
          ev.args = packet.args;
        }

        data = JSON.stringify(ev);
        break;

      case 'json':
        data = JSON.stringify(packet.data);
        break;

      case 'connect':
        if (packet.qs)
          data = packet.qs;
        break;

      case 'ack':
        data = packet.ackId
          + (packet.args && packet.args.length
              ? '+' + JSON.stringify(packet.args) : '');
        break;
    }

    // construct packet with required fragments
    var encoded = [
        type
      , id + (ack == 'data' ? '+' : '')
      , endpoint
    ];

    // data fragment is optional
    if (data !== null && data !== undefined)
      encoded.push(data);

    return encoded.join(':');
  };

  /**
   * Encodes multiple messages (payload).
   *
   * @param {Array} messages
   * @api private
   */

  parser.encodePayload = function (packets) {
    var decoded = '';

    if (packets.length == 1)
      return packets[0];

    for (var i = 0, l = packets.length; i < l; i++) {
      var packet = packets[i];
      decoded += '\ufffd' + packet.length + '\ufffd' + packets[i];
    }

    return decoded;
  };

  /**
   * Decodes a packet
   *
   * @api private
   */

  var regexp = /([^:]+):([0-9]+)?(\+)?:([^:]+)?:?([\s\S]*)?/;

  parser.decodePacket = function (data) {
    var pieces = data.match(regexp);

    if (!pieces) return {};

    var id = pieces[2] || ''
      , data = pieces[5] || ''
      , packet = {
            type: packets[pieces[1]]
          , endpoint: pieces[4] || ''
        };

    // whether we need to acknowledge the packet
    if (id) {
      packet.id = id;
      if (pieces[3])
        packet.ack = 'data';
      else
        packet.ack = true;
    }

    // handle different packet types
    switch (packet.type) {
      case 'error':
        var pieces = data.split('+');
        packet.reason = reasons[pieces[0]] || '';
        packet.advice = advice[pieces[1]] || '';
        break;

      case 'message':
        packet.data = data || '';
        break;

      case 'event':
        try {
          var opts = JSON.parse(data);
          packet.name = opts.name;
          packet.args = opts.args;
        } catch (e) { }

        packet.args = packet.args || [];
        break;

      case 'json':
        try {
          packet.data = JSON.parse(data);
        } catch (e) { }
        break;

      case 'connect':
        packet.qs = data || '';
        break;

      case 'ack':
        var pieces = data.match(/^([0-9]+)(\+)?(.*)/);
        if (pieces) {
          packet.ackId = pieces[1];
          packet.args = [];

          if (pieces[3]) {
            try {
              packet.args = pieces[3] ? JSON.parse(pieces[3]) : [];
            } catch (e) { }
          }
        }
        break;

      case 'disconnect':
      case 'heartbeat':
        break;
    };

    return packet;
  };

  /**
   * Decodes data payload. Detects multiple messages
   *
   * @return {Array} messages
   * @api public
   */

  parser.decodePayload = function (data) {
    // IE doesn't like data[i] for unicode chars, charAt works fine
    if (data.charAt(0) == '\ufffd') {
      var ret = [];

      for (var i = 1, length = ''; i < data.length; i++) {
        if (data.charAt(i) == '\ufffd') {
          ret.push(parser.decodePacket(data.substr(i + 1).substr(0, length)));
          i += Number(length) + 1;
          length = '';
        } else {
          length += data.charAt(i);
        }
      }

      return ret;
    } else {
      return [parser.decodePacket(data)];
    }
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.Transport = Transport;

  /**
   * This is the transport template for all supported transport methods.
   *
   * @constructor
   * @api public
   */

  function Transport (socket, sessid) {
    this.socket = socket;
    this.sessid = sessid;
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Transport, io.EventEmitter);


  /**
   * Indicates whether heartbeats is enabled for this transport
   *
   * @api private
   */

  Transport.prototype.heartbeats = function () {
    return true;
  }

  /**
   * Handles the response from the server. When a new response is received
   * it will automatically update the timeout, decode the message and
   * forwards the response to the onMessage function for further processing.
   *
   * @param {String} data Response from the server.
   * @api private
   */

  Transport.prototype.onData = function (data) {
    this.clearCloseTimeout();
    
    // If the connection in currently open (or in a reopening state) reset the close 
    // timeout since we have just received data. This check is necessary so
    // that we don't reset the timeout on an explicitly disconnected connection.
    if (this.socket.connected || this.socket.connecting || this.socket.reconnecting) {
      this.setCloseTimeout();
    }

    if (data !== '') {
      // todo: we should only do decodePayload for xhr transports
      var msgs = io.parser.decodePayload(data);

      if (msgs && msgs.length) {
        for (var i = 0, l = msgs.length; i < l; i++) {
          this.onPacket(msgs[i]);
        }
      }
    }

    return this;
  };

  /**
   * Handles packets.
   *
   * @api private
   */

  Transport.prototype.onPacket = function (packet) {
    this.socket.setHeartbeatTimeout();

    if (packet.type == 'heartbeat') {
      return this.onHeartbeat();
    }

    if (packet.type == 'connect' && packet.endpoint == '') {
      this.onConnect();
    }

    if (packet.type == 'error' && packet.advice == 'reconnect') {
      this.isOpen = false;
    }

    this.socket.onPacket(packet);

    return this;
  };

  /**
   * Sets close timeout
   *
   * @api private
   */
  
  Transport.prototype.setCloseTimeout = function () {
    if (!this.closeTimeout) {
      var self = this;

      this.closeTimeout = setTimeout(function () {
        self.onDisconnect();
      }, this.socket.closeTimeout);
    }
  };

  /**
   * Called when transport disconnects.
   *
   * @api private
   */

  Transport.prototype.onDisconnect = function () {
    if (this.isOpen) this.close();
    this.clearTimeouts();
    this.socket.onDisconnect();
    return this;
  };

  /**
   * Called when transport connects
   *
   * @api private
   */

  Transport.prototype.onConnect = function () {
    this.socket.onConnect();
    return this;
  }

  /**
   * Clears close timeout
   *
   * @api private
   */

  Transport.prototype.clearCloseTimeout = function () {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  };

  /**
   * Clear timeouts
   *
   * @api private
   */

  Transport.prototype.clearTimeouts = function () {
    this.clearCloseTimeout();

    if (this.reopenTimeout) {
      clearTimeout(this.reopenTimeout);
    }
  };

  /**
   * Sends a packet
   *
   * @param {Object} packet object.
   * @api private
   */

  Transport.prototype.packet = function (packet) {
    this.send(io.parser.encodePacket(packet));
  };

  /**
   * Send the received heartbeat message back to server. So the server
   * knows we are still connected.
   *
   * @param {String} heartbeat Heartbeat response from the server.
   * @api private
   */

  Transport.prototype.onHeartbeat = function (heartbeat) {
    this.packet({ type: 'heartbeat' });
  };
 
  /**
   * Called when the transport opens.
   *
   * @api private
   */

  Transport.prototype.onOpen = function () {
    this.isOpen = true;
    this.clearCloseTimeout();
    this.socket.onOpen();
  };

  /**
   * Notifies the base when the connection with the Socket.IO server
   * has been disconnected.
   *
   * @api private
   */

  Transport.prototype.onClose = function () {
    var self = this;

    /* FIXME: reopen delay causing a infinit loop
    this.reopenTimeout = setTimeout(function () {
      self.open();
    }, this.socket.options['reopen delay']);*/

    this.isOpen = false;
    this.socket.onClose();
    this.onDisconnect();
  };

  /**
   * Generates a connection url based on the Socket.IO URL Protocol.
   * See <https://github.com/learnboost/socket.io-node/> for more details.
   *
   * @returns {String} Connection url
   * @api private
   */

  Transport.prototype.prepareUrl = function () {
    var options = this.socket.options;

    return this.scheme() + '://'
      + options.host + ':' + options.port + '/'
      + options.resource + '/' + io.protocol
      + '/' + this.name + '/' + this.sessid;
  };

  /**
   * Checks if the transport is ready to start a connection.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  Transport.prototype.ready = function (socket, fn) {
    fn.call(this);
  };
})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.Socket = Socket;

  /**
   * Create a new `Socket.IO client` which can establish a persistent
   * connection with a Socket.IO enabled server.
   *
   * @api public
   */

  function Socket (options) {
    this.options = {
        port: 80
      , secure: false
      , document: 'document' in global ? document : false
      , resource: 'socket.io'
      , transports: io.transports
      , 'connect timeout': 10000
      , 'try multiple transports': true
      , 'reconnect': true
      , 'reconnection delay': 500
      , 'reconnection limit': Infinity
      , 'reopen delay': 3000
      , 'max reconnection attempts': 10
      , 'sync disconnect on unload': false
      , 'auto connect': true
      , 'flash policy port': 10843
      , 'manualFlush': false
    };

    io.util.merge(this.options, options);

    this.connected = false;
    this.open = false;
    this.connecting = false;
    this.reconnecting = false;
    this.namespaces = {};
    this.buffer = [];
    this.doBuffer = false;

    if (this.options['sync disconnect on unload'] &&
        (!this.isXDomain() || io.util.ua.hasCORS)) {
      var self = this;
      io.util.on(global, 'beforeunload', function () {
        self.disconnectSync();
      }, false);
    }

    if (this.options['auto connect']) {
      this.connect();
    }
};

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Socket, io.EventEmitter);

  /**
   * Returns a namespace listener/emitter for this socket
   *
   * @api public
   */

  Socket.prototype.of = function (name) {
    if (!this.namespaces[name]) {
      this.namespaces[name] = new io.SocketNamespace(this, name);

      if (name !== '') {
        this.namespaces[name].packet({ type: 'connect' });
      }
    }

    return this.namespaces[name];
  };

  /**
   * Emits the given event to the Socket and all namespaces
   *
   * @api private
   */

  Socket.prototype.publish = function () {
    this.emit.apply(this, arguments);

    var nsp;

    for (var i in this.namespaces) {
      if (this.namespaces.hasOwnProperty(i)) {
        nsp = this.of(i);
        nsp.$emit.apply(nsp, arguments);
      }
    }
  };

  /**
   * Performs the handshake
   *
   * @api private
   */

  function empty () { };

  Socket.prototype.handshake = function (fn) {
    var self = this
      , options = this.options;

    function complete (data) {
      if (data instanceof Error) {
        self.connecting = false;
        self.onError(data.message);
      } else {
        fn.apply(null, data.split(':'));
      }
    };

    var url = [
          'http' + (options.secure ? 's' : '') + ':/'
        , options.host + ':' + options.port
        , options.resource
        , io.protocol
        , io.util.query(this.options.query, 't=' + +new Date)
      ].join('/');

    if (this.isXDomain() && !io.util.ua.hasCORS) {
      var insertAt = document.getElementsByTagName('script')[0]
        , script = document.createElement('script');

      script.src = url + '&jsonp=' + io.j.length;
      insertAt.parentNode.insertBefore(script, insertAt);

      io.j.push(function (data) {
        complete(data);
        script.parentNode.removeChild(script);
      });
    } else {
      var xhr = io.util.request();

      xhr.open('GET', url, true);
      if (this.isXDomain()) {
        xhr.withCredentials = true;
      }
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          xhr.onreadystatechange = empty;

          if (xhr.status == 200) {
            complete(xhr.responseText);
          } else if (xhr.status == 403) {
            self.onError(xhr.responseText);
          } else {
            self.connecting = false;            
            !self.reconnecting && self.onError(xhr.responseText);
          }
        }
      };
      xhr.send(null);
    }
  };

  /**
   * Find an available transport based on the options supplied in the constructor.
   *
   * @api private
   */

  Socket.prototype.getTransport = function (override) {
    var transports = override || this.transports, match;

    for (var i = 0, transport; transport = transports[i]; i++) {
      if (io.Transport[transport]
        && io.Transport[transport].check(this)
        && (!this.isXDomain() || io.Transport[transport].xdomainCheck(this))) {
        return new io.Transport[transport](this, this.sessionid);
      }
    }

    return null;
  };

  /**
   * Connects to the server.
   *
   * @param {Function} [fn] Callback.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.connect = function (fn) {
    if (this.connecting) {
      return this;
    }

    var self = this;
    self.connecting = true;
    
    this.handshake(function (sid, heartbeat, close, transports) {
      self.sessionid = sid;
      self.closeTimeout = close * 1000;
      self.heartbeatTimeout = heartbeat * 1000;
      if(!self.transports)
          self.transports = self.origTransports = (transports ? io.util.intersect(
              transports.split(',')
            , self.options.transports
          ) : self.options.transports);

      self.setHeartbeatTimeout();

      function connect (transports){
        if (self.transport) self.transport.clearTimeouts();

        self.transport = self.getTransport(transports);
        if (!self.transport) return self.publish('connect_failed');

        // once the transport is ready
        self.transport.ready(self, function () {
          self.connecting = true;
          self.publish('connecting', self.transport.name);
          self.transport.open();

          if (self.options['connect timeout']) {
            self.connectTimeoutTimer = setTimeout(function () {
              if (!self.connected) {
                self.connecting = false;

                if (self.options['try multiple transports']) {
                  var remaining = self.transports;

                  while (remaining.length > 0 && remaining.splice(0,1)[0] !=
                         self.transport.name) {}

                    if (remaining.length){
                      connect(remaining);
                    } else {
                      self.publish('connect_failed');
                    }
                }
              }
            }, self.options['connect timeout']);
          }
        });
      }

      connect(self.transports);

      self.once('connect', function (){
        clearTimeout(self.connectTimeoutTimer);

        fn && typeof fn == 'function' && fn();
      });
    });

    return this;
  };

  /**
   * Clears and sets a new heartbeat timeout using the value given by the
   * server during the handshake.
   *
   * @api private
   */

  Socket.prototype.setHeartbeatTimeout = function () {
    clearTimeout(this.heartbeatTimeoutTimer);
    if(this.transport && !this.transport.heartbeats()) return;

    var self = this;
    this.heartbeatTimeoutTimer = setTimeout(function () {
      self.transport.onClose();
    }, this.heartbeatTimeout);
  };

  /**
   * Sends a message.
   *
   * @param {Object} data packet.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.packet = function (data) {
    if (this.connected && !this.doBuffer) {
      this.transport.packet(data);
    } else {
      this.buffer.push(data);
    }

    return this;
  };

  /**
   * Sets buffer state
   *
   * @api private
   */

  Socket.prototype.setBuffer = function (v) {
    this.doBuffer = v;

    if (!v && this.connected && this.buffer.length) {
      if (!this.options['manualFlush']) {
        this.flushBuffer();
      }
    }
  };

  /**
   * Flushes the buffer data over the wire.
   * To be invoked manually when 'manualFlush' is set to true.
   *
   * @api public
   */

  Socket.prototype.flushBuffer = function() {
    this.transport.payload(this.buffer);
    this.buffer = [];
  };
  

  /**
   * Disconnect the established connect.
   *
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.disconnect = function () {
    if (this.connected || this.connecting) {
      if (this.open) {
        this.of('').packet({ type: 'disconnect' });
      }

      // handle disconnection immediately
      this.onDisconnect('booted');
    }

    return this;
  };

  /**
   * Disconnects the socket with a sync XHR.
   *
   * @api private
   */

  Socket.prototype.disconnectSync = function () {
    // ensure disconnection
    var xhr = io.util.request();
    var uri = [
        'http' + (this.options.secure ? 's' : '') + ':/'
      , this.options.host + ':' + this.options.port
      , this.options.resource
      , io.protocol
      , ''
      , this.sessionid
    ].join('/') + '/?disconnect=1';

    xhr.open('GET', uri, false);
    xhr.send(null);

    // handle disconnection immediately
    this.onDisconnect('booted');
  };

  /**
   * Check if we need to use cross domain enabled transports. Cross domain would
   * be a different port or different domain name.
   *
   * @returns {Boolean}
   * @api private
   */

  Socket.prototype.isXDomain = function () {

    var port = global.location.port ||
      ('https:' == global.location.protocol ? 443 : 80);

    return this.options.host !== global.location.hostname 
      || this.options.port != port;
  };

  /**
   * Called upon handshake.
   *
   * @api private
   */

  Socket.prototype.onConnect = function () {
    if (!this.connected) {
      this.connected = true;
      this.connecting = false;
      if (!this.doBuffer) {
        // make sure to flush the buffer
        this.setBuffer(false);
      }
      this.emit('connect');
    }
  };

  /**
   * Called when the transport opens
   *
   * @api private
   */

  Socket.prototype.onOpen = function () {
    this.open = true;
  };

  /**
   * Called when the transport closes.
   *
   * @api private
   */

  Socket.prototype.onClose = function () {
    this.open = false;
    clearTimeout(this.heartbeatTimeoutTimer);
  };

  /**
   * Called when the transport first opens a connection
   *
   * @param text
   */

  Socket.prototype.onPacket = function (packet) {
    this.of(packet.endpoint).onPacket(packet);
  };

  /**
   * Handles an error.
   *
   * @api private
   */

  Socket.prototype.onError = function (err) {
    if (err && err.advice) {
      if (err.advice === 'reconnect' && (this.connected || this.connecting)) {
        this.disconnect();
        if (this.options.reconnect) {
          this.reconnect();
        }
      }
    }

    this.publish('error', err && err.reason ? err.reason : err);
  };

  /**
   * Called when the transport disconnects.
   *
   * @api private
   */

  Socket.prototype.onDisconnect = function (reason) {
    var wasConnected = this.connected
      , wasConnecting = this.connecting;

    this.connected = false;
    this.connecting = false;
    this.open = false;

    if (wasConnected || wasConnecting) {
      this.transport.close();
      this.transport.clearTimeouts();
      if (wasConnected) {
        this.publish('disconnect', reason);

        if ('booted' != reason && this.options.reconnect && !this.reconnecting) {
          this.reconnect();
        }
      }
    }
  };

  /**
   * Called upon reconnection.
   *
   * @api private
   */

  Socket.prototype.reconnect = function () {
    this.reconnecting = true;
    this.reconnectionAttempts = 0;
    this.reconnectionDelay = this.options['reconnection delay'];

    var self = this
      , maxAttempts = this.options['max reconnection attempts']
      , tryMultiple = this.options['try multiple transports']
      , limit = this.options['reconnection limit'];

    function reset () {
      if (self.connected) {
        for (var i in self.namespaces) {
          if (self.namespaces.hasOwnProperty(i) && '' !== i) {
              self.namespaces[i].packet({ type: 'connect' });
          }
        }
        self.publish('reconnect', self.transport.name, self.reconnectionAttempts);
      }

      clearTimeout(self.reconnectionTimer);

      self.removeListener('connect_failed', maybeReconnect);
      self.removeListener('connect', maybeReconnect);

      self.reconnecting = false;

      delete self.reconnectionAttempts;
      delete self.reconnectionDelay;
      delete self.reconnectionTimer;
      delete self.redoTransports;

      self.options['try multiple transports'] = tryMultiple;
    };

    function maybeReconnect () {
      if (!self.reconnecting) {
        return;
      }

      if (self.connected) {
        return reset();
      };

      if (self.connecting && self.reconnecting) {
        return self.reconnectionTimer = setTimeout(maybeReconnect, 1000);
      }

      if (self.reconnectionAttempts++ >= maxAttempts) {
        if (!self.redoTransports) {
          self.on('connect_failed', maybeReconnect);
          self.options['try multiple transports'] = true;
          self.transports = self.origTransports;
          self.transport = self.getTransport();
          self.redoTransports = true;
          self.connect();
        } else {
          self.publish('reconnect_failed');
          reset();
        }
      } else {
        if (self.reconnectionDelay < limit) {
          self.reconnectionDelay *= 2; // exponential back off
        }

        self.connect();
        self.publish('reconnecting', self.reconnectionDelay, self.reconnectionAttempts);
        self.reconnectionTimer = setTimeout(maybeReconnect, self.reconnectionDelay);
      }
    };

    this.options['try multiple transports'] = false;
    this.reconnectionTimer = setTimeout(maybeReconnect, this.reconnectionDelay);

    this.on('connect', maybeReconnect);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.SocketNamespace = SocketNamespace;

  /**
   * Socket namespace constructor.
   *
   * @constructor
   * @api public
   */

  function SocketNamespace (socket, name) {
    this.socket = socket;
    this.name = name || '';
    this.flags = {};
    this.json = new Flag(this, 'json');
    this.ackPackets = 0;
    this.acks = {};
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(SocketNamespace, io.EventEmitter);

  /**
   * Copies emit since we override it
   *
   * @api private
   */

  SocketNamespace.prototype.$emit = io.EventEmitter.prototype.emit;

  /**
   * Creates a new namespace, by proxying the request to the socket. This
   * allows us to use the synax as we do on the server.
   *
   * @api public
   */

  SocketNamespace.prototype.of = function () {
    return this.socket.of.apply(this.socket, arguments);
  };

  /**
   * Sends a packet.
   *
   * @api private
   */

  SocketNamespace.prototype.packet = function (packet) {
    packet.endpoint = this.name;
    this.socket.packet(packet);
    this.flags = {};
    return this;
  };

  /**
   * Sends a message
   *
   * @api public
   */

  SocketNamespace.prototype.send = function (data, fn) {
    var packet = {
        type: this.flags.json ? 'json' : 'message'
      , data: data
    };

    if ('function' == typeof fn) {
      packet.id = ++this.ackPackets;
      packet.ack = true;
      this.acks[packet.id] = fn;
    }

    return this.packet(packet);
  };

  /**
   * Emits an event
   *
   * @api public
   */
  
  SocketNamespace.prototype.emit = function (name) {
    var args = Array.prototype.slice.call(arguments, 1)
      , lastArg = args[args.length - 1]
      , packet = {
            type: 'event'
          , name: name
        };

    if ('function' == typeof lastArg) {
      packet.id = ++this.ackPackets;
      packet.ack = 'data';
      this.acks[packet.id] = lastArg;
      args = args.slice(0, args.length - 1);
    }

    packet.args = args;

    return this.packet(packet);
  };

  /**
   * Disconnects the namespace
   *
   * @api private
   */

  SocketNamespace.prototype.disconnect = function () {
    if (this.name === '') {
      this.socket.disconnect();
    } else {
      this.packet({ type: 'disconnect' });
      this.$emit('disconnect');
    }

    return this;
  };

  /**
   * Handles a packet
   *
   * @api private
   */

  SocketNamespace.prototype.onPacket = function (packet) {
    var self = this;

    function ack () {
      self.packet({
          type: 'ack'
        , args: io.util.toArray(arguments)
        , ackId: packet.id
      });
    };

    switch (packet.type) {
      case 'connect':
        this.$emit('connect');
        break;

      case 'disconnect':
        if (this.name === '') {
          this.socket.onDisconnect(packet.reason || 'booted');
        } else {
          this.$emit('disconnect', packet.reason);
        }
        break;

      case 'message':
      case 'json':
        var params = ['message', packet.data];

        if (packet.ack == 'data') {
          params.push(ack);
        } else if (packet.ack) {
          this.packet({ type: 'ack', ackId: packet.id });
        }

        this.$emit.apply(this, params);
        break;

      case 'event':
        var params = [packet.name].concat(packet.args);

        if (packet.ack == 'data')
          params.push(ack);

        this.$emit.apply(this, params);
        break;

      case 'ack':
        if (this.acks[packet.ackId]) {
          this.acks[packet.ackId].apply(this, packet.args);
          delete this.acks[packet.ackId];
        }
        break;

      case 'error':
        if (packet.advice){
          this.socket.onError(packet);
        } else {
          if (packet.reason == 'unauthorized') {
            this.$emit('connect_failed', packet.reason);
          } else {
            this.$emit('error', packet.reason);
          }
        }
        break;
    }
  };

  /**
   * Flag interface.
   *
   * @api private
   */

  function Flag (nsp, name) {
    this.namespace = nsp;
    this.name = name;
  };

  /**
   * Send a message
   *
   * @api public
   */

  Flag.prototype.send = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.send.apply(this.namespace, arguments);
  };

  /**
   * Emit an event
   *
   * @api public
   */

  Flag.prototype.emit = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.emit.apply(this.namespace, arguments);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.websocket = WS;

  /**
   * The WebSocket transport uses the HTML5 WebSocket API to establish an
   * persistent connection with the Socket.IO server. This transport will also
   * be inherited by the FlashSocket fallback as it provides a API compatible
   * polyfill for the WebSockets.
   *
   * @constructor
   * @extends {io.Transport}
   * @api public
   */

  function WS (socket) {
    io.Transport.apply(this, arguments);
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(WS, io.Transport);

  /**
   * Transport name
   *
   * @api public
   */

  WS.prototype.name = 'websocket';

  /**
   * Initializes a new `WebSocket` connection with the Socket.IO server. We attach
   * all the appropriate listeners to handle the responses from the server.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.open = function () {
    var query = io.util.query(this.socket.options.query)
      , self = this
      , Socket


    if (!Socket) {
      Socket = global.MozWebSocket || global.WebSocket;
    }

    this.websocket = new Socket(this.prepareUrl() + query);

    this.websocket.onopen = function () {
      self.onOpen();
      self.socket.setBuffer(false);
    };
    this.websocket.onmessage = function (ev) {
      self.onData(ev.data);
    };
    this.websocket.onclose = function () {
      self.onClose();
      self.socket.setBuffer(true);
    };
    this.websocket.onerror = function (e) {
      self.onError(e);
    };

    return this;
  };

  /**
   * Send a message to the Socket.IO server. The message will automatically be
   * encoded in the correct message format.
   *
   * @returns {Transport}
   * @api public
   */

  // Do to a bug in the current IDevices browser, we need to wrap the send in a 
  // setTimeout, when they resume from sleeping the browser will crash if 
  // we don't allow the browser time to detect the socket has been closed
  if (io.util.ua.iDevice) {
    WS.prototype.send = function (data) {
      var self = this;
      setTimeout(function() {
         self.websocket.send(data);
      },0);
      return this;
    };
  } else {
    WS.prototype.send = function (data) {
      this.websocket.send(data);
      return this;
    };
  }

  /**
   * Payload
   *
   * @api private
   */

  WS.prototype.payload = function (arr) {
    for (var i = 0, l = arr.length; i < l; i++) {
      this.packet(arr[i]);
    }
    return this;
  };

  /**
   * Disconnect the established `WebSocket` connection.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.close = function () {
    this.websocket.close();
    return this;
  };

  /**
   * Handle the errors that `WebSocket` might be giving when we
   * are attempting to connect or send messages.
   *
   * @param {Error} e The error.
   * @api private
   */

  WS.prototype.onError = function (e) {
    this.socket.onError(e);
  };

  /**
   * Returns the appropriate scheme for the URI generation.
   *
   * @api private
   */
  WS.prototype.scheme = function () {
    return this.socket.options.secure ? 'wss' : 'ws';
  };

  /**
   * Checks if the browser has support for native `WebSockets` and that
   * it's not the polyfill created for the FlashSocket transport.
   *
   * @return {Boolean}
   * @api public
   */

  WS.check = function () {
    return ('WebSocket' in global && !('__addTask' in WebSocket))
          || 'MozWebSocket' in global;
  };

  /**
   * Check if the `WebSocket` transport support cross domain communications.
   *
   * @returns {Boolean}
   * @api public
   */

  WS.xdomainCheck = function () {
    return true;
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('websocket');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   *
   * @api public
   */

  exports.XHR = XHR;

  /**
   * XHR constructor
   *
   * @costructor
   * @api public
   */

  function XHR (socket) {
    if (!socket) return;

    io.Transport.apply(this, arguments);
    this.sendBuffer = [];
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(XHR, io.Transport);

  /**
   * Establish a connection
   *
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.open = function () {
    this.socket.setBuffer(false);
    this.onOpen();
    this.get();

    // we need to make sure the request succeeds since we have no indication
    // whether the request opened or not until it succeeded.
    this.setCloseTimeout();

    return this;
  };

  /**
   * Check if we need to send data to the Socket.IO server, if we have data in our
   * buffer we encode it and forward it to the `post` method.
   *
   * @api private
   */

  XHR.prototype.payload = function (payload) {
    var msgs = [];

    for (var i = 0, l = payload.length; i < l; i++) {
      msgs.push(io.parser.encodePacket(payload[i]));
    }

    this.send(io.parser.encodePayload(msgs));
  };

  /**
   * Send data to the Socket.IO server.
   *
   * @param data The message
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.send = function (data) {
    this.post(data);
    return this;
  };

  /**
   * Posts a encoded message to the Socket.IO server.
   *
   * @param {String} data A encoded message.
   * @api private
   */

  function empty () { };

  XHR.prototype.post = function (data) {
    var self = this;
    this.socket.setBuffer(true);

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;
        self.posting = false;

        if (this.status == 200){
          self.socket.setBuffer(false);
        } else {
          self.onClose();
        }
      }
    }

    function onload () {
      this.onload = empty;
      self.socket.setBuffer(false);
    };

    this.sendXHR = this.request('POST');

    if (global.XDomainRequest && this.sendXHR instanceof XDomainRequest) {
      this.sendXHR.onload = this.sendXHR.onerror = onload;
    } else {
      this.sendXHR.onreadystatechange = stateChange;
    }

    this.sendXHR.send(data);
  };

  /**
   * Disconnects the established `XHR` connection.
   *
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.close = function () {
    this.onClose();
    return this;
  };

  /**
   * Generates a configured XHR request
   *
   * @param {String} url The url that needs to be requested.
   * @param {String} method The method the request should use.
   * @returns {XMLHttpRequest}
   * @api private
   */

  XHR.prototype.request = function (method) {
    var req = io.util.request(this.socket.isXDomain())
      , query = io.util.query(this.socket.options.query, 't=' + +new Date);

    req.open(method || 'GET', this.prepareUrl() + query, true);

    if (method == 'POST') {
      try {
        if (req.setRequestHeader) {
          req.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        } else {
          // XDomainRequest
          req.contentType = 'text/plain';
        }
      } catch (e) {}
    }

    return req;
  };

  /**
   * Returns the scheme to use for the transport URLs.
   *
   * @api private
   */

  XHR.prototype.scheme = function () {
    return this.socket.options.secure ? 'https' : 'http';
  };

  /**
   * Check if the XHR transports are supported
   *
   * @param {Boolean} xdomain Check if we support cross domain requests.
   * @returns {Boolean}
   * @api public
   */

  XHR.check = function (socket, xdomain) {
    try {
      var request = io.util.request(xdomain),
          usesXDomReq = (global.XDomainRequest && request instanceof XDomainRequest),
          socketProtocol = (socket && socket.options && socket.options.secure ? 'https:' : 'http:'),
          isXProtocol = (socketProtocol != global.location.protocol);
      if (request && !(usesXDomReq && isXProtocol)) {
        return true;
      }
    } catch(e) {}

    return false;
  };

  /**
   * Check if the XHR transport supports cross domain requests.
   *
   * @returns {Boolean}
   * @api public
   */

  XHR.xdomainCheck = function (socket) {
    return XHR.check(socket, true);
  };

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports['xhr-polling'] = XHRPolling;

  /**
   * The XHR-polling transport uses long polling XHR requests to create a
   * "persistent" connection with the server.
   *
   * @constructor
   * @api public
   */

  function XHRPolling () {
    io.Transport.XHR.apply(this, arguments);
  };

  /**
   * Inherits from XHR transport.
   */

  io.util.inherit(XHRPolling, io.Transport.XHR);

  /**
   * Merge the properties from XHR transport
   */

  io.util.merge(XHRPolling, io.Transport.XHR);

  /**
   * Transport name
   *
   * @api public
   */

  XHRPolling.prototype.name = 'xhr-polling';

  /**
   * Indicates whether heartbeats is enabled for this transport
   *
   * @api private
   */

  XHRPolling.prototype.heartbeats = function () {
    return false;
  };

  /** 
   * Establish a connection, for iPhone and Android this will be done once the page
   * is loaded.
   *
   * @returns {Transport} Chaining.
   * @api public
   */

  XHRPolling.prototype.open = function () {
    var self = this;

    io.Transport.XHR.prototype.open.call(self);
    return false;
  };

  /**
   * Starts a XHR request to wait for incoming messages.
   *
   * @api private
   */

  function empty () {};

  XHRPolling.prototype.get = function () {
    if (!this.isOpen) return;

    var self = this;

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;

        if (this.status == 200) {
          self.onData(this.responseText);
          self.get();
        } else {
          self.onClose();
        }
      }
    };

    function onload () {
      this.onload = empty;
      this.onerror = empty;
      self.onData(this.responseText);
      self.get();
    };

    function onerror () {
      self.onClose();
    };

    this.xhr = this.request();

    if (global.XDomainRequest && this.xhr instanceof XDomainRequest) {
      this.xhr.onload = onload;
      this.xhr.onerror = onerror;
    } else {
      this.xhr.onreadystatechange = stateChange;
    }

    this.xhr.send(null);
  };

  /**
   * Handle the unclean close behavior.
   *
   * @api private
   */

  XHRPolling.prototype.onClose = function () {
    io.Transport.XHR.prototype.onClose.call(this);

    if (this.xhr) {
      this.xhr.onreadystatechange = this.xhr.onload = this.xhr.onerror = empty;
      try {
        this.xhr.abort();
      } catch(e){}
      this.xhr = null;
    }
  };

  /**
   * Webkit based browsers show a infinit spinner when you start a XHR request
   * before the browsers onload event is called so we need to defer opening of
   * the transport until the onload event is called. Wrapping the cb in our
   * defer method solve this.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  XHRPolling.prototype.ready = function (socket, fn) {
    var self = this;

    io.util.defer(function () {
      fn.call(self);
    });
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('xhr-polling');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

})();;(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",Function(['require','module','exports','__dirname','__filename','process','global'],"function filter (xs, fn) {\n    var res = [];\n    for (var i = 0; i < xs.length; i++) {\n        if (fn(xs[i], i, xs)) res.push(xs[i]);\n    }\n    return res;\n}\n\n// resolves . and .. elements in a path array with directory names there\n// must be no slashes, empty elements, or device names (c:\\) in the array\n// (so also no leading and trailing slashes - it does not distinguish\n// relative and absolute paths)\nfunction normalizeArray(parts, allowAboveRoot) {\n  // if the path tries to go above the root, `up` ends up > 0\n  var up = 0;\n  for (var i = parts.length; i >= 0; i--) {\n    var last = parts[i];\n    if (last == '.') {\n      parts.splice(i, 1);\n    } else if (last === '..') {\n      parts.splice(i, 1);\n      up++;\n    } else if (up) {\n      parts.splice(i, 1);\n      up--;\n    }\n  }\n\n  // if the path is allowed to go above the root, restore leading ..s\n  if (allowAboveRoot) {\n    for (; up--; up) {\n      parts.unshift('..');\n    }\n  }\n\n  return parts;\n}\n\n// Regex to split a filename into [*, dir, basename, ext]\n// posix version\nvar splitPathRe = /^(.+\\/(?!$)|\\/)?((?:.+?)?(\\.[^.]*)?)$/;\n\n// path.resolve([from ...], to)\n// posix version\nexports.resolve = function() {\nvar resolvedPath = '',\n    resolvedAbsolute = false;\n\nfor (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {\n  var path = (i >= 0)\n      ? arguments[i]\n      : process.cwd();\n\n  // Skip empty and invalid entries\n  if (typeof path !== 'string' || !path) {\n    continue;\n  }\n\n  resolvedPath = path + '/' + resolvedPath;\n  resolvedAbsolute = path.charAt(0) === '/';\n}\n\n// At this point the path should be resolved to a full absolute path, but\n// handle relative paths to be safe (might happen when process.cwd() fails)\n\n// Normalize the path\nresolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {\n    return !!p;\n  }), !resolvedAbsolute).join('/');\n\n  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';\n};\n\n// path.normalize(path)\n// posix version\nexports.normalize = function(path) {\nvar isAbsolute = path.charAt(0) === '/',\n    trailingSlash = path.slice(-1) === '/';\n\n// Normalize the path\npath = normalizeArray(filter(path.split('/'), function(p) {\n    return !!p;\n  }), !isAbsolute).join('/');\n\n  if (!path && !isAbsolute) {\n    path = '.';\n  }\n  if (path && trailingSlash) {\n    path += '/';\n  }\n  \n  return (isAbsolute ? '/' : '') + path;\n};\n\n\n// posix version\nexports.join = function() {\n  var paths = Array.prototype.slice.call(arguments, 0);\n  return exports.normalize(filter(paths, function(p, index) {\n    return p && typeof p === 'string';\n  }).join('/'));\n};\n\n\nexports.dirname = function(path) {\n  var dir = splitPathRe.exec(path)[1] || '';\n  var isWindows = false;\n  if (!dir) {\n    // No dirname\n    return '.';\n  } else if (dir.length === 1 ||\n      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {\n    // It is just a slash or a drive letter with a slash\n    return dir;\n  } else {\n    // It is a full dirname, strip trailing slash\n    return dir.substring(0, dir.length - 1);\n  }\n};\n\n\nexports.basename = function(path, ext) {\n  var f = splitPathRe.exec(path)[2] || '';\n  // TODO: make this comparison case-insensitive on windows?\n  if (ext && f.substr(-1 * ext.length) === ext) {\n    f = f.substr(0, f.length - ext.length);\n  }\n  return f;\n};\n\n\nexports.extname = function(path) {\n  return splitPathRe.exec(path)[3] || '';\n};\n\n//@ sourceURL=path"
));

require.define("__browserify_process",Function(['require','module','exports','__dirname','__filename','process','global'],"var process = module.exports = {};\n\nprocess.nextTick = (function () {\n    var canSetImmediate = typeof window !== 'undefined'\n        && window.setImmediate;\n    var canPost = typeof window !== 'undefined'\n        && window.postMessage && window.addEventListener\n    ;\n\n    if (canSetImmediate) {\n        return window.setImmediate;\n    }\n\n    if (canPost) {\n        var queue = [];\n        window.addEventListener('message', function (ev) {\n            if (ev.source === window && ev.data === 'browserify-tick') {\n                ev.stopPropagation();\n                if (queue.length > 0) {\n                    var fn = queue.shift();\n                    fn();\n                }\n            }\n        }, true);\n\n        return function nextTick(fn) {\n            queue.push(fn);\n            window.postMessage('browserify-tick', '*');\n        };\n    }\n\n    return function nextTick(fn) {\n        setTimeout(fn, 0);\n    };\n})();\n\nprocess.title = 'browser';\nprocess.browser = true;\nprocess.env = {};\nprocess.argv = [];\n\nprocess.binding = function (name) {\n    if (name === 'evals') return (require)('vm')\n    else throw new Error('No such module. (Possibly not yet loaded)')\n};\n\n(function () {\n    var cwd = '/';\n    var path;\n    process.cwd = function () { return cwd };\n    process.chdir = function (dir) {\n        if (!path) path = require('path');\n        cwd = path.resolve(dir, cwd);\n    };\n})();\n\n//@ sourceURL=__browserify_process"
));

require.define("/node_modules/racer/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"./lib/racer.js\"}\n//@ sourceURL=/node_modules/racer/package.json"
));

require.define("/node_modules/racer/lib/racer.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var util = require('./util')\n  , mergeAll = util.mergeAll\n  , isServer = util.isServer\n  , isClient = !isServer;\n\nif (isClient) require('es5-shim');\n\nvar EventEmitter = require('events').EventEmitter\n  , plugin = require('./plugin')\n  , uuid = require('node-uuid');\n\nvar racer = module.exports = new EventEmitter();\n\nmergeAll(racer, plugin, {\n  version: require('../package.json').version\n, isServer: isServer\n, isClient: isClient\n, protected: {\n    Model: require('./Model')\n  }\n, util: util\n, uuid: function () {\n    return uuid.v4();\n  }\n, transaction: require('./transaction')\n});\n\n// Note that this plugin is passed by string to prevent Browserify from\n// including it\nif (isServer) {\n  racer.use(__dirname + '/racer.server');\n}\n\nracer\n  .use(require('./mutators'))\n  .use(require('./refs'))\n  .use(require('./pubSub'))\n  .use(require('./computed'))\n  .use(require('./descriptor'))\n  .use(require('./context'))\n  .use(require('./txns'))\n  .use(require('./reconnect'));\n\nif (isServer) {\n  racer.use(__dirname + '/adapters/pubsub-memory');\n  racer.use(__dirname + '/accessControl')\n  racer.use(__dirname + '/hooks')\n}\n\n// The browser module must be included last, since it creates a model instance,\n// before which all plugins should be included\nif (isClient) {\n  racer.use(require('./racer.browser'));\n}\n\n//@ sourceURL=/node_modules/racer/lib/racer.js"
));

require.define("/node_modules/racer/lib/util/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var toString = Object.prototype.toString\n  , hasOwnProperty = Object.prototype.hasOwnProperty\n  , isServer = typeof window === 'undefined'\n  , isProduction = isServer && process.env.NODE_ENV === 'production';\n\nmodule.exports = {\n  isServer: isServer\n, isProduction: isProduction\n, isArguments: isArguments\n, mergeAll: mergeAll\n, merge: merge\n, hasKeys: hasKeys\n, escapeRegExp: escapeRegExp\n, deepEqual: deepEqual\n, deepCopy: deepCopy\n, indexOf: indexOf\n, deepIndexOf: deepIndexOf\n, equalsNaN: equalsNaN\n, equal: equal\n, countWhile: countWhile\n, noop: noop\n, Promise: require('./Promise')\n, async: require('./async')\n};\n\nfunction isArguments (obj) {\n  return toString.call(obj) === '[object Arguments]';\n}\n\nfunction mergeAll (to /*, froms... */) {\n  var froms = Array.prototype.slice.call(arguments, 1);\n  for (var i = 0, l = froms.length; i < l; i++) {\n    var from = froms[i];\n    if (from) for (var key in from) to[key] = from[key];\n  }\n  return to;\n}\n\nfunction merge (to, from) {\n  for (var key in from) to[key] = from[key];\n  return to;\n}\n\nfunction hasKeys (obj, ignore) {\n  for (var key in obj)\n    if (key !== ignore) return true;\n  return false;\n}\n\n/**\n   * Escape a string to be used as teh source of a RegExp such that it matches\n   * literally.\n   */\nfunction escapeRegExp (s) {\n  return s.replace(/[\\-\\[\\]{}()*+?.,\\\\\\^$|#\\s]/g, '\\\\$&');\n}\n\n/**\n * Modified from node's assert.js\n */\nfunction deepEqual (actual, expected, ignore) {\n  // 7.1. All identical values are equivalent, as determined by ===.\n  if (actual === expected) return true;\n\n  // 7.2. If the expected value is a Date object, the actual value is\n  // equivalent if it is also a Date object that refers to the same time.\n  if (actual instanceof Date && expected instanceof Date)\n    return actual.getTime() === expected.getTime();\n\n  if (typeof actual === 'function' && typeof expected === 'function')\n    return actual === expected || actual.toString() === expected.toString();\n\n  // 7.3. Other pairs that do not both pass typeof value == 'object',\n  // equivalence is determined by ==.\n  if (typeof actual !== 'object' && typeof expected !== 'object')\n    return actual === expected;\n\n  // 7.4. For all other Object pairs, including Array objects, equivalence is\n  // determined by having the same number of owned properties (as verified\n  // with Object.prototype.hasOwnProperty.call), the same set of keys\n  // (although not necessarily the same order), equivalent values for every\n  // corresponding key, and an identical 'prototype' property. Note: this\n  // accounts for both named and indexed properties on Arrays.\n  if (ignore) {\n    var ignoreMap = {}\n      , i = ignore.length\n    while (i--) {\n      ignoreMap[ignore[i]] = true;\n    }\n  }\n  return objEquiv(actual, expected, ignoreMap);\n}\n\nfunction keysWithout (obj, ignoreMap) {\n  var out = []\n    , key\n  for (key in obj) {\n    if (!ignoreMap[key] && hasOwnProperty.call(obj, key)) out.push(key);\n  }\n  return out;\n}\n\n/**\n * Modified from node's assert.js\n */\nfunction objEquiv (a, b, ignoreMap) {\n  var i, key, ka, kb;\n\n  if (a == null || b == null) return false;\n\n  // an identical 'prototype' property.\n  if (a.prototype !== b.prototype) return false;\n\n  //~~~I've managed to break Object.keys through screwy arguments passing.\n  //   Converting to array solves the problem.\n  if (isArguments(a)) {\n    if (! isArguments(b)) return false;\n    a = pSlice.call(a);\n    b = pSlice.call(b);\n    return deepEqual(a, b);\n  }\n  try {\n    if (ignoreMap) {\n      ka = keysWithout(a, ignoreMap);\n      kb = keysWithout(b, ignoreMap);\n    } else {\n      ka = Object.keys(a);\n      kb = Object.keys(b);\n    }\n  } catch (e) {\n    // happens when one is a string literal and the other isn't\n    return false;\n  }\n  // having the same number of owned properties (keys incorporates\n  // hasOwnProperty)\n  if (ka.length !== kb.length) return false;\n\n  // the same set of keys (although not necessarily the same order),\n  ka.sort();\n  kb.sort();\n\n  //~~~cheap key test\n  i = ka.length;\n  while (i--) {\n    if (ka[i] !== kb[i]) return false;\n  }\n\n  //equivalent values for every corresponding key, and\n  //~~~possibly expensive deep test\n  i = ka.length;\n  while (i--) {\n    key = ka[i];\n    if (! deepEqual(a[key], b[key])) return false;\n  }\n  return true;\n}\n\n// TODO Test this\nfunction deepCopy (obj) {\n  if (obj === null) return null;\n  if (typeof obj === 'object') {\n    var copy;\n    if (Array.isArray(obj)) {\n      copy = [];\n      for (var i = obj.length; i--; ) copy[i] = deepCopy(obj[i]);\n      return copy;\n    }\n    copy = {}\n    for (var k in obj) copy[k] = deepCopy(obj[k]);\n    return copy;\n  }\n  return obj;\n}\n\nfunction indexOf (list, obj, isEqual) {\n  for (var i = 0, l = list.length; i < l; i++)\n    if (isEqual(obj, list[i])) return i;\n  return -1;\n}\n\nfunction deepIndexOf (list, obj) {\n  return indexOf(list, obj, deepEqual);\n}\n\nfunction equalsNaN (x) {\n  return x !== x;\n}\n\nfunction equal (a, b) {\n  return (a === b) || (equalsNaN(a) && equalsNaN(b));\n}\n\nfunction countWhile (array, predicate) {\n  var count = 0;\n  for (var i = 0, l = array.length; i < l; i++)\n    if (! predicate(array[i], i)) return count++;\n  return count;\n}\n\nfunction noop() {}\n\n//@ sourceURL=/node_modules/racer/lib/util/index.js"
));

require.define("/node_modules/racer/lib/util/Promise.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var util = require('./index')\n  , finishAfter = require('./async').finishAfter;\n\nmodule.exports = Promise;\n\nfunction Promise () {\n  this.callbacks = [];\n  this.resolved = false;\n}\n\nPromise.prototype = {\n  resolve: function (err, value) {\n    if (this.resolved) {\n      throw new Error('Promise has already been resolved');\n    }\n    this.resolved = true;\n    this.err = err;\n    this.value = value;\n    var callbacks = this.callbacks;\n    for (var i = 0, l = callbacks.length; i < l; i++) {\n      callbacks[i](err, value);\n    }\n    this.callbacks = [];\n    return this;\n  }\n\n, on: function (callback) {\n    if (this.resolved) {\n      callback(this.err, this.value);\n    } else {\n      this.callbacks.push(callback);\n    }\n    return this;\n  }\n\n, clear: function () {\n    this.resolved = false;\n    delete this.value;\n    delete this.err;\n    return this;\n  }\n};\n\nPromise.parallel = function (promises) {\n  var composite = new Promise()\n    , didErr;\n\n  if (Array.isArray(promises)) {\n    var compositeValue = []\n      , remaining = promises.length;\n    promises.forEach( function (promise, i) {\n      promise.on( function (err, val) {\n        if (didErr) return;\n        if (err) {\n          didErr = true;\n          return composite.resolve(err);\n        }\n        compositeValue[i] = val;\n        --remaining || composite.resolve(null, compositeValue);\n      });\n    });\n  } else {\n    var compositeValue = {}\n      , remaining = Object.keys(promises).length;\n    for (var k in promises) {\n      var promise = promises[k];\n      (function (k) {\n        promise.on( function (err, val) {\n          if (didErr) return;\n          if (err) {\n            didErr = true;\n            return composite.resolve(err);\n          }\n          compositeValue[k] = val;\n          --remaining || composite.resolve(null, compositeValue);\n        });\n      })(k);\n    }\n  }\n\n  return composite;\n};\n\n//@ sourceURL=/node_modules/racer/lib/util/Promise.js"
));

require.define("/node_modules/racer/lib/util/async.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  finishAfter: finishAfter\n\n, forEach: function (items, fn, done) {\n    var finish = finishAfter(items.length, done);\n    for (var i = 0, l = items.length; i < l; i++) {\n      fn(items[i], finish);\n    }\n  }\n\n, bufferifyMethods: function (Klass, methodNames, opts) {\n    var await = opts.await\n      , fns = {}\n      , buffer = null;\n\n    methodNames.forEach( function (methodName) {\n      fns[methodName] = Klass.prototype[methodName];\n      Klass.prototype[methodName] = function () {\n        var didFlush = false\n          , self = this;\n\n        function flush () {\n          didFlush = true;\n\n          // When we call flush, we no longer need to buffer, so replace each\n          // method with the original method\n          methodNames.forEach( function (methodName) {\n            self[methodName] = fns[methodName];\n          });\n          delete await.alreadyCalled;\n\n          // Call the method with the first invocation arguments if this is\n          // during the first call to methodName, await called flush\n          // immediately, and we therefore have no buffered method calls.\n          if (!buffer) return;\n\n          // Otherwise, invoke the buffered method calls\n          for (var i = 0, l = buffer.length; i < l; i++) {\n            fns[methodName].apply(self, buffer[i]);\n          }\n          buffer = null;\n        } /* end flush */\n\n        // The first time we call methodName, run await\n        if (await.alreadyCalled) return;\n        await.alreadyCalled = true;\n        await.call(this, flush);\n\n        // If await decided we need no buffering and it called flush, then call\n        // the original function with the arguments to this first call to methodName.\n        if (didFlush) return this[methodName].apply(this, arguments);\n\n        // Otherwise, if we need to buffer calls to this method, then replace\n        // this method temporarily with code that buffers the method calls\n        // until `flush` is called\n        this[methodName] = function () {\n          if (!buffer) buffer = [];\n          buffer.push(arguments);\n        }\n        this[methodName].apply(this, arguments);\n      }\n    });\n  }\n\n, bufferify: function (methodName, opts) {\n    var fn = opts.fn\n      , await = opts.await\n      , buffer = null;\n\n    return function () {\n      var didFlush = false\n        , self = this;\n\n      function flush () {\n        didFlush = true;\n\n        // When we call flush, we no longer need to buffer, so replace this\n        // method with the original method\n        self[methodName] = fn;\n\n        // Call the method with the first invocation arguments if this is\n        // during the first call to methodName, await called flush immediately,\n        // and we therefore have no buffered method calls.\n        if (!buffer) return;\n\n        // Otherwise, invoke the buffered method calls\n        for (var i = 0, l = buffer.length; i < l; i++) {\n          fn.apply(self, buffer[i]);\n        }\n        buffer = null;\n      }\n\n      // The first time we call methodName, run awai\n      await.call(this, flush);\n\n      // If await decided we need no buffering and it called flush, then call\n      // the original function with the arguments to this first call to methodName\n      if (didFlush) return this[methodName].apply(this, arguments);\n\n      // Otherwise, if we need to buffer calls to this method, then replace\n      // this method temporarily with code that buffers the method calls until\n      // `flush` is called\n      this[methodName] = function () {\n        if (!buffer) buffer = [];\n        buffer.push(arguments);\n      }\n      this[methodName].apply(this, arguments);\n    }\n  }\n};\n\nfunction finishAfter (count, callback) {\n  if (!callback) callback = function (err) { if (err) throw err; };\n  if (!count || count === 1) return callback;\n  var err;\n  return function (_err) {\n    err || (err = _err);\n    --count || callback(err);\n  };\n}\n\n//@ sourceURL=/node_modules/racer/lib/util/async.js"
));

require.define("/node_modules/racer/node_modules/es5-shim/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"es5-shim.js\"}\n//@ sourceURL=/node_modules/racer/node_modules/es5-shim/package.json"
));

require.define("/node_modules/racer/node_modules/es5-shim/es5-shim.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// Copyright 2009-2012 by contributors, MIT License\n// vim: ts=4 sts=4 sw=4 expandtab\n\n// Module systems magic dance\n(function (definition) {\n    // RequireJS\n    if (typeof define == \"function\") {\n        define(definition);\n    // YUI3\n    } else if (typeof YUI == \"function\") {\n        YUI.add(\"es5\", definition);\n    // CommonJS and <script>\n    } else {\n        definition();\n    }\n})(function () {\n\n/**\n * Brings an environment as close to ECMAScript 5 compliance\n * as is possible with the facilities of erstwhile engines.\n *\n * Annotated ES5: http://es5.github.com/ (specific links below)\n * ES5 Spec: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf\n * Required reading: http://javascriptweblog.wordpress.com/2011/12/05/extending-javascript-natives/\n */\n\n//\n// Function\n// ========\n//\n\n// ES-5 15.3.4.5\n// http://es5.github.com/#x15.3.4.5\n\nif (!Function.prototype.bind) {\n    Function.prototype.bind = function bind(that) { // .length is 1\n        // 1. Let Target be the this value.\n        var target = this;\n        // 2. If IsCallable(Target) is false, throw a TypeError exception.\n        if (typeof target != \"function\") {\n            throw new TypeError(\"Function.prototype.bind called on incompatible \" + target);\n        }\n        // 3. Let A be a new (possibly empty) internal list of all of the\n        //   argument values provided after thisArg (arg1, arg2 etc), in order.\n        // XXX slicedArgs will stand in for \"A\" if used\n        var args = slice.call(arguments, 1); // for normal call\n        // 4. Let F be a new native ECMAScript object.\n        // 11. Set the [[Prototype]] internal property of F to the standard\n        //   built-in Function prototype object as specified in 15.3.3.1.\n        // 12. Set the [[Call]] internal property of F as described in\n        //   15.3.4.5.1.\n        // 13. Set the [[Construct]] internal property of F as described in\n        //   15.3.4.5.2.\n        // 14. Set the [[HasInstance]] internal property of F as described in\n        //   15.3.4.5.3.\n        var bound = function () {\n\n            if (this instanceof bound) {\n                // 15.3.4.5.2 [[Construct]]\n                // When the [[Construct]] internal method of a function object,\n                // F that was created using the bind function is called with a\n                // list of arguments ExtraArgs, the following steps are taken:\n                // 1. Let target be the value of F's [[TargetFunction]]\n                //   internal property.\n                // 2. If target has no [[Construct]] internal method, a\n                //   TypeError exception is thrown.\n                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal\n                //   property.\n                // 4. Let args be a new list containing the same values as the\n                //   list boundArgs in the same order followed by the same\n                //   values as the list ExtraArgs in the same order.\n                // 5. Return the result of calling the [[Construct]] internal\n                //   method of target providing args as the arguments.\n\n                var result = target.apply(\n                    this,\n                    args.concat(slice.call(arguments))\n                );\n                if (Object(result) === result) {\n                    return result;\n                }\n                return this;\n\n            } else {\n                // 15.3.4.5.1 [[Call]]\n                // When the [[Call]] internal method of a function object, F,\n                // which was created using the bind function is called with a\n                // this value and a list of arguments ExtraArgs, the following\n                // steps are taken:\n                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal\n                //   property.\n                // 2. Let boundThis be the value of F's [[BoundThis]] internal\n                //   property.\n                // 3. Let target be the value of F's [[TargetFunction]] internal\n                //   property.\n                // 4. Let args be a new list containing the same values as the\n                //   list boundArgs in the same order followed by the same\n                //   values as the list ExtraArgs in the same order.\n                // 5. Return the result of calling the [[Call]] internal method\n                //   of target providing boundThis as the this value and\n                //   providing args as the arguments.\n\n                // equiv: target.call(this, ...boundArgs, ...args)\n                return target.apply(\n                    that,\n                    args.concat(slice.call(arguments))\n                );\n\n            }\n\n        };\n        if(target.prototype) {\n            bound.prototype = Object.create(target.prototype);\n        }\n        // XXX bound.length is never writable, so don't even try\n        //\n        // 15. If the [[Class]] internal property of Target is \"Function\", then\n        //     a. Let L be the length property of Target minus the length of A.\n        //     b. Set the length own property of F to either 0 or L, whichever is\n        //       larger.\n        // 16. Else set the length own property of F to 0.\n        // 17. Set the attributes of the length own property of F to the values\n        //   specified in 15.3.5.1.\n\n        // TODO\n        // 18. Set the [[Extensible]] internal property of F to true.\n\n        // TODO\n        // 19. Let thrower be the [[ThrowTypeError]] function Object (13.2.3).\n        // 20. Call the [[DefineOwnProperty]] internal method of F with\n        //   arguments \"caller\", PropertyDescriptor {[[Get]]: thrower, [[Set]]:\n        //   thrower, [[Enumerable]]: false, [[Configurable]]: false}, and\n        //   false.\n        // 21. Call the [[DefineOwnProperty]] internal method of F with\n        //   arguments \"arguments\", PropertyDescriptor {[[Get]]: thrower,\n        //   [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false},\n        //   and false.\n\n        // TODO\n        // NOTE Function objects created using Function.prototype.bind do not\n        // have a prototype property or the [[Code]], [[FormalParameters]], and\n        // [[Scope]] internal properties.\n        // XXX can't delete prototype in pure-js.\n\n        // 22. Return F.\n        return bound;\n    };\n}\n\n// Shortcut to an often accessed properties, in order to avoid multiple\n// dereference that costs universally.\n// _Please note: Shortcuts are defined after `Function.prototype.bind` as we\n// us it in defining shortcuts.\nvar call = Function.prototype.call;\nvar prototypeOfArray = Array.prototype;\nvar prototypeOfObject = Object.prototype;\nvar slice = prototypeOfArray.slice;\n// Having a toString local variable name breaks in Opera so use _toString.\nvar _toString = call.bind(prototypeOfObject.toString);\nvar owns = call.bind(prototypeOfObject.hasOwnProperty);\n\n// If JS engine supports accessors creating shortcuts.\nvar defineGetter;\nvar defineSetter;\nvar lookupGetter;\nvar lookupSetter;\nvar supportsAccessors;\nif ((supportsAccessors = owns(prototypeOfObject, \"__defineGetter__\"))) {\n    defineGetter = call.bind(prototypeOfObject.__defineGetter__);\n    defineSetter = call.bind(prototypeOfObject.__defineSetter__);\n    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);\n    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);\n}\n\n//\n// Array\n// =====\n//\n\n// ES5 15.4.4.12\n// http://es5.github.com/#x15.4.4.12\n// Default value for second param\n// [bugfix, ielt9, old browsers]\n// IE < 9 bug: [1,2].splice(0).join(\"\") == \"\" but should be \"12\"\nif ([1,2].splice(0).length != 2) {\n    var array_splice = Array.prototype.splice;\n    Array.prototype.splice = function(start, deleteCount) {\n        if (!arguments.length) {\n            return [];\n        } else {\n            return array_splice.apply(this, [\n                start === void 0 ? 0 : start,\n                deleteCount === void 0 ? (this.length - start) : deleteCount\n            ].concat(slice.call(arguments, 2)))\n        }\n    };\n}\n\n// ES5 15.4.3.2\n// http://es5.github.com/#x15.4.3.2\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray\nif (!Array.isArray) {\n    Array.isArray = function isArray(obj) {\n        return _toString(obj) == \"[object Array]\";\n    };\n}\n\n// The IsCallable() check in the Array functions\n// has been replaced with a strict check on the\n// internal class of the object to trap cases where\n// the provided function was actually a regular\n// expression literal, which in V8 and\n// JavaScriptCore is a typeof \"function\".  Only in\n// V8 are regular expression literals permitted as\n// reduce parameters, so it is desirable in the\n// general case for the shim to match the more\n// strict and common behavior of rejecting regular\n// expressions.\n\n// ES5 15.4.4.18\n// http://es5.github.com/#x15.4.4.18\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/forEach\n\n// Check failure of by-index access of string characters (IE < 9)\n// and failure of `0 in boxedString` (Rhino)\nvar boxedString = Object(\"a\"),\n    splitString = boxedString[0] != \"a\" || !(0 in boxedString);\n\nif (!Array.prototype.forEach) {\n    Array.prototype.forEach = function forEach(fun /*, thisp*/) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            thisp = arguments[1],\n            i = -1,\n            length = self.length >>> 0;\n\n        // If no callback function or if callback is not a callable function\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        while (++i < length) {\n            if (i in self) {\n                // Invoke the callback function with call, passing arguments:\n                // context, property value, property key, thisArg object\n                // context\n                fun.call(thisp, self[i], i, object);\n            }\n        }\n    };\n}\n\n// ES5 15.4.4.19\n// http://es5.github.com/#x15.4.4.19\n// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map\nif (!Array.prototype.map) {\n    Array.prototype.map = function map(fun /*, thisp*/) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            length = self.length >>> 0,\n            result = Array(length),\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self)\n                result[i] = fun.call(thisp, self[i], i, object);\n        }\n        return result;\n    };\n}\n\n// ES5 15.4.4.20\n// http://es5.github.com/#x15.4.4.20\n// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter\nif (!Array.prototype.filter) {\n    Array.prototype.filter = function filter(fun /*, thisp */) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                    object,\n            length = self.length >>> 0,\n            result = [],\n            value,\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self) {\n                value = self[i];\n                if (fun.call(thisp, value, i, object)) {\n                    result.push(value);\n                }\n            }\n        }\n        return result;\n    };\n}\n\n// ES5 15.4.4.16\n// http://es5.github.com/#x15.4.4.16\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every\nif (!Array.prototype.every) {\n    Array.prototype.every = function every(fun /*, thisp */) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            length = self.length >>> 0,\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self && !fun.call(thisp, self[i], i, object)) {\n                return false;\n            }\n        }\n        return true;\n    };\n}\n\n// ES5 15.4.4.17\n// http://es5.github.com/#x15.4.4.17\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some\nif (!Array.prototype.some) {\n    Array.prototype.some = function some(fun /*, thisp */) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            length = self.length >>> 0,\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self && fun.call(thisp, self[i], i, object)) {\n                return true;\n            }\n        }\n        return false;\n    };\n}\n\n// ES5 15.4.4.21\n// http://es5.github.com/#x15.4.4.21\n// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce\nif (!Array.prototype.reduce) {\n    Array.prototype.reduce = function reduce(fun /*, initial*/) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            length = self.length >>> 0;\n\n        // If no callback function or if callback is not a callable function\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        // no value to return if no initial value and an empty array\n        if (!length && arguments.length == 1) {\n            throw new TypeError(\"reduce of empty array with no initial value\");\n        }\n\n        var i = 0;\n        var result;\n        if (arguments.length >= 2) {\n            result = arguments[1];\n        } else {\n            do {\n                if (i in self) {\n                    result = self[i++];\n                    break;\n                }\n\n                // if array contains no values, no initial value to return\n                if (++i >= length) {\n                    throw new TypeError(\"reduce of empty array with no initial value\");\n                }\n            } while (true);\n        }\n\n        for (; i < length; i++) {\n            if (i in self) {\n                result = fun.call(void 0, result, self[i], i, object);\n            }\n        }\n\n        return result;\n    };\n}\n\n// ES5 15.4.4.22\n// http://es5.github.com/#x15.4.4.22\n// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight\nif (!Array.prototype.reduceRight) {\n    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            length = self.length >>> 0;\n\n        // If no callback function or if callback is not a callable function\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        // no value to return if no initial value, empty array\n        if (!length && arguments.length == 1) {\n            throw new TypeError(\"reduceRight of empty array with no initial value\");\n        }\n\n        var result, i = length - 1;\n        if (arguments.length >= 2) {\n            result = arguments[1];\n        } else {\n            do {\n                if (i in self) {\n                    result = self[i--];\n                    break;\n                }\n\n                // if array contains no values, no initial value to return\n                if (--i < 0) {\n                    throw new TypeError(\"reduceRight of empty array with no initial value\");\n                }\n            } while (true);\n        }\n\n        do {\n            if (i in this) {\n                result = fun.call(void 0, result, self[i], i, object);\n            }\n        } while (i--);\n\n        return result;\n    };\n}\n\n// ES5 15.4.4.14\n// http://es5.github.com/#x15.4.4.14\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf\nif (!Array.prototype.indexOf || ([0, 1].indexOf(1, 2) != -1)) {\n    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {\n        var self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                toObject(this),\n            length = self.length >>> 0;\n\n        if (!length) {\n            return -1;\n        }\n\n        var i = 0;\n        if (arguments.length > 1) {\n            i = toInteger(arguments[1]);\n        }\n\n        // handle negative indices\n        i = i >= 0 ? i : Math.max(0, length + i);\n        for (; i < length; i++) {\n            if (i in self && self[i] === sought) {\n                return i;\n            }\n        }\n        return -1;\n    };\n}\n\n// ES5 15.4.4.15\n// http://es5.github.com/#x15.4.4.15\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf\nif (!Array.prototype.lastIndexOf || ([0, 1].lastIndexOf(0, -3) != -1)) {\n    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {\n        var self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                toObject(this),\n            length = self.length >>> 0;\n\n        if (!length) {\n            return -1;\n        }\n        var i = length - 1;\n        if (arguments.length > 1) {\n            i = Math.min(i, toInteger(arguments[1]));\n        }\n        // handle negative indices\n        i = i >= 0 ? i : length - Math.abs(i);\n        for (; i >= 0; i--) {\n            if (i in self && sought === self[i]) {\n                return i;\n            }\n        }\n        return -1;\n    };\n}\n\n//\n// Object\n// ======\n//\n\n// ES5 15.2.3.14\n// http://es5.github.com/#x15.2.3.14\nif (!Object.keys) {\n    // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation\n    var hasDontEnumBug = true,\n        dontEnums = [\n            \"toString\",\n            \"toLocaleString\",\n            \"valueOf\",\n            \"hasOwnProperty\",\n            \"isPrototypeOf\",\n            \"propertyIsEnumerable\",\n            \"constructor\"\n        ],\n        dontEnumsLength = dontEnums.length;\n\n    for (var key in {\"toString\": null}) {\n        hasDontEnumBug = false;\n    }\n\n    Object.keys = function keys(object) {\n\n        if (\n            (typeof object != \"object\" && typeof object != \"function\") ||\n            object === null\n        ) {\n            throw new TypeError(\"Object.keys called on a non-object\");\n        }\n\n        var keys = [];\n        for (var name in object) {\n            if (owns(object, name)) {\n                keys.push(name);\n            }\n        }\n\n        if (hasDontEnumBug) {\n            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {\n                var dontEnum = dontEnums[i];\n                if (owns(object, dontEnum)) {\n                    keys.push(dontEnum);\n                }\n            }\n        }\n        return keys;\n    };\n\n}\n\n//\n// Date\n// ====\n//\n\n// ES5 15.9.5.43\n// http://es5.github.com/#x15.9.5.43\n// This function returns a String value represent the instance in time\n// represented by this Date object. The format of the String is the Date Time\n// string format defined in 15.9.1.15. All fields are present in the String.\n// The time zone is always UTC, denoted by the suffix Z. If the time value of\n// this object is not a finite Number a RangeError exception is thrown.\nvar negativeDate = -62198755200000,\n    negativeYearString = \"-000001\";\nif (\n    !Date.prototype.toISOString ||\n    (new Date(negativeDate).toISOString().indexOf(negativeYearString) === -1)\n) {\n    Date.prototype.toISOString = function toISOString() {\n        var result, length, value, year, month;\n        if (!isFinite(this)) {\n            throw new RangeError(\"Date.prototype.toISOString called on non-finite value.\");\n        }\n\n        year = this.getUTCFullYear();\n\n        month = this.getUTCMonth();\n        // see https://github.com/kriskowal/es5-shim/issues/111\n        year += Math.floor(month / 12);\n        month = (month % 12 + 12) % 12;\n\n        // the date time string format is specified in 15.9.1.15.\n        result = [month + 1, this.getUTCDate(),\n            this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];\n        year = (\n            (year < 0 ? \"-\" : (year > 9999 ? \"+\" : \"\")) +\n            (\"00000\" + Math.abs(year))\n            .slice(0 <= year && year <= 9999 ? -4 : -6)\n        );\n\n        length = result.length;\n        while (length--) {\n            value = result[length];\n            // pad months, days, hours, minutes, and seconds to have two\n            // digits.\n            if (value < 10) {\n                result[length] = \"0\" + value;\n            }\n        }\n        // pad milliseconds to have three digits.\n        return (\n            year + \"-\" + result.slice(0, 2).join(\"-\") +\n            \"T\" + result.slice(2).join(\":\") + \".\" +\n            (\"000\" + this.getUTCMilliseconds()).slice(-3) + \"Z\"\n        );\n    };\n}\n\n\n// ES5 15.9.5.44\n// http://es5.github.com/#x15.9.5.44\n// This function provides a String representation of a Date object for use by\n// JSON.stringify (15.12.3).\nvar dateToJSONIsSupported = false;\ntry {\n    dateToJSONIsSupported = (\n        Date.prototype.toJSON &&\n        new Date(NaN).toJSON() === null &&\n        new Date(negativeDate).toJSON().indexOf(negativeYearString) !== -1 &&\n        Date.prototype.toJSON.call({ // generic\n            toISOString: function () {\n                return true;\n            }\n        })\n    );\n} catch (e) {\n}\nif (!dateToJSONIsSupported) {\n    Date.prototype.toJSON = function toJSON(key) {\n        // When the toJSON method is called with argument key, the following\n        // steps are taken:\n\n        // 1.  Let O be the result of calling ToObject, giving it the this\n        // value as its argument.\n        // 2. Let tv be toPrimitive(O, hint Number).\n        var o = Object(this),\n            tv = toPrimitive(o),\n            toISO;\n        // 3. If tv is a Number and is not finite, return null.\n        if (typeof tv === \"number\" && !isFinite(tv)) {\n            return null;\n        }\n        // 4. Let toISO be the result of calling the [[Get]] internal method of\n        // O with argument \"toISOString\".\n        toISO = o.toISOString;\n        // 5. If IsCallable(toISO) is false, throw a TypeError exception.\n        if (typeof toISO != \"function\") {\n            throw new TypeError(\"toISOString property is not callable\");\n        }\n        // 6. Return the result of calling the [[Call]] internal method of\n        //  toISO with O as the this value and an empty argument list.\n        return toISO.call(o);\n\n        // NOTE 1 The argument is ignored.\n\n        // NOTE 2 The toJSON function is intentionally generic; it does not\n        // require that its this value be a Date object. Therefore, it can be\n        // transferred to other kinds of objects for use as a method. However,\n        // it does require that any such object have a toISOString method. An\n        // object is free to use the argument key to filter its\n        // stringification.\n    };\n}\n\n// ES5 15.9.4.2\n// http://es5.github.com/#x15.9.4.2\n// based on work shared by Daniel Friesen (dantman)\n// http://gist.github.com/303249\nif (!Date.parse || \"Date.parse is buggy\") {\n    // XXX global assignment won't work in embeddings that use\n    // an alternate object for the context.\n    Date = (function(NativeDate) {\n\n        // Date.length === 7\n        var newDate = function Date(Y, M, D, h, m, s, ms) {\n            var length = arguments.length;\n            if (this instanceof NativeDate) {\n                var date = length == 1 && String(Y) === Y ? // isString(Y)\n                    // We explicitly pass it through parse:\n                    new NativeDate(newDate.parse(Y)) :\n                    // We have to manually make calls depending on argument\n                    // length here\n                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :\n                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :\n                    length >= 5 ? new NativeDate(Y, M, D, h, m) :\n                    length >= 4 ? new NativeDate(Y, M, D, h) :\n                    length >= 3 ? new NativeDate(Y, M, D) :\n                    length >= 2 ? new NativeDate(Y, M) :\n                    length >= 1 ? new NativeDate(Y) :\n                                  new NativeDate();\n                // Prevent mixups with unfixed Date object\n                date.constructor = newDate;\n                return date;\n            }\n            return NativeDate.apply(this, arguments);\n        };\n\n        // 15.9.1.15 Date Time String Format.\n        var isoDateExpression = new RegExp(\"^\" +\n            \"(\\\\d{4}|[\\+\\-]\\\\d{6})\" + // four-digit year capture or sign +\n                                      // 6-digit extended year\n            \"(?:-(\\\\d{2})\" + // optional month capture\n            \"(?:-(\\\\d{2})\" + // optional day capture\n            \"(?:\" + // capture hours:minutes:seconds.milliseconds\n                \"T(\\\\d{2})\" + // hours capture\n                \":(\\\\d{2})\" + // minutes capture\n                \"(?:\" + // optional :seconds.milliseconds\n                    \":(\\\\d{2})\" + // seconds capture\n                    \"(?:\\\\.(\\\\d{3}))?\" + // milliseconds capture\n                \")?\" +\n            \"(\" + // capture UTC offset component\n                \"Z|\" + // UTC capture\n                \"(?:\" + // offset specifier +/-hours:minutes\n                    \"([-+])\" + // sign capture\n                    \"(\\\\d{2})\" + // hours offset capture\n                    \":(\\\\d{2})\" + // minutes offset capture\n                \")\" +\n            \")?)?)?)?\" +\n        \"$\");\n\n        var months = [\n            0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365\n        ];\n\n        function dayFromMonth(year, month) {\n            var t = month > 1 ? 1 : 0;\n            return (\n                months[month] +\n                Math.floor((year - 1969 + t) / 4) -\n                Math.floor((year - 1901 + t) / 100) +\n                Math.floor((year - 1601 + t) / 400) +\n                365 * (year - 1970)\n            );\n        }\n\n        // Copy any custom methods a 3rd party library may have added\n        for (var key in NativeDate) {\n            newDate[key] = NativeDate[key];\n        }\n\n        // Copy \"native\" methods explicitly; they may be non-enumerable\n        newDate.now = NativeDate.now;\n        newDate.UTC = NativeDate.UTC;\n        newDate.prototype = NativeDate.prototype;\n        newDate.prototype.constructor = Date;\n\n        // Upgrade Date.parse to handle simplified ISO 8601 strings\n        newDate.parse = function parse(string) {\n            var match = isoDateExpression.exec(string);\n            if (match) {\n                // parse months, days, hours, minutes, seconds, and milliseconds\n                // provide default values if necessary\n                // parse the UTC offset component\n                var year = Number(match[1]),\n                    month = Number(match[2] || 1) - 1,\n                    day = Number(match[3] || 1) - 1,\n                    hour = Number(match[4] || 0),\n                    minute = Number(match[5] || 0),\n                    second = Number(match[6] || 0),\n                    millisecond = Number(match[7] || 0),\n                    // When time zone is missed, local offset should be used\n                    // (ES 5.1 bug)\n                    // see https://bugs.ecmascript.org/show_bug.cgi?id=112\n                    offset = !match[4] || match[8] ?\n                        0 : Number(new Date(1970, 0)),\n                    signOffset = match[9] === \"-\" ? 1 : -1,\n                    hourOffset = Number(match[10] || 0),\n                    minuteOffset = Number(match[11] || 0),\n                    result;\n                if (\n                    hour < (\n                        minute > 0 || second > 0 || millisecond > 0 ?\n                        24 : 25\n                    ) &&\n                    minute < 60 && second < 60 && millisecond < 1000 &&\n                    month > -1 && month < 12 && hourOffset < 24 &&\n                    minuteOffset < 60 && // detect invalid offsets\n                    day > -1 &&\n                    day < (\n                        dayFromMonth(year, month + 1) -\n                        dayFromMonth(year, month)\n                    )\n                ) {\n                    result = (\n                        (dayFromMonth(year, month) + day) * 24 +\n                        hour +\n                        hourOffset * signOffset\n                    ) * 60;\n                    result = (\n                        (result + minute + minuteOffset * signOffset) * 60 +\n                        second\n                    ) * 1000 + millisecond + offset;\n                    if (-8.64e15 <= result && result <= 8.64e15) {\n                        return result;\n                    }\n                }\n                return NaN;\n            }\n            return NativeDate.parse.apply(this, arguments);\n        };\n\n        return newDate;\n    })(Date);\n}\n\n// ES5 15.9.4.4\n// http://es5.github.com/#x15.9.4.4\nif (!Date.now) {\n    Date.now = function now() {\n        return new Date().getTime();\n    };\n}\n\n\n//\n// String\n// ======\n//\n\n\n// ES5 15.5.4.14\n// http://es5.github.com/#x15.5.4.14\n// [bugfix, chrome]\n// If separator is undefined, then the result array contains just one String,\n// which is the this value (converted to a String). If limit is not undefined,\n// then the output array is truncated so that it contains no more than limit\n// elements.\n// \"0\".split(undefined, 0) -> []\nif(\"0\".split(void 0, 0).length) {\n    var string_split = String.prototype.split;\n    String.prototype.split = function(separator, limit) {\n        if(separator === void 0 && limit === 0)return [];\n        return string_split.apply(this, arguments);\n    }\n}\n\n// ECMA-262, 3rd B.2.3\n// Note an ECMAScript standart, although ECMAScript 3rd Edition has a\n// non-normative section suggesting uniform semantics and it should be\n// normalized across all browsers\n// [bugfix, IE lt 9] IE < 9 substr() with negative value not working in IE\nif(\"\".substr && \"0b\".substr(-1) !== \"b\") {\n    var string_substr = String.prototype.substr;\n    /**\n     *  Get the substring of a string\n     *  @param  {integer}  start   where to start the substring\n     *  @param  {integer}  length  how many characters to return\n     *  @return {string}\n     */\n    String.prototype.substr = function(start, length) {\n        return string_substr.call(\n            this,\n            start < 0 ? (start = this.length + start) < 0 ? 0 : start : start,\n            length\n        );\n    }\n}\n\n// ES5 15.5.4.20\n// http://es5.github.com/#x15.5.4.20\nvar ws = \"\\x09\\x0A\\x0B\\x0C\\x0D\\x20\\xA0\\u1680\\u180E\\u2000\\u2001\\u2002\\u2003\" +\n    \"\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u202F\\u205F\\u3000\\u2028\" +\n    \"\\u2029\\uFEFF\";\nif (!String.prototype.trim || ws.trim()) {\n    // http://blog.stevenlevithan.com/archives/faster-trim-javascript\n    // http://perfectionkills.com/whitespace-deviations/\n    ws = \"[\" + ws + \"]\";\n    var trimBeginRegexp = new RegExp(\"^\" + ws + ws + \"*\"),\n        trimEndRegexp = new RegExp(ws + ws + \"*$\");\n    String.prototype.trim = function trim() {\n        if (this === undefined || this === null) {\n            throw new TypeError(\"can't convert \"+this+\" to object\");\n        }\n        return String(this)\n            .replace(trimBeginRegexp, \"\")\n            .replace(trimEndRegexp, \"\");\n    };\n}\n\n//\n// Util\n// ======\n//\n\n// ES5 9.4\n// http://es5.github.com/#x9.4\n// http://jsperf.com/to-integer\n\nfunction toInteger(n) {\n    n = +n;\n    if (n !== n) { // isNaN\n        n = 0;\n    } else if (n !== 0 && n !== (1/0) && n !== -(1/0)) {\n        n = (n > 0 || -1) * Math.floor(Math.abs(n));\n    }\n    return n;\n}\n\nfunction isPrimitive(input) {\n    var type = typeof input;\n    return (\n        input === null ||\n        type === \"undefined\" ||\n        type === \"boolean\" ||\n        type === \"number\" ||\n        type === \"string\"\n    );\n}\n\nfunction toPrimitive(input) {\n    var val, valueOf, toString;\n    if (isPrimitive(input)) {\n        return input;\n    }\n    valueOf = input.valueOf;\n    if (typeof valueOf === \"function\") {\n        val = valueOf.call(input);\n        if (isPrimitive(val)) {\n            return val;\n        }\n    }\n    toString = input.toString;\n    if (typeof toString === \"function\") {\n        val = toString.call(input);\n        if (isPrimitive(val)) {\n            return val;\n        }\n    }\n    throw new TypeError();\n}\n\n// ES5 9.9\n// http://es5.github.com/#x9.9\nvar toObject = function (o) {\n    if (o == null) { // this matches both null and undefined\n        throw new TypeError(\"can't convert \"+o+\" to object\");\n    }\n    return Object(o);\n};\n\n});\n\n//@ sourceURL=/node_modules/racer/node_modules/es5-shim/es5-shim.js"
));

require.define("events",Function(['require','module','exports','__dirname','__filename','process','global'],"if (!process.EventEmitter) process.EventEmitter = function () {};\n\nvar EventEmitter = exports.EventEmitter = process.EventEmitter;\nvar isArray = typeof Array.isArray === 'function'\n    ? Array.isArray\n    : function (xs) {\n        return Object.prototype.toString.call(xs) === '[object Array]'\n    }\n;\n\n// By default EventEmitters will print a warning if more than\n// 10 listeners are added to it. This is a useful default which\n// helps finding memory leaks.\n//\n// Obviously not all Emitters should be limited to 10. This function allows\n// that to be increased. Set to zero for unlimited.\nvar defaultMaxListeners = 10;\nEventEmitter.prototype.setMaxListeners = function(n) {\n  if (!this._events) this._events = {};\n  this._events.maxListeners = n;\n};\n\n\nEventEmitter.prototype.emit = function(type) {\n  // If there is no 'error' event listener then throw.\n  if (type === 'error') {\n    if (!this._events || !this._events.error ||\n        (isArray(this._events.error) && !this._events.error.length))\n    {\n      if (arguments[1] instanceof Error) {\n        throw arguments[1]; // Unhandled 'error' event\n      } else {\n        throw new Error(\"Uncaught, unspecified 'error' event.\");\n      }\n      return false;\n    }\n  }\n\n  if (!this._events) return false;\n  var handler = this._events[type];\n  if (!handler) return false;\n\n  if (typeof handler == 'function') {\n    switch (arguments.length) {\n      // fast cases\n      case 1:\n        handler.call(this);\n        break;\n      case 2:\n        handler.call(this, arguments[1]);\n        break;\n      case 3:\n        handler.call(this, arguments[1], arguments[2]);\n        break;\n      // slower\n      default:\n        var args = Array.prototype.slice.call(arguments, 1);\n        handler.apply(this, args);\n    }\n    return true;\n\n  } else if (isArray(handler)) {\n    var args = Array.prototype.slice.call(arguments, 1);\n\n    var listeners = handler.slice();\n    for (var i = 0, l = listeners.length; i < l; i++) {\n      listeners[i].apply(this, args);\n    }\n    return true;\n\n  } else {\n    return false;\n  }\n};\n\n// EventEmitter is defined in src/node_events.cc\n// EventEmitter.prototype.emit() is also defined there.\nEventEmitter.prototype.addListener = function(type, listener) {\n  if ('function' !== typeof listener) {\n    throw new Error('addListener only takes instances of Function');\n  }\n\n  if (!this._events) this._events = {};\n\n  // To avoid recursion in the case that type == \"newListeners\"! Before\n  // adding it to the listeners, first emit \"newListeners\".\n  this.emit('newListener', type, listener);\n\n  if (!this._events[type]) {\n    // Optimize the case of one listener. Don't need the extra array object.\n    this._events[type] = listener;\n  } else if (isArray(this._events[type])) {\n\n    // Check for listener leak\n    if (!this._events[type].warned) {\n      var m;\n      if (this._events.maxListeners !== undefined) {\n        m = this._events.maxListeners;\n      } else {\n        m = defaultMaxListeners;\n      }\n\n      if (m && m > 0 && this._events[type].length > m) {\n        this._events[type].warned = true;\n        console.error('(node) warning: possible EventEmitter memory ' +\n                      'leak detected. %d listeners added. ' +\n                      'Use emitter.setMaxListeners() to increase limit.',\n                      this._events[type].length);\n        console.trace();\n      }\n    }\n\n    // If we've already got an array, just append.\n    this._events[type].push(listener);\n  } else {\n    // Adding the second element, need to change to array.\n    this._events[type] = [this._events[type], listener];\n  }\n\n  return this;\n};\n\nEventEmitter.prototype.on = EventEmitter.prototype.addListener;\n\nEventEmitter.prototype.once = function(type, listener) {\n  var self = this;\n  self.on(type, function g() {\n    self.removeListener(type, g);\n    listener.apply(this, arguments);\n  });\n\n  return this;\n};\n\nEventEmitter.prototype.removeListener = function(type, listener) {\n  if ('function' !== typeof listener) {\n    throw new Error('removeListener only takes instances of Function');\n  }\n\n  // does not use listeners(), so no side effect of creating _events[type]\n  if (!this._events || !this._events[type]) return this;\n\n  var list = this._events[type];\n\n  if (isArray(list)) {\n    var i = list.indexOf(listener);\n    if (i < 0) return this;\n    list.splice(i, 1);\n    if (list.length == 0)\n      delete this._events[type];\n  } else if (this._events[type] === listener) {\n    delete this._events[type];\n  }\n\n  return this;\n};\n\nEventEmitter.prototype.removeAllListeners = function(type) {\n  // does not use listeners(), so no side effect of creating _events[type]\n  if (type && this._events && this._events[type]) this._events[type] = null;\n  return this;\n};\n\nEventEmitter.prototype.listeners = function(type) {\n  if (!this._events) this._events = {};\n  if (!this._events[type]) this._events[type] = [];\n  if (!isArray(this._events[type])) {\n    this._events[type] = [this._events[type]];\n  }\n  return this._events[type];\n};\n\n//@ sourceURL=events"
));

require.define("/node_modules/racer/lib/plugin.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var util = require('./util')\n  , mergeAll = util.mergeAll\n  , isServer = util.isServer\n\n    // This tricks Browserify into not logging an error when bundling this file\n  , _require = require\n\n  , plugable = {};\n\nmodule.exports = {\n\n  _makePlugable: function (name, object) {\n    plugable[name] = object;\n  }\n\n  /**\n   * @param {Function} plugin(racer, options)\n   * @param {Object} options that we pass to the plugin invocation\n   */\n, use: function (plugin, options) {\n    if (typeof plugin === 'string') {\n      if (!isServer) return this;\n      plugin = _require(plugin);\n    }\n\n    var decorate = plugin.decorate\n      , target = (decorate === null || decorate === 'racer')\n               ? this\n               : plugable[decorate];\n\n    if (!target) {\n      throw new Error('Invalid plugin.decorate value: ' + decorate);\n    }\n\n    var plugins = target._plugins || (target._plugins = []);\n\n    // Don't include a plugin more than once -- useful in tests where race\n    // conditions exist regarding require and clearing require.cache\n    if (-1 === plugins.indexOf(plugin)) {\n      plugins.push(plugin);\n      plugin(target, options);\n    }\n    return this;\n  }\n\n  // A mixin is an object literal with:\n  //   type:     Name of the racer Klass in which to mixin\n  //   [static]: Class/static methods to add to Klass\n  //   [proto]:  Methods to add to Klass.prototype\n  //   [events]: Event callbacks including 'mixin', 'init', 'socket', etc.\n  //\n  // proto methods may be either a function or an object literal with:\n  //   fn:       The method's function\n  //   [type]:   Optionally add this method to a collection of methods accessible\n  //             via Klass.<type>. If type is a comma-separated string,\n  //             e.g., `type=\"foo,bar\", then this method is added to several\n  //             method collections, e.g., added to `Klass.foo` and `Klass.bar`.\n  //             This is useful for grouping several methods together.\n  //   <other>:  All other key-value pairings are added as properties of the method\n, mixin: function () {\n    var protected = this.protected;\n    for (var i = 0, l = arguments.length; i < l; i++) {\n      var mixin = arguments[i];\n      if (typeof mixin === 'string') {\n        if (!isServer) continue;\n        mixin = _require(mixin);\n      }\n\n      var type = mixin.type;\n      if (!type) throw new Error('Mixins require a type parameter');\n      var Klass = protected[type];\n      if (!Klass) throw new Error('Cannot find racer.protected.' + type);\n\n      if (Klass.mixins) {\n        Klass.mixins.push(mixin);\n      } else {\n        Klass.mixins = [mixin];\n        var self = this;\n        Klass.prototype.mixinEmit = function (name) {\n          var eventName = type + ':' + name\n            , eventArgs = Array.prototype.slice.call(arguments, 1);\n          self.emit.apply(self, [eventName].concat(eventArgs));\n        };\n      }\n\n      if (mixin.decorate) mixin.decorate(Klass);\n      mergeAll(Klass, mixin.static);\n      mergeProto(mixin.proto, Klass);\n\n      var server;\n      if (isServer && (server = mixin.server)) {\n        server = (typeof server === 'string')\n               ? _require(server)\n               : mixin.server;\n        mergeProto(server, Klass);\n      }\n\n      var events = mixin.events;\n      for (var name in events) {\n        var fn = events[name];\n        this.on(type + ':' + name, fn);\n      }\n\n      this.emit(type + ':mixin', Klass);\n    }\n    return this;\n  }\n};\n\nfunction mergeProto (protoSpec, Klass) {\n  var targetProto = Klass.prototype;\n  for (var name in protoSpec) {\n    var descriptor = protoSpec[name];\n    if (typeof descriptor === 'function') {\n      targetProto[name] = descriptor;\n      continue;\n    }\n    var fn = targetProto[name] = descriptor.fn;\n    for (var key in descriptor) {\n      var value = descriptor[key];\n      switch (key) {\n        case 'fn': continue;\n        case 'type':\n          var csGroups = value.split(',');\n          for (var i = 0, l = csGroups.length; i < l; i++) {\n            var groupName = csGroups[i]\n              , methods = Klass[groupName] || (Klass[groupName] = {});\n            methods[name] = fn;\n          }\n          break;\n        default:\n          fn[key] = value;\n      }\n    }\n  }\n}\n\n//@ sourceURL=/node_modules/racer/lib/plugin.js"
));

require.define("/node_modules/racer/node_modules/node-uuid/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"./uuid.js\"}\n//@ sourceURL=/node_modules/racer/node_modules/node-uuid/package.json"
));

require.define("/node_modules/racer/node_modules/node-uuid/uuid.js",Function(['require','module','exports','__dirname','__filename','process','global'],"//     node-uuid/uuid.js\n//\n//     Copyright (c) 2010 Robert Kieffer\n//     Dual licensed under the MIT and GPL licenses.\n//     Documentation and details at https://github.com/broofa/node-uuid\n(function() {\n  var _global = this;\n\n  // Unique ID creation requires a high quality random # generator, but\n  // Math.random() does not guarantee \"cryptographic quality\".  So we feature\n  // detect for more robust APIs, normalizing each method to return 128-bits\n  // (16 bytes) of random data.\n  var mathRNG, nodeRNG, whatwgRNG;\n\n  // Math.random()-based RNG.  All platforms, very fast, unknown quality\n  var _rndBytes = new Array(16);\n  mathRNG = function() {\n    var r, b = _rndBytes, i = 0;\n\n    for (var i = 0, r; i < 16; i++) {\n      if ((i & 0x03) == 0) r = Math.random() * 0x100000000;\n      b[i] = r >>> ((i & 0x03) << 3) & 0xff;\n    }\n\n    return b;\n  }\n\n  // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto\n  // WebKit only (currently), moderately fast, high quality\n  if (_global.crypto && crypto.getRandomValues) {\n    var _rnds = new Uint32Array(4);\n    whatwgRNG = function() {\n      crypto.getRandomValues(_rnds);\n\n      for (var c = 0 ; c < 16; c++) {\n        _rndBytes[c] = _rnds[c >> 2] >>> ((c & 0x03) * 8) & 0xff;\n      }\n      return _rndBytes;\n    }\n  }\n\n  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html\n  // Node.js only, moderately fast, high quality\n  try {\n    var _rb = require('crypto').randomBytes;\n    nodeRNG = _rb && function() {\n      return _rb(16);\n    };\n  } catch (e) {}\n\n  // Select RNG with best quality\n  var _rng = nodeRNG || whatwgRNG || mathRNG;\n\n  // Buffer class to use\n  var BufferClass = typeof(Buffer) == 'function' ? Buffer : Array;\n\n  // Maps for number <-> hex string conversion\n  var _byteToHex = [];\n  var _hexToByte = {};\n  for (var i = 0; i < 256; i++) {\n    _byteToHex[i] = (i + 0x100).toString(16).substr(1);\n    _hexToByte[_byteToHex[i]] = i;\n  }\n\n  // **`parse()` - Parse a UUID into it's component bytes**\n  function parse(s, buf, offset) {\n    var i = (buf && offset) || 0, ii = 0;\n\n    buf = buf || [];\n    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(byte) {\n      if (ii < 16) { // Don't overflow!\n        buf[i + ii++] = _hexToByte[byte];\n      }\n    });\n\n    // Zero out remaining bytes if string was short\n    while (ii < 16) {\n      buf[i + ii++] = 0;\n    }\n\n    return buf;\n  }\n\n  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**\n  function unparse(buf, offset) {\n    var i = offset || 0, bth = _byteToHex;\n    return  bth[buf[i++]] + bth[buf[i++]] +\n            bth[buf[i++]] + bth[buf[i++]] + '-' +\n            bth[buf[i++]] + bth[buf[i++]] + '-' +\n            bth[buf[i++]] + bth[buf[i++]] + '-' +\n            bth[buf[i++]] + bth[buf[i++]] + '-' +\n            bth[buf[i++]] + bth[buf[i++]] +\n            bth[buf[i++]] + bth[buf[i++]] +\n            bth[buf[i++]] + bth[buf[i++]];\n  }\n\n  // **`v1()` - Generate time-based UUID**\n  //\n  // Inspired by https://github.com/LiosK/UUID.js\n  // and http://docs.python.org/library/uuid.html\n\n  // random #'s we need to init node and clockseq\n  var _seedBytes = _rng();\n\n  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)\n  var _nodeId = [\n    _seedBytes[0] | 0x01,\n    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]\n  ];\n\n  // Per 4.2.2, randomize (14 bit) clockseq\n  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;\n\n  // Previous uuid creation time\n  var _lastMSecs = 0, _lastNSecs = 0;\n\n  // See https://github.com/broofa/node-uuid for API details\n  function v1(options, buf, offset) {\n    var i = buf && offset || 0;\n    var b = buf || [];\n\n    options = options || {};\n\n    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;\n\n    // UUID timestamps are 100 nano-second units since the Gregorian epoch,\n    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so\n    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'\n    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.\n    var msecs = options.msecs != null ? options.msecs : new Date().getTime();\n\n    // Per 4.2.1.2, use count of uuid's generated during the current clock\n    // cycle to simulate higher resolution clock\n    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;\n\n    // Time since last uuid creation (in msecs)\n    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;\n\n    // Per 4.2.1.2, Bump clockseq on clock regression\n    if (dt < 0 && options.clockseq == null) {\n      clockseq = clockseq + 1 & 0x3fff;\n    }\n\n    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new\n    // time interval\n    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {\n      nsecs = 0;\n    }\n\n    // Per 4.2.1.2 Throw error if too many uuids are requested\n    if (nsecs >= 10000) {\n      throw new Error('uuid.v1(): Can\\'t create more than 10M uuids/sec');\n    }\n\n    _lastMSecs = msecs;\n    _lastNSecs = nsecs;\n    _clockseq = clockseq;\n\n    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch\n    msecs += 12219292800000;\n\n    // `time_low`\n    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;\n    b[i++] = tl >>> 24 & 0xff;\n    b[i++] = tl >>> 16 & 0xff;\n    b[i++] = tl >>> 8 & 0xff;\n    b[i++] = tl & 0xff;\n\n    // `time_mid`\n    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;\n    b[i++] = tmh >>> 8 & 0xff;\n    b[i++] = tmh & 0xff;\n\n    // `time_high_and_version`\n    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version\n    b[i++] = tmh >>> 16 & 0xff;\n\n    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)\n    b[i++] = clockseq >>> 8 | 0x80;\n\n    // `clock_seq_low`\n    b[i++] = clockseq & 0xff;\n\n    // `node`\n    var node = options.node || _nodeId;\n    for (var n = 0; n < 6; n++) {\n      b[i + n] = node[n];\n    }\n\n    return buf ? buf : unparse(b);\n  }\n\n  // **`v4()` - Generate random UUID**\n\n  // See https://github.com/broofa/node-uuid for API details\n  function v4(options, buf, offset) {\n    // Deprecated - 'format' argument, as supported in v1.2\n    var i = buf && offset || 0;\n\n    if (typeof(options) == 'string') {\n      buf = options == 'binary' ? new BufferClass(16) : null;\n      options = null;\n    }\n    options = options || {};\n\n    var rnds = options.random || (options.rng || _rng)();\n\n    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`\n    rnds[6] = (rnds[6] & 0x0f) | 0x40;\n    rnds[8] = (rnds[8] & 0x3f) | 0x80;\n\n    // Copy bytes to buffer, if provided\n    if (buf) {\n      for (var ii = 0; ii < 16; ii++) {\n        buf[i + ii] = rnds[ii];\n      }\n    }\n\n    return buf || unparse(rnds);\n  }\n\n  // Export public API\n  var uuid = v4;\n  uuid.v1 = v1;\n  uuid.v4 = v4;\n  uuid.parse = parse;\n  uuid.unparse = unparse;\n  uuid.BufferClass = BufferClass;\n\n  // Export RNG options\n  uuid.mathRNG = mathRNG;\n  uuid.nodeRNG = nodeRNG;\n  uuid.whatwgRNG = whatwgRNG;\n\n  if (typeof(module) != 'undefined') {\n    // Play nice with node.js\n    module.exports = uuid;\n  } else {\n    // Play nice with browsers\n    var _previousRoot = _global.uuid;\n\n    // **`noConflict()` - (browser only) to reset global 'uuid' var**\n    uuid.noConflict = function() {\n      _global.uuid = _previousRoot;\n      return uuid;\n    }\n    _global.uuid = uuid;\n  }\n}());\n\n//@ sourceURL=/node_modules/racer/node_modules/node-uuid/uuid.js"
));

require.define("crypto",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = require(\"crypto-browserify\")\n//@ sourceURL=crypto"
));

require.define("/node_modules/crypto-browserify/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {}\n//@ sourceURL=/node_modules/crypto-browserify/package.json"
));

require.define("/node_modules/crypto-browserify/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var sha = require('./sha')\nvar rng = require('./rng')\n\nvar algorithms = {\n  sha1: {\n    hex: sha.hex_sha1,\n    binary: sha.b64_sha1,\n    ascii: sha.str_sha1\n  }\n}\n\nfunction error () {\n  var m = [].slice.call(arguments).join(' ')\n  throw new Error([\n    m,\n    'we accept pull requests',\n    'http://github.com/dominictarr/crypto-browserify'\n    ].join('\\n'))\n}\n\nexports.createHash = function (alg) {\n  alg = alg || 'sha1'\n  if(!algorithms[alg])\n    error('algorithm:', alg, 'is not yet supported')\n  var s = ''\n  var _alg = algorithms[alg]\n  return {\n    update: function (data) {\n      s += data\n      return this\n    },\n    digest: function (enc) {\n      enc = enc || 'binary'\n      var fn\n      if(!(fn = _alg[enc]))\n        error('encoding:', enc , 'is not yet supported for algorithm', alg)\n      var r = fn(s)\n      s = null //not meant to use the hash after you've called digest.\n      return r\n    }\n  }\n}\n\nexports.randomBytes = function(size, callback) {\n  if (callback && callback.call) {\n    try {\n      callback.call(this, undefined, rng(size));\n    } catch (err) { callback(err); }\n  } else {\n    return rng(size);\n  }\n}\n\n// the least I can do is make error messages for the rest of the node.js/crypto api.\n;['createCredentials'\n, 'createHmac'\n, 'createCypher'\n, 'createCypheriv'\n, 'createDecipher'\n, 'createDecipheriv'\n, 'createSign'\n, 'createVerify'\n, 'createDeffieHellman'\n, 'pbkdf2'].forEach(function (name) {\n  exports[name] = function () {\n    error('sorry,', name, 'is not implemented yet')\n  }\n})\n\n//@ sourceURL=/node_modules/crypto-browserify/index.js"
));

require.define("/node_modules/crypto-browserify/sha.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/*\n * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined\n * in FIPS PUB 180-1\n * Version 2.1a Copyright Paul Johnston 2000 - 2002.\n * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet\n * Distributed under the BSD License\n * See http://pajhome.org.uk/crypt/md5 for details.\n */\n\nexports.hex_sha1 = hex_sha1;\nexports.b64_sha1 = b64_sha1;\nexports.str_sha1 = str_sha1;\nexports.hex_hmac_sha1 = hex_hmac_sha1;\nexports.b64_hmac_sha1 = b64_hmac_sha1;\nexports.str_hmac_sha1 = str_hmac_sha1;\n\n/*\n * Configurable variables. You may need to tweak these to be compatible with\n * the server-side, but the defaults work in most cases.\n */\nvar hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */\nvar b64pad  = \"\"; /* base-64 pad character. \"=\" for strict RFC compliance   */\nvar chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */\n\n/*\n * These are the functions you'll usually want to call\n * They take string arguments and return either hex or base-64 encoded strings\n */\nfunction hex_sha1(s){return binb2hex(core_sha1(str2binb(s),s.length * chrsz));}\nfunction b64_sha1(s){return binb2b64(core_sha1(str2binb(s),s.length * chrsz));}\nfunction str_sha1(s){return binb2str(core_sha1(str2binb(s),s.length * chrsz));}\nfunction hex_hmac_sha1(key, data){ return binb2hex(core_hmac_sha1(key, data));}\nfunction b64_hmac_sha1(key, data){ return binb2b64(core_hmac_sha1(key, data));}\nfunction str_hmac_sha1(key, data){ return binb2str(core_hmac_sha1(key, data));}\n\n/*\n * Perform a simple self-test to see if the VM is working\n */\nfunction sha1_vm_test()\n{\n  return hex_sha1(\"abc\") == \"a9993e364706816aba3e25717850c26c9cd0d89d\";\n}\n\n/*\n * Calculate the SHA-1 of an array of big-endian words, and a bit length\n */\nfunction core_sha1(x, len)\n{\n  /* append padding */\n  x[len >> 5] |= 0x80 << (24 - len % 32);\n  x[((len + 64 >> 9) << 4) + 15] = len;\n\n  var w = Array(80);\n  var a =  1732584193;\n  var b = -271733879;\n  var c = -1732584194;\n  var d =  271733878;\n  var e = -1009589776;\n\n  for(var i = 0; i < x.length; i += 16)\n  {\n    var olda = a;\n    var oldb = b;\n    var oldc = c;\n    var oldd = d;\n    var olde = e;\n\n    for(var j = 0; j < 80; j++)\n    {\n      if(j < 16) w[j] = x[i + j];\n      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);\n      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),\n                       safe_add(safe_add(e, w[j]), sha1_kt(j)));\n      e = d;\n      d = c;\n      c = rol(b, 30);\n      b = a;\n      a = t;\n    }\n\n    a = safe_add(a, olda);\n    b = safe_add(b, oldb);\n    c = safe_add(c, oldc);\n    d = safe_add(d, oldd);\n    e = safe_add(e, olde);\n  }\n  return Array(a, b, c, d, e);\n\n}\n\n/*\n * Perform the appropriate triplet combination function for the current\n * iteration\n */\nfunction sha1_ft(t, b, c, d)\n{\n  if(t < 20) return (b & c) | ((~b) & d);\n  if(t < 40) return b ^ c ^ d;\n  if(t < 60) return (b & c) | (b & d) | (c & d);\n  return b ^ c ^ d;\n}\n\n/*\n * Determine the appropriate additive constant for the current iteration\n */\nfunction sha1_kt(t)\n{\n  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :\n         (t < 60) ? -1894007588 : -899497514;\n}\n\n/*\n * Calculate the HMAC-SHA1 of a key and some data\n */\nfunction core_hmac_sha1(key, data)\n{\n  var bkey = str2binb(key);\n  if(bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);\n\n  var ipad = Array(16), opad = Array(16);\n  for(var i = 0; i < 16; i++)\n  {\n    ipad[i] = bkey[i] ^ 0x36363636;\n    opad[i] = bkey[i] ^ 0x5C5C5C5C;\n  }\n\n  var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);\n  return core_sha1(opad.concat(hash), 512 + 160);\n}\n\n/*\n * Add integers, wrapping at 2^32. This uses 16-bit operations internally\n * to work around bugs in some JS interpreters.\n */\nfunction safe_add(x, y)\n{\n  var lsw = (x & 0xFFFF) + (y & 0xFFFF);\n  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);\n  return (msw << 16) | (lsw & 0xFFFF);\n}\n\n/*\n * Bitwise rotate a 32-bit number to the left.\n */\nfunction rol(num, cnt)\n{\n  return (num << cnt) | (num >>> (32 - cnt));\n}\n\n/*\n * Convert an 8-bit or 16-bit string to an array of big-endian words\n * In 8-bit function, characters >255 have their hi-byte silently ignored.\n */\nfunction str2binb(str)\n{\n  var bin = Array();\n  var mask = (1 << chrsz) - 1;\n  for(var i = 0; i < str.length * chrsz; i += chrsz)\n    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);\n  return bin;\n}\n\n/*\n * Convert an array of big-endian words to a string\n */\nfunction binb2str(bin)\n{\n  var str = \"\";\n  var mask = (1 << chrsz) - 1;\n  for(var i = 0; i < bin.length * 32; i += chrsz)\n    str += String.fromCharCode((bin[i>>5] >>> (32 - chrsz - i%32)) & mask);\n  return str;\n}\n\n/*\n * Convert an array of big-endian words to a hex string.\n */\nfunction binb2hex(binarray)\n{\n  var hex_tab = hexcase ? \"0123456789ABCDEF\" : \"0123456789abcdef\";\n  var str = \"\";\n  for(var i = 0; i < binarray.length * 4; i++)\n  {\n    str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +\n           hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);\n  }\n  return str;\n}\n\n/*\n * Convert an array of big-endian words to a base-64 string\n */\nfunction binb2b64(binarray)\n{\n  var tab = \"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\";\n  var str = \"\";\n  for(var i = 0; i < binarray.length * 4; i += 3)\n  {\n    var triplet = (((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16)\n                | (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 )\n                |  ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);\n    for(var j = 0; j < 4; j++)\n    {\n      if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;\n      else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);\n    }\n  }\n  return str;\n}\n\n\n//@ sourceURL=/node_modules/crypto-browserify/sha.js"
));

require.define("/node_modules/crypto-browserify/rng.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// Original code adapted from Robert Kieffer.\n// details at https://github.com/broofa/node-uuid\n(function() {\n  var _global = this;\n\n  var mathRNG, whatwgRNG;\n\n  // NOTE: Math.random() does not guarantee \"cryptographic quality\"\n  mathRNG = function(size) {\n    var bytes = new Array(size);\n    var r;\n\n    for (var i = 0, r; i < size; i++) {\n      if ((i & 0x03) == 0) r = Math.random() * 0x100000000;\n      bytes[i] = r >>> ((i & 0x03) << 3) & 0xff;\n    }\n\n    return bytes;\n  }\n\n  // currently only available in webkit-based browsers.\n  if (_global.crypto && crypto.getRandomValues) {\n    var _rnds = new Uint32Array(4);\n    whatwgRNG = function(size) {\n      var bytes = new Array(size);\n      crypto.getRandomValues(_rnds);\n\n      for (var c = 0 ; c < size; c++) {\n        bytes[c] = _rnds[c >> 2] >>> ((c & 0x03) * 8) & 0xff;\n      }\n      return bytes;\n    }\n  }\n\n  module.exports = whatwgRNG || mathRNG;\n\n}())\n//@ sourceURL=/node_modules/crypto-browserify/rng.js"
));

require.define("/node_modules/racer/lib/Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var EventEmitter = require('events').EventEmitter\n  , Memory = require('./Memory')\n  , eventRegExp = require('./path').eventRegExp\n  , mergeAll = require('./util').mergeAll\n  , uuid = require('node-uuid')\n  ;\n\nmodule.exports = Model;\n\nfunction Model (init) {\n  for (var k in init) {\n    this[k] = init[k];\n  }\n  this._memory = new Memory();\n  // Set max listeners to unlimited\n  this.setMaxListeners(0);\n\n  // Used for model scopes\n  this._root = this;\n  this.mixinEmit('init', this);\n\n  this.middleware = {};\n  this.mixinEmit('middleware', this, this.middleware);\n}\n\nvar modelProto = Model.prototype\n  , emitterProto = EventEmitter.prototype;\n\nmergeAll(modelProto, emitterProto, {\n  id: function () {\n    return uuid.v4();\n  }\n\n  /* Socket.io communication */\n\n, connected: true\n, canConnect: true\n\n, _setSocket: function (socket) {\n    this.socket = socket;\n    this.mixinEmit('socket', this, socket);\n    this.disconnect = function () {\n      socket.disconnect();\n    };\n    this.connect = function (callback) {\n      if (callback) socket.once('connect', callback);\n      socket.socket.connect();\n    };\n\n    var self = this;\n    this.canConnect = true;\n    function onFatalErr () {\n      self.canConnect = false;\n      self.emit('canConnect', false);\n      onConnected();\n      socket.disconnect();\n    }\n    socket.on('fatalErr', onFatalErr);\n\n    this.connected = false;\n    function onConnected () {\n      var connected = self.connected;\n      self.emit(connected ? 'connect' : 'disconnect');\n      self.emit('connected', connected);\n      self.emit('connectionStatus', connected, self.canConnect);\n    }\n\n    socket.on('connect', function () {\n      self.connected = true;\n      onConnected();\n    });\n\n    socket.on('disconnect', function () {\n      self.connected = false;\n      // Slight delay after disconnect so that offline does not flash on reload\n      setTimeout(onConnected, 400);\n    });\n\n    socket.on('error', function (err) {\n      if (~err.indexOf('unauthorized')) onFatalErr();\n    });\n\n    if (typeof window !== 'undefined') {\n      // The server can ask the client to reload itself\n      socket.on('reload', function () {\n        window.location.reload();\n      });\n    }\n\n    // Needed in case page is loaded from cache while offline\n    socket.on('connect_failed', onConnected);\n  }\n\n  /* Scoped Models */\n\n  /**\n   * Create a model object scoped to a particular path.\n   * Example:\n   *     var user = model.at('users.1');\n   *     user.set('username', 'brian');\n   *     user.on('push', 'todos', function (todo) {\n   *       // ...\n   *     });\n   *\n   *  @param {String} segment\n   *  @param {Boolean} absolute\n   *  @return {Model} a scoped model\n   *  @api public\n   */\n, at: function (segment, absolute) {\n    var at = this._at\n      , val = (at && !absolute)\n            ? (segment === '')\n              ? at\n              : at + '.' + segment\n            : segment.toString()\n    return Object.create(this, { _at: { value: val } });\n  }\n\n  /**\n   * Returns a model scope that is a number of levels above the current scoped\n   * path. Number of levels defaults to 1, so this method called without\n   * arguments returns the model scope's parent model scope.\n   *\n   * @optional @param {Number} levels\n   * @return {Model} a scoped model\n   */\n, parent: function (levels) {\n    if (! levels) levels = 1;\n    var at = this._at;\n    if (!at) return this;\n    var segments = at.split('.');\n    return this.at(segments.slice(0, segments.length - levels).join('.'), true);\n  }\n\n  /**\n   * Returns the path equivalent to the path of the current scoped model plus\n   * the suffix path `rest`\n   *\n   * @optional @param {String} rest\n   * @return {String} absolute path\n   * @api public\n   */\n, path: function (rest) {\n    var at = this._at;\n    if (at) {\n      if (rest) return at + '.' + rest;\n      return at;\n    }\n    return rest || '';\n  }\n\n  /**\n   * Returns the last property segment of the current model scope path\n   *\n   * @optional @param {String} path\n   * @return {String}\n   */\n, leaf: function (path) {\n    if (!path) path = this._at || '';\n    var i = path.lastIndexOf('.');\n    return path.substr(i+1);\n  }\n\n  /* Model events */\n\n  // EventEmitter.prototype.on, EventEmitter.prototype.addListener, and\n  // EventEmitter.prototype.once return `this`. The Model equivalents return\n  // the listener instead, since it is made internally for method subscriptions\n  // and may need to be passed to removeListener.\n\n, _on: emitterProto.on\n, on: function (type, pattern, callback) {\n    var self = this\n      , listener = eventListener(type, pattern, callback, this._at);\n    this._on(type, listener);\n    listener.cleanup = function () {\n      self.removeListener(type, listener);\n    }\n    return listener;\n  }\n\n, _once: emitterProto.once\n, once: function (type, pattern, callback) {\n    var listener = eventListener(type, pattern, callback, this._at)\n      , self;\n    this._on( type, function g () {\n      var matches = listener.apply(null, arguments);\n      if (matches) this.removeListener(type, g);\n    });\n    return listener;\n  }\n\n  /**\n   * Used to pass an additional argument to local events. This value is added\n   * to the event arguments in txns/mixin.Model\n   * Example:\n   *     model.pass({ ignore: domId }).move('arr', 0, 2);\n   *\n   * @param {Object} arg\n   * @return {Model} an Object that prototypically inherits from the calling\n   * Model instance, but with a _pass attribute equivalent to `arg`.\n   * @api public\n   */\n, pass: function (arg) {\n    return Object.create(this, { _pass: { value: arg } });\n  }\n});\n\nmodelProto.addListener = modelProto.on;\n\n/**\n * Returns a function that is assigned as an event listener on method events\n * such as 'set', 'insert', etc.\n *\n * Possible function signatures are:\n *\n * - eventListener(method, pattern, callback, at)\n * - eventListener(method, pattern, callback)\n * - eventListener(method, callback)\n *\n * @param {String} method\n * @param {String} pattern\n * @param {Function} callback\n * @param {String} at\n * @return {Function} function ([path, args...], out, isLocal, pass)\n */\nfunction eventListener (method, pattern, callback, at) {\n  if (at) {\n    if (typeof pattern === 'string') {\n      pattern = at + '.' + pattern;\n    } else if (pattern.call) {\n      callback = pattern;\n      pattern = at;\n    } else {\n      throw new Error('Unsupported event pattern on scoped model');\n    }\n\n    // on(type, listener)\n    // Test for function by looking for call, since pattern can be a RegExp,\n    // which has typeof pattern === 'function' as well\n  } else if ((typeof pattern === 'function') && pattern.call) {\n    return pattern;\n  }\n\n  // on(method, pattern, callback)\n  var regexp = eventRegExp(pattern);\n\n  if (method === 'mutator') {\n    return function (mutatorMethod, _arguments) {\n      var args = _arguments[0]\n        , path = args[0];\n      if (! regexp.test(path)) return;\n\n      var captures = regexp.exec(path).slice(1)\n        , callbackArgs = captures.concat([mutatorMethod, _arguments]);\n      callback.apply(null, callbackArgs);\n      return true;\n    }\n  }\n\n  return function (args, out, isLocal, pass) {\n    var path = args[0];\n    if (! regexp.test(path)) return;\n\n    args = args.slice(1);\n    var captures = regexp.exec(path).slice(1)\n      , callbackArgs = captures.concat(args).concat([out, isLocal, pass]);\n    callback.apply(null, callbackArgs);\n    return true;\n  };\n}\n\n//@ sourceURL=/node_modules/racer/lib/Model.js"
));

require.define("/node_modules/racer/lib/Memory.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// Generated by CoffeeScript 1.3.3\nvar Memory, clone, create, createArray, createObject, isPrivate, lookup, lookupSet, _ref,\n  __slice = [].slice;\n\n_ref = require('./util/speculative'), clone = _ref.clone, create = _ref.create, createObject = _ref.createObject, createArray = _ref.createArray;\n\nisPrivate = require('./path').isPrivate;\n\nMemory = module.exports = function() {\n  this.flush();\n};\n\nMemory.prototype = {\n  flush: function() {\n    this._data = {\n      world: {}\n    };\n    return this.version = 0;\n  },\n  init: function(obj) {\n    this._data = {\n      world: obj.data\n    };\n    return this.version = obj.ver;\n  },\n  eraseNonPrivate: function() {\n    var path, world;\n    world = this._data.world;\n    for (path in world) {\n      if (!isPrivate(path)) {\n        delete world[path];\n      }\n    }\n  },\n  toJSON: function() {\n    return {\n      data: this._data.world,\n      ver: this.version\n    };\n  },\n  setVersion: function(ver) {\n    return this.version = Math.max(this.version, ver);\n  },\n  get: function(path, data, getRef) {\n    data || (data = this._data);\n    data.$deref = null;\n    if (path) {\n      return lookup(path, data, getRef);\n    }\n    return data.world;\n  },\n  set: function(path, value, ver, data) {\n    var obj, parent, prop, segments, _ref1, _ref2;\n    this.setVersion(ver);\n    _ref1 = lookupSet(path, data || this._data, ver == null, 'object'), obj = _ref1[0], parent = _ref1[1], prop = _ref1[2];\n    parent[prop] = value;\n    segments = path.split('.');\n    if (segments.length === 2 && value && value.constructor === Object) {\n      if ((_ref2 = value.id) == null) {\n        value.id = segments[1];\n      }\n    }\n    return obj;\n  },\n  del: function(path, ver, data) {\n    var grandparent, index, obj, parent, parentClone, parentPath, parentProp, prop, speculative, _ref1, _ref2;\n    this.setVersion(ver);\n    data || (data = this._data);\n    speculative = ver == null;\n    _ref1 = lookupSet(path, data, speculative), obj = _ref1[0], parent = _ref1[1], prop = _ref1[2];\n    if (ver != null) {\n      if (parent) {\n        delete parent[prop];\n      }\n      return obj;\n    }\n    if (!parent) {\n      return obj;\n    }\n    if (~(index = path.lastIndexOf('.'))) {\n      parentPath = path.substr(0, index);\n      _ref2 = lookupSet(parentPath, data, speculative), parent = _ref2[0], grandparent = _ref2[1], parentProp = _ref2[2];\n    } else {\n      parent = data.world;\n      grandparent = data;\n      parentProp = 'world';\n    }\n    parentClone = clone(parent);\n    delete parentClone[prop];\n    grandparent[parentProp] = parentClone;\n    return obj;\n  },\n  push: function() {\n    var args, arr, data, path, ver, _i;\n    path = arguments[0], args = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), ver = arguments[_i++], data = arguments[_i++];\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new TypeError(\"\" + arr + \" is not an Array\");\n    }\n    return arr.push.apply(arr, args);\n  },\n  unshift: function() {\n    var args, arr, data, path, ver, _i;\n    path = arguments[0], args = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), ver = arguments[_i++], data = arguments[_i++];\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new TypeError(\"\" + arr + \" is not an Array\");\n    }\n    return arr.unshift.apply(arr, args);\n  },\n  insert: function() {\n    var args, arr, data, index, len, path, ver, _i;\n    path = arguments[0], index = arguments[1], args = 5 <= arguments.length ? __slice.call(arguments, 2, _i = arguments.length - 2) : (_i = 2, []), ver = arguments[_i++], data = arguments[_i++];\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new TypeError(\"\" + arr + \" is not an Array\");\n    }\n    len = arr.length;\n    arr.splice.apply(arr, [index, 0].concat(__slice.call(args)));\n    return arr.length;\n  },\n  pop: function(path, ver, data) {\n    var arr;\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new TypeError(\"\" + arr + \" is not an Array\");\n    }\n    return arr.pop();\n  },\n  shift: function(path, ver, data) {\n    var arr;\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new TypeError(\"\" + arr + \" is not an Array\");\n    }\n    return arr.shift();\n  },\n  remove: function(path, index, howMany, ver, data) {\n    var arr, len;\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new TypeError(\"\" + arr + \" is not an Array\");\n    }\n    len = arr.length;\n    return arr.splice(index, howMany);\n  },\n  move: function(path, from, to, howMany, ver, data) {\n    var arr, len, values;\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new TypeError(\"\" + arr + \" is not an Array\");\n    }\n    len = arr.length;\n    from = +from;\n    to = +to;\n    if (from < 0) {\n      from += len;\n    }\n    if (to < 0) {\n      to += len;\n    }\n    values = arr.splice(from, howMany);\n    arr.splice.apply(arr, [to, 0].concat(__slice.call(values)));\n    return values;\n  }\n};\n\nlookup = function(path, data, getRef) {\n  var curr, i, len, prop, props, refOut, _ref1;\n  props = path.split('.');\n  len = props.length;\n  i = 0;\n  curr = data.world;\n  path = '';\n  while (i < len) {\n    prop = props[i++];\n    curr = curr[prop];\n    path = path ? path + '.' + prop : prop;\n    if (typeof curr === 'function') {\n      if (getRef && i === len) {\n        break;\n      }\n      _ref1 = refOut = curr(lookup, data, path, props, len, i), curr = _ref1[0], path = _ref1[1], i = _ref1[2];\n    }\n    if (curr == null) {\n      break;\n    }\n  }\n  return curr;\n};\n\nlookupSet = Memory.lookupSet = function(path, data, speculative, pathType) {\n  var curr, firstProp, i, len, parent, prop, props;\n  props = path.split('.');\n  len = props.length;\n  i = 0;\n  curr = data.world = speculative ? create(data.world) : data.world;\n  firstProp = props[0];\n  while (i < len) {\n    prop = props[i++];\n    parent = curr;\n    curr = curr[prop];\n    if (curr != null) {\n      if (speculative && typeof curr === 'object') {\n        curr = parent[prop] = create(curr);\n      }\n    } else {\n      if (pathType === 'object') {\n        if ((i !== 1 || isPrivate(firstProp)) && /^[0-9]+$/.test(props[i])) {\n          curr = parent[prop] = speculative ? createArray() : [];\n        } else if (i !== len) {\n          curr = parent[prop] = speculative ? createObject() : {};\n          if (i === 2 && !isPrivate(firstProp)) {\n            curr.id = prop;\n          }\n        }\n      } else if (pathType === 'array') {\n        if (i === len) {\n          curr = parent[prop] = speculative ? createArray() : [];\n        } else {\n          curr = parent[prop] = speculative ? createObject() : {};\n          if (i === 2 && !isPrivate(firstProp)) {\n            curr.id = prop;\n          }\n        }\n      } else {\n        if (i !== len) {\n          parent = curr = void 0;\n        }\n        return [curr, parent, prop];\n      }\n    }\n  }\n  return [curr, parent, prop];\n};\n\n//@ sourceURL=/node_modules/racer/lib/Memory.js"
));

require.define("/node_modules/racer/lib/util/speculative.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var util = require('./index')\n  , merge = util.merge;\n\nmodule.exports =\nutil.speculative = {\n  createObject: function () { return {$spec: true}; }\n\n, createArray: function () {\n    var obj = [];\n    obj.$spec = true;\n    return obj;\n  }\n\n, create: function (proto) {\n    if (proto.$spec) return proto;\n\n    if (Array.isArray(proto)) {\n      // TODO Slicing is obviously going to be inefficient on large arrays, but\n      // inheriting from arrays is problematic. Eventually it would be good to\n      // implement something faster in browsers that could support it. See:\n      // http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/#wrappers_prototype_chain_injection\n      var obj = proto.slice();\n      obj.$spec = true;\n      return obj\n    }\n\n    return Object.create(proto, { $spec: { value: true } });\n  }\n\n, clone: function (proto) {\n    if (Array.isArray(proto)) {\n      var obj = proto.slice();\n      obj.$spec = true;\n      return obj;\n    }\n\n    return merge({}, proto);\n  }\n\n, isSpeculative: function (obj) {\n    return obj && obj.$spec;\n  }\n\n, identifier: '$spec' // Used in tests\n};\n\n//@ sourceURL=/node_modules/racer/lib/util/speculative.js"
));

require.define("/node_modules/racer/lib/path.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var util = require('./util')\n  , hasKeys = util.hasKeys;\n\nutil.path = exports;\n\n// Test to see if path name contains a segment that starts with an underscore.\n// Such a path is private to the current session and should not be stored\n// in persistent storage or synced with other clients.\nexports.isPrivate = function isPrivate (name) { return /(?:^_)|(?:\\._)/.test(name); };\n\nexports.isPattern = function isPattern (x) { return -1 === x.indexOf('*'); };\n\nfunction createEachMatch (matchHandler, fields) {\n  fields = fields.split('');\n  return function eachMatch (match, index, pattern) {\n    // Escape special characters\n    if (~fields.indexOf(match) && match in matchHandler) {\n      return matchHandler[match];\n    }\n\n    // An asterisk matches any single path segment in the middle and any path\n    // or paths at the end\n    if (pattern.length - index === 1) return '(.+)';\n\n    return '([^.]+)';\n  }\n}\nexports.eventRegExp = function eventRegExp (pattern) {\n  if (pattern instanceof RegExp) return pattern;\n  var self = this;\n  var inner;\n  var matchHandler = {\n    '.': '\\\\.'\n  , '$': '\\\\$'\n  , '^': '\\\\^'\n  , '[': '\\\\['\n  , ']': '\\\\]'\n\n    // Commas can be used for or, as in path.(one,two)\n  , ',': '|'\n  };\n  var eachMatch;\n  if (pattern.substring(0, 9) === '_$queries') {\n    eachMatch = createEachMatch(matchHandler, '.*$^[]');\n    inner = '_\\\\$queries\\\\.' + pattern.substring(10).replace(/[.*$^\\[\\]]/g, eachMatch);\n  } else {\n    eachMatch = createEachMatch(matchHandler, ',.*$');\n    inner = pattern.replace(/[,.*$]/g, eachMatch);\n  }\n  return new RegExp('^' + inner + '$');\n};\n\nexports.regExp = function regExp (pattern) {\n  // Match anything if there is no pattern or the pattern is ''\n  if (! pattern) return /^/;\n\n  return new RegExp('^' + pattern.replace(/[.*$]/g, function (match, index) {\n    // Escape periods\n    if (match === '.') return '\\\\.';\n\n    if (match === '$') return '\\\\$';\n\n    // An asterisk matches any single path segment in the middle\n    return '[^.]+';\n\n    // All subscriptions match the root and any path below the root\n  }) + '(?:\\\\.|$)');\n};\n\n// Create regular expression matching the path or any of its parents\nexports.regExpPathOrParent = function regExpPathOrParent (path, levels) {\n  var p = ''\n    , parts = path.split('.')\n    , source = [];\n\n  for (var i = 0, l = parts.length - (levels || 0); i < l; i++) {\n    var segment = parts[i];\n    p += i ? '\\\\.' + segment\n           : segment;\n    source.push( '(?:' + p + ')' );\n  }\n  source = source.join('|');\n  return new RegExp('^(?:' + source + ')$');\n};\n\n// Create regular expression matching any of the paths or child paths of any of\n// the paths\nexports.regExpPathsOrChildren = function regExpPathsOrChildren (paths) {\n  var source = [];\n  for (var i = 0, l = paths.length; i < l; i++) {\n    var path = paths[i];\n    source.push( '(?:' + path + \"(?:\\\\..+)?)\" );\n  }\n  source = source.join('|');\n  return new RegExp('^(?:' + source + ')$');\n};\n\nexports.lookup = lookup;\n\nfunction lookup (path, obj) {\n  if (!obj) return;\n  if (path.indexOf('.') === -1) return obj[path];\n\n  var parts = path.split('.');\n  for (var i = 0, l = parts.length; i < l; i++) {\n    if (!obj) return obj;\n\n    var prop = parts[i];\n    obj = obj[prop];\n  }\n  return obj;\n};\n\nexports.assign = assign;\n\nfunction assign (obj, path, val) {\n  var parts = path.split('.')\n    , lastIndex = parts.length - 1;\n  for (var i = 0, l = parts.length; i < l; i++) {\n    var prop = parts[i];\n    if (i === lastIndex) obj[prop] = val;\n    else                 obj = obj[prop] || (obj[prop] = {});\n  }\n};\n\nexports.objectWithOnly = function objectWithOnly (obj, paths) {\n  var projectedDoc = {};\n  for (var i = 0, l = paths.length; i < l; i++) {\n    var path = paths[i];\n    assign(projectedDoc, path, lookup(path, obj));\n  }\n  return projectedDoc;\n};\n\nexports.objectExcept = function objectExcept (from, exceptions) {\n  if (! from) return;\n  var to = Array.isArray(from) ? [] : {};\n  for (var key in from) {\n    // Skip exact exception matches\n    if (~exceptions.indexOf(key)) continue;\n\n    var nextExceptions = [];\n    for (var i = exceptions.length; i--; ) {\n      var except = exceptions[i]\n        , periodPos = except.indexOf('.')\n        , prefix = except.substring(0, periodPos);\n      if (prefix === key) {\n        nextExceptions.push(except.substring(periodPos + 1, except.length));\n      }\n    }\n    if (nextExceptions.length) {\n      var nested = objectExcept( from[key], nextExceptions );\n      if (hasKeys(nested)) to[key] = nested;\n    } else {\n      if (Array.isArray(from)) key = parseInt(key, 10);\n      to[key] = from[key];\n    }\n  }\n  return to;\n};\n\n/**\n * TODO Rename to isPrefixOf because more String generic? (no path implication)\n * Returns true if `prefix` is a prefix of `path`. Otherwise, returns false.\n * @param {String} prefix\n * @param {String} path\n * @return {Boolean}\n */\nexports.isSubPathOf = function isSubPathOf (path, fullPath) {\n  return path === fullPath.substring(0, path.length);\n};\n\nexports.split = function split (path) {\n  return path.split(/\\.?[(*]\\.?/);\n};\n\nexports.expand = function expand (path) {\n  // Remove whitespace and line break characters\n  path = path.replace(/[\\s\\n]/g, '');\n\n  // Return right away if path doesn't contain any groups\n  if (! ~path.indexOf('(')) return [path];\n\n  // Break up path groups into a list of equivalent paths that contain only\n  // names and *\n  var paths = [''], out = []\n    , stack = { paths: paths, out: out}\n    , lastClosed;\n  while (path) {\n    var match = /^([^,()]*)([,()])(.*)/.exec(path);\n    if (! match) return out.map( function (val) { return val + path; });\n    var pre = match[1]\n      , token = match[2];\n    path = match[3]\n\n    if (pre) {\n      paths = paths.map( function (val) { return val + pre; });\n      if (token !== '(') {\n        var out = lastClosed ? paths : out.concat(paths);\n      }\n    }\n    lastClosed = false;\n    if (token === ',') {\n      stack.out = stack.out.concat(paths);\n      paths = stack.paths;\n    } else if (token === '(') {\n      out = [];\n      stack = { parent: stack, paths: paths, out: out };\n    } else if (token === ')') {\n      lastClosed = true;\n      paths = out = stack.out.concat(paths);\n      stack = stack.parent;\n    }\n  }\n  return out;\n};\n\n// Given a `path`, returns an array of length 3 with the namespace, id, and\n// relative path to the attribute\nexports.triplet = function triplet (path) {\n  var parts = path.split('.');\n  return [parts[0], parts[1], parts.slice(2).join('.')];\n};\n\nexports.subPathToDoc = function subPathToDoc (path) {\n  return path.split('.').slice(0, 2).join('.');\n};\n\nexports.join = function join () {\n  var joinedPath = [];\n  for (var i = 0, l = arguments.length; i < l; i++) {\n    var component = arguments[i];\n    if (typeof component === 'string') {\n      joinedPath.push(component);\n    } else if (Array.isArray(component)) {\n      joinedPath.push.apply(joinedPath, component);\n    } else {\n      throw new Error('path.join only takes strings and Arrays as arguments');\n    }\n  }\n  return joinedPath.join('.');\n};\n\nexports.isImmediateChild = function (ns, path) {\n  var rest = path.substring(ns.length + /* dot */ 1);\n  return -1 === rest.indexOf('.');\n};\n\nexports.isGrandchild = function (ns, path) {\n  var rest = path.substring(ns.length + /* dot */ 1);\n  return -1 !== rest.indexOf('.');\n};\n\n//@ sourceURL=/node_modules/racer/lib/path.js"
));

require.define("/node_modules/racer/lib/transaction.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var noop = require('./util').noop\n  , Memory = require('./Memory');\n\n/**\n * Transactions are represented as an Array\n * [ ver = vrsion at teh time of the transaction\n * , transaction id\n * , method\n * , arguments]\n */\n\nexports = module.exports = {\n  create: function (obj) {\n    var txn = (obj.ops) ? [obj.ver, obj.id, obj.ops]\n                        : [obj.ver, obj.id, obj.method, obj.args]\n      , ctx = obj.context;\n    if (ctx && !obj.ops) txn.push({c: ctx});\n    return txn;\n  }\n\n, getVer: function (txn) { return txn[0]; }\n, setVer: function (txn, val) { return txn[0] = val; }\n\n, getId: function (txn) { return txn[1]; }\n, setId: function (txn, id) { return txn[1] = id; }\n\n, clientIdAndVer: function (txn) {\n    var pair = this.getId(txn).split('.');\n    pair[1] = parseInt(pair[1], 10);\n    return pair;\n  }\n\n, getMethod: function (txn) { return txn[2]; }\n, setMethod: function (txn, name) { return txn[2] = name; }\n\n, getArgs: function (txn) { return txn[3]; }\n, setArgs: function (txn, vals) { return txn[3] = vals; }\n, copyArgs: function (txn) { return this.getArgs(txn).slice(); }\n\n, getPath: function (txn) { return this.getArgs(txn)[0]; }\n, setPath: function (txn, val) { return this.getArgs(txn)[0] = val; }\n\n, getMeta: function (txn) { return txn[4]; }\n, setMeta: function (txn, meta) { return txn[4] = meta; }\n\n, getContext: function (txn) {\n    var meta = this.getMeta(txn);\n    return meta && meta.c || 'default';\n  }\n, setContext: function (txn, ctx) {\n    var meta = this.getMeta(txn);\n    return meta.c = ctx;\n  }\n\n, getClientId: function (txn) {\n    return this.getId(txn).split('.')[0];\n  }\n, setClientId: function (txn, clientId) {\n    var pair = this.getId(txn).split('.')\n      , clientId = pair[0]\n      , num = pair[1];\n    this.setId(txn, newClientId + '.' + num);\n    return newClientId;\n  }\n\n, pathConflict: function (pathA, pathB) {\n    // Paths conflict if equal or either is a sub-path of the other\n    if (pathA === pathB) return 'equal';\n    var pathALen = pathA.length\n      , pathBLen = pathB.length;\n    if (pathALen === pathBLen) return false;\n    if (pathALen > pathBLen)\n      return pathA.charAt(pathBLen) === '.' && pathA.substr(0, pathBLen) === pathB && 'child';\n    return pathB.charAt(pathALen) === '.' && pathB.substr(0, pathALen) === pathA && 'parent';\n  }\n\n, ops: function (txn, ops) {\n    if (typeof ops !== 'undefined') txn[2] = ops;\n    return txn[2];\n  }\n\n, isCompound: function (txn) {\n    return Array.isArray(txn[2]);\n  }\n\n, applyTxn: function (txn, data, memoryAdapter, ver) {\n    return applyTxn(this, txn, data, memoryAdapter, ver);\n  }\n\n, op: {\n    // Creates an operation\n    create: function (obj) { return [obj.method, obj.args]; }\n\n  , getMethod: function (op) { return op[0]; }\n  , setMethod: function (op, name) { return op[0] = name; }\n\n  , getArgs: function (op) { return op[1]; }\n  , setArgs: function (op, vals) { return op[1] = vals; }\n\n  , applyTxn: function (txn, data, memoryAdapter, ver) {\n      return applyTxn(this, txn, data, memoryAdapter, ver);\n    }\n  }\n};\n\nfunction applyTxn (extractor, txn, data, memoryAdapter, ver) {\n  var method = extractor.getMethod(txn);\n  if (method === 'get') return;\n  var args = extractor.getArgs(txn);\n  if (ver !== null) {\n    ver = extractor.getVer(txn);\n  }\n  args = args.concat([ver, data]);\n  return memoryAdapter[method].apply(memoryAdapter, args);\n}\n\nvar transaction = exports;\nexports.applyTxnToDoc = (function (memory) {\n  memory.setVersion = noop;\n  return function (txn, doc) {\n    var path = transaction.getPath(txn)\n      , parts = path.split('.')\n      , ns = parts[0]\n      , id = parts[1]\n\n      , world = {}\n      , data = { world: world };\n    world[ns] = {};\n    if (doc) world[ns][id] = doc;\n\n    transaction.applyTxn(txn, data, memory, -1);\n    return memory.get(ns + '.' + id, data);\n  };\n})(new Memory);\n\n//@ sourceURL=/node_modules/racer/lib/transaction.js"
));

require.define("/node_modules/racer/lib/mutators/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var mixinModel = require('./mutators.Model')\n  , mixinStore = __dirname + '/mutators.Store';\n\nexports = module.exports = plugin;\n\nfunction plugin (racer) {\n  racer.mixin(mixinModel, mixinStore);\n}\n\nexports.useWith = { server: true, browser: true };\nexports.decorate = 'racer';\n\n//@ sourceURL=/node_modules/racer/lib/mutators/index.js"
));

require.define("/node_modules/racer/lib/mutators/mutators.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// Generated by CoffeeScript 1.3.3\nvar ACCESSOR, ARRAY_MUTATOR, Async, BASIC_MUTATOR, COMPOUND_MUTATOR, Memory,\n  __slice = [].slice;\n\nAsync = require('./Async');\n\nMemory = require('../Memory');\n\nmodule.exports = {\n  type: 'Model',\n  \"static\": {\n    ACCESSOR: ACCESSOR = 'accessor',\n    BASIC_MUTATOR: BASIC_MUTATOR = 'mutator,basicMutator',\n    COMPOUND_MUTATOR: COMPOUND_MUTATOR = 'mutator,compoundMutator',\n    ARRAY_MUTATOR: ARRAY_MUTATOR = 'mutator,arrayMutator'\n  },\n  events: {\n    init: function(model) {\n      var memory;\n      memory = new Memory;\n      return model.async = new Async({\n        model: model,\n        nextTxnId: function() {\n          return model._nextTxnId();\n        },\n        get: function(path, callback) {\n          return model._upstreamData([path], function(err, data) {\n            var item, items, len, out, subpath, value, _i, _len, _ref;\n            if (err) {\n              return callback(err);\n            }\n            if (!((items = data.data) && (len = items.length))) {\n              return callback();\n            }\n            if (len === 1 && (item = items[0]) && item[0] === path) {\n              return callback(null, item[1]);\n            }\n            for (_i = 0, _len = items.length; _i < _len; _i++) {\n              _ref = items[_i], subpath = _ref[0], value = _ref[1];\n              memory.set(subpath, value, -1);\n            }\n            out = memory.get(path);\n            memory.flush();\n            return callback(null, out);\n          });\n        },\n        commit: function(txn, callback) {\n          return model._asyncCommit(txn, callback);\n        }\n      });\n    }\n  },\n  proto: {\n    get: {\n      type: ACCESSOR,\n      fn: function(path) {\n        var at;\n        if (at = this._at) {\n          path = path ? at + '.' + path : at;\n        }\n        return this._memory.get(path, this._specModel());\n      }\n    },\n    set: {\n      type: BASIC_MUTATOR,\n      fn: function(path, value, callback) {\n        var at, len;\n        if (at = this._at) {\n          len = arguments.length;\n          path = len === 1 || len === 2 && typeof value === 'function' ? (callback = value, value = path, at) : at + '.' + path;\n        }\n        return this._sendToMiddleware('set', [path, value], callback);\n      }\n    },\n    del: {\n      type: BASIC_MUTATOR,\n      fn: function(path, callback) {\n        var at;\n        if (at = this._at) {\n          path = typeof path === 'string' ? at + '.' + path : (callback = path, at);\n        }\n        return this._sendToMiddleware('del', [path], callback);\n      }\n    },\n    add: {\n      type: COMPOUND_MUTATOR,\n      fn: function(path, value, callback) {\n        var id, len;\n        len = arguments.length;\n        if (this._at && len === 1 || len === 2 && typeof value === 'function') {\n          callback = value;\n          value = path;\n          if (typeof value !== 'object') {\n            throw 'model.add() requires an object argument';\n          }\n          path = id = value.id || (value.id = this.id());\n        } else {\n          value || (value = {});\n          if (typeof value !== 'object') {\n            throw 'model.add() requires an object argument';\n          }\n          id = value.id || (value.id = this.id());\n          path = path + '.' + id;\n        }\n        if (callback) {\n          this.set(path, value, function(err) {\n            return callback(err, id);\n          });\n        } else {\n          this.set(path, value);\n        }\n        return id;\n      }\n    },\n    setNull: {\n      type: COMPOUND_MUTATOR,\n      fn: function(path, value, callback) {\n        var len, obj;\n        len = arguments.length;\n        obj = this._at && len === 1 || len === 2 && typeof value === 'function' ? this.get() : this.get(path);\n        if (obj != null) {\n          return obj;\n        }\n        if (len === 1) {\n          return this.set(path);\n        } else if (len === 2) {\n          return this.set(path, value);\n        } else {\n          return this.set(path, value, callback);\n        }\n      }\n    },\n    incr: {\n      type: COMPOUND_MUTATOR,\n      fn: function(path, byNum, callback) {\n        var value;\n        if (typeof path !== 'string') {\n          callback = byNum;\n          byNum = path;\n          path = '';\n        }\n        if (typeof byNum === 'function') {\n          callback = byNum;\n          byNum = 1;\n        } else if (typeof byNum !== 'number') {\n          byNum = 1;\n        }\n        value = (this.get(path) || 0) + byNum;\n        if (path) {\n          this.set(path, value, callback);\n          return value;\n        }\n        if (callback) {\n          this.set(value, callback);\n        } else {\n          this.set(value);\n        }\n        return value;\n      }\n    },\n    push: {\n      type: ARRAY_MUTATOR,\n      insertArgs: 1,\n      fn: function() {\n        var args, at, callback, current, path;\n        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        if (at = this._at) {\n          if (typeof (path = args[0]) === 'string' && (current = this.get()) && !Array.isArray(current)) {\n            args[0] = at + '.' + path;\n          } else {\n            args.unshift(at);\n          }\n        }\n        if (typeof args[args.length - 1] === 'function') {\n          callback = args.pop();\n        }\n        return this._sendToMiddleware('push', args, callback);\n      }\n    },\n    unshift: {\n      type: ARRAY_MUTATOR,\n      insertArgs: 1,\n      fn: function() {\n        var args, at, callback, current, path;\n        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        if (at = this._at) {\n          if (typeof (path = args[0]) === 'string' && (current = this.get()) && !Array.isArray(current)) {\n            args[0] = at + '.' + path;\n          } else {\n            args.unshift(at);\n          }\n        }\n        if (typeof args[args.length - 1] === 'function') {\n          callback = args.pop();\n        }\n        return this._sendToMiddleware('unshift', args, callback);\n      }\n    },\n    insert: {\n      type: ARRAY_MUTATOR,\n      indexArgs: [1],\n      insertArgs: 2,\n      fn: function() {\n        var args, at, callback, match, path;\n        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        if (at = this._at) {\n          if (typeof (path = args[0]) === 'string' && isNaN(path)) {\n            args[0] = at + '.' + path;\n          } else {\n            args.unshift(at);\n          }\n        }\n        if (match = /^(.*)\\.(\\d+)$/.exec(args[0])) {\n          args[0] = match[1];\n          args.splice(1, 0, match[2]);\n        }\n        if (typeof args[args.length - 1] === 'function') {\n          callback = args.pop();\n        }\n        return this._sendToMiddleware('insert', args, callback);\n      }\n    },\n    pop: {\n      type: ARRAY_MUTATOR,\n      fn: function(path, callback) {\n        var at;\n        if (at = this._at) {\n          path = typeof path === 'string' ? at + '.' + path : (callback = path, at);\n        }\n        return this._sendToMiddleware('pop', [path], callback);\n      }\n    },\n    shift: {\n      type: ARRAY_MUTATOR,\n      fn: function(path, callback) {\n        var at;\n        if (at = this._at) {\n          path = typeof path === 'string' ? at + '.' + path : (callback = path, at);\n        }\n        return this._sendToMiddleware('shift', [path], callback);\n      }\n    },\n    remove: {\n      type: ARRAY_MUTATOR,\n      indexArgs: [1],\n      fn: function(path, start, howMany, callback) {\n        var at, match;\n        if (at = this._at) {\n          path = typeof path === 'string' && isNaN(path) ? at + '.' + path : (callback = howMany, howMany = start, start = path, at);\n        }\n        if (match = /^(.*)\\.(\\d+)$/.exec(path)) {\n          callback = howMany;\n          howMany = start;\n          start = match[2];\n          path = match[1];\n        }\n        if (typeof howMany !== 'number') {\n          callback = howMany;\n          howMany = 1;\n        }\n        return this._sendToMiddleware('remove', [path, start, howMany], callback);\n      }\n    },\n    move: {\n      type: ARRAY_MUTATOR,\n      indexArgs: [1, 2],\n      fn: function(path, from, to, howMany, callback) {\n        var at, match;\n        if (at = this._at) {\n          path = typeof path === 'string' && isNaN(path) ? at + '.' + path : (callback = howMany, howMany = to, to = from, from = path, at);\n        }\n        if (match = /^(.*)\\.(\\d+)$/.exec(path)) {\n          callback = howMany;\n          howMany = to;\n          to = from;\n          from = match[2];\n          path = match[1];\n        }\n        if (typeof howMany !== 'number') {\n          callback = howMany;\n          howMany = 1;\n        }\n        return this._sendToMiddleware('move', [path, from, to, howMany], callback);\n      }\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/mutators/mutators.Model.js"
));

require.define("/node_modules/racer/lib/mutators/Async.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var transaction = require('../transaction')\n  , noop = require('../util').noop;\n\n// TODO Implement remaining methods for AsyncAtomic\n// TODO Redo implementation using a macro\n\nmodule.exports = Async;\n\nfunction Async (options) {\n  options || (options = {});\n  if (options.get) this.get = options.get;\n  if (options.commit) this._commit = options.commit;\n  this.model = options.model;\n\n  // Note that async operation clientIds MUST begin with '#', as this is used\n  // to treat conflict detection between async and sync transactions differently\n  var nextTxnId = options.nextTxnId;\n  if (nextTxnId) {\n    this._nextTxnId = function (callback) {\n      callback(null, '#' + nextTxnId());\n    };\n  }\n}\n\nAsync.prototype = {\n  set: function (path, value, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'set'\n      , args: [path, value]\n      });\n      // TODO When store is mutating, it should have something akin to\n      // superadmin rights. Perhaps store.sudo.set\n      self._commit(txn, callback);\n    });\n  }\n\n, del: function (path, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'del'\n      , args: [path]\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, push: function (path, items, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'push'\n      , args: [path].concat(items)\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, unshift: function (path, items, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'unshift'\n      , args: [path].concat(items)\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, insert: function (path, index, items, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'insert'\n      , args: [path, index].concat(items)\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, pop: function (path, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'pop'\n      , args: [path]\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, shift: function (path, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'shift'\n      , args: [path]\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, remove: function (path, start, howMany, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'remove'\n      , args: [path, start, howMany]\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, move: function (path, from, to, howMany, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'move'\n      , args: [path, from, to, howMany]\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, incr: function (path, byNum, callback) {\n    if (typeof byNum === 'function') {\n      // For incr(path, callback)\n      callback = byNum;\n      byNum = 1;\n    } else {\n      if (byNum == null) byNum = 1;\n    }\n    callback || (callback = noop);\n    var tryVal;\n    this.retry( function (atomic) {\n      atomic.get(path, function (val) {\n        tryVal = (val || 0) + byNum;\n        atomic.set(path, tryVal);\n      });\n    }, function (err) {\n      callback(err, tryVal);\n    });\n  }\n\n, setNull: function (path, value, callback) {\n    callback || (callback = noop);\n    var tryVal;\n    this.retry( function (atomic) {\n      atomic.get(path, function (val) {\n        if (val != null) return tryVal = val;\n        tryVal = value;\n        atomic.set(path, tryVal);\n      });\n    }, function (err) {\n      callback(err, tryVal);\n    });\n  }\n\n, add: function (path, value, callback) {\n    callback || (callback = noop);\n    value || (value = {});\n    var id = value.id\n      , uuid = (this.model && this.model.id || this.uuid)\n      , tryId, tryPath;\n\n    this.retry( function (atomic) {\n      tryId = id || (value.id = uuid());\n      tryPath = path + '.' + tryId;\n      atomic.get(tryPath, function (val) {\n        if (val != null) return atomic.next('nonUniqueId');\n        atomic.set(tryPath, value);\n      });\n    }, function (err) {\n      callback(err, tryId);\n    });\n  }\n\n, retry: function (fn, callback) {\n    var retries = MAX_RETRIES;\n    var atomic = new AsyncAtomic(this, function (err) {\n      if (!err) return callback && callback();\n      if (! retries--) return callback && callback('maxRetries');\n      atomic._reset();\n      setTimeout(fn, RETRY_DELAY, atomic);\n    });\n    fn(atomic);\n  }\n};\n\nvar MAX_RETRIES = Async.MAX_RETRIES = 20;\nvar RETRY_DELAY = Async.RETRY_DELAY = 100;\n\nfunction AsyncAtomic (async, cb) {\n  this.async = async;\n  this.cb = cb;\n  this.minVer = 0;\n  this.count = 0;\n}\n\nAsyncAtomic.prototype = {\n  _reset: function () {\n    this.minVer = 0;\n    this.count = 0;\n  }\n\n, next: function (err) {\n  this.cb(err);\n}\n\n, get: function (path, callback) {\n    var self = this\n      , minVer = self.minVer\n      , cb = self.cb\n    self.async.get(path, function (err, value, ver) {\n      if (err) return cb(err);\n      self.minVer = minVer ? Math.min(minVer, ver) : ver;\n      callback && callback(value);\n    });\n  }\n\n, set: function (path, value, callback) {\n    var self = this\n      , cb = self.cb;\n    self.count++;\n    self.async.set(path, value, self.minVer, function (err, value) {\n      if (err) return cb(err);\n      callback && callback(null, value);\n      --self.count || cb();\n    });\n  }\n\n, del: function (path, callback) {\n    var self = this\n      , cb = self.cb;\n    self.count++;\n    self.async.del(path, self.minVer, function (err) {\n      if (err) return cb(err);\n      callback && callback();\n      --self.count || cb();\n    });\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/mutators/Async.js"
));

require.define("/node_modules/racer/lib/refs/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var pathUtils             = require('../path')\n  , regExpPathOrParent    = pathUtils.regExpPathOrParent\n  , regExpPathsOrChildren = pathUtils.regExpPathsOrChildren\n  , refUtils              = require('./util')\n  , derefPath             = refUtils.derefPath\n  , assertPrivateRefPath  = refUtils.assertPrivateRefPath\n  , createRef             = require('./ref')\n  , createRefList         = require('./refList')\n  , equal                 = require('../util').equal\n  , unbundledFunction     = require('../bundle/util').unbundledFunction\n  , TransformBuilder      = require('../descriptor/query/TransformBuilder') // ugh - leaky abstraction\n  ;\n\nexports = module.exports = plugin;\nexports.useWith = { server: true, browser: true };\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  racer.mixin(mixin);\n}\n\nvar mixin = {\n  type: 'Model'\n\n, server: __dirname + '/refs.server'\n, events: {\n    init: function (model) {\n      // [[from, get, item], ...]\n      model._refsToBundle = [];\n\n      // [['fn', path, inputs..., cb.toString()], ...]\n      model._fnsToBundle = [];\n\n      var Model = model.constructor;\n\n      for (var method in Model.mutator) {\n        model.on(method, (function (method) {\n          return function () {\n            model.emit('mutator', method, arguments);\n          };\n        })(method));\n      }\n\n      var memory = model._memory;\n      model.on('beforeTxn', function (method, args) {\n        var path = args[0];\n        if (!path) return;\n\n        // De-reference transactions to operate on their absolute path\n        var data, obj, fn;\n        while (true) {\n          data = model._specModel();\n          obj = memory.get(path, data);\n          // $deref may be assigned by a getter during the lookup of path in\n          // data via memoty.get(path, data);\n          fn = data.$deref;\n          if (!fn) return;\n          args[0] = fn(method, args, model, obj);\n          if (path === args[0]) return;\n          // Keep de-reffing until we get to the end of a ref chain\n          path = args[0];\n        }\n      });\n    }\n\n  , bundle: function (model) {\n      var onLoad       = model._onLoad\n        , refsToBundle = model._refsToBundle\n        , fnsToBundle  = model._fnsToBundle;\n\n      for (var i = 0, l = refsToBundle.length; i < l; i++) {\n        var triplet = refsToBundle[i]\n          , from    = triplet[0]\n          , getter  = triplet[1]\n          , item    = triplet[2];\n        if (model._getRef(from) === getter) {\n          onLoad.push(item);\n        }\n      }\n\n      for (i = 0, l = fnsToBundle.length; i < l; i++) {\n        var item = fnsToBundle[i];\n        if (item) onLoad.push(item);\n      }\n    }\n  }\n\n, proto: {\n    /**\n     * Assuming that a ref getter was assigned to `path`, this function will\n     * return that ref getter function.\n     * @param {String} path\n     * @return {Function} the ref getter\n     */\n    _getRef: function (path) {\n      // The 3rd argument `true` below tells Memory#get to return the ref\n      // getter function, instead of invoking the getter function and resolve\n      // the dereferenced value of the ref.\n      return this._memory.get(path, this._specModel(), true);\n    }\n\n    /**\n     * @param {String} path\n     * @param {Boolean} getRef\n     * @return {String}\n     */\n  , dereference: function (path, getRef) {\n      if (!getRef) getRef = false;\n      var data = this._specModel();\n      this._memory.get(path, data, getRef);\n      return derefPath(data, path);\n    }\n\n    /**\n     * Creates a ref at `from` that points to `to`, with an optional `key`\n     * @param {String} from path\n     * @param {String} to path\n     * @param {String} @optional key path\n     * @param {Boolean} hardLink\n     * @return {Model} a model scope scoped to `from`\n     */\n  , ref: function (from, to, key, hardLink) {\n      return this._createRef(createRef, 'ref', from, to, key, hardLink);\n    }\n\n    /**\n     * Creates a refList at `from` with an array of pointers at `key` that\n     * point to documents in `to`.\n     * @param {String} from path\n     * @param {String} to path\n     * @param {String} key path\n     * @param {Boolean} hardLink\n     * @return {Model} a model scope scoped to `from`\n     */\n  , refList: function (from, to, key, hardLink) {\n      return this._createRef(createRefList, 'refList', from, to, key, hardLink);\n    }\n\n    /**\n     * @param {Function} refFactory\n     * @param {String} refType is either 'ref' or 'refList'\n     * @param {String} from path\n     * @param {String} to path\n     * @param {key} key path\n     * @param {Boolean} hardLink\n     * @return {Model} a model scope scoped to the `from` path\n     */\n  , _createRef: function (refFactory, refType, from, to, key, hardLink) {\n      // Normalize scoped model arguments\n      if (from._at) {\n        from = from._at;\n      } else if (this._at) {\n        from = this._at + '.' + from;\n      }\n      if (to instanceof TransformBuilder) {\n        var builder = to;\n        to = to.path();\n      } else if (to._at) {\n        to = to._at;\n      }\n      if (key && key._at) key = key._at;\n\n      var model = this._root;\n\n      assertPrivateRefPath(model, from, refType);\n      var getter = refFactory(model, from, to, key, hardLink);\n\n      model.setRefGetter(from, getter);\n\n      if (builder) {\n        if (this._onCreateComputedRef) this._onCreateComputedRef(from, builder, getter);\n      } else {\n        // The server model adds [from, getter, [refType, from, to, key]] to\n        // this._refsToBundle\n        if (this._onCreateRef) this._onCreateRef(refType, from, to, key, getter);\n      }\n\n      return model.at(from);\n    }\n\n  , setRefGetter: function (path, getter) {\n      var self = this;\n      // Prevent emission of the next set event, since we are setting the\n      // dereferencing function and not its value.\n      var listener = this.on('beforeTxn', function (method, args) {\n        // Supress emission of set events when setting a function, which is\n        // what happens when a ref is created\n        if (method === 'set' && args[1] === getter) {\n          args.cancelEmit = true;\n          self.removeListener('beforeTxn', listener);\n        }\n      });\n\n      // Now, set the dereferencing function\n      var prevValue = this.set(path, getter);\n      // Emit a set event with the expected de-referenced values\n      var newValue = this.get(path);\n      this.emit('set', [path, newValue], prevValue, true);\n    }\n\n  , _loadComputedRef: function (from, source) {\n    var builder = TransformBuilder.fromJson(this, source);\n    this.ref(from, builder);\n  }\n\n    /**\n     * TODO\n     * Works similar to model.fn(inputs..., fn) but without having to declare\n     * inputs. This means that fn also takes no arguments\n     */\n  , autofn: function (fn) {\n      throw new Error('Unimplemented');\n      autodep(this, fn);\n    }\n\n    /**\n     * model.fn(inputs... ,fn);\n     *\n     * Defines a reactive value that depends on the paths represented by\n     * `inputs`, which are used by `fn` to re-calculate a return value every\n     * time any of the `inputs` change.\n     */\n  , fn: function (/* inputs..., fn */) {\n      var arglen = arguments.length\n        , inputs = Array.prototype.slice.call(arguments, 0, arglen-1)\n        , fn = arguments[arglen-1];\n\n      // Convert scoped models into paths\n      for (var i = 0, l = inputs.length; i < l; i++) {\n        var scopedPath = inputs[i]._at;\n        if (scopedPath) inputs[i] = scopedPath;\n      }\n\n      var path = inputs.shift()\n        , model = this._root;\n\n      // If we are a scoped model, scoped to this._at\n      if (this._at) path = this._at + '.' + path;\n\n      assertPrivateRefPath(this, path, 'fn');\n      if (typeof fn === 'string') {\n        fn = unbundledFunction(fn);\n      }\n      return model._createFn(path, inputs, fn);\n    }\n\n    /**\n     * @param {String} path to the reactive value\n     * @param {[String]} inputs is a list of paths from which the reactive\n     * value is calculated\n     * @param {Function} fn returns the reactive value at `path` calculated\n     * from the values at the paths defined by `inputs`\n     */\n  , _createFn: function (path, inputs, fn, destroy) {\n      var prevVal, currVal\n        , reSelf = regExpPathOrParent(path)\n        , reInput = regExpPathsOrChildren(inputs)\n        , destroy = this._onCreateFn && this._onCreateFn(path, inputs, fn)\n        , self = this;\n\n      var listener = this.on('mutator', function (mutator, _arguments) {\n        var mutatorPath = _arguments[0][0];\n        // Ignore mutations created by this reactive function\n        if (_arguments[3] === listener) return;\n\n        // Remove reactive function if something else sets the value of its\n        // output path. We get the current value here, since a mutator might\n        // operate on the path or the parent path that does not actually affect\n        // the reactive function. The equal function is true if the objects are\n        // identical or if they are both NaN\n        if (reSelf.test(mutatorPath) && ! equal(self.get(path), currVal)) {\n          self.removeListener('mutator', listener);\n          return destroy && destroy();\n        }\n\n        if (reInput.test(mutatorPath)) {\n          currVal = updateVal();\n        }\n      });\n\n      var model = this.pass(listener);\n\n      var updateVal = function () {\n        prevVal = currVal;\n        var inputVals = [];\n        for (var i = 0, l = inputs.length; i < l; i++) {\n          inputVals.push(self.get(inputs[i]));\n        }\n        currVal = fn.apply(null, inputVals);\n        if (equal(prevVal, currVal)) return currVal;\n        model.set(path, currVal);\n        return currVal;\n      };\n      return updateVal();\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/refs/index.js"
));

require.define("/node_modules/racer/lib/refs/util.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var pathUtils = require('../path')\n  , isPrivate = pathUtils.isPrivate\n  , eventRegExp = pathUtils.eventRegExp;\n\nmodule.exports = {\n  // TODO This is a horribly named function.\n  //\n  // $deref is invoked in:\n  // - via derefPath in refs/util.js\n  // - refs/index.js in the 'beforeTxn' callback.\n  derefPath: function (data, to) {\n    return data.$deref ? data.$deref() : to;\n  }\n\n, addListener: addListener\n\n  /**\n   * Asserts that the path of a ref is private.\n   * @param {Model} model\n   * @param {String} path is the path of the ref\n   */\n, assertPrivateRefPath: function (model, path) {\n    if (! isPrivate(model.dereference(path, true)) )\n      throw new Error('Cannot create ref on public path \"' + path + '\"');\n  }\n};\n\n\n/**\n * Add a listener function (method, path, arguments) on the 'mutator' event.\n * The listener ignores mutator events that fire on paths that do not match\n * `pattern`\n * @param {Array} listeners is an Array of listener functions that the listener\n * we generate is added to.\n * @param {Model} model is the model to which we add the listener\n * @param {String} from is the private path of the ref\n * @param {Function} getter\n * @param {String} pattern\n * @param {Function} generatePath(match, mutator, args)\n */\nfunction addListener (listeners, model, from, getter, pattern, generatePath) {\n  var regexp = eventRegExp(pattern);\n  function listener (mutator, _arguments) {\n    var path = _arguments[0][0];\n    if (!regexp.test(path)) return;\n\n    // Lazy cleanup of listener\n    if (model._getRef(from) !== getter) {\n      for (var i = listeners.length; i--;) {\n        model.removeListener('mutator', listeners[i]);\n      }\n      return;\n    }\n\n    // Construct the next de-referenced path to emit on. generatePath may also\n    // alter args = _arguments[0].slice()\n    var args = _arguments[0].slice();\n    args.out = _arguments[1];\n    var dereffedPath = generatePath(regexp.exec(path), mutator, args);\n    if (dereffedPath === null) return;\n    args[0] = dereffedPath;\n    var isLocal = _arguments[2]\n      , pass = _arguments[3];\n    model.emit(mutator, args, args.out, isLocal, pass);\n  }\n  listeners.push(listener);\n\n  model.on('mutator', listener);\n}\n\n//@ sourceURL=/node_modules/racer/lib/refs/util.js"
));

require.define("/node_modules/racer/lib/refs/ref.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var refUtils = require('./util')\n  , derefPath = refUtils.derefPath\n  , addListener = refUtils.addListener\n  , pathUtil = require('../path')\n  , joinPaths = pathUtil.join\n  , regExpPathOrParent = pathUtil.regExpPathOrParent\n  , lookup = pathUtil.lookup\n  , indexOf = require('../util').indexOf\n  , Model = require('../Model')\n  ;\n\nexports = module.exports = createRef;\n\nfunction createRef (model, from, to, key, hardLink) {\n  if (!from)\n    throw new Error('Missing `from` in `model.ref(from, to, key)`');\n  if (!to)\n    throw new Error('Missing `to` in `model.ref(from, to, key)`');\n\n  if (key) {\n    var getter = createGetterWithKey(to, key, hardLink);\n    setupRefWithKeyListeners(model, from, to, key, getter);\n    return getter;\n  }\n  var getter = createGetterWithoutKey(to, hardLink);\n  setupRefWithoutKeyListeners(model, from, to, getter);\n  return getter;\n}\n\n/**\n * Generates a function that is assigned to data.$deref\n * @param {Number} len\n * @param {Number} i\n * @param {String} path\n * @param {String} currPath\n * @param {Boolean} hardLink\n * @return {Function}\n */\nfunction derefFn (len, i, path, currPath, hardLink) {\n  if (hardLink) return function () {\n    return currPath;\n  };\n  return function (method) {\n    return (i === len && method in Model.basicMutator) ? path : currPath;\n  };\n}\n\n/**\n * Returns a getter function that is assigned to the ref's `from` path. When a\n * lookup function encounters the getter, it invokes the getter in order to\n * navigate to the proper node in `data` that is pointed to by the ref. The\n * invocation also \"expands\" the current path to the absolute path pointed to\n * by the ref.\n *\n * @param {String} to path\n * @param {String} key path\n * @param {Boolean} hardLink\n * @return {Function} getter\n */\nfunction createGetterWithKey (to, key, hardLink) {\n  /**\n   * @param {Function} lookup as defined in Memory.js\n   * @param {Object} data is all data in the Model or the spec model\n   * @param {String} path is the path traversed so far to the ref function\n   * @param {[String]} props is the array of all properties that we want to traverse\n   * @param {Number} len is the number of properties in props\n   * @param {Number} i is the index in props representing the current property\n   * we are at in our traversal of props\n   * @return {[Object, String, Number]} [current node in data, current path,\n   * current props index]\n   */\n  return function getter (lookup, data, path, props, len, i) {\n    // Here, lookup(to, data) is called in order for derefPath to work because\n    // derefPath looks for data.$deref, which is lazily re-assigned on a lookup\n    var obj = lookup(to, data)\n      , dereffedPath = derefPath(data, to);\n\n    // Unset $deref\n    data.$deref = null;\n\n    var pointer = lookup(key, data);\n    if (Array.isArray(obj)) {\n      dereffedPath += '.' + indexOf(obj, pointer, equivId);\n    } else if (!obj || obj.constructor === Object) {\n      dereffedPath += '.' + pointer;\n    }\n    var curr = lookup(dereffedPath, data)\n      , currPath = joinPaths(dereffedPath, props.slice(i));\n\n    // Reset $deref\n    data.$deref = derefFn(len, i, path, currPath, hardLink);\n\n    return [curr, currPath, i];\n  }\n}\n\nfunction setupRefWithKeyListeners (model, from, to, key, getter) {\n  var listeners = [];\n  addListener(listeners, model, from, getter, to + '.*', function (match) {\n    var keyPath = model.get(key) + '' // Cast to string\n      , remainder = match[1];\n    if (remainder === keyPath) return from;\n    // Test to see if the remainder starts with the keyPath\n    var index = keyPath.length;\n    if (remainder.substring(0, index + 1) === keyPath + '.') {\n      remainder = remainder.substring(index + 1, remainder.length);\n      return from + '.' + remainder;\n    }\n    // Don't emit another event if the keyPath is not matched\n    return null;\n  });\n\n  addListener(listeners, model, from, getter, key, function (match, mutator, args) {\n    var docs = model.get(to)\n      , id, out;\n    if (mutator === 'set') {\n      id = args[1];\n      out = args.out;\n      if (Array.isArray(docs)) {\n        args[1] = docs && docs[ indexOf(docs, id, equivId) ];\n        args.out = docs && docs[ indexOf(docs, out, equivId) ];\n      } else {\n        // model.get is used in case this points to a ref\n        args[1] = model.get(to + '.' + id);\n        args.out = model.get(to + '.' + out);\n      }\n    } else if (mutator === 'del') {\n      if (Array.isArray(docs)) {\n        args.out = docs && docs[ indexOf(docs, out, equivId) ];\n      } else {\n        // model.get is used in case this points to a ref\n        args.out = model.get(to + '.' + out);\n      }\n    }\n    return from;\n  });\n}\n\nfunction equivId (id, doc) {\n  return doc && doc.id === id;\n}\n\nfunction createGetterWithoutKey (to, hardLink) {\n  // TODO Bleeding abstraction - This is very much coupled to Memory's implementation and internals.\n  return function getter (lookup, data, path, props, len, i) {\n    var curr = lookup(to, data)\n      , dereffedPath = derefPath(data, to)\n      , currPath = joinPaths(dereffedPath, props.slice(i));\n\n    data.$deref = derefFn(len, i, path, currPath, hardLink);\n\n    return [curr, currPath, i];\n  };\n}\n\nfunction setupRefWithoutKeyListeners(model, from, to, getter) {\n  var listeners = []\n    , parents = regExpPathOrParent(to, 1)\n\n  addListener(listeners, model, from, getter, to + '.*', function (match) {\n    return from + '.' + match[1];\n  });\n\n  addListener(listeners, model, from, getter, to, function () {\n    return from;\n  });\n\n  addListener(listeners, model, from, getter, parents, function (match, mutator, args) {\n    var path = match.input\n      , remainder = to.slice(path.length + 1)\n\n    if (mutator === 'set') {\n      args[1] = lookup(remainder, args[1]);\n      args.out = lookup(remainder, args.out);\n    } else if (mutator === 'del') {\n      args.out = lookup(remainder, args.out);\n    } else {\n      // Don't emit an event if not a set or delete\n      return null;\n    }\n    return from;\n  });\n}\n\n//@ sourceURL=/node_modules/racer/lib/refs/ref.js"
));

require.define("/node_modules/racer/lib/refs/refList.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var util = require('../util')\n  , hasKeys = util.hasKeys\n  , indexOf = util.indexOf\n  , refUtils = require('./util')\n  , derefPath = refUtils.derefPath\n  , addListener = refUtils.addListener\n  , joinPaths = require('../path').join\n  , Model = require('../Model')\n  ;\n\nmodule.exports = createRefList;\n\nfunction createRefList (model, from, to, key) {\n  if (!from || !to || !key) {\n    throw new Error('Invalid arguments for model.refList');\n  }\n  var arrayMutators = Model.arrayMutator\n    , getter = createGetter(from, to, key)\n    , listeners = [];\n\n  addListener(listeners, model, from, getter, key, function (regexpMatch, method, args) {\n    var methodMeta = arrayMutators[method]\n      , i = methodMeta && methodMeta.insertArgs;\n    if (i) {\n      var id, docs;\n      docs = model.get(to);\n      while ((id = args[i]) && id != null) {\n        args[i] = (Array.isArray(docs))\n                ? docs && docs[ indexOf(docs, id, function (id, doc) { return doc.id === id; })  ]\n                : docs && docs[id];\n        // args[i] = model.get(to + '.' + id);\n        i++;\n      }\n    }\n    return from;\n  });\n\n  addListener(listeners, model, from, getter, to + '.*', function (regexpMatch) {\n    var id = regexpMatch[1]\n      , i = id.indexOf('.')\n      , remainder;\n    if (~i) {\n      remainder = id.substr(i+1);\n      id = id.substr(0, i);\n    }\n    var pointerList = model.get(key);\n    if (!pointerList) return null;\n    i = pointerList.indexOf(id);\n    if (i === -1) return null;\n    return remainder ?\n      from + '.' + i + '.' + remainder :\n      from + '.' + i;\n  });\n\n  return getter;\n}\n\nfunction createGetter (from, to, key) {\n  /**\n   * This represents a ref function that is assigned as the value of the node\n   * located at `path` in `data`\n   *\n   * @param {Function} lookup is the Memory lookup function\n   * @param {Object} data is the speculative or non-speculative data tree\n   * @param {String} path is the current path to the ref function\n   * @param {[String]} props is the chain of properties representing a full\n   * path, of which path may be just a sub path\n   * @param {Number} len is the number of properties in props\n   * @param {Number} i is the array index of props that we are currently at\n   * @return {Array} [evaled, path, i] where\n   */\n  return function getter (lookup, data, path, props, len, i) {\n    var basicMutators = Model.basicMutator\n      , arrayMutators = Model.arrayMutator\n\n    // Here, lookup(to, data) is called in order for derefPath to work because\n    // derefPath looks for data.$deref, which is lazily re-assigned on a lookup\n      , obj = lookup(to, data) || {}\n      , dereffed = derefPath(data, to);\n    data.$deref = null;\n    var pointerList = lookup(key, data)\n      , dereffedKey = derefPath(data, key)\n      , currPath, id;\n\n    if (i === len) {\n      // Method is on the refList itself\n      currPath = joinPaths(dereffed, props.slice(i));\n\n      // TODO The mutation of args in here is bad software engineering. It took\n      // me a while to track down where args was getting transformed. Fix this.\n      data.$deref = function (method, args, model) {\n        if (!method || (method in basicMutators)) return path;\n\n        var mutator, j, arg, indexArgs;\n        if (mutator = arrayMutators[method]) {\n          // Handle index args if they are specified by id\n          if (indexArgs = mutator.indexArgs) for (var k = 0, kk = indexArgs.length; k < kk; k++) {\n            j = indexArgs[k]\n            arg = args[j];\n            if (!arg) continue;\n            id = arg.id;\n            if (id == null) continue;\n            // Replace id arg with the current index for the given id\n            var idIndex = pointerList.indexOf(id);\n            if (idIndex !== -1) args[j] = idIndex;\n          } // end if (indexArgs)\n\n          if (j = mutator.insertArgs) while (arg = args[j]) {\n            id = (arg.id != null)\n               ? arg.id\n               : (arg.id = model.id());\n            // Set the object being inserted if it contains any properties\n            // other than id\n            if (hasKeys(arg, 'id')) {\n              model.set(dereffed + '.' + id, arg);\n            }\n            args[j] = id;\n            j++;\n          }\n\n          return dereffedKey;\n        }\n\n        throw new Error(method + ' unsupported on refList');\n      }; // end of data.$deref function\n\n      if (pointerList) {\n        var curr = [];\n        for (var k = 0, kk = pointerList.length; k < kk; k++) {\n          var idVal = pointerList[k]\n            , docToAdd;\n          if (obj.constructor === Object) {\n            docToAdd = obj[idVal];\n          } else if (Array.isArray(obj)) {\n            docToAdd = obj[indexOf(obj, idVal, function (id, doc) {\n              // TODO: Brian to investigate. Code should be able to work without\n              // checking for existence of the doc first\n              return doc && doc.id === id;\n            })];\n          } else {\n            throw new TypeError();\n          }\n          curr.push(docToAdd);\n        }\n        return [curr, currPath, i];\n      }\n\n      return [undefined, currPath, i];\n\n    } else { // if (i !== len)\n      var index = props[i++]\n        , prop, curr, lastProp;\n\n      if (pointerList && (prop = pointerList[index])) {\n        curr = obj[prop];\n      }\n\n      if (i === len) {\n        lastProp = props[i-1];\n        if (lastProp === 'length') {\n          currPath = dereffedKey + '.length';\n          curr = lookup(currPath, data);\n        } else {\n          currPath = dereffed;\n        }\n\n        data.$deref = function (method, args, model, obj) {\n          // TODO Additional model methods should be done atomically with the\n          // original txn instead of making an additional txn\n\n          var value, id;\n          if (method === 'set') {\n            value = args[1];\n            id = (value.id != null)\n               ? value.id\n               : (value.id = model.id());\n            if (pointerList) {\n              model.set(dereffedKey + '.' + index, id);\n            } else {\n              model.set(dereffedKey, [id]);\n            }\n            return dereffed + '.' + id;\n          }\n\n          if (method === 'del') {\n            id = obj.id;\n            if (id == null) {\n              throw new Error('Cannot delete refList item without id');\n            }\n            model.del(dereffedKey + '.' + index);\n            return dereffed + '.' + id;\n          }\n\n          throw new Error(method + ' unsupported on refList index');\n        } // end of data.$deref function\n\n      } else { // if (i !== len)\n        // Method is on a child of the refList\n        currPath = (prop == null)\n                 ? joinPaths(dereffed, props.slice(i))\n                 : joinPaths(dereffed, prop, props.slice(i));\n\n        data.$deref = function (method) {\n          if (method && prop == null) {\n            throw new Error(method + ' on undefined refList child ' + props.join('.'));\n          }\n          return currPath;\n        };\n      }\n\n      return [curr, currPath, i];\n    }\n  };\n}\n\n//@ sourceURL=/node_modules/racer/lib/refs/refList.js"
));

require.define("/node_modules/racer/lib/bundle/util.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var uglify = require('uglify-js')\n  , isProduction = require('../util').isProduction\n\nmodule.exports = {\n  bundledFunction: function (fn) {\n    fn = fn.toString();\n    if (isProduction) {\n      // Uglify can't parse a naked function. Executing it allows Uglify to\n      // parse it properly\n      var uglified = uglify('(' + fn + ')()');\n      fn = uglified.slice(1, -3);\n    }\n    return fn;\n  }\n\n, unbundledFunction: function (fnStr) {\n    return (new Function('return ' + fnStr + ';'))();\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/bundle/util.js"
));

require.define("/node_modules/racer/node_modules/uglify-js/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"./uglify-js.js\"}\n//@ sourceURL=/node_modules/racer/node_modules/uglify-js/package.json"
));

require.define("/node_modules/racer/node_modules/uglify-js/uglify-js.js",Function(['require','module','exports','__dirname','__filename','process','global'],"//convienence function(src, [options]);\nfunction uglify(orig_code, options){\n  options || (options = {});\n  var jsp = uglify.parser;\n  var pro = uglify.uglify;\n\n  var ast = jsp.parse(orig_code, options.strict_semicolons); // parse code and get the initial AST\n  ast = pro.ast_mangle(ast, options.mangle_options); // get a new AST with mangled names\n  ast = pro.ast_squeeze(ast, options.squeeze_options); // get an AST with compression optimizations\n  var final_code = pro.gen_code(ast, options.gen_options); // compressed code here\n  return final_code;\n};\n\nuglify.parser = require(\"./lib/parse-js\");\nuglify.uglify = require(\"./lib/process\");\nuglify.consolidator = require(\"./lib/consolidator\");\n\nmodule.exports = uglify\n\n//@ sourceURL=/node_modules/racer/node_modules/uglify-js/uglify-js.js"
));

require.define("/node_modules/racer/node_modules/uglify-js/lib/parse-js.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/***********************************************************************\n\n  A JavaScript tokenizer / parser / beautifier / compressor.\n\n  This version is suitable for Node.js.  With minimal changes (the\n  exports stuff) it should work on any JS platform.\n\n  This file contains the tokenizer/parser.  It is a port to JavaScript\n  of parse-js [1], a JavaScript parser library written in Common Lisp\n  by Marijn Haverbeke.  Thank you Marijn!\n\n  [1] http://marijn.haverbeke.nl/parse-js/\n\n  Exported functions:\n\n    - tokenizer(code) -- returns a function.  Call the returned\n      function to fetch the next token.\n\n    - parse(code) -- returns an AST of the given JavaScript code.\n\n  -------------------------------- (C) ---------------------------------\n\n                           Author: Mihai Bazon\n                         <mihai.bazon@gmail.com>\n                       http://mihai.bazon.net/blog\n\n  Distributed under the BSD license:\n\n    Copyright 2010 (c) Mihai Bazon <mihai.bazon@gmail.com>\n    Based on parse-js (http://marijn.haverbeke.nl/parse-js/).\n\n    Redistribution and use in source and binary forms, with or without\n    modification, are permitted provided that the following conditions\n    are met:\n\n        * Redistributions of source code must retain the above\n          copyright notice, this list of conditions and the following\n          disclaimer.\n\n        * Redistributions in binary form must reproduce the above\n          copyright notice, this list of conditions and the following\n          disclaimer in the documentation and/or other materials\n          provided with the distribution.\n\n    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY\n    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE\n    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR\n    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE\n    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,\n    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,\n    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR\n    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\n    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR\n    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF\n    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF\n    SUCH DAMAGE.\n\n ***********************************************************************/\n\n/* -----[ Tokenizer (constants) ]----- */\n\nvar KEYWORDS = array_to_hash([\n        \"break\",\n        \"case\",\n        \"catch\",\n        \"const\",\n        \"continue\",\n        \"debugger\",\n        \"default\",\n        \"delete\",\n        \"do\",\n        \"else\",\n        \"finally\",\n        \"for\",\n        \"function\",\n        \"if\",\n        \"in\",\n        \"instanceof\",\n        \"new\",\n        \"return\",\n        \"switch\",\n        \"throw\",\n        \"try\",\n        \"typeof\",\n        \"var\",\n        \"void\",\n        \"while\",\n        \"with\"\n]);\n\nvar RESERVED_WORDS = array_to_hash([\n        \"abstract\",\n        \"boolean\",\n        \"byte\",\n        \"char\",\n        \"class\",\n        \"double\",\n        \"enum\",\n        \"export\",\n        \"extends\",\n        \"final\",\n        \"float\",\n        \"goto\",\n        \"implements\",\n        \"import\",\n        \"int\",\n        \"interface\",\n        \"long\",\n        \"native\",\n        \"package\",\n        \"private\",\n        \"protected\",\n        \"public\",\n        \"short\",\n        \"static\",\n        \"super\",\n        \"synchronized\",\n        \"throws\",\n        \"transient\",\n        \"volatile\"\n]);\n\nvar KEYWORDS_BEFORE_EXPRESSION = array_to_hash([\n        \"return\",\n        \"new\",\n        \"delete\",\n        \"throw\",\n        \"else\",\n        \"case\"\n]);\n\nvar KEYWORDS_ATOM = array_to_hash([\n        \"false\",\n        \"null\",\n        \"true\",\n        \"undefined\"\n]);\n\nvar OPERATOR_CHARS = array_to_hash(characters(\"+-*&%=<>!?|~^\"));\n\nvar RE_HEX_NUMBER = /^0x[0-9a-f]+$/i;\nvar RE_OCT_NUMBER = /^0[0-7]+$/;\nvar RE_DEC_NUMBER = /^\\d*\\.?\\d*(?:e[+-]?\\d*(?:\\d\\.?|\\.?\\d)\\d*)?$/i;\n\nvar OPERATORS = array_to_hash([\n        \"in\",\n        \"instanceof\",\n        \"typeof\",\n        \"new\",\n        \"void\",\n        \"delete\",\n        \"++\",\n        \"--\",\n        \"+\",\n        \"-\",\n        \"!\",\n        \"~\",\n        \"&\",\n        \"|\",\n        \"^\",\n        \"*\",\n        \"/\",\n        \"%\",\n        \">>\",\n        \"<<\",\n        \">>>\",\n        \"<\",\n        \">\",\n        \"<=\",\n        \">=\",\n        \"==\",\n        \"===\",\n        \"!=\",\n        \"!==\",\n        \"?\",\n        \"=\",\n        \"+=\",\n        \"-=\",\n        \"/=\",\n        \"*=\",\n        \"%=\",\n        \">>=\",\n        \"<<=\",\n        \">>>=\",\n        \"|=\",\n        \"^=\",\n        \"&=\",\n        \"&&\",\n        \"||\"\n]);\n\nvar WHITESPACE_CHARS = array_to_hash(characters(\" \\u00a0\\n\\r\\t\\f\\u000b\\u200b\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000\"));\n\nvar PUNC_BEFORE_EXPRESSION = array_to_hash(characters(\"[{(,.;:\"));\n\nvar PUNC_CHARS = array_to_hash(characters(\"[]{}(),;:\"));\n\nvar REGEXP_MODIFIERS = array_to_hash(characters(\"gmsiy\"));\n\n/* -----[ Tokenizer ]----- */\n\nvar UNICODE = {  // Unicode 6.1\n        letter: new RegExp(\"[\\\\u0041-\\\\u005A\\\\u0061-\\\\u007A\\\\u00AA\\\\u00B5\\\\u00BA\\\\u00C0-\\\\u00D6\\\\u00D8-\\\\u00F6\\\\u00F8-\\\\u02C1\\\\u02C6-\\\\u02D1\\\\u02E0-\\\\u02E4\\\\u02EC\\\\u02EE\\\\u0370-\\\\u0374\\\\u0376\\\\u0377\\\\u037A-\\\\u037D\\\\u0386\\\\u0388-\\\\u038A\\\\u038C\\\\u038E-\\\\u03A1\\\\u03A3-\\\\u03F5\\\\u03F7-\\\\u0481\\\\u048A-\\\\u0527\\\\u0531-\\\\u0556\\\\u0559\\\\u0561-\\\\u0587\\\\u05D0-\\\\u05EA\\\\u05F0-\\\\u05F2\\\\u0620-\\\\u064A\\\\u066E\\\\u066F\\\\u0671-\\\\u06D3\\\\u06D5\\\\u06E5\\\\u06E6\\\\u06EE\\\\u06EF\\\\u06FA-\\\\u06FC\\\\u06FF\\\\u0710\\\\u0712-\\\\u072F\\\\u074D-\\\\u07A5\\\\u07B1\\\\u07CA-\\\\u07EA\\\\u07F4\\\\u07F5\\\\u07FA\\\\u0800-\\\\u0815\\\\u081A\\\\u0824\\\\u0828\\\\u0840-\\\\u0858\\\\u08A0\\\\u08A2-\\\\u08AC\\\\u0904-\\\\u0939\\\\u093D\\\\u0950\\\\u0958-\\\\u0961\\\\u0971-\\\\u0977\\\\u0979-\\\\u097F\\\\u0985-\\\\u098C\\\\u098F\\\\u0990\\\\u0993-\\\\u09A8\\\\u09AA-\\\\u09B0\\\\u09B2\\\\u09B6-\\\\u09B9\\\\u09BD\\\\u09CE\\\\u09DC\\\\u09DD\\\\u09DF-\\\\u09E1\\\\u09F0\\\\u09F1\\\\u0A05-\\\\u0A0A\\\\u0A0F\\\\u0A10\\\\u0A13-\\\\u0A28\\\\u0A2A-\\\\u0A30\\\\u0A32\\\\u0A33\\\\u0A35\\\\u0A36\\\\u0A38\\\\u0A39\\\\u0A59-\\\\u0A5C\\\\u0A5E\\\\u0A72-\\\\u0A74\\\\u0A85-\\\\u0A8D\\\\u0A8F-\\\\u0A91\\\\u0A93-\\\\u0AA8\\\\u0AAA-\\\\u0AB0\\\\u0AB2\\\\u0AB3\\\\u0AB5-\\\\u0AB9\\\\u0ABD\\\\u0AD0\\\\u0AE0\\\\u0AE1\\\\u0B05-\\\\u0B0C\\\\u0B0F\\\\u0B10\\\\u0B13-\\\\u0B28\\\\u0B2A-\\\\u0B30\\\\u0B32\\\\u0B33\\\\u0B35-\\\\u0B39\\\\u0B3D\\\\u0B5C\\\\u0B5D\\\\u0B5F-\\\\u0B61\\\\u0B71\\\\u0B83\\\\u0B85-\\\\u0B8A\\\\u0B8E-\\\\u0B90\\\\u0B92-\\\\u0B95\\\\u0B99\\\\u0B9A\\\\u0B9C\\\\u0B9E\\\\u0B9F\\\\u0BA3\\\\u0BA4\\\\u0BA8-\\\\u0BAA\\\\u0BAE-\\\\u0BB9\\\\u0BD0\\\\u0C05-\\\\u0C0C\\\\u0C0E-\\\\u0C10\\\\u0C12-\\\\u0C28\\\\u0C2A-\\\\u0C33\\\\u0C35-\\\\u0C39\\\\u0C3D\\\\u0C58\\\\u0C59\\\\u0C60\\\\u0C61\\\\u0C85-\\\\u0C8C\\\\u0C8E-\\\\u0C90\\\\u0C92-\\\\u0CA8\\\\u0CAA-\\\\u0CB3\\\\u0CB5-\\\\u0CB9\\\\u0CBD\\\\u0CDE\\\\u0CE0\\\\u0CE1\\\\u0CF1\\\\u0CF2\\\\u0D05-\\\\u0D0C\\\\u0D0E-\\\\u0D10\\\\u0D12-\\\\u0D3A\\\\u0D3D\\\\u0D4E\\\\u0D60\\\\u0D61\\\\u0D7A-\\\\u0D7F\\\\u0D85-\\\\u0D96\\\\u0D9A-\\\\u0DB1\\\\u0DB3-\\\\u0DBB\\\\u0DBD\\\\u0DC0-\\\\u0DC6\\\\u0E01-\\\\u0E30\\\\u0E32\\\\u0E33\\\\u0E40-\\\\u0E46\\\\u0E81\\\\u0E82\\\\u0E84\\\\u0E87\\\\u0E88\\\\u0E8A\\\\u0E8D\\\\u0E94-\\\\u0E97\\\\u0E99-\\\\u0E9F\\\\u0EA1-\\\\u0EA3\\\\u0EA5\\\\u0EA7\\\\u0EAA\\\\u0EAB\\\\u0EAD-\\\\u0EB0\\\\u0EB2\\\\u0EB3\\\\u0EBD\\\\u0EC0-\\\\u0EC4\\\\u0EC6\\\\u0EDC-\\\\u0EDF\\\\u0F00\\\\u0F40-\\\\u0F47\\\\u0F49-\\\\u0F6C\\\\u0F88-\\\\u0F8C\\\\u1000-\\\\u102A\\\\u103F\\\\u1050-\\\\u1055\\\\u105A-\\\\u105D\\\\u1061\\\\u1065\\\\u1066\\\\u106E-\\\\u1070\\\\u1075-\\\\u1081\\\\u108E\\\\u10A0-\\\\u10C5\\\\u10C7\\\\u10CD\\\\u10D0-\\\\u10FA\\\\u10FC-\\\\u1248\\\\u124A-\\\\u124D\\\\u1250-\\\\u1256\\\\u1258\\\\u125A-\\\\u125D\\\\u1260-\\\\u1288\\\\u128A-\\\\u128D\\\\u1290-\\\\u12B0\\\\u12B2-\\\\u12B5\\\\u12B8-\\\\u12BE\\\\u12C0\\\\u12C2-\\\\u12C5\\\\u12C8-\\\\u12D6\\\\u12D8-\\\\u1310\\\\u1312-\\\\u1315\\\\u1318-\\\\u135A\\\\u1380-\\\\u138F\\\\u13A0-\\\\u13F4\\\\u1401-\\\\u166C\\\\u166F-\\\\u167F\\\\u1681-\\\\u169A\\\\u16A0-\\\\u16EA\\\\u16EE-\\\\u16F0\\\\u1700-\\\\u170C\\\\u170E-\\\\u1711\\\\u1720-\\\\u1731\\\\u1740-\\\\u1751\\\\u1760-\\\\u176C\\\\u176E-\\\\u1770\\\\u1780-\\\\u17B3\\\\u17D7\\\\u17DC\\\\u1820-\\\\u1877\\\\u1880-\\\\u18A8\\\\u18AA\\\\u18B0-\\\\u18F5\\\\u1900-\\\\u191C\\\\u1950-\\\\u196D\\\\u1970-\\\\u1974\\\\u1980-\\\\u19AB\\\\u19C1-\\\\u19C7\\\\u1A00-\\\\u1A16\\\\u1A20-\\\\u1A54\\\\u1AA7\\\\u1B05-\\\\u1B33\\\\u1B45-\\\\u1B4B\\\\u1B83-\\\\u1BA0\\\\u1BAE\\\\u1BAF\\\\u1BBA-\\\\u1BE5\\\\u1C00-\\\\u1C23\\\\u1C4D-\\\\u1C4F\\\\u1C5A-\\\\u1C7D\\\\u1CE9-\\\\u1CEC\\\\u1CEE-\\\\u1CF1\\\\u1CF5\\\\u1CF6\\\\u1D00-\\\\u1DBF\\\\u1E00-\\\\u1F15\\\\u1F18-\\\\u1F1D\\\\u1F20-\\\\u1F45\\\\u1F48-\\\\u1F4D\\\\u1F50-\\\\u1F57\\\\u1F59\\\\u1F5B\\\\u1F5D\\\\u1F5F-\\\\u1F7D\\\\u1F80-\\\\u1FB4\\\\u1FB6-\\\\u1FBC\\\\u1FBE\\\\u1FC2-\\\\u1FC4\\\\u1FC6-\\\\u1FCC\\\\u1FD0-\\\\u1FD3\\\\u1FD6-\\\\u1FDB\\\\u1FE0-\\\\u1FEC\\\\u1FF2-\\\\u1FF4\\\\u1FF6-\\\\u1FFC\\\\u2071\\\\u207F\\\\u2090-\\\\u209C\\\\u2102\\\\u2107\\\\u210A-\\\\u2113\\\\u2115\\\\u2119-\\\\u211D\\\\u2124\\\\u2126\\\\u2128\\\\u212A-\\\\u212D\\\\u212F-\\\\u2139\\\\u213C-\\\\u213F\\\\u2145-\\\\u2149\\\\u214E\\\\u2160-\\\\u2188\\\\u2C00-\\\\u2C2E\\\\u2C30-\\\\u2C5E\\\\u2C60-\\\\u2CE4\\\\u2CEB-\\\\u2CEE\\\\u2CF2\\\\u2CF3\\\\u2D00-\\\\u2D25\\\\u2D27\\\\u2D2D\\\\u2D30-\\\\u2D67\\\\u2D6F\\\\u2D80-\\\\u2D96\\\\u2DA0-\\\\u2DA6\\\\u2DA8-\\\\u2DAE\\\\u2DB0-\\\\u2DB6\\\\u2DB8-\\\\u2DBE\\\\u2DC0-\\\\u2DC6\\\\u2DC8-\\\\u2DCE\\\\u2DD0-\\\\u2DD6\\\\u2DD8-\\\\u2DDE\\\\u2E2F\\\\u3005-\\\\u3007\\\\u3021-\\\\u3029\\\\u3031-\\\\u3035\\\\u3038-\\\\u303C\\\\u3041-\\\\u3096\\\\u309D-\\\\u309F\\\\u30A1-\\\\u30FA\\\\u30FC-\\\\u30FF\\\\u3105-\\\\u312D\\\\u3131-\\\\u318E\\\\u31A0-\\\\u31BA\\\\u31F0-\\\\u31FF\\\\u3400-\\\\u4DB5\\\\u4E00-\\\\u9FCC\\\\uA000-\\\\uA48C\\\\uA4D0-\\\\uA4FD\\\\uA500-\\\\uA60C\\\\uA610-\\\\uA61F\\\\uA62A\\\\uA62B\\\\uA640-\\\\uA66E\\\\uA67F-\\\\uA697\\\\uA6A0-\\\\uA6EF\\\\uA717-\\\\uA71F\\\\uA722-\\\\uA788\\\\uA78B-\\\\uA78E\\\\uA790-\\\\uA793\\\\uA7A0-\\\\uA7AA\\\\uA7F8-\\\\uA801\\\\uA803-\\\\uA805\\\\uA807-\\\\uA80A\\\\uA80C-\\\\uA822\\\\uA840-\\\\uA873\\\\uA882-\\\\uA8B3\\\\uA8F2-\\\\uA8F7\\\\uA8FB\\\\uA90A-\\\\uA925\\\\uA930-\\\\uA946\\\\uA960-\\\\uA97C\\\\uA984-\\\\uA9B2\\\\uA9CF\\\\uAA00-\\\\uAA28\\\\uAA40-\\\\uAA42\\\\uAA44-\\\\uAA4B\\\\uAA60-\\\\uAA76\\\\uAA7A\\\\uAA80-\\\\uAAAF\\\\uAAB1\\\\uAAB5\\\\uAAB6\\\\uAAB9-\\\\uAABD\\\\uAAC0\\\\uAAC2\\\\uAADB-\\\\uAADD\\\\uAAE0-\\\\uAAEA\\\\uAAF2-\\\\uAAF4\\\\uAB01-\\\\uAB06\\\\uAB09-\\\\uAB0E\\\\uAB11-\\\\uAB16\\\\uAB20-\\\\uAB26\\\\uAB28-\\\\uAB2E\\\\uABC0-\\\\uABE2\\\\uAC00-\\\\uD7A3\\\\uD7B0-\\\\uD7C6\\\\uD7CB-\\\\uD7FB\\\\uF900-\\\\uFA6D\\\\uFA70-\\\\uFAD9\\\\uFB00-\\\\uFB06\\\\uFB13-\\\\uFB17\\\\uFB1D\\\\uFB1F-\\\\uFB28\\\\uFB2A-\\\\uFB36\\\\uFB38-\\\\uFB3C\\\\uFB3E\\\\uFB40\\\\uFB41\\\\uFB43\\\\uFB44\\\\uFB46-\\\\uFBB1\\\\uFBD3-\\\\uFD3D\\\\uFD50-\\\\uFD8F\\\\uFD92-\\\\uFDC7\\\\uFDF0-\\\\uFDFB\\\\uFE70-\\\\uFE74\\\\uFE76-\\\\uFEFC\\\\uFF21-\\\\uFF3A\\\\uFF41-\\\\uFF5A\\\\uFF66-\\\\uFFBE\\\\uFFC2-\\\\uFFC7\\\\uFFCA-\\\\uFFCF\\\\uFFD2-\\\\uFFD7\\\\uFFDA-\\\\uFFDC]\"),\n        combining_mark: new RegExp(\"[\\\\u0300-\\\\u036F\\\\u0483-\\\\u0487\\\\u0591-\\\\u05BD\\\\u05BF\\\\u05C1\\\\u05C2\\\\u05C4\\\\u05C5\\\\u05C7\\\\u0610-\\\\u061A\\\\u064B-\\\\u065F\\\\u0670\\\\u06D6-\\\\u06DC\\\\u06DF-\\\\u06E4\\\\u06E7\\\\u06E8\\\\u06EA-\\\\u06ED\\\\u0711\\\\u0730-\\\\u074A\\\\u07A6-\\\\u07B0\\\\u07EB-\\\\u07F3\\\\u0816-\\\\u0819\\\\u081B-\\\\u0823\\\\u0825-\\\\u0827\\\\u0829-\\\\u082D\\\\u0859-\\\\u085B\\\\u08E4-\\\\u08FE\\\\u0900-\\\\u0903\\\\u093A-\\\\u093C\\\\u093E-\\\\u094F\\\\u0951-\\\\u0957\\\\u0962\\\\u0963\\\\u0981-\\\\u0983\\\\u09BC\\\\u09BE-\\\\u09C4\\\\u09C7\\\\u09C8\\\\u09CB-\\\\u09CD\\\\u09D7\\\\u09E2\\\\u09E3\\\\u0A01-\\\\u0A03\\\\u0A3C\\\\u0A3E-\\\\u0A42\\\\u0A47\\\\u0A48\\\\u0A4B-\\\\u0A4D\\\\u0A51\\\\u0A70\\\\u0A71\\\\u0A75\\\\u0A81-\\\\u0A83\\\\u0ABC\\\\u0ABE-\\\\u0AC5\\\\u0AC7-\\\\u0AC9\\\\u0ACB-\\\\u0ACD\\\\u0AE2\\\\u0AE3\\\\u0B01-\\\\u0B03\\\\u0B3C\\\\u0B3E-\\\\u0B44\\\\u0B47\\\\u0B48\\\\u0B4B-\\\\u0B4D\\\\u0B56\\\\u0B57\\\\u0B62\\\\u0B63\\\\u0B82\\\\u0BBE-\\\\u0BC2\\\\u0BC6-\\\\u0BC8\\\\u0BCA-\\\\u0BCD\\\\u0BD7\\\\u0C01-\\\\u0C03\\\\u0C3E-\\\\u0C44\\\\u0C46-\\\\u0C48\\\\u0C4A-\\\\u0C4D\\\\u0C55\\\\u0C56\\\\u0C62\\\\u0C63\\\\u0C82\\\\u0C83\\\\u0CBC\\\\u0CBE-\\\\u0CC4\\\\u0CC6-\\\\u0CC8\\\\u0CCA-\\\\u0CCD\\\\u0CD5\\\\u0CD6\\\\u0CE2\\\\u0CE3\\\\u0D02\\\\u0D03\\\\u0D3E-\\\\u0D44\\\\u0D46-\\\\u0D48\\\\u0D4A-\\\\u0D4D\\\\u0D57\\\\u0D62\\\\u0D63\\\\u0D82\\\\u0D83\\\\u0DCA\\\\u0DCF-\\\\u0DD4\\\\u0DD6\\\\u0DD8-\\\\u0DDF\\\\u0DF2\\\\u0DF3\\\\u0E31\\\\u0E34-\\\\u0E3A\\\\u0E47-\\\\u0E4E\\\\u0EB1\\\\u0EB4-\\\\u0EB9\\\\u0EBB\\\\u0EBC\\\\u0EC8-\\\\u0ECD\\\\u0F18\\\\u0F19\\\\u0F35\\\\u0F37\\\\u0F39\\\\u0F3E\\\\u0F3F\\\\u0F71-\\\\u0F84\\\\u0F86\\\\u0F87\\\\u0F8D-\\\\u0F97\\\\u0F99-\\\\u0FBC\\\\u0FC6\\\\u102B-\\\\u103E\\\\u1056-\\\\u1059\\\\u105E-\\\\u1060\\\\u1062-\\\\u1064\\\\u1067-\\\\u106D\\\\u1071-\\\\u1074\\\\u1082-\\\\u108D\\\\u108F\\\\u109A-\\\\u109D\\\\u135D-\\\\u135F\\\\u1712-\\\\u1714\\\\u1732-\\\\u1734\\\\u1752\\\\u1753\\\\u1772\\\\u1773\\\\u17B4-\\\\u17D3\\\\u17DD\\\\u180B-\\\\u180D\\\\u18A9\\\\u1920-\\\\u192B\\\\u1930-\\\\u193B\\\\u19B0-\\\\u19C0\\\\u19C8\\\\u19C9\\\\u1A17-\\\\u1A1B\\\\u1A55-\\\\u1A5E\\\\u1A60-\\\\u1A7C\\\\u1A7F\\\\u1B00-\\\\u1B04\\\\u1B34-\\\\u1B44\\\\u1B6B-\\\\u1B73\\\\u1B80-\\\\u1B82\\\\u1BA1-\\\\u1BAD\\\\u1BE6-\\\\u1BF3\\\\u1C24-\\\\u1C37\\\\u1CD0-\\\\u1CD2\\\\u1CD4-\\\\u1CE8\\\\u1CED\\\\u1CF2-\\\\u1CF4\\\\u1DC0-\\\\u1DE6\\\\u1DFC-\\\\u1DFF\\\\u20D0-\\\\u20DC\\\\u20E1\\\\u20E5-\\\\u20F0\\\\u2CEF-\\\\u2CF1\\\\u2D7F\\\\u2DE0-\\\\u2DFF\\\\u302A-\\\\u302F\\\\u3099\\\\u309A\\\\uA66F\\\\uA674-\\\\uA67D\\\\uA69F\\\\uA6F0\\\\uA6F1\\\\uA802\\\\uA806\\\\uA80B\\\\uA823-\\\\uA827\\\\uA880\\\\uA881\\\\uA8B4-\\\\uA8C4\\\\uA8E0-\\\\uA8F1\\\\uA926-\\\\uA92D\\\\uA947-\\\\uA953\\\\uA980-\\\\uA983\\\\uA9B3-\\\\uA9C0\\\\uAA29-\\\\uAA36\\\\uAA43\\\\uAA4C\\\\uAA4D\\\\uAA7B\\\\uAAB0\\\\uAAB2-\\\\uAAB4\\\\uAAB7\\\\uAAB8\\\\uAABE\\\\uAABF\\\\uAAC1\\\\uAAEB-\\\\uAAEF\\\\uAAF5\\\\uAAF6\\\\uABE3-\\\\uABEA\\\\uABEC\\\\uABED\\\\uFB1E\\\\uFE00-\\\\uFE0F\\\\uFE20-\\\\uFE26]\"),\n        connector_punctuation: new RegExp(\"[\\\\u005F\\\\u203F\\\\u2040\\\\u2054\\\\uFE33\\\\uFE34\\\\uFE4D-\\\\uFE4F\\\\uFF3F]\"),\n        digit: new RegExp(\"[\\\\u0030-\\\\u0039\\\\u0660-\\\\u0669\\\\u06F0-\\\\u06F9\\\\u07C0-\\\\u07C9\\\\u0966-\\\\u096F\\\\u09E6-\\\\u09EF\\\\u0A66-\\\\u0A6F\\\\u0AE6-\\\\u0AEF\\\\u0B66-\\\\u0B6F\\\\u0BE6-\\\\u0BEF\\\\u0C66-\\\\u0C6F\\\\u0CE6-\\\\u0CEF\\\\u0D66-\\\\u0D6F\\\\u0E50-\\\\u0E59\\\\u0ED0-\\\\u0ED9\\\\u0F20-\\\\u0F29\\\\u1040-\\\\u1049\\\\u1090-\\\\u1099\\\\u17E0-\\\\u17E9\\\\u1810-\\\\u1819\\\\u1946-\\\\u194F\\\\u19D0-\\\\u19D9\\\\u1A80-\\\\u1A89\\\\u1A90-\\\\u1A99\\\\u1B50-\\\\u1B59\\\\u1BB0-\\\\u1BB9\\\\u1C40-\\\\u1C49\\\\u1C50-\\\\u1C59\\\\uA620-\\\\uA629\\\\uA8D0-\\\\uA8D9\\\\uA900-\\\\uA909\\\\uA9D0-\\\\uA9D9\\\\uAA50-\\\\uAA59\\\\uABF0-\\\\uABF9\\\\uFF10-\\\\uFF19]\")\n};\n\nfunction is_letter(ch) {\n        return UNICODE.letter.test(ch);\n};\n\nfunction is_digit(ch) {\n        ch = ch.charCodeAt(0);\n        return ch >= 48 && ch <= 57;\n};\n\nfunction is_unicode_digit(ch) {\n        return UNICODE.digit.test(ch);\n}\n\nfunction is_alphanumeric_char(ch) {\n        return is_digit(ch) || is_letter(ch);\n};\n\nfunction is_unicode_combining_mark(ch) {\n        return UNICODE.combining_mark.test(ch);\n};\n\nfunction is_unicode_connector_punctuation(ch) {\n        return UNICODE.connector_punctuation.test(ch);\n};\n\nfunction is_identifier_start(ch) {\n        return ch == \"$\" || ch == \"_\" || is_letter(ch);\n};\n\nfunction is_identifier_char(ch) {\n        return is_identifier_start(ch)\n                || is_unicode_combining_mark(ch)\n                || is_unicode_digit(ch)\n                || is_unicode_connector_punctuation(ch)\n                || ch == \"\\u200c\" // zero-width non-joiner <ZWNJ>\n                || ch == \"\\u200d\" // zero-width joiner <ZWJ> (in my ECMA-262 PDF, this is also 200c)\n        ;\n};\n\nfunction parse_js_number(num) {\n        if (RE_HEX_NUMBER.test(num)) {\n                return parseInt(num.substr(2), 16);\n        } else if (RE_OCT_NUMBER.test(num)) {\n                return parseInt(num.substr(1), 8);\n        } else if (RE_DEC_NUMBER.test(num)) {\n                return parseFloat(num);\n        }\n};\n\nfunction JS_Parse_Error(message, line, col, pos) {\n        this.message = message;\n        this.line = line + 1;\n        this.col = col + 1;\n        this.pos = pos + 1;\n        this.stack = new Error().stack;\n};\n\nJS_Parse_Error.prototype.toString = function() {\n        return this.message + \" (line: \" + this.line + \", col: \" + this.col + \", pos: \" + this.pos + \")\" + \"\\n\\n\" + this.stack;\n};\n\nfunction js_error(message, line, col, pos) {\n        throw new JS_Parse_Error(message, line, col, pos);\n};\n\nfunction is_token(token, type, val) {\n        return token.type == type && (val == null || token.value == val);\n};\n\nvar EX_EOF = {};\n\nfunction tokenizer($TEXT) {\n\n        var S = {\n                text            : $TEXT.replace(/\\r\\n?|[\\n\\u2028\\u2029]/g, \"\\n\").replace(/^\\uFEFF/, ''),\n                pos             : 0,\n                tokpos          : 0,\n                line            : 0,\n                tokline         : 0,\n                col             : 0,\n                tokcol          : 0,\n                newline_before  : false,\n                regex_allowed   : false,\n                comments_before : []\n        };\n\n        function peek() { return S.text.charAt(S.pos); };\n\n        function next(signal_eof, in_string) {\n                var ch = S.text.charAt(S.pos++);\n                if (signal_eof && !ch)\n                        throw EX_EOF;\n                if (ch == \"\\n\") {\n                        S.newline_before = S.newline_before || !in_string;\n                        ++S.line;\n                        S.col = 0;\n                } else {\n                        ++S.col;\n                }\n                return ch;\n        };\n\n        function eof() {\n                return !S.peek();\n        };\n\n        function find(what, signal_eof) {\n                var pos = S.text.indexOf(what, S.pos);\n                if (signal_eof && pos == -1) throw EX_EOF;\n                return pos;\n        };\n\n        function start_token() {\n                S.tokline = S.line;\n                S.tokcol = S.col;\n                S.tokpos = S.pos;\n        };\n\n        function token(type, value, is_comment) {\n                S.regex_allowed = ((type == \"operator\" && !HOP(UNARY_POSTFIX, value)) ||\n                                   (type == \"keyword\" && HOP(KEYWORDS_BEFORE_EXPRESSION, value)) ||\n                                   (type == \"punc\" && HOP(PUNC_BEFORE_EXPRESSION, value)));\n                var ret = {\n                        type   : type,\n                        value  : value,\n                        line   : S.tokline,\n                        col    : S.tokcol,\n                        pos    : S.tokpos,\n                        endpos : S.pos,\n                        nlb    : S.newline_before\n                };\n                if (!is_comment) {\n                        ret.comments_before = S.comments_before;\n                        S.comments_before = [];\n                        // make note of any newlines in the comments that came before\n                        for (var i = 0, len = ret.comments_before.length; i < len; i++) {\n                                ret.nlb = ret.nlb || ret.comments_before[i].nlb;\n                        }\n                }\n                S.newline_before = false;\n                return ret;\n        };\n\n        function skip_whitespace() {\n                while (HOP(WHITESPACE_CHARS, peek()))\n                        next();\n        };\n\n        function read_while(pred) {\n                var ret = \"\", ch = peek(), i = 0;\n                while (ch && pred(ch, i++)) {\n                        ret += next();\n                        ch = peek();\n                }\n                return ret;\n        };\n\n        function parse_error(err) {\n                js_error(err, S.tokline, S.tokcol, S.tokpos);\n        };\n\n        function read_num(prefix) {\n                var has_e = false, after_e = false, has_x = false, has_dot = prefix == \".\";\n                var num = read_while(function(ch, i){\n                        if (ch == \"x\" || ch == \"X\") {\n                                if (has_x) return false;\n                                return has_x = true;\n                        }\n                        if (!has_x && (ch == \"E\" || ch == \"e\")) {\n                                if (has_e) return false;\n                                return has_e = after_e = true;\n                        }\n                        if (ch == \"-\") {\n                                if (after_e || (i == 0 && !prefix)) return true;\n                                return false;\n                        }\n                        if (ch == \"+\") return after_e;\n                        after_e = false;\n                        if (ch == \".\") {\n                                if (!has_dot && !has_x && !has_e)\n                                        return has_dot = true;\n                                return false;\n                        }\n                        return is_alphanumeric_char(ch);\n                });\n                if (prefix)\n                        num = prefix + num;\n                var valid = parse_js_number(num);\n                if (!isNaN(valid)) {\n                        return token(\"num\", valid);\n                } else {\n                        parse_error(\"Invalid syntax: \" + num);\n                }\n        };\n\n        function read_escaped_char(in_string) {\n                var ch = next(true, in_string);\n                switch (ch) {\n                    case \"n\" : return \"\\n\";\n                    case \"r\" : return \"\\r\";\n                    case \"t\" : return \"\\t\";\n                    case \"b\" : return \"\\b\";\n                    case \"v\" : return \"\\u000b\";\n                    case \"f\" : return \"\\f\";\n                    case \"0\" : return \"\\0\";\n                    case \"x\" : return String.fromCharCode(hex_bytes(2));\n                    case \"u\" : return String.fromCharCode(hex_bytes(4));\n                    case \"\\n\": return \"\";\n                    default  : return ch;\n                }\n        };\n\n        function hex_bytes(n) {\n                var num = 0;\n                for (; n > 0; --n) {\n                        var digit = parseInt(next(true), 16);\n                        if (isNaN(digit))\n                                parse_error(\"Invalid hex-character pattern in string\");\n                        num = (num << 4) | digit;\n                }\n                return num;\n        };\n\n        function read_string() {\n                return with_eof_error(\"Unterminated string constant\", function(){\n                        var quote = next(), ret = \"\";\n                        for (;;) {\n                                var ch = next(true);\n                                if (ch == \"\\\\\") {\n                                        // read OctalEscapeSequence (XXX: deprecated if \"strict mode\")\n                                        // https://github.com/mishoo/UglifyJS/issues/178\n                                        var octal_len = 0, first = null;\n                                        ch = read_while(function(ch){\n                                                if (ch >= \"0\" && ch <= \"7\") {\n                                                        if (!first) {\n                                                                first = ch;\n                                                                return ++octal_len;\n                                                        }\n                                                        else if (first <= \"3\" && octal_len <= 2) return ++octal_len;\n                                                        else if (first >= \"4\" && octal_len <= 1) return ++octal_len;\n                                                }\n                                                return false;\n                                        });\n                                        if (octal_len > 0) ch = String.fromCharCode(parseInt(ch, 8));\n                                        else ch = read_escaped_char(true);\n                                }\n                                else if (ch == quote) break;\n                                ret += ch;\n                        }\n                        return token(\"string\", ret);\n                });\n        };\n\n        function read_line_comment() {\n                next();\n                var i = find(\"\\n\"), ret;\n                if (i == -1) {\n                        ret = S.text.substr(S.pos);\n                        S.pos = S.text.length;\n                } else {\n                        ret = S.text.substring(S.pos, i);\n                        S.pos = i;\n                }\n                return token(\"comment1\", ret, true);\n        };\n\n        function read_multiline_comment() {\n                next();\n                return with_eof_error(\"Unterminated multiline comment\", function(){\n                        var i = find(\"*/\", true),\n                            text = S.text.substring(S.pos, i);\n                        S.pos = i + 2;\n                        S.line += text.split(\"\\n\").length - 1;\n                        S.newline_before = S.newline_before || text.indexOf(\"\\n\") >= 0;\n\n                        // https://github.com/mishoo/UglifyJS/issues/#issue/100\n                        if (/^@cc_on/i.test(text)) {\n                                warn(\"WARNING: at line \" + S.line);\n                                warn(\"*** Found \\\"conditional comment\\\": \" + text);\n                                warn(\"*** UglifyJS DISCARDS ALL COMMENTS.  This means your code might no longer work properly in Internet Explorer.\");\n                        }\n\n                        return token(\"comment2\", text, true);\n                });\n        };\n\n        function read_name() {\n                var backslash = false, name = \"\", ch, escaped = false, hex;\n                while ((ch = peek()) != null) {\n                        if (!backslash) {\n                                if (ch == \"\\\\\") escaped = backslash = true, next();\n                                else if (is_identifier_char(ch)) name += next();\n                                else break;\n                        }\n                        else {\n                                if (ch != \"u\") parse_error(\"Expecting UnicodeEscapeSequence -- uXXXX\");\n                                ch = read_escaped_char();\n                                if (!is_identifier_char(ch)) parse_error(\"Unicode char: \" + ch.charCodeAt(0) + \" is not valid in identifier\");\n                                name += ch;\n                                backslash = false;\n                        }\n                }\n                if (HOP(KEYWORDS, name) && escaped) {\n                        hex = name.charCodeAt(0).toString(16).toUpperCase();\n                        name = \"\\\\u\" + \"0000\".substr(hex.length) + hex + name.slice(1);\n                }\n                return name;\n        };\n\n        function read_regexp(regexp) {\n                return with_eof_error(\"Unterminated regular expression\", function(){\n                        var prev_backslash = false, ch, in_class = false;\n                        while ((ch = next(true))) if (prev_backslash) {\n                                regexp += \"\\\\\" + ch;\n                                prev_backslash = false;\n                        } else if (ch == \"[\") {\n                                in_class = true;\n                                regexp += ch;\n                        } else if (ch == \"]\" && in_class) {\n                                in_class = false;\n                                regexp += ch;\n                        } else if (ch == \"/\" && !in_class) {\n                                break;\n                        } else if (ch == \"\\\\\") {\n                                prev_backslash = true;\n                        } else {\n                                regexp += ch;\n                        }\n                        var mods = read_name();\n                        return token(\"regexp\", [ regexp, mods ]);\n                });\n        };\n\n        function read_operator(prefix) {\n                function grow(op) {\n                        if (!peek()) return op;\n                        var bigger = op + peek();\n                        if (HOP(OPERATORS, bigger)) {\n                                next();\n                                return grow(bigger);\n                        } else {\n                                return op;\n                        }\n                };\n                return token(\"operator\", grow(prefix || next()));\n        };\n\n        function handle_slash() {\n                next();\n                var regex_allowed = S.regex_allowed;\n                switch (peek()) {\n                    case \"/\":\n                        S.comments_before.push(read_line_comment());\n                        S.regex_allowed = regex_allowed;\n                        return next_token();\n                    case \"*\":\n                        S.comments_before.push(read_multiline_comment());\n                        S.regex_allowed = regex_allowed;\n                        return next_token();\n                }\n                return S.regex_allowed ? read_regexp(\"\") : read_operator(\"/\");\n        };\n\n        function handle_dot() {\n                next();\n                return is_digit(peek())\n                        ? read_num(\".\")\n                        : token(\"punc\", \".\");\n        };\n\n        function read_word() {\n                var word = read_name();\n                return !HOP(KEYWORDS, word)\n                        ? token(\"name\", word)\n                        : HOP(OPERATORS, word)\n                        ? token(\"operator\", word)\n                        : HOP(KEYWORDS_ATOM, word)\n                        ? token(\"atom\", word)\n                        : token(\"keyword\", word);\n        };\n\n        function with_eof_error(eof_error, cont) {\n                try {\n                        return cont();\n                } catch(ex) {\n                        if (ex === EX_EOF) parse_error(eof_error);\n                        else throw ex;\n                }\n        };\n\n        function next_token(force_regexp) {\n                if (force_regexp != null)\n                        return read_regexp(force_regexp);\n                skip_whitespace();\n                start_token();\n                var ch = peek();\n                if (!ch) return token(\"eof\");\n                if (is_digit(ch)) return read_num();\n                if (ch == '\"' || ch == \"'\") return read_string();\n                if (HOP(PUNC_CHARS, ch)) return token(\"punc\", next());\n                if (ch == \".\") return handle_dot();\n                if (ch == \"/\") return handle_slash();\n                if (HOP(OPERATOR_CHARS, ch)) return read_operator();\n                if (ch == \"\\\\\" || is_identifier_start(ch)) return read_word();\n                parse_error(\"Unexpected character '\" + ch + \"'\");\n        };\n\n        next_token.context = function(nc) {\n                if (nc) S = nc;\n                return S;\n        };\n\n        return next_token;\n\n};\n\n/* -----[ Parser (constants) ]----- */\n\nvar UNARY_PREFIX = array_to_hash([\n        \"typeof\",\n        \"void\",\n        \"delete\",\n        \"--\",\n        \"++\",\n        \"!\",\n        \"~\",\n        \"-\",\n        \"+\"\n]);\n\nvar UNARY_POSTFIX = array_to_hash([ \"--\", \"++\" ]);\n\nvar ASSIGNMENT = (function(a, ret, i){\n        while (i < a.length) {\n                ret[a[i]] = a[i].substr(0, a[i].length - 1);\n                i++;\n        }\n        return ret;\n})(\n        [\"+=\", \"-=\", \"/=\", \"*=\", \"%=\", \">>=\", \"<<=\", \">>>=\", \"|=\", \"^=\", \"&=\"],\n        { \"=\": true },\n        0\n);\n\nvar PRECEDENCE = (function(a, ret){\n        for (var i = 0, n = 1; i < a.length; ++i, ++n) {\n                var b = a[i];\n                for (var j = 0; j < b.length; ++j) {\n                        ret[b[j]] = n;\n                }\n        }\n        return ret;\n})(\n        [\n                [\"||\"],\n                [\"&&\"],\n                [\"|\"],\n                [\"^\"],\n                [\"&\"],\n                [\"==\", \"===\", \"!=\", \"!==\"],\n                [\"<\", \">\", \"<=\", \">=\", \"in\", \"instanceof\"],\n                [\">>\", \"<<\", \">>>\"],\n                [\"+\", \"-\"],\n                [\"*\", \"/\", \"%\"]\n        ],\n        {}\n);\n\nvar STATEMENTS_WITH_LABELS = array_to_hash([ \"for\", \"do\", \"while\", \"switch\" ]);\n\nvar ATOMIC_START_TOKEN = array_to_hash([ \"atom\", \"num\", \"string\", \"regexp\", \"name\" ]);\n\n/* -----[ Parser ]----- */\n\nfunction NodeWithToken(str, start, end) {\n        this.name = str;\n        this.start = start;\n        this.end = end;\n};\n\nNodeWithToken.prototype.toString = function() { return this.name; };\n\nfunction parse($TEXT, exigent_mode, embed_tokens) {\n\n        var S = {\n                input         : typeof $TEXT == \"string\" ? tokenizer($TEXT, true) : $TEXT,\n                token         : null,\n                prev          : null,\n                peeked        : null,\n                in_function   : 0,\n                in_directives : true,\n                in_loop       : 0,\n                labels        : []\n        };\n\n        S.token = next();\n\n        function is(type, value) {\n                return is_token(S.token, type, value);\n        };\n\n        function peek() { return S.peeked || (S.peeked = S.input()); };\n\n        function next() {\n                S.prev = S.token;\n                if (S.peeked) {\n                        S.token = S.peeked;\n                        S.peeked = null;\n                } else {\n                        S.token = S.input();\n                }\n                S.in_directives = S.in_directives && (\n                        S.token.type == \"string\" || is(\"punc\", \";\")\n                );\n                return S.token;\n        };\n\n        function prev() {\n                return S.prev;\n        };\n\n        function croak(msg, line, col, pos) {\n                var ctx = S.input.context();\n                js_error(msg,\n                         line != null ? line : ctx.tokline,\n                         col != null ? col : ctx.tokcol,\n                         pos != null ? pos : ctx.tokpos);\n        };\n\n        function token_error(token, msg) {\n                croak(msg, token.line, token.col);\n        };\n\n        function unexpected(token) {\n                if (token == null)\n                        token = S.token;\n                token_error(token, \"Unexpected token: \" + token.type + \" (\" + token.value + \")\");\n        };\n\n        function expect_token(type, val) {\n                if (is(type, val)) {\n                        return next();\n                }\n                token_error(S.token, \"Unexpected token \" + S.token.type + \", expected \" + type);\n        };\n\n        function expect(punc) { return expect_token(\"punc\", punc); };\n\n        function can_insert_semicolon() {\n                return !exigent_mode && (\n                        S.token.nlb || is(\"eof\") || is(\"punc\", \"}\")\n                );\n        };\n\n        function semicolon() {\n                if (is(\"punc\", \";\")) next();\n                else if (!can_insert_semicolon()) unexpected();\n        };\n\n        function as() {\n                return slice(arguments);\n        };\n\n        function parenthesised() {\n                expect(\"(\");\n                var ex = expression();\n                expect(\")\");\n                return ex;\n        };\n\n        function add_tokens(str, start, end) {\n                return str instanceof NodeWithToken ? str : new NodeWithToken(str, start, end);\n        };\n\n        function maybe_embed_tokens(parser) {\n                if (embed_tokens) return function() {\n                        var start = S.token;\n                        var ast = parser.apply(this, arguments);\n                        ast[0] = add_tokens(ast[0], start, prev());\n                        return ast;\n                };\n                else return parser;\n        };\n\n        var statement = maybe_embed_tokens(function() {\n                if (is(\"operator\", \"/\") || is(\"operator\", \"/=\")) {\n                        S.peeked = null;\n                        S.token = S.input(S.token.value.substr(1)); // force regexp\n                }\n                switch (S.token.type) {\n                    case \"string\":\n                        var dir = S.in_directives, stat = simple_statement();\n                        if (dir && stat[1][0] == \"string\" && !is(\"punc\", \",\"))\n                            return as(\"directive\", stat[1][1]);\n                        return stat;\n                    case \"num\":\n                    case \"regexp\":\n                    case \"operator\":\n                    case \"atom\":\n                        return simple_statement();\n\n                    case \"name\":\n                        return is_token(peek(), \"punc\", \":\")\n                                ? labeled_statement(prog1(S.token.value, next, next))\n                                : simple_statement();\n\n                    case \"punc\":\n                        switch (S.token.value) {\n                            case \"{\":\n                                return as(\"block\", block_());\n                            case \"[\":\n                            case \"(\":\n                                return simple_statement();\n                            case \";\":\n                                next();\n                                return as(\"block\");\n                            default:\n                                unexpected();\n                        }\n\n                    case \"keyword\":\n                        switch (prog1(S.token.value, next)) {\n                            case \"break\":\n                                return break_cont(\"break\");\n\n                            case \"continue\":\n                                return break_cont(\"continue\");\n\n                            case \"debugger\":\n                                semicolon();\n                                return as(\"debugger\");\n\n                            case \"do\":\n                                return (function(body){\n                                        expect_token(\"keyword\", \"while\");\n                                        return as(\"do\", prog1(parenthesised, semicolon), body);\n                                })(in_loop(statement));\n\n                            case \"for\":\n                                return for_();\n\n                            case \"function\":\n                                return function_(true);\n\n                            case \"if\":\n                                return if_();\n\n                            case \"return\":\n                                if (S.in_function == 0)\n                                        croak(\"'return' outside of function\");\n                                return as(\"return\",\n                                          is(\"punc\", \";\")\n                                          ? (next(), null)\n                                          : can_insert_semicolon()\n                                          ? null\n                                          : prog1(expression, semicolon));\n\n                            case \"switch\":\n                                return as(\"switch\", parenthesised(), switch_block_());\n\n                            case \"throw\":\n                                if (S.token.nlb)\n                                        croak(\"Illegal newline after 'throw'\");\n                                return as(\"throw\", prog1(expression, semicolon));\n\n                            case \"try\":\n                                return try_();\n\n                            case \"var\":\n                                return prog1(var_, semicolon);\n\n                            case \"const\":\n                                return prog1(const_, semicolon);\n\n                            case \"while\":\n                                return as(\"while\", parenthesised(), in_loop(statement));\n\n                            case \"with\":\n                                return as(\"with\", parenthesised(), statement());\n\n                            default:\n                                unexpected();\n                        }\n                }\n        });\n\n        function labeled_statement(label) {\n                S.labels.push(label);\n                var start = S.token, stat = statement();\n                if (exigent_mode && !HOP(STATEMENTS_WITH_LABELS, stat[0]))\n                        unexpected(start);\n                S.labels.pop();\n                return as(\"label\", label, stat);\n        };\n\n        function simple_statement() {\n                return as(\"stat\", prog1(expression, semicolon));\n        };\n\n        function break_cont(type) {\n                var name;\n                if (!can_insert_semicolon()) {\n                        name = is(\"name\") ? S.token.value : null;\n                }\n                if (name != null) {\n                        next();\n                        if (!member(name, S.labels))\n                                croak(\"Label \" + name + \" without matching loop or statement\");\n                }\n                else if (S.in_loop == 0)\n                        croak(type + \" not inside a loop or switch\");\n                semicolon();\n                return as(type, name);\n        };\n\n        function for_() {\n                expect(\"(\");\n                var init = null;\n                if (!is(\"punc\", \";\")) {\n                        init = is(\"keyword\", \"var\")\n                                ? (next(), var_(true))\n                                : expression(true, true);\n                        if (is(\"operator\", \"in\")) {\n                                if (init[0] == \"var\" && init[1].length > 1)\n                                        croak(\"Only one variable declaration allowed in for..in loop\");\n                                return for_in(init);\n                        }\n                }\n                return regular_for(init);\n        };\n\n        function regular_for(init) {\n                expect(\";\");\n                var test = is(\"punc\", \";\") ? null : expression();\n                expect(\";\");\n                var step = is(\"punc\", \")\") ? null : expression();\n                expect(\")\");\n                return as(\"for\", init, test, step, in_loop(statement));\n        };\n\n        function for_in(init) {\n                var lhs = init[0] == \"var\" ? as(\"name\", init[1][0]) : init;\n                next();\n                var obj = expression();\n                expect(\")\");\n                return as(\"for-in\", init, lhs, obj, in_loop(statement));\n        };\n\n        var function_ = function(in_statement) {\n                var name = is(\"name\") ? prog1(S.token.value, next) : null;\n                if (in_statement && !name)\n                        unexpected();\n                expect(\"(\");\n                return as(in_statement ? \"defun\" : \"function\",\n                          name,\n                          // arguments\n                          (function(first, a){\n                                  while (!is(\"punc\", \")\")) {\n                                          if (first) first = false; else expect(\",\");\n                                          if (!is(\"name\")) unexpected();\n                                          a.push(S.token.value);\n                                          next();\n                                  }\n                                  next();\n                                  return a;\n                          })(true, []),\n                          // body\n                          (function(){\n                                  ++S.in_function;\n                                  var loop = S.in_loop;\n                                  S.in_directives = true;\n                                  S.in_loop = 0;\n                                  var a = block_();\n                                  --S.in_function;\n                                  S.in_loop = loop;\n                                  return a;\n                          })());\n        };\n\n        function if_() {\n                var cond = parenthesised(), body = statement(), belse;\n                if (is(\"keyword\", \"else\")) {\n                        next();\n                        belse = statement();\n                }\n                return as(\"if\", cond, body, belse);\n        };\n\n        function block_() {\n                expect(\"{\");\n                var a = [];\n                while (!is(\"punc\", \"}\")) {\n                        if (is(\"eof\")) unexpected();\n                        a.push(statement());\n                }\n                next();\n                return a;\n        };\n\n        var switch_block_ = curry(in_loop, function(){\n                expect(\"{\");\n                var a = [], cur = null;\n                while (!is(\"punc\", \"}\")) {\n                        if (is(\"eof\")) unexpected();\n                        if (is(\"keyword\", \"case\")) {\n                                next();\n                                cur = [];\n                                a.push([ expression(), cur ]);\n                                expect(\":\");\n                        }\n                        else if (is(\"keyword\", \"default\")) {\n                                next();\n                                expect(\":\");\n                                cur = [];\n                                a.push([ null, cur ]);\n                        }\n                        else {\n                                if (!cur) unexpected();\n                                cur.push(statement());\n                        }\n                }\n                next();\n                return a;\n        });\n\n        function try_() {\n                var body = block_(), bcatch, bfinally;\n                if (is(\"keyword\", \"catch\")) {\n                        next();\n                        expect(\"(\");\n                        if (!is(\"name\"))\n                                croak(\"Name expected\");\n                        var name = S.token.value;\n                        next();\n                        expect(\")\");\n                        bcatch = [ name, block_() ];\n                }\n                if (is(\"keyword\", \"finally\")) {\n                        next();\n                        bfinally = block_();\n                }\n                if (!bcatch && !bfinally)\n                        croak(\"Missing catch/finally blocks\");\n                return as(\"try\", body, bcatch, bfinally);\n        };\n\n        function vardefs(no_in) {\n                var a = [];\n                for (;;) {\n                        if (!is(\"name\"))\n                                unexpected();\n                        var name = S.token.value;\n                        next();\n                        if (is(\"operator\", \"=\")) {\n                                next();\n                                a.push([ name, expression(false, no_in) ]);\n                        } else {\n                                a.push([ name ]);\n                        }\n                        if (!is(\"punc\", \",\"))\n                                break;\n                        next();\n                }\n                return a;\n        };\n\n        function var_(no_in) {\n                return as(\"var\", vardefs(no_in));\n        };\n\n        function const_() {\n                return as(\"const\", vardefs());\n        };\n\n        function new_() {\n                var newexp = expr_atom(false), args;\n                if (is(\"punc\", \"(\")) {\n                        next();\n                        args = expr_list(\")\");\n                } else {\n                        args = [];\n                }\n                return subscripts(as(\"new\", newexp, args), true);\n        };\n\n        var expr_atom = maybe_embed_tokens(function(allow_calls) {\n                if (is(\"operator\", \"new\")) {\n                        next();\n                        return new_();\n                }\n                if (is(\"punc\")) {\n                        switch (S.token.value) {\n                            case \"(\":\n                                next();\n                                return subscripts(prog1(expression, curry(expect, \")\")), allow_calls);\n                            case \"[\":\n                                next();\n                                return subscripts(array_(), allow_calls);\n                            case \"{\":\n                                next();\n                                return subscripts(object_(), allow_calls);\n                        }\n                        unexpected();\n                }\n                if (is(\"keyword\", \"function\")) {\n                        next();\n                        return subscripts(function_(false), allow_calls);\n                }\n                if (HOP(ATOMIC_START_TOKEN, S.token.type)) {\n                        var atom = S.token.type == \"regexp\"\n                                ? as(\"regexp\", S.token.value[0], S.token.value[1])\n                                : as(S.token.type, S.token.value);\n                        return subscripts(prog1(atom, next), allow_calls);\n                }\n                unexpected();\n        });\n\n        function expr_list(closing, allow_trailing_comma, allow_empty) {\n                var first = true, a = [];\n                while (!is(\"punc\", closing)) {\n                        if (first) first = false; else expect(\",\");\n                        if (allow_trailing_comma && is(\"punc\", closing)) break;\n                        if (is(\"punc\", \",\") && allow_empty) {\n                                a.push([ \"atom\", \"undefined\" ]);\n                        } else {\n                                a.push(expression(false));\n                        }\n                }\n                next();\n                return a;\n        };\n\n        function array_() {\n                return as(\"array\", expr_list(\"]\", !exigent_mode, true));\n        };\n\n        function object_() {\n                var first = true, a = [];\n                while (!is(\"punc\", \"}\")) {\n                        if (first) first = false; else expect(\",\");\n                        if (!exigent_mode && is(\"punc\", \"}\"))\n                                // allow trailing comma\n                                break;\n                        var type = S.token.type;\n                        var name = as_property_name();\n                        if (type == \"name\" && (name == \"get\" || name == \"set\") && !is(\"punc\", \":\")) {\n                                a.push([ as_name(), function_(false), name ]);\n                        } else {\n                                expect(\":\");\n                                a.push([ name, expression(false) ]);\n                        }\n                }\n                next();\n                return as(\"object\", a);\n        };\n\n        function as_property_name() {\n                switch (S.token.type) {\n                    case \"num\":\n                    case \"string\":\n                        return prog1(S.token.value, next);\n                }\n                return as_name();\n        };\n\n        function as_name() {\n                switch (S.token.type) {\n                    case \"name\":\n                    case \"operator\":\n                    case \"keyword\":\n                    case \"atom\":\n                        return prog1(S.token.value, next);\n                    default:\n                        unexpected();\n                }\n        };\n\n        function subscripts(expr, allow_calls) {\n                if (is(\"punc\", \".\")) {\n                        next();\n                        return subscripts(as(\"dot\", expr, as_name()), allow_calls);\n                }\n                if (is(\"punc\", \"[\")) {\n                        next();\n                        return subscripts(as(\"sub\", expr, prog1(expression, curry(expect, \"]\"))), allow_calls);\n                }\n                if (allow_calls && is(\"punc\", \"(\")) {\n                        next();\n                        return subscripts(as(\"call\", expr, expr_list(\")\")), true);\n                }\n                return expr;\n        };\n\n        function maybe_unary(allow_calls) {\n                if (is(\"operator\") && HOP(UNARY_PREFIX, S.token.value)) {\n                        return make_unary(\"unary-prefix\",\n                                          prog1(S.token.value, next),\n                                          maybe_unary(allow_calls));\n                }\n                var val = expr_atom(allow_calls);\n                while (is(\"operator\") && HOP(UNARY_POSTFIX, S.token.value) && !S.token.nlb) {\n                        val = make_unary(\"unary-postfix\", S.token.value, val);\n                        next();\n                }\n                return val;\n        };\n\n        function make_unary(tag, op, expr) {\n                if ((op == \"++\" || op == \"--\") && !is_assignable(expr))\n                        croak(\"Invalid use of \" + op + \" operator\");\n                return as(tag, op, expr);\n        };\n\n        function expr_op(left, min_prec, no_in) {\n                var op = is(\"operator\") ? S.token.value : null;\n                if (op && op == \"in\" && no_in) op = null;\n                var prec = op != null ? PRECEDENCE[op] : null;\n                if (prec != null && prec > min_prec) {\n                        next();\n                        var right = expr_op(maybe_unary(true), prec, no_in);\n                        return expr_op(as(\"binary\", op, left, right), min_prec, no_in);\n                }\n                return left;\n        };\n\n        function expr_ops(no_in) {\n                return expr_op(maybe_unary(true), 0, no_in);\n        };\n\n        function maybe_conditional(no_in) {\n                var expr = expr_ops(no_in);\n                if (is(\"operator\", \"?\")) {\n                        next();\n                        var yes = expression(false);\n                        expect(\":\");\n                        return as(\"conditional\", expr, yes, expression(false, no_in));\n                }\n                return expr;\n        };\n\n        function is_assignable(expr) {\n                if (!exigent_mode) return true;\n                switch (expr[0]+\"\") {\n                    case \"dot\":\n                    case \"sub\":\n                    case \"new\":\n                    case \"call\":\n                        return true;\n                    case \"name\":\n                        return expr[1] != \"this\";\n                }\n        };\n\n        function maybe_assign(no_in) {\n                var left = maybe_conditional(no_in), val = S.token.value;\n                if (is(\"operator\") && HOP(ASSIGNMENT, val)) {\n                        if (is_assignable(left)) {\n                                next();\n                                return as(\"assign\", ASSIGNMENT[val], left, maybe_assign(no_in));\n                        }\n                        croak(\"Invalid assignment\");\n                }\n                return left;\n        };\n\n        var expression = maybe_embed_tokens(function(commas, no_in) {\n                if (arguments.length == 0)\n                        commas = true;\n                var expr = maybe_assign(no_in);\n                if (commas && is(\"punc\", \",\")) {\n                        next();\n                        return as(\"seq\", expr, expression(true, no_in));\n                }\n                return expr;\n        });\n\n        function in_loop(cont) {\n                try {\n                        ++S.in_loop;\n                        return cont();\n                } finally {\n                        --S.in_loop;\n                }\n        };\n\n        return as(\"toplevel\", (function(a){\n                while (!is(\"eof\"))\n                        a.push(statement());\n                return a;\n        })([]));\n\n};\n\n/* -----[ Utilities ]----- */\n\nfunction curry(f) {\n        var args = slice(arguments, 1);\n        return function() { return f.apply(this, args.concat(slice(arguments))); };\n};\n\nfunction prog1(ret) {\n        if (ret instanceof Function)\n                ret = ret();\n        for (var i = 1, n = arguments.length; --n > 0; ++i)\n                arguments[i]();\n        return ret;\n};\n\nfunction array_to_hash(a) {\n        var ret = {};\n        for (var i = 0; i < a.length; ++i)\n                ret[a[i]] = true;\n        return ret;\n};\n\nfunction slice(a, start) {\n        return Array.prototype.slice.call(a, start || 0);\n};\n\nfunction characters(str) {\n        return str.split(\"\");\n};\n\nfunction member(name, array) {\n        for (var i = array.length; --i >= 0;)\n                if (array[i] == name)\n                        return true;\n        return false;\n};\n\nfunction HOP(obj, prop) {\n        return Object.prototype.hasOwnProperty.call(obj, prop);\n};\n\nvar warn = function() {};\n\n/* -----[ Exports ]----- */\n\nexports.tokenizer = tokenizer;\nexports.parse = parse;\nexports.slice = slice;\nexports.curry = curry;\nexports.member = member;\nexports.array_to_hash = array_to_hash;\nexports.PRECEDENCE = PRECEDENCE;\nexports.KEYWORDS_ATOM = KEYWORDS_ATOM;\nexports.RESERVED_WORDS = RESERVED_WORDS;\nexports.KEYWORDS = KEYWORDS;\nexports.ATOMIC_START_TOKEN = ATOMIC_START_TOKEN;\nexports.OPERATORS = OPERATORS;\nexports.is_alphanumeric_char = is_alphanumeric_char;\nexports.is_identifier_start = is_identifier_start;\nexports.is_identifier_char = is_identifier_char;\nexports.set_logger = function(logger) {\n        warn = logger;\n};\n\n// Local variables:\n// js-indent-level: 8\n// End:\n\n//@ sourceURL=/node_modules/racer/node_modules/uglify-js/lib/parse-js.js"
));

require.define("/node_modules/racer/node_modules/uglify-js/lib/process.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/***********************************************************************\n\n  A JavaScript tokenizer / parser / beautifier / compressor.\n\n  This version is suitable for Node.js.  With minimal changes (the\n  exports stuff) it should work on any JS platform.\n\n  This file implements some AST processors.  They work on data built\n  by parse-js.\n\n  Exported functions:\n\n    - ast_mangle(ast, options) -- mangles the variable/function names\n      in the AST.  Returns an AST.\n\n    - ast_squeeze(ast) -- employs various optimizations to make the\n      final generated code even smaller.  Returns an AST.\n\n    - gen_code(ast, options) -- generates JS code from the AST.  Pass\n      true (or an object, see the code for some options) as second\n      argument to get \"pretty\" (indented) code.\n\n  -------------------------------- (C) ---------------------------------\n\n                           Author: Mihai Bazon\n                         <mihai.bazon@gmail.com>\n                       http://mihai.bazon.net/blog\n\n  Distributed under the BSD license:\n\n    Copyright 2010 (c) Mihai Bazon <mihai.bazon@gmail.com>\n\n    Redistribution and use in source and binary forms, with or without\n    modification, are permitted provided that the following conditions\n    are met:\n\n        * Redistributions of source code must retain the above\n          copyright notice, this list of conditions and the following\n          disclaimer.\n\n        * Redistributions in binary form must reproduce the above\n          copyright notice, this list of conditions and the following\n          disclaimer in the documentation and/or other materials\n          provided with the distribution.\n\n    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY\n    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE\n    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR\n    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE\n    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,\n    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,\n    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR\n    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\n    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR\n    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF\n    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF\n    SUCH DAMAGE.\n\n ***********************************************************************/\n\nvar jsp = require(\"./parse-js\"),\n    curry = jsp.curry,\n    slice = jsp.slice,\n    member = jsp.member,\n    is_identifier_char = jsp.is_identifier_char,\n    PRECEDENCE = jsp.PRECEDENCE,\n    OPERATORS = jsp.OPERATORS;\n\n/* -----[ helper for AST traversal ]----- */\n\nfunction ast_walker() {\n        function _vardefs(defs) {\n                return [ this[0], MAP(defs, function(def){\n                        var a = [ def[0] ];\n                        if (def.length > 1)\n                                a[1] = walk(def[1]);\n                        return a;\n                }) ];\n        };\n        function _block(statements) {\n                var out = [ this[0] ];\n                if (statements != null)\n                        out.push(MAP(statements, walk));\n                return out;\n        };\n        var walkers = {\n                \"string\": function(str) {\n                        return [ this[0], str ];\n                },\n                \"num\": function(num) {\n                        return [ this[0], num ];\n                },\n                \"name\": function(name) {\n                        return [ this[0], name ];\n                },\n                \"toplevel\": function(statements) {\n                        return [ this[0], MAP(statements, walk) ];\n                },\n                \"block\": _block,\n                \"splice\": _block,\n                \"var\": _vardefs,\n                \"const\": _vardefs,\n                \"try\": function(t, c, f) {\n                        return [\n                                this[0],\n                                MAP(t, walk),\n                                c != null ? [ c[0], MAP(c[1], walk) ] : null,\n                                f != null ? MAP(f, walk) : null\n                        ];\n                },\n                \"throw\": function(expr) {\n                        return [ this[0], walk(expr) ];\n                },\n                \"new\": function(ctor, args) {\n                        return [ this[0], walk(ctor), MAP(args, walk) ];\n                },\n                \"switch\": function(expr, body) {\n                        return [ this[0], walk(expr), MAP(body, function(branch){\n                                return [ branch[0] ? walk(branch[0]) : null,\n                                         MAP(branch[1], walk) ];\n                        }) ];\n                },\n                \"break\": function(label) {\n                        return [ this[0], label ];\n                },\n                \"continue\": function(label) {\n                        return [ this[0], label ];\n                },\n                \"conditional\": function(cond, t, e) {\n                        return [ this[0], walk(cond), walk(t), walk(e) ];\n                },\n                \"assign\": function(op, lvalue, rvalue) {\n                        return [ this[0], op, walk(lvalue), walk(rvalue) ];\n                },\n                \"dot\": function(expr) {\n                        return [ this[0], walk(expr) ].concat(slice(arguments, 1));\n                },\n                \"call\": function(expr, args) {\n                        return [ this[0], walk(expr), MAP(args, walk) ];\n                },\n                \"function\": function(name, args, body) {\n                        return [ this[0], name, args.slice(), MAP(body, walk) ];\n                },\n                \"debugger\": function() {\n                        return [ this[0] ];\n                },\n                \"defun\": function(name, args, body) {\n                        return [ this[0], name, args.slice(), MAP(body, walk) ];\n                },\n                \"if\": function(conditional, t, e) {\n                        return [ this[0], walk(conditional), walk(t), walk(e) ];\n                },\n                \"for\": function(init, cond, step, block) {\n                        return [ this[0], walk(init), walk(cond), walk(step), walk(block) ];\n                },\n                \"for-in\": function(vvar, key, hash, block) {\n                        return [ this[0], walk(vvar), walk(key), walk(hash), walk(block) ];\n                },\n                \"while\": function(cond, block) {\n                        return [ this[0], walk(cond), walk(block) ];\n                },\n                \"do\": function(cond, block) {\n                        return [ this[0], walk(cond), walk(block) ];\n                },\n                \"return\": function(expr) {\n                        return [ this[0], walk(expr) ];\n                },\n                \"binary\": function(op, left, right) {\n                        return [ this[0], op, walk(left), walk(right) ];\n                },\n                \"unary-prefix\": function(op, expr) {\n                        return [ this[0], op, walk(expr) ];\n                },\n                \"unary-postfix\": function(op, expr) {\n                        return [ this[0], op, walk(expr) ];\n                },\n                \"sub\": function(expr, subscript) {\n                        return [ this[0], walk(expr), walk(subscript) ];\n                },\n                \"object\": function(props) {\n                        return [ this[0], MAP(props, function(p){\n                                return p.length == 2\n                                        ? [ p[0], walk(p[1]) ]\n                                        : [ p[0], walk(p[1]), p[2] ]; // get/set-ter\n                        }) ];\n                },\n                \"regexp\": function(rx, mods) {\n                        return [ this[0], rx, mods ];\n                },\n                \"array\": function(elements) {\n                        return [ this[0], MAP(elements, walk) ];\n                },\n                \"stat\": function(stat) {\n                        return [ this[0], walk(stat) ];\n                },\n                \"seq\": function() {\n                        return [ this[0] ].concat(MAP(slice(arguments), walk));\n                },\n                \"label\": function(name, block) {\n                        return [ this[0], name, walk(block) ];\n                },\n                \"with\": function(expr, block) {\n                        return [ this[0], walk(expr), walk(block) ];\n                },\n                \"atom\": function(name) {\n                        return [ this[0], name ];\n                },\n                \"directive\": function(dir) {\n                        return [ this[0], dir ];\n                }\n        };\n\n        var user = {};\n        var stack = [];\n        function walk(ast) {\n                if (ast == null)\n                        return null;\n                try {\n                        stack.push(ast);\n                        var type = ast[0];\n                        var gen = user[type];\n                        if (gen) {\n                                var ret = gen.apply(ast, ast.slice(1));\n                                if (ret != null)\n                                        return ret;\n                        }\n                        gen = walkers[type];\n                        return gen.apply(ast, ast.slice(1));\n                } finally {\n                        stack.pop();\n                }\n        };\n\n        function dive(ast) {\n                if (ast == null)\n                        return null;\n                try {\n                        stack.push(ast);\n                        return walkers[ast[0]].apply(ast, ast.slice(1));\n                } finally {\n                        stack.pop();\n                }\n        };\n\n        function with_walkers(walkers, cont){\n                var save = {}, i;\n                for (i in walkers) if (HOP(walkers, i)) {\n                        save[i] = user[i];\n                        user[i] = walkers[i];\n                }\n                var ret = cont();\n                for (i in save) if (HOP(save, i)) {\n                        if (!save[i]) delete user[i];\n                        else user[i] = save[i];\n                }\n                return ret;\n        };\n\n        return {\n                walk: walk,\n                dive: dive,\n                with_walkers: with_walkers,\n                parent: function() {\n                        return stack[stack.length - 2]; // last one is current node\n                },\n                stack: function() {\n                        return stack;\n                }\n        };\n};\n\n/* -----[ Scope and mangling ]----- */\n\nfunction Scope(parent) {\n        this.names = {};        // names defined in this scope\n        this.mangled = {};      // mangled names (orig.name => mangled)\n        this.rev_mangled = {};  // reverse lookup (mangled => orig.name)\n        this.cname = -1;        // current mangled name\n        this.refs = {};         // names referenced from this scope\n        this.uses_with = false; // will become TRUE if with() is detected in this or any subscopes\n        this.uses_eval = false; // will become TRUE if eval() is detected in this or any subscopes\n        this.directives = [];   // directives activated from this scope\n        this.parent = parent;   // parent scope\n        this.children = [];     // sub-scopes\n        if (parent) {\n                this.level = parent.level + 1;\n                parent.children.push(this);\n        } else {\n                this.level = 0;\n        }\n};\n\nfunction base54_digits() {\n        if (typeof DIGITS_OVERRIDE_FOR_TESTING != \"undefined\")\n                return DIGITS_OVERRIDE_FOR_TESTING;\n        else\n                return \"etnrisouaflchpdvmgybwESxTNCkLAOM_DPHBjFIqRUzWXV$JKQGYZ0516372984\";\n}\n\nvar base54 = (function(){\n        var DIGITS = base54_digits();\n        return function(num) {\n                var ret = \"\", base = 54;\n                do {\n                        ret += DIGITS.charAt(num % base);\n                        num = Math.floor(num / base);\n                        base = 64;\n                } while (num > 0);\n                return ret;\n        };\n})();\n\nScope.prototype = {\n        has: function(name) {\n                for (var s = this; s; s = s.parent)\n                        if (HOP(s.names, name))\n                                return s;\n        },\n        has_mangled: function(mname) {\n                for (var s = this; s; s = s.parent)\n                        if (HOP(s.rev_mangled, mname))\n                                return s;\n        },\n        toJSON: function() {\n                return {\n                        names: this.names,\n                        uses_eval: this.uses_eval,\n                        uses_with: this.uses_with\n                };\n        },\n\n        next_mangled: function() {\n                // we must be careful that the new mangled name:\n                //\n                // 1. doesn't shadow a mangled name from a parent\n                //    scope, unless we don't reference the original\n                //    name from this scope OR from any sub-scopes!\n                //    This will get slow.\n                //\n                // 2. doesn't shadow an original name from a parent\n                //    scope, in the event that the name is not mangled\n                //    in the parent scope and we reference that name\n                //    here OR IN ANY SUBSCOPES!\n                //\n                // 3. doesn't shadow a name that is referenced but not\n                //    defined (possibly global defined elsewhere).\n                for (;;) {\n                        var m = base54(++this.cname), prior;\n\n                        // case 1.\n                        prior = this.has_mangled(m);\n                        if (prior && this.refs[prior.rev_mangled[m]] === prior)\n                                continue;\n\n                        // case 2.\n                        prior = this.has(m);\n                        if (prior && prior !== this && this.refs[m] === prior && !prior.has_mangled(m))\n                                continue;\n\n                        // case 3.\n                        if (HOP(this.refs, m) && this.refs[m] == null)\n                                continue;\n\n                        // I got \"do\" once. :-/\n                        if (!is_identifier(m))\n                                continue;\n\n                        return m;\n                }\n        },\n        set_mangle: function(name, m) {\n                this.rev_mangled[m] = name;\n                return this.mangled[name] = m;\n        },\n        get_mangled: function(name, newMangle) {\n                if (this.uses_eval || this.uses_with) return name; // no mangle if eval or with is in use\n                var s = this.has(name);\n                if (!s) return name; // not in visible scope, no mangle\n                if (HOP(s.mangled, name)) return s.mangled[name]; // already mangled in this scope\n                if (!newMangle) return name;                      // not found and no mangling requested\n                return s.set_mangle(name, s.next_mangled());\n        },\n        references: function(name) {\n                return name && !this.parent || this.uses_with || this.uses_eval || this.refs[name];\n        },\n        define: function(name, type) {\n                if (name != null) {\n                        if (type == \"var\" || !HOP(this.names, name))\n                                this.names[name] = type || \"var\";\n                        return name;\n                }\n        },\n        active_directive: function(dir) {\n                return member(dir, this.directives) || this.parent && this.parent.active_directive(dir);\n        }\n};\n\nfunction ast_add_scope(ast) {\n\n        var current_scope = null;\n        var w = ast_walker(), walk = w.walk;\n        var having_eval = [];\n\n        function with_new_scope(cont) {\n                current_scope = new Scope(current_scope);\n                current_scope.labels = new Scope();\n                var ret = current_scope.body = cont();\n                ret.scope = current_scope;\n                current_scope = current_scope.parent;\n                return ret;\n        };\n\n        function define(name, type) {\n                return current_scope.define(name, type);\n        };\n\n        function reference(name) {\n                current_scope.refs[name] = true;\n        };\n\n        function _lambda(name, args, body) {\n                var is_defun = this[0] == \"defun\";\n                return [ this[0], is_defun ? define(name, \"defun\") : name, args, with_new_scope(function(){\n                        if (!is_defun) define(name, \"lambda\");\n                        MAP(args, function(name){ define(name, \"arg\") });\n                        return MAP(body, walk);\n                })];\n        };\n\n        function _vardefs(type) {\n                return function(defs) {\n                        MAP(defs, function(d){\n                                define(d[0], type);\n                                if (d[1]) reference(d[0]);\n                        });\n                };\n        };\n\n        function _breacont(label) {\n                if (label)\n                        current_scope.labels.refs[label] = true;\n        };\n\n        return with_new_scope(function(){\n                // process AST\n                var ret = w.with_walkers({\n                        \"function\": _lambda,\n                        \"defun\": _lambda,\n                        \"label\": function(name, stat) { current_scope.labels.define(name) },\n                        \"break\": _breacont,\n                        \"continue\": _breacont,\n                        \"with\": function(expr, block) {\n                                for (var s = current_scope; s; s = s.parent)\n                                        s.uses_with = true;\n                        },\n                        \"var\": _vardefs(\"var\"),\n                        \"const\": _vardefs(\"const\"),\n                        \"try\": function(t, c, f) {\n                                if (c != null) return [\n                                        this[0],\n                                        MAP(t, walk),\n                                        [ define(c[0], \"catch\"), MAP(c[1], walk) ],\n                                        f != null ? MAP(f, walk) : null\n                                ];\n                        },\n                        \"name\": function(name) {\n                                if (name == \"eval\")\n                                        having_eval.push(current_scope);\n                                reference(name);\n                        }\n                }, function(){\n                        return walk(ast);\n                });\n\n                // the reason why we need an additional pass here is\n                // that names can be used prior to their definition.\n\n                // scopes where eval was detected and their parents\n                // are marked with uses_eval, unless they define the\n                // \"eval\" name.\n                MAP(having_eval, function(scope){\n                        if (!scope.has(\"eval\")) while (scope) {\n                                scope.uses_eval = true;\n                                scope = scope.parent;\n                        }\n                });\n\n                // for referenced names it might be useful to know\n                // their origin scope.  current_scope here is the\n                // toplevel one.\n                function fixrefs(scope, i) {\n                        // do children first; order shouldn't matter\n                        for (i = scope.children.length; --i >= 0;)\n                                fixrefs(scope.children[i]);\n                        for (i in scope.refs) if (HOP(scope.refs, i)) {\n                                // find origin scope and propagate the reference to origin\n                                for (var origin = scope.has(i), s = scope; s; s = s.parent) {\n                                        s.refs[i] = origin;\n                                        if (s === origin) break;\n                                }\n                        }\n                };\n                fixrefs(current_scope);\n\n                return ret;\n        });\n\n};\n\n/* -----[ mangle names ]----- */\n\nfunction ast_mangle(ast, options) {\n        var w = ast_walker(), walk = w.walk, scope;\n        options = defaults(options, {\n                mangle       : true,\n                toplevel     : false,\n                defines      : null,\n                except       : null,\n                no_functions : false\n        });\n\n        function get_mangled(name, newMangle) {\n                if (!options.mangle) return name;\n                if (!options.toplevel && !scope.parent) return name; // don't mangle toplevel\n                if (options.except && member(name, options.except))\n                        return name;\n                if (options.no_functions && HOP(scope.names, name) &&\n                    (scope.names[name] == 'defun' || scope.names[name] == 'lambda'))\n                        return name;\n                return scope.get_mangled(name, newMangle);\n        };\n\n        function get_define(name) {\n                if (options.defines) {\n                        // we always lookup a defined symbol for the current scope FIRST, so declared\n                        // vars trump a DEFINE symbol, but if no such var is found, then match a DEFINE value\n                        if (!scope.has(name)) {\n                                if (HOP(options.defines, name)) {\n                                        return options.defines[name];\n                                }\n                        }\n                        return null;\n                }\n        };\n\n        function _lambda(name, args, body) {\n                if (!options.no_functions && options.mangle) {\n                        var is_defun = this[0] == \"defun\", extra;\n                        if (name) {\n                                if (is_defun) name = get_mangled(name);\n                                else if (body.scope.references(name)) {\n                                        extra = {};\n                                        if (!(scope.uses_eval || scope.uses_with))\n                                                name = extra[name] = scope.next_mangled();\n                                        else\n                                                extra[name] = name;\n                                }\n                                else name = null;\n                        }\n                }\n                body = with_scope(body.scope, function(){\n                        args = MAP(args, function(name){ return get_mangled(name) });\n                        return MAP(body, walk);\n                }, extra);\n                return [ this[0], name, args, body ];\n        };\n\n        function with_scope(s, cont, extra) {\n                var _scope = scope;\n                scope = s;\n                if (extra) for (var i in extra) if (HOP(extra, i)) {\n                        s.set_mangle(i, extra[i]);\n                }\n                for (var i in s.names) if (HOP(s.names, i)) {\n                        get_mangled(i, true);\n                }\n                var ret = cont();\n                ret.scope = s;\n                scope = _scope;\n                return ret;\n        };\n\n        function _vardefs(defs) {\n                return [ this[0], MAP(defs, function(d){\n                        return [ get_mangled(d[0]), walk(d[1]) ];\n                }) ];\n        };\n\n        function _breacont(label) {\n                if (label) return [ this[0], scope.labels.get_mangled(label) ];\n        };\n\n        return w.with_walkers({\n                \"function\": _lambda,\n                \"defun\": function() {\n                        // move function declarations to the top when\n                        // they are not in some block.\n                        var ast = _lambda.apply(this, arguments);\n                        switch (w.parent()[0]) {\n                            case \"toplevel\":\n                            case \"function\":\n                            case \"defun\":\n                                return MAP.at_top(ast);\n                        }\n                        return ast;\n                },\n                \"label\": function(label, stat) {\n                        if (scope.labels.refs[label]) return [\n                                this[0],\n                                scope.labels.get_mangled(label, true),\n                                walk(stat)\n                        ];\n                        return walk(stat);\n                },\n                \"break\": _breacont,\n                \"continue\": _breacont,\n                \"var\": _vardefs,\n                \"const\": _vardefs,\n                \"name\": function(name) {\n                        return get_define(name) || [ this[0], get_mangled(name) ];\n                },\n                \"try\": function(t, c, f) {\n                        return [ this[0],\n                                 MAP(t, walk),\n                                 c != null ? [ get_mangled(c[0]), MAP(c[1], walk) ] : null,\n                                 f != null ? MAP(f, walk) : null ];\n                },\n                \"toplevel\": function(body) {\n                        var self = this;\n                        return with_scope(self.scope, function(){\n                                return [ self[0], MAP(body, walk) ];\n                        });\n                },\n                \"directive\": function() {\n                        return MAP.at_top(this);\n                }\n        }, function() {\n                return walk(ast_add_scope(ast));\n        });\n};\n\n/* -----[\n   - compress foo[\"bar\"] into foo.bar,\n   - remove block brackets {} where possible\n   - join consecutive var declarations\n   - various optimizations for IFs:\n     - if (cond) foo(); else bar();  ==>  cond?foo():bar();\n     - if (cond) foo();  ==>  cond&&foo();\n     - if (foo) return bar(); else return baz();  ==> return foo?bar():baz(); // also for throw\n     - if (foo) return bar(); else something();  ==> {if(foo)return bar();something()}\n   ]----- */\n\nvar warn = function(){};\n\nfunction best_of(ast1, ast2) {\n        return gen_code(ast1).length > gen_code(ast2[0] == \"stat\" ? ast2[1] : ast2).length ? ast2 : ast1;\n};\n\nfunction last_stat(b) {\n        if (b[0] == \"block\" && b[1] && b[1].length > 0)\n                return b[1][b[1].length - 1];\n        return b;\n}\n\nfunction aborts(t) {\n        if (t) switch (last_stat(t)[0]) {\n            case \"return\":\n            case \"break\":\n            case \"continue\":\n            case \"throw\":\n                return true;\n        }\n};\n\nfunction boolean_expr(expr) {\n        return ( (expr[0] == \"unary-prefix\"\n                  && member(expr[1], [ \"!\", \"delete\" ])) ||\n\n                 (expr[0] == \"binary\"\n                  && member(expr[1], [ \"in\", \"instanceof\", \"==\", \"!=\", \"===\", \"!==\", \"<\", \"<=\", \">=\", \">\" ])) ||\n\n                 (expr[0] == \"binary\"\n                  && member(expr[1], [ \"&&\", \"||\" ])\n                  && boolean_expr(expr[2])\n                  && boolean_expr(expr[3])) ||\n\n                 (expr[0] == \"conditional\"\n                  && boolean_expr(expr[2])\n                  && boolean_expr(expr[3])) ||\n\n                 (expr[0] == \"assign\"\n                  && expr[1] === true\n                  && boolean_expr(expr[3])) ||\n\n                 (expr[0] == \"seq\"\n                  && boolean_expr(expr[expr.length - 1]))\n               );\n};\n\nfunction empty(b) {\n        return !b || (b[0] == \"block\" && (!b[1] || b[1].length == 0));\n};\n\nfunction is_string(node) {\n        return (node[0] == \"string\" ||\n                node[0] == \"unary-prefix\" && node[1] == \"typeof\" ||\n                node[0] == \"binary\" && node[1] == \"+\" &&\n                (is_string(node[2]) || is_string(node[3])));\n};\n\nvar when_constant = (function(){\n\n        var $NOT_CONSTANT = {};\n\n        // this can only evaluate constant expressions.  If it finds anything\n        // not constant, it throws $NOT_CONSTANT.\n        function evaluate(expr) {\n                switch (expr[0]) {\n                    case \"string\":\n                    case \"num\":\n                        return expr[1];\n                    case \"name\":\n                    case \"atom\":\n                        switch (expr[1]) {\n                            case \"true\": return true;\n                            case \"false\": return false;\n                            case \"null\": return null;\n                        }\n                        break;\n                    case \"unary-prefix\":\n                        switch (expr[1]) {\n                            case \"!\": return !evaluate(expr[2]);\n                            case \"typeof\": return typeof evaluate(expr[2]);\n                            case \"~\": return ~evaluate(expr[2]);\n                            case \"-\": return -evaluate(expr[2]);\n                            case \"+\": return +evaluate(expr[2]);\n                        }\n                        break;\n                    case \"binary\":\n                        var left = expr[2], right = expr[3];\n                        switch (expr[1]) {\n                            case \"&&\"         : return evaluate(left) &&         evaluate(right);\n                            case \"||\"         : return evaluate(left) ||         evaluate(right);\n                            case \"|\"          : return evaluate(left) |          evaluate(right);\n                            case \"&\"          : return evaluate(left) &          evaluate(right);\n                            case \"^\"          : return evaluate(left) ^          evaluate(right);\n                            case \"+\"          : return evaluate(left) +          evaluate(right);\n                            case \"*\"          : return evaluate(left) *          evaluate(right);\n                            case \"/\"          : return evaluate(left) /          evaluate(right);\n                            case \"%\"          : return evaluate(left) %          evaluate(right);\n                            case \"-\"          : return evaluate(left) -          evaluate(right);\n                            case \"<<\"         : return evaluate(left) <<         evaluate(right);\n                            case \">>\"         : return evaluate(left) >>         evaluate(right);\n                            case \">>>\"        : return evaluate(left) >>>        evaluate(right);\n                            case \"==\"         : return evaluate(left) ==         evaluate(right);\n                            case \"===\"        : return evaluate(left) ===        evaluate(right);\n                            case \"!=\"         : return evaluate(left) !=         evaluate(right);\n                            case \"!==\"        : return evaluate(left) !==        evaluate(right);\n                            case \"<\"          : return evaluate(left) <          evaluate(right);\n                            case \"<=\"         : return evaluate(left) <=         evaluate(right);\n                            case \">\"          : return evaluate(left) >          evaluate(right);\n                            case \">=\"         : return evaluate(left) >=         evaluate(right);\n                            case \"in\"         : return evaluate(left) in         evaluate(right);\n                            case \"instanceof\" : return evaluate(left) instanceof evaluate(right);\n                        }\n                }\n                throw $NOT_CONSTANT;\n        };\n\n        return function(expr, yes, no) {\n                try {\n                        var val = evaluate(expr), ast;\n                        switch (typeof val) {\n                            case \"string\": ast =  [ \"string\", val ]; break;\n                            case \"number\": ast =  [ \"num\", val ]; break;\n                            case \"boolean\": ast =  [ \"name\", String(val) ]; break;\n                            default:\n                                if (val === null) { ast = [ \"atom\", \"null\" ]; break; }\n                                throw new Error(\"Can't handle constant of type: \" + (typeof val));\n                        }\n                        return yes.call(expr, ast, val);\n                } catch(ex) {\n                        if (ex === $NOT_CONSTANT) {\n                                if (expr[0] == \"binary\"\n                                    && (expr[1] == \"===\" || expr[1] == \"!==\")\n                                    && ((is_string(expr[2]) && is_string(expr[3]))\n                                        || (boolean_expr(expr[2]) && boolean_expr(expr[3])))) {\n                                        expr[1] = expr[1].substr(0, 2);\n                                }\n                                else if (no && expr[0] == \"binary\"\n                                         && (expr[1] == \"||\" || expr[1] == \"&&\")) {\n                                    // the whole expression is not constant but the lval may be...\n                                    try {\n                                        var lval = evaluate(expr[2]);\n                                        expr = ((expr[1] == \"&&\" && (lval ? expr[3] : lval))    ||\n                                                (expr[1] == \"||\" && (lval ? lval    : expr[3])) ||\n                                                expr);\n                                    } catch(ex2) {\n                                        // IGNORE... lval is not constant\n                                    }\n                                }\n                                return no ? no.call(expr, expr) : null;\n                        }\n                        else throw ex;\n                }\n        };\n\n})();\n\nfunction warn_unreachable(ast) {\n        if (!empty(ast))\n                warn(\"Dropping unreachable code: \" + gen_code(ast, true));\n};\n\nfunction prepare_ifs(ast) {\n        var w = ast_walker(), walk = w.walk;\n        // In this first pass, we rewrite ifs which abort with no else with an\n        // if-else.  For example:\n        //\n        // if (x) {\n        //     blah();\n        //     return y;\n        // }\n        // foobar();\n        //\n        // is rewritten into:\n        //\n        // if (x) {\n        //     blah();\n        //     return y;\n        // } else {\n        //     foobar();\n        // }\n        function redo_if(statements) {\n                statements = MAP(statements, walk);\n\n                for (var i = 0; i < statements.length; ++i) {\n                        var fi = statements[i];\n                        if (fi[0] != \"if\") continue;\n\n                        if (fi[3]) continue;\n\n                        var t = fi[2];\n                        if (!aborts(t)) continue;\n\n                        var conditional = walk(fi[1]);\n\n                        var e_body = redo_if(statements.slice(i + 1));\n                        var e = e_body.length == 1 ? e_body[0] : [ \"block\", e_body ];\n\n                        return statements.slice(0, i).concat([ [\n                                fi[0],          // \"if\"\n                                conditional,    // conditional\n                                t,              // then\n                                e               // else\n                        ] ]);\n                }\n\n                return statements;\n        };\n\n        function redo_if_lambda(name, args, body) {\n                body = redo_if(body);\n                return [ this[0], name, args, body ];\n        };\n\n        function redo_if_block(statements) {\n                return [ this[0], statements != null ? redo_if(statements) : null ];\n        };\n\n        return w.with_walkers({\n                \"defun\": redo_if_lambda,\n                \"function\": redo_if_lambda,\n                \"block\": redo_if_block,\n                \"splice\": redo_if_block,\n                \"toplevel\": function(statements) {\n                        return [ this[0], redo_if(statements) ];\n                },\n                \"try\": function(t, c, f) {\n                        return [\n                                this[0],\n                                redo_if(t),\n                                c != null ? [ c[0], redo_if(c[1]) ] : null,\n                                f != null ? redo_if(f) : null\n                        ];\n                }\n        }, function() {\n                return walk(ast);\n        });\n};\n\nfunction for_side_effects(ast, handler) {\n        var w = ast_walker(), walk = w.walk;\n        var $stop = {}, $restart = {};\n        function stop() { throw $stop };\n        function restart() { throw $restart };\n        function found(){ return handler.call(this, this, w, stop, restart) };\n        function unary(op) {\n                if (op == \"++\" || op == \"--\")\n                        return found.apply(this, arguments);\n        };\n        function binary(op) {\n                if (op == \"&&\" || op == \"||\")\n                        return found.apply(this, arguments);\n        };\n        return w.with_walkers({\n                \"try\": found,\n                \"throw\": found,\n                \"return\": found,\n                \"new\": found,\n                \"switch\": found,\n                \"break\": found,\n                \"continue\": found,\n                \"assign\": found,\n                \"call\": found,\n                \"if\": found,\n                \"for\": found,\n                \"for-in\": found,\n                \"while\": found,\n                \"do\": found,\n                \"return\": found,\n                \"unary-prefix\": unary,\n                \"unary-postfix\": unary,\n                \"conditional\": found,\n                \"binary\": binary,\n                \"defun\": found\n        }, function(){\n                while (true) try {\n                        walk(ast);\n                        break;\n                } catch(ex) {\n                        if (ex === $stop) break;\n                        if (ex === $restart) continue;\n                        throw ex;\n                }\n        });\n};\n\nfunction ast_lift_variables(ast) {\n        var w = ast_walker(), walk = w.walk, scope;\n        function do_body(body, env) {\n                var _scope = scope;\n                scope = env;\n                body = MAP(body, walk);\n                var hash = {}, names = MAP(env.names, function(type, name){\n                        if (type != \"var\") return MAP.skip;\n                        if (!env.references(name)) return MAP.skip;\n                        hash[name] = true;\n                        return [ name ];\n                });\n                if (names.length > 0) {\n                        // looking for assignments to any of these variables.\n                        // we can save considerable space by moving the definitions\n                        // in the var declaration.\n                        for_side_effects([ \"block\", body ], function(ast, walker, stop, restart) {\n                                if (ast[0] == \"assign\"\n                                    && ast[1] === true\n                                    && ast[2][0] == \"name\"\n                                    && HOP(hash, ast[2][1])) {\n                                        // insert the definition into the var declaration\n                                        for (var i = names.length; --i >= 0;) {\n                                                if (names[i][0] == ast[2][1]) {\n                                                        if (names[i][1]) // this name already defined, we must stop\n                                                                stop();\n                                                        names[i][1] = ast[3]; // definition\n                                                        names.push(names.splice(i, 1)[0]);\n                                                        break;\n                                                }\n                                        }\n                                        // remove this assignment from the AST.\n                                        var p = walker.parent();\n                                        if (p[0] == \"seq\") {\n                                                var a = p[2];\n                                                a.unshift(0, p.length);\n                                                p.splice.apply(p, a);\n                                        }\n                                        else if (p[0] == \"stat\") {\n                                                p.splice(0, p.length, \"block\"); // empty statement\n                                        }\n                                        else {\n                                                stop();\n                                        }\n                                        restart();\n                                }\n                                stop();\n                        });\n                        body.unshift([ \"var\", names ]);\n                }\n                scope = _scope;\n                return body;\n        };\n        function _vardefs(defs) {\n                var ret = null;\n                for (var i = defs.length; --i >= 0;) {\n                        var d = defs[i];\n                        if (!d[1]) continue;\n                        d = [ \"assign\", true, [ \"name\", d[0] ], d[1] ];\n                        if (ret == null) ret = d;\n                        else ret = [ \"seq\", d, ret ];\n                }\n                if (ret == null && w.parent()[0] != \"for\") {\n                        if (w.parent()[0] == \"for-in\")\n                                return [ \"name\", defs[0][0] ];\n                        return MAP.skip;\n                }\n                return [ \"stat\", ret ];\n        };\n        function _toplevel(body) {\n                return [ this[0], do_body(body, this.scope) ];\n        };\n        return w.with_walkers({\n                \"function\": function(name, args, body){\n                        for (var i = args.length; --i >= 0 && !body.scope.references(args[i]);)\n                                args.pop();\n                        if (!body.scope.references(name)) name = null;\n                        return [ this[0], name, args, do_body(body, body.scope) ];\n                },\n                \"defun\": function(name, args, body){\n                        if (!scope.references(name)) return MAP.skip;\n                        for (var i = args.length; --i >= 0 && !body.scope.references(args[i]);)\n                                args.pop();\n                        return [ this[0], name, args, do_body(body, body.scope) ];\n                },\n                \"var\": _vardefs,\n                \"toplevel\": _toplevel\n        }, function(){\n                return walk(ast_add_scope(ast));\n        });\n};\n\nfunction ast_squeeze(ast, options) {\n        ast = squeeze_1(ast, options);\n        ast = squeeze_2(ast, options);\n        return ast;\n};\n\nfunction squeeze_1(ast, options) {\n        options = defaults(options, {\n                make_seqs   : true,\n                dead_code   : true,\n                no_warnings : false,\n                keep_comps  : true,\n                unsafe      : false\n        });\n\n        var w = ast_walker(), walk = w.walk, scope;\n\n        function negate(c) {\n                var not_c = [ \"unary-prefix\", \"!\", c ];\n                switch (c[0]) {\n                    case \"unary-prefix\":\n                        return c[1] == \"!\" && boolean_expr(c[2]) ? c[2] : not_c;\n                    case \"seq\":\n                        c = slice(c);\n                        c[c.length - 1] = negate(c[c.length - 1]);\n                        return c;\n                    case \"conditional\":\n                        return best_of(not_c, [ \"conditional\", c[1], negate(c[2]), negate(c[3]) ]);\n                    case \"binary\":\n                        var op = c[1], left = c[2], right = c[3];\n                        if (!options.keep_comps) switch (op) {\n                            case \"<=\"  : return [ \"binary\", \">\", left, right ];\n                            case \"<\"   : return [ \"binary\", \">=\", left, right ];\n                            case \">=\"  : return [ \"binary\", \"<\", left, right ];\n                            case \">\"   : return [ \"binary\", \"<=\", left, right ];\n                        }\n                        switch (op) {\n                            case \"==\"  : return [ \"binary\", \"!=\", left, right ];\n                            case \"!=\"  : return [ \"binary\", \"==\", left, right ];\n                            case \"===\" : return [ \"binary\", \"!==\", left, right ];\n                            case \"!==\" : return [ \"binary\", \"===\", left, right ];\n                            case \"&&\"  : return best_of(not_c, [ \"binary\", \"||\", negate(left), negate(right) ]);\n                            case \"||\"  : return best_of(not_c, [ \"binary\", \"&&\", negate(left), negate(right) ]);\n                        }\n                        break;\n                }\n                return not_c;\n        };\n\n        function make_conditional(c, t, e) {\n                var make_real_conditional = function() {\n                        if (c[0] == \"unary-prefix\" && c[1] == \"!\") {\n                                return e ? [ \"conditional\", c[2], e, t ] : [ \"binary\", \"||\", c[2], t ];\n                        } else {\n                                return e ? best_of(\n                                        [ \"conditional\", c, t, e ],\n                                        [ \"conditional\", negate(c), e, t ]\n                                ) : [ \"binary\", \"&&\", c, t ];\n                        }\n                };\n                // shortcut the conditional if the expression has a constant value\n                return when_constant(c, function(ast, val){\n                        warn_unreachable(val ? e : t);\n                        return          (val ? t : e);\n                }, make_real_conditional);\n        };\n\n        function rmblock(block) {\n                if (block != null && block[0] == \"block\" && block[1]) {\n                        if (block[1].length == 1)\n                                block = block[1][0];\n                        else if (block[1].length == 0)\n                                block = [ \"block\" ];\n                }\n                return block;\n        };\n\n        function _lambda(name, args, body) {\n                return [ this[0], name, args, tighten(body, \"lambda\") ];\n        };\n\n        // this function does a few things:\n        // 1. discard useless blocks\n        // 2. join consecutive var declarations\n        // 3. remove obviously dead code\n        // 4. transform consecutive statements using the comma operator\n        // 5. if block_type == \"lambda\" and it detects constructs like if(foo) return ... - rewrite like if (!foo) { ... }\n        function tighten(statements, block_type) {\n                statements = MAP(statements, walk);\n\n                statements = statements.reduce(function(a, stat){\n                        if (stat[0] == \"block\") {\n                                if (stat[1]) {\n                                        a.push.apply(a, stat[1]);\n                                }\n                        } else {\n                                a.push(stat);\n                        }\n                        return a;\n                }, []);\n\n                statements = (function(a, prev){\n                        statements.forEach(function(cur){\n                                if (prev && ((cur[0] == \"var\" && prev[0] == \"var\") ||\n                                             (cur[0] == \"const\" && prev[0] == \"const\"))) {\n                                        prev[1] = prev[1].concat(cur[1]);\n                                } else {\n                                        a.push(cur);\n                                        prev = cur;\n                                }\n                        });\n                        return a;\n                })([]);\n\n                if (options.dead_code) statements = (function(a, has_quit){\n                        statements.forEach(function(st){\n                                if (has_quit) {\n                                        if (st[0] == \"function\" || st[0] == \"defun\") {\n                                                a.push(st);\n                                        }\n                                        else if (st[0] == \"var\" || st[0] == \"const\") {\n                                                if (!options.no_warnings)\n                                                        warn(\"Variables declared in unreachable code\");\n                                                st[1] = MAP(st[1], function(def){\n                                                        if (def[1] && !options.no_warnings)\n                                                                warn_unreachable([ \"assign\", true, [ \"name\", def[0] ], def[1] ]);\n                                                        return [ def[0] ];\n                                                });\n                                                a.push(st);\n                                        }\n                                        else if (!options.no_warnings)\n                                                warn_unreachable(st);\n                                }\n                                else {\n                                        a.push(st);\n                                        if (member(st[0], [ \"return\", \"throw\", \"break\", \"continue\" ]))\n                                                has_quit = true;\n                                }\n                        });\n                        return a;\n                })([]);\n\n                if (options.make_seqs) statements = (function(a, prev) {\n                        statements.forEach(function(cur){\n                                if (prev && prev[0] == \"stat\" && cur[0] == \"stat\") {\n                                        prev[1] = [ \"seq\", prev[1], cur[1] ];\n                                } else {\n                                        a.push(cur);\n                                        prev = cur;\n                                }\n                        });\n                        if (a.length >= 2\n                            && a[a.length-2][0] == \"stat\"\n                            && (a[a.length-1][0] == \"return\" || a[a.length-1][0] == \"throw\")\n                            && a[a.length-1][1])\n                        {\n                                a.splice(a.length - 2, 2,\n                                         [ a[a.length-1][0],\n                                           [ \"seq\", a[a.length-2][1], a[a.length-1][1] ]]);\n                        }\n                        return a;\n                })([]);\n\n                // this increases jQuery by 1K.  Probably not such a good idea after all..\n                // part of this is done in prepare_ifs anyway.\n                // if (block_type == \"lambda\") statements = (function(i, a, stat){\n                //         while (i < statements.length) {\n                //                 stat = statements[i++];\n                //                 if (stat[0] == \"if\" && !stat[3]) {\n                //                         if (stat[2][0] == \"return\" && stat[2][1] == null) {\n                //                                 a.push(make_if(negate(stat[1]), [ \"block\", statements.slice(i) ]));\n                //                                 break;\n                //                         }\n                //                         var last = last_stat(stat[2]);\n                //                         if (last[0] == \"return\" && last[1] == null) {\n                //                                 a.push(make_if(stat[1], [ \"block\", stat[2][1].slice(0, -1) ], [ \"block\", statements.slice(i) ]));\n                //                                 break;\n                //                         }\n                //                 }\n                //                 a.push(stat);\n                //         }\n                //         return a;\n                // })(0, []);\n\n                return statements;\n        };\n\n        function make_if(c, t, e) {\n                return when_constant(c, function(ast, val){\n                        if (val) {\n                                t = walk(t);\n                                warn_unreachable(e);\n                                return t || [ \"block\" ];\n                        } else {\n                                e = walk(e);\n                                warn_unreachable(t);\n                                return e || [ \"block\" ];\n                        }\n                }, function() {\n                        return make_real_if(c, t, e);\n                });\n        };\n\n        function abort_else(c, t, e) {\n                var ret = [ [ \"if\", negate(c), e ] ];\n                if (t[0] == \"block\") {\n                        if (t[1]) ret = ret.concat(t[1]);\n                } else {\n                        ret.push(t);\n                }\n                return walk([ \"block\", ret ]);\n        };\n\n        function make_real_if(c, t, e) {\n                c = walk(c);\n                t = walk(t);\n                e = walk(e);\n\n                if (empty(e) && empty(t))\n                        return [ \"stat\", c ];\n\n                if (empty(t)) {\n                        c = negate(c);\n                        t = e;\n                        e = null;\n                } else if (empty(e)) {\n                        e = null;\n                } else {\n                        // if we have both else and then, maybe it makes sense to switch them?\n                        (function(){\n                                var a = gen_code(c);\n                                var n = negate(c);\n                                var b = gen_code(n);\n                                if (b.length < a.length) {\n                                        var tmp = t;\n                                        t = e;\n                                        e = tmp;\n                                        c = n;\n                                }\n                        })();\n                }\n                var ret = [ \"if\", c, t, e ];\n                if (t[0] == \"if\" && empty(t[3]) && empty(e)) {\n                        ret = best_of(ret, walk([ \"if\", [ \"binary\", \"&&\", c, t[1] ], t[2] ]));\n                }\n                else if (t[0] == \"stat\") {\n                        if (e) {\n                                if (e[0] == \"stat\")\n                                        ret = best_of(ret, [ \"stat\", make_conditional(c, t[1], e[1]) ]);\n                                else if (aborts(e))\n                                        ret = abort_else(c, t, e);\n                        }\n                        else {\n                                ret = best_of(ret, [ \"stat\", make_conditional(c, t[1]) ]);\n                        }\n                }\n                else if (e && t[0] == e[0] && (t[0] == \"return\" || t[0] == \"throw\") && t[1] && e[1]) {\n                        ret = best_of(ret, [ t[0], make_conditional(c, t[1], e[1] ) ]);\n                }\n                else if (e && aborts(t)) {\n                        ret = [ [ \"if\", c, t ] ];\n                        if (e[0] == \"block\") {\n                                if (e[1]) ret = ret.concat(e[1]);\n                        }\n                        else {\n                                ret.push(e);\n                        }\n                        ret = walk([ \"block\", ret ]);\n                }\n                else if (t && aborts(e)) {\n                        ret = abort_else(c, t, e);\n                }\n                return ret;\n        };\n\n        function _do_while(cond, body) {\n                return when_constant(cond, function(cond, val){\n                        if (!val) {\n                                warn_unreachable(body);\n                                return [ \"block\" ];\n                        } else {\n                                return [ \"for\", null, null, null, walk(body) ];\n                        }\n                });\n        };\n\n        return w.with_walkers({\n                \"sub\": function(expr, subscript) {\n                        if (subscript[0] == \"string\") {\n                                var name = subscript[1];\n                                if (is_identifier(name))\n                                        return [ \"dot\", walk(expr), name ];\n                                else if (/^[1-9][0-9]*$/.test(name) || name === \"0\")\n                                        return [ \"sub\", walk(expr), [ \"num\", parseInt(name, 10) ] ];\n                        }\n                },\n                \"if\": make_if,\n                \"toplevel\": function(body) {\n                        return [ \"toplevel\", tighten(body) ];\n                },\n                \"switch\": function(expr, body) {\n                        var last = body.length - 1;\n                        return [ \"switch\", walk(expr), MAP(body, function(branch, i){\n                                var block = tighten(branch[1]);\n                                if (i == last && block.length > 0) {\n                                        var node = block[block.length - 1];\n                                        if (node[0] == \"break\" && !node[1])\n                                                block.pop();\n                                }\n                                return [ branch[0] ? walk(branch[0]) : null, block ];\n                        }) ];\n                },\n                \"function\": _lambda,\n                \"defun\": _lambda,\n                \"block\": function(body) {\n                        if (body) return rmblock([ \"block\", tighten(body) ]);\n                },\n                \"binary\": function(op, left, right) {\n                        return when_constant([ \"binary\", op, walk(left), walk(right) ], function yes(c){\n                                return best_of(walk(c), this);\n                        }, function no() {\n                                return function(){\n                                        if(op != \"==\" && op != \"!=\") return;\n                                        var l = walk(left), r = walk(right);\n                                        if(l && l[0] == \"unary-prefix\" && l[1] == \"!\" && l[2][0] == \"num\")\n                                                left = ['num', +!l[2][1]];\n                                        else if (r && r[0] == \"unary-prefix\" && r[1] == \"!\" && r[2][0] == \"num\")\n                                                right = ['num', +!r[2][1]];\n                                        return [\"binary\", op, left, right];\n                                }() || this;\n                        });\n                },\n                \"conditional\": function(c, t, e) {\n                        return make_conditional(walk(c), walk(t), walk(e));\n                },\n                \"try\": function(t, c, f) {\n                        return [\n                                \"try\",\n                                tighten(t),\n                                c != null ? [ c[0], tighten(c[1]) ] : null,\n                                f != null ? tighten(f) : null\n                        ];\n                },\n                \"unary-prefix\": function(op, expr) {\n                        expr = walk(expr);\n                        var ret = [ \"unary-prefix\", op, expr ];\n                        if (op == \"!\")\n                                ret = best_of(ret, negate(expr));\n                        return when_constant(ret, function(ast, val){\n                                return walk(ast); // it's either true or false, so minifies to !0 or !1\n                        }, function() { return ret });\n                },\n                \"name\": function(name) {\n                        switch (name) {\n                            case \"true\": return [ \"unary-prefix\", \"!\", [ \"num\", 0 ]];\n                            case \"false\": return [ \"unary-prefix\", \"!\", [ \"num\", 1 ]];\n                        }\n                },\n                \"while\": _do_while,\n                \"assign\": function(op, lvalue, rvalue) {\n                        lvalue = walk(lvalue);\n                        rvalue = walk(rvalue);\n                        var okOps = [ '+', '-', '/', '*', '%', '>>', '<<', '>>>', '|', '^', '&' ];\n                        if (op === true && lvalue[0] === \"name\" && rvalue[0] === \"binary\" &&\n                            ~okOps.indexOf(rvalue[1]) && rvalue[2][0] === \"name\" &&\n                            rvalue[2][1] === lvalue[1]) {\n                                return [ this[0], rvalue[1], lvalue, rvalue[3] ]\n                        }\n                        return [ this[0], op, lvalue, rvalue ];\n                },\n                \"call\": function(expr, args) {\n                        expr = walk(expr);\n                        if (options.unsafe && expr[0] == \"dot\" && expr[1][0] == \"string\" && expr[2] == \"toString\") {\n                                return expr[1];\n                        }\n                        return [ this[0], expr,  MAP(args, walk) ];\n                },\n                \"num\": function (num) {\n                        if (!isFinite(num))\n                                return [ \"binary\", \"/\", num === 1 / 0\n                                         ? [ \"num\", 1 ] : num === -1 / 0\n                                         ? [ \"unary-prefix\", \"-\", [ \"num\", 1 ] ]\n                                         : [ \"num\", 0 ], [ \"num\", 0 ] ];\n\n                        return [ this[0], num ];\n                }\n        }, function() {\n                return walk(prepare_ifs(walk(prepare_ifs(ast))));\n        });\n};\n\nfunction squeeze_2(ast, options) {\n        var w = ast_walker(), walk = w.walk, scope;\n        function with_scope(s, cont) {\n                var save = scope, ret;\n                scope = s;\n                ret = cont();\n                scope = save;\n                return ret;\n        };\n        function lambda(name, args, body) {\n                return [ this[0], name, args, with_scope(body.scope, curry(MAP, body, walk)) ];\n        };\n        return w.with_walkers({\n                \"directive\": function(dir) {\n                        if (scope.active_directive(dir))\n                                return [ \"block\" ];\n                        scope.directives.push(dir);\n                },\n                \"toplevel\": function(body) {\n                        return [ this[0], with_scope(this.scope, curry(MAP, body, walk)) ];\n                },\n                \"function\": lambda,\n                \"defun\": lambda\n        }, function(){\n                return walk(ast_add_scope(ast));\n        });\n};\n\n/* -----[ re-generate code from the AST ]----- */\n\nvar DOT_CALL_NO_PARENS = jsp.array_to_hash([\n        \"name\",\n        \"array\",\n        \"object\",\n        \"string\",\n        \"dot\",\n        \"sub\",\n        \"call\",\n        \"regexp\",\n        \"defun\"\n]);\n\nfunction make_string(str, ascii_only) {\n        var dq = 0, sq = 0;\n        str = str.replace(/[\\\\\\b\\f\\n\\r\\t\\x22\\x27\\u2028\\u2029\\0]/g, function(s){\n                switch (s) {\n                    case \"\\\\\": return \"\\\\\\\\\";\n                    case \"\\b\": return \"\\\\b\";\n                    case \"\\f\": return \"\\\\f\";\n                    case \"\\n\": return \"\\\\n\";\n                    case \"\\r\": return \"\\\\r\";\n                    case \"\\u2028\": return \"\\\\u2028\";\n                    case \"\\u2029\": return \"\\\\u2029\";\n                    case '\"': ++dq; return '\"';\n                    case \"'\": ++sq; return \"'\";\n                    case \"\\0\": return \"\\\\0\";\n                }\n                return s;\n        });\n        if (ascii_only) str = to_ascii(str);\n        if (dq > sq) return \"'\" + str.replace(/\\x27/g, \"\\\\'\") + \"'\";\n        else return '\"' + str.replace(/\\x22/g, '\\\\\"') + '\"';\n};\n\nfunction to_ascii(str) {\n        return str.replace(/[\\u0080-\\uffff]/g, function(ch) {\n                var code = ch.charCodeAt(0).toString(16);\n                while (code.length < 4) code = \"0\" + code;\n                return \"\\\\u\" + code;\n        });\n};\n\nvar SPLICE_NEEDS_BRACKETS = jsp.array_to_hash([ \"if\", \"while\", \"do\", \"for\", \"for-in\", \"with\" ]);\n\nfunction gen_code(ast, options) {\n        options = defaults(options, {\n                indent_start : 0,\n                indent_level : 4,\n                quote_keys   : false,\n                space_colon  : false,\n                beautify     : false,\n                ascii_only   : false,\n                inline_script: false\n        });\n        var beautify = !!options.beautify;\n        var indentation = 0,\n            newline = beautify ? \"\\n\" : \"\",\n            space = beautify ? \" \" : \"\";\n\n        function encode_string(str) {\n                var ret = make_string(str, options.ascii_only);\n                if (options.inline_script)\n                        ret = ret.replace(/<\\x2fscript([>\\/\\t\\n\\f\\r ])/gi, \"<\\\\/script$1\");\n                return ret;\n        };\n\n        function make_name(name) {\n                name = name.toString();\n                if (options.ascii_only)\n                        name = to_ascii(name);\n                return name;\n        };\n\n        function indent(line) {\n                if (line == null)\n                        line = \"\";\n                if (beautify)\n                        line = repeat_string(\" \", options.indent_start + indentation * options.indent_level) + line;\n                return line;\n        };\n\n        function with_indent(cont, incr) {\n                if (incr == null) incr = 1;\n                indentation += incr;\n                try { return cont.apply(null, slice(arguments, 1)); }\n                finally { indentation -= incr; }\n        };\n\n        function last_char(str) {\n                str = str.toString();\n                return str.charAt(str.length - 1);\n        };\n\n        function first_char(str) {\n                return str.toString().charAt(0);\n        };\n\n        function add_spaces(a) {\n                if (beautify)\n                        return a.join(\" \");\n                var b = [];\n                for (var i = 0; i < a.length; ++i) {\n                        var next = a[i + 1];\n                        b.push(a[i]);\n                        if (next &&\n                            ((is_identifier_char(last_char(a[i])) && (is_identifier_char(first_char(next))\n                                                                      || first_char(next) == \"\\\\\")) ||\n                             (/[\\+\\-]$/.test(a[i].toString()) && /^[\\+\\-]/.test(next.toString())))) {\n                                b.push(\" \");\n                        }\n                }\n                return b.join(\"\");\n        };\n\n        function add_commas(a) {\n                return a.join(\",\" + space);\n        };\n\n        function parenthesize(expr) {\n                var gen = make(expr);\n                for (var i = 1; i < arguments.length; ++i) {\n                        var el = arguments[i];\n                        if ((el instanceof Function && el(expr)) || expr[0] == el)\n                                return \"(\" + gen + \")\";\n                }\n                return gen;\n        };\n\n        function best_of(a) {\n                if (a.length == 1) {\n                        return a[0];\n                }\n                if (a.length == 2) {\n                        var b = a[1];\n                        a = a[0];\n                        return a.length <= b.length ? a : b;\n                }\n                return best_of([ a[0], best_of(a.slice(1)) ]);\n        };\n\n        function needs_parens(expr) {\n                if (expr[0] == \"function\" || expr[0] == \"object\") {\n                        // dot/call on a literal function requires the\n                        // function literal itself to be parenthesized\n                        // only if it's the first \"thing\" in a\n                        // statement.  This means that the parent is\n                        // \"stat\", but it could also be a \"seq\" and\n                        // we're the first in this \"seq\" and the\n                        // parent is \"stat\", and so on.  Messy stuff,\n                        // but it worths the trouble.\n                        var a = slice(w.stack()), self = a.pop(), p = a.pop();\n                        while (p) {\n                                if (p[0] == \"stat\") return true;\n                                if (((p[0] == \"seq\" || p[0] == \"call\" || p[0] == \"dot\" || p[0] == \"sub\" || p[0] == \"conditional\") && p[1] === self) ||\n                                    ((p[0] == \"binary\" || p[0] == \"assign\" || p[0] == \"unary-postfix\") && p[2] === self)) {\n                                        self = p;\n                                        p = a.pop();\n                                } else {\n                                        return false;\n                                }\n                        }\n                }\n                return !HOP(DOT_CALL_NO_PARENS, expr[0]);\n        };\n\n        function make_num(num) {\n                var str = num.toString(10), a = [ str.replace(/^0\\./, \".\").replace('e+', 'e') ], m;\n                if (Math.floor(num) === num) {\n                        if (num >= 0) {\n                                a.push(\"0x\" + num.toString(16).toLowerCase(), // probably pointless\n                                       \"0\" + num.toString(8)); // same.\n                        } else {\n                                a.push(\"-0x\" + (-num).toString(16).toLowerCase(), // probably pointless\n                                       \"-0\" + (-num).toString(8)); // same.\n                        }\n                        if ((m = /^(.*?)(0+)$/.exec(num))) {\n                                a.push(m[1] + \"e\" + m[2].length);\n                        }\n                } else if ((m = /^0?\\.(0+)(.*)$/.exec(num))) {\n                        a.push(m[2] + \"e-\" + (m[1].length + m[2].length),\n                               str.substr(str.indexOf(\".\")));\n                }\n                return best_of(a);\n        };\n\n        var w = ast_walker();\n        var make = w.walk;\n        return w.with_walkers({\n                \"string\": encode_string,\n                \"num\": make_num,\n                \"name\": make_name,\n                \"debugger\": function(){ return \"debugger;\" },\n                \"toplevel\": function(statements) {\n                        return make_block_statements(statements)\n                                .join(newline + newline);\n                },\n                \"splice\": function(statements) {\n                        var parent = w.parent();\n                        if (HOP(SPLICE_NEEDS_BRACKETS, parent)) {\n                                // we need block brackets in this case\n                                return make_block.apply(this, arguments);\n                        } else {\n                                return MAP(make_block_statements(statements, true),\n                                           function(line, i) {\n                                                   // the first line is already indented\n                                                   return i > 0 ? indent(line) : line;\n                                           }).join(newline);\n                        }\n                },\n                \"block\": make_block,\n                \"var\": function(defs) {\n                        return \"var \" + add_commas(MAP(defs, make_1vardef)) + \";\";\n                },\n                \"const\": function(defs) {\n                        return \"const \" + add_commas(MAP(defs, make_1vardef)) + \";\";\n                },\n                \"try\": function(tr, ca, fi) {\n                        var out = [ \"try\", make_block(tr) ];\n                        if (ca) out.push(\"catch\", \"(\" + ca[0] + \")\", make_block(ca[1]));\n                        if (fi) out.push(\"finally\", make_block(fi));\n                        return add_spaces(out);\n                },\n                \"throw\": function(expr) {\n                        return add_spaces([ \"throw\", make(expr) ]) + \";\";\n                },\n                \"new\": function(ctor, args) {\n                        args = args.length > 0 ? \"(\" + add_commas(MAP(args, function(expr){\n                                return parenthesize(expr, \"seq\");\n                        })) + \")\" : \"\";\n                        return add_spaces([ \"new\", parenthesize(ctor, \"seq\", \"binary\", \"conditional\", \"assign\", function(expr){\n                                var w = ast_walker(), has_call = {};\n                                try {\n                                        w.with_walkers({\n                                                \"call\": function() { throw has_call },\n                                                \"function\": function() { return this }\n                                        }, function(){\n                                                w.walk(expr);\n                                        });\n                                } catch(ex) {\n                                        if (ex === has_call)\n                                                return true;\n                                        throw ex;\n                                }\n                        }) + args ]);\n                },\n                \"switch\": function(expr, body) {\n                        return add_spaces([ \"switch\", \"(\" + make(expr) + \")\", make_switch_block(body) ]);\n                },\n                \"break\": function(label) {\n                        var out = \"break\";\n                        if (label != null)\n                                out += \" \" + make_name(label);\n                        return out + \";\";\n                },\n                \"continue\": function(label) {\n                        var out = \"continue\";\n                        if (label != null)\n                                out += \" \" + make_name(label);\n                        return out + \";\";\n                },\n                \"conditional\": function(co, th, el) {\n                        return add_spaces([ parenthesize(co, \"assign\", \"seq\", \"conditional\"), \"?\",\n                                            parenthesize(th, \"seq\"), \":\",\n                                            parenthesize(el, \"seq\") ]);\n                },\n                \"assign\": function(op, lvalue, rvalue) {\n                        if (op && op !== true) op += \"=\";\n                        else op = \"=\";\n                        return add_spaces([ make(lvalue), op, parenthesize(rvalue, \"seq\") ]);\n                },\n                \"dot\": function(expr) {\n                        var out = make(expr), i = 1;\n                        if (expr[0] == \"num\") {\n                                if (!/[a-f.]/i.test(out))\n                                        out += \".\";\n                        } else if (expr[0] != \"function\" && needs_parens(expr))\n                                out = \"(\" + out + \")\";\n                        while (i < arguments.length)\n                                out += \".\" + make_name(arguments[i++]);\n                        return out;\n                },\n                \"call\": function(func, args) {\n                        var f = make(func);\n                        if (f.charAt(0) != \"(\" && needs_parens(func))\n                                f = \"(\" + f + \")\";\n                        return f + \"(\" + add_commas(MAP(args, function(expr){\n                                return parenthesize(expr, \"seq\");\n                        })) + \")\";\n                },\n                \"function\": make_function,\n                \"defun\": make_function,\n                \"if\": function(co, th, el) {\n                        var out = [ \"if\", \"(\" + make(co) + \")\", el ? make_then(th) : make(th) ];\n                        if (el) {\n                                out.push(\"else\", make(el));\n                        }\n                        return add_spaces(out);\n                },\n                \"for\": function(init, cond, step, block) {\n                        var out = [ \"for\" ];\n                        init = (init != null ? make(init) : \"\").replace(/;*\\s*$/, \";\" + space);\n                        cond = (cond != null ? make(cond) : \"\").replace(/;*\\s*$/, \";\" + space);\n                        step = (step != null ? make(step) : \"\").replace(/;*\\s*$/, \"\");\n                        var args = init + cond + step;\n                        if (args == \"; ; \") args = \";;\";\n                        out.push(\"(\" + args + \")\", make(block));\n                        return add_spaces(out);\n                },\n                \"for-in\": function(vvar, key, hash, block) {\n                        return add_spaces([ \"for\", \"(\" +\n                                            (vvar ? make(vvar).replace(/;+$/, \"\") : make(key)),\n                                            \"in\",\n                                            make(hash) + \")\", make(block) ]);\n                },\n                \"while\": function(condition, block) {\n                        return add_spaces([ \"while\", \"(\" + make(condition) + \")\", make(block) ]);\n                },\n                \"do\": function(condition, block) {\n                        return add_spaces([ \"do\", make(block), \"while\", \"(\" + make(condition) + \")\" ]) + \";\";\n                },\n                \"return\": function(expr) {\n                        var out = [ \"return\" ];\n                        if (expr != null) out.push(make(expr));\n                        return add_spaces(out) + \";\";\n                },\n                \"binary\": function(operator, lvalue, rvalue) {\n                        var left = make(lvalue), right = make(rvalue);\n                        // XXX: I'm pretty sure other cases will bite here.\n                        //      we need to be smarter.\n                        //      adding parens all the time is the safest bet.\n                        if (member(lvalue[0], [ \"assign\", \"conditional\", \"seq\" ]) ||\n                            lvalue[0] == \"binary\" && PRECEDENCE[operator] > PRECEDENCE[lvalue[1]] ||\n                            lvalue[0] == \"function\" && needs_parens(this)) {\n                                left = \"(\" + left + \")\";\n                        }\n                        if (member(rvalue[0], [ \"assign\", \"conditional\", \"seq\" ]) ||\n                            rvalue[0] == \"binary\" && PRECEDENCE[operator] >= PRECEDENCE[rvalue[1]] &&\n                            !(rvalue[1] == operator && member(operator, [ \"&&\", \"||\", \"*\" ]))) {\n                                right = \"(\" + right + \")\";\n                        }\n                        else if (!beautify && options.inline_script && (operator == \"<\" || operator == \"<<\")\n                                 && rvalue[0] == \"regexp\" && /^script/i.test(rvalue[1])) {\n                                right = \" \" + right;\n                        }\n                        return add_spaces([ left, operator, right ]);\n                },\n                \"unary-prefix\": function(operator, expr) {\n                        var val = make(expr);\n                        if (!(expr[0] == \"num\" || (expr[0] == \"unary-prefix\" && !HOP(OPERATORS, operator + expr[1])) || !needs_parens(expr)))\n                                val = \"(\" + val + \")\";\n                        return operator + (jsp.is_alphanumeric_char(operator.charAt(0)) ? \" \" : \"\") + val;\n                },\n                \"unary-postfix\": function(operator, expr) {\n                        var val = make(expr);\n                        if (!(expr[0] == \"num\" || (expr[0] == \"unary-postfix\" && !HOP(OPERATORS, operator + expr[1])) || !needs_parens(expr)))\n                                val = \"(\" + val + \")\";\n                        return val + operator;\n                },\n                \"sub\": function(expr, subscript) {\n                        var hash = make(expr);\n                        if (needs_parens(expr))\n                                hash = \"(\" + hash + \")\";\n                        return hash + \"[\" + make(subscript) + \"]\";\n                },\n                \"object\": function(props) {\n                        var obj_needs_parens = needs_parens(this);\n                        if (props.length == 0)\n                                return obj_needs_parens ? \"({})\" : \"{}\";\n                        var out = \"{\" + newline + with_indent(function(){\n                                return MAP(props, function(p){\n                                        if (p.length == 3) {\n                                                // getter/setter.  The name is in p[0], the arg.list in p[1][2], the\n                                                // body in p[1][3] and type (\"get\" / \"set\") in p[2].\n                                                return indent(make_function(p[0], p[1][2], p[1][3], p[2], true));\n                                        }\n                                        var key = p[0], val = parenthesize(p[1], \"seq\");\n                                        if (options.quote_keys) {\n                                                key = encode_string(key);\n                                        } else if ((typeof key == \"number\" || !beautify && +key + \"\" == key)\n                                                   && parseFloat(key) >= 0) {\n                                                key = make_num(+key);\n                                        } else if (!is_identifier(key)) {\n                                                key = encode_string(key);\n                                        }\n                                        return indent(add_spaces(beautify && options.space_colon\n                                                                 ? [ key, \":\", val ]\n                                                                 : [ key + \":\", val ]));\n                                }).join(\",\" + newline);\n                        }) + newline + indent(\"}\");\n                        return obj_needs_parens ? \"(\" + out + \")\" : out;\n                },\n                \"regexp\": function(rx, mods) {\n                        if (options.ascii_only) rx = to_ascii(rx);\n                        return \"/\" + rx + \"/\" + mods;\n                },\n                \"array\": function(elements) {\n                        if (elements.length == 0) return \"[]\";\n                        return add_spaces([ \"[\", add_commas(MAP(elements, function(el, i){\n                                if (!beautify && el[0] == \"atom\" && el[1] == \"undefined\") return i === elements.length - 1 ? \",\" : \"\";\n                                return parenthesize(el, \"seq\");\n                        })), \"]\" ]);\n                },\n                \"stat\": function(stmt) {\n                        return stmt != null\n                                ? make(stmt).replace(/;*\\s*$/, \";\")\n                                : \";\";\n                },\n                \"seq\": function() {\n                        return add_commas(MAP(slice(arguments), make));\n                },\n                \"label\": function(name, block) {\n                        return add_spaces([ make_name(name), \":\", make(block) ]);\n                },\n                \"with\": function(expr, block) {\n                        return add_spaces([ \"with\", \"(\" + make(expr) + \")\", make(block) ]);\n                },\n                \"atom\": function(name) {\n                        return make_name(name);\n                },\n                \"directive\": function(dir) {\n                        return make_string(dir) + \";\";\n                }\n        }, function(){ return make(ast) });\n\n        // The squeezer replaces \"block\"-s that contain only a single\n        // statement with the statement itself; technically, the AST\n        // is correct, but this can create problems when we output an\n        // IF having an ELSE clause where the THEN clause ends in an\n        // IF *without* an ELSE block (then the outer ELSE would refer\n        // to the inner IF).  This function checks for this case and\n        // adds the block brackets if needed.\n        function make_then(th) {\n                if (th == null) return \";\";\n                if (th[0] == \"do\") {\n                        // https://github.com/mishoo/UglifyJS/issues/#issue/57\n                        // IE croaks with \"syntax error\" on code like this:\n                        //     if (foo) do ... while(cond); else ...\n                        // we need block brackets around do/while\n                        return make_block([ th ]);\n                }\n                var b = th;\n                while (true) {\n                        var type = b[0];\n                        if (type == \"if\") {\n                                if (!b[3])\n                                        // no else, we must add the block\n                                        return make([ \"block\", [ th ]]);\n                                b = b[3];\n                        }\n                        else if (type == \"while\" || type == \"do\") b = b[2];\n                        else if (type == \"for\" || type == \"for-in\") b = b[4];\n                        else break;\n                }\n                return make(th);\n        };\n\n        function make_function(name, args, body, keyword, no_parens) {\n                var out = keyword || \"function\";\n                if (name) {\n                        out += \" \" + make_name(name);\n                }\n                out += \"(\" + add_commas(MAP(args, make_name)) + \")\";\n                out = add_spaces([ out, make_block(body) ]);\n                return (!no_parens && needs_parens(this)) ? \"(\" + out + \")\" : out;\n        };\n\n        function must_has_semicolon(node) {\n                switch (node[0]) {\n                    case \"with\":\n                    case \"while\":\n                        return empty(node[2]) || must_has_semicolon(node[2]);\n                    case \"for\":\n                    case \"for-in\":\n                        return empty(node[4]) || must_has_semicolon(node[4]);\n                    case \"if\":\n                        if (empty(node[2]) && !node[3]) return true; // `if' with empty `then' and no `else'\n                        if (node[3]) {\n                                if (empty(node[3])) return true; // `else' present but empty\n                                return must_has_semicolon(node[3]); // dive into the `else' branch\n                        }\n                        return must_has_semicolon(node[2]); // dive into the `then' branch\n                    case \"directive\":\n                        return true;\n                }\n        };\n\n        function make_block_statements(statements, noindent) {\n                for (var a = [], last = statements.length - 1, i = 0; i <= last; ++i) {\n                        var stat = statements[i];\n                        var code = make(stat);\n                        if (code != \";\") {\n                                if (!beautify && i == last && !must_has_semicolon(stat)) {\n                                        code = code.replace(/;+\\s*$/, \"\");\n                                }\n                                a.push(code);\n                        }\n                }\n                return noindent ? a : MAP(a, indent);\n        };\n\n        function make_switch_block(body) {\n                var n = body.length;\n                if (n == 0) return \"{}\";\n                return \"{\" + newline + MAP(body, function(branch, i){\n                        var has_body = branch[1].length > 0, code = with_indent(function(){\n                                return indent(branch[0]\n                                              ? add_spaces([ \"case\", make(branch[0]) + \":\" ])\n                                              : \"default:\");\n                        }, 0.5) + (has_body ? newline + with_indent(function(){\n                                return make_block_statements(branch[1]).join(newline);\n                        }) : \"\");\n                        if (!beautify && has_body && i < n - 1)\n                                code += \";\";\n                        return code;\n                }).join(newline) + newline + indent(\"}\");\n        };\n\n        function make_block(statements) {\n                if (!statements) return \";\";\n                if (statements.length == 0) return \"{}\";\n                return \"{\" + newline + with_indent(function(){\n                        return make_block_statements(statements).join(newline);\n                }) + newline + indent(\"}\");\n        };\n\n        function make_1vardef(def) {\n                var name = def[0], val = def[1];\n                if (val != null)\n                        name = add_spaces([ make_name(name), \"=\", parenthesize(val, \"seq\") ]);\n                return name;\n        };\n\n};\n\nfunction split_lines(code, max_line_length) {\n        var splits = [ 0 ];\n        jsp.parse(function(){\n                var next_token = jsp.tokenizer(code);\n                var last_split = 0;\n                var prev_token;\n                function current_length(tok) {\n                        return tok.pos - last_split;\n                };\n                function split_here(tok) {\n                        last_split = tok.pos;\n                        splits.push(last_split);\n                };\n                function custom(){\n                        var tok = next_token.apply(this, arguments);\n                        out: {\n                                if (prev_token) {\n                                        if (prev_token.type == \"keyword\") break out;\n                                }\n                                if (current_length(tok) > max_line_length) {\n                                        switch (tok.type) {\n                                            case \"keyword\":\n                                            case \"atom\":\n                                            case \"name\":\n                                            case \"punc\":\n                                                split_here(tok);\n                                                break out;\n                                        }\n                                }\n                        }\n                        prev_token = tok;\n                        return tok;\n                };\n                custom.context = function() {\n                        return next_token.context.apply(this, arguments);\n                };\n                return custom;\n        }());\n        return splits.map(function(pos, i){\n                return code.substring(pos, splits[i + 1] || code.length);\n        }).join(\"\\n\");\n};\n\n/* -----[ Utilities ]----- */\n\nfunction repeat_string(str, i) {\n        if (i <= 0) return \"\";\n        if (i == 1) return str;\n        var d = repeat_string(str, i >> 1);\n        d += d;\n        if (i & 1) d += str;\n        return d;\n};\n\nfunction defaults(args, defs) {\n        var ret = {};\n        if (args === true)\n                args = {};\n        for (var i in defs) if (HOP(defs, i)) {\n                ret[i] = (args && HOP(args, i)) ? args[i] : defs[i];\n        }\n        return ret;\n};\n\nfunction is_identifier(name) {\n        return /^[a-z_$][a-z0-9_$]*$/i.test(name)\n                && name != \"this\"\n                && !HOP(jsp.KEYWORDS_ATOM, name)\n                && !HOP(jsp.RESERVED_WORDS, name)\n                && !HOP(jsp.KEYWORDS, name);\n};\n\nfunction HOP(obj, prop) {\n        return Object.prototype.hasOwnProperty.call(obj, prop);\n};\n\n// some utilities\n\nvar MAP;\n\n(function(){\n        MAP = function(a, f, o) {\n                var ret = [], top = [], i;\n                function doit() {\n                        var val = f.call(o, a[i], i);\n                        if (val instanceof AtTop) {\n                                val = val.v;\n                                if (val instanceof Splice) {\n                                        top.push.apply(top, val.v);\n                                } else {\n                                        top.push(val);\n                                }\n                        }\n                        else if (val != skip) {\n                                if (val instanceof Splice) {\n                                        ret.push.apply(ret, val.v);\n                                } else {\n                                        ret.push(val);\n                                }\n                        }\n                };\n                if (a instanceof Array) for (i = 0; i < a.length; ++i) doit();\n                else for (i in a) if (HOP(a, i)) doit();\n                return top.concat(ret);\n        };\n        MAP.at_top = function(val) { return new AtTop(val) };\n        MAP.splice = function(val) { return new Splice(val) };\n        var skip = MAP.skip = {};\n        function AtTop(val) { this.v = val };\n        function Splice(val) { this.v = val };\n})();\n\n/* -----[ Exports ]----- */\n\nexports.ast_walker = ast_walker;\nexports.ast_mangle = ast_mangle;\nexports.ast_squeeze = ast_squeeze;\nexports.ast_lift_variables = ast_lift_variables;\nexports.gen_code = gen_code;\nexports.ast_add_scope = ast_add_scope;\nexports.set_logger = function(logger) { warn = logger };\nexports.make_string = make_string;\nexports.split_lines = split_lines;\nexports.MAP = MAP;\n\n// keep this last!\nexports.ast_squeeze_more = require(\"./squeeze-more\").ast_squeeze_more;\n\n// Local variables:\n// js-indent-level: 8\n// End:\n\n//@ sourceURL=/node_modules/racer/node_modules/uglify-js/lib/process.js"
));

require.define("/node_modules/racer/node_modules/uglify-js/lib/squeeze-more.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var jsp = require(\"./parse-js\"),\n    pro = require(\"./process\"),\n    slice = jsp.slice,\n    member = jsp.member,\n    curry = jsp.curry,\n    MAP = pro.MAP,\n    PRECEDENCE = jsp.PRECEDENCE,\n    OPERATORS = jsp.OPERATORS;\n\nfunction ast_squeeze_more(ast) {\n        var w = pro.ast_walker(), walk = w.walk, scope;\n        function with_scope(s, cont) {\n                var save = scope, ret;\n                scope = s;\n                ret = cont();\n                scope = save;\n                return ret;\n        };\n        function _lambda(name, args, body) {\n                return [ this[0], name, args, with_scope(body.scope, curry(MAP, body, walk)) ];\n        };\n        return w.with_walkers({\n                \"toplevel\": function(body) {\n                        return [ this[0], with_scope(this.scope, curry(MAP, body, walk)) ];\n                },\n                \"function\": _lambda,\n                \"defun\": _lambda,\n                \"new\": function(ctor, args) {\n                        if (ctor[0] == \"name\") {\n                                if (ctor[1] == \"Array\" && !scope.has(\"Array\")) {\n                                        if (args.length != 1) {\n                                                return [ \"array\", args ];\n                                        } else {\n                                                return walk([ \"call\", [ \"name\", \"Array\" ], args ]);\n                                        }\n                                } else if (ctor[1] == \"Object\" && !scope.has(\"Object\")) {\n                                        if (!args.length) {\n                                                return [ \"object\", [] ];\n                                        } else {\n                                                return walk([ \"call\", [ \"name\", \"Object\" ], args ]);\n                                        }\n                                } else if ((ctor[1] == \"RegExp\" || ctor[1] == \"Function\" || ctor[1] == \"Error\") && !scope.has(ctor[1])) {\n                                        return walk([ \"call\", [ \"name\", ctor[1] ], args]);\n                                }\n                        }\n                },\n                \"call\": function(expr, args) {\n                        if (expr[0] == \"dot\" && expr[1][0] == \"string\" && args.length == 1\n                            && (args[0][1] > 0 && expr[2] == \"substring\" || expr[2] == \"substr\")) {\n                                return [ \"call\", [ \"dot\", expr[1], \"slice\"], args];\n                        }\n                        if (expr[0] == \"dot\" && expr[2] == \"toString\" && args.length == 0) {\n                                // foo.toString()  ==>  foo+\"\"\n                                if (expr[1][0] == \"string\") return expr[1];\n                                return [ \"binary\", \"+\", expr[1], [ \"string\", \"\" ]];\n                        }\n                        if (expr[0] == \"name\") {\n                                if (expr[1] == \"Array\" && args.length != 1 && !scope.has(\"Array\")) {\n                                        return [ \"array\", args ];\n                                }\n                                if (expr[1] == \"Object\" && !args.length && !scope.has(\"Object\")) {\n                                        return [ \"object\", [] ];\n                                }\n                                if (expr[1] == \"String\" && !scope.has(\"String\")) {\n                                        return [ \"binary\", \"+\", args[0], [ \"string\", \"\" ]];\n                                }\n                        }\n                }\n        }, function() {\n                return walk(pro.ast_add_scope(ast));\n        });\n};\n\nexports.ast_squeeze_more = ast_squeeze_more;\n\n// Local variables:\n// js-indent-level: 8\n// End:\n\n//@ sourceURL=/node_modules/racer/node_modules/uglify-js/lib/squeeze-more.js"
));

require.define("/node_modules/racer/node_modules/uglify-js/lib/consolidator.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/**\n * @preserve Copyright 2012 Robert Gust-Bardon <http://robert.gust-bardon.org/>.\n * All rights reserved.\n *\n * Redistribution and use in source and binary forms, with or without\n * modification, are permitted provided that the following conditions\n * are met:\n *\n *     * Redistributions of source code must retain the above\n *       copyright notice, this list of conditions and the following\n *       disclaimer.\n *\n *     * Redistributions in binary form must reproduce the above\n *       copyright notice, this list of conditions and the following\n *       disclaimer in the documentation and/or other materials\n *       provided with the distribution.\n *\n * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER \"AS IS\" AND ANY\n * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE\n * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR\n * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE\n * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,\n * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,\n * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR\n * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\n * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR\n * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF\n * THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF\n * SUCH DAMAGE.\n */\n\n/**\n * @fileoverview Enhances <a href=\"https://github.com/mishoo/UglifyJS/\"\n * >UglifyJS</a> with consolidation of null, Boolean, and String values.\n * <p>Also known as aliasing, this feature has been deprecated in <a href=\n * \"http://closure-compiler.googlecode.com/\">the Closure Compiler</a> since its\n * initial release, where it is unavailable from the <abbr title=\n * \"command line interface\">CLI</a>. The Closure Compiler allows one to log and\n * influence this process. In contrast, this implementation does not introduce\n * any variable declarations in global code and derives String values from\n * identifier names used as property accessors.</p>\n * <p>Consolidating literals may worsen the data compression ratio when an <a\n * href=\"http://tools.ietf.org/html/rfc2616#section-3.5\">encoding\n * transformation</a> is applied. For instance, <a href=\n * \"http://code.jquery.com/jquery-1.7.1.js\">jQuery 1.7.1</a> takes 248235 bytes.\n * Building it with <a href=\"https://github.com/mishoo/UglifyJS/tarball/v1.2.5\">\n * UglifyJS v1.2.5</a> results in 93647 bytes (37.73% of the original) which are\n * then compressed to 33154 bytes (13.36% of the original) using <a href=\n * \"http://linux.die.net/man/1/gzip\">gzip(1)</a>. Building it with the same\n * version of UglifyJS 1.2.5 patched with the implementation of consolidation\n * results in 80784 bytes (a decrease of 12863 bytes, i.e. 13.74%, in comparison\n * to the aforementioned 93647 bytes) which are then compressed to 34013 bytes\n * (an increase of 859 bytes, i.e. 2.59%, in comparison to the aforementioned\n * 33154 bytes).</p>\n * <p>Written in <a href=\"http://es5.github.com/#x4.2.2\">the strict variant</a>\n * of <a href=\"http://es5.github.com/\">ECMA-262 5.1 Edition</a>. Encoded in <a\n * href=\"http://tools.ietf.org/html/rfc3629\">UTF-8</a>. Follows <a href=\n * \"http://google-styleguide.googlecode.com/svn-history/r76/trunk/javascriptguide.xml\"\n * >Revision 2.28 of the Google JavaScript Style Guide</a> (except for the\n * discouraged use of the {@code function} tag and the {@code namespace} tag).\n * 100% typed for the <a href=\n * \"http://closure-compiler.googlecode.com/files/compiler-20120123.tar.gz\"\n * >Closure Compiler Version 1741</a>.</p>\n * <p>Should you find this software useful, please consider <a href=\n * \"https://paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=JZLW72X8FD4WG\"\n * >a donation</a>.</p>\n * @author follow.me@RGustBardon (Robert Gust-Bardon)\n * @supported Tested with:\n *     <ul>\n *     <li><a href=\"http://nodejs.org/dist/v0.6.10/\">Node v0.6.10</a>,</li>\n *     <li><a href=\"https://github.com/mishoo/UglifyJS/tarball/v1.2.5\">UglifyJS\n *       v1.2.5</a>.</li>\n *     </ul>\n */\n\n/*global console:false, exports:true, module:false, require:false */\n/*jshint sub:true */\n/**\n * Consolidates null, Boolean, and String values found inside an <abbr title=\n * \"abstract syntax tree\">AST</abbr>.\n * @param {!TSyntacticCodeUnit} oAbstractSyntaxTree An array-like object\n *     representing an <abbr title=\"abstract syntax tree\">AST</abbr>.\n * @return {!TSyntacticCodeUnit} An array-like object representing an <abbr\n *     title=\"abstract syntax tree\">AST</abbr> with its null, Boolean, and\n *     String values consolidated.\n */\n// TODO(user) Consolidation of mathematical values found in numeric literals.\n// TODO(user) Unconsolidation.\n// TODO(user) Consolidation of ECMA-262 6th Edition programs.\n// TODO(user) Rewrite in ECMA-262 6th Edition.\nexports['ast_consolidate'] = function(oAbstractSyntaxTree) {\n  'use strict';\n  /*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, immed:true,\n        latedef:true, newcap:true, noarge:true, noempty:true, nonew:true,\n        onevar:true, plusplus:true, regexp:true, undef:true, strict:true,\n        sub:false, trailing:true */\n\n  var _,\n      /**\n       * A record consisting of data about one or more source elements.\n       * @constructor\n       * @nosideeffects\n       */\n      TSourceElementsData = function() {\n        /**\n         * The category of the elements.\n         * @type {number}\n         * @see ESourceElementCategories\n         */\n        this.nCategory = ESourceElementCategories.N_OTHER;\n        /**\n         * The number of occurrences (within the elements) of each primitive\n         * value that could be consolidated.\n         * @type {!Array.<!Object.<string, number>>}\n         */\n        this.aCount = [];\n        this.aCount[EPrimaryExpressionCategories.N_IDENTIFIER_NAMES] = {};\n        this.aCount[EPrimaryExpressionCategories.N_STRING_LITERALS] = {};\n        this.aCount[EPrimaryExpressionCategories.N_NULL_AND_BOOLEAN_LITERALS] =\n            {};\n        /**\n         * Identifier names found within the elements.\n         * @type {!Array.<string>}\n         */\n        this.aIdentifiers = [];\n        /**\n         * Prefixed representation Strings of each primitive value that could be\n         * consolidated within the elements.\n         * @type {!Array.<string>}\n         */\n        this.aPrimitiveValues = [];\n      },\n      /**\n       * A record consisting of data about a primitive value that could be\n       * consolidated.\n       * @constructor\n       * @nosideeffects\n       */\n      TPrimitiveValue = function() {\n        /**\n         * The difference in the number of terminal symbols between the original\n         * source text and the one with the primitive value consolidated. If the\n         * difference is positive, the primitive value is considered worthwhile.\n         * @type {number}\n         */\n        this.nSaving = 0;\n        /**\n         * An identifier name of the variable that will be declared and assigned\n         * the primitive value if the primitive value is consolidated.\n         * @type {string}\n         */\n        this.sName = '';\n      },\n      /**\n       * A record consisting of data on what to consolidate within the range of\n       * source elements that is currently being considered.\n       * @constructor\n       * @nosideeffects\n       */\n      TSolution = function() {\n        /**\n         * An object whose keys are prefixed representation Strings of each\n         * primitive value that could be consolidated within the elements and\n         * whose values are corresponding data about those primitive values.\n         * @type {!Object.<string, {nSaving: number, sName: string}>}\n         * @see TPrimitiveValue\n         */\n        this.oPrimitiveValues = {};\n        /**\n         * The difference in the number of terminal symbols between the original\n         * source text and the one with all the worthwhile primitive values\n         * consolidated.\n         * @type {number}\n         * @see TPrimitiveValue#nSaving\n         */\n        this.nSavings = 0;\n      },\n      /**\n       * The processor of <abbr title=\"abstract syntax tree\">AST</abbr>s found\n       * in UglifyJS.\n       * @namespace\n       * @type {!TProcessor}\n       */\n      oProcessor = (/** @type {!TProcessor} */ require('./process')),\n      /**\n       * A record consisting of a number of constants that represent the\n       * difference in the number of terminal symbols between a source text with\n       * a modified syntactic code unit and the original one.\n       * @namespace\n       * @type {!Object.<string, number>}\n       */\n      oWeights = {\n        /**\n         * The difference in the number of punctuators required by the bracket\n         * notation and the dot notation.\n         * <p><code>'[]'.length - '.'.length</code></p>\n         * @const\n         * @type {number}\n         */\n        N_PROPERTY_ACCESSOR: 1,\n        /**\n         * The number of punctuators required by a variable declaration with an\n         * initialiser.\n         * <p><code>':'.length + ';'.length</code></p>\n         * @const\n         * @type {number}\n         */\n        N_VARIABLE_DECLARATION: 2,\n        /**\n         * The number of terminal symbols required to introduce a variable\n         * statement (excluding its variable declaration list).\n         * <p><code>'var '.length</code></p>\n         * @const\n         * @type {number}\n         */\n        N_VARIABLE_STATEMENT_AFFIXATION: 4,\n        /**\n         * The number of terminal symbols needed to enclose source elements\n         * within a function call with no argument values to a function with an\n         * empty parameter list.\n         * <p><code>'(function(){}());'.length</code></p>\n         * @const\n         * @type {number}\n         */\n        N_CLOSURE: 17\n      },\n      /**\n       * Categories of primary expressions from which primitive values that\n       * could be consolidated are derivable.\n       * @namespace\n       * @enum {number}\n       */\n      EPrimaryExpressionCategories = {\n        /**\n         * Identifier names used as property accessors.\n         * @type {number}\n         */\n        N_IDENTIFIER_NAMES: 0,\n        /**\n         * String literals.\n         * @type {number}\n         */\n        N_STRING_LITERALS: 1,\n        /**\n         * Null and Boolean literals.\n         * @type {number}\n         */\n        N_NULL_AND_BOOLEAN_LITERALS: 2\n      },\n      /**\n       * Prefixes of primitive values that could be consolidated.\n       * The String values of the prefixes must have same number of characters.\n       * The prefixes must not be used in any properties defined in any version\n       * of <a href=\n       * \"http://www.ecma-international.org/publications/standards/Ecma-262.htm\"\n       * >ECMA-262</a>.\n       * @namespace\n       * @enum {string}\n       */\n      EValuePrefixes = {\n        /**\n         * Identifies String values.\n         * @type {string}\n         */\n        S_STRING: '#S',\n        /**\n         * Identifies null and Boolean values.\n         * @type {string}\n         */\n        S_SYMBOLIC: '#O'\n      },\n      /**\n       * Categories of source elements in terms of their appropriateness of\n       * having their primitive values consolidated.\n       * @namespace\n       * @enum {number}\n       */\n      ESourceElementCategories = {\n        /**\n         * Identifies a source element that includes the <a href=\n         * \"http://es5.github.com/#x12.10\">{@code with}</a> statement.\n         * @type {number}\n         */\n        N_WITH: 0,\n        /**\n         * Identifies a source element that includes the <a href=\n         * \"http://es5.github.com/#x15.1.2.1\">{@code eval}</a> identifier name.\n         * @type {number}\n         */\n        N_EVAL: 1,\n        /**\n         * Identifies a source element that must be excluded from the process\n         * unless its whole scope is examined.\n         * @type {number}\n         */\n        N_EXCLUDABLE: 2,\n        /**\n         * Identifies source elements not posing any problems.\n         * @type {number}\n         */\n        N_OTHER: 3\n      },\n      /**\n       * The list of literals (other than the String ones) whose primitive\n       * values can be consolidated.\n       * @const\n       * @type {!Array.<string>}\n       */\n      A_OTHER_SUBSTITUTABLE_LITERALS = [\n        'null',   // The null literal.\n        'false',  // The Boolean literal {@code false}.\n        'true'    // The Boolean literal {@code true}.\n      ];\n\n  (/**\n    * Consolidates all worthwhile primitive values in a syntactic code unit.\n    * @param {!TSyntacticCodeUnit} oSyntacticCodeUnit An array-like object\n    *     representing the branch of the abstract syntax tree representing the\n    *     syntactic code unit along with its scope.\n    * @see TPrimitiveValue#nSaving\n    */\n   function fExamineSyntacticCodeUnit(oSyntacticCodeUnit) {\n     var _,\n         /**\n          * Indicates whether the syntactic code unit represents global code.\n          * @type {boolean}\n          */\n         bIsGlobal = 'toplevel' === oSyntacticCodeUnit[0],\n         /**\n          * Indicates whether the whole scope is being examined.\n          * @type {boolean}\n          */\n         bIsWhollyExaminable = !bIsGlobal,\n         /**\n          * An array-like object representing source elements that constitute a\n          * syntactic code unit.\n          * @type {!TSyntacticCodeUnit}\n          */\n         oSourceElements,\n         /**\n          * A record consisting of data about the source element that is\n          * currently being examined.\n          * @type {!TSourceElementsData}\n          */\n         oSourceElementData,\n         /**\n          * The scope of the syntactic code unit.\n          * @type {!TScope}\n          */\n         oScope,\n         /**\n          * An instance of an object that allows the traversal of an <abbr\n          * title=\"abstract syntax tree\">AST</abbr>.\n          * @type {!TWalker}\n          */\n         oWalker,\n         /**\n          * An object encompassing collections of functions used during the\n          * traversal of an <abbr title=\"abstract syntax tree\">AST</abbr>.\n          * @namespace\n          * @type {!Object.<string, !Object.<string, function(...[*])>>}\n          */\n         oWalkers = {\n           /**\n            * A collection of functions used during the surveyance of source\n            * elements.\n            * @namespace\n            * @type {!Object.<string, function(...[*])>}\n            */\n           oSurveySourceElement: {\n             /**#nocode+*/  // JsDoc Toolkit 2.4.0 hides some of the keys.\n             /**\n              * Classifies the source element as excludable if it does not\n              * contain a {@code with} statement or the {@code eval} identifier\n              * name. Adds the identifier of the function and its formal\n              * parameters to the list of identifier names found.\n              * @param {string} sIdentifier The identifier of the function.\n              * @param {!Array.<string>} aFormalParameterList Formal parameters.\n              * @param {!TSyntacticCodeUnit} oFunctionBody Function code.\n              */\n             'defun': function(\n                 sIdentifier,\n                 aFormalParameterList,\n                 oFunctionBody) {\n               fClassifyAsExcludable();\n               fAddIdentifier(sIdentifier);\n               aFormalParameterList.forEach(fAddIdentifier);\n             },\n             /**\n              * Increments the count of the number of occurrences of the String\n              * value that is equivalent to the sequence of terminal symbols\n              * that constitute the encountered identifier name.\n              * @param {!TSyntacticCodeUnit} oExpression The nonterminal\n              *     MemberExpression.\n              * @param {string} sIdentifierName The identifier name used as the\n              *     property accessor.\n              * @return {!Array} The encountered branch of an <abbr title=\n              *     \"abstract syntax tree\">AST</abbr> with its nonterminal\n              *     MemberExpression traversed.\n              */\n             'dot': function(oExpression, sIdentifierName) {\n               fCountPrimaryExpression(\n                   EPrimaryExpressionCategories.N_IDENTIFIER_NAMES,\n                   EValuePrefixes.S_STRING + sIdentifierName);\n               return ['dot', oWalker.walk(oExpression), sIdentifierName];\n             },\n             /**\n              * Adds the optional identifier of the function and its formal\n              * parameters to the list of identifier names found.\n              * @param {?string} sIdentifier The optional identifier of the\n              *     function.\n              * @param {!Array.<string>} aFormalParameterList Formal parameters.\n              * @param {!TSyntacticCodeUnit} oFunctionBody Function code.\n              */\n             'function': function(\n                 sIdentifier,\n                 aFormalParameterList,\n                 oFunctionBody) {\n               if ('string' === typeof sIdentifier) {\n                 fAddIdentifier(sIdentifier);\n               }\n               aFormalParameterList.forEach(fAddIdentifier);\n             },\n             /**\n              * Either increments the count of the number of occurrences of the\n              * encountered null or Boolean value or classifies a source element\n              * as containing the {@code eval} identifier name.\n              * @param {string} sIdentifier The identifier encountered.\n              */\n             'name': function(sIdentifier) {\n               if (-1 !== A_OTHER_SUBSTITUTABLE_LITERALS.indexOf(sIdentifier)) {\n                 fCountPrimaryExpression(\n                     EPrimaryExpressionCategories.N_NULL_AND_BOOLEAN_LITERALS,\n                     EValuePrefixes.S_SYMBOLIC + sIdentifier);\n               } else {\n                 if ('eval' === sIdentifier) {\n                   oSourceElementData.nCategory =\n                       ESourceElementCategories.N_EVAL;\n                 }\n                 fAddIdentifier(sIdentifier);\n               }\n             },\n             /**\n              * Classifies the source element as excludable if it does not\n              * contain a {@code with} statement or the {@code eval} identifier\n              * name.\n              * @param {TSyntacticCodeUnit} oExpression The expression whose\n              *     value is to be returned.\n              */\n             'return': function(oExpression) {\n               fClassifyAsExcludable();\n             },\n             /**\n              * Increments the count of the number of occurrences of the\n              * encountered String value.\n              * @param {string} sStringValue The String value of the string\n              *     literal encountered.\n              */\n             'string': function(sStringValue) {\n               if (sStringValue.length > 0) {\n                 fCountPrimaryExpression(\n                     EPrimaryExpressionCategories.N_STRING_LITERALS,\n                     EValuePrefixes.S_STRING + sStringValue);\n               }\n             },\n             /**\n              * Adds the identifier reserved for an exception to the list of\n              * identifier names found.\n              * @param {!TSyntacticCodeUnit} oTry A block of code in which an\n              *     exception can occur.\n              * @param {Array} aCatch The identifier reserved for an exception\n              *     and a block of code to handle the exception.\n              * @param {TSyntacticCodeUnit} oFinally An optional block of code\n              *     to be evaluated regardless of whether an exception occurs.\n              */\n             'try': function(oTry, aCatch, oFinally) {\n               if (Array.isArray(aCatch)) {\n                 fAddIdentifier(aCatch[0]);\n               }\n             },\n             /**\n              * Classifies the source element as excludable if it does not\n              * contain a {@code with} statement or the {@code eval} identifier\n              * name. Adds the identifier of each declared variable to the list\n              * of identifier names found.\n              * @param {!Array.<!Array>} aVariableDeclarationList Variable\n              *     declarations.\n              */\n             'var': function(aVariableDeclarationList) {\n               fClassifyAsExcludable();\n               aVariableDeclarationList.forEach(fAddVariable);\n             },\n             /**\n              * Classifies a source element as containing the {@code with}\n              * statement.\n              * @param {!TSyntacticCodeUnit} oExpression An expression whose\n              *     value is to be converted to a value of type Object and\n              *     become the binding object of a new object environment\n              *     record of a new lexical environment in which the statement\n              *     is to be executed.\n              * @param {!TSyntacticCodeUnit} oStatement The statement to be\n              *     executed in the augmented lexical environment.\n              * @return {!Array} An empty array to stop the traversal.\n              */\n             'with': function(oExpression, oStatement) {\n               oSourceElementData.nCategory = ESourceElementCategories.N_WITH;\n               return [];\n             }\n             /**#nocode-*/  // JsDoc Toolkit 2.4.0 hides some of the keys.\n           },\n           /**\n            * A collection of functions used while looking for nested functions.\n            * @namespace\n            * @type {!Object.<string, function(...[*])>}\n            */\n           oExamineFunctions: {\n             /**#nocode+*/  // JsDoc Toolkit 2.4.0 hides some of the keys.\n             /**\n              * Orders an examination of a nested function declaration.\n              * @this {!TSyntacticCodeUnit} An array-like object representing\n              *     the branch of an <abbr title=\"abstract syntax tree\"\n              *     >AST</abbr> representing the syntactic code unit along with\n              *     its scope.\n              * @return {!Array} An empty array to stop the traversal.\n              */\n             'defun': function() {\n               fExamineSyntacticCodeUnit(this);\n               return [];\n             },\n             /**\n              * Orders an examination of a nested function expression.\n              * @this {!TSyntacticCodeUnit} An array-like object representing\n              *     the branch of an <abbr title=\"abstract syntax tree\"\n              *     >AST</abbr> representing the syntactic code unit along with\n              *     its scope.\n              * @return {!Array} An empty array to stop the traversal.\n              */\n             'function': function() {\n               fExamineSyntacticCodeUnit(this);\n               return [];\n             }\n             /**#nocode-*/  // JsDoc Toolkit 2.4.0 hides some of the keys.\n           }\n         },\n         /**\n          * Records containing data about source elements.\n          * @type {Array.<TSourceElementsData>}\n          */\n         aSourceElementsData = [],\n         /**\n          * The index (in the source text order) of the source element\n          * immediately following a <a href=\"http://es5.github.com/#x14.1\"\n          * >Directive Prologue</a>.\n          * @type {number}\n          */\n         nAfterDirectivePrologue = 0,\n         /**\n          * The index (in the source text order) of the source element that is\n          * currently being considered.\n          * @type {number}\n          */\n         nPosition,\n         /**\n          * The index (in the source text order) of the source element that is\n          * the last element of the range of source elements that is currently\n          * being considered.\n          * @type {(undefined|number)}\n          */\n         nTo,\n         /**\n          * Initiates the traversal of a source element.\n          * @param {!TWalker} oWalker An instance of an object that allows the\n          *     traversal of an abstract syntax tree.\n          * @param {!TSyntacticCodeUnit} oSourceElement A source element from\n          *     which the traversal should commence.\n          * @return {function(): !TSyntacticCodeUnit} A function that is able to\n          *     initiate the traversal from a given source element.\n          */\n         cContext = function(oWalker, oSourceElement) {\n           /**\n            * @return {!TSyntacticCodeUnit} A function that is able to\n            *     initiate the traversal from a given source element.\n            */\n           var fLambda = function() {\n             return oWalker.walk(oSourceElement);\n           };\n\n           return fLambda;\n         },\n         /**\n          * Classifies the source element as excludable if it does not\n          * contain a {@code with} statement or the {@code eval} identifier\n          * name.\n          */\n         fClassifyAsExcludable = function() {\n           if (oSourceElementData.nCategory ===\n               ESourceElementCategories.N_OTHER) {\n             oSourceElementData.nCategory =\n                 ESourceElementCategories.N_EXCLUDABLE;\n           }\n         },\n         /**\n          * Adds an identifier to the list of identifier names found.\n          * @param {string} sIdentifier The identifier to be added.\n          */\n         fAddIdentifier = function(sIdentifier) {\n           if (-1 === oSourceElementData.aIdentifiers.indexOf(sIdentifier)) {\n             oSourceElementData.aIdentifiers.push(sIdentifier);\n           }\n         },\n         /**\n          * Adds the identifier of a variable to the list of identifier names\n          * found.\n          * @param {!Array} aVariableDeclaration A variable declaration.\n          */\n         fAddVariable = function(aVariableDeclaration) {\n           fAddIdentifier(/** @type {string} */ aVariableDeclaration[0]);\n         },\n         /**\n          * Increments the count of the number of occurrences of the prefixed\n          * String representation attributed to the primary expression.\n          * @param {number} nCategory The category of the primary expression.\n          * @param {string} sName The prefixed String representation attributed\n          *     to the primary expression.\n          */\n         fCountPrimaryExpression = function(nCategory, sName) {\n           if (!oSourceElementData.aCount[nCategory].hasOwnProperty(sName)) {\n             oSourceElementData.aCount[nCategory][sName] = 0;\n             if (-1 === oSourceElementData.aPrimitiveValues.indexOf(sName)) {\n               oSourceElementData.aPrimitiveValues.push(sName);\n             }\n           }\n           oSourceElementData.aCount[nCategory][sName] += 1;\n         },\n         /**\n          * Consolidates all worthwhile primitive values in a range of source\n          *     elements.\n          * @param {number} nFrom The index (in the source text order) of the\n          *     source element that is the first element of the range.\n          * @param {number} nTo The index (in the source text order) of the\n          *     source element that is the last element of the range.\n          * @param {boolean} bEnclose Indicates whether the range should be\n          *     enclosed within a function call with no argument values to a\n          *     function with an empty parameter list if any primitive values\n          *     are consolidated.\n          * @see TPrimitiveValue#nSaving\n          */\n         fExamineSourceElements = function(nFrom, nTo, bEnclose) {\n           var _,\n               /**\n                * The index of the last mangled name.\n                * @type {number}\n                */\n               nIndex = oScope.cname,\n               /**\n                * The index of the source element that is currently being\n                * considered.\n                * @type {number}\n                */\n               nPosition,\n               /**\n                * A collection of functions used during the consolidation of\n                * primitive values and identifier names used as property\n                * accessors.\n                * @namespace\n                * @type {!Object.<string, function(...[*])>}\n                */\n               oWalkersTransformers = {\n                 /**\n                  * If the String value that is equivalent to the sequence of\n                  * terminal symbols that constitute the encountered identifier\n                  * name is worthwhile, a syntactic conversion from the dot\n                  * notation to the bracket notation ensues with that sequence\n                  * being substituted by an identifier name to which the value\n                  * is assigned.\n                  * Applies to property accessors that use the dot notation.\n                  * @param {!TSyntacticCodeUnit} oExpression The nonterminal\n                  *     MemberExpression.\n                  * @param {string} sIdentifierName The identifier name used as\n                  *     the property accessor.\n                  * @return {!Array} A syntactic code unit that is equivalent to\n                  *     the one encountered.\n                  * @see TPrimitiveValue#nSaving\n                  */\n                 'dot': function(oExpression, sIdentifierName) {\n                   /**\n                    * The prefixed String value that is equivalent to the\n                    * sequence of terminal symbols that constitute the\n                    * encountered identifier name.\n                    * @type {string}\n                    */\n                   var sPrefixed = EValuePrefixes.S_STRING + sIdentifierName;\n\n                   return oSolutionBest.oPrimitiveValues.hasOwnProperty(\n                       sPrefixed) &&\n                       oSolutionBest.oPrimitiveValues[sPrefixed].nSaving > 0 ?\n                       ['sub',\n                        oWalker.walk(oExpression),\n                        ['name',\n                         oSolutionBest.oPrimitiveValues[sPrefixed].sName]] :\n                       ['dot', oWalker.walk(oExpression), sIdentifierName];\n                 },\n                 /**\n                  * If the encountered identifier is a null or Boolean literal\n                  * and its value is worthwhile, the identifier is substituted\n                  * by an identifier name to which that value is assigned.\n                  * Applies to identifier names.\n                  * @param {string} sIdentifier The identifier encountered.\n                  * @return {!Array} A syntactic code unit that is equivalent to\n                  *     the one encountered.\n                  * @see TPrimitiveValue#nSaving\n                  */\n                 'name': function(sIdentifier) {\n                   /**\n                    * The prefixed representation String of the identifier.\n                    * @type {string}\n                    */\n                   var sPrefixed = EValuePrefixes.S_SYMBOLIC + sIdentifier;\n\n                   return [\n                     'name',\n                     oSolutionBest.oPrimitiveValues.hasOwnProperty(sPrefixed) &&\n                     oSolutionBest.oPrimitiveValues[sPrefixed].nSaving > 0 ?\n                     oSolutionBest.oPrimitiveValues[sPrefixed].sName :\n                     sIdentifier\n                   ];\n                 },\n                 /**\n                  * If the encountered String value is worthwhile, it is\n                  * substituted by an identifier name to which that value is\n                  * assigned.\n                  * Applies to String values.\n                  * @param {string} sStringValue The String value of the string\n                  *     literal encountered.\n                  * @return {!Array} A syntactic code unit that is equivalent to\n                  *     the one encountered.\n                  * @see TPrimitiveValue#nSaving\n                  */\n                 'string': function(sStringValue) {\n                   /**\n                    * The prefixed representation String of the primitive value\n                    * of the literal.\n                    * @type {string}\n                    */\n                   var sPrefixed =\n                       EValuePrefixes.S_STRING + sStringValue;\n\n                   return oSolutionBest.oPrimitiveValues.hasOwnProperty(\n                       sPrefixed) &&\n                       oSolutionBest.oPrimitiveValues[sPrefixed].nSaving > 0 ?\n                       ['name',\n                        oSolutionBest.oPrimitiveValues[sPrefixed].sName] :\n                       ['string', sStringValue];\n                 }\n               },\n               /**\n                * Such data on what to consolidate within the range of source\n                * elements that is currently being considered that lead to the\n                * greatest known reduction of the number of the terminal symbols\n                * in comparison to the original source text.\n                * @type {!TSolution}\n                */\n               oSolutionBest = new TSolution(),\n               /**\n                * Data representing an ongoing attempt to find a better\n                * reduction of the number of the terminal symbols in comparison\n                * to the original source text than the best one that is\n                * currently known.\n                * @type {!TSolution}\n                * @see oSolutionBest\n                */\n               oSolutionCandidate = new TSolution(),\n               /**\n                * A record consisting of data about the range of source elements\n                * that is currently being examined.\n                * @type {!TSourceElementsData}\n                */\n               oSourceElementsData = new TSourceElementsData(),\n               /**\n                * Variable declarations for each primitive value that is to be\n                * consolidated within the elements.\n                * @type {!Array.<!Array>}\n                */\n               aVariableDeclarations = [],\n               /**\n                * Augments a list with a prefixed representation String.\n                * @param {!Array.<string>} aList A list that is to be augmented.\n                * @return {function(string)} A function that augments a list\n                *     with a prefixed representation String.\n                */\n               cAugmentList = function(aList) {\n                 /**\n                  * @param {string} sPrefixed Prefixed representation String of\n                  *     a primitive value that could be consolidated within the\n                  *     elements.\n                  */\n                 var fLambda = function(sPrefixed) {\n                   if (-1 === aList.indexOf(sPrefixed)) {\n                     aList.push(sPrefixed);\n                   }\n                 };\n\n                 return fLambda;\n               },\n               /**\n                * Adds the number of occurrences of a primitive value of a given\n                * category that could be consolidated in the source element with\n                * a given index to the count of occurrences of that primitive\n                * value within the range of source elements that is currently\n                * being considered.\n                * @param {number} nPosition The index (in the source text order)\n                *     of a source element.\n                * @param {number} nCategory The category of the primary\n                *     expression from which the primitive value is derived.\n                * @return {function(string)} A function that performs the\n                *     addition.\n                * @see cAddOccurrencesInCategory\n                */\n               cAddOccurrences = function(nPosition, nCategory) {\n                 /**\n                  * @param {string} sPrefixed The prefixed representation String\n                  *     of a primitive value.\n                  */\n                 var fLambda = function(sPrefixed) {\n                   if (!oSourceElementsData.aCount[nCategory].hasOwnProperty(\n                           sPrefixed)) {\n                     oSourceElementsData.aCount[nCategory][sPrefixed] = 0;\n                   }\n                   oSourceElementsData.aCount[nCategory][sPrefixed] +=\n                       aSourceElementsData[nPosition].aCount[nCategory][\n                           sPrefixed];\n                 };\n\n                 return fLambda;\n               },\n               /**\n                * Adds the number of occurrences of each primitive value of a\n                * given category that could be consolidated in the source\n                * element with a given index to the count of occurrences of that\n                * primitive values within the range of source elements that is\n                * currently being considered.\n                * @param {number} nPosition The index (in the source text order)\n                *     of a source element.\n                * @return {function(number)} A function that performs the\n                *     addition.\n                * @see fAddOccurrences\n                */\n               cAddOccurrencesInCategory = function(nPosition) {\n                 /**\n                  * @param {number} nCategory The category of the primary\n                  *     expression from which the primitive value is derived.\n                  */\n                 var fLambda = function(nCategory) {\n                   Object.keys(\n                       aSourceElementsData[nPosition].aCount[nCategory]\n                   ).forEach(cAddOccurrences(nPosition, nCategory));\n                 };\n\n                 return fLambda;\n               },\n               /**\n                * Adds the number of occurrences of each primitive value that\n                * could be consolidated in the source element with a given index\n                * to the count of occurrences of that primitive values within\n                * the range of source elements that is currently being\n                * considered.\n                * @param {number} nPosition The index (in the source text order)\n                *     of a source element.\n                */\n               fAddOccurrences = function(nPosition) {\n                 Object.keys(aSourceElementsData[nPosition].aCount).forEach(\n                     cAddOccurrencesInCategory(nPosition));\n               },\n               /**\n                * Creates a variable declaration for a primitive value if that\n                * primitive value is to be consolidated within the elements.\n                * @param {string} sPrefixed Prefixed representation String of a\n                *     primitive value that could be consolidated within the\n                *     elements.\n                * @see aVariableDeclarations\n                */\n               cAugmentVariableDeclarations = function(sPrefixed) {\n                 if (oSolutionBest.oPrimitiveValues[sPrefixed].nSaving > 0) {\n                   aVariableDeclarations.push([\n                     oSolutionBest.oPrimitiveValues[sPrefixed].sName,\n                     [0 === sPrefixed.indexOf(EValuePrefixes.S_SYMBOLIC) ?\n                      'name' : 'string',\n                      sPrefixed.substring(EValuePrefixes.S_SYMBOLIC.length)]\n                   ]);\n                 }\n               },\n               /**\n                * Sorts primitive values with regard to the difference in the\n                * number of terminal symbols between the original source text\n                * and the one with those primitive values consolidated.\n                * @param {string} sPrefixed0 The prefixed representation String\n                *     of the first of the two primitive values that are being\n                *     compared.\n                * @param {string} sPrefixed1 The prefixed representation String\n                *     of the second of the two primitive values that are being\n                *     compared.\n                * @return {number}\n                *     <dl>\n                *         <dt>-1</dt>\n                *         <dd>if the first primitive value must be placed before\n                *              the other one,</dd>\n                *         <dt>0</dt>\n                *         <dd>if the first primitive value may be placed before\n                *              the other one,</dd>\n                *         <dt>1</dt>\n                *         <dd>if the first primitive value must not be placed\n                *              before the other one.</dd>\n                *     </dl>\n                * @see TSolution.oPrimitiveValues\n                */\n               cSortPrimitiveValues = function(sPrefixed0, sPrefixed1) {\n                 /**\n                  * The difference between:\n                  * <ol>\n                  * <li>the difference in the number of terminal symbols\n                  *     between the original source text and the one with the\n                  *     first primitive value consolidated, and</li>\n                  * <li>the difference in the number of terminal symbols\n                  *     between the original source text and the one with the\n                  *     second primitive value consolidated.</li>\n                  * </ol>\n                  * @type {number}\n                  */\n                 var nDifference =\n                     oSolutionCandidate.oPrimitiveValues[sPrefixed0].nSaving -\n                     oSolutionCandidate.oPrimitiveValues[sPrefixed1].nSaving;\n\n                 return nDifference > 0 ? -1 : nDifference < 0 ? 1 : 0;\n               },\n               /**\n                * Assigns an identifier name to a primitive value and calculates\n                * whether instances of that primitive value are worth\n                * consolidating.\n                * @param {string} sPrefixed The prefixed representation String\n                *     of a primitive value that is being evaluated.\n                */\n               fEvaluatePrimitiveValue = function(sPrefixed) {\n                 var _,\n                     /**\n                      * The index of the last mangled name.\n                      * @type {number}\n                      */\n                     nIndex,\n                     /**\n                      * The representation String of the primitive value that is\n                      * being evaluated.\n                      * @type {string}\n                      */\n                     sName =\n                         sPrefixed.substring(EValuePrefixes.S_SYMBOLIC.length),\n                     /**\n                      * The number of source characters taken up by the\n                      * representation String of the primitive value that is\n                      * being evaluated.\n                      * @type {number}\n                      */\n                     nLengthOriginal = sName.length,\n                     /**\n                      * The number of source characters taken up by the\n                      * identifier name that could substitute the primitive\n                      * value that is being evaluated.\n                      * substituted.\n                      * @type {number}\n                      */\n                     nLengthSubstitution,\n                     /**\n                      * The number of source characters taken up by by the\n                      * representation String of the primitive value that is\n                      * being evaluated when it is represented by a string\n                      * literal.\n                      * @type {number}\n                      */\n                     nLengthString = oProcessor.make_string(sName).length;\n\n                 oSolutionCandidate.oPrimitiveValues[sPrefixed] =\n                     new TPrimitiveValue();\n                 do {  // Find an identifier unused in this or any nested scope.\n                   nIndex = oScope.cname;\n                   oSolutionCandidate.oPrimitiveValues[sPrefixed].sName =\n                       oScope.next_mangled();\n                 } while (-1 !== oSourceElementsData.aIdentifiers.indexOf(\n                     oSolutionCandidate.oPrimitiveValues[sPrefixed].sName));\n                 nLengthSubstitution = oSolutionCandidate.oPrimitiveValues[\n                     sPrefixed].sName.length;\n                 if (0 === sPrefixed.indexOf(EValuePrefixes.S_SYMBOLIC)) {\n                   // foo:null, or foo:null;\n                   oSolutionCandidate.oPrimitiveValues[sPrefixed].nSaving -=\n                       nLengthSubstitution + nLengthOriginal +\n                       oWeights.N_VARIABLE_DECLARATION;\n                   // null vs foo\n                   oSolutionCandidate.oPrimitiveValues[sPrefixed].nSaving +=\n                       oSourceElementsData.aCount[\n                           EPrimaryExpressionCategories.\n                               N_NULL_AND_BOOLEAN_LITERALS][sPrefixed] *\n                       (nLengthOriginal - nLengthSubstitution);\n                 } else {\n                   // foo:'fromCharCode';\n                   oSolutionCandidate.oPrimitiveValues[sPrefixed].nSaving -=\n                       nLengthSubstitution + nLengthString +\n                       oWeights.N_VARIABLE_DECLARATION;\n                   // .fromCharCode vs [foo]\n                   if (oSourceElementsData.aCount[\n                           EPrimaryExpressionCategories.N_IDENTIFIER_NAMES\n                       ].hasOwnProperty(sPrefixed)) {\n                     oSolutionCandidate.oPrimitiveValues[sPrefixed].nSaving +=\n                         oSourceElementsData.aCount[\n                             EPrimaryExpressionCategories.N_IDENTIFIER_NAMES\n                         ][sPrefixed] *\n                         (nLengthOriginal - nLengthSubstitution -\n                          oWeights.N_PROPERTY_ACCESSOR);\n                   }\n                   // 'fromCharCode' vs foo\n                   if (oSourceElementsData.aCount[\n                           EPrimaryExpressionCategories.N_STRING_LITERALS\n                       ].hasOwnProperty(sPrefixed)) {\n                     oSolutionCandidate.oPrimitiveValues[sPrefixed].nSaving +=\n                         oSourceElementsData.aCount[\n                             EPrimaryExpressionCategories.N_STRING_LITERALS\n                         ][sPrefixed] *\n                         (nLengthString - nLengthSubstitution);\n                   }\n                 }\n                 if (oSolutionCandidate.oPrimitiveValues[sPrefixed].nSaving >\n                     0) {\n                   oSolutionCandidate.nSavings +=\n                       oSolutionCandidate.oPrimitiveValues[sPrefixed].nSaving;\n                 } else {\n                   oScope.cname = nIndex; // Free the identifier name.\n                 }\n               },\n               /**\n                * Adds a variable declaration to an existing variable statement.\n                * @param {!Array} aVariableDeclaration A variable declaration\n                *     with an initialiser.\n                */\n               cAddVariableDeclaration = function(aVariableDeclaration) {\n                 (/** @type {!Array} */ oSourceElements[nFrom][1]).unshift(\n                     aVariableDeclaration);\n               };\n\n           if (nFrom > nTo) {\n             return;\n           }\n           // If the range is a closure, reuse the closure.\n           if (nFrom === nTo &&\n               'stat' === oSourceElements[nFrom][0] &&\n               'call' === oSourceElements[nFrom][1][0] &&\n               'function' === oSourceElements[nFrom][1][1][0]) {\n             fExamineSyntacticCodeUnit(oSourceElements[nFrom][1][1]);\n             return;\n           }\n           // Create a list of all derived primitive values within the range.\n           for (nPosition = nFrom; nPosition <= nTo; nPosition += 1) {\n             aSourceElementsData[nPosition].aPrimitiveValues.forEach(\n                 cAugmentList(oSourceElementsData.aPrimitiveValues));\n           }\n           if (0 === oSourceElementsData.aPrimitiveValues.length) {\n             return;\n           }\n           for (nPosition = nFrom; nPosition <= nTo; nPosition += 1) {\n             // Add the number of occurrences to the total count.\n             fAddOccurrences(nPosition);\n             // Add identifiers of this or any nested scope to the list.\n             aSourceElementsData[nPosition].aIdentifiers.forEach(\n                 cAugmentList(oSourceElementsData.aIdentifiers));\n           }\n           // Distribute identifier names among derived primitive values.\n           do {  // If there was any progress, find a better distribution.\n             oSolutionBest = oSolutionCandidate;\n             if (Object.keys(oSolutionCandidate.oPrimitiveValues).length > 0) {\n               // Sort primitive values descending by their worthwhileness.\n               oSourceElementsData.aPrimitiveValues.sort(cSortPrimitiveValues);\n             }\n             oSolutionCandidate = new TSolution();\n             oSourceElementsData.aPrimitiveValues.forEach(\n                 fEvaluatePrimitiveValue);\n             oScope.cname = nIndex;\n           } while (oSolutionCandidate.nSavings > oSolutionBest.nSavings);\n           // Take the necessity of adding a variable statement into account.\n           if ('var' !== oSourceElements[nFrom][0]) {\n             oSolutionBest.nSavings -= oWeights.N_VARIABLE_STATEMENT_AFFIXATION;\n           }\n           if (bEnclose) {\n             // Take the necessity of forming a closure into account.\n             oSolutionBest.nSavings -= oWeights.N_CLOSURE;\n           }\n           if (oSolutionBest.nSavings > 0) {\n             // Create variable declarations suitable for UglifyJS.\n             Object.keys(oSolutionBest.oPrimitiveValues).forEach(\n                 cAugmentVariableDeclarations);\n             // Rewrite expressions that contain worthwhile primitive values.\n             for (nPosition = nFrom; nPosition <= nTo; nPosition += 1) {\n               oWalker = oProcessor.ast_walker();\n               oSourceElements[nPosition] =\n                   oWalker.with_walkers(\n                       oWalkersTransformers,\n                       cContext(oWalker, oSourceElements[nPosition]));\n             }\n             if ('var' === oSourceElements[nFrom][0]) {  // Reuse the statement.\n               (/** @type {!Array.<!Array>} */ aVariableDeclarations.reverse(\n                   )).forEach(cAddVariableDeclaration);\n             } else {  // Add a variable statement.\n               Array.prototype.splice.call(\n                   oSourceElements,\n                   nFrom,\n                   0,\n                   ['var', aVariableDeclarations]);\n               nTo += 1;\n             }\n             if (bEnclose) {\n               // Add a closure.\n               Array.prototype.splice.call(\n                   oSourceElements,\n                   nFrom,\n                   0,\n                   ['stat', ['call', ['function', null, [], []], []]]);\n               // Copy source elements into the closure.\n               for (nPosition = nTo + 1; nPosition > nFrom; nPosition -= 1) {\n                 Array.prototype.unshift.call(\n                     oSourceElements[nFrom][1][1][3],\n                     oSourceElements[nPosition]);\n               }\n               // Remove source elements outside the closure.\n               Array.prototype.splice.call(\n                   oSourceElements,\n                   nFrom + 1,\n                   nTo - nFrom + 1);\n             }\n           }\n           if (bEnclose) {\n             // Restore the availability of identifier names.\n             oScope.cname = nIndex;\n           }\n         };\n\n     oSourceElements = (/** @type {!TSyntacticCodeUnit} */\n         oSyntacticCodeUnit[bIsGlobal ? 1 : 3]);\n     if (0 === oSourceElements.length) {\n       return;\n     }\n     oScope = bIsGlobal ? oSyntacticCodeUnit.scope : oSourceElements.scope;\n     // Skip a Directive Prologue.\n     while (nAfterDirectivePrologue < oSourceElements.length &&\n            'directive' === oSourceElements[nAfterDirectivePrologue][0]) {\n       nAfterDirectivePrologue += 1;\n       aSourceElementsData.push(null);\n     }\n     if (oSourceElements.length === nAfterDirectivePrologue) {\n       return;\n     }\n     for (nPosition = nAfterDirectivePrologue;\n          nPosition < oSourceElements.length;\n          nPosition += 1) {\n       oSourceElementData = new TSourceElementsData();\n       oWalker = oProcessor.ast_walker();\n       // Classify a source element.\n       // Find its derived primitive values and count their occurrences.\n       // Find all identifiers used (including nested scopes).\n       oWalker.with_walkers(\n           oWalkers.oSurveySourceElement,\n           cContext(oWalker, oSourceElements[nPosition]));\n       // Establish whether the scope is still wholly examinable.\n       bIsWhollyExaminable = bIsWhollyExaminable &&\n           ESourceElementCategories.N_WITH !== oSourceElementData.nCategory &&\n           ESourceElementCategories.N_EVAL !== oSourceElementData.nCategory;\n       aSourceElementsData.push(oSourceElementData);\n     }\n     if (bIsWhollyExaminable) {  // Examine the whole scope.\n       fExamineSourceElements(\n           nAfterDirectivePrologue,\n           oSourceElements.length - 1,\n           false);\n     } else {  // Examine unexcluded ranges of source elements.\n       for (nPosition = oSourceElements.length - 1;\n            nPosition >= nAfterDirectivePrologue;\n            nPosition -= 1) {\n         oSourceElementData = (/** @type {!TSourceElementsData} */\n             aSourceElementsData[nPosition]);\n         if (ESourceElementCategories.N_OTHER ===\n             oSourceElementData.nCategory) {\n           if ('undefined' === typeof nTo) {\n             nTo = nPosition;  // Indicate the end of a range.\n           }\n           // Examine the range if it immediately follows a Directive Prologue.\n           if (nPosition === nAfterDirectivePrologue) {\n             fExamineSourceElements(nPosition, nTo, true);\n           }\n         } else {\n           if ('undefined' !== typeof nTo) {\n             // Examine the range that immediately follows this source element.\n             fExamineSourceElements(nPosition + 1, nTo, true);\n             nTo = void 0;  // Obliterate the range.\n           }\n           // Examine nested functions.\n           oWalker = oProcessor.ast_walker();\n           oWalker.with_walkers(\n               oWalkers.oExamineFunctions,\n               cContext(oWalker, oSourceElements[nPosition]));\n         }\n       }\n     }\n   }(oAbstractSyntaxTree = oProcessor.ast_add_scope(oAbstractSyntaxTree)));\n  return oAbstractSyntaxTree;\n};\n/*jshint sub:false */\n\n/* Local Variables:      */\n/* mode: js              */\n/* coding: utf-8         */\n/* indent-tabs-mode: nil */\n/* tab-width: 2          */\n/* End:                  */\n/* vim: set ft=javascript fenc=utf-8 et ts=2 sts=2 sw=2: */\n/* :mode=javascript:noTabs=true:tabSize=2:indentSize=2:deepIndent=true: */\n\n\n//@ sourceURL=/node_modules/racer/node_modules/uglify-js/lib/consolidator.js"
));

require.define("/node_modules/racer/lib/descriptor/query/TransformBuilder.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var QueryBuilder = require('./QueryBuilder')\n  , MemoryQuery = require('./MemoryQuery')\n  , setupQueryModelScope = require('./scope')\n  , filterDomain = require('../../computed/filter').filterDomain\n  ;\n\nmodule.exports = TransformBuilder;\n\nfunction TransformBuilder (model, source) {\n  QueryBuilder.call(this);\n  this._model = model;\n  this.from(source);\n}\n\nvar fromJson = QueryBuilder._createFromJsonFn(TransformBuilder);\nTransformBuilder.fromJson = function (model, source) {\n  var builder = fromJson(source);\n  builder._model = model;\n  return builder;\n};\n\nvar proto = TransformBuilder.prototype = new QueryBuilder();\n\nproto.filter = function (filterSpec) {\n  var filterFn;\n  if (typeof filterSpec === 'function') {\n    this.filterFn = filterSpec;\n  } else if (filterSpec.constructor == Object) {\n    this.query(filterSpec);\n  }\n  return this;\n};\n\nvar __sort__ = proto.sort;\nproto.sort = function (sortSpec) {\n  if (typeof sortSpec === 'function') {\n    this._comparator = sortSpec;\n    return this;\n  }\n  // else sortSpec === ['fieldA', 'asc', 'fieldB', 'desc', ...]\n  return __sort__.call(this, sortSpec);\n};\n\n/**\n * Registers, executes, and sets up listeners for a model query, the first time\n * this is called. Subsequent calls just return the cached scoped model\n * representing the filter result.\n *\n * @return {Model} a scoped model scoped to a refList\n * @api public\n */\nproto.get = function () {\n  var scopedModel = this.scopedModel ||\n                   (this.scopedModel = this._genScopedModel());\n  return scopedModel.get();\n};\n\nproto.path = function () {\n  var scopedModel = this.scopedModel ||\n                   (this.scopedModel = this._genScopedModel());\n  return scopedModel.path();\n};\n\nproto._genScopedModel = function () {\n  // Lazy-assign default query type of 'find'\n  if (!this.type) this.type = 'find';\n\n  // syncRun is also called by the Query Model Scope on dependency changes\n  var model = this._model\n    , domain = model.get(this.ns)\n    , filterFn = this.filterFn;\n  if (filterFn) domain = filterDomain(domain, filterFn);\n\n  // TODO Register the transform, so it can be cleaned up when we no longer\n  // need it\n\n  var queryJson = this.toJSON()\n    , memoryQuery = this.memoryQuery = new MemoryQuery(queryJson, filterFn)\n    , comparator = this._comparator;\n  if (comparator) memoryQuery.sort(comparator);\n  var result = memoryQuery.syncRun(domain);\n  var queryId = QueryBuilder.hash(queryJson, filterFn);\n  return setupQueryModelScope(model, memoryQuery, queryId, result);\n};\n\n// proto.filterTest = function (doc, ns) {\n//   if (ns !== this.ns) return false;\n//   var filterFn = this.filterFn;\n//   if (filterFn && ! filterFn(doc)) return false;\n//   return this.memoryQuery.filterTest(doc, ns);\n// };\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/query/TransformBuilder.js"
));

require.define("/node_modules/racer/lib/descriptor/query/QueryBuilder.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = QueryBuilder;\n\nvar reserved = {\n    equals: 1\n  , notEquals: 1\n  , gt: 1\n  , gte: 1\n  , lt: 1\n  , lte: 1\n  , within: 1\n  , contains: 1\n  , exists: 1\n};\n\nvar validQueryParams = {\n    from: 1\n  , byId: 1\n  , where: 1\n  , skip: 1\n  , limit: 1\n  , sort: 1\n  , except: 1\n  , only: 1\n};\n\n// QueryBuilder constructor\n// @param {Object} params looks like:\n//   {\n//     from: 'someNamespace'\n//   , where: {\n//       name: 'Gnarls'\n//     , gender: { notEquals: 'female' }\n//     , age: { gt: 21, lte: 30 }\n//     , tags: { contains: ['super', 'derby'] }\n//     , shoe: { within: ['nike', 'adidas'] }\n//     }\n//   , sort: ['fieldA', 'asc', 'fieldB', 'desc']\n//   , skip: 10\n//   , limit: 5\n//   }\nfunction QueryBuilder (params) {\n  this._json = {};\n\n  if (params) this.query(params);\n}\n\nfunction keyMatch (obj, fn) {\n  for (var k in obj) {\n    if (fn(k)) return true;\n  }\n  return false;\n}\n\nfunction isReserved (key) { return key in reserved; }\n\nvar proto = QueryBuilder.prototype = {\n    from: function (from) {\n      this.ns = from;\n      this._json.from = from;\n      return this;\n    }\n  , byId: function (id) {\n      this._json.byId = id;\n      return this;\n    }\n  , where: function (param) {\n      if (typeof param === 'string') {\n        this._currField = param;\n        return this;\n      }\n\n      if (param.constructor !== Object) {\n        console.error(param);\n        throw new Error(\"Invalid `where` param\");\n      }\n\n      for (var fieldName in param) {\n        this._currField = fieldName;\n        var arg = param[fieldName]\n        if (arg.constructor !== Object) {\n          this.equals(arg);\n        } else if (keyMatch(arg, isReserved)) {\n          for (var comparator in arg) {\n            this[comparator](arg[comparator]);\n          }\n        } else {\n          this.equals(arg);\n        }\n      }\n    }\n  , toJSON: function () {\n      var json = this._json;\n      if (this.type && !json.type) json.type = this.type;\n      return json;\n    }\n\n    /**\n     * Entry-point for more coffee-script style query building.\n     *\n     * @param {Object} params representing additional query method calls\n     * @return {QueryBuilder} this for chaining\n     */\n  , query: function (params) {\n      for (var k in params) {\n        if (! (k in validQueryParams)) { throw new Error(\"Un-identified operator '\" + k + \"'\");\n        }\n        this[k](params[k]);\n      }\n      return this;\n    }\n};\n\nQueryBuilder._createFromJsonFn = function (QueryBuilderKlass) {\n  return function (json) {\n    var q = new QueryBuilderKlass;\n    for (var param in json) {\n      switch (param) {\n        case 'type':\n          QueryBuilder.prototype[json[param]].call(q);\n          break;\n        case 'from':\n        case 'byId':\n        case 'sort':\n        case 'skip':\n        case 'limit':\n          q[param](json[param]);\n          break;\n        case 'only':\n        case 'except':\n          q[param](json[param]);\n          break;\n        case 'equals':\n        case 'notEquals':\n        case 'gt':\n        case 'gte':\n        case 'lt':\n        case 'lte':\n        case 'within':\n        case 'contains':\n        case 'exists':\n          var fields = json[param];\n          for (var field in fields) {\n            q.where(field)[param](fields[field]);\n          }\n          break;\n        default:\n          throw new Error(\"Un-identified Query json property '\" + param + \"'\");\n      }\n    }\n    return q;\n  }\n};\n\nQueryBuilder.fromJson = QueryBuilder._createFromJsonFn(QueryBuilder);\n\n// We use ABBREVS for query hashing, so our hashes are more compressed.\nvar ABBREVS = {\n        equals: '$eq'\n      , notEquals: '$ne'\n      , gt: '$gt'\n      , gte: '$gte'\n      , lt: '$lt'\n      , lte: '$lte'\n      , within: '$w'\n      , contains: '$c'\n      , exists: '$x'\n\n      , byId: '$id'\n\n      , only: '$o'\n      , except: '$e'\n      , sort: '$s'\n      , asc: '^'\n      , desc: 'v'\n      , skip: '$sk'\n      , limit: '$L'\n    }\n  , SEP = ':';\n\nfunction noDots (path) {\n  return path.replace(/\\./g, '$DOT$');\n}\n\n// TODO Close ABBREVS with reverse ABBREVS?\nQueryBuilder.hash = function (json, filterFn) {\n  var groups = []\n    , typeHash\n    , nsHash\n    , byIdHash\n    , selectHash\n    , sortHash\n    , skipHash\n    , limitHash\n    , group\n    , fields, field;\n\n  for (var method in json) {\n    var val = json[method];\n    switch (method) {\n      case 'type':\n        typeHash = json[method];\n        break;\n      case 'from':\n        nsHash = noDots(val);\n        break;\n      case 'byId':\n        byIdHash = ABBREVS.byId + SEP + JSON.stringify(val);\n        break;\n      case 'only':\n      case 'except':\n        selectHash = ABBREVS[method];\n        for (var i = 0, l = val.length; i < l; i++) {\n          field = val[i];\n          selectHash += SEP + noDots(field);\n        }\n        break;\n      case 'sort':\n        sortHash = ABBREVS.sort + SEP;\n        for (var i = 0, l = val.length; i < l; i+=2) {\n          field = val[i];\n          sortHash += noDots(field) + SEP + ABBREVS[val[i+1]];\n        }\n        break;\n      case 'skip':\n        skipHash = ABBREVS.skip + SEP + val;\n        break;\n      case 'limit':\n        limitHash = ABBREVS.limit + SEP + val;\n        break;\n\n      case 'where':\n        break;\n      case 'within':\n      case 'contains':\n        for (var k in val) {\n          val[k] = val[k].sort();\n        }\n        // Intentionally fall-through without a break\n      case 'equals':\n      case 'notEquals':\n      case 'gt':\n      case 'gte':\n      case 'lt':\n      case 'lte':\n      case 'exists':\n        group = [ABBREVS[method]];\n        fields = group[group.length] = [];\n        groups.push(group);\n        for (field in val) {\n          fields.push([field, JSON.stringify(val[field])]);\n        }\n        break;\n    }\n  }\n\n  var hash = nsHash + SEP + typeHash;\n  if (byIdHash)  hash += SEP + byIdHash;\n  if (sortHash)   hash += SEP + sortHash;\n  if (selectHash) hash += SEP + selectHash;\n  if (skipHash)   hash += SEP + skipHash;\n  if (limitHash)  hash += SEP + limitHash;\n\n  for (var i = groups.length; i--; ) {\n    group = groups[i];\n    group[1] = group[1].sort(comparator);\n  }\n\n  groups = groups.sort( function (groupA, groupB) {\n    var pathA = groupA[0]\n      , pathB = groupB[0];\n    if (pathA < pathB)   return -1;\n    if (pathA === pathB) return 0;\n    return 1;\n  });\n\n  for (i = 0, l = groups.length; i < l; i++) {\n    group = groups[i];\n    hash += SEP + SEP + group[0];\n    fields = group[1];\n    for (var j = 0, m = fields.length; j < m; j++) {\n      var pair = fields[j]\n        , field = pair[0]\n        , val   = pair[1];\n      hash += SEP + noDots(field) + SEP + val;\n    }\n  }\n\n  if (filterFn) {\n    // TODO: Do a less ghetto hash function here\n    hash += SEP + 'filterFn' + SEP +\n      filterFn.toString().replace(/[\\s(){},.]/g, function(match) {\n        return match.charCodeAt(0);\n      });\n  }\n\n  return hash;\n};\n\nproto.hash = function hash () {\n  return QueryBuilder.hash(this._json);\n};\n\nfunction comparator (pairA, pairB) {\n  var methodA = pairA[0], methodB = pairB[0];\n  if (methodA < methodB)   return -1;\n  if (methodA === methodB) return 0;\n  return 1;\n}\n\nproto.sort = function (params) {\n  if (arguments.length > 1) {\n    params = Array.prototype.slice.call(arguments);\n  }\n  this._json.sort = params;\n  return this;\n};\n\nvar methods = [\n    'skip'\n  , 'limit'\n];\n\nmethods.forEach( function (method) {\n  proto[method] = function (arg) {\n    this._json[method] = arg;\n    return this;\n  }\n});\n\nmethods = ['only', 'except'];\n\nmethods.forEach( function (method) {\n  proto[method] = function (paths) {\n    if (arguments.length > 1 || ! Array.isArray(arguments[0])) {\n      paths = Array.prototype.slice.call(arguments);\n    }\n    var json = this._json\n      , fields = json[method] || (json[method] = {});\n    if (Array.isArray(paths)) {\n      for (var i = paths.length; i--; ) {\n        fields[paths[i]] = 1;\n      }\n    } else if (paths.constructor === Object) {\n      merge(fields, paths);\n    } else {\n      console.error(paths);\n      throw new Error('Un-supported paths format');\n    }\n    return this;\n  }\n});\n\nmethods = [\n    'equals'\n  , 'notEquals'\n  , 'gt', 'gte', 'lt', 'lte'\n  , 'within', 'contains'\n];\n\nmethods.forEach( function (method) {\n  // Each method `equals`, `notEquals`, etc. just populates a `json` property\n  // that is a JSON representation of the query that can be passed around\n  proto[method] = function (val) {\n    var json = this._json\n      , cond = json[method] || (json[method] = {});\n    cond[this._currField] = val;\n    return this;\n  };\n});\n\nproto.exists = function (val) {\n  var json = this._json\n    , cond = json.exists || (json.exists = {});\n  cond[this._currField] = (!arguments.length)\n                        ? true // exists() is shorthand for exists(true)\n                        : val;\n  return this;\n};\n\nvar queryTypes = require('./types')\n  , registerType = require('./types/register');\nfor (var t in queryTypes) {\n  registerType(QueryBuilder, t, queryTypes[t]);\n}\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/query/QueryBuilder.js"
));

require.define("/node_modules/racer/lib/descriptor/query/types/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"exports = module.exports = {\n  findOne: require('./findOne')\n, one: require('./findOne')\n, find: require('./find')\n, count: require('./count')\n};\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/query/types/index.js"
));

require.define("/node_modules/racer/lib/descriptor/query/types/findOne.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var sortUtils = require('../../../computed/sort')\n  , sortDomain = sortUtils.sortDomain\n  , projectDomain = require('../../../computed/project').projectDomain\n  , sliceDomain = require('../../../computed/range').sliceDomain\n  , PRIVATE_COLLECTION = require('./constants').PRIVATE_COLLECTION\n  ;\n\nexports.exec = function (matches, memoryQuery) {\n  // Query results should always be a list. sort co-erces the results into a\n  // list even if comparator is not present.\n  matches = sortDomain(matches, memoryQuery._comparator);\n\n  // Handle skip/limit for pagination\n  var skip = memoryQuery._skip\n    , limit = memoryQuery._limit;\n  if (typeof limit !== 'undefined') {\n    matches = sliceDomain(matches, skip, limit);\n  }\n\n  // Truncate to limit the work of the subsequent field projections step.\n  matches = [matches[0]];\n\n  // Selectively return the documents with a subset of fields based on\n  // `except` or `only`\n  var only = memoryQuery._only\n    , except = memoryQuery._except;\n  if (only || except) {\n    matches = projectDomain(matches, only || except, !!except);\n  }\n\n  return matches[0];\n};\n\nexports.assignInitialResult = function (model, queryId, initialResult) {\n  if (!initialResult) return;\n  model.set(getPointerPath(queryId), initialResult.id);\n};\n\nexports.createScopedModel = function (model, memoryQuery, queryId) {\n  var ns = memoryQuery.ns\n  return model.ref(refPath(queryId), ns, getPointerPath(queryId));\n};\n\nfunction refPath (queryId) {\n  return PRIVATE_COLLECTION + '.' + queryId + '.result';\n}\n\nfunction getPointerPath (queryId) {\n  return PRIVATE_COLLECTION + '.' + queryId + '.resultId';\n}\n\n// In this case, docs is the same as searchSpace.\nexports.onOverwriteNs = function (docs, findOneQuery, model) {\n  var queryId = findOneQuery.id\n    , findQuery = equivFindQuery(findOneQuery);\n  docs = findQuery.syncRun(docs);\n  model.set(getPointerPath(queryId), docs[0].id);\n};\n\nexports.onRemoveNs = function (docs, findOneQuery, model) {\n  var queryId = findOneQuery.id;\n  model.del(getPointerPath(queryId));\n};\n\n// TODO Think through this logic more\nexports.onAddDoc = function (newDoc, oldDoc, findOneQuery, model, searchSpace, currResult) {\n  var ns = findOneQuery.ns\n    , doesBelong = findOneQuery.filterTest(newDoc, ns);\n  if (! doesBelong) return;\n  var pointerPath = getPointerPath(findOneQuery.id);\n  if (currResult) {\n    var list = [currResult, newDoc];\n    if (list.length === 2) {\n      var comparator = findOneQuery._comparator;\n      list = list.sort(comparator);\n      model.set(pointerPath, list[0].id);\n    }\n  } else {\n    model.set(pointerPath, newDoc.id);\n  }\n};\n\nexports.onInsertDocs = function (newDocs, findOneQuery, model, searchSpace, currResult) {\n  var list = (currResult) ? [currResult].concat(newDocs) : newDocs\n    , comparator = findOneQuery._comparator\n    ;\n  list = list.sort(comparator);\n  var pointerPath = getPointerPath(findOneQuery.id);\n  model.set(pointerPath, list[0].id);\n};\n\nexports.onRmDoc = function (oldDoc, findOneQuery, model, searchSpace, currResult) {\n  if (oldDoc.id === (currResult && currResult.id)) {\n    var findQuery = equivFindQuery(findOneQuery)\n      , results = equivFindQuery.syncRun(searchSpace);\n    if (!results.length) return;\n    var pointerPath = getPointerPath(findOneQuery.id);\n    model.set(pointerPath, results[0].id);\n  }\n};\n\nexports.onUpdateDocProperty = function (doc, memoryQuery, model, searchSpace, currResult) {\n  var ns = memoryQuery.ns\n    , pointerPath = getPointerPath(memoryQuery.id);\n\n  if (!memoryQuery.filterTest(doc, ns)) {\n    if ((currResult && currResult.id) !== doc.id) return;\n    var results = equivFindQuery(memoryQuery).syncRun(searchSpace)\n    if (results.length) {\n      return model.set(pointerPath, results[0].id);\n    }\n    return model.set(pointerPath, null);\n  }\n  var comparator = memoryQuery._comparator;\n  if (!comparator) {\n    return model.set(pointerPath, doc.id);\n  }\n  if (comparator(doc, currResult) < 0) {\n    model.set(pointerPath, doc.id);\n  }\n};\n\nfunction equivFindQuery (findOneQuery) {\n  var MemoryQuery = findOneQuery.constructor;\n  return new MemoryQuery(Object.create(findOneQuery.toJSON(), {\n    type: { value: 'find' }\n  }));\n}\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/query/types/findOne.js"
));

require.define("/node_modules/racer/lib/computed/sort.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var lookup = require('../path').lookup\n  , specIdentifier = require('../util/speculative').identifier\n\nmodule.exports = {\n  sortDomain: sortDomain\n, deriveComparator: deriveComparator\n};\n\nfunction sortDomain (domain, comparator) {\n  if (! Array.isArray(domain)) {\n    var list = [];\n    for (var k in domain) {\n      if (k === specIdentifier) continue;\n      list.push(domain[k]);\n    }\n    domain = list;\n  }\n  if (!comparator) return domain;\n  return domain.sort(comparator);\n}\n\n// TODO Do the functions below need to belong here?\n\n/**\n * Generates a comparator function that returns -1, 0, or 1\n * if a < b, a == b, or a > b respectively, according to the ordering criteria\n * defined by sortParams\n * , e.g., sortParams = ['field1', 'asc', 'field2', 'desc']\n */\nfunction deriveComparator (sortList) {\n  return function comparator (a, b, sortParams) {\n    sortParams || (sortParams = sortList);\n    var dir, path, factor, aVal, bVal\n      , aIsIncomparable, bIsIncomparable;\n    for (var i = 0, l = sortParams.length; i < l; i+=2) {\n      var dir = sortParams[i+1];\n      switch (dir) {\n        case 'asc' : factor =  1; break;\n        case 'desc': factor = -1; break;\n        default: throw new Error('Must be \"asc\" or \"desc\"');\n      }\n      path = sortParams[i];\n      aVal = lookup(path, a);\n      bVal = lookup(path, b);\n\n      // Handle undefined, null, or in-comparable aVal and/or bVal.\n      aIsIncomparable = isIncomparable(aVal)\n      bIsIncomparable = isIncomparable(bVal);\n\n      // Incomparables always come last.\n      if ( aIsIncomparable && !bIsIncomparable) return factor;\n      // Incomparables always come last, even in reverse order.\n      if (!aIsIncomparable &&  bIsIncomparable) return -factor;\n\n      // Tie-break 2 incomparable fields by comparing more downstream ones\n      if ( aIsIncomparable &&  bIsIncomparable) continue;\n\n      // Handle comparable field values\n      if      (aVal < bVal) return -factor;\n      else if (aVal > bVal) return factor;\n\n      // Otherwise, the field values for both docs so far are equivalent\n    }\n    return 0;\n  };\n}\n\nfunction isIncomparable (x) {\n  return (typeof x === 'undefined') || x === null;\n}\n\n\n//@ sourceURL=/node_modules/racer/lib/computed/sort.js"
));

require.define("/node_modules/racer/lib/computed/project.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var path = require('../path')\n  , objectWithOnly = path.objectWithOnly\n  , objectExcept = path.objectExcept\n  , specIdentifier = require('../util/speculative').identifier\n\nexports.projectDomain = projectDomain;\n\nfunction projectDomain (domain, fields, isExcept) {\n  fields = Object.keys(fields);\n  var projectObject = isExcept\n                    ? objectExcept\n                    : objectWithOnly;\n  if (Array.isArray(domain)) {\n    return domain.map( function (doc) {\n      return projectObject(doc, fields);\n    });\n  }\n\n  var out = {};\n  for (var k in domain) {\n    if (k === specIdentifier) continue;\n    out[k] = projectObject(domain[k], fields);\n  }\n  return out;\n}\n\n//@ sourceURL=/node_modules/racer/lib/computed/project.js"
));

require.define("/node_modules/racer/lib/computed/range.js",Function(['require','module','exports','__dirname','__filename','process','global'],"exports.sliceDomain = sliceDomain;\n\nfunction sliceDomain (list, skip, limit) {\n  if (typeof skip === 'undefined') skip = 0;\n  return list.slice(skip, skip + limit);\n}\n\n//@ sourceURL=/node_modules/racer/lib/computed/range.js"
));

require.define("/node_modules/racer/lib/descriptor/query/types/constants.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  PRIVATE_COLLECTION: '_$queries'\n};\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/query/types/constants.js"
));

require.define("/node_modules/racer/lib/descriptor/query/types/find.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var sortUtils = require('../../../computed/sort')\n  , sortDomain = sortUtils.sortDomain\n  , projectDomain = require('../../../computed/project').projectDomain\n  , sliceDomain = require('../../../computed/range').sliceDomain\n  , PRIVATE_COLLECTION = require('./constants').PRIVATE_COLLECTION\n  , indexOf = require('../../../util').indexOf\n  ;\n\nexports.exec = function (matches, memoryQuery) {\n  // Query results should always be a list. sort co-erces the results into a\n  // list even if comparator is not present.\n  matches = sortDomain(matches, memoryQuery._comparator);\n\n  // Handle skip/limit for pagination\n  var skip = memoryQuery._skip\n    , limit = memoryQuery._limit;\n  if (typeof limit !== 'undefined') {\n    matches = sliceDomain(matches, skip, limit);\n  }\n\n  // Selectively return the documents with a subset of fields based on\n  // `except` or `only`\n  var only = memoryQuery._only\n    , except = memoryQuery._except;\n  if (only || except) {\n    matches = projectDomain(matches, only || except, !!except);\n  }\n\n  return matches;\n};\n\nexports.assignInitialResult = function (model, queryId, initialResult) {\n  if (!initialResult) return model.set(getPointerPath(queryId), []);\n  var ids = [];\n  for (var i = 0, l = initialResult.length; i < l; i++) {\n    ids.push(initialResult[i].id);\n  }\n  model.set(getPointerPath(queryId), ids);\n};\n\nexports.createScopedModel = function (model, memoryQuery, queryId, initialResult) {\n  var ns = memoryQuery.ns;\n  return model.refList(refPath(queryId), ns, getPointerPath(queryId));\n};\n\nfunction refPath (queryId) {\n  return PRIVATE_COLLECTION + '.' + queryId + '.results';\n}\n\nfunction getPointerPath (queryId) {\n  return PRIVATE_COLLECTION + '.' + queryId + '.resultIds'\n}\n\n// All of these callbacks are semantically relative to our search\n// space. Hence, onAddDoc means a listener for the event when a\n// document is added to the search space to query.\n\n// In this case, docs is the same as searchSpace.\nexports.onOverwriteNs = function (docs, findQuery, model) {\n  var docs = findQuery.syncRun(docs)\n    , queryId = findQuery.id\n  model.set(getPointerPath(queryId), docs);\n};\n\nexports.onRemoveNs = function (model, findQuery, model) {\n  var queryId = findQuery.id;\n  model.set(getPointerPath(queryId), []);\n};\n\nexports.onReplaceDoc = function (newDoc, oldDoc) {\n  return onUpdateDocProperty(newDoc);\n}\n\nexports.onAddDoc = function (newDoc, oldDoc, memoryQuery, model, searchSpace, currResult) {\n  var ns = memoryQuery.ns\n    , doesBelong = memoryQuery.filterTest(newDoc, ns)\n    ;\n  if (! doesBelong) return;\n\n  var pointerPath = getPointerPath(memoryQuery.id)\n    , pointers = model.get(pointerPath)\n    , alreadyAResult = (pointers && (-1 !== pointers.indexOf(newDoc.id)));\n  if (alreadyAResult) return;\n\n  if (memoryQuery.isPaginated && currResult.length === memoryQuery._limit) {\n    // TODO Re-do this hack later\n    return;\n  }\n  insertDocAsPointer(memoryQuery._comparator, model, pointerPath, currResult, newDoc);\n};\n\nexports.onInsertDocs = function (newDocs, memoryQuery, model, searchSpace, currResult) {\n  for (var i = 0, l = newDocs.length; i < l; i++) {\n    this.onAddDoc(newDocs[i], null, memoryQuery, model, searchSpace, currResult);\n  }\n};\n\nexports.onRmDoc = function (oldDoc, memoryQuery, model) {\n  // If the doc is no longer in our data, but our results have a reference to\n  // it, then remove the reference to the doc.\n  if (!oldDoc) return;\n  var queryId = memoryQuery.id\n    , pointerPath = getPointerPath(queryId)\n  var pos = model.get(pointerPath).indexOf(oldDoc.id);\n  if (~pos) model.remove(pointerPath, pos, 1);\n};\n\nexports.onUpdateDocProperty = function (doc, memoryQuery, model, searchSpace, currResult) {\n  var id = doc.id\n    , ns = memoryQuery.ns\n    , queryId = memoryQuery.id\n    , pointerPath = getPointerPath(queryId)\n    , currPointers = model.get(pointerPath) || []\n    , pos = currPointers.indexOf(id);\n\n  // If the updated doc belongs in our query results...\n  if (memoryQuery.filterTest(doc, ns)) {\n    // ...and it is already recorded in our query result.\n    if (~pos) {\n      // Then, figure out if we need to re-order our results\n      var resortedResults = currResult.sort(memoryQuery._comparator)\n        , newPos = indexOf(resortedResults, id, equivId);\n      if (pos === newPos) return;\n      return model.move(pointerPath, pos, newPos, 1);\n    }\n\n    // ...or it is not recorded in our query result\n    if (memoryQuery.isPaginated && currResult.length === memoryQuery._limit) {\n      // TODO Re-do this hack later\n      return;\n    }\n    return insertDocAsPointer(memoryQuery._comparator, model, pointerPath, currResult, doc);\n  }\n\n  // Otherwise, if the doc does not belong in our query results, but\n  // it did belong to our query results prior to mutation...\n  if (~pos) model.remove(pointerPath, pos, 1);\n};\n\nexports.resultDefault = [];\n\n/**\n * @param {Function} comparator is the sort comparator function of the query\n * @param {Model} model is the racer model\n * @param {String} pointerPath is the path where the list of pointers (i.e.,\n * document ids) to documents resides\n * @param {[Object]} currResults is the array of documents representing the\n * results as cached prior to the mutation.\n * @param {Object} doc is the document we want to insert into our query results\n */\nfunction insertDocAsPointer (comparator, model, pointerPath, currResults, doc) {\n  if (!comparator) {\n    var lastResult = currResults[currResults.length-1];\n    if (lastResult && lastResult.id === doc.id) return;\n    var out = model.insert(pointerPath, currResults.length, doc.id);\n    return out;\n  }\n  for (var k = currResults.length; k--; ) {\n    var currRes = currResults[k]\n      , comparison = comparator(doc, currRes);\n    if (comparison >= 0) {\n      if (doc.id === currRes.id) return;\n      return model.insert(pointerPath, k+1, doc.id);\n    }\n  }\n  return model.insert(pointerPath, 0, doc.id);\n}\n\nfunction equivId (id, doc) {\n  return doc && doc.id === id;\n}\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/query/types/find.js"
));

require.define("/node_modules/racer/lib/descriptor/query/types/count.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var PRIVATE_COLLECTION = require('./constants').PRIVATE_COLLECTION\nexports.exec = function (matches, memoryQuery) {\n  if (Array.isArray(matches)) {\n    return matches.length\n  }\n  return Object.keys(matches).length;\n};\n\nexports.assignInitialResult = function (model, queryId, initialResult) {\n  model.set(getResultPath(queryId), initialResult || 0);\n};\n\nexports.createScopedModel = function (model, memoryQuery, queryId) {\n  var ns = memoryQuery.ns\n  return model.at(getResultPath(queryId));\n};\n\nfunction getResultPath (queryId) {\n  return PRIVATE_COLLECTION + '.' + queryId + '.count';\n}\n\nexports.onOverwriteNs = function (docs, countQuery, model) {\n  return; // TODO Figure out how best to handle count later\n\n  var queryId = findOneQuery.id\n    , count = countQuery.syncRun(docs);\n  model.set(getResultPath(queryId), count);\n};\n\nexports.onRemoveNs = function (docs, countQuery, model) {\n  model.set(getResultPath(countQuery.id), 0);\n};\n\nexports.onAddDoc = function (newDoc, oldDoc, countQuery, model, searchSpace, currResult) {\n  return; // TODO Figure out how best to handle count later\n\n  var ns = countQuery.ns\n    , doesBelong = countQuery.filterTest(newDoc, ns);\n  if (! doesBelong) return;\n  var resultPath = getResultPath(countQuery.id);\n  console.log(currResult)\n  model.set(resultPath, (currResult || 0) + 1);\n};\n\nexports.onInsertDocs = function (newDocs, countQuery, model, searchSpace, currResult) {\n  return; // TODO Figure out how best to handle count later\n\n  model.set(pointerPath, currResult + newDocs.length);\n};\n\nexports.onRmDoc = function (oldDoc, countQuery, model, searchSpace, currResult) {\n  return; // TODO Figure out how best to handle count later\n\n  var ns = countQuery.ns\n    , doesBelong = countQuery.filterTest(oldDoc, ns);\n  if (! doesBelong) return;\n  var resultPath = getResultPath(countQuery.id);\n  model.set(resultPath, currResult - 1);\n};\n\nexports.onUpdateDocProperty = function (doc, countQuery, model, searchSpace, currResult) {\n  return; // TODO Figure out how best to handle count later\n  var resultPath = getResultPath(countQuery.id)\n    , count = countQuery.syncRun(searchSpace);\n  model.set(resultPath, count);\n};\n\nexports.resultDefault = 0;\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/query/types/count.js"
));

require.define("/node_modules/racer/lib/descriptor/query/types/register.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = function register (Klass, typeName, conf) {\n  var proto = Klass.prototype\n    , types = proto._types = proto._types || {};\n  types[typeName] = conf;\n\n  proto.getType = function (name) {\n    return this._types[name || 'find'];\n  };\n\n  proto[typeName] = function () {\n    this._json.type = this.type = typeName;\n    return this;\n  };\n};\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/query/types/register.js"
));

require.define("/node_modules/racer/lib/descriptor/query/MemoryQuery.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// TODO JSDoc\nvar filterUtils = require('../../computed/filter')\n  , filterFnFromQuery = filterUtils.filterFnFromQuery\n  , filterDomain = filterUtils.filterDomain\n  , sortUtils = require('../../computed/sort')\n  , deriveComparator = sortUtils.deriveComparator\n  , util = require('../../util')\n  , Promise = util.Promise\n  , merge = util.merge\n  , objectExcept = require('../../path').objectExcept\n  ;\n\nmodule.exports = MemoryQuery;\n\n/**\n * MemoryQuery instances are used:\n * - On the server when DbMemory database adapter is used\n * - On QueryNodes stored inside a QueryHub to figure out which transactions\n *   trigger query result changes to publish to listeners.\n * - Inside the browser for filters\n *\n * @param {Object} json representing a query that is typically created via\n * convenient QueryBuilder instances. See QueryBuilder.js for more details.\n */\nfunction MemoryQuery (json, filterFn) {\n  this.ns = json.from;\n  this._json = json;\n  var filteredJson = objectExcept(json, ['only', 'except', 'limit', 'skip', 'sort', 'type']);\n  this._filter = filterFn || filterFnFromQuery(filteredJson);\n  for (var k in json) {\n    if (k === 'type') {\n      // json[k] can be: 'find', 'findOne', 'count', etc.\n      this[json[k]]();\n    } else if (k in this) {\n      this[k](json[k]);\n    }\n  }\n}\n\nMemoryQuery.prototype.toJSON = function toJSON () {\n  return this._json;\n};\n\n/**\n * Specify that documents in the result set are stripped of all fields except\n * the ones specified in `paths`\n * @param {Object} paths to include. The Object maps String -> 1\n * @return {MemoryQuery} this for chaining\n * @api public\n */\nMemoryQuery.prototype.only = function only (paths) {\n  if (this._except) {\n    throw new Error(\"You can't specify both query(...).except(...) and query(...).only(...)\");\n  }\n  var only = this._only || (this._only = {id: 1});\n  merge(only, paths);\n  return this;\n};\n\n/**\n * Specify that documents in the result set are stripped of the fields\n * specified in `paths`. You aren't allowed to exclude the path \"id\"\n * @param {Object} paths to exclude. The Object maps String -> 1\n * @return {MemoryQuery} this for chaining\n * @api public\n */\nMemoryQuery.prototype.except = function except (paths) {\n  if (this._only) {\n    throw new Error(\"You can't specify both query(...).except(...) and query(...).only(...)\");\n  }\n  var except = this._except || (this._except = {});\n  if ('id' in paths) {\n    throw new Error('You cannot ignore `id`');\n  }\n  merge(except, paths);\n  return this;\n};\n\n// Specify that the result set includes no more than `lim` results\n// @param {Number} lim is the number of results to which to limit the result set\nMemoryQuery.prototype.limit = function limit (lim) {\n  this.isPaginated = true;\n  this._limit = lim;\n  return this;\n};\n\n// Specify that the result set should skip the first `howMany` results out of\n// the entire set of results that match the equivlent query without a skip or\n// limit.\nMemoryQuery.prototype.skip = function skip (howMany) {\n  this.isPaginated = true;\n  this._skip = howMany;\n  return this;\n};\n\n// e.g.,\n// sort(['field1', 'asc', 'field2', 'desc', ...])\n/**\n * mquery.sort(['field1', 'asc', 'field2', 'desc']);\n *\n * OR\n *\n * mquery.sort( function (x, y) {\n *   if (x > y) return 1;\n *   if (x < y) return -1;\n *   return 0;\n * });\n *\n * @param {Array|Function} params\n * @return {MemoryQuery}\n */\nMemoryQuery.prototype.sort = function (params) {\n  if (typeof params === 'function') {\n    this._comparator = params;\n    return this;\n  }\n  var sort = this._sort;\n  if (sort && sort.length) {\n    sort = this._sort = this._sort.concat(params);\n  } else {\n    sort = this._sort = params;\n  }\n  this._comparator = deriveComparator(sort);\n  return this;\n};\n\n\nMemoryQuery.prototype.filterTest = function filterTest (doc, ns) {\n  if (ns !== this._json.from) return false;\n  return this._filter(doc);\n};\n\nMemoryQuery.prototype.run = function (memoryAdapter, cb) {\n  var promise = (new Promise).on(cb)\n    , searchSpace = memoryAdapter._get(this._json.from)\n    , matches = this.syncRun(searchSpace);\n\n  promise.resolve(null, matches);\n\n  return promise;\n};\n\nMemoryQuery.prototype.syncRun = function (searchSpace) {\n  var matches = filterDomain(searchSpace, this._filter, this._json.from);\n  return this.getType(this.type).exec(matches, this);\n};\n\nvar queryTypes = require('./types')\n  , registerType = require('./types/register');\nfor (var t in queryTypes) {\n  registerType(MemoryQuery, t, queryTypes[t]);\n}\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/query/MemoryQuery.js"
));

require.define("/node_modules/racer/lib/computed/filter.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var lookup = require('../path').lookup\n  , transaction = require('../transaction')\n  , util = require('../util')\n  , indexOf = util.indexOf\n  , deepIndexOf = util.deepIndexOf\n  , deepEqual = util.deepEqual\n  , QueryBuilder = require('../descriptor/query/QueryBuilder')\n  , specIdentifier = require('../util/speculative').identifier\n\nmodule.exports = {\n  filterFnFromQuery: filterFnFromQuery\n, filterDomain: filterDomain\n, deriveFilterFn: deriveFilterFn\n};\n\n/**\n * Creates a filter function based on a query represented as json.\n *\n * @param {Object} json representing a query that is typically created via\n * convenient QueryBuilder instances\n *\n * json looks like:\n * {\n *    from: 'collectionName'\n *  , byId: id\n *  , equals: {\n *      somePath: someVal\n *  , }\n *  , notEquals: {\n *      somePath: someVal\n *    }\n *  , sort: ['fieldA', 'asc', 'fieldB', 'desc']\n *  }\n *\n * @return {Function} a filter function\n * @api public\n */\nfunction filterFnFromQuery (json) {\n  // Stores a list of predicate functions that take a document and return a\n  // Boolean. If all predicate functions return true, then the document passes\n  // through the filter. If not, the document is blocked by the filter\n  var predicates = []\n    , pred;\n\n  if (json) for (var method in json) {\n    if (method === 'from') continue;\n    pred = predicateBuilders[method](json[method]);\n    if (Array.isArray(pred)) predicates = predicates.concat(pred);\n    else predicates.push(pred);\n  }\n\n  return compileDocFilter(predicates);\n}\n\nvar predicateBuilders = {};\n\npredicateBuilders.byId = function byId (id) {\n  return function (doc) { return doc.id === id; };\n};\n\nvar fieldPredicates = {\n    equals: function (fieldName, val, doc) {\n      var currVal = lookup(fieldName, doc);\n      if (typeof currVal === 'object') {\n        return deepEqual(currVal, val);\n      }\n      return currVal === val;\n    }\n  , notEquals: function (fieldName, val, doc) {\n      var currVal = lookup(fieldName, doc);\n      if (typeof currVal === 'object') {\n        return ! deepEqual(currVal, val);\n      }\n      return currVal !== val;\n    }\n  , gt: function (fieldName, val, doc) {\n      return lookup(fieldName, doc) > val;\n    }\n  , gte: function (fieldName, val, doc) {\n      return lookup(fieldName, doc) >= val;\n    }\n  , lt: function (fieldName, val, doc) {\n      return lookup(fieldName, doc) < val;\n    }\n  , lte: function (fieldName, val, doc) {\n      return lookup(fieldName, doc) <= val;\n    }\n  , within: function (fieldName, list, doc) {\n      if (!list.length) return false;\n      var x = lookup(fieldName, doc);\n      if (x && x.constructor === Object) return ~deepIndexOf(list, x);\n      return ~list.indexOf(x);\n    }\n  , contains: function (fieldName, list, doc) {\n      var docList = lookup(fieldName, doc);\n      if (typeof docList === 'undefined') {\n        if (list.length) return false;\n        return true; // contains nothing\n      }\n      for (var x, i = list.length; i--; ) {\n        x = list[i];\n        if (x.constructor === Object) {\n          if (-1 === deepIndexOf(docList, x)) return false;\n        } else {\n          if (-1 === docList.indexOf(x)) return false;\n        }\n      }\n      return true;\n    }\n  , exists: function (fieldName, shouldExist, doc) {\n      var val = lookup(fieldName, doc)\n        , doesExist = (typeof val !== 'undefined');\n      return doesExist === shouldExist;\n    }\n};\n\nfor (var queryKey in fieldPredicates) {\n  predicateBuilders[queryKey] = (function (fieldPred) {\n    return function (params) {\n      return createDocPredicates(params, fieldPred);\n    };\n  })(fieldPredicates[queryKey]);\n}\n\nfunction createDocPredicates (params, fieldPredicate) {\n  var predicates = []\n    , docPred;\n  for (var fieldName in params) {\n    docPred = fieldPredicate.bind(undefined, fieldName, params[fieldName]);\n    predicates.push(docPred);\n  }\n  return predicates;\n};\n\nfunction compileDocFilter (predicates) {\n  switch (predicates.length) {\n    case 0: return evalToTrue;\n    case 1: return predicates[0];\n  }\n  return function test (doc) {\n    if (typeof doc === 'undefined') return false;\n    for (var i = 0, l = predicates.length; i < l; i++) {\n      if (! predicates[i](doc)) return false;\n    }\n    return true;\n  };\n}\n\n/**\n * @api private\n */\nfunction evalToTrue () { return true; }\n\n/**\n * Returns the set of docs from searchSpace that pass filterFn.\n *\n * @param {Object|Array} searchSpace\n * @param {Function} filterFn\n * @param {String} ns\n * @return {Object|Array} the filtered values\n * @api public\n */\nfunction filterDomain (searchSpace, filterFn) {\n  if (Array.isArray(searchSpace)) {\n    return searchSpace.filter(filterFn);\n  }\n\n  var filtered = {};\n  for (var k in searchSpace) {\n    if (k === specIdentifier) continue;\n    var curr = searchSpace[k];\n    if (filterFn(curr)) {\n      filtered[k] = curr;\n    }\n  }\n  return filtered;\n}\n\n/**\n * Derives the filter function, based on filterSpec and source.\n *\n * @param {Function|Object} filterSpec is a representation of the filter\n * @param {String} source is the path to the data that we want to filter\n * @param {Boolean} single specifies whether to filter down to a single\n * resulting Object.\n * @return {Function} filter function\n * @api private\n */\nfunction deriveFilterFn (filterSpec, source, single) {\n  if (typeof filterSpec === 'function') {\n    var numArgs = filterSpec.length;\n    if (numArgs === 1) return filterSpec;\n    if (numArgs === 0) {\n      var queryBuilder = new QueryBuilder({from: source});\n      queryBuilder = filterSpec.call(queryBuilder);\n      if (single) queryBuilder.on();\n      var queryJson = queryBuilder.toJSON();\n      var filter = filterFnFromQuery(queryJson);\n      if (queryJson.sort) {\n        // TODO\n      }\n    }\n    throw new Error('filter spec must be either a function with 0 or 1 argument, or an Object');\n  }\n  // Otherwise, filterSpec is an Object representing query params\n  filterSpec.from = source;\n  var queryBuilder = new QueryBuilder(filterSpec);\n  if (single) queryBuilder.one();\n  return filterFnFromQuery(queryBuilder.toJSON());\n}\n\n//@ sourceURL=/node_modules/racer/lib/computed/filter.js"
));

require.define("/node_modules/racer/lib/descriptor/query/scope.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var QueryBuilder = require('./QueryBuilder')\n  , queryTypes = require('./types')\n  , pathUtils = require('../../path')\n  , isSubPathOf = pathUtils.isSubPathOf\n  , isImmediateChild = pathUtils.isImmediateChild\n  , isGrandchild = pathUtils.isGrandchild\n  , indexOf = require('../../util').indexOf\n  ;\n\nmodule.exports = setupQueryModelScope;\n\n/**\n * Given a model, query, and the query's initial result(s), this function sets\n * up and returns a scoped model that is centered on a ref or refList that\n * embodies the query result(s) and updates those result(s) whenever a relevant\n * mutation should change the query result(s).\n *\n * @param {Model} model is the racer model\n * @param {MemoryQuery} memoryQuery or a TransformBuilder that has\n * MemoryQuery's syncRun interface\n * @param {[Object]|Object} initialResult is either an array of documents or a\n * single document that represents the initial result of the query over the\n * data currently loaded into the model.\n * @return {Model} a refList or ref scoped model that represents the query result(s)\n */\nfunction setupQueryModelScope (model, memoryQuery, queryId, initialResult) {\n  var type = queryTypes[memoryQuery.type];\n\n  if (typeof initialResult !== 'undefined') {\n    type.assignInitialResult(model, queryId, initialResult);\n  }\n\n  var scopedModel = type.createScopedModel(model, memoryQuery, queryId, initialResult);\n\n  if (! model[queryId]) {\n    var listener = createMutatorListener(model, scopedModel, memoryQuery, queryId);\n    model.on('mutator', listener);\n\n    model[queryId] = listener;\n    // TODO: This is a total hack. Fix the initialization of filters in client\n    // and prevent filters from generating multiple listeners\n  }\n\n  return scopedModel;\n}\n\n/**\n * Creates a listener of the 'mutator' event, for the type (e.g., findOne) of\n * query.\n * See the JSDocDoc of the function iniside the block to see what this listener\n * does.\n *\n * @param {Model} model is the racer model\n * @param {String} ns is the query namespace that points to the set of data we\n * wish to query\n * @param {Model} scopedModel is the scoped model that is scoped to the query\n * results\n * @param {Object} queryTuple is [ns, {queryMotif: queryArgs}, queryId]\n * @return {Function} a function to be used as a listener to the \"mutator\"\n * event emitted by model\n */\nfunction createMutatorListener (model, scopedModel, memoryQuery, queryId) {\n  var ns = memoryQuery.ns;\n\n  // TODO Move this closer to MemoryQuery instantiation\n  memoryQuery.id = queryId;\n\n  /**\n   * This function will listen to the \"mutator\" event emitted by the model. The\n   * purpose of listening for \"mutator\" here is to respond to changes to the\n   * set of documents that the relevant query scans over to derive its search\n   * results. Hence, the mutations it listens for are mutations on its search\n   * domain, where that domain can be an Object of documents or an Array of documents.\n   *\n   * Fires callbacks by analyzing how model[method](_arguments...) has affected a\n   * query searching over the Tree or Array of documents pointed to by ns.\n   *\n   * @param {String} method name\n   * @param {Arguments} _arguments are the arguments for a given \"mutator\" event listener.\n   * The arguments have the signature [[path, restOfMutationArgs...], out, isLocal, pass]\n   */\n\n  return function (method, _arguments) {\n    var args = _arguments[0]\n      , out = _arguments[1]\n      , path = args[0]\n\n        // The documents this query searches over, either as an Array or Object of\n        // documents. This set of documents reflects that the mutation has already\n        // taken place.\n      , searchSpace = model.get(ns)\n      , queryType = queryTypes[memoryQuery.type]\n      , currResult = scopedModel.get()\n      ;\n\n    if (currResult == null) currResult = queryType.resultDefault;\n\n    // Ignore irrelevant paths. Because any mutation on any object causes model\n    // to fire a \"mutator\" event, we will want to ignore most of these mutator\n    // events because our listener is only concerned about mutations that\n      // affect ns.\n    if (! isSubPathOf(ns, path) && ! isSubPathOf(path, ns)) return;\n\n//    if (isSubPathOf(path, ns)) {\n//      if (!searchSpace) return;\n//      return queryType.onOverwriteNs(searchSpace, memoryQuery, model);\n//    }\n\n    if (path === ns) {\n      if (method === 'set') {\n        return queryType.onOverwriteNs(searchSpace, memoryQuery, model);\n      }\n\n      if (method === 'del') {\n        return queryType.onRemoveNs(searchSpace, memoryQuery, model);\n      }\n\n      if (method === 'push' || method === 'insert' || method === 'unshift') {\n        var Model = model.constructor\n          , docsToAdd = args[Model.arrayMutator[method].insertArgs];\n        if (Array.isArray(docsToAdd)) {\n          docsToAdd = docsToAdd.filter( function (doc) {\n            // Ensure that the document is in the domain (it may not be if we are\n            // filtering over some query results)\n            return doesBelong(doc, searchSpace);\n          });\n          queryType.onInsertDocs(docsToAdd, memoryQuery, model, searchSpace, currResult);\n        } else {\n          var doc = docsToAdd;\n          // TODO Is this conditional if redundant? Isn't this always true?\n          if (doesBelong(doc, searchSpace)) {\n            queryType.onInsertDocs([doc], memoryQuery, model, searchSpace, currResult);\n          }\n        }\n        return;\n      }\n\n      if (method === 'pop' || method === 'shift' || method === 'remove') {\n        var docsToRm = out;\n        for (var i = 0, l = docsToRm.length; i < l; i++) {\n          queryType.onRmDoc(docsToRm[i], memoryQuery, model, searchSpace, currResult);\n        }\n        return;\n      }\n\n      // TODO Is this the right logic for move?\n      if (method === 'move') {\n        var movedIds = out\n          , onUpdateDocProperty = queryType.onUpdateDocProperty\n          , docs = model.get(path);\n          ;\n        for (var i = 0, l = movedIds.length; i < l; i++) {\n          var id = movedIds[i], doc;\n          // TODO Ugh, this is messy\n          if (Array.isArray(docs)) {\n            doc = docs[indexOf(docs, id, equivId)];\n          } else {\n            doc = docs[id];\n          }\n          onUpdateDocProperty(doc, memoryQuery, model, searchSpace, currResult);\n        }\n        return;\n      }\n      throw new Error('Uncaught edge case');\n    }\n\n    // From here on: path = ns + suffix\n\n    // The mutation can:\n    if (isImmediateChild(ns, path)) {\n      // (1) remove the document\n      if (method === 'del') {\n        return queryType.onRmDoc(out, memoryQuery, model, searchSpace, currResult);\n      }\n\n      // (2) add or over-write the document with a new version of the document\n      if (method === 'set' || method === 'setNull') {\n        var doc = args[1]\n          , belongs = doesBelong(doc, searchSpace);\n        if (! out) {\n          return queryType.onAddDoc(doc, out, memoryQuery, model, searchSpace, currResult);\n        }\n        if (doc.id === out.id) {\n          return queryType.onAddDoc(doc, out, memoryQuery, model, searchSpace, currResult);\n        }\n      }\n      throw new Error('Uncaught edge case: ' + method + ' ' + require('util').inspect(_arguments, false, null));\n    }\n\n    if (isGrandchild(ns, path)) {\n      var suffix = path.substring(ns.length + 1)\n        , separatorPos = suffix.indexOf('.')\n        , property = suffix.substring(0, ~separatorPos ? separatorPos : suffix.length)\n        , isArray = Array.isArray(searchSpace)\n        ;\n      if (isArray) property = parseInt(property, 10);\n      var doc = searchSpace && searchSpace[property];\n      if (doc) queryType.onUpdateDocProperty(doc, memoryQuery, model, searchSpace, currResult);\n    }\n  };\n}\n\nfunction doesBelong (doc, searchSpace) {\n  if (Array.isArray(searchSpace)) {\n    return indexOf(searchSpace, doc.id, equivId) !== -1;\n  }\n  return doc.id in searchSpace;\n}\n\nfunction equivId (id, doc) {\n  return doc && doc.id === id;\n}\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/query/scope.js"
));

require.define("util",Function(['require','module','exports','__dirname','__filename','process','global'],"var events = require('events');\n\nexports.print = function () {};\nexports.puts = function () {};\nexports.debug = function() {};\n\nexports.inspect = function(obj, showHidden, depth, colors) {\n  var seen = [];\n\n  var stylize = function(str, styleType) {\n    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics\n    var styles =\n        { 'bold' : [1, 22],\n          'italic' : [3, 23],\n          'underline' : [4, 24],\n          'inverse' : [7, 27],\n          'white' : [37, 39],\n          'grey' : [90, 39],\n          'black' : [30, 39],\n          'blue' : [34, 39],\n          'cyan' : [36, 39],\n          'green' : [32, 39],\n          'magenta' : [35, 39],\n          'red' : [31, 39],\n          'yellow' : [33, 39] };\n\n    var style =\n        { 'special': 'cyan',\n          'number': 'blue',\n          'boolean': 'yellow',\n          'undefined': 'grey',\n          'null': 'bold',\n          'string': 'green',\n          'date': 'magenta',\n          // \"name\": intentionally not styling\n          'regexp': 'red' }[styleType];\n\n    if (style) {\n      return '\\033[' + styles[style][0] + 'm' + str +\n             '\\033[' + styles[style][1] + 'm';\n    } else {\n      return str;\n    }\n  };\n  if (! colors) {\n    stylize = function(str, styleType) { return str; };\n  }\n\n  function format(value, recurseTimes) {\n    // Provide a hook for user-specified inspect functions.\n    // Check that value is an object with an inspect function on it\n    if (value && typeof value.inspect === 'function' &&\n        // Filter out the util module, it's inspect function is special\n        value !== exports &&\n        // Also filter out any prototype objects using the circular check.\n        !(value.constructor && value.constructor.prototype === value)) {\n      return value.inspect(recurseTimes);\n    }\n\n    // Primitive types cannot have properties\n    switch (typeof value) {\n      case 'undefined':\n        return stylize('undefined', 'undefined');\n\n      case 'string':\n        var simple = '\\'' + JSON.stringify(value).replace(/^\"|\"$/g, '')\n                                                 .replace(/'/g, \"\\\\'\")\n                                                 .replace(/\\\\\"/g, '\"') + '\\'';\n        return stylize(simple, 'string');\n\n      case 'number':\n        return stylize('' + value, 'number');\n\n      case 'boolean':\n        return stylize('' + value, 'boolean');\n    }\n    // For some reason typeof null is \"object\", so special case here.\n    if (value === null) {\n      return stylize('null', 'null');\n    }\n\n    // Look up the keys of the object.\n    var visible_keys = Object_keys(value);\n    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;\n\n    // Functions without properties can be shortcutted.\n    if (typeof value === 'function' && keys.length === 0) {\n      if (isRegExp(value)) {\n        return stylize('' + value, 'regexp');\n      } else {\n        var name = value.name ? ': ' + value.name : '';\n        return stylize('[Function' + name + ']', 'special');\n      }\n    }\n\n    // Dates without properties can be shortcutted\n    if (isDate(value) && keys.length === 0) {\n      return stylize(value.toUTCString(), 'date');\n    }\n\n    var base, type, braces;\n    // Determine the object type\n    if (isArray(value)) {\n      type = 'Array';\n      braces = ['[', ']'];\n    } else {\n      type = 'Object';\n      braces = ['{', '}'];\n    }\n\n    // Make functions say that they are functions\n    if (typeof value === 'function') {\n      var n = value.name ? ': ' + value.name : '';\n      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';\n    } else {\n      base = '';\n    }\n\n    // Make dates with properties first say the date\n    if (isDate(value)) {\n      base = ' ' + value.toUTCString();\n    }\n\n    if (keys.length === 0) {\n      return braces[0] + base + braces[1];\n    }\n\n    if (recurseTimes < 0) {\n      if (isRegExp(value)) {\n        return stylize('' + value, 'regexp');\n      } else {\n        return stylize('[Object]', 'special');\n      }\n    }\n\n    seen.push(value);\n\n    var output = keys.map(function(key) {\n      var name, str;\n      if (value.__lookupGetter__) {\n        if (value.__lookupGetter__(key)) {\n          if (value.__lookupSetter__(key)) {\n            str = stylize('[Getter/Setter]', 'special');\n          } else {\n            str = stylize('[Getter]', 'special');\n          }\n        } else {\n          if (value.__lookupSetter__(key)) {\n            str = stylize('[Setter]', 'special');\n          }\n        }\n      }\n      if (visible_keys.indexOf(key) < 0) {\n        name = '[' + key + ']';\n      }\n      if (!str) {\n        if (seen.indexOf(value[key]) < 0) {\n          if (recurseTimes === null) {\n            str = format(value[key]);\n          } else {\n            str = format(value[key], recurseTimes - 1);\n          }\n          if (str.indexOf('\\n') > -1) {\n            if (isArray(value)) {\n              str = str.split('\\n').map(function(line) {\n                return '  ' + line;\n              }).join('\\n').substr(2);\n            } else {\n              str = '\\n' + str.split('\\n').map(function(line) {\n                return '   ' + line;\n              }).join('\\n');\n            }\n          }\n        } else {\n          str = stylize('[Circular]', 'special');\n        }\n      }\n      if (typeof name === 'undefined') {\n        if (type === 'Array' && key.match(/^\\d+$/)) {\n          return str;\n        }\n        name = JSON.stringify('' + key);\n        if (name.match(/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)) {\n          name = name.substr(1, name.length - 2);\n          name = stylize(name, 'name');\n        } else {\n          name = name.replace(/'/g, \"\\\\'\")\n                     .replace(/\\\\\"/g, '\"')\n                     .replace(/(^\"|\"$)/g, \"'\");\n          name = stylize(name, 'string');\n        }\n      }\n\n      return name + ': ' + str;\n    });\n\n    seen.pop();\n\n    var numLinesEst = 0;\n    var length = output.reduce(function(prev, cur) {\n      numLinesEst++;\n      if (cur.indexOf('\\n') >= 0) numLinesEst++;\n      return prev + cur.length + 1;\n    }, 0);\n\n    if (length > 50) {\n      output = braces[0] +\n               (base === '' ? '' : base + '\\n ') +\n               ' ' +\n               output.join(',\\n  ') +\n               ' ' +\n               braces[1];\n\n    } else {\n      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];\n    }\n\n    return output;\n  }\n  return format(obj, (typeof depth === 'undefined' ? 2 : depth));\n};\n\n\nfunction isArray(ar) {\n  return ar instanceof Array ||\n         Array.isArray(ar) ||\n         (ar && ar !== Object.prototype && isArray(ar.__proto__));\n}\n\n\nfunction isRegExp(re) {\n  return re instanceof RegExp ||\n    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');\n}\n\n\nfunction isDate(d) {\n  if (d instanceof Date) return true;\n  if (typeof d !== 'object') return false;\n  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);\n  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);\n  return JSON.stringify(proto) === JSON.stringify(properties);\n}\n\nfunction pad(n) {\n  return n < 10 ? '0' + n.toString(10) : n.toString(10);\n}\n\nvar months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',\n              'Oct', 'Nov', 'Dec'];\n\n// 26 Feb 16:19:34\nfunction timestamp() {\n  var d = new Date();\n  var time = [pad(d.getHours()),\n              pad(d.getMinutes()),\n              pad(d.getSeconds())].join(':');\n  return [d.getDate(), months[d.getMonth()], time].join(' ');\n}\n\nexports.log = function (msg) {};\n\nexports.pump = null;\n\nvar Object_keys = Object.keys || function (obj) {\n    var res = [];\n    for (var key in obj) res.push(key);\n    return res;\n};\n\nvar Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {\n    var res = [];\n    for (var key in obj) {\n        if (Object.hasOwnProperty.call(obj, key)) res.push(key);\n    }\n    return res;\n};\n\nvar Object_create = Object.create || function (prototype, properties) {\n    // from es5-shim\n    var object;\n    if (prototype === null) {\n        object = { '__proto__' : null };\n    }\n    else {\n        if (typeof prototype !== 'object') {\n            throw new TypeError(\n                'typeof prototype[' + (typeof prototype) + '] != \\'object\\''\n            );\n        }\n        var Type = function () {};\n        Type.prototype = prototype;\n        object = new Type();\n        object.__proto__ = prototype;\n    }\n    if (typeof properties !== 'undefined' && Object.defineProperties) {\n        Object.defineProperties(object, properties);\n    }\n    return object;\n};\n\nexports.inherits = function(ctor, superCtor) {\n  ctor.super_ = superCtor;\n  ctor.prototype = Object_create(superCtor.prototype, {\n    constructor: {\n      value: ctor,\n      enumerable: false,\n      writable: true,\n      configurable: true\n    }\n  });\n};\n\nvar formatRegExp = /%[sdj%]/g;\nexports.format = function(f) {\n  if (typeof f !== 'string') {\n    var objects = [];\n    for (var i = 0; i < arguments.length; i++) {\n      objects.push(exports.inspect(arguments[i]));\n    }\n    return objects.join(' ');\n  }\n\n  var i = 1;\n  var args = arguments;\n  var len = args.length;\n  var str = String(f).replace(formatRegExp, function(x) {\n    if (x === '%%') return '%';\n    if (i >= len) return x;\n    switch (x) {\n      case '%s': return String(args[i++]);\n      case '%d': return Number(args[i++]);\n      case '%j': return JSON.stringify(args[i++]);\n      default:\n        return x;\n    }\n  });\n  for(var x = args[i]; i < len; x = args[++i]){\n    if (x === null || typeof x !== 'object') {\n      str += ' ' + x;\n    } else {\n      str += ' ' + exports.inspect(x);\n    }\n  }\n  return str;\n};\n\n//@ sourceURL=util"
));

require.define("/node_modules/racer/lib/pubSub/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var mixinStore = __dirname + '/pubSub.Store';\n\nexports = module.exports = function (racer) {\n  racer.mixin(mixinStore);\n};\n\nexports.useWith = { server: false, browser: true };\nexports.decorate = 'racer';\n\n//@ sourceURL=/node_modules/racer/lib/pubSub/index.js"
));

require.define("/node_modules/racer/lib/computed/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var filterMixin = require('./filter.Model');\n\nexports = module.exports = plugin;\nexports.decorate = 'racer';\nexports.useWith = { server: true, browser: true };\n\nfunction plugin (racer) {\n  racer.mixin(filterMixin);\n}\n\n//@ sourceURL=/node_modules/racer/lib/computed/index.js"
));

require.define("/node_modules/racer/lib/computed/filter.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var TransformBuilder = require('../descriptor/query/TransformBuilder');\n\nmodule.exports = {\n  type: 'Model'\n, proto: {\n    /**\n     * @param {String|Model} source\n     * @param {Object} filterSpec\n     */\n    filter: function (source, filterSpec) {\n      var builder = new TransformBuilder(this._root, source.path ? source.path() : source);\n      if (filterSpec) builder.filter(filterSpec);\n      return builder;\n    }\n  , sort: function (source, sortParams) {\n      var builder = new TransformBuilder(this._root, source);\n      builder.sort(sortParams);\n      return builder;\n    }\n  }\n};\n\nvar mixinProto = module.exports.proto;\n\nfor (var k in mixinProto) {\n  scopeFriendly(mixinProto, k);\n}\n\nfunction scopeFriendly (object, method) {\n  var old = object[method];\n  object[method] = function (source, params) {\n    var at = this._at;\n    if (at) {\n      if (typeof source === 'string') {\n        source = at + '.' + source;\n      } else {\n        params = source;\n        source = at;\n      }\n    }\n    return old.call(this, source, params);\n  }\n}\n\n\n//@ sourceURL=/node_modules/racer/lib/computed/filter.Model.js"
));

require.define("/node_modules/racer/lib/descriptor/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/**\n * Descriptors are different ways of expressing a data set. Racer comes bundled\n * with 2 descriptor types:\n *\n * 1. Path Patterns\n *\n *    model.subscribe('users.*.name', callback);\n *\n * 2. Queries\n *\n *    var query = model.query('users').withName('Brian');\n *    model.fetch(query, callback);\n *\n * Descriptors allow you to create expressive DSLs to write addresses to data.\n * You then pass the concrete descriptor(s) to fetch, subscribe, or snapshot.\n */\nvar mixinModel = require('./descriptor.Model')\n  , mixinStore = __dirname + '/descriptor.Store'\n  , patternPlugin = require('./pattern')\n  , queryPlugin = require('./query')\n  ;\n\nexports = module.exports = plugin;\n\nexports.useWith = {server: true, browser: true};\n\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  racer.mixin(mixinModel, mixinStore);\n  racer.use(patternPlugin);\n  racer.use(queryPlugin);\n}\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/index.js"
));

require.define("/node_modules/racer/lib/descriptor/descriptor.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var Taxonomy = require('./Taxonomy')\n  , noop = require('../util').noop\n  , normArgs = require('./util').normArgs\n  ;\n\nmodule.exports = {\n  type: 'Model'\n\n, decorate: function (Model) {\n    Model.prototype.descriptors = new Taxonomy;\n    Model.dataDescriptor = function (conf) {\n      var types = Model.prototype.descriptors\n        , typeName = conf.name\n        , type = types.type(typeName);\n      if (type) return type;\n      return types.type(typeName, conf);\n    };\n  }\n\n, proto: {\n    fetch: function (/* descriptors..., cb*/) {\n      var args = normArgs(arguments)\n        , descriptors = args[0]\n        , cb = args[1]\n        , self = this\n\n        , scopedModels = []\n        ;\n\n      descriptors = this.descriptors.normalize(descriptors);\n\n      this.descriptors.handle(this, descriptors, {\n        registerFetch: true\n        // Runs descriptorType.scopedResult and passes return value to this cb\n      , scopedResult: function (scopedModel) {\n          scopedModels.push(scopedModel);\n        }\n      });\n\n      this._upstreamData(descriptors, function (err, data) {\n        if (err) return cb(err);\n        self._addData(data);\n        cb.apply(null, [err].concat(scopedModels));\n      });\n    }\n\n  , waitFetch: function (/* descriptors..., cb */) {\n      var arglen = arguments.length\n        , cb = arguments[arglen-1]\n        , self = this;\n\n      function newCb (err) {\n        if (err === 'disconnected') {\n          return self.once('connect', newCb);\n        }\n        cb.apply(null, arguments);\n      };\n      arguments[arglen-1] = newCb;\n      this.fetch.apply(this, arguments);\n    }\n\n    // TODO Do some sort of subscription counting (like reference counting) to\n    // trigger proper cleanup of a query in the QueryRegistry\n  , subscribe: function (/* descriptors..., cb */) {\n      var args = normArgs(arguments)\n        , descriptors = args[0]\n        , cb = args[1]\n        , self = this\n\n        , scopedModels = []\n        ;\n\n      descriptors = this.descriptors.normalize(descriptors);\n\n      // TODO Don't subscribe to a given descriptor again if already\n      // subscribed to the descriptor before (so that we avoid an additional fetch)\n\n      this.descriptors.handle(this, descriptors, {\n        registerSubscribe: true\n      , scopedResult: function (scopedModel) {\n          scopedModels.push(scopedModel);\n        }\n      });\n\n      this._addSub(descriptors, function (err, data) {\n        if (err) return cb(err);\n        self._addData(data);\n        self.emit('addSubData', data);\n        cb.apply(null, [err].concat(scopedModels));\n      });\n\n      // TODO Cleanup function\n      // return {destroy: fn }\n    }\n\n  , unsubscribe: function (/* descriptors..., cb */) {\n      var args = normArgs(arguments)\n        , descriptors = args[0]\n        , cb = args[1]\n        , self = this\n        ;\n\n      descriptors = this.descriptors.normalize(descriptors);\n\n      this.descriptors.handle(this, descriptors, {\n        unregisterSubscribe: true\n      });\n\n      // if (! descriptors.length) return;\n\n      this._removeSub(descriptors, cb);\n    }\n\n  , _upstreamData: function (descriptors, cb) {\n      if (!this.connected) return cb('disconnected');\n      this.socket.emit('fetch', descriptors, this.scopedContext, cb);\n    }\n\n  , _addSub: function (descriptors, cb) {\n      if (! this.connected) return cb('disconnected');\n      this.socket.emit('subscribe', descriptors, this.scopedContext, cb);\n    }\n\n  , _removeSub: function (descriptors, cb) {\n      if (! this.connected) return cb('disconnected');\n      this.socket.emit('unsubscribe', descriptors, cb);\n    }\n\n    // TODO Associate contexts with path and query subscriptions\n  , _subs: function () {\n      var subs = []\n        , types = this.descriptors\n        , model = this;\n      types.each( function (name, type) {\n        subs = subs.concat(type.subs(model));\n      });\n      return subs;\n    }\n\n  , _addData: function (data) {\n      var memory = this._memory;\n      data = data.data;\n\n      for (var i = 0, l = data.length; i < l; i++) {\n        var triplet = data[i]\n          , path  = triplet[0]\n          , value = triplet[1]\n          , ver   = triplet[2];\n        if (ver == null) {\n          // Adding data in this context should not be speculative _addData\n          ver = -1;\n          // TODO Investigate what scenarios cause this later\n          // throw new Error('Adding data in this context should not be speculative _addData ' + path + ', ' + value + ', ' + ver);\n        }\n        var out = memory.set(path, value, ver);\n        // Need this condition for scenarios where we subscribe to a\n        // non-existing document. Otherwise, a mutator event would  e emitted\n        // with an undefined value, triggering filtering and querying listeners\n        // which rely on a document to be defined and possessing an id.\n        if (value !== null && typeof value !== 'undefined') {\n          // TODO Perhaps make another event to differentiate against model.set\n          this.emit('set', [path, value], out);\n        }\n      }\n    }\n  }\n\n, server: {\n    _upstreamData: function (descriptors, cb) {\n      var store = this.store\n        , contextName = this.scopedContext\n        , self = this;\n      this._clientIdPromise.on(function (err, clientId) {\n        if (err) return cb(err);\n        var req = {\n          targets: descriptors\n        , clientId: clientId\n        , session: self.session\n        , context: store.context(contextName)\n        };\n        var res = {\n          fail: cb\n        , send: function (data) {\n            store.emit('fetch', data, clientId, descriptors);\n            cb(null, data);\n          }\n        };\n        store.middleware.fetch(req, res);\n      });\n    }\n  , _addSub: function (descriptors, cb) {\n      var store = this.store\n        , contextName = this.scopedContext\n        , self = this;\n      this._clientIdPromise.on(function (err, clientId) {\n        if (err) return cb(err);\n        // Subscribe while the model still only resides on the server. The\n        // model is unsubscribed before sending to the browser.\n        var req = {\n          clientId: clientId\n        , session: self.session\n        , targets: descriptors\n        , context: store.context(contextName)\n        };\n        var res = {\n          fail: cb\n        , send: function (data) {\n            cb(null, data);\n          }\n        };\n        store.middleware.subscribe(req, res);\n      });\n    }\n  , _removeSub: function (descriptors, cb) {\n      var store = this.store\n        , context = this.scopedContext;\n      this._clientIdPromise.on(function (err, clientId) {\n        if (err) return cb(err);\n        var mockSocket = {clientId: clientId};\n        store.unsubscribe(mockSocket, descriptors, context, cb);\n      });\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/descriptor.Model.js"
));

require.define("/node_modules/racer/lib/descriptor/Taxonomy.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/**\n * A Taxonomy is a registry of descriptor types. It's an approach to achieve\n * polymorphism for the logic represented here by handle, normalize, and typeOf\n * across different descriptor instances (e.g., query, pattern, search)\n */\nmodule.exports = Taxonomy;\n\nfunction Taxonomy () {\n  this._types = {};\n}\n\nTaxonomy.prototype.type = function (name, conf) {\n  var types = this._types;\n  if (arguments.length === 1) return types[name];\n  return types[name] = conf;\n};\n\n/**\n * Handles descriptors based on the descriptor types registered with the Taxonomy.\n * @param {Model|Store} repo\n * @param {String} method\n * @param {Array} descriptors\n * @optional @param {isAsync} Boolean\n */\nTaxonomy.prototype.handle = function (repo, descriptors, callbacks) {\n  for (var i = 0, l = descriptors.length; i < l; i++) {\n    var descriptor = descriptors[i]\n      , type = this.typeOf(descriptor);\n    for (var method in callbacks) {\n      var result = type[method](repo, descriptor)\n        , fn = callbacks[method];\n      if (typeof fn === 'function') fn(result);\n    }\n  }\n};\n\nTaxonomy.prototype.normalize = function (descriptors) {\n  var normed = [];\n  for (var i = 0, l = descriptors.length; i < l; i++) {\n    var desc = descriptors[i]\n      , type = this.typeOf(desc)\n      , normalize = type.normalize;\n    normed.push(normalize ? normalize(desc) : desc);\n  }\n  return normed;\n};\n\nTaxonomy.prototype.typeOf = function (descriptor) {\n  var types = this._types;\n  for (var name in types) {\n    var type = types[name];\n    if (type.isInstance(descriptor)) return type;\n  }\n};\n\nTaxonomy.prototype.each = function (cb) {\n  var types = this._types;\n  for (var name in types) cb(name, types[name]);\n};\n\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/Taxonomy.js"
));

require.define("/node_modules/racer/lib/descriptor/util.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  normArgs: normArgs\n};\n\nfunction normArgs (_arguments_) {\n  var arglen = _arguments_.length\n    , lastArg = _arguments_[arglen-1]\n    , cb = (typeof lastArg === 'function') ? lastArg : noop\n    , descriptors = Array.prototype.slice.call(_arguments_, 0, cb ? arglen-1 : arglen);\n  return [descriptors, cb];\n}\n\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/util.js"
));

require.define("/node_modules/racer/lib/descriptor/pattern/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var mixinModel = require('./pattern.Model')\n  , mixinStore = __dirname + '/pattern.Store'\n  ;\n\nexports = module.exports = plugin;\n\nexports.useWith = {server: true, browser: true};\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  racer.mixin(mixinModel, mixinStore);\n}\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/pattern/index.js"
));

require.define("/node_modules/racer/lib/descriptor/pattern/pattern.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var basePattern = require('./base')\n  , mergeAll = require('../../util').mergeAll\n  , splitPath= require('../../path').split\n  ;\n\n/**\n * Takes care of all the book-keeping in the Model for fetching and subscribing\n * to a path pattern.\n */\nmodule.exports = {\n  type: 'Model'\n, events: {\n    init: function (model) {\n      // `_patternSubs` remembers path subscriptions.\n      // This memory is useful when the client may have been disconnected from\n      // the server for quite some time and needs to re-send its subscriptions\n      // upon a re-connection in order for the server (1) to figure out what\n      // data the client needs to re-sync its snapshot and (2) to re-subscribe\n      // to the data on behalf of the client. The paths and queries get cached\n      // in Model#subscribe\n      model._patternSubs = {}; // pattern: Boolean\n    }\n\n  , bundle: function (model, addToBundle) {\n      addToBundle('_loadPatternSubs', model._patternSubs);\n    }\n  }\n\n, decorate: function (Model) {\n    var modelPattern = mergeAll({\n      scopedResult: function (model, pattern) {\n        var pathToGlob = splitPath(pattern)[0];\n        return model.at(pathToGlob);\n      }\n    , registerFetch: function (model, pattern) {\n        // TODO Needed or remove this?\n      }\n    , registerSubscribe: function (model, pattern) {\n        var subs = model._patternSubs;\n        if (pattern in subs) return;\n        return subs[pattern] = true;\n      }\n    , unregisterSubscribe: function (model, pattern) {\n        var patternSubs = model._patternSubs;\n        if (! (pattern in patternSubs)) return;\n        delete patternSubs[pattern];\n      }\n    , subs: function (model) {\n        return Object.keys(model._patternSubs);\n      }\n    // TODO Need something for snapshot?\n    }, basePattern);\n\n    Model.dataDescriptor(modelPattern);\n  }\n\n, proto: {\n    _loadPatternSubs: function (patternSubs) {\n      this._patternSubs = patternSubs;\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/pattern/pattern.Model.js"
));

require.define("/node_modules/racer/lib/descriptor/pattern/base.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  name: 'Pattern'\n, normalize: function (x) { return x._at || x; }\n, isInstance: function (x) { return typeof x === 'string' || x._at; }\n, registerFetch: function () {}\n};\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/pattern/base.js"
));

require.define("/node_modules/racer/lib/descriptor/query/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var mixinModel = require('./query.Model')\n  , mixinStore = __dirname + '/query.Store'\n  ;\n\nexports = module.exports = plugin;\n\nexports.useWith = {server: true, browser: true};\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  racer.mixin(mixinModel, mixinStore);\n}\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/query/index.js"
));

require.define("/node_modules/racer/lib/descriptor/query/query.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var basePattern = require('./base')\n  , mergeAll = require('../../util').mergeAll\n  , setupQueryModelScope = require('./scope')\n\n  , transaction = require('../../transaction')\n  , QueryBuilder = require('./QueryBuilder')\n  , QueryRegistry = require('./QueryRegistry')\n  , QueryMotifRegistry = require('./QueryMotifRegistry')\n  ;\n\nmodule.exports = {\n  type: 'Model'\n, events: {\n    init: onInit\n  , bundle: onBundle\n  , socket: onSocket\n  }\n, decorate: function (Model) {\n    var modelPattern = mergeAll({\n      scopedResult: scopedResult\n    , registerSubscribe: registerSubscribe\n    , registerFetch: registerFetch\n    , unregisterSubscribe: unregisterSubscribe\n    , subs: subs\n    }, basePattern);\n    Model.dataDescriptor(modelPattern);\n  }\n, proto: {\n    _loadQueries: loadQueries\n  , _querySubs: querySubs\n  , queryJSON: queryJSON\n  , _loadQueryMotifs: loadQueryMotifs\n  , registerQuery: registerQuery\n  , unregisterQuery: unregisterQuery\n  , registeredMemoryQuery: registeredMemoryQuery\n  , registeredQueryId: registeredQueryId\n  , fromQueryMotif: fromQueryMotif\n  , query: query\n  }\n};\n\n\nfunction onInit(model) {\n  var store = model.store;\n  if (store) {\n    // Maps query motif -> callback\n    model._queryMotifRegistry = store._queryMotifRegistry;\n  } else {\n    // Stores any query motifs registered via store.query.expose. The query\n    // motifs declared via Store are copied over to all child Model\n    // instances created via Store#createModel\n    model._queryMotifRegistry = new QueryMotifRegistry;\n  }\n\n  // The query registry stores any queries associated with the model via\n  // Model#fetch and Model#subscribe\n  model._queryRegistry = new QueryRegistry;\n}\n\nfunction onBundle(model, addToBundle) {\n  // TODO Re-write this\n  var queryMotifRegistry = model._queryMotifRegistry\n    , queryMotifBundle = queryMotifRegistry.toJSON();\n  model._onLoad.push(['_loadQueryMotifs', queryMotifBundle]);\n  addToBundle('_loadQueries', model._queryRegistry.bundle());\n}\n\nfunction onSocket(model, socket) {\n  var memory = model._memory;\n\n  // The \"addDoc\" event is fired wheneber a remote mutation results in a\n  // new or existing document in the cloud to become a member of one of the\n  // result sets corresponding to a query that this model is currently\n  // subscribed.\n  socket.on('addDoc', function (payload, num) {\n    var data = payload.data\n      , doc = data.doc\n      , ns  = data.ns\n      , ver = data.ver\n      , txn = data.txn\n      , collection = model.get(ns);\n\n    // If the doc is already in the model, don't add it\n    if (collection && collection[doc.id]) {\n      // But apply the transaction that resulted in the document that is\n      // added to the query result set.\n      if (transaction.getClientId(txn) === model._clientId) {\n        // Set to null txn, and still account for num\n        txn = null\n      }\n      return model._addRemoteTxn(txn, num);\n    }\n\n    var pathToDoc = ns + '.' + doc.id\n      , txn = transaction.create({\n          ver: ver\n        , id: null\n        , method: 'set'\n        , args: [pathToDoc, doc]\n        });\n    model._addRemoteTxn(txn, num);\n    model.emit('addDoc', pathToDoc, doc);\n  });\n\n  // The \"rmDoc\" event is fired wheneber a remote mutation results in an\n  // existing document in the cloud ceasing to become a member of one of\n  // the result sets corresponding to a query that this model is currently\n  // subscribed.\n  socket.on('rmDoc', function (payload, num) {\n    var hash = payload.channel // TODO Remove\n      , data = payload.data\n      , doc  = data.doc\n      , id   = data.id\n      , ns   = data.ns\n      , ver  = data.ver\n      , txn = data.txn\n\n        // TODO Maybe just [clientId, queryId]\n      , queryTuple = data.q; // TODO Add q to data\n\n    // Don't remove the doc if any other queries match the doc\n    var querySubs = model._querySubs();\n    for (var i = querySubs.length; i--; ) {\n      var currQueryTuple = querySubs[i];\n\n      var memoryQuery = model.registeredMemoryQuery(currQueryTuple);\n\n      // If \"rmDoc\" was triggered by the same query, we expect it not to\n      // match the query, so ignore it.\n      if (QueryBuilder.hash(memoryQuery.toJSON()) === hash.substring(3, hash.length)) continue;\n\n      // If the doc belongs in an existing subscribed query's result set,\n      // then don't remove it, but instead apply a \"null\" transaction to\n      // make sure the transaction counter `num` is acknowledged, so other\n      // remote transactions with a higher counter can be applied.\n      if (memoryQuery.filterTest(doc, ns)) {\n        return model._addRemoteTxn(null, num);\n      }\n    }\n\n    var pathToDoc = ns + '.' + id\n      , oldDoc = model.get(pathToDoc);\n    if (transaction.getClientId(txn) === model._clientId) {\n      txn = null;\n    } else {\n      txn = transaction.create({\n          ver: ver\n        , id: null\n        , method: 'del'\n        , args: [pathToDoc]\n      });\n    }\n\n    model._addRemoteTxn(txn, num);\n    model.emit('rmDoc', pathToDoc, oldDoc);\n  });\n}\n\n\nfunction scopedResult(model, queryTuple) {\n  var memoryQuery = model.registeredMemoryQuery(queryTuple)\n    , queryId = model.registeredQueryId(queryTuple);\n  return setupQueryModelScope(model, memoryQuery, queryId);\n}\nfunction registerSubscribe(model, queryTuple) {\n  model.registerQuery(queryTuple, 'subs');\n}\nfunction registerFetch(model, queryTuple) {\n  model.registerQuery(queryTuple, 'fetch');\n}\nfunction unregisterSubscribe(model, queryTuple) {\n  var querySubs = model._querySubs()\n    , hash = QueryBuilder.hash(queryJson);\n  if (! (hash in querySubs)) return;\n  model.unregisterQuery(hash, querySubs);\n}\nfunction subs(model) {\n  return model._querySubs();\n}\n\nfunction loadQueries(bundle) {\n  for (var i = 0, l = bundle.length; i < l; i++) {\n    var pair = bundle[i]\n      , queryTuple = pair[0]\n      , tag = pair[1];\n    var force = true;\n    this.registerQuery(queryTuple, tag, force);\n    scopedResult(this, queryTuple);\n  }\n}\nfunction querySubs() {\n  return this._queryRegistry.lookupWithTag('subs');\n}\n\n/**\n * @param {Array} queryTuple\n * @return {Object} json representation of the query\n * @api protected\n */\nfunction queryJSON(queryTuple) {\n  return this._queryMotifRegistry.queryJSON(queryTuple);\n}\n\n\n/**\n * Called when loading the model bundle. Loads queries defined by store.query.expose\n *\n * @param {Object} queryMotifBundle is the bundled form of a\n * QueryMotifRegistry, that was packaged up by the server Model and sent\n * down with the initial page response.\n * @api private\n */\nfunction loadQueryMotifs(queryMotifBundle) {\n  this._queryMotifRegistry = QueryMotifRegistry.fromJSON(queryMotifBundle);\n}\n\n/**\n * Registers queries to which the model is subscribed.\n *\n * @param {Array} queryTuple\n * @param {String} tag to label the query\n * @return {Boolean} true if registered; false if already registered\n * @api protected\n */\nfunction registerQuery(queryTuple, tag, force) {\n  var queryRegistry = this._queryRegistry\n    , queryId = queryRegistry.add(queryTuple, this._queryMotifRegistry, force) ||\n                queryRegistry.queryId(queryTuple);\n  queryRegistry.tag(queryId, tag);\n  if (!tag) throw new Error(\"NO TAG\");\n  return queryId;\n}\n\n/**\n * If no tag is provided, removes queries that we do not care to keep around anymore.\n * If a tag is provided, we only untag the query.\n *\n * @param {Array} queryTuple of the form [motifName, queryArgs...]\n * @param {Object} index mapping query hash -> Boolean\n * @return {Boolean}\n * @api protected\n */\nfunction unregisterQuery(queryTuple, tag) {\n  var queryRegistry = this._queryRegistry;\n  if (tag) {\n    var queryId = queryRegistry.queryId(queryTuple);\n    return queryRegistry.untag(queryId, tag);\n  }\n  return queryRegistry.remove(queryTuple);\n}\n\n/**\n * Locates a registered query.\n *\n * @param {String} motifName\n * @return {MemoryQuery|undefined} the registered MemoryQuery matching the queryRepresentation\n * @api protected\n */\nfunction registeredMemoryQuery(queryTuple) {\n  return this._queryRegistry.memoryQuery(queryTuple, this._queryMotifRegistry);\n}\n\nfunction registeredQueryId(queryTuple) {\n  return this._queryRegistry.queryId(queryTuple);\n}\n\n/**\n * Convenience method for generating [motifName, queryArgs...] tuples to\n * pass to Model#subscribe and Model#fetch.\n *\n * Example:\n *\n *     var query = model.fromQueryMotif('todos', 'forUser', 'someUserId');\n *     model.subscribe(query, function (err, todos) {\n *       console.log(todos.get());\n *     });\n *\n * @param {String} motifName\n * @param @optional {Object} queryArgument1\n * @param @optional {Object} ...\n * @param @optional {Object} queryArgumentX\n * @return {Array} a tuple of [null, motifName, queryArguments...]\n * @api public\n */\nfunction fromQueryMotif(/* motifName, queryArgs... */) {\n  return [null].concat(Array.prototype.slice.call(arguments, 0));\n}\n\n/**\n * Convenience method for generating [ns, [motifName, queryArgs...],\n * [motifName, queryArgs...]] tuples to pass to Model#subscribe and\n * Model#fetch via a fluent, chainable interface.\n *\n * Example:\n *\n *     var query = model.query('todos').forUser('1');\n *     model.subscribe(query, function (err, todos) {\n *       console.log(todos.get());\n *     });\n *\n *  You do not need to pass query to subscribe. You can also call subscribe\n *  on the query directly:\n *\n *      model.query('todos').forUser('1').subscribe( function (err, todos) {\n *        console.log(todos.get());\n *      });\n *\n *  This also supports a function signature that's better for\n *  coffee-script:\n *\n *  Example in coffee:\n *\n *     model.query 'todos',\n *       forUser: '1'\n *       subscribe: (err, todos) ->\n *         console.log todos.get()\n *\n * @param {String} ns\n * @return {Object} a query tuple builder\n * @api public\n */\nfunction query(ns) {\n  var model = this;\n  var builder = Object.create(this._queryMotifRegistry.queryTupleBuilder(ns), {\n    fetch: {value: function (cb) {\n      model.fetch(this, cb);\n    }}\n  , waitFetch: {value: function (cb) {\n      model.waitFetch(this, cb);\n    }}\n  , subscribe: {value: function (cb) {\n      model.subscribe(this, cb);\n    }}\n  });\n  if (arguments.length == 2) {\n    var params = arguments[1];\n    var getter = 'fetch' in params\n               ? 'fetch'\n               : 'subscribe' in params\n                 ? 'subscribe'\n                 : null;\n    if (getter) {\n      var cb = params[getter];\n      delete params[getter];\n    }\n    for (var motif in params) {\n      builder[motif](params[motif]);\n    }\n    if (getter) builder[getter](cb);\n  }\n  return builder;\n}\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/query/query.Model.js"
));

require.define("/node_modules/racer/lib/descriptor/query/base.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  name: 'Query'\n, normalize: function (x) {\n    return x.tuple ? x.tuple : x;\n  }\n, isInstance: function (x) { return Array.isArray(x) || x.tuple; }\n};\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/query/base.js"
));

require.define("/node_modules/racer/lib/descriptor/query/QueryRegistry.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// TODO Update queryTuple comments to reflect current structure\n\nvar deepEqual = require('../../util').deepEqual\n  , objectExcept = require('../../path').objectExcept\n  , MemoryQuery = require('./MemoryQuery')\n  , QueryBuilder = require('./QueryBuilder')\n  ;\n\nmodule.exports = QueryRegistry;\n\n/**\n * QueryRegistry is used by Model to keep track of queries and their metadata.\n */\nfunction QueryRegistry () {\n  // Maps queryId ->\n  //        id: queryId\n  //        tuple: [ns, {<queryMotif>: queryArgs, ...}, queryId]\n  //        query: <# MemoryQuery>\n  //        tags: [tags...]\n  //\n  // The `query` property is lazily created via QueryRegistry#memoryQuery\n  this._queries = {};\n\n  this._ordered = [];\n\n  // Maps ns -> [queryIds...]\n  this._queryIdsByNs = {};\n\n  // Maps tag -> [queryIds...]\n  // This is used for quick lookup of queries by tag\n  this._queryIdsByTag = {};\n\n  this._nextId = 1;\n  var self = this;\n  this._nextQueryId = function () {\n    return '_' + (self._nextId++);\n  }\n}\n\n/**\n * Creates a QueryRegistry instance from json that has been generated from\n * QueryBuilder#toJSON\n *\n * @param {Object} json\n * @param {Object} queryMotifRegistry contains all registered query motifs\n * @return {QueryRegistry}\n * @api public\n */\nQueryRegistry.fromJSON = function (json, queryMotifRegistry) {\n  var registry = new QueryRegistry\n    , queryIdsByNs = registry._queryIdsByNs\n    , queryIdsByTag = registry._queryIdsByTag\n    , maxQueryId = 0;\n\n  registry._queries = json;\n\n  for (var queryId in json) {\n    var curr = json[queryId]\n      , queryTuple = curr.tuple\n      , ns = queryTuple[0];\n\n    // Re-construct queryIdsByNs index\n    var queryIds = queryIdsByNs[ns] || (queryIdsByNs[ns] = []);\n    queryIds.push(queryId);\n\n    // Re-construct queryIdsByTag index\n    var tags = curr.tags;\n    for (var i = tags.length; i--; ) {\n      var tag = tags[i]\n        , taggedQueryIds = queryIdsByTag[tag] ||\n                          (queryIdsByTag[tag] = []);\n      if (-1 === taggedQueryIds.indexOf(queryId)) {\n        taggedQueryIds.push(queryId);\n      }\n    }\n\n    // Keep track of a max queryId, so we can assign the _nextQueryId upon the\n    // next call to QueryRegistry#add\n    maxQueryId = Math.max(maxQueryId, parseInt(queryId.slice(1 /* rm '_'*/), 10));\n  }\n  registry._nextId = ++maxQueryId;\n  return registry;\n};\n\nQueryRegistry.prototype = {\n  toJSON: function () {\n    var queries = this._queries\n      , json = {};\n    for (var queryId in queries) {\n      // Ignore the MemoryQuery instance\n      json[queryId] = objectExcept(queries[queryId], 'query');\n    }\n    return json;\n  }\n\n, bundle: function () {\n    var ordered = this._ordered\n      , queries = this._queries\n      , bundle = [];\n    for (var i = 0, l = ordered.length; i < l; i++) {\n      var pair = ordered[i]\n        , queryId = pair[0]\n        , tag = pair[1]\n        ;\n      bundle.push([queries[queryId].tuple, tag]);\n    }\n    return bundle;\n  }\n\n  /**\n   * Adds a query to the registry.\n   *\n   * @param {Array} queryTuple is [ns, [queryMotif, queryArgs...], ...]\n   * @return {String|null} the query id if add succeeds. null if add fails.\n   * @api public\n   */\n, add: function (queryTuple, queryMotifRegistry, force) {\n    var queryId = this.queryId(queryTuple);\n\n    // NOTE It's important for some query types to send the queryId to the\n    // Store, so the Store can use it. For example, the `count` query needs to\n    // send over the queryId, so that the Store can send back the proper data\n    // instructions that includes a path at which to store the count result.\n    // TODO In the future, we can figure out the path based on a more generic\n    // means to load data into our Model from the Store. So we can remove this\n    // line later\n    if (!queryTuple[3]) queryTuple[3] = queryId;\n\n    if (!force && queryId) return null;\n\n    if (!queryTuple[2]) queryTuple[2] = null;\n\n    var queries = this._queries;\n    if (! (queryId in queries)) {\n      if (queryTuple[2] === 'count') { // TODO Use types/ somehow\n        var queryJson = queryMotifRegistry.queryJSON(queryTuple);\n        queryId = QueryBuilder.hash(queryJson);\n      } else {\n        queryId = this._nextQueryId();\n      }\n      queryTuple[3] = queryId;\n\n      queries[queryId] = {\n        id: queryId\n      , tuple: queryTuple\n      , tags: []\n      };\n\n      var ns = queryTuple[0]\n        , queryIdsByNs = this._queryIdsByNs\n        , queryIds = queryIdsByNs[ns] || (queryIdsByNs[ns] = []);\n      if (queryIds.indexOf(queryId) === -1) {\n        queryIds.push(queryId);\n      }\n    }\n\n    return queryId;\n  }\n\n  /**\n   * Removes a query from the registry.\n   *\n   * @param {Array} queryTuple\n   * @return {Boolean} true if remove succeeds. false if remove fails.\n   * @api public\n   */\n, remove: function (queryTuple) {\n    // TODO Return proper Boolean value\n    var queries = this._queries\n      , queryId = this.queryId(queryTuple)\n      , meta = queries[queryId];\n\n    // Clean up tags\n    var tags = meta.tags\n      , queryIdsByTag = this._queryIdsByTag;\n    for (var i = tags.length; i--; ) {\n      var tag = tags[i]\n        , queryIds = queryIdsByTag[tag];\n      queryIds.splice(queryIds.indexOf(queryId), 1);\n      if (! queryIds.length) delete queryIdsByTag[tag];\n    }\n\n    // Clean up queryIdsByNs index\n    var ns = queryTuple[0]\n      , queryIdsByNs = this._queryIdsByNs\n      , queryIds = queryIdsByNs[ns]\n      , queryId = queryTuple[queryTuple.length - 1];\n    queryIds.splice(queryIds.indexOf(queryId));\n    if (! queryIds.length) delete queryIdsByNs[ns];\n\n    // Clean up queries\n    delete queries[queryId];\n  }\n\n  /**\n   * Looks up a query in the registry.\n   *\n   * @param {Array} queryTuple of the form\n   * [ns, {motifA: argsA, motifB: argsB, ...}, queryId]\n   * @return {Object} returns registered info about the query\n   * @api public\n   */\n, lookup: function (queryTuple) {\n    var queryId = this.queryId(queryTuple);\n    return this._queries[queryId];\n  }\n\n  /**\n   * Returns the queryId of the queryTuple\n   *\n   * @param {Array} queryTuple\n   */\n, queryId: function (queryTuple) {\n    // queryTuple has the form:\n    // [ns, argsByMotif, typeMethod, queryId]\n    // where\n    // argsByMotif: maps query motif names to motif arguments\n    // typeMethod: e.g., 'one', 'count'\n    // queryId: is an id (specific to the clientId) assigned by the\n    // QueryRegistry to the query\n    if (queryTuple.length === 4) {\n      return queryTuple[3];\n    }\n\n    var ns = queryTuple[0]\n      , queryIds = this._queryIdsByNs[ns]\n      , queries = this._queries;\n    if (!queryIds) return null;\n    var motifs = queryTuple[1]\n      , typeMethod = queryTuple[2];\n    for (var i = queryIds.length; i--; ) {\n      var queryId = queryIds[i]\n        , tuple = queries[queryId].tuple\n        , currMotifs = tuple[1]\n        , currTypeMethod = tuple[2]\n        ;\n      if (deepEqual(currMotifs, motifs) && currTypeMethod == typeMethod) {\n        return queryId;\n      }\n    }\n    return null;\n  }\n\n  /**\n   * @param {Array} queryTuple\n   * @param {QueryMotifRegistry} queryMotifRegistry\n   * @return {MemoryQuery}\n   * @api public\n   */\n, memoryQuery: function (queryTuple, queryMotifRegistry) {\n    var meta = this.lookup(queryTuple)\n      , memoryQuery = meta.query;\n    if (memoryQuery) return memoryQuery;\n\n    var queryJson = queryMotifRegistry.queryJSON(queryTuple);\n    if (! queryJson.type) queryJson.type = 'find';\n    return meta.query = new MemoryQuery(queryJson);\n  }\n\n  /**\n   * Tags a query registered in the registry as queryId. The QueryRegistry can\n   * then look up query tuples by tag via Query#lookupWithTag.\n   *\n   * @param {String} queryId\n   * @param {String} tag\n   * @return {Boolean}\n   * @api public\n   */\n, tag: function (queryId, tag) {\n    var queryIdsByTag = this._queryIdsByTag\n      , queryIds = queryIdsByTag[tag] ||\n                  (queryIdsByTag[tag] = []);\n    if (-1 === queryIds.indexOf(queryId)) {\n      this._ordered.push([queryId, tag]);\n      queryIds.push(queryId);\n      return true;\n    }\n    return false;\n  }\n\n  /**\n   * Untags a query registered in the registry as queryId. This will change\n   * the query tuple results returned by Query#lookupWithTag.\n   *\n   * @param {String} queryId\n   * @param {String} tag\n   * @return {Boolean}\n   * @api public\n   */\n, untag: function (queryId, tag) {\n    var queryIdsByTag = this._queryIdsByTag;\n    if (! (tag in queryIdsByTag)) return false;\n    var queryIds = queryIdsByTag[tag]\n      , pos = queryIds.indexOf(queryId);\n    if (pos === -1) return false;\n    queryIds.splice(pos, 1);\n    if (! queryIds.length) delete queryIdsByTag[tag];\n    return true;\n  }\n\n  /**\n   * Returns all registered query tuples that have been tagged with the given\n   * tag.\n   *\n   * @param {String} tag\n   * @return {Array} array of query tuples\n   * @api public\n   */\n, lookupWithTag: function (tag) {\n    var queryIdsByTag = this._queryIdsByTag\n      , queryIds = queryIdsByTag[tag]\n      , queries = this._queries\n      , found = []\n      , query;\n    if (queryIds) {\n      for (var i = 0, l = queryIds.length; i < l; i++) {\n        query = queries[queryIds[i]];\n        if (query) found.push(query.tuple);\n      }\n    }\n    return found;\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/query/QueryRegistry.js"
));

require.define("/node_modules/racer/lib/descriptor/query/QueryMotifRegistry.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var QueryBuilder = require('./QueryBuilder')\n  , bundleUtils = require('../../bundle/util')\n  , bundledFunction = bundleUtils.bundledFunction\n  , unbundledFunction = bundleUtils.unbundledFunction\n  , deepCopy = require('../../util').deepCopy\n  ;\n\nmodule.exports = QueryMotifRegistry;\n\n/**\n * Instantiates a `QueryMotifRegistry`. The instance is used by Model and Store\n * to add query motifs and to generate QueryBuilder instances with the\n * registered query motifs.\n */\nfunction QueryMotifRegistry () {\n  // Contains the query motifs declared without a ns.\n  // An example this._noNs might look like:\n  //     this._noNs = {\n  //       motifNameK: callbackK\n  //     , motifNameL: callbackL\n  //     };\n  // This would have been generated via:\n  //     this.add('motifNameK', callbackK);\n  //     this.add('motifNameL', callbackL);\n  this._noNs = {};\n\n  // Contains the query motifs declared with an ns.\n  // An example this._byNs might look like:\n  //     this._byNs = {\n  //       nsA: {\n  //         motifNameX: callbackX\n  //       , motifNameY: callbackY\n  //       }\n  //     , nsB: {\n  //         motifNameZ: callbackZ\n  //       }\n  //     };\n  // This would have been generated via:\n  //     this.add('nsA', 'motifNameX', callbackX);\n  //     this.add('nsA', 'motifNameY', callbackY);\n  //     this.add('nsB', 'motifNameZ', callbackZ);\n  this._byNs = {};\n\n  // An index of factory methods that generate query representations of the form:\n  //\n  //     { tuple: [ns, {motifName: queryArgs}]}\n  //\n  // This generated query representation prototypically inherits from\n  // this._tupleFactories[ns] in order to compose queries from > 1 query\n  // motifs in a chained manner.\n  //\n  // An example this._tupleFactories might look like:\n  //\n  //     this._tupleFactories = {\n  //       nsA: {\n  //         motifNameX: factoryX\n  //       }\n  //     }\n  this._tupleFactories = {};\n}\n\n/**\n * Creates a QueryMotifRegistry instance from json that has been generated from\n * QueryMotifRegistry#toJSON\n *\n * @param {Object} json\n * @return {QueryMotifRegistry}\n * @api public\n */\nQueryMotifRegistry.fromJSON = function (json) {\n  var registry = new QueryMotifRegistry\n    , noNs = registry._noNs = json['*'];\n\n  _register(registry, noNs);\n\n  delete json['*'];\n  for (var ns in json) {\n    var callbacksByName = json[ns];\n    _register(registry, callbacksByName, ns);\n  }\n  return registry;\n};\n\nfunction _register (registry, callbacksByName, ns) {\n  for (var motifName in callbacksByName) {\n    var callbackStr = callbacksByName[motifName]\n      , callback = unbundledFunction(callbackStr);\n    if (ns) registry.add(ns, motifName, callback);\n    else    registry.add(motifName, callback);\n  }\n}\n\nQueryMotifRegistry.prototype ={\n  /**\n   * Registers a query motif.\n   *\n   * @optional @param {String} ns is the namespace\n   * @param {String} motifName is the name of the nquery motif\n   * @param {Function} callback\n   * @api public\n   */\n  add: function (ns, motifName, callback) {\n    if (arguments.length === 2) {\n      callback = motifName;\n      motifName = ns\n      ns = null;\n    }\n    var callbacksByName;\n    if (ns) {\n      var byNs = this._byNs;\n      callbacksByName = byNs[ns] || (byNs[ns] = Object.create(this._noNs));\n    } else {\n      callbacksByName = this._noNs;\n    }\n    if (callbacksByName.hasOwnProperty(motifName)) {\n      throw new Error('There is already a query motif \"' + motifName + '\"');\n    }\n    callbacksByName[motifName] = callback;\n\n    var tupleFactories = this._tupleFactories;\n    tupleFactories = tupleFactories[ns] || (tupleFactories[ns] = Object.create(tupleFactoryProto));\n\n    tupleFactories[motifName] = function addToTuple () {\n      var args = Array.prototype.slice.call(arguments);\n      // deepCopy the args in case any of the arguments are direct references\n      // to an Object or Array stored in our Model Memory. If we don't do this,\n      // then we can end up having the query change underneath the registry,\n      // which causes problems because the rest of our code expects the\n      // registry to point to an immutable query.\n      this.tuple[1][motifName] = deepCopy(args);\n      return this;\n    };\n  }\n\n  /**\n   * Unregisters a query motif.\n   *\n   * @optional @param {String} ns is the namespace\n   * @param {String} motifName is the name of the query motif\n   * @api public\n   */\n, remove: function (ns, motifName) {\n    if (arguments.length === 1) {\n      motifName = ns\n      ns = null;\n    }\n    var callbacksByName\n      , tupleFactories = this._tupleFactories;\n    if (ns) {\n      var byNs = this._byNs;\n      callbacksByName = byNs[ns];\n      if (!callbacksByName) return;\n      tupleFactories = tupleFactories[ns];\n    } else {\n      callbacksByName = this.noNs;\n    }\n    if (callbacksByName.hasOwnProperty(motifName)) {\n      delete callbacksByName[motifName];\n      if (ns && ! Object.keys(callbacksByName).length) {\n        delete byNs[ns];\n      }\n      delete tupleFactories[motifName];\n      if (! Object.keys(tupleFactories).length) {\n        delete this._tupleFactories[ns];\n      }\n    }\n  }\n\n  /**\n   * Returns an object for composing queries in a chained manner where the\n   * chainable methods are named after query motifs registered with a ns.\n   *\n   * @param {String} ns\n   * @return {Object}\n   */\n, queryTupleBuilder: function (ns) {\n    var tupleFactories = this._tupleFactories[ns];\n    if (!tupleFactories) {\n      throw new Error('You have not declared any query motifs for the namespace \"' + ns + '\"' +\n                      '. You must do so via store.query.expose before you can query a namespaced ' +\n                      'collection of documents');\n    }\n    return Object.create(tupleFactories, {\n      tuple: { value: [ns, {}, null] }\n    });\n  }\n\n  /**\n   * Returns a json representation of the query, based on queryTuple and which\n   * query motifs happen to be registered at the moment via past calls to\n   * QueryMotifRegistry#add.\n   *\n   * @param {Array} queryTuple is [ns, {motifName: queryArgs}, queryId]\n   * @return {Object}\n   * @api public\n   */\n, queryJSON: function (queryTuple) {\n    // Instantiate a QueryBuilder.\n    // Loop through the motifs of the queryTuple, and apply the corresponding motif logic to augment the QueryBuilder.\n    // Tack on the query type in the queryTuple (e.g., 'one', 'count', etc.), if\n  // specified -- otherwise, default to 'find' type.\n    // Convert the QueryBuilder instance to json\n    var ns = queryTuple[0]\n      , queryBuilder = new QueryBuilder({from: ns})\n\n      , queryComponents = queryTuple[1]\n      , callbacksByName = this._byNs[ns]\n      ;\n\n    for (var motifName in queryComponents) {\n      var callback = callbacksByName\n                   ? callbacksByName[motifName]\n                   : this._noNs[motifName];\n      if (! callback) return null;\n      var queryArgs = queryComponents[motifName];\n      callback.apply(queryBuilder, queryArgs);\n    }\n\n    // A typeMethod (e.g., 'one', 'count') declared in query motif chaining\n    // should take precedence over any declared inside a motif definition callback\n    var typeMethod = queryTuple[2];\n    if (typeMethod) queryBuilder[typeMethod]();\n\n    // But if neither the query motif chaining nor the motif definition define\n    // a query type, then default to the 'find' query type.\n    if (! queryBuilder.type) queryBuilder.find();\n\n    return queryBuilder.toJSON();\n  }\n\n  /**\n   * Returns a JSON representation of the registry.\n   *\n   * @return {Object} JSON representation of `this`\n   * @api public\n   */\n, toJSON: function () {\n    var json = {}\n      , noNs = this._noNs\n      , byNs = this._byNs;\n\n    // Copy over query motifs not specific to a namespace\n    var curr = json['*'] = {};\n    for (var k in noNs) {\n      curr[k] = noNs[k].toString();\n    }\n\n    // Copy over query motifs specific to a namespace\n    for (var ns in byNs) {\n      curr = json[ns] = {};\n      var callbacks = byNs[ns];\n      for (k in callbacks) {\n        var cb = callbacks[k];\n        curr[k] = bundledFunction(cb);\n      }\n    }\n\n    return json;\n  }\n\n  /**\n   * @param {String} ns is the collection namespace\n   * @param {String} motifName is the name of the QueryMotif\n   * @return {Number} the arity of the query motif definition callback\n   */\n, arglen: function (ns, motifName) {\n    var cbsByMotif = this._byNs[ns];\n    if (!cbsByMotif) return;\n    var cb = cbsByMotif[motifName];\n    return cb && cb.length;\n  }\n}\n\nvar queryTypes = require('./types');\nvar tupleFactoryProto = {};\nfor (var t in queryTypes) {\n  (function (t) {\n    // t could be: 'find', 'one', 'count', etc. -- see ./types\n    tupleFactoryProto[t] = function () {\n      this.tuple[2] = t;\n      return this;\n    };\n  })(t);\n}\n\n//@ sourceURL=/node_modules/racer/lib/descriptor/query/QueryMotifRegistry.js"
));

require.define("/node_modules/racer/lib/context/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var mixinModel = require('./context.Model')\n  , mixinStore = __dirname + '/context.Store'\n  ;\n\nexports = module.exports = plugin;\n\nexports.useWith = {server: true, browser: true};\n\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  racer.mixin(mixinModel, mixinStore);\n}\n\n//@ sourceURL=/node_modules/racer/lib/context/index.js"
));

require.define("/node_modules/racer/lib/context/context.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  type: 'Model'\n, events: {\n    init: function (model) {\n      model.scopedContext = null;\n    }\n  }\n, proto: {\n    context: function (name) {\n      return Object.create(this, {\n        scopedContext: { value: name }\n      });\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/context/context.Model.js"
));

require.define("/node_modules/racer/lib/txns/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var mixinModel = require('./txns.Model')\n  , mixinStore = __dirname + '/txns.Store';\n\nexports = module.exports = plugin;\n\nexports.useWith = { server: true, browser: true };\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  racer.mixin(mixinModel, mixinStore);\n}\n\n//@ sourceURL=/node_modules/racer/lib/txns/index.js"
));

require.define("/node_modules/racer/lib/txns/txns.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// Generated by CoffeeScript 1.3.3\nvar Memory, Promise, RESEND_INTERVAL, SEND_TIMEOUT, Serializer, arrayMutator, createMiddleware, isPrivate, specCreate, transaction,\n  __slice = [].slice;\n\nMemory = require('../Memory');\n\nPromise = require('../util/Promise');\n\nSerializer = require('../Serializer');\n\ntransaction = require('../transaction');\n\nisPrivate = require('../path').isPrivate;\n\nspecCreate = require('../util/speculative').create;\n\ncreateMiddleware = require('../middleware');\n\narrayMutator = null;\n\nmodule.exports = {\n  type: 'Model',\n  \"static\": {\n    SEND_TIMEOUT: SEND_TIMEOUT = 10000,\n    RESEND_INTERVAL: RESEND_INTERVAL = 2000\n  },\n  events: {\n    mixin: function(Model) {\n      return arrayMutator = Model.arrayMutator, Model;\n    },\n    init: function(model) {\n      var bundlePromises, memory, specCache, txnQueue, txns;\n      if (bundlePromises = model._bundlePromises) {\n        bundlePromises.push(model._txnsPromise = new Promise);\n      }\n      model._specCache = specCache = {\n        invalidate: function() {\n          delete this.data;\n          return delete this.lastTxnId;\n        }\n      };\n      model._count = {\n        txn: 0\n      };\n      model._txns = txns = {};\n      model._txnQueue = txnQueue = [];\n      model._removeTxn = function(txnId) {\n        var i;\n        delete txns[txnId];\n        if (~(i = txnQueue.indexOf(txnId))) {\n          txnQueue.splice(i, 1);\n          specCache.invalidate();\n        }\n      };\n      memory = model._memory;\n      return model._onTxn = function(txn) {\n        var isLocal, txnQ, ver;\n        if (txn == null) {\n          return;\n        }\n        if (txnQ = txns[transaction.getId(txn)]) {\n          txn.callback = txnQ.callback;\n          txn.emitted = txnQ.emitted;\n        }\n        isLocal = 'callback' in txn;\n        ver = transaction.getVer(txn);\n        if (ver > memory.version || ver === -1) {\n          model._applyTxn(txn, isLocal);\n        }\n      };\n    },\n    middleware: function(_model, middleware) {\n      middleware.txn = createMiddleware();\n      middleware.txn.add(function(req, res, next) {\n        var args, arr, method, model, path, txn;\n        txn = req.data;\n        method = transaction.getMethod(txn);\n        args = transaction.getArgs(txn);\n        model = req.model;\n        model.emit('beforeTxn', method, args);\n        if ((path = args[0]) == null) {\n          return;\n        }\n        txn.isPrivate = isPrivate(path);\n        args = transaction.getArgs(txn);\n        txn.emitted = args.cancelEmit;\n        if (method === 'pop') {\n          txn.push((arr = model.get(path) || null) && (arr.length - 1));\n        } else if (method === 'unshift') {\n          txn.push((model.get(path) || null) && 0);\n        }\n        return next();\n      });\n      middleware.txn.add(function(req, res, next) {\n        var id, model, txn;\n        txn = req.data;\n        model = req.model;\n        id = transaction.getId(txn);\n        model._txns[id] = txn;\n        model._txnQueue.push(id);\n        return next();\n      });\n      middleware.txn.add(function(req, res, next) {\n        var model;\n        model = req.model;\n        res.out = model._specModel().$out;\n        return next();\n      });\n      middleware.txn.add(function(req, res, next) {\n        var args, method, model, out, txn;\n        txn = req.data;\n        args = transaction.getArgs(txn);\n        method = transaction.getMethod(txn);\n        if (method === 'push') {\n          out = res.out;\n          transaction.setMeta(out - args.length + 1);\n          txn.push(out - args.length + 1);\n        }\n        model = req.model;\n        model._commit(txn);\n        return next();\n      });\n      return middleware.txn.add(function(req, res, next) {\n        var args, method, model, out, txn;\n        out = res.out;\n        txn = req.data;\n        if (!txn.emitted) {\n          method = transaction.getMethod(txn);\n          args = transaction.copyArgs(txn);\n          model = req.model;\n          model.emit(method, args, out, true, model._pass);\n          txn.emitted = true;\n        }\n        return out;\n      });\n    },\n    bundle: function(model) {\n      model._txnsPromise.on(function(err) {\n        var clientId, store;\n        if (err) {\n          throw err;\n        }\n        clientId = model._clientId;\n        if (store = model.store) {\n          store._unregisterLocalModel(clientId);\n        } else {\n          console.warn(\"ALREADY UNREGISTERED SERVER MODEL\");\n          console.trace();\n        }\n        return store._startTxnBuffer(clientId);\n      });\n      model._specModel();\n      if (model._txnQueue.length) {\n        model.__removeTxn__ || (model.__removeTxn__ = model._removeTxn);\n        model._removeTxn = function(txnId) {\n          var len;\n          model.__removeTxn__(txnId);\n          len = model._txnQueue.length;\n          model._specModel();\n          if (len) {\n            return;\n          }\n          return process.nextTick(function() {\n            return model._txnsPromise.resolve();\n          });\n        };\n        return;\n      }\n      return model._txnsPromise.resolve();\n    },\n    socket: function(model, socket) {\n      var addRemoteTxn, commit, memory, onTxn, removeTxn, resend, resendInterval, setupResendInterval, teardownResendInterval, txnApplier, txnQueue, txns;\n      memory = model._memory, txns = model._txns, txnQueue = model._txnQueue, removeTxn = model._removeTxn, onTxn = model._onTxn;\n      socket.on('snapshotUpdate:replace', function(data, num) {\n        var toReplay, txn, txnId, _i, _len;\n        toReplay = (function() {\n          var _i, _len, _results;\n          _results = [];\n          for (_i = 0, _len = txnQueue.length; _i < _len; _i++) {\n            txnId = txnQueue[_i];\n            _results.push(txns[txnId]);\n          }\n          return _results;\n        })();\n        txnQueue.length = 0;\n        model._txns = txns = {};\n        model._specCache.invalidate();\n        txnApplier.clearPending();\n        if (num != null) {\n          txnApplier.setIndex(num + 1);\n        }\n        memory.eraseNonPrivate();\n        model._addData(data);\n        model.emit('reInit');\n        for (_i = 0, _len = toReplay.length; _i < _len; _i++) {\n          txn = toReplay[_i];\n          model[transaction.getMethod(txn)].apply(model, transaction.getArgs(txn));\n        }\n      });\n      socket.on('snapshotUpdate:newTxns', function(newTxns, num) {\n        var id, txn, _i, _j, _len, _len1;\n        for (_i = 0, _len = newTxns.length; _i < _len; _i++) {\n          txn = newTxns[_i];\n          onTxn(txn);\n        }\n        txnApplier.clearPending();\n        if (num != null) {\n          txnApplier.setIndex(num + 1);\n        }\n        for (_j = 0, _len1 = txnQueue.length; _j < _len1; _j++) {\n          id = txnQueue[_j];\n          commit(txns[id]);\n        }\n      });\n      txnApplier = new Serializer({\n        withEach: onTxn,\n        onTimeout: function() {\n          if (!model.connected) {\n            return;\n          }\n          return socket.emit('fetch:snapshot', memory.version + 1, model._startId, model._subs());\n        }\n      });\n      resendInterval = null;\n      resend = function() {\n        var id, now, txn, _i, _len;\n        now = +(new Date);\n        model._specModel();\n        for (_i = 0, _len = txnQueue.length; _i < _len; _i++) {\n          id = txnQueue[_i];\n          txn = txns[id];\n          if (!txn || txn.timeout > now) {\n            return;\n          }\n          commit(txn);\n        }\n      };\n      setupResendInterval = function() {\n        return resendInterval || (resendInterval = setInterval(resend, RESEND_INTERVAL));\n      };\n      teardownResendInterval = function() {\n        if (resendInterval) {\n          clearInterval(resendInterval);\n        }\n        return resendInterval = null;\n      };\n      if (model.connected) {\n        setupResendInterval();\n      } else {\n        model.once('connect', function() {\n          return setupResendInterval();\n        });\n      }\n      socket.on('disconnect', function() {\n        return teardownResendInterval();\n      });\n      model._addRemoteTxn = addRemoteTxn = function(txn, num) {\n        if (num != null) {\n          return txnApplier.add(txn, num);\n        } else {\n          return onTxn(txn);\n        }\n      };\n      socket.on('txn', addRemoteTxn);\n      socket.on('txnOk', function(rcvTxn, num) {\n        var txn, txnId, ver;\n        txnId = transaction.getId(rcvTxn);\n        if (!(txn = txns[txnId])) {\n          return;\n        }\n        ver = transaction.getVer(rcvTxn);\n        transaction.setVer(txn, ver);\n        return addRemoteTxn(txn, num);\n      });\n      socket.on('txnErr', function(err, txnId) {\n        var callback, callbackArgs, txn;\n        txn = txns[txnId];\n        if (txn && (callback = txn.callback)) {\n          if (transaction.isCompound(txn)) {\n            callbackArgs = transaction.ops(txn);\n          } else {\n            callbackArgs = transaction.copyArgs(txn);\n          }\n          callbackArgs.unshift(err);\n        }\n        removeTxn(txnId);\n        if (callback) {\n          return callback.apply(null, callbackArgs);\n        }\n      });\n      return model._commit = commit = function(txn) {\n        if (txn.isPrivate) {\n          return;\n        }\n        txn.timeout = +(new Date) + SEND_TIMEOUT;\n        if (!model.connected) {\n          return;\n        }\n        return socket.emit('txn', txn, model._startId);\n      };\n    }\n  },\n  server: {\n    _commit: function(txn) {\n      var req, res,\n        _this = this;\n      if (txn.isPrivate) {\n        return;\n      }\n      req = {\n        data: txn,\n        ignoreStartId: true,\n        clientId: this._clientId,\n        session: this.session\n      };\n      res = {\n        fail: function(err, txn) {\n          _this._removeTxn(transaction.getId(txn));\n          return txn.callback(err, txn);\n        },\n        send: function(txn) {\n          return _this._onTxn(txn);\n        }\n      };\n      return this.store.middleware.txn(req, res);\n    }\n  },\n  proto: {\n    force: function() {\n      return Object.create(this, {\n        _force: {\n          value: true\n        }\n      });\n    },\n    _commit: function() {},\n    _asyncCommit: function(txn, callback) {\n      var id;\n      if (!this.connected) {\n        return callback('disconnected');\n      }\n      txn.callback = callback;\n      id = transaction.getId(txn);\n      this._txns[id] = txn;\n      return this._commit(txn);\n    },\n    _nextTxnId: function() {\n      return this._clientId + '.' + this._count.txn++;\n    },\n    _queueTxn: function(txn, callback) {\n      var id;\n      txn.callback = callback;\n      id = transaction.getId(txn);\n      this._txns[id] = txn;\n      return this._txnQueue.push(id);\n    },\n    _getVersion: function() {\n      if (this._force) {\n        return null;\n      } else {\n        return this._memory.version;\n      }\n    },\n    _opToTxn: function(method, args, callback) {\n      var id, txn, ver;\n      ver = this._getVersion();\n      id = this._nextTxnId();\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: method,\n        args: args\n      });\n      txn.callback = callback;\n      return txn;\n    },\n    _sendToMiddleware: function(method, args, callback) {\n      var req, res, txn;\n      txn = this._opToTxn(method, args, callback);\n      req = {\n        data: txn,\n        model: this\n      };\n      res = {\n        fail: function(err) {\n          throw err;\n        },\n        send: function() {\n          return console.log(\"TODO\");\n        }\n      };\n      return this.middleware.txn(req, res);\n    },\n    _applyTxn: function(txn, isLocal) {\n      var callback, data, doEmit, isCompound, op, ops, out, txnId, ver, _i, _len;\n      if (txnId = transaction.getId(txn)) {\n        this._removeTxn(txnId);\n      }\n      data = this._memory._data;\n      doEmit = !txn.emitted;\n      ver = Math.floor(transaction.getVer(txn));\n      if (isCompound = transaction.isCompound(txn)) {\n        ops = transaction.ops(txn);\n        for (_i = 0, _len = ops.length; _i < _len; _i++) {\n          op = ops[_i];\n          this._applyMutation(transaction.op, op, ver, data, doEmit, isLocal);\n        }\n      } else {\n        out = this._applyMutation(transaction, txn, ver, data, doEmit, isLocal);\n      }\n      if (callback = txn.callback) {\n        if (isCompound) {\n          callback.apply(null, [null].concat(__slice.call(transaction.ops(txn))));\n        } else {\n          callback.apply(null, [null].concat(__slice.call(transaction.getArgs(txn)), [out]));\n        }\n      }\n      return out;\n    },\n    _applyMutation: function(extractor, txn, ver, data, doEmit, isLocal) {\n      var args, method, out, patch, _i, _len, _ref;\n      out = extractor.applyTxn(txn, data, this._memory, ver);\n      if (doEmit) {\n        if (patch = txn.patch) {\n          for (_i = 0, _len = patch.length; _i < _len; _i++) {\n            _ref = patch[_i], method = _ref.method, args = _ref.args;\n            this.emit(method, args, null, isLocal, this._pass);\n          }\n        } else {\n          method = transaction.getMethod(txn);\n          args = transaction.getArgs(txn);\n          this.emit(method, args, out, isLocal, this._pass);\n          txn.emitted = true;\n        }\n      }\n      return out;\n    },\n    _specModel: function() {\n      var cache, data, i, lastTxnId, len, op, ops, out, replayFrom, txn, txnQueue, txns, _i, _len;\n      txns = this._txns;\n      txnQueue = this._txnQueue;\n      while ((txn = txns[txnQueue[0]]) && txn.isPrivate) {\n        out = this._applyTxn(txn, true);\n      }\n      if (!(len = txnQueue.length)) {\n        data = this._memory._data;\n        data.$out = out;\n        return data;\n      }\n      cache = this._specCache;\n      if (lastTxnId = cache.lastTxnId) {\n        if (cache.lastTxnId === txnQueue[len - 1]) {\n          return cache.data;\n        }\n        data = cache.data;\n        replayFrom = 1 + txnQueue.indexOf(cache.lastTxnId);\n      } else {\n        replayFrom = 0;\n      }\n      if (!data) {\n        data = cache.data = specCreate(this._memory._data);\n      }\n      i = replayFrom;\n      while (i < len) {\n        txn = txns[txnQueue[i++]];\n        if (transaction.isCompound(txn)) {\n          ops = transaction.ops(txn);\n          for (_i = 0, _len = ops.length; _i < _len; _i++) {\n            op = ops[_i];\n            this._applyMutation(transaction.op, op, null, data);\n          }\n        } else {\n          out = this._applyMutation(transaction, txn, null, data);\n        }\n      }\n      cache.data = data;\n      cache.lastTxnId = transaction.getId(txn);\n      data.$out = out;\n      return data;\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/txns/txns.Model.js"
));

require.define("/node_modules/racer/lib/Serializer.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/**\n * Given a stream of out of order messages and an index, Serializer figures out\n * what messages to handle immediately and what messages to buffer and defer\n * handling until later, if the incoming message has to wait first for another\n * message.\n */\n\nvar DEFAULT_EXPIRY = 1000; // milliseconds\n\n// TODO Respect Single Responsibility -- place waiter code elsewhere\nmodule.exports = Serializer;\n\nfunction Serializer (options) {\n  this.withEach = options.withEach;\n  var onTimeout = this.onTimeout = options.onTimeout\n    , expiry = this.expiry = options.expiry;\n\n  if (onTimeout && ! expiry) {\n    this.expiry = DEFAULT_EXPIRY;\n  }\n\n  // Maps future indexes -> messages\n  this._pending = {};\n\n  var init = options.init;\n  // Corresponds to ver in Store and txnNum in Model\n  this._index = (init != null)\n              ? init\n              : 1;\n}\n\nSerializer.prototype = {\n  _setWaiter: function () {\n    if (!this.onTimeout || this._waiter) return;\n    var self = this;\n    this._waiter  = setTimeout( function () {\n      self.onTimeout();\n      self._clearWaiter();\n    }, this.expiry);\n  }\n\n, _clearWaiter: function () {\n    if (! this.onTimeout) return;\n    if (this._waiter) {\n      clearTimeout(this._waiter);\n      delete this._waiter;\n    }\n  }\n\n, add: function (msg, msgIndex, arg) {\n    // Cache this message to be applied later if it is not the next index\n    if (msgIndex > this._index) {\n      this._pending[msgIndex] = msg;\n      this._setWaiter();\n      return true;\n    }\n\n    // Ignore this message if it is older than the current index\n    if (msgIndex < this._index) return false;\n\n    // Otherwise apply it immediately\n    this.withEach(msg, this._index++, arg);\n    this._clearWaiter();\n\n    // And apply any messages that were waiting for txn\n    var pending = this._pending;\n    while (msg = pending[this._index]) {\n      this.withEach(msg, this._index, arg);\n      delete pending[this._index++];\n    }\n    return true;\n  }\n\n, setIndex: function (index) {\n    this._index = index;\n  }\n\n, clearPending: function () {\n    var index = this._index\n      , pending = this._pending;\n    for (var i in pending) {\n      if (i < index) delete pending[i];\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/Serializer.js"
));

require.define("/node_modules/racer/lib/middleware.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = function () {\n  var fns = [];\n  function run (req, res, done) {\n    var i = 0, out;\n    function next () {\n      var fn = fns[i++];\n      return fn ? (out = fn(req, res, next))\n                : done ? done() : out;\n    }\n    return next();\n  }\n\n  run.add = function (fn) {\n    fns.push(fn);\n    return this;\n  };\n\n  return run;\n};\n\n//@ sourceURL=/node_modules/racer/lib/middleware.js"
));

require.define("/node_modules/racer/lib/reconnect/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var mixinModel = require('./reconnect.Model')\n  , mixinStore = __dirname + '/reconnect.Store'\n\nexports = module.exports = plugin;\nexports.useWith = {server: true, browser: true};\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  racer.mixin(mixinModel, mixinStore);\n};\n\n//@ sourceURL=/node_modules/racer/lib/reconnect/index.js"
));

require.define("/node_modules/racer/lib/reconnect/reconnect.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  type: 'Model'\n\n, events: {\n    socket: function (model, socket) {\n      var memory = model._memory;\n      // When the store asks the browser model to re-sync with the store, then\n      // the model should send the store its subscriptions and handle the\n      // receipt of instructions to get the model state back in sync with the\n      // store state (e.g., in the form of applying missed transaction, or in\n      // the form of diffing to a received store state)\n      socket.on('resyncWithStore', function (fn) {\n        var subs = model._subs();\n        fn(subs, memory.version, model._startId);\n      });\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/reconnect/reconnect.Model.js"
));

require.define("/node_modules/racer/lib/racer.browser.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/** WARNING\n * All racer modules for the browser should be included in racer.coffee and not\n * in this file.\n */\n\n// Static isReady and model variables are used, so that the ready function can\n// be called anonymously. This assumes that only one instance of Racer is\n// running, which should be the case in the browser.\nvar IS_READY,\n    model;\n\nIS_READY = model = null;\n\nexports = module.exports = plugin;\nexports.useWith = { server: false, browser: true };\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  racer.init = function (tuple, socket) {\n    var clientId  = tuple[0]\n      , memory    = tuple[1]\n      , count     = tuple[2]\n      , onLoad    = tuple[3]\n      , startId   = tuple[4]\n      , ioUri     = tuple[5]\n      , ioOptions = tuple[6];\n\n    model = new this.protected.Model;\n    model._clientId = clientId;\n    model._startId  = startId;\n    model._memory.init(memory);\n    model._count = count;\n\n    for (var i = 0, l = onLoad.length; i < l; i++) {\n      var item = onLoad[i]\n        , method = item.shift();\n      model[method].apply(model, item);\n    }\n\n    racer.emit('init', model);\n\n    // TODO If socket is passed into racer, make sure to add clientId query param\n    ioOptions.query = 'clientId=' + clientId;\n    model._setSocket(socket || io.connect(ioUri + '?clientId=' + clientId, ioOptions));\n\n    IS_READY = true;\n    racer.emit('ready', model);\n    return racer;\n  };\n\n  racer.ready = function (onready) {\n    return function () {\n      if (IS_READY) return onready(model);\n      racer.on('ready', onready);\n    };\n  }\n}\n\n//@ sourceURL=/node_modules/racer/lib/racer.browser.js"
));

require.define("/node_modules/racer/lib/ot/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// Generated by CoffeeScript 1.3.3\nvar exports, mixinModel, mixinStore;\n\nmixinModel = require('./ot.Model');\n\nmixinStore = __dirname + '/ot.Store';\n\nexports = module.exports = function(racer) {\n  return racer.mixin(mixinModel, mixinStore);\n};\n\nexports.useWith = {\n  browser: true,\n  server: true\n};\n\nexports.decorate = 'racer';\n\n//@ sourceURL=/node_modules/racer/lib/ot/index.js"
));

require.define("/node_modules/racer/lib/ot/ot.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// Generated by CoffeeScript 1.3.3\nvar Field, OT_MUTATOR;\n\nField = require('./Field');\n\nmodule.exports = {\n  type: 'Model',\n  \"static\": {\n    OT_MUTATOR: OT_MUTATOR = 'mutator,otMutator'\n  },\n  events: {\n    init: function(model) {\n      var otFields;\n      model._otFields = otFields = {};\n      model.on('addSubData', function(data) {\n        var field, ot, path, _results;\n        if (ot = data.ot) {\n          _results = [];\n          for (path in ot) {\n            field = ot[path];\n            _results.push(otFields[path] = field);\n          }\n          return _results;\n        }\n      });\n    },\n    bundle: function(model) {\n      var field, fields, path, _ref;\n      fields = {};\n      _ref = model._otFields;\n      for (path in _ref) {\n        field = _ref[path];\n        if (field.toJSON) {\n          fields[path] = field.toJSON();\n        }\n      }\n      return model._onLoad.push(['_loadOt', fields]);\n    },\n    socket: function(model, socket) {\n      var memory, otFields;\n      otFields = model._otFields;\n      memory = model._memory;\n      return socket.on('otOp', function(_arg) {\n        var field, op, path, v;\n        path = _arg.path, op = _arg.op, v = _arg.v;\n        if (!(field = otFields[path])) {\n          field = otFields[path] = new Field(model, path);\n          return field.specTrigger().on(function() {\n            var val;\n            val = memory.get(path, model._specModel());\n            field.snapshot = (val != null ? val.$ot : void 0) || '';\n            return field.onRemoteOp(op, v);\n          });\n        } else {\n          return field.onRemoteOp(op, v);\n        }\n      });\n    }\n  },\n  proto: {\n    get: {\n      type: 'accessor',\n      fn: function(path) {\n        var at, val;\n        if (at = this._at) {\n          path = path ? at + '.' + path : at;\n        }\n        val = this._memory.get(path, this._specModel());\n        if (val && (val.$ot != null)) {\n          return this._otField(path, val).snapshot;\n        }\n        return val;\n      }\n    },\n    otInsert: {\n      type: OT_MUTATOR,\n      fn: function(path, pos, text, callback) {\n        var op;\n        op = [\n          {\n            p: pos,\n            i: text\n          }\n        ];\n        this._otField(path).submitOp(op, callback);\n      }\n    },\n    otDel: {\n      type: OT_MUTATOR,\n      fn: function(path, pos, len, callback) {\n        var del, field, op;\n        field = this._otField(path);\n        del = field.snapshot.substr(pos, len);\n        op = [\n          {\n            p: pos,\n            d: del\n          }\n        ];\n        field.submitOp(op, callback);\n        return del;\n      }\n    },\n    ot: function(path, value, callback) {\n      var at, finish, len,\n        _this = this;\n      if (at = this._at) {\n        len = arguments.length;\n        path = len === 1 || len === 2 && typeof value === 'function' ? (callback = value, value = path, at) : at + '.' + path;\n      }\n      finish = function(err, path, value, previous) {\n        var field;\n        if (!err && (field = _this._otFields[path])) {\n          field.specTrigger(true);\n        }\n        return typeof callback === \"function\" ? callback(err, path, value, previous) : void 0;\n      };\n      return this._sendToMiddleware('set', [\n        path, {\n          $ot: value\n        }\n      ], finish);\n    },\n    otNull: function(path, value, callback) {\n      var len, obj;\n      len = arguments.length;\n      obj = this._at && len === 1 || len === 2 && typeof value === 'function' ? this.get() : this.get(path);\n      if (obj != null) {\n        return obj;\n      }\n      if (len === 1) {\n        return this.ot(path);\n      } else if (len === 2) {\n        return this.ot(path, value);\n      } else {\n        return this.ot(path, value, callback);\n      }\n    },\n    isOtPath: function(path, nonSpeculative) {\n      var data, _ref;\n      data = nonSpeculative ? null : this._specModel();\n      return ((_ref = this._memory.get(path, data)) != null ? _ref.$ot : void 0) != null;\n    },\n    isOtVal: function(val) {\n      return !!(val && val.$ot);\n    },\n    _otField: function(path, val) {\n      var field;\n      path = this.dereference(path);\n      if (field = this._otFields[path]) {\n        return field;\n      }\n      field = this._otFields[path] = new Field(this, path);\n      val || (val = this._memory.get(path, this._specModel()));\n      field.snapshot = val && val.$ot || '';\n      return field;\n    },\n    _loadOt: function(fields) {\n      var json, path, _results;\n      _results = [];\n      for (path in fields) {\n        json = fields[path];\n        _results.push(this._otFields[path] = Field.fromJSON(json, this));\n      }\n      return _results;\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/ot/ot.Model.js"
));

require.define("/node_modules/racer/lib/ot/Field.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// Generated by CoffeeScript 1.3.3\nvar Field, Promise, Serializer, isSpeculative, text;\n\ntext = require('../../node_modules/share/lib/types/text');\n\nPromise = require('../util/Promise');\n\nSerializer = require('../Serializer');\n\nisSpeculative = require('../util/speculative').isSpeculative;\n\nField = module.exports = function(model, path, version, type) {\n  var _this = this;\n  this.model = model;\n  this.path = path;\n  this.version = version != null ? version : 0;\n  this.type = type != null ? type : text;\n  this.snapshot = null;\n  this.queue = [];\n  this.pendingOp = null;\n  this.pendingCallbacks = [];\n  this.inflightOp = null;\n  this.inflightCallbacks = [];\n  this.serverOps = {};\n  this.incomingSerializer = new Serializer({\n    init: this.version,\n    withEach: function(_arg, ver) {\n      var callback, docOp, err, isRemote, oldInflightOp, op, undo, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4;\n      op = _arg[0], isRemote = _arg[1], err = _arg[2];\n      if (isRemote) {\n        docOp = op;\n        if (_this.inflightOp) {\n          _ref = _this.xf(_this.inflightOp, docOp), _this.inflightOp = _ref[0], docOp = _ref[1];\n        }\n        if (_this.pendingOp) {\n          _ref1 = _this.xf(_this.pendingOp, docOp), _this.pendingOp = _ref1[0], docOp = _ref1[1];\n        }\n        _this.version++;\n        return _this.otApply(docOp, false);\n      } else {\n        oldInflightOp = _this.inflightOp;\n        _this.inflightOp = null;\n        if (err) {\n          if (!_this.type.invert) {\n            throw new Error(\"Op apply failed (\" + err + \") and the OT type does not define an invert function.\");\n          }\n          throw new Error(err);\n          undo = _this.type.invert(oldInflightOp);\n          if (_this.pendingOp) {\n            _ref2 = _this.xf(_this.pendingOp, undo), _this.pendingOp = _ref2[0], undo = _ref2[1];\n          }\n          _this.otApply(undo);\n          _ref3 = _this.inflightCallbacks;\n          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {\n            callback = _ref3[_i];\n            callback(err);\n          }\n          return _this.flush;\n        }\n        if (ver !== _this.version) {\n          throw new Error('Invalid version from server');\n        }\n        _this.serverOps[_this.version] = oldInflightOp;\n        _this.version++;\n        _ref4 = _this.inflightCallbacks;\n        for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {\n          callback = _ref4[_j];\n          callback(null, oldInflightOp);\n        }\n        return _this.flush();\n      }\n    },\n    timeout: 5000,\n    onTimeout: function() {\n      throw new Error(\"Did not receive a prior op in time. Invalid version would result by applying buffered received ops unless prior op was applied first.\");\n    }\n  });\n  model.on('change', function(_arg, isLocal) {\n    var d, i, oldSnapshot, op, p, _i, _len, _path, _ref;\n    _path = _arg[0], op = _arg[1], oldSnapshot = _arg[2];\n    if (_path !== path) {\n      return;\n    }\n    for (_i = 0, _len = op.length; _i < _len; _i++) {\n      _ref = op[_i], p = _ref.p, i = _ref.i, d = _ref.d;\n      if (i) {\n        model.emit('otInsert', [path, p, i], isLocal);\n      } else {\n        model.emit('otDel', [path, p, d], isLocal);\n      }\n    }\n  });\n};\n\nField.prototype = {\n  onRemoteOp: function(op, v) {\n    var docOp;\n    if (v < this.version) {\n      return;\n    }\n    if (v !== this.version) {\n      throw new Error(\"Expected version \" + this.version + \" but got \" + v);\n    }\n    docOp = this.serverOps[this.version] = op;\n    return this.incomingSerializer.add([docOp, true], v);\n  },\n  otApply: function(docOp, isLocal) {\n    var oldSnapshot;\n    if (isLocal == null) {\n      isLocal = true;\n    }\n    oldSnapshot = this.snapshot;\n    this.snapshot = this.type.apply(oldSnapshot, docOp);\n    this.model.emit('change', [this.path, docOp, oldSnapshot], isLocal);\n    return this.snapshot;\n  },\n  submitOp: function(op, callback) {\n    var type,\n      _this = this;\n    type = this.type;\n    op = type.normalize(op);\n    this.otApply(op);\n    this.pendingOp = this.pendingOp ? type.compose(this.pendingOp, op) : op;\n    if (callback) {\n      this.pendingCallbacks.push(callback);\n    }\n    return setTimeout(function() {\n      return _this.flush();\n    }, 0);\n  },\n  specTrigger: function(shouldResolve) {\n    var _this = this;\n    if (!this._specTrigger) {\n      this._specTrigger = new Promise;\n      this._specTrigger.on(function() {\n        return _this.flush();\n      });\n    }\n    if ((shouldResolve || this.model.isOtPath(this.path, true)) && !this._specTrigger.value) {\n      this._specTrigger.resolve(null, true);\n    }\n    return this._specTrigger;\n  },\n  flush: function() {\n    var shouldResolve,\n      _this = this;\n    if (!this._specTrigger) {\n      shouldResolve = !isSpeculative(this.model._specModel());\n      this.specTrigger(shouldResolve);\n      return;\n    }\n    if (this.inflightOp !== null || this.pendingOp === null) {\n      return;\n    }\n    this.inflightOp = this.pendingOp;\n    this.pendingOp = null;\n    this.inflightCallbacks = this.pendingCallbacks;\n    this.pendingCallbacks = [];\n    return this.model.socket.emit('otOp', {\n      path: this.path,\n      op: this.inflightOp,\n      v: this.version\n    }, function(err, msg) {\n      if (msg) {\n        return _this.incomingSerializer.add([_this.inflightOp, false, err], msg.v);\n      }\n    });\n  },\n  xf: function(client, server) {\n    var client_, server_;\n    client_ = this.type.transform(client, server, 'left');\n    server_ = this.type.transform(server, client, 'right');\n    return [client_, server_];\n  }\n};\n\nField.fromJSON = function(json, model) {\n  var field;\n  field = new Field(model, json.path, json.version);\n  field.snapshot = json.snapshot;\n  return field;\n};\n\n//@ sourceURL=/node_modules/racer/lib/ot/Field.js"
));

require.define("/node_modules/racer/node_modules/share/lib/types/text.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var append, checkValidComponent, checkValidOp, invertComponent, strInject, text, transformComponent, transformPosition;\ntext = {};\ntext.name = 'text';\ntext.create = text.create = function() {\n  return '';\n};\nstrInject = function(s1, pos, s2) {\n  return s1.slice(0, pos) + s2 + s1.slice(pos);\n};\ncheckValidComponent = function(c) {\n  var d_type, i_type;\n  if (typeof c.p !== 'number') {\n    throw new Error('component missing position field');\n  }\n  i_type = typeof c.i;\n  d_type = typeof c.d;\n  if (!((i_type === 'string') ^ (d_type === 'string'))) {\n    throw new Error('component needs an i or d field');\n  }\n  if (!(c.p >= 0)) {\n    throw new Error('position cannot be negative');\n  }\n};\ncheckValidOp = function(op) {\n  var c, _i, _len;\n  for (_i = 0, _len = op.length; _i < _len; _i++) {\n    c = op[_i];\n    checkValidComponent(c);\n  }\n  return true;\n};\ntext.apply = function(snapshot, op) {\n  var component, deleted, _i, _len;\n  checkValidOp(op);\n  for (_i = 0, _len = op.length; _i < _len; _i++) {\n    component = op[_i];\n    if (component.i != null) {\n      snapshot = strInject(snapshot, component.p, component.i);\n    } else {\n      deleted = snapshot.slice(component.p, component.p + component.d.length);\n      if (component.d !== deleted) {\n        throw new Error(\"Delete component '\" + component.d + \"' does not match deleted text '\" + deleted + \"'\");\n      }\n      snapshot = snapshot.slice(0, component.p) + snapshot.slice(component.p + component.d.length);\n    }\n  }\n  return snapshot;\n};\ntext._append = append = function(newOp, c) {\n  var last, _ref, _ref2;\n  if (c.i === '' || c.d === '') {\n    return;\n  }\n  if (newOp.length === 0) {\n    return newOp.push(c);\n  } else {\n    last = newOp[newOp.length - 1];\n    if ((last.i != null) && (c.i != null) && (last.p <= (_ref = c.p) && _ref <= (last.p + last.i.length))) {\n      return newOp[newOp.length - 1] = {\n        i: strInject(last.i, c.p - last.p, c.i),\n        p: last.p\n      };\n    } else if ((last.d != null) && (c.d != null) && (c.p <= (_ref2 = last.p) && _ref2 <= (c.p + c.d.length))) {\n      return newOp[newOp.length - 1] = {\n        d: strInject(c.d, last.p - c.p, last.d),\n        p: c.p\n      };\n    } else {\n      return newOp.push(c);\n    }\n  }\n};\ntext.compose = function(op1, op2) {\n  var c, newOp, _i, _len;\n  checkValidOp(op1);\n  checkValidOp(op2);\n  newOp = op1.slice();\n  for (_i = 0, _len = op2.length; _i < _len; _i++) {\n    c = op2[_i];\n    append(newOp, c);\n  }\n  return newOp;\n};\ntext.compress = function(op) {\n  return text.compose([], op);\n};\ntext.normalize = function(op) {\n  var c, newOp, _i, _len, _ref;\n  newOp = [];\n  if ((op.i != null) || (op.p != null)) {\n    op = [op];\n  }\n  for (_i = 0, _len = op.length; _i < _len; _i++) {\n    c = op[_i];\n    if ((_ref = c.p) == null) {\n      c.p = 0;\n    }\n    append(newOp, c);\n  }\n  return newOp;\n};\ntransformPosition = function(pos, c, insertAfter) {\n  if (c.i != null) {\n    if (c.p < pos || (c.p === pos && insertAfter)) {\n      return pos + c.i.length;\n    } else {\n      return pos;\n    }\n  } else {\n    if (pos <= c.p) {\n      return pos;\n    } else if (pos <= c.p + c.d.length) {\n      return c.p;\n    } else {\n      return pos - c.d.length;\n    }\n  }\n};\ntext.transformCursor = function(position, op, insertAfter) {\n  var c, _i, _len;\n  for (_i = 0, _len = op.length; _i < _len; _i++) {\n    c = op[_i];\n    position = transformPosition(position, c, insertAfter);\n  }\n  return position;\n};\ntext._tc = transformComponent = function(dest, c, otherC, type) {\n  var cIntersect, intersectEnd, intersectStart, newC, otherIntersect, s;\n  checkValidOp([c]);\n  checkValidOp([otherC]);\n  if (c.i != null) {\n    append(dest, {\n      i: c.i,\n      p: transformPosition(c.p, otherC, type === 'right')\n    });\n  } else {\n    if (otherC.i != null) {\n      s = c.d;\n      if (c.p < otherC.p) {\n        append(dest, {\n          d: s.slice(0, otherC.p - c.p),\n          p: c.p\n        });\n        s = s.slice(otherC.p - c.p);\n      }\n      if (s !== '') {\n        append(dest, {\n          d: s,\n          p: c.p + otherC.i.length\n        });\n      }\n    } else {\n      if (c.p >= otherC.p + otherC.d.length) {\n        append(dest, {\n          d: c.d,\n          p: c.p - otherC.d.length\n        });\n      } else if (c.p + c.d.length <= otherC.p) {\n        append(dest, c);\n      } else {\n        newC = {\n          d: '',\n          p: c.p\n        };\n        if (c.p < otherC.p) {\n          newC.d = c.d.slice(0, otherC.p - c.p);\n        }\n        if (c.p + c.d.length > otherC.p + otherC.d.length) {\n          newC.d += c.d.slice(otherC.p + otherC.d.length - c.p);\n        }\n        intersectStart = Math.max(c.p, otherC.p);\n        intersectEnd = Math.min(c.p + c.d.length, otherC.p + otherC.d.length);\n        cIntersect = c.d.slice(intersectStart - c.p, intersectEnd - c.p);\n        otherIntersect = otherC.d.slice(intersectStart - otherC.p, intersectEnd - otherC.p);\n        if (cIntersect !== otherIntersect) {\n          throw new Error('Delete ops delete different text in the same region of the document');\n        }\n        if (newC.d !== '') {\n          newC.p = transformPosition(newC.p, otherC);\n          append(dest, newC);\n        }\n      }\n    }\n  }\n  return dest;\n};\ninvertComponent = function(c) {\n  if (c.i != null) {\n    return {\n      d: c.i,\n      p: c.p\n    };\n  } else {\n    return {\n      i: c.d,\n      p: c.p\n    };\n  }\n};\ntext.invert = function(op) {\n  var c, _i, _len, _ref, _results;\n  _ref = op.slice().reverse();\n  _results = [];\n  for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n    c = _ref[_i];\n    _results.push(invertComponent(c));\n  }\n  return _results;\n};\nif (typeof WEB !== \"undefined\" && WEB !== null) {\n  exports.types || (exports.types = {});\n  bootstrapTransform(text, transformComponent, checkValidOp, append);\n  exports.types.text = text;\n} else {\n  module.exports = text;\n  require('./helpers').bootstrapTransform(text, transformComponent, checkValidOp, append);\n}\n//@ sourceURL=/node_modules/racer/node_modules/share/lib/types/text.js"
));

require.define("/node_modules/racer/node_modules/share/lib/types/helpers.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var bootstrapTransform;\nexports['_bt'] = bootstrapTransform = function(type, transformComponent, checkValidOp, append) {\n  var transformComponentX, transformX;\n  transformComponentX = function(left, right, destLeft, destRight) {\n    transformComponent(destLeft, left, right, 'left');\n    return transformComponent(destRight, right, left, 'right');\n  };\n  type.transformX = type['transformX'] = transformX = function(leftOp, rightOp) {\n    var k, l, l_, newLeftOp, newRightOp, nextC, r, r_, rightComponent, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2;\n    checkValidOp(leftOp);\n    checkValidOp(rightOp);\n    newRightOp = [];\n    for (_i = 0, _len = rightOp.length; _i < _len; _i++) {\n      rightComponent = rightOp[_i];\n      newLeftOp = [];\n      k = 0;\n      while (k < leftOp.length) {\n        nextC = [];\n        transformComponentX(leftOp[k], rightComponent, newLeftOp, nextC);\n        k++;\n        if (nextC.length === 1) {\n          rightComponent = nextC[0];\n        } else if (nextC.length === 0) {\n          _ref = leftOp.slice(k);\n          for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {\n            l = _ref[_j];\n            append(newLeftOp, l);\n          }\n          rightComponent = null;\n          break;\n        } else {\n          _ref2 = transformX(leftOp.slice(k), nextC), l_ = _ref2[0], r_ = _ref2[1];\n          for (_k = 0, _len3 = l_.length; _k < _len3; _k++) {\n            l = l_[_k];\n            append(newLeftOp, l);\n          }\n          for (_l = 0, _len4 = r_.length; _l < _len4; _l++) {\n            r = r_[_l];\n            append(newRightOp, r);\n          }\n          rightComponent = null;\n          break;\n        }\n      }\n      if (rightComponent != null) {\n        append(newRightOp, rightComponent);\n      }\n      leftOp = newLeftOp;\n    }\n    return [leftOp, newRightOp];\n  };\n  return type.transform = type['transform'] = function(op, otherOp, type) {\n    var left, right, _, _ref, _ref2;\n    if (!(type === 'left' || type === 'right')) {\n      throw new Error(\"type must be 'left' or 'right'\");\n    }\n    if (otherOp.length === 0) {\n      return op;\n    }\n    if (op.length === 1 && otherOp.length === 1) {\n      return transformComponent([], op[0], otherOp[0], type);\n    }\n    if (type === 'left') {\n      _ref = transformX(op, otherOp), left = _ref[0], _ = _ref[1];\n      return left;\n    } else {\n      _ref2 = transformX(otherOp, op), _ = _ref2[0], right = _ref2[1];\n      return right;\n    }\n  };\n};\nif (typeof WEB === 'undefined') {\n  exports.bootstrapTransform = bootstrapTransform;\n}\n//@ sourceURL=/node_modules/racer/node_modules/share/lib/types/helpers.js"
));

require.define("/lib/client.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// Generated by CoffeeScript 1.3.3\n(function() {\n  var racer;\n\n  racer = require('racer');\n\n  racer.use(require('racer/lib/ot'));\n\n  process.nextTick(function() {\n    racer.init(this.init);\n    return delete this.init;\n  });\n\n  racer.on('ready', function(model) {\n    var applyChange, editorvalue, genOp, prevValue, replaceText;\n    console.log(\"HIIII\", ui);\n    applyChange = function(newval) {\n      var commonEnd, commonStart, oldval;\n      oldval = model.get('_room.text');\n      console.log(\"old\", oldval, \"new\", newval);\n      if (oldval === newval) {\n        return;\n      }\n      commonStart = 0;\n      while (oldval.charAt(commonStart) === newval.charAt(commonStart)) {\n        commonStart++;\n      }\n      commonEnd = 0;\n      while (oldval.charAt(oldval.length - 1 - commonEnd) === newval.charAt(newval.length - 1 - commonEnd) && commonEnd + commonStart < oldval.length && commonEnd + commonStart < newval.length) {\n        commonEnd++;\n      }\n      if (oldval.length !== commonStart + commonEnd) {\n        model.otDel('_room.text', commonStart, oldval.length - commonStart - commonEnd);\n      }\n      if (newval.length !== commonStart + commonEnd) {\n        return model.otInsert('_room.text', commonStart, newval.substr(commonStart, newval.length - commonEnd));\n      }\n    };\n    editorvalue = prevValue = model.get('_room.text');\n    replaceText = function(newText, transformCursor) {\n      var newSelection;\n      newSelection = [transformCursor(editor.selectionStart), transformCursor(editor.selectionEnd)];\n      ui.model.set(\"code\", newText);\n      return ui.editor.cm.setValue(newText);\n    };\n    model.on('otInsert', '_room.text', function(pos, text, isLocal) {\n      if (isLocal) {\n        return;\n      }\n      return replaceText(editorvalue.slice(0, pos) + text + editorvalue.slice(pos), function(cursor) {\n        if (pos <= cursor) {\n          return cursor + text.length;\n        } else {\n          return cursor;\n        }\n      });\n    });\n    model.on('otDel', '_room.text', function(pos, text, isLocal) {\n      if (isLocal) {\n        return;\n      }\n      return replaceText(editorvalue.slice(0, pos) + editorvalue.slice(pos + text.length), function(cursor) {\n        if (pos < cursor) {\n          return cursor - Math.min(text.length, cursor - pos);\n        } else {\n          return cursor;\n        }\n      });\n    });\n    genOp = function(e) {\n      return setTimeout(function() {\n        editorvalue = ui.model.get(\"code\");\n        if (editorvalue !== prevValue) {\n          prevValue = editorvalue;\n          return applyChange(editorvalue.replace(/\\r\\n/g, '\\n'));\n        }\n      }, 0);\n    };\n    ui.model.on(\"change:code\", genOp);\n    return \"for event in ['input', 'keydown', 'keyup', 'select', 'cut', 'paste']\\n  if editor.addEventListener\\n    editor.addEventListener event, genOp, false\\n  else\\n    editor.attachEvent 'on' + event, genOp\";\n  });\n\n}).call(this);\n\n//@ sourceURL=/lib/client.js"
));
require("/lib/client.js");
})();
