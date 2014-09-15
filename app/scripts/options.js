/*global chrome, confirm, alert, console*/
(function () {
  'use strict';
  window.addEventListener('load', init, false);

  function init(){
    document.getElementById('legendSettings').innerText = chrome.i18n.getMessage('options_group_settings');
    document.getElementById('labelXymonUrl').innerText = chrome.i18n.getMessage('options_xymon_url');
    document.getElementById('labelXymonUrlEx').innerText = chrome.i18n.getMessage('options_xymon_url_example');
    document.getElementById('legendDesktopNotification').innerText = chrome.i18n.getMessage('options_group_desktop_notification');
    document.getElementById('labelNotificationStatus').innerText = chrome.i18n.getMessage('options_desktop_notification_status');
    document.getElementById('labelNotificationCount').innerText = chrome.i18n.getMessage('options_desktop_notification_count');
    document.getElementById('buttonOk').innerText = chrome.i18n.getMessage('options_buttons_ok');
    document.getElementById('buttonCancel').innerText = chrome.i18n.getMessage('options_buttons_cancel');
    document.getElementById('buttonOk').addEventListener('click', clickOk);
    document.getElementById('buttonCancel').addEventListener('click', clickCancel);
    document.getElementById('legendSupport').innerText = chrome.i18n.getMessage('options_group_support');
    document.getElementById('supportSite').innerText = chrome.i18n.getMessage('options_support_site');
    chrome.extension.sendRequest({command: 'getConfig'}, function(response){
      document.getElementById('fieldXymonUrl').value = response.url;
      document.getElementById('fieldNotificationStatus').checked = (response.status === 'true');
      document.getElementById('fieldNotificationCount').checked = (response.count === 'true');
    });
  }

  function clickOk(){
    var url = document.getElementById('fieldXymonUrl').value;
    var status = document.getElementById('fieldNotificationStatus').checked;
    var count = document.getElementById('fieldNotificationCount').checked;
    chrome.extension.sendRequest({command: 'setConfig', url: url, status: status, count: count});
    window.close();
  }

  function clickCancel(){
    window.close();
  }
})();
