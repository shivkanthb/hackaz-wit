var request = require('request');


// var user_input = 'Tucson';



var api_key = 'AIzaSyDYxorcyOCRYaQCyTzMHgnYUjIAZEdTw7w';
var base_url = 'https://maps.googleapis.com/maps/api/geocode/json';


var getLatLongFromLocation = function(user_input, callback) {
	var options = {
		url : base_url,
		qs : {
			address : user_input,
			key : api_key
		}
	};
	request.get(options, function(err, response, body) {
		if(err) throw err;
		body = JSON.parse(body);
		var result = {};

		if(body.status=="ZERO_RESULTS")
		{
			// console.log("OOPS");
			callback(null,result);
		}
		else
		{
			var components = body.results[0].address_components;
			// console.log(JSON.stringify(body.results[0].geometry.location));
			var lat = body.results[0].geometry.location.lat;
			var long = body.results[0].geometry.location.lng;
			var latlng = lat+","+long;
			callback(null,latlng);
		}		
	});
};

var getForecastFromAPI = function(location, cb) {
	
	var darksky_key = "679dabfb8a1db5a2d53599f4e10db597";
	getLatLongFromLocation(location, function(err, latlng) {
		if(err)
		{
			cb(err, null);
		}
		var url = "https://api.darksky.net/forecast/"+darksky_key+"/"+latlng;
		request.get(url, function(err, resp, body) {
			if(!err)
			{
				var body = JSON.parse(body);
				// console.log(JSON.stringify(body.currently.summary));
				cb(null, body.currently.summary);
			}
			else
			{
				cb(err, null);
			}
		});
	});
	
	
};

module.exports.getForecastFromAPI = getForecastFromAPI;


// getLatLongFromLocation(user_input, function(err, result) {
// 	if(Object.keys(result).length === 0)
// 		console.log("Im sorry I did not understand that. Provide a better input.");
// 	else
// 		console.log(result);
// });
// var darksky_key = "679dabfb8a1db5a2d53599f4e10db597";
// getForecastFromAPI(darksky_key, "33.4483771,-112.0740373");

// getForecastFromAPI(user_input, function(err, summary) {
// 	console.log(summary);
// });