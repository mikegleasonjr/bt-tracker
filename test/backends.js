var backends = require('../lib/backends');
var givenCli = require('./utils/cli');
var MemoryBackend = require('../lib/backends/memory');
var fs = require('fs');
var path = require('path');
require('should');


describe('backends', function() {
    describe('when listing backends', function() {
        it('should return the list of the available backends', function() {
            backends.list()
                .should.containEql('memory');
        });
    });

    describe('when requesting an instance of a backend', function() {
        it('should exists', function() {
            backends.get('memory')
                .should.be.an.instanceOf(MemoryBackend);
        });
    });

    describe('when dropping a new backend file in the backends directory', function() {
        var expectedBackendName = 'test-backend-' + parseInt(Math.random() * 1000);
        var backendFilename = './lib/backends/' + expectedBackendName + '.js';
        var backendFileContent = '' +
            'var TestBackend = module.exports = function TestBackend() { };' +
            'TestBackend.prototype.getName = function() { return "' + expectedBackendName + '"; };';

        before(function(done) {
            fs.writeFile(backendFilename, backendFileContent, done);
        });

        after(function(done) {
            fs.unlink(backendFilename, done);
        });

        it('should be automatically loaded and made available at runtime', function(done) {
            givenCli()
                .withParams(['--list-backends'])
                .expectStdout(expectedBackendName)
                .onRun(done);
        });
    });

    fs.readdirSync(path.join(__dirname, '../lib/backends')).forEach(function(source) {
        var Backend = require(path.join('../lib/backends/', source));
        var instance = new Backend();
        var requiredMethods = ['getName', 'getPeer', 'setPeer', 'delPeer', 'incSeeders', 'decSeeders', 'incLeechers', 'decLeechers', 'incDownloads', 'getSwarm'];

        describe(source, function() {
            requiredMethods.forEach(function(name) {
                it('should implement method ' + name, function() {
                    instance[name].should.have.type('function');
                });
            });
        });
    });
});
