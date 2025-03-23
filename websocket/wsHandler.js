const WebSocket = require('ws');

let espClient = null;
let webClient = null;

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    console.log('🔌 WebSocket 클라이언트 연결됨');

    ws.on('message', (message) => {
      const msg = message.toString();
      console.log('받은 메시지:', msg);

      if (msg === 'Hello from ESP32') {
        espClient = ws;
        console.log('ESP32 등록됨');
      }
      else if (msg === "Hello from Web"){
        webClient = ws;
        console.log("web 등록됨");
      } 
      else if (msg.startsWith('command:')) {
        const command = msg.split(':')[1];
        console.log("🚀 ~ ws.on ~ command:", command,espClient);
        if (espClient) {
          espClient.send(command);
          console.log("🚀 ~ ws.on ~ command:", command);
        }
      }
    });

    ws.on('close', () => {
      if (ws === espClient) {
        espClient = null;
        console.log('ESP32 연결 해제');
      } else if (ws === webClient) {
        webClient = null;
        console.log('웹 클라이언트 연결 해제');
      }
    });
    
  });
}

module.exports = { setupWebSocket };
