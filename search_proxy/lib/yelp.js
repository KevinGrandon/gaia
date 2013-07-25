var keys = require(__dirname + '/../keys.js');

var yelp = require("yelp").createClient(keys.yelp);

exports.request = function(query, callback) {
	yelp.search({term: query, location: "France"}, function(error, data) {
	  console.log(error);
	  callback(data)
	});	
}
