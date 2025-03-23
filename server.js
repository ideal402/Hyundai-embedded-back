const http = require('http');
const app = require('./app');
const { setupWebSocket } = require('./websocket/wsHandler');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// WebSocket 연결 붙이기
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
