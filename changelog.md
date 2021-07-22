# Changelog
## 0.0.2 (currently under development)
+ Responsive Design (mobile/pc)
+ Moderator/broadcaster check for connected channel - this tool makes only sense when you're moderator/broadcaster
+ Badusers upload (either temporarily or permanently in local store) for chat highlighting/notification
+ Badwords upload (either temporarily or permanently in local store) for chat highlighting/notification
+ Notification audio
+ Whisper to all mods (private conversation amongst mods 👍) kinda as a private channel
+ Whisper to user in userdetail
## 0.0.1
+ Persisting data in localstore ( see: https://en.wikipedia.org/wiki/Web_storage#Local_and_session_storage )
+ Configuration stored in localstore
    - oauth token autogenerate button
+ Loading Badwords from json and if someone is typing something that matches one of those words the message gets highlighted in red and a Notification is sent
+ Localisation from json (mainly for date format yet) only 3 options for now for performance reason (default: en-US)
+ Export banned Users, Chat conversation and Configuration as CSV
+ Reset Chat and Config Data from local storage
+ Automatically Reset ALL local storage data (except configuration) if the data has been deprecated (to prevent errors because of outdated data structure)
+ Realtime Chatfilter (only showing chat conversations/usernames that have been entered in the textfield)
+ Send Messages to Chat
+ Get User Details for every Chatmessage
    - Userdetail showing avatar, Displayusername, Userid, description, views
    - Userdetail ban, timeout, unban, untimeout user
+ Alert when OAuth Token expires, so the user gets informed when to refresh it via autogenerate (or manually)
+ Reconnect to websocket on connection loss (interval 1000ms x 2^n)
+ Notification for: 
    - Any other mod activating/deactivating slowmode (timeduration will be shown)
    - Any other mod activating/deactivating followers only (timeduration will be shown)
    - Any other mod activating/deactivating subscribers only
    - Any other mod activating/deactivating unique chat 
    - Any other mod triggering timeout for a user (displayusername, userid and timeduration will be shown)
    - Bad word written on Chat (found word will be shown)
+ Show all users in Chat
+ MASS BAN/TIMEOUT ALL filtered users in Chat (What you see is what you ban!) for users of type "Viewers". Moderators etc. will not be affected.
    - banned users will be stored in localstorage for CSV export (or to unban them when you accidently banned them)
+ Channel Actions:
    - Clear Chat
    - Slow mode on/of (default: 10 seconds)
    - Followers only on/off (default: 10 min)
    - Subscribers only on/off
    - Unique Chat mode on/off
+ Checking Channel actions (except Clear Chat) for another mod triggering, if that's the case the button gets automatically pressed and a Notification is sent
