var path = require('path');

var createPattern = function(path) {
  return { pattern: path, included: true, served: true, watched: false };
};

var framework = function(files) {
  files.unshift(createPattern(__dirname + '/lib/require.js'));
  files.unshift(createPattern(__dirname + '/lib/mocks_helper.js'));
};

framework.$inject = ['config.files'];
module.exports = {'framework:test-agent': ['factory', framework]};
