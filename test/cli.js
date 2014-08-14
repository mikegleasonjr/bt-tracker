var request = require('supertest');
var givenCli = require('./utils/cli');
var givenAvailableRandomPort = require('./utils/randomPort');
var backends = require('../lib/backends');


// these are some integration tests to see if everything is wired up properly...
// see test/config.js for the command line unit tests
describe('command-line interface', function() {
    describe('when requesting help with --help', function() {
        it('should display some help and quit', function(done) {
            givenCli()
                .withParams(['--help'])
                .expectStdout('Usage: bt-tracker [options]')
                .onRun(done);
        });
    });

    describe('when not specifying any server to start', function() {
        it('should display a notice to use at least one server', function(done) {
            givenCli()
                .withParams(['--no-http', '--no-udp'])
                .expectStderr('Please start an HTTP server (--http) and or a UDP server (--udp)')
                .onRun(done);
        });
    });

    describe('when requesting an HTTP server on a specific port using arguments', function() {
        it('should start an HTTP server on that port', function(done) {
            givenAvailableRandomPort(function(port) {
                givenCli()
                    .withParams(['--http', '--http-port', port])
                    .whenStdout('HTTP server listening on port')
                    .check(function(done) {
                        request('http://localhost:' + port)
                            .get('/heartbeat')
                            .expect(200, 'OK', done);
                    })
                    .onRun(done);
            });
        });
    });

    describe('when requesting an HTTP server on a specific port using environment variables', function() {
        it('should start an HTTP server on that port', function(done) {
            givenAvailableRandomPort(function(port) {
                givenCli()
                    .withParams(['--http'])
                    .withEnv('BTT_HTTP_PORT', port)
                    .whenStdout('HTTP server listening on port')
                    .check(function(done) {
                        request('http://localhost:' + port)
                            .get('/heartbeat')
                            .expect(200, 'OK', done);
                    })
                    .onRun(done);
            });
        });
    });

    describe('when listing available backends', function() {
        it('should display the available backends and quit', function(done) {
            givenCli()
                .withParams(['--list-backends'])
                .expectStdout(backends.list().join(' '))
                .onRun(done);
        });
    });
});
