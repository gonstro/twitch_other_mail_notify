// Generated by CoffeeScript 1.6.3
var checkForOtherMail, findUnreadStarts, getMsgDetails, init, notifyMsg, parseOtherHTML, shouldMessageNotify;

chrome.runtime.onInstalled.addListener(function() {
  return console.log("installed");
});

findUnreadStarts = function(html) {
  var pos, startPos, starts;
  starts = [];
  pos = 0;
  while (true) {
    startPos = html.indexOf("unread' data-url=", pos);
    if (startPos === -1) {
      break;
    }
    starts.push(startPos);
    pos = startPos + 10;
  }
  return starts;
};

getMsgDetails = function(html, startPos) {
  var htmlPart, idReg, msgId, msgRes, name, nameReg, nameRes, subReg, subRes, subject;
  idReg = /unread' data-url='\/message\/show\/(\w+)\?/;
  nameReg = new RegExp('class="capital">(.+)</a>');
  subReg = new RegExp('class="message_subject">(.+)</a>');
  htmlPart = html.slice(startPos, html.indexOf("'message_body'", startPos));
  msgRes = idReg.exec(htmlPart);
  nameRes = nameReg.exec(htmlPart);
  subRes = subReg.exec(htmlPart);
  msgId = msgRes[1];
  name = nameRes[1];
  subject = subRes[1];
  if (!msgId || !name || !subject) {
    return null;
  }
  return {
    messageID: msgId,
    name: name,
    subject: subject
  };
};

notifyMsg = function(msg) {
  var options;
  options = {
    type: "basic",
    title: "New other message from " + msg.name,
    iconUrl: "http://twitch.tv/favicon.ico",
    message: "Subject:" + msg.subject
  };
  return chrome.notifications.create(msg.messageID, options, function(notId) {
    return "";
  });
};

shouldMessageNotify = function(msg) {
  var locId;
  locId = localStorage[msg.messageID];
  if (locId) {
    console.log("known message", msg.subject);
    return;
  }
  try {
    notifyMsg(msg);
    return localStorage[msg.messageID] = "true";
  } catch (_error) {}
};

parseOtherHTML = function(html) {
  var msg, startPos, starts, _i, _len, _results;
  starts = findUnreadStarts(html);
  _results = [];
  for (_i = 0, _len = starts.length; _i < _len; _i++) {
    startPos = starts[_i];
    if (msg = getMsgDetails(html, startPos)) {
      _results.push(shouldMessageNotify(msg));
    } else {
      _results.push(void 0);
    }
  }
  return _results;
};

checkForOtherMail = function() {
  var xhr;
  xhr = new XMLHttpRequest();
  xhr.open("GET", "http://www.twitch.tv/messages/other", true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      return parseOtherHTML(xhr.responseText);
    }
  };
  return xhr.send();
};

init = function() {
  console.log("init");
  chrome.alarms.clearAll(function(wasCleared) {
    console.log("cleared", wasCleared);
    return chrome.alarms.create("twitchalarm", {
      periodInMinutes: 1
    });
  });
  return chrome.alarms.onAlarm.addListener(function(alarm) {
    var e;
    console.log("checking");
    try {
      return checkForOtherMail();
    } catch (_error) {
      e = _error;
      return console.log(e);
    }
  });
};

init();
