'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');

	var service = {

		isSupportedNetwork: function(network) {

			return !!this.instances[network];
		},

		cmd: function(network, method, params, cb) {

			if (!this.isSupportedNetwork(network)) {
				return cb(new Error('Unsupported network: "' + network + '"'));
			}

			if (!_.isString(method)) {
				return cb(new Error('Invalid argument ("method"): String expected'));
			}

			if (!_.isArray(params)) {
				return cb(new Error('Invalid argument ("params"): Array expected'));
			}

			var instances = this.instances[network];
			var index = 0;
			var succeeded = false;
			var lastArguments;

			async.until(function() {
				return succeeded || !instances[index];
			}, function(next) {
				var instance = instances[index++];
				instance.cmd(method, params, function(error, result) {
					lastArguments = arguments;
					succeeded = !error;
					next();
				});
			}, function() {
				cb.apply(undefined, lastArguments);
			});
		},

		resetInstances: function() {

			this.instances = {};
		},

		prepareInstances: function() {

			this.instances = _.mapObject(app.config.bitcoindRpc, function(optionsArray, network) {
				return _.map(optionsArray, function(options) {
					options = _.extend({}, options || {}, {
						whiteListCommands: [
							'sendrawtransaction',
						],
					});
					return new app.lib.RpcClient(options);
				});
			});
		},
	};

	service.prepareInstances();

	return service;
};
