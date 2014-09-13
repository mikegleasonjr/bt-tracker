var sinon = require('sinon');
var backends = require('../lib/backends');
var Config = require('../lib/config');
var pkg = require('../package.json');
require('should');


describe('config', function() {
    var config = new Config();

    describe('when using an unknown command line argument', function() {
        it('should display an error and quit', mockStdio(function() {
            config.parse(['--does-not-exists']);
            shouldExitWithError('Unknown argument: does-not-exists');
        }));
    });

    describe('when requesting the version number with --version', function() {
        it('should display the version and quit', mockStdio(function() {
            config.parse(['--version']);
            shouldExitWithMessage(pkg.version);
        }));
    });

    describe('when requesting the version number with -v', function() {
        it('should display the version and quit', mockStdio(function() {
            config.parse(['-v']);
            shouldExitWithMessage(pkg.version);
        }));
    });

    describe('when requesting help with --help', function() {
        it('should display some help and quit', mockStdio(function() {
            config.parse(['--help']);
            shouldExitWithMessage(/.*Usage: bt-tracker \[options\].*/);
        }));
    });

    describe('when requesting help with -h', function() {
        it('should display some help and quit', mockStdio(function() {
            config.parse(['-h']);
            shouldExitWithMessage(/.*Usage: bt-tracker \[options\].*/);
        }));
    });

    describe('when not specifying --http', function() {
        it('should still be defined in the configs and be false', mockStdio(function() {
            config.parse([])
                .should.containEql({ http: false });
        }));
    });

    describe('when specifying --http', function() {
        it('should be true', mockStdio(function() {
            config.parse(['--http'])
                .should.containEql({ http: true });
        }));
    });

    describe('when not specifying --http-port', function() {
        it('should still be defined in the configs and be 80', mockStdio(function() {
            config.parse([])
                .should.containEql({ httpPort: 80 });
        }));
    });

    describe('when specifying the http port via an environment variable', function() {
        before(function() {
            process.env.BTT_HTTP_PORT = 11234;
        });

        after(function() {
            delete process.env.BTT_HTTP_PORT;
        });

        it('should have the value of the environment variable as the default value', mockStdio(function() {
            config.parse([])
                .should.containEql({ httpPort: 11234 });
        }));
    });

    describe('when not specifying an argument to --http-port', function() {
        it('should display an error and quit', mockStdio(function() {
            config.parse(['--http-port']);
            shouldExitWithError('Missing argument value: http-port');
        }));
    });

    describe('when specifying an invalid argument to --http-port', function() {
        it('should display an error and quit', mockStdio(function() {
            config.parse(['--http-port', 'abc']);
            shouldExitWithError('Invalid argument value: http-port');
        }));
    });

    describe('when specifying an argument to --http-port', function() {
        it('should have the value of the argument', mockStdio(function() {
            config.parse(['--http-port', '15352'])
                .should.containEql({ httpPort: 15352 });
        }));
    });

    describe('when not specifying --http-trust-proxy', function() {
        it('should still be defined in the configs and be false', mockStdio(function() {
            config.parse([])
                .should.containEql({ httpTrustProxy: false });
        }));
    });

    describe('when specifying --http-trust-proxy', function() {
        it('should be true', mockStdio(function() {
            config.parse(['--http-trust-proxy'])
                .should.containEql({ httpTrustProxy: true });
        }));
    });

    describe('when not specifying --http-compress', function() {
        it('should still be defined in the configs and be false', mockStdio(function() {
            config.parse([])
                .should.containEql({ httpCompress: false });
        }));
    });

    describe('when specifying --http-compress', function() {
        it('should be true', mockStdio(function() {
            config.parse(['--http-compress'])
                .should.containEql({ httpCompress: true });
        }));
    });

    describe('when not specifying --udp', function() {
        it('should still be defined in the configs and be false', mockStdio(function() {
            config.parse([])
                .should.containEql({ udp: false });
        }));
    });

    describe('when specifying --udp', function() {
        it('should be true', mockStdio(function() {
            config.parse(['--udp'])
                .should.containEql({ udp: true });
        }));
    });

    describe('when not specifying --udp-port', function() {
        it('should still be defined in the configs and be 8080', mockStdio(function() {
            config.parse([])
                .should.containEql({ udpPort: 8080 });
        }));
    });

    describe('when specifying the udp port via an environment variable', function() {
        before(function() {
            process.env.BTT_UDP_PORT = 11234;
        });

        after(function() {
            delete process.env.BTT_UDP_PORT;
        });

        it('should have the value of the environment variable as the default value', mockStdio(function() {
            config.parse([])
                .should.containEql({ udpPort: 11234 });
        }));
    });

    describe('when not specifying an argument to --udp-port', function() {
        it('should display an error and quit', mockStdio(function() {
            config.parse(['--udp-port']);
            shouldExitWithError('Missing argument value: udp-port');
        }));
    });

    describe('when specifying an invalid argument to --udp-port', function() {
        it('should display an error and quit', mockStdio(function() {
            config.parse(['--udp-port', 'abc']);
            shouldExitWithError('Invalid argument value: udp-port');
        }));
    });

    describe('when specifying an argument to --udp-port', function() {
        it('should have the value of the argument', mockStdio(function() {
            config.parse(['--udp-port', '15352'])
                .should.containEql({ udpPort: 15352 });
        }));
    });

    describe('when not specifying --list-backends', function() {
        it('should still be defined in the configs and be false', mockStdio(function() {
            config.parse([])
                .should.containEql({ listBackends: false });
        }));
    });

    describe('when specifying --list-backends', function() {
        it('should display the list fo available backends and quit', mockStdio(function() {
            config.parse(['--list-backends']);
            shouldExitWithMessage(backends.list().join(' '));
        }));
    });

    describe('when not specifying --backend', function() {
        it('should still be defined in the configs and be memory', mockStdio(function() {
            config.parse([])
                .should.containEql({ backend: 'memory' });
        }));
    });

    describe('when not specifying an argument to --backend', function() {
        it('should display an error and quit', mockStdio(function() {
            config.parse(['--backend']);
            shouldExitWithError('Missing argument value: backend');
        }));
    });

    describe('when specifying an argument to --backend', function() {
        it('should have the value of the argument', mockStdio(function() {
            config.parse(['--backend', 'memory'])
                .should.containEql({ backend: 'memory' });
        }));
    });

    describe('when specifying a non-existing backend', function() {
        it('should display an error and quit', mockStdio(function() {
            config.parse(['--backend', 'non-existing-backend']);
            shouldExitWithError('Unknown backend: non-existing-backend');
        }));
    });

    describe('when not specifying --redis-host', function() {
        it('should still be defined in the configs and be localhot', mockStdio(function() {
            config.parse([])
                .should.containEql({ redisHost: 'localhost' });
        }));
    });

    describe('when specifying the redis host via an environment variable', function() {
        before(function() {
            process.env.BTT_REDIS_HOST = '1.2.3.4';
        });

        after(function() {
            delete process.env.BTT_REDIS_HOST;
        });

        it('should have the value of the environment variable as the default value', mockStdio(function() {
            config.parse([])
                .should.containEql({ redisHost: '1.2.3.4' });
        }));
    });

    describe('when not specifying an argument to --redis-host', function() {
        it('should display an error and quit', mockStdio(function() {
            config.parse(['--redis-host']);
            shouldExitWithError('Missing argument value: redis-host');
        }));
    });

    describe('when specifying an argument to --redis-host', function() {
        it('should have the value of the argument', mockStdio(function() {
            config.parse(['--redis-host', 'redis.host.com'])
                .should.containEql({ redisHost: 'redis.host.com' });
        }));
    });

    describe('when not specifying --redis-port', function() {
        it('should still be defined in the configs and be 6379', mockStdio(function() {
            config.parse([])
                .should.containEql({ redisPort: 6379 });
        }));
    });

    describe('when specifying the redis port via an environment variable', function() {
        before(function() {
            process.env.BTT_REDIS_PORT = 11234;
        });

        after(function() {
            delete process.env.BTT_REDIS_PORT;
        });

        it('should have the value of the environment variable as the default value', mockStdio(function() {
            config.parse([])
                .should.containEql({ redisPort: 11234 });
        }));
    });

    describe('when not specifying an argument to --redis-port', function() {
        it('should display an error and quit', mockStdio(function() {
            config.parse(['--redis-port']);
            shouldExitWithError('Missing argument value: redis-port');
        }));
    });

    describe('when specifying an invalid argument to --redis-port', function() {
        it('should display an error and quit', mockStdio(function() {
            config.parse(['--redis-port', 'abc']);
            shouldExitWithError('Invalid argument value: redis-port');
        }));
    });

    describe('when specifying an argument to --redis-port', function() {
        it('should have the value of the argument', mockStdio(function() {
            config.parse(['--redis-port', '15352'])
                .should.containEql({ redisPort: 15352 });
        }));
    });

    describe('when not specifying any server to start (--no-http --no-udp)', function() {
        it('should display a notice to use at least one server and quit', mockStdio(function() {
            config.parse(['--no-http', '--no-udp']);
            shouldExitWithError('Please start an HTTP server (--http) and or a UDP server (--udp)');
        }));
    });

    describe('when not specifying --interval', function() {
        it('should still be defined in the configs and be 600', mockStdio(function() {
            config.parse([])
                .should.containEql({ interval: 600 });
        }));
    });

    describe('when specifying an argument to --interval', function() {
        it('should have the value of the argument', mockStdio(function() {
            config.parse(['--interval', '123'])
                .should.containEql({ interval: 123 });
        }));
    });

    describe('when specifying an invalid argument to --interval', function() {
        it('should display an error and quit', mockStdio(function() {
            config.parse(['--interval', 'abc']);
            shouldExitWithError('Invalid argument value: interval');
        }));
    });

    describe('when not specifying --max-peers', function() {
        it('should still be defined in the configs and be 80', mockStdio(function() {
            config.parse([])
                .should.containEql({ maxPeers: 80 });
        }));
    });

    describe('when specifying an argument to --max-peers', function() {
        it('should have the value of the argument', mockStdio(function() {
            config.parse(['--max-peers', '123'])
                .should.containEql({ maxPeers: 123 });
        }));
    });

    describe('when specifying an invalid argument to --max-peers', function() {
        it('should display an error and quit', mockStdio(function() {
            config.parse(['--max-peers', 'abc']);
            shouldExitWithError('Invalid argument value: max-peers');
        }));
    });

    function shouldExitWithError(message) {
        console.error.calledWith(sinon.match(message)).should.be.true;
        process.exit.calledWith(1).should.be.true;
    }

    function shouldExitWithMessage(message) {
        console.log.calledWith(sinon.match(message)).should.be.true;
        process.exit.calledWith(0).should.be.true;
    }

    function mockStdio(test) {
        return function() {
            sinon.stub(process, 'exit');
            sinon.stub(console, 'error');
            sinon.stub(console, 'log');
            try {
                test();
            }
            catch (e) {
                throw new Error(e);
            }
            finally {
                process.exit.restore();
                console.error.restore();
                console.log.restore();
            }
        };
    }
});
