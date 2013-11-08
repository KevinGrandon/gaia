'use strict';

requireApp('rocketscreen/test/unit/mock_app.js');
// import both MockPage and MockDock
requireApp('rocketscreen/test/unit/mock_page.js');

require('/shared/js/screen_layout.js');
requireApp('rocketscreen/js/dock.js');

var mocksHelper = new MocksHelper([
  'Page',
  'Dock'
]);

mocksHelper.init();

suite('dock.js >', function() {
  var wrapperNode;
  var dock;
  var dockContainer;
  var iconsContainer;
  var tapThreshold = 10;

  var defaultGridGetIcon;

  var tinyImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///' +
                  'ywAAAAAAQABAAACAUwAOw==';

  suiteSetup(function() {
    mocksHelper.suiteSetup();
  });

  suiteTeardown(function() {
    mocksHelper.suiteTeardown();
  });

  setup(function() {
    mocksHelper.setup();
    setupDom();
  });

  teardown(function() {
    mocksHelper.teardown();
  });

  function setupDom() {
    var fakeMarkup =
      '<div id="fake-icon-name-wrapper">' +
        '<div id="fake-icon-name">' +
      '</div>' +
      '<div class="dockWrapper"></div>';

    wrapperNode = document.createElement('div');
    wrapperNode.id = 'footer';
    wrapperNode.innerHTML = fakeMarkup;
    document.body.appendChild(wrapperNode);
    iconsContainer = document.createElement('ol');

    dockContainer = document.querySelector('.dockWrapper');
  }

  function teardownDom() {
    wrapperNode.parentNode.removeChild(wrapperNode);
  }

  suite('with 1 icon >', function() {

    setup(function() {
      MockPage.mIcons = [new MockIcon()];
      dock = new MockDock(dockContainer);
      DockManager.init(dockContainer, dock, tapThreshold);
    });

    teardown(teardownDom);

    test('looks ok', function() {
      assert.isFalse(DockManager.isFull());
    });

    test('#calculateDimentions', function() {
      DockManager.calculateDimentions(dock.getNumIcons());
      console.log('The dock width should be equal to 16 according to mockup: ' +
                  DockManager.cellWidth);
      assert.isTrue(DockManager.cellWidth > 0);
    });

    test('dock is not scrollable', function() {
      assert.isFalse(dockContainer.classList.contains('scrollable'));
    });

    test('moveBy was called', function() {
      assert.ok(MockDock.mMoveByArg);
    });
  });

  suite('with 0 icons >', function() {

    setup(function() {
      MockPage.mIcons = [];
      dock = new MockDock(dockContainer);
      DockManager.init(dockContainer, dock, tapThreshold);
    });

    teardown(teardownDom);

    test('looks ok', function() {
      assert.isFalse(DockManager.isFull());
      assert.equal(dock.getNumIcons(), 0);
    });

    test('#calculateDimentions', function() {
      DockManager.calculateDimentions(dock.getNumIcons());
      assert.equal(DockManager.cellWidth, 0);
    });

    test('dock is not scrollable', function() {
      assert.isFalse(dockContainer.classList.contains('scrollable'));
    });

    test('moveBy was called', function() {
      assert.ok(MockDock.mMoveByArg);
    });
  });

  suite('with more than 4 icons >', function() {
    setup(function() {
      MockPage.mIcons = [
        new MockIcon(),
        new MockIcon(),
        new MockIcon(),
        new MockIcon(),
        new MockIcon()
      ];
      dock = new MockDock(dockContainer);
      DockManager.init(dockContainer, dock, tapThreshold);
    });

    test('dock is scrollable', function() {
      assert.ok(dockContainer.classList.contains('scrollable'));
    });

    test('moveBy was not called', function() {
      assert.isUndefined(MockDock.mMoveByArg);
    });
  });
});
