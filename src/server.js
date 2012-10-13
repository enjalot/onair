// Generated by CoffeeScript 1.3.3
var app, express, fs, gzip, http, racer, server, store;

express = require('express');

gzip = require('connect-gzip');

fs = require('fs');

racer = require('racer');

racer.use(require('racer/lib/ot'));

http = require('http');

app = express().use(express.favicon()).use(gzip.staticGzip(__dirname));

server = http.createServer(app);

store = racer.createStore({
  listen: server
});

store.flush();

racer.js({
  entry: __dirname + '/client.js'
}, function(err, js) {
  return fs.writeFileSync(__dirname + '/script.js', js);
});

app.use("/static", express["static"](__dirname + '/../static'));

app.get('/', function(req, res) {
  return res.redirect('/racer');
});

app.get('/:group', function(req, res) {
  var model;
  model = store.createModel();
  return model.subscribe("groups." + req.params.group, function(err, room) {
    model.ref('_room', room);
    room.otNull('text', 'Edit this with friends.');
    return model.bundle(function(bundle) {
      console.log(__dirname + '/../views/index.html');
      return fs.readFile(__dirname + '/../views/index.html', 'utf8', function(err, text) {
        var html;
        console.log(text);
        html = text;
        html += "<script>init=" + bundle + "</script>\n<script src=\"script.js\"></script>\n</body></html>";
        return res.send(html);
      });
    });
  });
});

server.listen(3013);

console.log('Go to http://localhost:3013/racer');
