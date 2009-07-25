PLAYER = {
    /* Last.fm settings */
    lastfm_api_key: "b25b959554ed76058ac220b7b2e0a026",
    // lastfm_ws_url: "http://james.ws.dev.last.fm",
    // lastfm_ws_url: "http://james.ws.staging.last.fm",
    // lastfm_ws_url: "http://wsdev.audioscrobbler.com",
    lastfm_ws_url: "http://ws.audioscrobbler.com",
    lastfm_user_cookie: "lastfm_username",
    
    /* Playdar auth */
    auth_details: {
        name: "Media Player",
        website: "http://player/",
        receiverurl: "http://player/playdarauth.html"
    },
    
    init: function () {
        // First redirect away the initial hash
        var hash_parts = PLAYER.getHashParts();
        if (hash_parts.username) {
            PLAYER.redirectToLastfmUser(hash_parts.username);
        }
        // Check the URL for a username
        var url_username = PLAYER.getLastfmUserFromURL();
        var cookie_username = PLAYER.getLastfmUserCookie();
        if (url_username) {
            // Load the username from the URL
            PLAYER.loadLastfmUser(url_username);
        } else {
            // If there's no username, check the cookie and redirect
            if (cookie_username) {
                // Redirect
                PLAYER.redirectToLastfmUser(cookie_username);
                return;
            }
            // No cookie set, load the landing page
            PLAYER.switchToLanding();
        }
        // Support URL hacking and the back button
        PLAYER.listenHashChanges();
    },
    
    /* URL manipulation */
    
    // Update the loaded Last.fm user when the hash changes
    listenHashChanges: function () {
        setInterval(function () {
            var hash_parts = PLAYER.getHashParts();
            if (hash_parts.username && hash_parts.username != PLAYER.lastfm_username) {
                PLAYER.loadLastfmUser(hash_parts.username);
            }
        }, 100);
    },
    // Pull out the username from the URL, e.g. /jwheare
    getURLParts: function () {
        return window.location.pathname.replace(/^\/(.*)/, '$1').split('/');
    },
    // Pull out the username from the URL hash, e.g. #username=jwheare
    getHashParts: function () {
        var hash_sections = window.location.hash.replace(/^#(.*)/, '$1').split(';');
        var hash_parts = {};
        $.each(hash_sections, function (i, section) {
            var kv = section.split('=');
            if (kv[0] && kv[1]) {
                hash_parts[kv[0]] = kv[1];
            }
        });
        return hash_parts;
    },
    // Set the username in the hash
    setHashParts: function (hash_parts) {
        var query_string = Playdar.Util.toQueryString(hash_parts);
        if (query_string) {
            window.location.hash = query_string;
        }
    },
    // Check hash then URL path for a Last.fm user
    getLastfmUserFromURL: function () {
        var hash_parts = PLAYER.getHashParts();
        var url_parts = PLAYER.getURLParts();
        return hash_parts.username || url_parts[0];
    },
    // Redirect to a proper URL
    redirectToLastfmUser: function (username) {
        if (username) {
            window.location = '/' + username;
        } else {
            window.location = '/';
        }
    },
    
    /* Cookies */
    
    getLastfmUserCookie: function () {
        var username = Playdar.Util.getcookie(PLAYER.lastfm_user_cookie);
        // Update the clear cookie text
        if (username) {
            PLAYER.setLastfmUserCookie(username);
        }
        return username;
    },
    setLastfmUserCookie: function (username) {
        Playdar.Util.setcookie(PLAYER.lastfm_user_cookie, username);
        $('#clearCookies').text("Clear cookie: ‘"+username+"’").show();
    },
    clearLastfmUserCookie: function () {
        Playdar.Util.deletecookie(PLAYER.lastfm_user_cookie);
        // Refresh to current user's library
        PLAYER.redirectToLastfmUser(PLAYER.lastfm_username);
    },
    
    /* Mode switching */
    
    switchToLanding: function () {
        $('#lastfmSwitchCancel').show();
        $('#lastfmSwitch').hide();
        $('#player').hide();
        $('#player').css({ opacity: 0 });
        $('#landing').show();
        $('#landing').animate({ opacity: 1 }, 300);
        $('#importUsername').focus().select();
    },
    
    switchToPlayer: function () {
        $('#lastfmSwitchCancel').hide();
        $('#lastfmSwitch').show();
        $('#landing').hide();
        $('#landing').css({ opacity: 0 });
        $('#player').show();
        $('#player').animate({ opacity: 1 }, 300);
    },
    
    /* Library */
    
    loadLastfmUser: function (username) {
        PLAYER.lastfm_username = username;
        $('#lastfmUser span').text(username);
        $('#lastfmUser').attr('href', "http://www.last.fm/user/" + username);
        $('#statusHead').show();
        $('#importUsername').val(username);
        PLAYER.switchToPlayer();
        PLAYER.fetch_artists();
    },
    
    /* Artists */
    
    fetch_artists: function () {
        $('#artistList').empty();
        $('#artistsLoading').show();
        PLAYER.get_artist_page(1);
        PLAYER.artist_names = [];
        PLAYER.artist_lookup = {};
    },
    get_artist_page: function (page) {
        // console.info('load artist page', page);
        $.getJSON(PLAYER.lastfm_ws_url + "/2.0/?callback=?", {
            method: "library.getartists",
            api_key: PLAYER.lastfm_api_key,
            user: PLAYER.lastfm_username,
            format: "json",
            page: page
        }, function (json) {
            var response = json.artists;
            // Add the artists to our lookup
            $.each($.makeArray(response.artist), function (index, artist) {
                // console.log(page+':'+index, artist.name);
                PLAYER.artist_names.push(artist.name);
            });
            // Get the other pages
            var next_page = page + 1;
            if (next_page <= 5 /*response.totalPages*/) {
                PLAYER.get_artist_page(next_page);
            } else {
                PLAYER.load_artists();
            }
        });
    },
    load_artists: function () {
        // Copy current artist list and sort
        var artist_names = $.makeArray(PLAYER.artist_names);
        artist_names.sort();
        // Build DOM list
        var list = $('<ol>');
        $.each(artist_names, function (index, artist) {
            var id = 'artist_' + index;
            PLAYER.artist_lookup[id] = artist;
            list.append(
                $('<li>').attr('id', id)
                         .append($('<a href="#">').text(artist))
            );
        });
        
        $('#artistsLoading').hide();
        $('#artistList').html(list.html());
    },
    
    /* Albums */
    
    fetch_albums: function (artist) {
        $('#albumList').empty();
        $('#chooseAlbum').hide();
        $('#albumsLoading').show();
        PLAYER.album_names = [];
        PLAYER.album_lookup = {};
        PLAYER.album_id_lookup = {};
        PLAYER.get_album_page(PLAYER.artist_lookup[artist.attr('id')], 1);
    },
    get_album_page: function (artist, page) {
        // console.info('load album page', page);
        $.getJSON(PLAYER.lastfm_ws_url + "/2.0/?callback=?", {
            method: "library.getalbums",
            api_key: PLAYER.lastfm_api_key,
            user: PLAYER.lastfm_username,
            artist: artist,
            format: "json",
            page: page
        }, function (json) {
            var response = json.albums;
            // Add the artists to our lookup
            $.each($.makeArray(response.album), function (index, album) {
                // console.log(page+':'+index, album.name);
                PLAYER.album_names.push(album.name);
            });
            // Get the other pages if we haven't already
            var next_page = page + 1;
            if (next_page <= response.totalPages) {
                PLAYER.get_album_page(artist, next_page);
            } else {
                PLAYER.load_albums(artist);
            }
        });
    },
    load_albums: function (artist) {
        $('#albumsLoading').hide();
        // Copy current albums list and sort
        var album_names = $.makeArray(PLAYER.album_names);
        album_names.sort();
        // Build DOM list
        var list = $('#albumList');
        // All link
        list.append(
            $('<li>').attr('id', 'album_all')
                     .append($('<a href="#">').text('All'))
        );
        PLAYER.album_lookup['album_all'] = {
            artist: artist,
            album: ''
        };
        $.each(album_names, function (index, album) {
            var id = 'album_' + index;
            PLAYER.album_lookup[id] = {
                'artist': artist,
                'album': album
            };
            PLAYER.album_id_lookup[album] = id;
            list.append(
                $('<li>').attr('id', id)
                         .append($('<a href="#">').text(album))
            );
        });
    },
    
    /* Tracks */
    
    filter_tracks: function (album) {
        $('#trackTableBody tr').hide();
        $('#trackTableBody tr.' + album.attr('id')).show();
    },
    fetch_tracks: function (artist) {
        Playdar.client.cancel_resolve();
        $('#trackTableBody').empty();
        $('#tracksLoading').show();
        PLAYER.tracks = [];
        PLAYER.track_lookup = {};
        var artist_id = artist.attr('id');
        PLAYER.get_track_page(PLAYER.artist_lookup[artist_id], 1);
    },
    get_track_page: function (artist, page) {
        var query_params = {
            method: "library.gettracks",
            api_key: PLAYER.lastfm_api_key,
            user: PLAYER.lastfm_username,
            artist: artist,
            format: "json",
            page: page
        };
        // console.info('load track page', page);
        $.getJSON(PLAYER.lastfm_ws_url + "/2.0/?callback=?", query_params, function (json) {
            var response = json.tracks;
            // Add the artists to our lookup
            $.each($.makeArray(response.track), function (index, track) {
                // console.log(page+':'+index, track.name);
                PLAYER.tracks.push(track);
            });
            // Get the other pages if we haven't already
            var next_page = page + 1;
            if (next_page <= response.totalPages) {
                PLAYER.get_track_page(next_page);
            } else {
                PLAYER.load_tracks(artist);
            }
        });
    },
    
    load_tracks: function (artist) {
        $('#tracksLoading').hide();
        // Copy current tracks list and sort
        var tracks = $.makeArray(PLAYER.tracks);
        // Build DOM list
        var tbody = $('#trackTableBody');
        var id, trow, duration_link, album_link, album_class;
        $.each(tracks, function (index, track) {
            id = 'track_' + index;
            PLAYER.track_lookup[id] = track;
            duration_link = $('<a href="#">');
            if (track.duration-0) {
                duration_link.text(Playdar.Util.mmss(track.duration/1000));
            } else {
                duration_link.html('&nbsp;');
            }
            album_link = $('<a href="#">');
            album_class = 'album_all ';
            if (track.album && track.album.name) {
                album_link.text(track.album.name);
                album_class += PLAYER.album_id_lookup[track.album.name];
            } else {
                album_link.html('&nbsp;');
            }
            trow = $('<tr class="haudio">')
                .addClass(album_class)
                .append('<td class="play"><a href="#"><span class="resolved">-</span><span class="resolving">.</span><span class="notFound">&nbsp;</span></a></td>')
                .append($('<td>').append($('<a href="#" class="fn">').text(track.name)))
                .append($('<td>').append(duration_link))
                .append($('<td>').append($('<a href="#" class="contributor">').text(track.artist.name)))
                .append($('<td>').append(album_link));
            tbody.append(trow);
        });
        PLAYER.resolve();
    },
    
    /* Resolving */
    
    q_tracks: {},
    s_tracks: {},
    
    resolve: function () {
        Playdar.client.autodetect(PLAYER.track_handler);
    },
    /**
     * Called for each track that's detected by the haudio parser
     * Generates a query ID, keeps track of the track row with it, adds
     * a 'resolving' class and returns to QID for the Playdar resolve call.
     * @param {Object} tract A track object with an artist, name and element
     * @returns Query ID used for the resolve call
     * @type String
    **/
    track_handler: function (track) {
        // Add a classname to the item play cell
        var qid = Playdar.Util.generate_uuid();
        var track = $(track.element);
        track.data('qid', qid);
        PLAYER.q_tracks[qid] = track;
        track.addClass('resolving');
        return qid;
    },
    
    pop_track_by_qid: function (qid) {
        var track = PLAYER.q_tracks[qid];
        delete PLAYER.q_tracks[qid];
        return track;
    },
    
    results_handler: function (response, final_answer) {
        // Don't do anything till we're done
        if (!final_answer) {
            return false;
        }
        var track = PLAYER.pop_track_by_qid(response.qid);
        if (!track) {
            throw { error: "No track matching qid: " + response.qid };
        }
        var className = 'notFound';
        if (response.results.length) {
            var result = response.results[0];
            // Register stream on perfect match only
            if (result.score == 1) {
                PLAYER.highlight_result_source(result);
                className = 'resolved';
                var sid = result.sid;
                track.data('sid', sid);
                PLAYER.s_tracks[sid] = track;
                Playdar.player.register_stream(result, {
                    chained: true,
                    onload: PLAYER.onResultLoad,
                    onplay: PLAYER.onResultStart,
                    onpause: PLAYER.onResultPause,
                    onresume: PLAYER.onResultPlay,
                    onstop: PLAYER.onResultStop,
                    onfinish: PLAYER.onResultFinish
                });
            }
        }
        // Update item play button class name
        track.removeClass('resolving').addClass(className);
    },
    
    /* Soundmanager callbacks */
    
    // Not called when served from cache
    onResultLoad: function () {
        var track_item = PLAYER.s_tracks[this.sID];
        if (track_item) {
            if (this.readyState == 2) { // failed/error
                // Switch track highlight in the playlist
                PLAYER.resetResult.call(this);
                track_item.removeClass('playing');
                track_item.addClass('error');
            }
        }
        return track_item;
    },
    onResultStart: function () {
        var track_item = PLAYER.onResultPlay.call(this);
        if (track_item) {
            // Update the now playing track
            PLAYER.now_playing = this.sID;
            track_item.addClass('playing');
        }
    },
    onResultPause: function () {
        var track_item = PLAYER.s_tracks[this.sID];
        if (track_item) {
            // Switch track highlight in the playlist
            track_item.removeClass('playing');
            track_item.addClass('paused');
        }
        return track_item;
    },
    onResultPlay: function () {
        var track_item = PLAYER.s_tracks[this.sID];
        if (track_item) {
            // Highlight the track in the playlist
            track_item.removeClass('paused');
            track_item.removeClass('error');
        }
        return track_item;
    },
    resetResult: function () {
        var track_item = PLAYER.s_tracks[this.sID];
        if (track_item) {
            // Remove track highlight in the playlist
            track_item.removeClass('playing');
        }
        return track_item;
    },
    onResultStop: function () {
        var track_item = PLAYER.resetResult.call(this);
        if (track_item) {
            track_item.removeClass('paused');
        }
        // Clear the now playing track
        PLAYER.now_playing = null;
        Playdar.player.stop_current();
        return track_item;
    },
    onResultFinish: function () {
        var track_item = PLAYER.onResultStop.call(this);
        // Chain playback to the next perfect match
        if (track_item) {
            var next_playlist_track = track_item.nextAll('tr.resolved').data('sid');
            if (next_playlist_track) {
                PLAYER.play_track(next_playlist_track);
                return true;
            }
        }
        // Otherwise hard stop play session
        Playdar.player.stop_current(true);
        return track_item;
    },
    
    /* Playback control */
    
    play_track: function (sid) {
        // Find an SID class and play stream
        if (sid) {
            Playdar.player.play_stream(sid);
            return true;
        }
        return false;
    },
    toggle_pause_current: function () {
        var current_track = PLAYER.now_playing;
        if (!current_track) {
            // Get the first perfect match
            current_track = $('#trackTableBody tr.resolved').data('sid');
        }
        PLAYER.play_track(current_track);
    },
    play_next_track: function () {
        var current_track = PLAYER.s_tracks[PLAYER.now_playing];
        if (current_track) {
            var next_track = current_track.nextAll('tr.resolved').data('sid');
            PLAYER.play_track(next_track);
        }
    },
    play_previous_track: function () {
        var current_track = PLAYER.s_tracks[PLAYER.now_playing];
        if (current_track) {
            var previous_track = current_track.prevAll('tr.resolved').data('sid');
            PLAYER.play_track(previous_track);
        }
    },
    
    /* Sources */
    load_roster: function () {
        var query_params = Playdar.client.add_auth_token({
            call_id: new Date().getTime(),
            jsonp: 'PLAYER.roster_callback'
        });
        var url = Playdar.client.get_base_url('/greynet/get_roster', query_params);
        Playdar.Util.loadjs(url);
    },
    add_lan_source: function (ip) {
        var source_link = $('<a>')
            .text(ip.split(':')[0])
            .attr('title', ip)
            .attr('href', 'http://' + ip);
        source_link.addClass('online');
        source_link.addClass('playdar_capable');
        source_link.addClass('playdar_enabled');
        $('#sourceList').append($('<li>').append(source_link));
        source_link.data('originalBG', source_link.css('backgroundColor'));
        return source_link;
    },
    add_contact: function (contact, force) {
        var playdar_capable = force || false;
        var playdar_enabled = force || false;
        if (!playdar_enabled && contact.resources) {
            for (var res in contact.resources) {
                if (contact.resources[res]["playdar-capable"]) {
                    playdar_capable = true;
                }
                if (contact.resources[res]["playdar-capable"]) {
                    playdar_enabled = true;
                }
            }
        }
        var contact_link = $('<a>')
            .text(contact.jid)
            .attr('title', contact.jid)
            .attr('href', 'jabber://' + contact.jid);
        
        if (force || contact.online) {
            contact_link.addClass('online');
        }
        if (playdar_capable) {
            contact_link.addClass('playdar_capable');
        }
        if (playdar_enabled) {
            contact_link.addClass('playdar_enabled');
        }
        $('#sourceList').append($('<li>').append(contact_link));
        contact_link.data('originalBG', contact_link.css('backgroundColor'));
        return contact_link;
    },
    roster_callback: function (json) {
        $('#sourceLoading').hide();
        $.each(json, function (i, contact) {
            PLAYER.add_contact(contact);
        });
    },
    get_source: function (title) {
        return $('#sourceList a[title='+title+']');
    },
    highlight_source: function (source) {
        source.animate({ backgroundColor: '#c0e95b' }, 100)
              .animate({ backgroundColor: source.data('originalBG') }, 50);
    },
    // Triggered during Playdar resolve
    highlight_result_source: function (result) {
        // console.dir(result);
        // Highligh the IP source that provided this result
        var ip_match = result.url.match(/^http:\/\/(.*)\//);
        if (ip_match) {
            var ip = ip_match[1];
            var source = PLAYER.get_source(ip);
            if (!source.size()) {
                source = PLAYER.add_lan_source(ip);
            }
            PLAYER.highlight_source(source);
        }
        // Highligh the local source that provided this result
        var local_match = result.url.match(/^file:\/\/\//);
        if (local_match) {
            var host = Playdar.SERVER_ROOT + ":" + Playdar.SERVER_PORT;
            var source = PLAYER.get_source(host);
            if (!source.size()) {
                source = PLAYER.add_lan_source(host);
            }
            PLAYER.highlight_source(source);
        }
        // Highlight the jabber source that provided this result
        var jid_match = result.url.match(/^greynet:\/\/(.*)\//);
        if (jid_match) {
            var jid = jid_match[1];
            var contact = PLAYER.get_source(jid);
            if (!contact.size()) {
                contact = PLAYER.add_contact({
                    jid: jid
                }, true);
            }
            PLAYER.highlight_source(contact);
        }
    },
    
    /* Utility methods */
    
    Util: {
        serialize_form: function (form) {
            var params = {};
            $.each($(form).serializeArray(), function (i, item) {
                params[item.name] = item.value;
            });
            return params;
        }
    }
};