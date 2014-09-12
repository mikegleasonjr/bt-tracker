var net = require('net');
var ip = require('ip');


// TODO cleanup... some keys will never be missing
module.exports = {
    announce: function(params) {
        if (params.infoHash === undefined) {
            return { 'error': 'missing info_hash' };
        }

        if (!(params.infoHash instanceof Buffer) || params.infoHash.length !== 20) {
            return { 'error': 'invalid info_hash' };
        }

        if (params.peerId === undefined) {
            return { 'error': 'missing peer_id' };
        }

        if (!(params.peerId instanceof Buffer) || params.peerId.length !== 20) {
            return { 'error': 'invalid peer_id' };
        }

        if (params.port === undefined) {
            return { 'error': 'missing port' };
        }

        params.port = Number(params.port);
        if (isNaN(params.port) || params.port < 1 || params.port > 65535) {
            return { 'error': 'invalid port' };
        }

        for (var p in { 'uploaded':'', 'downloaded':'', 'left':'' }) {
            if (params[p] === undefined) {
                return { 'error': 'missing ' + p };

            }
            params[p] = Number(params[p]);
            if (isNaN(params[p]) || params[p] < 0) {
                return { 'error': 'invalid ' + p };
            }
        }

        if (params.compact) {
            params.compact = Number(params.compact);
            if (params.compact !== 0 && params.compact !== 1) {
                return { 'error': 'invalid compact' };
            }
        }

        if (params.event) {
            if (!/^(started|completed|stopped)$/.test(params.event)) {
                return { 'error': 'invalid event' };
            }
        }

        if (params.numWant) {
            params.numWant = Number(params.numWant);
            if (isNaN(params.numWant) || params.numWant < 0) {
                return { 'error': 'invalid numwant' };
            }
        }

        if (params.ip) {
            if (net.isIP(params.ip) !== 4 || ip.isPrivate(params.ip)) {
                return { 'error': 'invalid ip' };
            }
        }

        if (params.noPeerId) {
            params.noPeerId = Number(params.noPeerId);
            if (params.noPeerId !== 0 && params.noPeerId !== 1) {
                return { 'error': 'invalid no_peer_id' };
            }
        }

        return params;
    }
};
