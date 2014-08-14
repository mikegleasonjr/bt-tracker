var backends = require('./backends');


module.exports = function(config, engine, httpFactory) {
    var backend = backends.get(config.backend);

    backend.setConfig({
        peerTTL: config.interval * 3
    });

    engine.setConfig({
        maxPeers: config.maxPeers
    });

    engine.setBackend(backend);

    if (config.http) {
        var http = httpFactory.create();

        http.setEngine(engine);
        http.setConfig({
            port: config.httpPort,
            trustProxy: config.httpTrustProxy,
            interval: config.interval,
            compress: config.httpCompress
        });
        http.serve();
    }
};
