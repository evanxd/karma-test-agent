'use strict'
// I remove the properties 'TestAgent' since we are not using test-agent
var Loader = window.Loader = function Loader(options) {
	var key;
	this._cached = {};
	//queue stuff
	this._queue = [];
	this.doneCallbacks = [];
	if (typeof(options) === 'undefined') {
		options = {};
	}
	for (key in options) {
		if (options.hasOwnProperty(key)) {
			this[key] = options[key];
		}
	}
};
Loader.prototype = {
	/**
	 * Queue for script loads.
	 */
	_queue: null,
	/**
	 * Used for queue identification.
	 */
	_currentId: null,
	/**
	 * Prefix for all loaded files
	 *
	 * @type String
	 */
	prefix: '',
	/**
	 * javascript content type.
	 *
	 *
	 * @type String
	 */
	type: 'application/javascript;version=1.8',
	/**
	 * When true will add timestamps to required urls via query param
	 *
	 * @type Boolean
	 */
	bustCache: true,
	/**
	 * Current window in which required files will be injected.
	 *
	 * @private
	 * @type Window
	 */
	_targetWindow: window,
	/**
	 * Cached urls
	 *
	 * @type Object
	 * @private
	 */
	_cached: null,
	get targetWindow() {
		return this._targetWindow;
	},
	set targetWindow(value) {
		this._targetWindow = value;
		this._cached = {};
	},
	_fireCallbacks: function _fireCallbacks() {
		var callback;
		while ((callback = this.doneCallbacks.shift())) {
			callback();
		}
	},
	/**
	 * Adds a done callback.
	 * You may call this function multiple times.
	 *
	 * @param {Function} callback called after all scripts are loaded.
	 */
	done: function done(callback) {
		this.doneCallbacks.push(callback);
		return this;
	},
	/**
	 * Begins an item in the queue.
	 */
	_begin: function() {
		var item = this._queue[0];
		if (item) {
			item();
		} else {
			this._fireCallbacks();
		}
	},
	/**
	 * Moves to the next item in the queue.
	 */
	_next: function() {
		this._queue.shift();
		this._begin();
	},
	/**
	 * Loads given script into current target window.
	 * If file has been previously loaded it will not
	 * be loaded again.
	 *
	 * @param {String} url location to load script from.
	 * @param {String} callback callback when script loading is complete.
	 */
	require: function(url, callback, options) {
		this._queue.push(
				this._require.bind(this, url, callback, options)
				);
		if (this._queue.length === 1) {
			this._begin();
		}
	},
	/**
	 * Function that does the actual require work work.
	 * Handles calling ._next on cached file or on onload
	 * success.
	 *
	 * @private
	 */
	_require: function require(url, callback, options) {
		url = '/base' + url;
		//console.log(url);
		var prefix = this.prefix,
		suffix = '',
		self = this,
		element,
		key,
		document = this.targetWindow.document;
		if (url in this._cached) {
			if (callback) {
				callback();
			}
			return this._next();
		}
		if (this.bustCache) {
			suffix = '?time=' + String(Date.now());
		}
		this._cached[url] = true;
		url = prefix + url + suffix;
		element = document.createElement('script');
		element.src = url;
		element.async = false;
		element.type = this.type;
		if (options) {
			for (key in options) {
				if (options.hasOwnProperty(key)) {
					element.setAttribute(key, options[key]);
				}
			}
		};
		function oncomplete() {
			if (callback) {
				callback();
			}
			self._next();
		}
		//XXX: should we report missing
		//files differently ? maybe
		//fail the whole test case
		//when a file is missing...?
		element.onerror = oncomplete;
		element.onload = oncomplete;
		document.getElementsByTagName('head')[0].appendChild(element);
	},
	requireApp: function(url, cb, options){

	      /*
               * Since the default start path of require() is /gaia root, while requireApp() is /gaia/apps,
               * this causes karma confused to load module with path set in requireApp(), to unify them in this file,
               * I attached "/apps" or '/apps/' before 'url' here, so tha both of them has path start from /gaia.
               * */
               if(url.charAt(0) === '/')  // such as /apps/video
                  url = '/apps' + url;
               else
                  url = '/apps/' + url;   // such as /apps/bluetooh
		//console.log(url);
		//require(TestUrlResolver.resolve(url), cb, options);
		require(url, cb, options);
	},
	requireCommon:  function(url, cb) {
  /**
   * Require a file from /common/ resources.
   *
   * Usage: requireCommon('vendor/mocha/mocha.js');
   *
   * @param {String} url relative location of file.
   * @param {Function} cb optional callback called
   *                      when resource has been loaded.
   */		
    	require('/dev_apps/test-agent/common/' + url, cb);
  	},
	suiteTemplate: function(is, attrs) {
  /**
   * Appends a templated node to the body for a suite
   * Removes the node at teardown.
   * @param {String} is the type of element.
   * @param {Object} attrs optional attributes.
   */
    var testElement;

    setup(function ta_template() {
      var foundElement = htmlFragments.querySelector('element[name="' + is + '"]');
      testElement = document.createElement(foundElement.getAttribute('extends') || 'div');
      var template = foundElement.querySelector('template');
      testElement.innerHTML = template.innerHTML;

      attrs = attrs || {};
      for (var i in attrs) {
        testElement.setAttribute(i, attrs[i]);
      }

      document.body.appendChild(testElement);
    });

    teardown(function ta_teardown() {
      testElement.parentNode.removeChild(testElement);
    });
  },
  requireElements: function(url) {

    url = TestUrlResolver.resolve(url);

    if (requestedFragments[url]) {
      return;
    }
    requestedFragments[url] = true;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false /* intentional sync */);
    xhr.send();

    if (!htmlFragments) {
      htmlFragments = document.createElement('div');
    }
    htmlFragments.innerHTML += xhr.responseText;
  }
};

