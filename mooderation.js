/* CONSTANTS */
const dataVersion = 6;
const client_id = "5dsbemnclyj3cigfl2wsgxnnmcevuu";
/* Temporary objects stored in global variables */
var tempStreamerAppearedList = [];
var tempUserList = {};
var tempUserDetail = {};
/* Other Variables */
var isModerator = true;
var moderatorUserNames = "";
/* LOCAL STORE */
var chatlog = localStorage.getItem("chattext") == null ? { list: [] } : JSON.parse(localStorage.getItem("chattext"));
var bannedusers = localStorage.getItem("bannedusers") == null ? { list: [] } : JSON.parse(localStorage.getItem("bannedusers"));
var config = localStorage.getItem("config") == null ? {} : JSON.parse(localStorage.getItem("config"));
var badwords = localStorage.getItem("badwords") == null ?  { list: [] } : JSON.parse(localStorage.getItem("badwords"));
var badusers = localStorage.getItem("badusers") == null ?  { list: [] } : JSON.parse(localStorage.getItem("badusers"));
/* JSON */
var env = { data: { debug: false } };
var raidlist = { list: [] };
var streamerdblist = { list: [] };
var excludemodwhisper = { list: [] };
var languagecountries = { list: [] };
/* METHODS */
const countOccurrences = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
const twitchApiXhr = (xhr, url) => {
	xhr.open("GET", url);
	xhr.responseType = 'json';
	xhr.setRequestHeader('Accept', '*/*'); // accept all
	xhr.setRequestHeader("Authorization", `Bearer ${config.oauth}`); // oauth
	xhr.setRequestHeader("Client-ID", client_id); // clientid
	return xhr;
};
const filterChatItems = (arr, query) => {
  return arr.filter(el => el.message.toLowerCase().indexOf(query.toLowerCase()) > -1 || el.userDisplayName.toLowerCase().indexOf(query.toLowerCase()) > -1);
};
const filterItems = (arr, query) => {
  return arr.filter(el => el.toLowerCase().indexOf(query.toLowerCase()) > -1);
};
const chatMessageHtml = (chatObject) => {
	var warnClass = (chatObject.warning) ? " warn" : "";
	var raiduserClass = (chatObject.isRaidListUser) ? " raiduser" : "";
	var isStreamerClass = (chatObject.isStreamer) ? " streamer" : "";
	var isModClass = chatObject.isModerator ? " isMod" : "";
	var isVIPClass = chatObject.isVIP ? " isVIP" : "";
	var isSystemClass = chatObject.isSystem ? " isSystem" : "";
	var isSubscriberClass = chatObject.isSubscriber ? " isSubscriber" : "";
	var occurances = "";
	if (chatObject.occurances > 0)
	{
		occurances = `<span class="occurances">(${chatObject.occurances})</span>`
	}
	var result = `<div class="message${warnClass}${raiduserClass}${isStreamerClass}${isModClass}${isVIPClass}${isSubscriberClass}${isSystemClass}">${(new Date(chatObject.timestamp)).toLocaleString(defaultLocale, {timeZoneName: "short"})} | <a class="user" href="#" data-userid="${chatObject.userId}">${chatObject.userDisplayName}</a> (${chatObject.userId}): ${chatObject.message}${occurances}</div><br/>`;
	if(!chatObject.deleted)
	{
		result = `<button class="delete" data-deleteid="${chatObject.id}">Delete</button>${result}`;
	}
	return result;
};
const isConfigSet = () => { return typeof config.channel !== "undefined" && typeof config.username !== "undefined" && typeof config.oauth !== "undefined" && typeof config.languagecountry !== "undefined";};
const jsonToCsv = (obj) => {
	let array = [Object.keys(obj)].concat(obj);
	return array.map(item => {
		return JSON.stringify(Object.values(item)).substring(1,JSON.stringify(Object.values(item)).length-1)
	}).join("\n");
};
const jsonArrayToCsv = (jsonArray) => {
	var result = "";
	jsonArray.forEach(function(item, index) {
		//TODO fix dirty substring hack
		if(index == 0)
		{
			result += JSON.stringify(Object.keys(item)).substring(1,JSON.stringify(Object.keys(item)).length-1) + "\n";
		}
		result += JSON.stringify(Object.values(item)).substring(1,JSON.stringify(Object.values(item)).length-1) + "\n";
	});
	return result;
};
const parseReturnMessage = msg => {
	let re=/^([0-9]+)/gmiu;
	if(typeof msg["emote_only"] !== "undefined")
	{
		let result = re.exec(msg["emote_only"])[1];
		if(result != null && result == 1 && $("#emotemode").attr("data-current") != "off")
		{
			$("#emotemode").trigger("click", [false]);
			new Notification("Emote only on", {body: "Some other mod activated Emote mode only!", vibrate: [200, 100, 200]});
			notificationAudio.play();
		}
		else if(result != null && result == 0 && $("#emotemode").attr("data-current") != "on")
		{
			$("#emotemode").trigger("click", [false]);
			new Notification("Emote only off", {body: "Some other mod deactivated Emote mode only!", vibrate: [200, 100, 200]});
			notificationAudio.play();
		}
	}
	if(typeof msg["slow"] !== "undefined")
	{
		let result = re.exec(msg["slow"])[1];
		if(result != null && result > 0 && $("#slowmode").attr("data-current") != "off")
		{
			$("#slowmode").trigger("click", [false]);
			new Notification("Slowmode activated", {body: `Some other mod activated Slowmode ${result} seconds !`, vibrate: [200, 100, 200]});
			notificationAudio.play();
		}
		else if(result != null && result == 0 && $("#slowmode").attr("data-current") != "on")
		{
			$("#slowmode").trigger("click", [false]);
			new Notification("Slowmode deactivated", {body: `Some other mod deactivated Slowmode ${result} seconds !`, vibrate: [200, 100, 200]});
			notificationAudio.play();
		}
	}
	else if(typeof msg["@followers-only"] !== "undefined")
	{
		re=/^([-]?[0-9]+)/gmiu;
		let result = re.exec(msg["@followers-only"])[1];
		if(result != null && result >= 0 && $("#followersmode").attr("data-current") != "off")
		{
			$("#followersmode").trigger("click", [false]);
			new Notification("Followers only on", {body: `Some other mod activated Followers only ${result} minutes !`, vibrate: [200, 100, 200]});
			notificationAudio.play();
		}
		else if(result != null && result == -1 && $("#followersmode").attr("data-current") != "on")
		{
			$("#followersmode").trigger("click", [false]);
			new Notification("Followers only off", {body: "Some other mod deactivated Followers only!", vibrate: [200, 100, 200]});
			notificationAudio.play();
		}
	}
	else if(typeof msg["subs-only"] !== "undefined")
	{
		let result = re.exec(msg["subs-only"])[1];
		if(result != null && result == 1 && $("#subscribersmode").attr("data-current") != "off")
		{
			$("#subscribersmode").trigger("click", [false]);
			new Notification("Subscribers only on", {body: "Some other mod activated Subscriber mode only!", vibrate: [200, 100, 200]});
			notificationAudio.play();
		}
		else if(result != null && result == 0 && $("#subscribersmode").attr("data-current") != "on")
		{
			$("#subscribersmode").trigger("click", [false]);
			new Notification("Subscribers only off", {body: "Some other mod deactivated Subscriber mode only!", vibrate: [200, 100, 200]});
			notificationAudio.play();
		}
	}
	else if(typeof msg["@r9k"] !== "undefined")
	{
		let result = re.exec(msg["@r9k"])[1];
		if(result != null && result == 1 && $("#r9kbetamode").attr("data-current") != "off")
		{
			$("#r9kbetamode").trigger("click", [false]);
			new Notification("Uniquemode on", {body: "Some other mod activated Uniquemode (r9kbeta)!", vibrate: [200, 100, 200]});
			notificationAudio.play();
		}
		else if(result != null && result == 0 && $("#r9kbetamode").attr("data-current") != "on")
		{
			$("#r9kbetamode").trigger("click", [false]);
			new Notification("Uniquemode off", {body: "Some other mod deactivated Uniquemode (r9kbeta)!", vibrate: [200, 100, 200]});
			notificationAudio.play();
		}
	}
	else if(typeof msg["@ban-duration"] !== "undefined")
	{
		// for no good reason twitch isn't returning enough data so lets get it from the API
		var xhr = new XMLHttpRequest();
		xhr = twitchApiXhr(xhr, `https://api.twitch.tv/helix/users?id=${msg["target-user-id"]}`);
		xhr.send();
		xhr.onload = () => {
			let username = xhr.response.data[0].display_name;
			new Notification("Uniquemode on", {body: `Some other mod timed out User: ${username} (${msg["target-user-id"]}) for ${msg["@ban-duration"]} seconds`, vibrate: [200, 100, 200]});
			notificationAudio.play();
		};
	}
};
/* INIT */
const notificationAudio = new Audio("audio/notification.mp3");
//first time visit always jump to the bottom of the chat
$(function() {
	document.getElementById("chatwindow").scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
});
//INFO: use en-US per default unless configured otherwise
var defaultLocale = "en-US";
if(isConfigSet())
{
	defaultLocale = config.languagecountry;
}
var defaultStreamer = "kaarujp";
if(isConfigSet())
{
	defaultStreamer = config.channel;
}
$(function() {
	var streamerList = ["kaarujp","nicocoyukari"];
	streamerList.forEach(function(item) {
		var selectedFlag = "";
		if(isConfigSet() && defaultStreamer == item)
		{
			selectedFlag = " selected";
		}
		$("#channel").append(`<option value="${item}"${selectedFlag}>${item}</option>`);
	});
});
//reset older stored data automatically that might break current implementation based on their version
if(typeof chatlog.version === "undefined" || chatlog.version < dataVersion)
{
	chatlog = { version: dataVersion, list: [] };
	localStorage.setItem("chattext", JSON.stringify(chatlog));
}
else
{
	chatlog.list.forEach(function(item) {
		$("#chatwindow").append(chatMessageHtml(item));
	});
}
var envJsonSource = "env.json";
var envJsonRequest = $.getJSON(envJsonSource, function(envdata) {
	env = { version: dataVersion, data: envdata };

	if(env.data.environment == "Production")
	{
		$("#userlistbutton").hide();
		$("#raidirl").hide();
		$("#modmessage").hide();
	}

	var options = {
		width: 400,
		height: 300,
		channel: defaultStreamer,
		// only needed if your site is also embedded on embed.example.com and othersite.example.com
		parent: env.data.allowedSites
	};
	var player = new Twitch.Player("videoPlayer", options);
	player.setVolume(0.5);

	var raidlistJsonSource = `${env.data.raidListUrl}`;
	$.getJSON(raidlistJsonSource, function(raidlistdata) {
		raidlist = { version: dataVersion, list: raidlistdata };
	});
	var streamerlistJsonSource = `${env.data.streamerListUrl}`;
	$.getJSON(streamerlistJsonSource, function(streamerlistdata) {
		streamerdblist = { version: dataVersion, list: streamerlistdata };
	});
	var languageCountriesJsonSource = `${env.data.languageCountryUrl}`;
	$.getJSON(languageCountriesJsonSource, function(data) {
		languagecountries = { version: dataVersion, list: data };
		languagecountries.list.forEach(function(item) {
			var selectedFlag = "";
			if(isConfigSet() && config.languagecountry == item["languageTag"])
			{
				selectedFlag = " selected";
			}
			$("#languagecountry").append(`<option value="${item["languageTag"]}"${selectedFlag}>${item["languageName"]}(${item["languageTag"]})</option>`);
		});
	});
});
//TODO write to own temp localstore instead of json
/*
if(env.data.debug) {
	console.log(env.data.debug);
	var mockChatJsonSource = "mock_chatlog.json";
	var req = $.getJSON(mockChatJsonSource, function(data) {
		console.log(data);
		chatlog = data ;
	});
}
*/
/*
if(badwords.list.size == 0)
{
	var badwordJsonSource = "badwordlist.json";
	//var badwordJsonSource = "https://moo-the-cow.github.io/mooderation/badwordlist.json?callback=?";
	$.getJSON(badwordJsonSource, function(data) {
		badwords = { version: dataVersion, list: data };
	});
}
*/
var excludemodwhisperJsonSource = "exclude_mods_whisper.json";
$.getJSON(excludemodwhisperJsonSource, function(data) {
	data.push(config.username);
	excludemodwhisper = { version: dataVersion, list: data };
});

