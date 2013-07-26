navigator.mozSetMessageHandler('activity', function onActivity(activity) {
  switch (activity.source.name) {
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
