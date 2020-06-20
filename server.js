const express = require('express');
const app = express();

const server = require('http').createServer(app)
const io = require('socket.io')(server);

const mqtt = require('mqtt');
const client  = mqtt.connect('mqtt://test.mosquitto.org:1883')

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var markers = [];

app.post('/', (req, res) => {
    console.log(req.body);
    updateMarkers(req.body);
    io.sockets.emit('updatedPosition', markers);
    res.end("ok")
})

client.on('connect', function () {
    client.subscribe('GeoAirpot-queue-message');
    console.log("Broker MQTT connectado");
})

client.on('message', function (topic, message) {
    try {
        console.log(JSON.parse(message.toString()));
        updateMarkers(JSON.parse(message.toString()));
        io.sockets.emit('updatedPosition', markers);
    } catch (e) {
        console.log(e)
    }
})

io.on('connection', socket => {
    console.log(`Socket connectado: ${socket.id}`)
    io.sockets.emit('updatedPosition', markers);
})

server.listen(3000, () => {
    console.log('Server rodando na porta 3000')
})

function updateMarkers(position) {
    var notFounded = true;

    markers.forEach((v) => {
        if (v.id == position.id) {
            v.position = position.position;
            notFounded = false;
        }
    })

    if (notFounded) {
        markers.push({
            id: position.id,
            position: position.position,
            tooltip: `${position.id}`,
            draggable: false,
            visible: true,
            popupVisible: false
        })
    }
}