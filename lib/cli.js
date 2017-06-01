const Table        = require('le-table');
const parseTorrent = require('parse-torrent');
const version      = require('../package.json').version;
const options      = require('docopt').docopt(`
Usage:
  torrent-info [options] <input>

Options:
  -h --help     Show this
  -c --convert  Convert torrent file to magnet URI or vice versa
  -j --json     JSON output
  -v --verbose  Verbose output

`, { version });

let verbose = options['--verbose'];

module.exports = function() {
  // Parse input (file or magnet URI)
  let input = options['<input>'];
  if (! /^magnet:/i.test(input)) {
    input = require('fs').readFileSync(input);
  }
  let parsed = parseTorrent(input);

  // Convert?
  if (options['--convert']) {
    console.log(parseTorrent[ typeof input === 'string' ? 'toTorrentFile' : 'toMagnetURI' ](parsed));
    process.exit(0);
  }

  // Remove some fields.
  [ 'info', 'infoBuffer', 'infoHashBuffer' ].forEach(key => {
    delete parsed[key]
  });

  // Show.
  if (options['--json']) {
    console.log(JSON.stringify(parsed, null, 2));
  } else {
    let table = new Table();
    Object.keys(parsed).forEach(key => {
      let value = parsed[key];

      if (value.length === 0) return;
      if (! verbose && [ 'pieces', 'pieceLength', 'lastPieceLength' ].includes(key)) {
        return;
      }

      if (key === 'pieces') {
        value = value.join('\n');
      } else if (key === 'files') {
        let fileTable = new Table();
        for (let file of value) {
          fileTable.addRow([ file.name, file.length ]);
        }
        value = fileTable.stringify();
      }
      table.addRow([ key, value ]);
    });
    console.log(table.stringify());
  }
}
