var express = require('express');
var app = express();
var everythingme = require(__dirname + '/lib/everythingme.js');
var marketplace = require(__dirname + '/lib/marketplace.js');

app.get('/everythingme', function(req, res){
    var query = req.query.q;

    console.log('Got everythingme request for: ', query)

    everythingme.request(query, function(response) {
        response = JSON.parse(response);

        var suggestions = [];
        var urls = [];
        var images = [];
        
        for (var i = 0, each; each = response.response.apps[i]; i++) {

            // Hard limit to 12 for now
            if (i >= 12)
                break;

            suggestions.push(each.name);
            urls.push(each.appUrl);
            images.push('data:image/x-icon;base64,' + each.icon.data);
        }

        var openSearchResult = [query, suggestions, urls, images];
        res.send(openSearchResult);
    })
});

app.get('/marketplace', function(req, res){
    var query = req.query.q;

    console.log('Got marketplace request for: ', query)

    marketplace.request(query, function(response) {
        response = JSON.parse(response);

        var suggestions = [];
        var urls = [];
        var images = [];
        
        for (var i = 0, each; each = response.objects[i]; i++) {

            // Hard limit to 12 for now
            if (i >= 12)
                break;

            suggestions.push(each.name);
            urls.push(each.absolute_url);
            images.push(each.icons['64']);
        }

        var openSearchResult = [query, suggestions, urls, images];
        res.send(openSearchResult);
    })
});

app.listen(80);

console.log('Server running at http://localhost:80/');
