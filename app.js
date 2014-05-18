var express = require('express');
var serveStatic = require('serve-static');
var ws = require('ws');
var mongojs = require('mongojs');
var _ = require('underscore');

var app = express();
app.use(serveStatic(__dirname + '/client'));
app.listen(5000);

var db = mongojs('latertime', ['comments']);

var server = new ws.Server({port: 5001});
server.on('connection', function(socket) {
	socket.on('message', function(message) {
		var request = JSON.parse(message);
		if (request.type === "subscribe") {
			this.subscriptionID = request.subscriptionID;
		}
		if (request.type === "getcomments") {
			db.comments.find({ id : request.id }).forEach(function(err, doc) {
				if(!doc) {
					return;
				}
				doc.type = "comment";
				socket.send(JSON.stringify(_.omit(doc, ['_id', 'id'])));
			});
		}
		if (request.type === "sendcomment") {
			comment = {
				id: request.id,
				videoTime: request.videoTime,
				realTime: request.realTime,
				text: request.text
			};
			db.comments.save(comment);
			for (var i in server.clients) {
				if (server.clients[i].subscriptionID === request.id) {
					server.clients[i].send(JSON.stringify(_.omit(comment, 'id')));
				}
			}
		}
	});
});