/**
 * XadillaX created at 2016-03-29 17:46:57 With ♥
 *
 * Copyright (c) 2016 akyuu.moe, all rights
 * reserved.
 */
"use strict";

var EventEmitter = require("events").EventEmitter;
var http = require("http");
var util = require("util");

var proto = require("express/lib/application");
var req = require("express/lib/request");
var resp = require("./response");

/**
 * _ExpressApplication
 * @constructor
 */
var _ExpressApplication = function() {
    EventEmitter.call(this);

    this.request = { __proto__: req, app: this };       // jshint ignore: line
    this.response = { __proto__: resp, app: this };     // jshint ignore: line
};

util.inherits(_ExpressApplication, EventEmitter);

for(var key in proto) {
    if(!proto.hasOwnProperty(key)) continue;
    _ExpressApplication.prototype[key] = proto[key];
}

/**
 * listen
 */
_ExpressApplication.prototype.listen = function() {
    var server = http.createServer((function(req, resp, next) {
        this.handle(req, resp, next);
    }).bind(this));

    // support listen on unix socket file, server.close() will delete unix socket file when process exit
    process.on("SIGINT", function() {
        server.close();
        process.exit(0);
    });

    process.on("uncaughtException", function(error) {
        console.log(error);
        server.close();
        process.exit(1);
    });

    return server.listen.apply(server, arguments);
};

module.exports = _ExpressApplication;
