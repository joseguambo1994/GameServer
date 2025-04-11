const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory player list
let players = {};

// Handle new connections
io.on('connection', (socket) => {
  console.log(`🔌 Player connected: ${socket.id}`);

  // Initialize player at center
  players[socket.id] = { id: socket.id, x: 400, y: 300 };

  // Send current player list to the new player
  socket.emit('currentPlayers', players);

  // Notify others about the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Handle player movement
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;

      // Broadcast updated position
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        x: movementData.x,
        y: movementData.y
      });
    }
  });

  // Handle player disconnection
  socket.on('disconnect', () => {
    console.log(`❌ Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

// Basic route
app.get('/', (req, res) => {
  res.send('🎮 Multiplayer MMO Server is running');
});

// Listen on Azure App Service port or local port
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
