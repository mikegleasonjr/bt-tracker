var util = require('util');
var express = require('express');
var responseTime = require('response-time');
var bencode = require('bencode');
var querystring = require('querystring');
var binaryString = require('binary-string');
var string2compact = require('string2compact');
var compression = require('compression');
var pkg = require('../package.json');


querystring.unescape = unescape;

var Http = module.exports = function Http() {
    this.config = null;
    this.app = express();

    this.app.set('query parser', querystring.parse);
    this.app.enable('strict routing');

    this.app.use(compression({ filter: this.canCompressResponse.bind(this) }));
    this.app.use(responseTime());
    this.app.use(this.onAnyRequest.bind(this));

    this.app.get('/heartbeat', this.onHeartbeat.bind(this));
    this.app.get('/announce', this.onAnnounce.bind(this));
};

Http.prototype.setConfig = function(config) {
    this.config = config;

    this.app.set('trust proxy', config.trustProxy);
    this.app.set('x-powered-by', false);

    return this;
};

Http.prototype.setEngine = function(engine) {
    this.engine = engine;
    return this;
};

Http.prototype.serve = function() {
    this.app.listen(this.config.port, function() {
        util.log('HTTP server listening on port ' + this.config.port);
    }.bind(this));
};

Http.prototype.onAnyRequest = function(req, res, next) {
    res.set('Content-Type', 'text/plain');
    res.set('X-Powered-By', pkg.name + ' ' + pkg.version);
    next();
};

Http.prototype.canCompressResponse = function() {
    return this.config.compress === true;
};

Http.prototype.onHeartbeat = function(req, res) {
    res.send('OK');
};

Http.prototype.onAnnounce = function(req, res) {
    var params = this._buildAnnounceParams(req);

    this.engine.announce(params, function(err, swarm) {
        if (err) {
            res.send(bencode.encode({ 'failure reason': err }));
            return;
        }

        var skipPeerId = Number(req.query.no_peer_id) === 1;
        var peers = Number(req.query.compact) === 1 ?
            this._buildPeersResponseCompact(swarm.peers) :
            this._buildPeersResponse(swarm.peers, skipPeerId);

        res.send(bencode.encode({
            complete: swarm.seeders,
            incomplete: swarm.leechers,
            interval: this.config.interval,
            peers: peers
        }));
    }.bind(this));
};

Http.prototype._buildAnnounceParams = function(req) {
    return {
        infoHash: binaryString.toBuffer(req.query.info_hash || ''),
        peerId: binaryString.toBuffer(req.query.peer_id || ''),
        port: Number(req.query.port),
        uploaded: Number(req.query.uploaded),
        downloaded: Number(req.query.downloaded),
        left: Number(req.query.left),
        compact: Number(req.query.compact),
        event: req.query.event,
        numWant: Number(req.query.numwant),
        ip: req.query.ip || req.ip,
        noPeerId: Number(req.query.no_peer_id)
    };
};

Http.prototype._buildPeersResponseCompact = function(peers) {
    return string2compact(peers.map(function(peer) {
        return peer.ip + ':' + peer.port;
    }));
};

Http.prototype._buildPeersResponse = function(peers, skipPeerId) {
    return peers.map(function(peer) {
        return skipPeerId ?
            { ip: peer.ip, port: peer.port } :
            { 'peer id': peer.id, ip: peer.ip, port: peer.port };
    });
};
