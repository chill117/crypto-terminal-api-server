'use strict';

module.exports = function(app) {

	var _ = require('underscore');

	var service = {

		isSupportedNetwork: function(network) {

			return !!this.instances[network];
		},

		cmd: function(network, method, params, cb) {

			if (!this.isSupportedNetwork(network)) {
				return cb(new Error('Unsupported network: "' + network + '"'));
			}

			this.instances[network].cmd(method, params, cb);
		},

		resetInstances: function() {

			this.instances = {};
		},

		prepareInstances: function() {

			/*
				Communicate with an electrum daemon via RPC. See:
				http://docs.electrum.org/en/latest/protocol.html
			*/
			this.instances = _.mapObject(app.config.electrum, function(options, network) {
				options = _.extend({}, options || {}, {
					whiteListCommands: [
						'getfeerate',
						'getaddressunspent',
					],
				});
				return new app.lib.RpcClient(options);
			});
		},
	};

	service.prepareInstances();

	return service;
};
