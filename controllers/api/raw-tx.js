'use strict';

module.exports = function(app) {

	var _ = require('underscore');

	app.post('/api/v1/raw-tx', function(req, res, next) {

		try {
			var requiredFields = ['rawTx', 'network'];
			_.each(requiredFields, function(key) {
				if (!req.body[key]) {
					var error = new Error('"' + key + '" required');
					error.status = 400;
					throw new Error(error);
				}
			});

			var network = req.body.network;
			if (!app.services.bitcoindRpc.isSupportedNetwork(network)) {
				throw new Error('Unsupported network: "' + network + '"');
			}

			var rawTx = req.body.rawTx;

		} catch (error) {
			error.status = 400;
			return next(error);
		}

		app.services.bitcoindRpc.cmd(network, 'sendrawtransaction', [rawTx], function(error, result) {
			if (error) return next(error);
			var txid = result && result[0] === true && result[1] || null;
			if (!txid) {
				app.log('Failed to broadcast transaction:', result);
				return next(new Error('Failed to broadcast transaction'));
			}
			res.status(200).json({ txid: txid });
		});
	});
};