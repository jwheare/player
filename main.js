Playdar.REFRESH_INTERVAL = 500;
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
    
    PLAYER.init();
};

// Handle last.fm import form
$('#import').submit(function (e) {
    e.preventDefault();
    var params = PLAYER.serialize_form(this);
    if (params.username) {
        // Clear the inputs and refocus
        PLAYER.setLastfmUser(params.username);
    }
});

// Handle cancel import click
$('.importCancel').click(function (e) {
    e.preventDefault();
    PLAYER.switchToPlayer();
});

// Handle switch accounts click
$('#lastfmSwitch').click(function (e) {
    e.preventDefault();
    PLAYER.switchToLanding();
    $('.importCancel').show();
});

// Handle clicks to a track row
$('#tracks').click(function (e) {
    // Get the play button link
    var target = $(e.target);
    var target_track = target.closest('tr.haudio');
    if (target_track.size()) {
        e.preventDefault();
        target.blur();
        PLAYER.play_track(target_track.data('sid'));
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
        e.preventDefault();
        target.blur();
        PLAYER.fetch_albums(target_artist);
        PLAYER.fetch_tracks(target_artist);
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
        e.preventDefault();
        target.blur();
        PLAYER.filter_tracks(target_album);
        return false;
    }
});

/**
 * Keyboard shortcuts
**/
$(document).keydown(function (e) {
    var target = $(e.target);
    // Don't capture on keyboardable inputs
    if (target.is('input[type=text], textarea, select')) {
        return true;
    }
    // Don't capture with any modifiers
    if (e.metaKey || e.shiftKey || e.altKey || e.ctrlKey) {
        return true;
    }
    switch (e.keyCode) {
    case 80: // p
        e.preventDefault();
        PLAYER.toggle_pause_current();
        break;
    case 219: // [
        // Back a track
        e.preventDefault();
        PLAYER.play_previous_track();
        break;
    case 221: // ]
        // Skip track
        e.preventDefault();
        PLAYER.play_next_track();
        break;
    }
});
