var backends = require('./backends');


module.exports = function(config, engine, httpFactory, udpFactory) {
    var backend = backends.get(config.backend);

    backend.setConfig({
        peerTTL: config.interval * 3
    });

    engine.setBackend(backend);
    engine.setConfig({
        maxPeers: config.maxPeers
    });

    config.http && httpFactory.create()
        .setEngine(engine)
        .setConfig({
            port: config.httpPort,
            trustProxy: config.httpTrustProxy,
            interval: config.interval,
            compress: config.httpCompress
        })
        .serve();

    config.udp && udpFactory.create()
        .setEngine(engine)
        .setConfig({
            port: config.udpPort,
            interval: config.interval
        })
        .serve();
};
