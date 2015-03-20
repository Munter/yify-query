yify-query
==========
[![NPM version](https://badge.fury.io/js/yify-query.svg)](http://badge.fury.io/js/yify-query)
[![Build Status](https://travis-ci.org/Munter/yify-query.svg?branch=master)](https://travis-ci.org/Munter/yify-query)
[![Dependency Status](https://david-dm.org/Munter/yify-query.svg)](https://david-dm.org/Munter/yify-query)

Find torrent magnet links from the yify database directly from the command line or in your node modules


Command line usage
------------------

```
$ npm install -g yify-query
$ yify-query big hero 6
```


Programmatic usage
------------------

``` javascript
var query = require('yify-query');

query('big hero 6', function (error, result) {
  // result = {
  //   "url": "https://yts.to/torrent/download/....torrent",
  //   "hash": "...",
  //   "quality": "720p",
  //   "seeds": 8754,
  //   "peers": 1873,
  //   "size": "810.17 MB",
  //   "size_bytes": 849526274,
  //   "date_uploaded": "2015-02-05 10:50:46",
  //   "date_uploaded_unix": 1423086646,
  //   "magnet": "magnet:?xt=urn:btih:...",
  //   "title_long": "Big Hero 6 (2014)",
  //   "title": "Big Hero 6"
  // }
});
```


License
-------
(The MIT License)

Copyright (c) 2014 Peter Müller <munter@fumle.dk>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
