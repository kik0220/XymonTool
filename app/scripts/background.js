/*global chrome, console, self, $, confirm*/
(function() {
  'use strict';
  document.body.innerHTML += '<img id="image" src="/xymon/gifs/unknown.gif"/>';
  document.body.innerHTML += '<canvas id="canvas" width="19" height="19"/>';
  var interval = 2; // * 10 sec
  var lastStatus = '', lastCount = 0;
  var rotation = 0;
  var animationFrames = 36;
  var animationSpeed = 10; //ms
  var iconImage = document.getElementById('image');
  var canvas = document.getElementById('canvas');
  var canvasContext = canvas.getContext('2d');
  var xymonUrl = localStorage.xymonUrl;
  var breakFirst = localStorage.breakFirst;
  var noticeStatus = localStorage.notificationStatus;
  var noticeCount = localStorage.notificationCount;
  if(!xymonUrl){
    if(!breakFirst){
      chrome.tabs.create({'url' : 'options.html'});
    }
  }
  if(!breakFirst){
    localStorage.breakFirst = true;
  }
  var version = chrome.app.getDetails().version;
  if(version !== localStorage.xymonToolVersion){
    if(localStorage.xymonToolVersion !== undefined){
      var result = confirm(chrome.i18n.getMessage('background_open_changelog_confirm', [localStorage.xymonToolVersion, version]));
      if(result){
        localStorage.removeItem('breakFirst');
        chrome.tabs.create({'url' : 'https://sites.google.com/site/xymontool/changelog-'+(window.navigator.language === 'ja' ? 'ja' : 'en')});
      }
    }
    localStorage.xymonToolVersion = version;
  }

  chrome.browserAction.onClicked.addListener(click);
  function click(tab){
    getStatus();
    chrome.tabs.create({'url' : localStorage.xymonUrl});
  }

  chrome.extension.onRequest.addListener(getRequest);
  function getRequest(request, sender, sendResponse){
    switch (request.command){
      case 'getConfig':
        getConfig(sendResponse);
        break;
      case 'setConfig':
        setConfig(request);
        break;
    }
  }

  function getConfig(sendResponse){
    if(localStorage.xymonUrl === undefined){localStorage.xymonUrl = '';}
    xymonUrl = localStorage.xymonUrl;
    if(localStorage.notificationStatus === undefined){localStorage.notificationStatus = false;}
    noticeStatus = localStorage.notificationStatus;
    if(localStorage.notificationCount === undefined){localStorage.notificationCount = false;}
    noticeCount = localStorage.notificationCount;
    if(sendResponse){sendResponse({url: (xymonUrl ? xymonUrl : ''), status: noticeStatus, count: noticeCount});}
  }
  function setConfig(request){
    localStorage.xymonUrl = request.url;
    localStorage.notificationStatus = request.status;
    localStorage.notificationCount = request.count;
    init();
  }

  function init() {
    var url = localStorage.xymonUrl;
    if(!url){return;}
    xymonUrl = (url.match(/\/$/) ? url : (url.match(/\/.*\.htm[l]$/i) ? url.match(/(.*\/).*$/)[1] : url + '\/') ) + 'nongreen.html';
    chrome.browserAction.setTitle({title: localStorage.xymonUrl});
    getConfig(null);
    getStatus();
    clearInterval(getStatus);
    setInterval(getStatus, interval * 10 * 1000);
  }
  
  function getStatus() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", xymonUrl, true);
    xhr.onload = function(){
      if(xhr.status !== 200){return;}
      var status = $(xhr.responseText).filter('link[rel="shortcut icon"]')[0].href;
      var lines = $(xhr.responseText).find('table[summary="Group Block"] tbody tr.line');
      var count = lines.length;
      var statusChanged = lastStatus !== status;
      var countChanged = lastCount !== count;
      if(!(statusChanged || countChanged)){return;}
      var iconPath = status.replace(/\/favicon-/i, "\/").replace(/\.ico$/i, "-recent.gif");
      if(!iconPath){return;}
      document.getElementById('image').setAttribute('src', iconPath);
      chrome.browserAction.setBadgeText({text: (count > 0 ? count.toString() : '')});
      var message = '';
      for(var i = 0; i < lines.length; i++){
        message += String(i+1) + ' : ' + $(lines[i]).find('td[align="LEFT"]').text().replace(/\n*/g, '');
        var columns = $(lines[i]).find('td[align="CENTER"] img[title]');
        for(var j = 0; j < columns.length; j++){
          var column = columns[j].alt.match(/(.*:)(.*):.*/);
          if(column[2] !== 'green'){
            message += ' ' + column[1] + column[2];
          }
        }
        message += '\n';
      }
      chrome.browserAction.setTitle({title: message});
      desktopNotification(statusChanged, countChanged, iconPath, count, message);
      rotateIcon();
      lastCount = count;
      lastStatus = status;
    };
    setTimeout(xhr.send(), 1000);
  }
  
  function desktopNotification(statusChanged, countChanged, iconPath, count, message){
    if(!(noticeStatus && noticeCount)){return;}
    if(!(noticeStatus && statusChanged) && (noticeCount && countChanged)){return;}
    var options = {
      type: "basic",
      title: chrome.i18n.getMessage((statusChanged && countChanged ? 'background_notifications_status_and_count' : (statusChanged ? 'background_notifications_status' : 'background_notifications_count'))) + (countChanged ? count.toString() : ''),
      message: message,
      iconUrl: iconPath
    };
    chrome.notifications.create('', options, function(){});
  }
  
  function rotateIcon() {
    rotation += 1/animationFrames;
    drawIconAtRotation();
    if (rotation <= 1) {
      setTimeout(rotateIcon, animationSpeed);
    } else {
      rotation = 0;
    }
  }
  
  function drawIconAtRotation() {
    canvasContext.save();
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    canvasContext.translate(Math.ceil(canvas.width/2),Math.ceil(canvas.height/2));
    canvasContext.rotate(2*Math.PI*((1-Math.sin(Math.PI/2+rotation*Math.PI))/2));
    canvasContext.drawImage(iconImage, -Math.ceil(canvas.width/2), -Math.ceil(canvas.height/2));
    canvasContext.restore();
    chrome.browserAction.setIcon({imageData: canvasContext.getImageData(0, 0, canvas.width, canvas.height)});
  }

  init();
})();