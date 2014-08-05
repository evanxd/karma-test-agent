
'use strict'

var fs = require('fs');

var apps = [ 'bluetooth', 'bookmark', 'browser', 'calendar', 'callscreen', 'camera', 
			 'clock', 'collection', 'communications', 'costcontrol', 'email',
			 'emergency-call', 'findmydevice', 'fl', 'fm', 'ftu', 'gallery',
			 'homescreen', 'keyboard', 'marketplace.firefox.com', 'music', 'operatorvariant',
			 'pdfjs', 'ringtones', 'search', 'setting', 'sharedtest', 'sms',
			 'system', 'verticalhome', 'video', 'wallpaper', 'wappush'  
	];

 apps.forEach(function(app){
   fs.exists('apps/'+ app +'/test/unit/setup.js', function(exists){
      console.log(exists ? "Found test/unit/setup.js of "+ app : app + " not found");

      if(exists)
      	requireApp('apps/'+ app + '/test/unit/setup.js');

   });
});
