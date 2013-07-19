
var OpenSearchPlugins = (function OpenSearchPlugins() {

'use strict';

function debug(str) {
  console.log('OpenSearchPlugins: ' + str + '\n');
}

var OpenSearch = {
  plugins: null,
  init: function os_init() {
    debug('init');

    asyncStorage.getItem('opensearch', (function(data) {
      this.plugins = JSON.parse(data);

      // Fire the ready callback if someone is looking at it.
      if (this._readyCallback) {
        this.retrieve();
      }
    }).bind(this));
  },

  add: function os_add(plugin) {
    debug('add');
    this.plugins[plugin.name] = plugin;

    asyncStorage.setItem('opensearch', JSON.stringify(this.plugins));
  },

  remove: function os_remove(plugin) {
    debug('remove');
    delete this.plugins[plugin.name];

    asyncStorage.setItem('opensearch', JSON.stringify(this.plugins));
  },

  getSuggestions: function os_getSuggestions(name, search, count, callback) {
    debug('getSuggestions');

    var plugin = this.plugins[name];
    if (!plugin || !plugin.suggestions) {
      debug('Can\'t find a plugin or suggestions for ' + name);
    }

    var suggestions = plugin.suggestions;
    var uri = suggestions.template.replace('{searchTerms}', search);

    // Apply search params if any.
    var params = '';
    var parameters = suggestions.parameters;
    for (var param in parameters) {
      if (params) {
        params += '&';
      }
      params += param + '=' + parameters[param].replace('{searchTerms}', search);
    }

    if (params) {
      uri += '?' + params;
    }

    var type = suggestions.type;

    var xhr = new XMLHttpRequest({mozSystem: true, mozAnon: true});
    xhr.open('GET', uri, true);
    xhr.responseType = type;
    xhr.onload = function() {
      switch (type) {
        case 'application/x-suggestions+json':
          debug('uri: ' + uri);
          debug('load: ' + xhr.responseText);
          var json = JSON.parse(xhr.responseText);

          var results = [];
          var baseURI = plugin.url.template;
          var keywords = json[1];
          var limit = Math.min(count || keywords.length);
          for (var i = 0; i < limit; i++) {
            var uri = baseURI.replace('{searchTerms}', keywords[i]);
            results.push({ 'title': keywords[i], 'uri': uri});
          }
          callback(results);
          break;

        default:
          debug('Unsupported type: ' + type);
          break;
      }
    };

    xhr.onerror = function() {
      debug('error: ' + xhr.status);
    };

    xhr.send();
  },

  _readyCallback: null,
  retrieve: function os_retrieve(callback) {
    if (this.plugins === null) {
      // The code is not ready yet, let's store the callback to fire it
      // later when the plugins database will be ready.
      this._readyCallback = callback;
      return;
    }

    var list = [];
    for (var plugin in this.plugins) {
      list.push({ 'name': plugin, 'icon': this.plugins[plugin].icon });
    }

    callback(list);
  }
};

var defaults = {
  'Bing': {
    'shortname': 'Bing',
    'icon': 'data:image/x-icon;base64,AAABAAIAEBAAAAAAAAD/AAAAJgAAACAgAAAAAAAA+AMAACUBAACJUE5HDQoaCgAAAA1JSERSAAAAEAAAABAIBgAAAB/z/2EAAADGSURBVDjLY/i/TPQ/JZiBOgZsd/z/f08AhCbLgJdH/4MBiKaaAWtUIK4i4DJUA95d/v//xsz//788+o8VPN4GMRCnATAAMuByF8IFx3NR1dxbjscAkCTI+dicDDIIBkAuxWoALs0wDLIABH5+QDIA5DeY0wmFPMhrMAA34Gw1QhAtkFAwyHWwAIZahkiJoBiAOQ1kILpmkMHIaqBRy4BiOihgYACkCBQ2IIwcrSBDkNIFZl7YaARxAShcYAaAMCxaaZOZKMAAOzkOfhyf540AAAAASUVORK5CYIKJUE5HDQoaCgAAAA1JSERSAAAAIAAAACAIBgAAAHN6evQAAAO/SURBVFjDxZRJTxRBFMfrJiC7enKJ28nEGL+AXo2J+gFcrkr0C4gLKjCAoILKIgKyjSZG40FFMephHERcLm4XVzTRi7I4DHRPL8/3qqq7q6d7ZIgRO/mFzlT1+/3fq6ZZ8lzB9smq3JGxQwtgPhmvyHk1XpO3kZF8/EgOjB2eX8hJbkY3/4WjOTBRkQuMbuaVCsHEsVwOoxTzhpROHs8TnMjDAMe8hX/KcQFJOZVIFQaYPEE//mMqBb9QyKlGInmQiFCASpkG0WPVoF7m5xio63OmSvCreqEgIkjUILVEPjCeRhIWQF2fCwmCZI5QSqeIunyYOilg7iZEf5QWYDQG6nrW1OQLaj08aQFM1RdAskHApmhRkopHAgHU9ayp84RJop6Q0lMFME2cRs4UYoA674HQAHIt2bgUtNt7+R76PYzUUAS0gb2QbF8npA35rjTpSKV4urEQZhopQL0YCUEFfAG+xEC7s4//netFz+iDZZA8XSiEUsrFTUUwc1bAnHRE6nEk6+K012U4AtbX8JD25Cjo17e6wplzRaAR55FmCnAG5RIqlOnihQb3wXTLMnf/tAp11roc9HtlfG/6lbpf5ko5LcWgI2xGngVhPKkJ7/hNP2hYXN3LaZLjVEZKaO0rwHwbDdQx7uzkUr2VKIFUWwkGOItFJMZIMID54SaoewRFvpH6xup2WQzWx1v+YtoE6G1CnLqAtGMA9yHEfBoMoPesB3WPdr5Y0OyhN4txujgdRjcEG7q3i4uNi6UcphYyn9YGHlDXOS0enkzSVsw71J0OkfTLelEHRkepoBMDqMnN+MHgBMJEUpZSueBJeYe8y5AAT8rBRDGniwLIxDx12MiGyr11pTNV5iLHysEOreHyYL2rG1G8CMxLApZe0PqU9uLoE2Bc2+TvTOlQFTpQd9aNzfxZ37/y6G0utYhuAfN1QHSvBPvHy0AI6kYIJYqQztJwxkrykfKg/OcrsC6vdsVWj4D5Cjn0rgL7Wzz4QUiMgv26FayBbWD2r+JnyOnHwgPbwX7TyvcEPmLf42BdWe1KrZ7FYPUKmJM+DCu2P7Rg1lfiC9jxA5641xPbRB8FwBeCMDNB5/VgN9jvLmcXhqTvr4D9cI9P6Ir7/DDnbcyEe2YOeI72XRz3YDo7cMxrgl2GSDn9AmZiUZWAsOcPhHWYSahIVRh/IWYjrKvZZBmlSwTRJQAISxdk7CobWYYuXXHUA5wARlfJkD1XyawyD1Bk6Rhdpc+Z1lG4Fm+G/1bkEhX8SczlnaXP8Juz5TddEmZvDz4eOQAAAABJRU5ErkJggg==',
    'description': 'Bing opensearch plugin',
    'encoding': 'UTF-8',
    'url': {
      'method': 'get',
      'type': 'text/html',
      'template': '"http://www.bing.com/search?q={searchTerms}&amp;FORM=MO0001'
    },
    'suggestions': {
      'method': 'get',
      'type': 'application/x-suggestions+json',
      'template': 'http://api.bing.com/osjson.aspx',
      'parameters': {
        'query': '{searchTerms}',
        'form': 'OSDJAS'
      }
    }
  },

  'Wikipedia': {
    'shortname': 'Wikipedia',
    'icon': 'data:image/x-icon;base64,AAABAAIAEBAAAAAAAAA4AQAAJgAAACAgAAAAAAAAJAMAAGQBAACJUE5HDQoaCgAAAA1JSERSAAAAEAAAABAIBgAAAB/z/2EAAAEFSURBVDjLxZPRDYJAEESJoQjpgBoM/9IBtoAl4KcUQQlSAjYgJWAH0gPmyNtkzEEuxkQTPzawc3Ozc3MQTc/JfVPR/wW6a+eKQ+Hyfe54B2wvrfXVqXLDfTCMd3j0VHksrTcH9bl2aZq+BCgEwCCPj9E4TdPYGj0C9CYAKdkmBrIIxiIYbvpbb2sSl8AiA+ywAbJE5YLpCImLU/WRDyIAWRgu4k1s4v50ODru4haYSCk4ntkuM0wcMAINXiPKTJQ9CfgB40phBr8DyFjGKkKEhYhCY4iCDgpAYAM2EZBlhJnsZxQUYBNkSkfBvjDd0ttPeR0mxREQ+OhfYOJ6EmL+l/qzn2kGli9cAF3BOfkAAAAASUVORK5CYIKJUE5HDQoaCgAAAA1JSERSAAAAIAAAACAIBgAAAHN6evQAAAIKSURBVFjD7ZdBSgNRDIYLguAB7FLwAkXwBl0JgiDYjQcY8ARduBJKu3I5C0EoWDxAT9AL9AK9QBeCIHQlCM/3DZOSmeZNZ2r1bQyEGV7yXv7kJZlJq6XIOXfs+crzwPPTnvnR863n05ZFufDD/T595Q4eauM37u/pWYwfeX53cegcABcuHg0AkEQE8AKAu4gAXv8BrAEMh0PXbrddt9t1vV4v406nk62laeqm02n2LjKYIuK5WCyyfeiLDF32yLn6TJ5mBFarlev3+9nBMMqsabkYhmezWcEd2ctTE/tYBwhgt14BhtmAV2VaLpdrAHioCW+VdwWy9IMAUBQjJcQFTwGqvcTD+Xy+oc8askZJyAYrnKEokCeWLpQkSSZvBIANYgSDVVEQQJaeyHQu1QIgiQNb6AmrTtaQ9+RFSLa1D4iXgfsrVITloeSFFZlaAEjAUMaXo2DJWQtVRe1OKF5aJUkf0NdglXO5VzQGoI2USwwD3LEl590CtdO3QBoT5WSFV+Q63Oha17ITgMlkslGSGBWPdeNiDR2SL1B6zQFINmOAkFOW5eTSURCdvX6OdUlapaWjsKX0dgOg26/VWHSUKhrPz35ISKwq76R9Wx+kKgC1f0o5mISsypUG3kPj2L/lDzKYvEUwzoh2JtPRdQQAo1jD6afne88H1oTMeH6ZK+x7PB/lQ/CJtvkNEgDh1dr/bVYAAAAASUVORK5CYII=',
    'description': 'Wikipedia opensearch plugin',
    'encoding': 'UTF-8',
    'url': {
      'method': 'get',
      'type': 'text/html',
      'template': 'http://en.wikipedia.org/wiki/Special:Search?search={searchTerms}'
    },

    'suggestions': {
      'method': 'get',
      'type': 'application/x-suggestions+json',
      'template': 'http://en.wikipedia.org/w/api.php',
      'parameters': {
        'action': 'opensearch',
        'search': '{searchTerms}'
      }
    }
  }
};

asyncStorage.setItem('opensearch', JSON.stringify(defaults), function() {
  OpenSearch.init();
});

return OpenSearch;
})();
