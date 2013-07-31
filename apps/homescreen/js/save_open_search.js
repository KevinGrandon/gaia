navigator.mozSetMessageHandler('activity', function onActivity(activity) {
  switch (activity.source.name) {
    case 'edit-open-search':
      var list = document.getElementById('list');

      document.getElementById('close-activity')
        .addEventListener('click', function(e) {
        window.close();
      });

      list.addEventListener('click', function(e) {
        delete OpenSearchPlugins.plugins[e.target.dataset.plugin];
        OpenSearchPlugins.persist(null, function() {
          list.removeChild(e.target.parentNode.parentNode);
        });
      });

      OpenSearchPlugins.init(function initOpenSearch() {
        for (var i in OpenSearchPlugins.plugins) {
          var plugin = OpenSearchPlugins.plugins[i];

          var listItem = document.createElement('li');

          var listItemInner = document.createElement('p');
          listItemInner.textContent = plugin.shortname;

          var aside = document.createElement('aside');
          aside.className = 'pack-end';

          var deleteButton = document.createElement('button');
          deleteButton.className = 'danger';
          deleteButton.textContent = 'Delete';
          deleteButton.dataset.plugin = i;

          aside.appendChild(deleteButton);
          listItem.appendChild(aside);
          listItem.appendChild(listItemInner);
          list.appendChild(listItem);
        }
      });
    case 'save-open-search':
      var data = activity.source.data;

      OpenSearchPlugins.add(data.url, function openSearchCallback() {
        alert('Search engine added.');
        activity.postResult('saved');
        window.close();
      });
      break;

    default:
      activity.postError('name not supported');
  }
});