Notification.requestPermission().then(function(result) {
	if(env.data.debug) { console.log(result); }
});
$("#configarea").hide();
// WEBSOCKET
var twitchWebsocket;
var twitchPubSubWebsocket;
var intervalTime = 0;
var interval;
var isError = false;
var oauthWarningSent = false;
var modWarningSent = false;
function websocketConnect() {
	//TODO https://dev.twitch.tv/docs/pubsub
	//AUTH geht via TOPICS und PING PONG
	/*
	twitchPubSubWebsocket = new WebSocket("wss://pubsub-edge.twitch.tv");
	twitchPubSubWebsocket.onopen = event => {
		if(env.data.debug) { console.log(event); }
		if(!isConfigSet() && env.data.debug) { console.log("OAUTH not set"); return; }
		if(!isConfigSet() && !oauthWarningSent) { alert("No OAuth Token Set! Please make sure to save it in your configuration!"); oauthWarningSent = true; return; }
		// LOL chat_moderator_actions.[userid].[channelid] => d.h. über user drüberiterieren und "horchen" aber über TOPICS array!! nicht immer neu senden
		twitchPubSubWebsocket.send(`{
			"type": "LISTEN",
			"nonce": "mooderationsubpublistener",
			"data": {
			  "topics": ["chat_moderator_actions.429923307.225025135","whispers.429923307"],
			  "auth_token": "${config.oauth}"
			}
		  }`);
		//isError = false;
		//clearInterval(interval);
		//intervalTime = 0;
		// get users in chat initially - this is IMPORTANT for other stuff
		//$.getJSON(`${env.data.twitchUsersUrl}/${config.channel}`, function(data) {
		//	tempUserList = data;
		//});
	};
	twitchPubSubWebsocket.onmessage = event => {
		if(env.data.debug) { console.log(event); }
		if(event.data.includes('Login authentication failed') && !oauthWarningSent) { alert("Invalid OAuth Token! Please refresh it in your configuration!"); oauthWarningSent = true; return; }
		if(!isModerator && !modWarningSent) { alert("You are not a Moderator of this Channel! Please make sure you're using this moderation Tool properly!"); modWarningSent = true; return; }
		//LOLOLOLOLOL TWITCH WHY!?
		let jsonString = event.data.replace(/\\/g, "").replace(/:"{/g, ":{").replace(/}"}/g, "}}").replace(/\r\n/,"");
		var jsonData = JSON.parse(jsonString);
		if(env.data.debug) { console.log(jsonData); }
		if(typeof jsonData["type"] !== "undefined" && jsonData["type"] == "MESSAGE")
		{
			var messageData = jsonData["data"]["message"]["data"];
			if(typeof messageData["moderation_action"] !== "undefined" && messageData["moderation_action"] == "automod_rejected")
			{
				let chatTimestamp = (typeof messageData["created_at"] !== "undefined" && messageData["created_at"] != "") ? messageData["created_at"] : Date.now();
				var chatObject = {id: messageData["msg_id"], deleted: false, warning: true, timestamp: chatTimestamp, userDisplayName: messageData["target_user_login"], userId: parseFloat(messageData["target_user_id"]), message: `AUTOMOD: ${messageData["args"][2]}: ${messageData["args"][1]}` };
				$("#chatwindow").append(chatMessageHtml(chatObject));
				chatlog.list.push(chatObject);
				localStorage.setItem("chattext", JSON.stringify(chatlog));
				$(window).trigger("chatscroll");
			}
		}
	};
	*/
	
	twitchWebsocket = new WebSocket("wss://irc-ws-r.chat.twitch.tv");

	twitchWebsocket.onopen = event => {
		if(env.data.debug) { console.log(event); }
		if(!isConfigSet() && env.data.debug) { console.log("OAUTH not set"); return; }
		if(!isConfigSet() && !oauthWarningSent) { alert("No OAuth Token Set! Please make sure to save it in your configuration!"); oauthWarningSent = true; return; }
		twitchWebsocket.send(`PASS oauth:${config.oauth}`);
		twitchWebsocket.send(`NICK ${config.username}`);
		twitchWebsocket.send("CAP REQ :twitch.tv/membership");
		twitchWebsocket.send("CAP REQ :twitch.tv/tags");
		twitchWebsocket.send("CAP REQ :twitch.tv/commands");
		twitchWebsocket.send(`JOIN #${config.channel}`);
		twitchWebsocket.send(`PRIVMSG #${config.channel} :.mods`);
		isError = false;
		clearInterval(interval);
		intervalTime = 0;
		// get users in chat initially - this is IMPORTANT for other stuff
		if(env.data.environment == "Production")
		{
			/*
			$.getJSON(`${env.data.twitchUsersUrl}/group/user/${config.channel}/chatters?callback=?`, function(data) {
				tempUserList = data;
			});
			*/
		}
		else
		{
			$.getJSON(`${env.data.twitchUsersUrl}/${config.channel}`, function(data) {
				tempUserList = data;
			});
		}
	};
	twitchWebsocket.onmessage = event => {
		if(env.data.debug) { console.log(event); }
		if(event.data.includes('Login authentication failed') && !oauthWarningSent) { alert("Invalid OAuth Token! Please refresh it in your configuration!"); oauthWarningSent = true; return; }
		if(!isModerator && !modWarningSent) { alert("You are not a Moderator of this Channel! Please make sure you're using this moderation Tool properly!"); modWarningSent = true; return; }
		var data_array = event.data.split(";");
		var jsonObject = {};
		data_array.forEach(function(item) {
			var entry = item.split("=");
			jsonObject[entry[0]] = entry[1];
		});
		let jsonString = JSON.stringify(jsonObject);
		var jsonData = JSON.parse(jsonString);
		if(env.data.debug) { console.log(jsonData); }
		if(typeof jsonData["@msg-id"] !== "undefined" && jsonData["@msg-id"].includes(":The moderators of this channel are:"))
		{
			moderatorUserNames = jsonData["@msg-id"].replace(/^.*The moderators of this channel are: (.*)\r\n$/gmiu, "$1").split(", ");
			isModerator = moderatorUserNames.includes(config.username) || config.channel == config.username;
			if(env.data.debug) { console.log(`isModerator: ${isModerator}`); }
		}
		if(event.data.includes(`JOIN #${config.channel}`))
		{
			let joinedUserName = event.data.replace(/^:([^!]*).*$/gmiu, "$1");
			raidlist.list.forEach(function(item) {
				if(item.userName == joinedUserName)
				{
					new Notification(`Raid user ${item.userName} joined channel!`, {body: `${item.userName} | ${item.displayName} (${item.userId})`, vibrate: [200, 100, 200]});
				}
			});
		}
		//:hornpubfollows!hornpubfollows@hornpubfollows.tmi.twitch.tv JOIN #illairl\r\n
		if(typeof jsonData["user-id"] !== "undefined")
		{
			var rawMessage = jsonData["user-type"].replace(/^.*PRIVMSG[^:]*:(.*)\r\n$/gmiu, "$1");
			var warningFound = false;
			if(rawMessage.includes("tmi.twitch.tv WHISPER"))
			{
				rawMessage = jsonData["user-type"].replace(/^.*@[^:]*:(.*)$/gmiu, "WHISPERS: $1");
			}
			else
			{
				badwords.list.forEach(function(badword) {
					var re = new RegExp(badword, "gmiu");
					if(rawMessage.match(re) != null)
					{
						if (("Notification" in window)) {
							new Notification("Bad word found!", {body: jsonData["display-name"] + ":" + badword, vibrate: [200, 100, 200]});
							notificationAudio.play();
						}
						if(env.data.debug) { console.log("Found bad word: " + badword); }
						warningFound = true;
					}
				});
				badusers.list.forEach(function(baduser) {
					if(jsonData["user-id"] == baduser.userid)
					{
						if (("Notification" in window)) {
							let warningsListString = "";
							baduser.warnings.forEach(function(warning){
								warningsListString += `\n${warning.type}: ${warning.reason}`;
							});
							new Notification("Bad user found!", {body: `${baduser.username} (${baduser.userid})${warningsListString}`, vibrate: [200, 100, 200]});
							notificationAudio.play();
						}
						if(env.data.debug) { console.log("Found bad user: " + baduser); }
						warningFound = true;
					}
				});
			}
			let chatTimestamp = (typeof jsonData["tmi-sent-ts"] !== "undefined") ? parseFloat(jsonData["tmi-sent-ts"]) : Date.now();
			let isMod = jsonData["mod"] !== "undefined" && jsonData["mod"] == "1" ? true : false;
			let isSubsriber = jsonData["subscriber"] !== "undefined" && jsonData["subscriber"] == "1" ? true : false;
			let isVIP = jsonData["badges"] !== "undefined" && jsonData["badges"].includes("vip") ? true : false;
			let foundStreamer = streamerdblist.list.find(({streamerTwitchId}) => parseFloat(streamerTwitchId) == parseFloat(jsonData["user-id"]))
			let isStreamer = (typeof foundStreamer !== "undefined") ? true : false;
			if(isStreamer && !tempStreamerAppearedList.includes(jsonData["user-id"]) && jsonData["user-id"] != 129043031 && jsonData["user-id"] != 587687323 && jsonData["user-id"] != 40164087) //the id is mine then nicole and then kaaru
			{
				new Notification("Streamer is posting!", {body: "Some streamer is posting something - attention!", vibrate: [200, 100, 200]});
				notificationAudio.play();
				tempStreamerAppearedList.push(jsonData["user-id"]);
			}
			//TODO: implement new raidlist
			//let isRaidListUser = (streamerdblist.list.find(({userId}) => parseFloat(userId) === parseFloat(jsonData["user-id"])).userId !== "undefined") ? true : false;
			let isRaidListUser = false;
			var chatObject = {id: jsonData["id"], deleted: false, warning: warningFound, timestamp: chatTimestamp, userDisplayName: jsonData["display-name"].toLowerCase(), userLogin: "", userId: parseFloat(jsonData["user-id"]), isSystem: false, isModerator: isMod, isRaidListUser: isRaidListUser, isSubscriber: isSubsriber, isStreamer: isStreamer, isVIP: isVIP, message: rawMessage, occurances: 0 };

			if(jsonData["msg-id"] !== "undefined" && jsonData["msg-id"] == "subgift")
			{
				let gifterId = parseFloat(jsonData["user-id"]) // gifter
				let gifterLogin = jsonData["login"]; //gifter
				let subMonths = parseInt(jsonData["msg-param-gift-months"]);
				let recipientLogin = jsonData["msg-param-recipient-user-name"];
				let recipientId = parseFloat(jsonData["msg-param-recipient-id"]);
				let subTierNumber = parseInt(jsonData["msg-param-sub-plan"]) / 1000;
				chatObject.isSystem = true;
				chatObject.userId = gifterId;
				chatObject.userLogin = gifterLogin;
				chatObject.rawMessage = `${gifterLogin} subgifted a Tier ${subTierNumber} for ${subMonths} month(s) to ${recipientLogin} (${recipientId})`;
			}
			if(jsonData["msg-id"] !== "undefined" && jsonData["msg-id"] == "subgift")
			{
				let gifterId = parseFloat(jsonData["user-id"]) // gifter
				let gifterLogin = jsonData["display-name"]; //gifter
				let bitsAmount = parseInt(jsonData["bits"]);
				let userMessage = jsonData["user-type"].replace(/^.*PRIVMSG[^:]*:Cheer\d* (.*)\\r\\n$/gmiu, "$1");
				chatObject.isSystem = true;
				chatObject.userId = gifterId;
				chatObject.userDisplayName = gifterLogin;
				chatObject.rawMessage = `${gifterLogin} cheered ${bitsAmount} bits: ${userMessage}`;
			}

			chatObject.occurances = countOccurrences(Array.from(chatlog.list, x => x.userId + x.message), chatObject.userId + chatObject.message);

			if(!chatlog.list.find( ({ id }) => id === jsonData["id"]))
			{
				$("#chatwindow").append(chatMessageHtml(chatObject)); // hmm maybe here is the issue with dupes, because append chatwindow is used multiple times?
				chatlog.list.push(chatObject);
				localStorage.setItem("chattext", JSON.stringify(chatlog));
			}
			$(window).trigger("chatscroll");
		}
		else
		{
			parseReturnMessage(jsonData);
		}
	};
	twitchWebsocket.onerror = function(event) {
		isError = true;
		if(env.data.debug) { console.log(`Websocket error: ${event}`); }
	};
	
	twitchWebsocket.onclose = event => {
		if(isError) { return; }
		if(env.data.debug) { console.log('Socket is closed.', event.reason); }
		if(env.data.debug) { console.log(`Interval to next connection is ${intervalTime/1000} seconds`); }
		//less spam, because 1 second timeouts happen quite frequently
		/*if(intervalTime > 1000)
		{
			new Notification("Socket is closed.", {body: `Interval to next connection is ${intervalTime/1000} seconds`, vibrate: [200, 100, 200]});
			notificationAudio.play();
		}*/
		//max intervall time 10s is enough
		/*if(intervalTime >= 10000)
		{
			intervalTime = 1000;
		}*/
		//manually because I just wanna reconnect asap (so every 1 second in the end)
		intervalTime = 500;
		clearInterval(interval);
		interval = setInterval(function() {
			websocketConnect();
		}, intervalTime *= 2);
	};
}
websocketConnect();

