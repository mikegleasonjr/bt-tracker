var bootstrap = require('../lib/bootstrap');
var Config = require('../lib/config');
var Http = require('../lib/http');
var Udp = require('../lib/udp');
var HttpFactory = require('../lib/httpFactory');
var UdpFactory = require('../lib/udpFactory');
var sinon = require('sinon');
var backends = require('../lib/backends');
var Engine = require('../lib/engine');


describe('bootstrap', function() {
    var engine = new Engine();
    var http = new Http();
    var httpFactory = new HttpFactory();
    var udp = new Udp();
    var udpFactory = new UdpFactory();

    before(function () {
        sinon.stub(httpFactory, 'create').returns(http);
        sinon.stub(udpFactory, 'create').returns(udp);
    });

    after(function () {
        httpFactory.create.restore();
        udpFactory.create.restore();
    });

    describe('when bootstrapping the tracker', function() {
        it('should set the requested backend to the engine', function() {
            var config = new Config().parse([], true);
            var expectedBackend = backends.get('memory');
            var mock = sinon.mock(engine).expects('setBackend').once().withExactArgs(expectedBackend);

            bootstrap(config, engine, httpFactory, udpFactory);

            mock.verify();
            engine.setBackend.restore();
        });

        it('should configure the engine', function() {
            var config = new Config().parse([], true);
            var mock = sinon.mock(engine).expects('setConfig').once().withExactArgs(sinon.match({
                maxPeers: 'max-peers-123'
            }));

            config.maxPeers = 'max-peers-123';
            bootstrap(config, engine, httpFactory);

            mock.verify();
            engine.setConfig.restore();
        });

        it('should configure the backend', function() {
            var backend = backends.get('memory');
            var config = new Config().parse(['--interval', '620'], true);
            var mock = sinon.mock(backend).expects('setConfig').once().withExactArgs(sinon.match({
                peerTTL: 620 * 3
            }));

            bootstrap(config, engine, httpFactory, udpFactory);

            mock.verify();
            backend.setConfig.restore();
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
            })).returns(http);

            config.httpPort = 'http-port-12345';
            config.httpTrustProxy = 'http-trust-proxy-12345';
            config.interval = 'interval-121';
            config.httpCompress = 'compress-12345';
            bootstrap(config, engine, httpFactory);

            mock.verify();
        });

        it('should set the engine to the http server', function() {
            var config = new Config().parse(['--http']);
            var mock = sinon.mock(http);
            mock.expects('setEngine').once().withExactArgs(engine).returns(http);
            mock.expects('serve');

            bootstrap(config, engine, httpFactory, udpFactory);

            mock.verify();
        });

        it('should tell the http server to serve requests after configuring it', function() {
            var config = new Config().parse(['--http']);
            var mock = sinon.mock(http);
            var serve = mock.expects('serve').once().withExactArgs();
            mock.expects('setEngine').returns(http).calledBefore(serve);
            mock.expects('setConfig').returns(http).calledBefore(serve);

            bootstrap(config, engine, httpFactory, udpFactory);

            mock.verify();
        });
    });

    describe('when bootstrap shouldn\'t start the http server', function() {
        it('shouldn\'t tell the http server to serve requests', function() {
            var config = new Config().parse(['--no-http'], true);
            var mock = sinon.mock(http);
            mock.expects('serve').never();

            bootstrap(config, engine, httpFactory, udpFactory);

            mock.verify();
        });
    });

    describe('when bootstrap should start the udp server', function() {
        it('should configure the udp server', function() {
            var config = new Config().parse(['--udp']);
            var mock = sinon.mock(udp);
            mock.expects('serve');
            mock.expects('setConfig').once().withExactArgs(sinon.match({
                port: 'udp-port-12345',
                interval: 'interval-121'
            })).returns(udp);

            config.udpPort = 'udp-port-12345';
            config.interval = 'interval-121';
            bootstrap(config, engine, httpFactory, udpFactory);

            mock.verify();
        });

        it('should set the engine to the udp server', function() {
            var config = new Config().parse(['--udp']);
            var mock = sinon.mock(udp);
            mock.expects('setEngine').once().withExactArgs(engine).returns(udp);
            mock.expects('serve');

            bootstrap(config, engine, httpFactory, udpFactory);

            mock.verify();
        });

        it('should tell the udp server to serve requests after configuring it', function() {
            var config = new Config().parse(['--udp']);
            var mock = sinon.mock(udp);
            var serve = mock.expects('serve').once().withExactArgs();
            mock.expects('setEngine').returns(udp).calledBefore(serve);
            mock.expects('setConfig').returns(udp).calledBefore(serve);

            bootstrap(config, engine, httpFactory, udpFactory);

            mock.verify();
        });
    });

    describe('when bootstrap shouldn\'t start the udp server', function() {
        it('shouldn\'t tell the udp server to serve requests', function() {
            var config = new Config().parse(['--no-udp'], true);
            var mock = sinon.mock(udp);
            mock.expects('serve').never();

            bootstrap(config, engine, httpFactory, udpFactory);

            mock.verify();
        });
    });
});
