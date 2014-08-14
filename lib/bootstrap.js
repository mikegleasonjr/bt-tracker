var backends = require('./backends');


module.exports = function(config, engine, httpFactory, udpFactory) {
    var backend = backends.get(config.backend);

    backend.setConfig({
        peerTTL: config.interval * 3
    });

    engine.setConfig({
        maxPeers: config['max-peers']
    });

    engine.setBackend(backend);

    if (config.http) {
        var http = httpFactory.create();

        http.setEngine(engine);
        http.setConfig({
            port: config['http-port'],
            trustProxy: config['http-trust-proxy'],
            interval: config['interval'],
            compress: config['http-compress']
        });
        http.serve();
    }

    if (config.udp) {
        var udp = udpFactory.create();

        udp.setEngine(engine);
        udp.setConfig({
            port: config['udp-port'],
            interval: config['interval']
        });
        udp.serve();
    }
};
