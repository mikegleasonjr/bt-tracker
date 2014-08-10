var Http = require('./http');


function HttpFactory() {
}

HttpFactory.prototype.create = function() {
    return new Http();
};

module.exports = HttpFactory;
