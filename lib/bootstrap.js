var backends = require('./backends');


module.exports = function(config, engine, httpFactory) {
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
};
