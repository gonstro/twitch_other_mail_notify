chrome.runtime.onInstalled.addListener ->
	console.log "installed"

# Object.keys(localStorage).map(function(item){
#  localStorage.removeItem(item)
# })

findUnreadStarts = (html)->
	starts = []
	pos = 0
	while true
		startPos = html.indexOf("unread' data-url=",pos)
		if startPos == -1
			break
		starts.push(startPos)
		pos = startPos + 10
	return starts

getMsgDetails = (html,startPos)->
	idReg = /unread' data-url='\/message\/show\/(\w+)\?/
	nameReg = new RegExp('class="capital">(.+)</a>')
	subReg = new RegExp('class="message_subject">(.+)</a>')

	htmlPart = html.slice(startPos,html.indexOf("'message_body'",startPos))
	# console.log htmlPart

	msgRes = idReg.exec(htmlPart)
	nameRes = nameReg.exec(htmlPart)
	subRes = subReg.exec(htmlPart)

	msgId =   msgRes[1]
	name =  nameRes[1]
	subject = subRes[1]

	if not msgId or not name or not subject
		return null

	return { 
		messageID: msgId
		name: name
		subject:subject
	}


notifyMsg = (msg)->
	options = 
		type:"basic"
		title: "New other message from "+msg.name
		iconUrl:"http://twitch.tv/favicon.ico"
		message: "Subject:"+msg.subject
	chrome.notifications.create msg.messageID,options,(notId)->
		""


shouldMessageNotify = (msg)->
	locId = localStorage[msg.messageID]
	if locId
		console.log "known message",msg.subject
		return
	try
		notifyMsg(msg)
		localStorage[msg.messageID] = "true"


parseOtherHTML = (html)->
	starts = findUnreadStarts(html)
	for startPos in starts
		# console.log startPos
		if msg = getMsgDetails(html,startPos)
			# console.log msg
			shouldMessageNotify(msg)
	

checkForOtherMail = ()->
	xhr = new XMLHttpRequest()
	xhr.open("GET", "http://www.twitch.tv/messages/other", true);

	xhr.onreadystatechange = ()->
		if xhr.readyState == 4
			parseOtherHTML(xhr.responseText)

	xhr.send()

init = ()->
	console.log "init"
	
	chrome.alarms.clearAll (wasCleared)->
		console.log "cleared",wasCleared
		chrome.alarms.create "twitchalarm",
			# delayInMinutes: 0.01
			periodInMinutes: 1

	chrome.alarms.onAlarm.addListener (alarm)->
		console.log "checking"
		try
			checkForOtherMail()
		catch e
			console.log e
init()