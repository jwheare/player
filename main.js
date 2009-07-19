Playdar.REFRESH_INTERVAL = 100;
Playdar.MAX_CONCURRENT_RESOLUTIONS = 10;

Playdar.setup(PLAYER.auth_details);
Playdar.client.register_listeners({
    onAuth: function () {
        Playdar.client.autodetect(PLAYER.track_handler);
        PLAYER.load_roster();
    }
});
Playdar.client.register_results_handler(PLAYER.results_handler);

soundManager.url = 'soundmanager2_flash9.swf';
soundManager.flashVersion = 9;
soundManager.onload = function () {
    Playdar.setup_player(soundManager);
    Playdar.client.init();
    
    PLAYER.fetch_artists();
};

// Handle clicks to a track row
$('#tracks').click(function (e) {
    // Get the play button link
    var target = $(e.target);
    var target_track = target.closest('tr.haudio');
    if (target_track.size()) {
        PLAYER.play_track(target_track);
        target.blur();
        return false;
    }
});

// Handle clicks to the artist list
$('#artistList').click(function (e) {
    // Get the artist name
    var target = $(e.target);
    var target_artist = target.closest('li');
    $('#artistList li').removeClass('selected');
    target_artist.addClass('selected');
    if (target_artist.size()) {
        PLAYER.fetch_albums(target_artist);
        PLAYER.fetch_tracks(target_artist);
        target.blur();
        return false;
    }
});

// Handle clicks to the album list
$('#albumList').click(function (e) {
    // Get the artist name
    var target = $(e.target);
    var target_album = target.closest('li');
    $('#albumList li').removeClass('selected');
    target_album.addClass('selected');
    if (target_album.size()) {
        PLAYER.filter_tracks(target_album);
        target.blur();
        return false;
    }
});