if(isConfigSet())
{
	$("#channel").val(config.channel);
	$("#username").val(config.username);
	$("#oauth").val(config.oauth);
}
if (document.location.hash) {
	var parsedHash = new URLSearchParams(window.location.hash.substr(1));
	if (parsedHash.get("access_token")) {
		var access_token = parsedHash.get("access_token");
		$("#oauth").val(access_token);
		if(env.data.debug) { console.log(access_token); }
	}
}

// EVENTS
$("#badwordListUpload").on("change", function(event) {
    var reader = new FileReader();
	reader.onload = function(e){
		let data = JSON.parse(e.target.result);
		if(typeof data !== "undefined" && data.length > 0)
		{
			badwords = { list: data };
		}
	};
    reader.readAsText(event.target.files[0]);
});
$("#savebadwords").on("click", function(event){
	localStorage.setItem("badwords", JSON.stringify(badwords));
});
$("#baduserListUpload").on("change", function(event) {
    var reader = new FileReader();
	reader.onload = function(e){
		let data = JSON.parse(e.target.result);
		if(typeof data !== "undefined" && data.length > 0)
		{
			badusers = { list: data };
		}
	};
    reader.readAsText(event.target.files[0]);
});
$("#savebadusers").on("click", function(event){
	localStorage.setItem("badusers", JSON.stringify(badusers));
});

