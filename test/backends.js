var backends = require('../lib/backends');
var givenCli = require('./utils/cli');
var MemoryBackend = require('../lib/backends/memory');
var RedisBackend = require('../lib/backends/redis');
var fs = require('fs');
var path = require('path');
require('should');


describe('backends', function() {
    describe('when listing backends', function() {
        it('should return the list of the available backends', function() {
            backends.list()
                .should.containEql('memory')
                .and.containEql('redis');
        });
    });

    describe('when requesting an instance of the memory backend', function() {
        it('should exists', function() {
            backends.get('memory')
                .should.be.an.instanceOf(MemoryBackend);
        });
    });

    describe('when requesting an instance of the redis backend', function() {
        it('should exists', function() {
            backends.get('redis')
                .should.be.an.instanceOf(RedisBackend);
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
        var requiredMethods = ['getName', 'setConfig', 'setPeer', 'delPeer', 'incDownloads', 'getSwarm', 'listSwarms', 'addConnId', 'isConnId'];

        describe(source, function() {
            requiredMethods.forEach(function(name) {
                it('should implement method ' + name, function() {
                    instance[name].should.have.type('function');
                });
            });
        });
    });
});
