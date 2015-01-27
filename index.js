var path = require('path');
var fs = require('fs');

var createPattern = function(path) {
  return { pattern: path, included: true, served: true, watched: false };
};

var framework = function(files) {
  var setups =	checkSetup();
  files.unshift(createPattern(__dirname + '/lib/require.js'));
  for(setup in setups){
  	files.unshift(createPattern(setups[setup]));
  }
  //files.unshift(createPattern(__dirname + '/lib/mocks_helper.js'));
  //files.unshift(createPattern(__dirname + '/lib/test_agent.js'));
};

var checkSetup = function(){
	var setups = [];	
	var appsPath = path.resolve(__dirname, '../../') + '/apps/';
	var appsName = fs.readdirSync(appsPath);
	for(apps in appsName){
		var pattern = appsPath + appsName[apps] + '/test/unit/setup.js';
//console.log(pattern); //VECK
		if(fs.existsSync(pattern))
			setups.push(pattern);
	}

	return setups;
}

framework.$inject = ['config.files'];
module.exports = {'framework:test-agent': ['factory', framework]};
