var request = require('request');
var inquirer = require('inquirer');
var chalk = require('chalk');
var extend = require('util')._extend;

var expect = require('unexpected');

// TODO: Incomplete list
var API = {
  upcoming: 'https://yts.ag/api/upcoming.json', // https://yts.re/api#upcomingDocs
  list: 'https://yts.ag/api/v2/list_movies.json' // http://yts.to/api#list_movies
};

var trackers = [
  'udp://open.demonii.com:1337',
  'udp://tracker.istole.it:80',
  'http://tracker.yify-torrents.com/announce',
  'udp://tracker.publicbt.com:80',
  'udp://tracker.openbittorrent.com:80',
  'udp://tracker.coppersurfer.tk:6969',
  'udp://exodus.desync.com:6969',
  'http://exodus.desync.com:6969/announce'
];

var magnetURI = (function () {
  var template = 'magnet:?xt=urn:btih:{HASH}&dn={TITLE}&tr=' + trackers.join('&tr=');
  return function (hash, title) {
    return template
      .replace('{HASH}', hash)
      .replace('{TITLE}', encodeURIComponent(title));
  };
}());

function renderTorrent(torrent) {
  return [
    torrent.title,
    chalk.blue(torrent.quality),
    chalk.magenta(torrent.size + ' (' + chalk.green(torrent.seeds) + '/' + chalk.yellow(torrent.peers) + ')')
  ].join(', ');
}

module.exports = function (query, callback) {
  var qualityRegex = /\b(?:720p?|1080p?|3d)\b/i;
  var quality = query.match(qualityRegex);

  if (quality !== null) {
    quality = quality[0];
    query = query.replace(quality, '').replace(/ +/, ' ').trim();

    if (quality === '720' || quality === '1080') {
      quality += 'p';
    }
  }

  var uri = API.list + '?query_term=' + encodeURIComponent(query) + (quality ? '&quality=' + encodeURIComponent(quality) : '');

  console.error('Searching for:', query);

  request({
    method: 'GET',
    uri: uri
  }, function (error, response, body) {
    var result;

    if (error) {
      return callback(new Error(chalk.red('API query failure: ' + error.message)));
    }

    if (response.statusCode !== 200) {
      callback(new Error('API responded with ' + response.statusCode + '\n' + uri));
      return false;
    }

    try {
      result = JSON.parse(body);
    } catch (err) {
      callback(new Error(['Response was not JSON:', body].join('\n')));
      return false;
    }

    if (result.status === 'fail') {
      callback(chalk.red('Fail: ' + result.error));
      return false;
    }

    var movies;
    try {
      expect(result.data.movies, 'to be an array');
      movies = result.data.movies;
    } catch (err) {
      callback(chalk.yellow('No movies found for query: ' + query));
      return false;
    }

    try {
      expect(movies, 'to be an array whose items satisfy', function (movie) {
        expect(movie, 'to satisfy', {
          title: expect.it('to be a non-empty string'),
          title_long: expect.it('to be a non-empty string'),
          torrents: expect.it('to be an array whose items satisfy', function (torrent) {
            expect(torrent, 'to satisfy', {
              url: expect.it('to be a non-empty string'),
              hash: expect.it('to be a non-empty string'),
              quality: expect.it('to match', /720p|1080p|3D/),
              seeds: expect.it('to be a number'),
              peers: expect.it('to be a number'),
              size: expect.it('to be a non-empty string')
            });
          })
        });
      });
    } catch (err) {
      callback(err);
      return false;
    }

    var torrents = [];
    movies.forEach(function (movie) {
      movie.torrents.forEach(function (torrent) {
        if (quality !== null && torrent.quality !== quality) {
          return;
        }

        torrents.push(extend(torrent, {
          title: movie.title,
          title_long: movie.title_long,
          magnet: magnetURI(torrent.hash, movie.title_long)
        }));
      });
    });

    if (torrents.length === 1) {
      callback(undefined, torrents.pop());
    } else {
      inquirer.prompt([{
        type: 'list',
        message: 'There are multiple movies matching your query',
        choices: torrents.map(function (torrent) {
          return {
            name: renderTorrent(torrent),
            value: torrent
          };
        }),
        name: 'torrent'
      }], function (answers) {
        callback(undefined, answers.torrent);
      });
    }
  });
};
