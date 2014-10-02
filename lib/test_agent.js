(function(window){
  /* Source from /gaia/dev_apps/test-agent/agent.js */
  var Loader = window.CommonResourceLoader = {},
      domain = document.location.host;

  Loader.domain = document.location.protocol + '//' + domain;
  Loader.url = function(url){
    return this.domain + url;
  }

  Loader.script = function(url, doc){
    doc = doc || document;
    doc.write('<script type="application/javascript;version=1.8" src="' + this.url(url) + '"><\/script>');
    return this;
  };

  Loader.stylesheet = function(url, doc){
    doc = doc || document;
    doc.write('<link rel="stylesheet" type="text/css" href="' + this.url(url) + '">');
    return this;
    };


    /* Source from /dev_apps/test-agent/common/test/mocha_generator.js */
      var support;

  if (typeof(window.testSupport) === 'undefined') {
    window.testSupport = {};
  }

  support = window.testSupport;
  support.mochaGenerators = {

    /**
     * Overloads a test function to be capable
     * of using generators/yield for control flow.
     *
     *    test('yield', function(){
     *      function sleep(time) {
     *        setTimeout(time, MochaTask.next);
     *      }
     *
     *      yield sleep(5);
     *
     *      //..
     *
     *    });
     *
     *
     * @param {String} type name of mocha function.
     */
    overload: function overload(type) {
      var orig = window[type];

      /**
       * async tests fall off the stack
       * bring them back by providing the done fn
       */
      function wrapDone(done) {
        return function(val) {
          if (typeof(val) === 'function') {
            try {
              val();
              return done();
            } catch (e) {
              return done(e);
            }
          } else {
            return done.apply(this, arguments);
          }
        }
      }

      window[type] = function() {
        var args = Array.prototype.slice.call(arguments),
            cb = args.pop();

        function wrapper(origDone) {
          var gen, useDone = cb.length > 0;
          var done = wrapDone(origDone);

          if (useDone) {
            gen = cb.call(this, done);
          } else {
            gen = cb.call(this);
          }

          if (gen && gen.next) {
            MochaTask.start(gen, function(e) {
              done();
            }, function(e) {
              done(e);
            });
          } else {
            if (!useDone) {
              done();
            }
          }
        }

        wrapper.toString = function() {
          return cb.toString();
        }

        args.push(wrapper);
        orig.apply(window, args);
      }
    }
  };

}(this));
