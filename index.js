#!/usr/bin/env node
var bootstrap = require('./lib/bootstrap');
var Engine = require('./lib/engine');
var HttpFactory = require('./lib/httpFactory');
var UdpFactory = require('./lib/udpFactory');
var Config = require('./lib/config');


bootstrap(new Config().parse(), new Engine(), new HttpFactory(), new UdpFactory());
