
'use strict'
require('/build/utils.js');

var apps = [ 'bluetooth'];
var file;
 apps.forEach(function(app){
   file = utils.getFile('/base/apps/' + app + '/test/unit/setup.js')
   if(file.exists()){
      console.log("Found test/unit/setup.js of "+ app);
      requireApp('/base/apps/'+ app + '/test/unit/setup.js');
   }else{
      console.log(app + 'not found');
   }
});
