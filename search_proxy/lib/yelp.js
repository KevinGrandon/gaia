var keys = require(__dirname + '/../keys.js');

var yelp = require("yelp").createClient(keys.yelp);

exports.request = function(query, lat, lon, callback) {
	var params = {
		term: query,
		limit: 6
	};

	if (lat && lon) {
		params.ll = lat + ',' + lon;
	} else {
		params.location = 'San Francisco, CA'
	}

	yelp.search(params, function(error, data) {
	  console.log(error);
	  callback(data)
	});	
}
