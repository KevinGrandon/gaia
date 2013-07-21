//"URL : https://api.everything.me/everything/2.1/
//{"query":"sauce","experienceId":"","typeHint":"","feature":"rtrn","cachedIcons":"","exact":true,"spellcheck":true,"suggest":true,"first":0,"limit":16,"idx":"","iconFormat":20,"prevQuery":"","clientInfo":"lc=en-US,tz=2,kb=","apiKey":"68f36b726c1961d488b63054f30d312c","v":"2.0.145","native":true,"sid":"69964af2-0b03-4616-8677-a54bc914ff78","stats":"{\"retryNum\":0,\"firstSession\":false}"}"

var eMeUrl = 'https://api.everything.me/everything/2.1/';

function everythingMeRequest(options, callback) {
    options = options || {};

    var params = '';
    
    for (var k in options) {
        if (typeof options[k] !== "undefined") {
            params += k + "=" + encodeURIComponent(options[k]) + "&";
        }
    }

    var https = require('https');
    var reqOptions = {
      host: 'api.everything.me',
      path: '/everything/2.1/Search/apps',
      port: 443,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': params.length
      }
    };

    var req = https.request(reqOptions, function(response) {
      var str = ''
      response.on('data', function (chunk) {
        str += chunk;
      });

      response.on('end', function () {
        callback(str);
      });
    });

    req.write(params);
    req.end();
}

var params = {
    "query": "games",
    "experienceId": "",
    "typeHint": "",
    "feature": "rtrn",
    "cachedIcons": "",
    "exact": true,
    "spellcheck": true,
    "suggest": true,
    "first": 0,
    "limit": 16,
    "idx": "",
    "iconFormat": 20,
    "prevQuery": "",
    "clientInfo": "lc=en-US,tz=2,kb=",
    "apiKey": "68f36b726c1961d488b63054f30d312c",
    "v": "2.0.145",
    "native": true,
    "sid": "69964af2-0b03-4616-8677-a54bc914ff78",
    "stats": "{\"retryNum\":0,\"firstSession\":false}"
}

var express = require('express');
var app = express();

app.get('/everythingme', function(req, res){
    var query = req.query.q;

    console.log('Got request for: ', query)

    params.query = query;

    everythingMeRequest(params, function(response) {
        response = JSON.parse(response);

        var suggestions = [];
        var urls = [];
        var images = [];
        
        for (var i = 0, each; each = response.response.apps[i]; i++) {
            suggestions.push(each.name);
            urls.push(each.appUrl);
            images.push('data:image/x-icon;base64,' + each.icon.data);
        }

        var openSearchResult = [query, suggestions, urls, images];
        res.send(openSearchResult);
    })
});

app.listen(80);

console.log('Server running at http://localhost:80/');
