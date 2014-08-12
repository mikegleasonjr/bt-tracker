var bootstrap = require('../lib/bootstrap');
var Config = require('../lib/config');
var Http = require('../lib/http');
var HttpFactory = require('../lib/httpFactory');
var sinon = require('sinon');
var backends = require('../lib/backends');
var Engine = require('../lib/engine');


describe('bootstrap', function() {
    var engine = new Engine();
    var http = new Http();
    var httpFactory = new HttpFactory();

    before(function () {
        sinon.stub(httpFactory, 'create').returns(http);
    });

    after(function () {
        httpFactory.create.restore();
    });

    describe('when bootstrapping the tracker', function() {
        it('should set the requested backend to the engine', function() {
            var config = new Config().parse(['--no-http'], true);
            var expectedBackend = backends.get('memory');
            var mock = sinon.mock(engine).expects('setBackend').once().withExactArgs(expectedBackend);

            bootstrap(config, engine, httpFactory);

            mock.verify();
            engine.setBackend.restore();
        });

        it('should configure the engine', function() {
            var config = new Config().parse(['--no-http'], true);
            var mock = sinon.mock(engine).expects('setConfig').once().withExactArgs(sinon.match({
                maxPeers: 'max-peers-123'
            }));

            config['max-peers'] = 'max-peers-123';
            bootstrap(config, engine, httpFactory);

            mock.verify();
            engine.setConfig.restore();
        });
    });

    describe('when bootstrap should start the http server', function() {
        it('should configure the http server', function() {
            var config = new Config().parse(['--http']);
            var mock = sinon.mock(http);
            mock.expects('serve');
            mock.expects('setConfig').once().withExactArgs(sinon.match({
                port: 'http-port-12345',
                trustProxy: 'http-trust-proxy-12345',
                interval: 'interval-121',
                compress: 'compress-12345'
            }));

            config['http-port'] = 'http-port-12345';
            config['http-trust-proxy'] = 'http-trust-proxy-12345';
            config['interval'] = 'interval-121';
            config['http-compress'] = 'compress-12345';
            bootstrap(config, engine, httpFactory);

            mock.verify();
        });

        it('should set the engine to the http server', function() {
            var config = new Config().parse(['--http']);
            var mock = sinon.mock(http);
            mock.expects('setEngine').once().withExactArgs(engine);
            mock.expects('serve');

            bootstrap(config, engine, httpFactory);

            mock.verify();
        });

        it('should tell the http server to serve requests after configuring it', function() {
            var config = new Config().parse(['--http']);
            var mock = sinon.mock(http);
            var serve = mock.expects('serve').once().withExactArgs();
            mock.expects('setEngine').calledBefore(serve);
            mock.expects('setConfig').calledBefore(serve);

            bootstrap(config, engine, httpFactory);

            mock.verify();
        });
    });

    describe('when bootstrap shouldn\'t start the http server', function() {
        it('shouldn\'t tell the http server to serve requests', function() {
            var config = new Config().parse(['--no-http'], true);
            var mock = sinon.mock(http);
            mock.expects('serve').never();

            bootstrap(config, engine, httpFactory);

            mock.verify();
        });
    });
});
