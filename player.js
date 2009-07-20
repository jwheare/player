PLAYER = {
    lastfm_api_key: "b25b959554ed76058ac220b7b2e0a026",
    lastfm_ws_url: "http://james.ws.dev.last.fm",
    // lastfm_ws_url: "http://james.ws.staging.last.fm",
    // lastfm_ws_url: "http://wsdev.audioscrobbler.com",
    // lastfm_ws_url: "http://ws.audioscrobbler.com",
    lastfm_username: "jwheare",
    
    auth_details: {
        name: "Media Player",
        website: "http://player/",
        receiverurl: "http://player/playdarauth.html"
    },
    q_tracks: {},
    s_tracks: {},
    onResultPlay: function () {
        PLAYER.onResultResume.call(this);
    },
    onResultPause: function () {
        var track_item = PLAYER.s_tracks[this.sID];
        if (track_item) {
            // Switch track highlight in the playlist
            track_item.removeClass('playing');
            track_item.addClass('paused');
        }
    },
    onResultResume: function () {
        var track_item = PLAYER.s_tracks[this.sID];
        if (track_item) {
            // Highlight the track in the playlist
            track_item.removeClass('paused');
            track_item.addClass('playing');
        }
    },
    onResultStop: function () {
        var track_item = PLAYER.s_tracks[this.sID];
        if (track_item) {
            // Remove track highlight in the playlist
            track_item.removeClass('playing');
            track_item.removeClass('paused');
        }
        Playdar.player.stop_current();
    },
    onResultFinish: function () {
        PLAYER.onResultStop.call(this);
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
                    onplay: PLAYER.onResultPlay,
                    onpause: PLAYER.onResultPause,
                    onresume: PLAYER.onResultResume,
                    onstop: PLAYER.onResultStop,
                    onfinish: PLAYER.onResultFinish
                });
            }
        }
        // Update item play button class name
        track.removeClass('resolving').addClass(className);
    },
    
    play_track: function (track) {
        // Find an SID class and play stream
        var sid = track.data('sid');
        if (sid) {
            Playdar.player.play_stream(sid);
            return true;
        }
        return false;
    },
    
    fetch_artists: function () {
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
            if (next_page <= 3 /*response.totalPages*/) {
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
    
    filter_tracks: function (album) {
        $('#trackTableBody tr').hide();
        $('#trackTableBody tr.' + album.attr('id')).show();
    },
    fetch_tracks: function (artist) {
        $('#trackTableBody').empty();
        $('#tracksLoading').show();
        PLAYER.tracks = [];
        PLAYER.track_lookup = {};
        PLAYER.get_track_page(PLAYER.artist_lookup[artist.attr('id')], 1);
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
        Playdar.client.autodetect(PLAYER.track_handler);
    },
    
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
        source_link.addClass('playdar');
        $('#sourceList').append($('<li>').append(source_link));
        source_link.data('originalBG', source_link.css('backgroundColor'));
        return source_link;
    },
    add_contact: function (contact, force) {
        var playdar = force || false;
        if (!playdar && contact.resources) {
            for (var res in contact.resources) {
                if (contact.resources[res].message == "Daemon not human.") {
                    playdar = true;
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
        if (playdar) {
            contact_link.addClass('playdar');
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
    }
};