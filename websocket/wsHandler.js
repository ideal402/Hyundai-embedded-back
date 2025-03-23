const WebSocket = require('ws');
const Sensor = require("../models/Sensor"); 
let espClient = null;
let webClient = null;

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    console.log('🔌 WebSocket 클라이언트 연결됨');

    ws.on('message', async (message) => {
      const msg = message.toString();
      console.log('받은 메시지:', msg);

      try {
        const parsed = JSON.parse(msg);

        if (parsed.type === "sensor" && parsed.payload) {
          const { temperature, humidity, motorSpeed, illuminance } = parsed.payload;

          const newSensor = new Sensor({
            temperature,
            humidity,
            motorSpeed,
            illuminance,
          });

          // await newSensor.save();
          // console.log("센서 데이터 저장 완료");

          // 웹 클라이언트에게 실시간 전송
          if (webClient?.readyState === WebSocket.OPEN) {
            webClient.send(JSON.stringify({ type: "sensor", payload: newSensor }));
          }

          return;
        }

        // 클라이언트 등록 메시지 처리
        if (msg === 'Hello from ESP32') {
          espClient = ws;
          console.log('ESP32 등록됨');
        } else if (msg === "Hello from Web") {
          webClient = ws;
          console.log("웹 등록됨");
        }

        // 명령 메시지 처리
        else if (msg.startsWith('command:')) {
          const command = msg.split(':')[1];
          console.log("📤 ESP32로 전송할 명령:", command);
          if (espClient && espClient.readyState === WebSocket.OPEN) {
            espClient.send(command);
          }
        }

      } catch (err) {
        console.warn("메시지 파싱 실패 (JSON 아님):", msg);
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

function getWebClient() {
  return webClient;
}

module.exports = { setupWebSocket, getWebClient };
