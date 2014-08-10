var backends = require('./backends');
var pkg = require('../package.json');
var yargs = require('yargs');


// TODO, show environment variables on help
function Config() {
}

Config.prototype.parse = function(cla, noCkecks) {
    return (Array.isArray(cla) ? yargs(cla) : yargs)
        .strict()
        .usage('Usage: ' + pkg.name + ' [options]')
        .help('help')
        .alias('help', 'h')
        .version(pkg.version, 'version', 'Display the current version')
        .alias('version', 'v')
        .describe('http', 'Serves HTTP requests')
        .boolean('http')
        .describe('http-port', 'The TCP port the HTTP server must listen to')
        .requiresArg('http-port')
        .default('http-port', process.env.BTT_HTTP_PORT || 80)
        .describe('http-trust-proxy', 'Enables reverse proxy support')
        .boolean('http-trust-proxy')
        .describe('udp', 'Serves UDP requests')
        .boolean('udp')
        .describe('list-backends', 'Display the available backends')
        .boolean('list-backends')
        .describe('backend', 'The backend storage to use')
        .requiresArg('backend')
        .default('backend', 'memory')
        .describe('interval', 'Interval the client should wait between requests (in secs)')
        .requiresArg('interval')
        .default('interval', 600)
        .describe('max-peers', 'The maximum number of peers to send to clients')
        .requiresArg('max-peers')
        .default('max-peers', 80)
        .example(pkg.name + ' --http --http-port 8080', 'starts the tracker serving HTTP requests on port 8080')
        .example(pkg.name + ' --http --backend memory', 'starts the tracker serving HTTP requests on port 8080')
        .check(function(argv) {
            if (argv['list-backends'] === true) {
                console.log(backends.list().join(' '));
                process.exit(0);
            }
            if (backends.list().indexOf(argv.backend) < 0) {
                return 'Unknown backend: ' + argv.backend;
            }
            if (argv.udp) {
                return 'The UDP server is not yet implemented...';
            }
            argv['http-port'] = parseInt(argv['http-port']);
            if (isNaN(argv['http-port'])) {
                return 'Invalid argument value: http-port';
            }
            argv.interval = parseInt(argv.interval);
            if (isNaN(argv.interval)) {
                return 'Invalid argument value: interval';
            }
            argv['max-peers'] = parseInt(argv['max-peers']);
            if (isNaN(argv['max-peers'])) {
                return 'Invalid argument value: max-peers';
            }
            if (!noCkecks && !argv.http && !argv.udp) {
                return 'Please start an HTTP server (--http) and or a UDP server (--udp)';
            }
        })
        .argv;
};

module.exports = Config;
