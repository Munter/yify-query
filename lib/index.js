var request = require('request');
var inquirer = require('inquirer');
var chalk = require('chalk');
var extend = require('util')._extend;

var expect = require('unexpected');

// TODO: Incomplete list
var API = {
  upcoming: 'https://yts.to/api/upcoming.json', // https://yts.re/api#upcomingDocs
  list: 'https://yts.to/api/v2/list_movies.json' // http://yts.to/api#list_movies
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

  var uri = API.list + '?query_term=' + query + (quality ? '&quality=' + quality : '');

  console.error('Searching for:', query);

  request({
    method: 'GET',
    uri: uri
  }, function (error, response, body) {
    if (error) {
      return callback(new Error(chalk.red('API query failure: ' + error.message)));
    }

    var result = JSON.parse(body);
    if (result.status === 'fail') {
      callback(chalk.red('Fail: ' + result.error));
      return false;
    }

    expect(result.data.movies, 'to be an array');
    var movies = result.data.movies;

    if (movies.length === 0) {
      callback(chalk.yellow('No movies found for query: ' + query));
      return false;
    }

    expect(movies, 'to be a non-empty array whose items satisfy', function (movie) {
      expect(movie, 'to satisfy', {
        title: expect.it('to be a non-empty string'),
        title_long: expect.it('to be a non-empty string'),
        torrents: expect.it('to be a non-empty array whose items satisfy', function (torrent) {
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

    var torrents = [];
    movies.forEach(function (movie) {
      movie.torrents.forEach(function (torrent) {
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
