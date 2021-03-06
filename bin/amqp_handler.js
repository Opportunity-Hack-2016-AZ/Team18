'use strict';

const amqp = require('amqplib/callback_api');
const bail = require('bail');
const config = require('config');
const amqpConfig = config.get('AMQPServer');
const appConfig = config.get('App');
const emailServiceConfig = config.get('EmailService');

let channel;
let running = false;

const start = function (callback) {
	if (!running) {
		const amqpUrl = 'amqp://' + amqpConfig.host + ':' + amqpConfig.port;
		amqp.connect(amqpUrl, (err, conn) => {
			if (err != null) {
				callback(err);
			}
			else {
				conn.createChannel((err2, ch) => {
					if (err2 != null) bail(err2);
					channel = ch;
					running = true;
					callback(null);
				});
			}
		});
	}
};

function MessagingHandler(queue) {
	this.queue = appConfig.queue + '_' + queue;

	this.setConsumer = function (callback) {
		if(!channel) bail(new Error('AMQP is not connected'));

		const consumerFun = function (msg) {
			channel.ack(msg);
			callback(msg);
		};

		channel.assertQueue(this.queue);
		channel.consume(this.queue, consumerFun);
	};

	this.publishMessage = function (msg) {

		msg.replyTo = this.queue;
		channel.publish('', emailServiceConfig.queue, new Buffer(JSON.stringify(msg)));
	};
}

const createMessagingHandler = function () {
	return new MessagingHandler();
};

const isRunning = function () {
	return running;
};

module.exports.start = start;
module.exports.createMessagingHandler = createMessagingHandler;
module.exports.isRunning = isRunning;