$("#toggleconfig").on("click", function(event){
	$("#configarea").toggle("slow");
});
$("#search").on("input", function(){
    let filteredList = filterChatItems(chatlog.list, $(this).val());
	$("#chatwindow").html("");
	filteredList.forEach(function(item) {
		$("#chatwindow").append(chatMessageHtml(item));
	});
});
$("#filterusers").on("input", function(){
	//TODO refactor
	$("#userlist p").html("");
	var tempUserCount = 0;
	if(tempUserList.chatters.admins.length > 0)
	{
		let filteredAdmins = filterItems(tempUserList.chatters.admins, $(this).val());
		if(filteredAdmins.length > 0){
			$("#userlist p").append(`<strong>Admins</strong><br/>`);
		}
		filteredAdmins.forEach(function(item) {
			$("#userlist p").append(`<a href="#" class="user" data-username="${item}">${item}</a><br/>`);
			++tempUserCount;
		});
		if(filteredAdmins.length > 0){
			$("#userlist p").append(`<br/>`);
		}
	}
	if(tempUserList.chatters.broadcaster.length > 0)
	{
		let filteredBroadcaster = filterItems(tempUserList.chatters.broadcaster, $(this).val());
		if(filteredBroadcaster.length > 0){
			$("#userlist p").append(`<strong>Broadcaster</strong><br/>`);
		}
		filteredBroadcaster.forEach(function(item){
			$("#userlist p").append(`<a href="#" class="user" data-username="${item}">${item}</a><br/>`);
			++tempUserCount;
		});
		if(filteredBroadcaster.length > 0){
			$("#userlist p").append(`<br/>`);
		}
	}
	if(tempUserList.chatters.global_mods.length > 0)
	{
		let filteredGlobalMods = filterItems(tempUserList.chatters.global_mods, $(this).val());
		if(filteredGlobalMods.length > 0){
			$("#userlist p").append(`<strong>Global Mods</strong><br/>`);
		}
		filteredGlobalMods.forEach(function(item){
			$("#userlist p").append(`<a href="#" class="user" data-username="${item}">${item}</a><br/>`);
			++tempUserCount;
		});
		if(filteredGlobalMods.length > 0){
			$("#userlist p").append(`<br/>`);
		}
	}
	if(tempUserList.chatters.moderators.length > 0)
	{
		let filteredModerators = filterItems(tempUserList.chatters.moderators, $(this).val());
		if(filteredModerators.length > 0){
			$("#userlist p").append(`<strong>Mods</strong><br/>`);
		}
		filteredModerators.forEach(function(item){
			$("#userlist p").append(`<a href="#" class="user" data-username="${item}">${item}</a><br/>`);
			++tempUserCount;
		});
		if(filteredModerators.length > 0){
			$("#userlist p").append(`<br/>`);
		}
	}
	if(tempUserList.chatters.staff.length > 0)
	{
		let filteredStaff = filterItems(tempUserList.chatters.staff, $(this).val());
		if(filteredStaff.length > 0){
			$("#userlist p").append(`<strong>Staff</strong><br/>`);
		}
		filteredStaff.forEach(function(item){
			$("#userlist p").append(`<a href="#" class="user" data-username="${item}">${item}</a><br/>`);
			++tempUserCount;
		});
		if(filteredStaff.length > 0){
			$("#userlist p").append(`<br/>`);
		}
	}
	if(tempUserList.chatters.vips.length > 0)
	{
		let filteredVips = filterItems(tempUserList.chatters.vips, $(this).val());
		if(filteredVips.length > 0){
			$("#userlist p").append(`<strong>VIPs</strong><br/>`);
		}
		filteredVips.forEach(function(item){
			$("#userlist p").append(`<a href="#" class="user" data-username="${item}">${item}</a><br/>`);
			++tempUserCount;
		});
		if(filteredVips.length > 0){
			$("#userlist p").append(`<br/>`);
		}
	}
	if(tempUserList.chatters.viewers.length > 0)
	{
		let filteredViewers = filterItems(tempUserList.chatters.viewers, $(this).val());
		if(filteredViewers.length > 0){
			$("#userlist p").append(`<strong>Viewers</strong><br/>new users <input id="newviewers" type="checkbox" value=""/><br/>`);
		}
		filteredViewers.forEach(function(item){
			$("#userlist p").append(`<a href="#" class="user" data-username="${item}">${item}</a><br/>`);
			++tempUserCount;
		});
		if(filteredViewers.length > 0){
			$("#userlist p").append(`<br/>`);
		}
	}
	$("#userlist h2").text(`Users: ${tempUserCount}`);
});
$("#chatwindow").on("click", "button.delete", function(event){
	var idx = chatlog.list.findIndex( ({ id }) => id === $(this).attr("data-deleteid") );
	chatlog.list[idx].deleted = true;
	chatlog = { version: dataVersion, list: chatlog.list };
	localStorage.setItem("chattext", JSON.stringify(chatlog));
	twitchWebsocket.send("PRIVMSG #" + config.channel + " :.delete " + $(this).attr("data-deleteid"));
	this.style.display = "none";
});
$("button.command").on("click", function(event, sendToChat = true){
	var [statusFlag,classFlag] = ["off"," active"];
	if($(this).attr("data-current") == "off") { statusFlag = "on"; classFlag = ""; }
	
	$(this).text($(this).text().replace(/^([^(]*).*$/gmiu, "$1 (" + statusFlag + ")"));
	if(sendToChat)
	{
		let cmd = $(this).attr("data-" + statusFlag);
		twitchWebsocket.send(`PRIVMSG #${config.channel} :.${cmd}`);
	}
	$(this).attr("class", "command" + classFlag);
	$(this).attr("data-current", statusFlag);
});
$("#gettoken").on("click", function(event){
	window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(env.data.redirect)}&response_type=token&scope=channel:read:redemptions+channel_editor+channel:moderate+chat:edit+chat:read+whispers:read+whispers:edit`;
});
$("#saveconfig").on("click", function(event){
	config = { channel: $("#channel").val(), username: $("#username").val(), oauth: $("#oauth").val(), languagecountry: $("#languagecountry").attr("selected",true).val()}
	localStorage.setItem("config", JSON.stringify(config));
	location.reload();
});
$(".reset").on("click", function(event){
	localStorage.removeItem($(this).attr("data-reset"));
	location.reload();
});
$("#exportconfig").on("click", function(event){
	var data = jsonToCsv(config);
	$(this).attr("href", URL.createObjectURL(new Blob([data], { type: "text/csv" })));
});
$("#exportchatlog, #exportbannedusers").on("click", function(event){
	var data = jsonArrayToCsv(chatlog.list);
	if($(event.currentTarget).attr("id") == "exportbannedusers")
	{
		data = jsonArrayToCsv(bannedusers.list);
	}
	$(this).attr("href", URL.createObjectURL(new Blob([data], { type: "text/csv" })));
});
$(window).on("chatscroll", function(e) {
	if((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight)
	{
		document.getElementById("chatwindow").scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
	}
});
$("#chatmessage").on("keypress", function(event) {
	if (event.key === "Enter") {
		let msg = $(this).val();
		twitchWebsocket.send(`PRIVMSG #${config.channel} :${msg}`);
		var chatObject = {id: 0, deleted: false, warning: false, timestamp: Date.now(), userDisplayName: config.username.toLowerCase(), userName: "", isModerator: true, isSubscriber: true, isRaidListUser: false, userId: 0, message: msg, occurances: 0 };
		chatlog.list.push(chatObject);
		localStorage.setItem("chattext", JSON.stringify(chatlog));
		$("#chatwindow").html($("#chatwindow").html() + chatMessageHtml(chatObject));
		$(window).trigger("chatscroll");
		$(this).val("");
	}
});
$("#modmessage").on("keypress", function(event) {
	if (event.key === "Enter") {
		if(!isModerator) { alert("You are not a Moderator of this Channel! Please make sure you're using this moderation Tool properly!"); return; }
		let msg = $(this).val();
		if(tempUserList.chatters.moderators.length > 0)
		{
			let filteredMods = tempUserList.chatters.moderators.filter(f => !excludemodwhisper.list.includes(f));
			if(env.data.debug) { console.log(filteredMods); }
			filteredMods.forEach(function(item){
				twitchWebsocket.send(`PRIVMSG #${config.channel} :.w ${item} (all mods) ${msg}`);
			});
			var chatObject = {id: 0, deleted: false, warning: false, timestamp: Date.now(), userDisplayName: config.username.toLowerCase(), userName: "", isModerator: true, isSubscriber: true, isRaidListUser: false, userId: 0, message: `WHISPERS: (all mods) ${msg}`, occurances: 0 };
			chatlog.list.push(chatObject);
			localStorage.setItem("chattext", JSON.stringify(chatlog));
			$("#chatwindow").append(chatMessageHtml(chatObject));
			$(window).trigger("chatscroll");
			$(this).val("");
		}
	}
});
$("body").on("keypress", "#userwhisper", function(event){
	if (event.key === "Enter") {
		let msg = $(this).val();
		var username = $(this).attr("data-username");
		twitchWebsocket.send(`PRIVMSG #${config.channel} :.w ${username} ${msg}`);
		$(this).val("");
	}
});
$("body").on("click", ".user", function(event){
	event.preventDefault();
	//TODO need to check users in channel and get their type if they're bannable or not - not critical because you cannot do that backend side anyways
	var userid = $(event.currentTarget).attr("data-userid");
	var username = $(event.currentTarget).attr("data-username");
	//var parentClass = $(event.currentTarget).parent().attr("class");
	$("#useroverlay").fadeIn("slow");
	$("#userpopup").fadeIn("slow", function() {
		var xhr = new XMLHttpRequest();
		if(typeof userid === "undefined" || userid == 0){
			if(userid == 0) {
				username = config.username;
			}
			xhr = twitchApiXhr(xhr, `https://api.twitch.tv/helix/users?login=${username}`);
		}
		else {
			xhr = twitchApiXhr(xhr, `https://api.twitch.tv/helix/users?id=${userid}`);
		}
		xhr.send();
		xhr.onload = () => {
			let userData = xhr.response.data;
			username = userData[0].login;
			userid = userData[0].id;
			$("#profile p", this).html("");
			$("#profileactions", this).html("");
			$("#profile h2", this).text(`User: ${userData[0].display_name} (${username}|${userid})`);
			if(userData[0].profile_image_url != ""){
				$("#profileimage", this).html(`<img src="${userData[0].profile_image_url}" width="50" height="50" />`);
			}
			if(userData[0].description != ""){
				$("#profile p", this).append(`Description: ${userData[0].description}<br/>`);
			}
			$("#profile p", this).append(`Views: ${userData[0].view_count}<br/>`);
			if(userData[0].created_at != ""){
				$("#profile p", this).append(`Created at: ${(new Date(userData[0].created_at)).toLocaleString(defaultLocale, {timeZoneName: "short"})}<br/>`);
			}
			if(username != config.username) {
				$("#profileactions", this).html(`<button id="shoutout" data-userid="${userid}" data-username="${username}">Shoutout</button><button id="usertimeout" class="danger" data-userid="${userid}" data-username="${username}">timeout</button><button id="userban" class="danger" data-userid="${userid}" data-username="${username}">ban</button><button id="useruntimeout" data-userid="${userid}" data-username="${username}">untimeout</button><button id="userunban" data-userid="${userid}" data-username="${username}">unban</button>`);
				$("#profileactions", this).append(`<input id="userwhisper" type="text" placeholder="Send whisper to User ${username}" data-userid="${userid}" data-username="${username}" />`);
			}
			tempUserDetail = userData;
		}
	});
});
$("#raidirl").on("click", function(event){
	$.getJSON(`${env.data.getTestUrl}?streamerLoginName=${config.channel}`, function(data) {
			let message = data.message;
			$("#chatmessage").val(message);
	});
});
$("#userlistbutton").on("click", function(event){
	$("#userlistoverlay").fadeIn("slow");
	$("#userlistpopup").fadeIn("slow", function() {
		$.getJSON(`${env.data.twitchUsersUrl}/${config.channel}`, function(data) {
			let users = data;
			//reset first then load new data on each click
			$("#userlist p").html("");
			$("#userlist h2").text(`Users: ${users.chatter_count}`);
			if(users.chatters.admins.length > 0)
			{
				$("#userlist p").append(`<strong>Admins</strong><br/>`);
				users.chatters.admins.forEach(function(item){
					$("#userlist p").append(`<a href="#" class="user" data-username="${item}">${item}</a><br/>`);
				});
			}
			if(users.chatters.broadcaster.length > 0)
			{
				$("#userlist p").append(`<strong>Broadcaster</strong><br/>`);
				users.chatters.broadcaster.forEach(function(item){
					$("#userlist p").append(`<a href="#" class="user" data-username="${item}">${item}</a><br/>`);
				});
				$("#userlist p").append(`<br/>`);
			}
			if(users.chatters.global_mods.length > 0)
			{
				$("#userlist p").append(`<strong>Global Mods</strong><br/>`);
				users.chatters.global_mods.forEach(function(item){
					$("#userlist p").append(`<a href="#" class="user" data-username="${item}">${item}</a><br/>`);
				});
				$("#userlist p").append(`<br/>`);
			}
			if(users.chatters.moderators.length > 0)
			{
				$("#userlist p").append(`<strong>Mods</strong><br/>`);
				users.chatters.moderators.forEach(function(item){
					$("#userlist p").append(`<a href="#" class="user" data-username="${item}">${item}</a><br/>`);
				});
				$("#userlist p").append(`<br/>`);
			}
			if(users.chatters.staff.length > 0)
			{
				$("#userlist p").append(`<strong>Staff</strong><br/>`);
				users.chatters.staff.forEach(function(item){
					$("#userlist p").append(`<a href="#" class="user" data-username="${item}">${item}</a><br/>`);
				});
				$("#userlist p").append(`<br/>`);
			}
			if(users.chatters.vips.length > 0)
			{
				$("#userlist p").append(`<strong>VIPs</strong><br/>`);
				users.chatters.vips.forEach(function(item){
					$("#userlist p").append(`<a href="#" class="user" data-username="${item}">${item}</a><br/>`);
				});
				$("#userlist p").append(`<br/>`);
			}
			if(users.chatters.viewers.length > 0)
			{
				$("#userlist p").append(`<strong>Viewers</strong><br/><span>new users <input id="newviewers" type="checkbox" value=""/></span><br/><span id="viewerslist">`);
				users.chatters.viewers.forEach(function(item){
					$("#viewerslist").append(`<a href="#" class="user" data-username="${item}">${item}</a><br/>`);
				});
				$("#userlist p").append(`<br/></span>`);
			}
			if(env.data.debug) { console.log(data); }
			tempUserList = users;
		});
	});
});
//TODO finish (timeout or ban does not work on those yet)
$("#userlist p").on("click", "input#newviewers", function(event){
	var usersParams = ""
	$("#viewerslist").html("");
	tempUserList.chatters.viewers.forEach(function(item){
		usersParams += `login=${item}&`;
	});
	var xhr = new XMLHttpRequest();
	xhr = twitchApiXhr(xhr, `https://api.twitch.tv/helix/users?${usersParams}`);
	xhr.send();
	xhr.onload = () => {
		xhr.response.data.forEach(function(dataItem){
			let loginName = dataItem.login;
			let createdAt = dataItem.created_at;
			let currentDate = new Date();
			if(new Date(createdAt).getTime() > new Date(currentDate.setDate(currentDate.getDate() - 10)).getTime())
			{
				$("#viewerslist").append(`<a href="#" class="user" data-username="${loginName}">${loginName}</a><br/>`);
			}
		});
	};
});
$("#banfilteredusers, #timeoutfilteredusers").on("click", function(event){
	const confirmText = ($(event.target).attr("id") == "banfilteredusers") ? "Do you really want to BAN ALL those shown viewers?" : "Do you really want to TIMEOUT ALL those shown viewers?";
	if(window.confirm(confirmText))
	{ 
		let filteredViewers = filterItems(tempUserList.chatters.viewers, $("#filterusers").val());
		if(filteredViewers.length > 0)
		{
			filteredViewers.forEach(function(item){
				if(env.data.debug) { console.log(item); }
				if($(event.target).attr("id") == "banfilteredusers")
				{
					bannedusers.list = bannedusers.list.filter(f => f.username !== item).concat([{username: item}]);
					if(env.data.debug) { console.log(bannedusers); }
					//INFO: it is less performant to leave setItem here instead outside the loop, but it is also more safe to leave it inside here in case something goes wrong.
					localStorage.setItem("bannedusers", JSON.stringify(bannedusers));
					twitchWebsocket.send(`PRIVMSG #${config.channel} :.ban ${item}`);
				}
				else
				{
					twitchWebsocket.send(`PRIVMSG #${config.channel} :.timeout ${item}`);
				}
			});
		}
	}
});
$("#userlistclose, #userlistoverlay").on("click", function(event){
	$("#userlistoverlay, #userlistpopup").fadeOut("slow");
});
$("#userclose, #useroverlay").on("click", function(event){
	$("#useroverlay, #userpopup").fadeOut("slow");
});
$("#clearcommand").on("click", function(event){
	twitchWebsocket.send(`PRIVMSG #${config.channel} :.clear`);
});
$("#userpopup").on("click", "#usertimeout", function(event){
	var username = $(this).attr("data-username");
	twitchWebsocket.send(`PRIVMSG #${config.channel} :.timeout ${username}`);
});
$("#userpopup").on("click", "#userban", function(event){
	//if(window.confirm(`Are you sure you want to BAN ${username}?`))
	{
		var username = $(this).attr("data-username");
		twitchWebsocket.send(`PRIVMSG #${config.channel} :.ban ${username}`);
		bannedusers.list = bannedusers.list.filter(f => f.username !== username).concat([{username: username}]);
		if(env.data.debug) { console.log(bannedusers); }
		localStorage.setItem("bannedusers", JSON.stringify(bannedusers));
	}
});
$("#userpopup").on("click", "#useruntimeout", function(event){
	var username = $(this).attr("data-username");
	twitchWebsocket.send(`PRIVMSG #${config.channel} :.untimeout ${username}`);
});
$("#userpopup").on("click", "#shoutout", function(event){
	var username = $(this).attr("data-username");
	twitchWebsocket.send(`PRIVMSG #${config.channel} :!so ${username}`);
});
$("#userpopup").on("click", "#userunban", function(event){
	var username = $(this).attr("data-username");
	twitchWebsocket.send(`PRIVMSG #${config.channel} :.unban ${username}`);
	bannedusers.list = bannedusers.list.filter(f => f.username !== username);
	if(env.data.debug) { console.log(bannedusers); }
	localStorage.setItem("bannedusers", JSON.stringify(bannedusers));
});
$("#illaIRL").on("click", function(event){
	window.location.href = "https://www.twitch.tv/illairl";
});
$("#botdefense").on("click", function(event){
	twitchWebsocket.send(`PRIVMSG #${config.channel} :!botdefense full`);
});
$('#videoPlayerToggle').on("click", function(event){
	$("#videoPlayer iframe").toggle();
});
/*
$("#raidirl").on("click", function(event){
	twitchWebsocket.send(`PRIVMSG #${config.channel} :!raidirl`);
});
*/