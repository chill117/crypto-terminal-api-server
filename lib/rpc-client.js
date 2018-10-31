'use strict';

var _ = require('underscore');
var request = require('request');

var RpcClient = module.exports = function(options) {

	this.options = _.defaults({}, options || {
		uri: null,
		username: null,
		password: null,
		whiteListCommands: [],
	});

	this.id = _.uniqueId('rpc-client');
};

RpcClient.prototype.cmd = function(method, params, cb) {

	if (_.isFunction(params)) {
		cb = params;
		params = [];
	}

	if (this.options.whiteListCommands && this.options.whiteListCommands.length > 0) {
		if (!_.contains(this.options.whiteListCommands, method)) {
			throw new Error('Invalid (or disallowed) method: "' + method + '"');
		}
	}

	request({
		url: this.options.uri,
		method: 'POST',
		auth: {
			user: this.options.username,
			pass: this.options.password,
		},
		body: JSON.stringify({
			id: _.uniqueId(this.id + '-request'),
			method: method,
			params: params,
		}) + '\n',
	}, function(error, response) {

		if (error) {
			return cb(error);
		}

		if (response.statusCode >= 400) {
			return cb(new Error('HTTP Error: ' + response.statusCode));
		}

		try {
			var data = JSON.parse(response.body);
		} catch (error) {
			return cb(error);
		}

		if (data.error) {
			error = new Error(data.error.message);
			error.code = data.error.code;
			return cb(error);
		}

		cb(null, data.result);
	});
};
