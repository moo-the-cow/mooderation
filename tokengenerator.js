var redirect = "https://moo-the-cow.github.io/tokengenerator/index.html";
var client_id = "5dsbemnclyj3cigfl2wsgxnnmcevuu";
var scopes = "bits:read+channel:read:redemptions+channel:read:subscriptions+clips:edit+moderation:read+channel:read:editors+channel:read:hype_train+channel_editor+channel:moderate+chat:edit+chat:read+whispers:read+whispers:edit";
var access_token = ""

if (document.location.hash) {
	var parsedHash = new URLSearchParams(window.location.hash.substr(1));
	if (parsedHash.get("access_token")) {
		access_token = parsedHash.get("access_token");
		$("#oauth").val(access_token);
	}
}
$("#gettoken").on("click", function(event){
	window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(env.data.redirect)}&response_type=token&scope=${scopes}`;
});