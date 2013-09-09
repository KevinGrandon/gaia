var Settings = require('./lib/settings'),
    assert = require('assert');

marionette('Settings > Improve ffos', function() {
  var client = marionette.client();
  var subject;
  var selectors;

  setup(function() {
    subject = new Settings(client);
    subject.launch();

    selectors = Settings.Selectors;
  });

  suite('Open improve ffos', function() {
    test('Improve ffos is open', function() {
      subject.goToScreen('improve');

      assert.ok(true, 'Improve ffos screen is shown');
      subject.assertReturn();
    });
  });

  suite('Submit performance data', function() {
    test('Action persists', function() {
      subject.goToScreen('improve');

      client.helper.waitForElement(selectors.improveSubmitDataSpan);

      var checkbox = client.findElement(selectors.improveSubmitDataInput);
      assert.equal(false, !!checkbox.getAttribute('checked'), 'default false');

      var handle = client.findElement(selectors.improveSubmitDataSpan);
      handle.click();

      subject.relaunch();

      subject.goToScreen('improve');

      var checkbox = client.findElement(selectors.improveSubmitDataInput);
      assert.ok(checkbox.getAttribute('checked'), 'value is persisted');
    });

  });

});
