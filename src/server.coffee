express = require 'express'
gzip = require 'connect-gzip'
fs = require 'fs'
racer = require 'racer'
racer.use require 'racer/lib/ot'
http = require 'http'

app = express()
  .use(express.favicon())
  .use(gzip.staticGzip(__dirname))
server = http.createServer(app)

store = racer.createStore
  listen: server # A port or http server

# Clear all existing data on restart
store.flush()

# racer.js returns a browserify bundle of the racer client side code and the
# socket.io client side code as well as any additional browserify options
racer.js entry: __dirname + '/client.js', (err, js) ->
  fs.writeFileSync __dirname + '/script.js', js

app.use("/static", express.static(__dirname + '/../static'));

app.get '/', (req, res) ->
  res.redirect '/racer'

app.get '/:group', (req, res) ->
  model = store.createModel()
  model.subscribe "groups.#{req.params.group}", (err, room) ->
    model.ref '_room', room
    room.otNull 'text', 'Edit this with friends.'
    # model.bundle waits for any pending model operations to complete and then
    # returns the JSON data for initialization on the client
    model.bundle (bundle) ->
      #TODO: use a template engine of some sort
      console.log(__dirname + '/../views/index.html')
      fs.readFile(__dirname + '/../views/index.html', 'utf8', (err, text) ->
        console.log(text)
        html = text
        html +=  """
          <script>init=#{bundle}</script>
          <script src="script.js"></script>
          </body></html>
          """
        res.send(html)
      )
      
server.listen 3013
console.log 'Go to http://localhost:3013/racer'