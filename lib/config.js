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
        .describe('http-port', 'The port the HTTP server must listen to')
        .requiresArg('http-port')
        .default('http-port', Number(process.env.BTT_HTTP_PORT) || 80)
        .describe('http-trust-proxy', 'Enables reverse proxy support')
        .boolean('http-trust-proxy')
        .describe('http-compress', 'Enables HTTP compression')
        .boolean('http-compress')
        .describe('udp', 'Serves UDP requests')
        .boolean('udp')
        .describe('udp-port', 'The port the UDP server must listen to')
        .requiresArg('udp-port')
        .default('udp-port', Number(process.env.BTT_UDP_PORT) || 8080)
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
        // TODO, better examples
        //.example(pkg.name + ' --http --http-port 8080', 'starts the tracker serving HTTP requests on port 8080')
        //.example(pkg.name + ' --http --backend memory', 'starts the tracker serving HTTP requests on port 8080')
        .check(function(argv) {
            if (argv['list-backends'] === true) {
                console.log(backends.list().join(' '));
                process.exit(0);
            }
            if (backends.list().indexOf(argv.backend) < 0) {
                return 'Unknown backend: ' + argv.backend;
            }
            for (var a in { 'http-port': '', 'udp-port': '', 'interval': '', 'max-peers': '' }) {
                argv[a] = Number(argv[a]);
                if (isNaN(argv[a])) {
                    return 'Invalid argument value: ' + a;
                }
            }
            if (!noCkecks && !argv.http && !argv.udp) {
                return 'Please start an HTTP server (--http) and or a UDP server (--udp)';
            }
        })
        .argv;
};

module.exports = Config;
