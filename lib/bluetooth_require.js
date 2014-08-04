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
	type: 'text/javascript',
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
         * I attached "/apps" before 'url' here, so tha both of them has path start from /gaia.
         * */
        url = '/apps/' + url;
		//console.log(url);
		//require(TestUrlResolver.resolve(url), cb, options);
		require(url, cb, options);
	} 

};

/*
 * assign loader.require function to window.require property.
 * (originally, window does not have property .require)
 */
window.loader = new Loader(); // create a Loader object as window.loader property

//window.require = function(str){ console.log(str); };
window.require = loader.require.bind(loader);
window.requireApp = loader.requireApp.bind(loader);
//window.requireApp('/shared/');

window.TestUrlResolver = function() {
	var location = window.location;
	var domainParts = window.location.host.split('.');
	var addSubdomain = false;
	var prefix = null;
	if (domainParts.length > 2) {
		//running from gaiamobile.org subdomain
		addSubdomain = true;
	} else {
		//running from localhost
		addSubdomain = false;
	}
	return {
		PARSE_REGEX: /^(\/?)([\w\d-]+)\/(.*)/,
			parse: function tur_parse(url) {
				if (addSubdomain) {
					var parsedUrl = this.PARSE_REGEX.exec(url);
					var domain = location.protocol + '//' + parsedUrl[2] + '.';
					domain += domainParts.slice(1).join('.') + '/';
					return {
						domain: domain,
							host: parsedUrl[2],
							url: parsedUrl[3]
					};
				} else {
					throw new Error('you must run tests using real domains on localhost');
				}
			},
			resolve: function tur_resolve(url) {
				var parts = this.parse(url);
				return parts.domain + parts.url;
			}
	};
}();
window.TestUrlResolver = TestUrlResolver;

