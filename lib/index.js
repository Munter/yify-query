var request = require('request');
var inquirer = require('inquirer');
var chalk = require('chalk');

// TODO: Incomplete list
var API = {
  upcoming: 'https://yts.re/api/upcoming.json', // https://yts.re/api#upcomingDocs
  list: 'https://yts.re/api/list.json' // https://yts.re/api#listDocs
};

function renderMovie(movie) {
  return [
    movie.MovieTitle.replace(movie.Quality, '').trim(),
    chalk.blue(movie.Quality),
    chalk.magenta(movie.Size + ' (' + chalk.green(movie.TorrentSeeds) + '/' + chalk.yellow(movie.TorrentPeers) + ')')
  ].join(', ');
}

module.exports = function (query, callback) {
  var uri = API.list + '?keywords=' + query;
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

    var movies = result.MovieList;

    if (movies.length === 0) {
      callback(chalk.yellow('No movies found for query: ' + query));
      return false;
    }

    if (movies.length === 1) {
      callback(undefined, movies.pop());
    } else {
      inquirer.prompt([{
        type: 'list',
        message: 'There are multiple movies matching your query',
        choices: movies.map(function (movie) {
          return {
            name: renderMovie(movie),
            value: movie
          };
        }),
        name: 'movie'
      }], function (answers) {
        callback(undefined, answers.movie);
      });
    }
  });
};
