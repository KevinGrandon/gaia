var jump = document.getElementById('jump');
jump.addEventListener('change', function(e) {

  var forward;
  var backward;

  getAnchorResult(e.target.value, 'ascending',
    function gotNext(obj) {
      forward = obj;
      next();
    }
  );

  getAnchorResult(previousLetter(e.target.value), 'descending',
    function gotPrev(obj) {
      backward = obj;
      next();
    }
  );

  var pending = 2;
  function next() {
    if (!(--pending)) {
      initStreams(
        forward[backwardConfig.sortBy],
        backward[backwardConfig.sortBy]
      );
    }
  }

  e.target.value = 'select';
});

function previousLetter(letter) {
  if (letter === 'a') { return 'z'; }
  if (letter === 'A') { return 'Z'; }
  return String.fromCharCode(letter.charCodeAt(0) - 1);
}

/**
 * Gets the first object that a jumplink will start with.
 * @param {String} content to start the query with.
 * @param {String} sortOrder of the query.
 * @param {Function} callback
 */
function getAnchorResult(content, sortOrder, callback) {
 var firstMatching = navigator.mozContacts.getAll({
    filterOp: 'startsWith',
    filterValue: content,
    filterBy: ['familyName'],

    sortBy: 'familyName',
    sortOrder: sortOrder
  });

  firstMatching.onsuccess = function first_success(event) {
    callback(event.target.result);
  };

  firstMatching.onerror = function first_error() {
    console.log('Error fetching first matching contact.');
  };
}

function initStreams(forwardBound, backwardBound) {
  backwardConfig.filterBy = [backwardConfig.sortBy];
  backwardConfig.filterOp = 'upperBound';
  backwardConfig.filterValue = backwardBound;
  var backward = navigator.mozContacts.getAll(backwardConfig);

  forwardConfig.filterBy = [forwardConfig.sortBy];
  forwardConfig.filterOp = 'lowerBound';
  forwardConfig.filterValue = forwardBound;
  var forward = navigator.mozContacts.getAll(forwardConfig);

  scroller.reset();
  scroller.setCursor(forward, 'forward');
  scroller.setCursor(backward, 'backward');
}
