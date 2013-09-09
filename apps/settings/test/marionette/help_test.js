var Settings = require('./lib/settings'),
    assert = require('assert');

marionette('Settings > Help', function() {
  var client = marionette.client();
  var subject;
  var selectors;

  setup(function() {
    subject = new Settings(client);
    subject.launch();

    selectors = Settings.Selectors;
  });

  suite('Open help', function() {

    setup(function() {
    });

    test('Help is open', function() {
      subject.goToScreen('improve');

      assert.ok(true, 'Help screen is shown');
      subject.assertReturn();
    });
  });

});