/*
 * assign loader.require function to window.require property.
 * (originally, window does not have property .require)
 */
window.loader = new Loader(); // create a Loader object as window.loader property
window.require = loader.require.bind(loader);
window.requireApp = loader.requireApp.bind(loader);
window.requireCommon = loader.requireCommon.bind(loader);
window.requireElements = loader.requireElements.bind(loader);
window.suiteTemplate = loader.suiteTemplate.bind(loader);
/* Issue: I think the part above should be enclosed with 
 * (function(window){
 *	...	
 * }(this));
 * so that it could avert to use Loader?
 */


/* The following is sourced from gaia/dev_apps/test_agent/commmom/test/helper.js
 * This part should be move
 */
   // register the global
  window.navigator;

  var htmlFragments;
  var requestedFragments = {};

  var Common = window.CommonResourceLoader,
      // mocha test methods we want to provide
      // yield support to.
      testMethods = [
        'suiteSetup',
        'setup',
        'test',
        'teardown',
        'suiteTeardown'
      ];

  // chai has no backtraces in ff
  // this patch will change the error
  // class used to provide real .stack.
  function patchChai(Assertion) {
    function chaiAssert(expr, msg, negateMsg, expected, actual) {
      actual = actual || this.obj;
      var msg = (this.negate ? negateMsg : msg),
          ok = this.negate ? !expr : expr;

      if (!ok) {
        throw new Error(
          // include custom message if available
          this.msg ? this.msg + ': ' + msg : msg
        );
      }
    }
    Assertion.prototype.assert = chaiAssert;
  }

  // template
  requireCommon('test/template.js');

  // load chai
  window.requireCommon('vendor/chai/chai.js', function() {
    chai.Assertion.includeStack = true;
    patchChai(chai.Assertion);
    window.assert = chai.assert;
  });

  // mocha helpers
  window.requireCommon('test/mocha_task.js');
  window.requireCommon('test/mocha_generators.js', function() {
    testMethods.forEach(function(method) {
      testSupport.mochaGenerators.overload(method);
    });
  });

  // url utilities
  window.requireCommon('test/test_url_resolver.js');

  /* The following is sourced from /gaia/dev_apps/test_agent/commmom/test/sinon_helper.js */
  // load sinon.js
window.requireCommon('vendor/sinon/sinon.js', function() {
  setup(function() {
    this.sinon = sinon.sandbox.create();
  });

  teardown(function() {
    this.sinon.restore();
    this.sinon = null;
  });
});

