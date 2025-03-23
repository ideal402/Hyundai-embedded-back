const WebSocket = require('ws');
const Sensor = require("../models/Sensor");
const CarState = require("../models/CarState");

let espClient = null;
let webClients = new Set(); // 여러 웹 클라이언트를 저장
let sensorBuffer = [];

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    console.log('WebSocket 클라이언트 연결됨');

    ws.on('message', async (message) => {
      const msg = message.toString();
      try {
        const parsed = JSON.parse(msg);

        if (parsed.type === "register") {
          if (parsed.role === "esp32") {
            espClient = ws;
            console.log("ESP32 등록됨");
          } else if (parsed.role === "web") {
            webClients.add(ws);
            console.log("웹 클라이언트 등록됨");
          }
          return;
        }

        if (parsed.type === "sensor" && parsed.payload) {
          const { temperature, humidity, motorSpeed, illuminance } = parsed.payload;

          const newSensor = new Sensor({
            temperature,
            humidity,
            motorSpeed,
            illuminance,
          });

          sensorBuffer.push(newSensor);

          // 모든 웹 클라이언트에게 실시간 전송
          for (const client of webClients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: "sensor", payload: newSensor }));
            }
          }

          return;
        }

        if (parsed.type === "carState" && parsed.payload) {
          const { isCarDoorOpen, isSunroofOpen, isACActive, isAnomaly } = parsed.payload;

          const updatedCarState = await CarState.findOneAndUpdate(
            {},
            { isCarDoorOpen, isSunroofOpen, isACActive, isAnomaly },
            { upsert: true, new: true }
          );

          const statePayload = {
            type: "carState",
            payload: {
              isCarDoorOpen: updatedCarState.isCarDoorOpen,
              isSunroofOpen: updatedCarState.isSunroofOpen,
              isACActive: updatedCarState.isACActive,
              isAnomaly: updatedCarState.isAnomaly
            }
          };

          // 모든 웹 클라이언트에게 실시간 전송
          for (const client of webClients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(statePayload));
            }
          }

          return;
        }

        if (parsed.type === "command" && parsed.command) {
          const command = parsed.command;
          console.log("ESP32로 전송할 명령:", command);

          if (espClient && espClient.readyState === WebSocket.OPEN) {
            espClient.send(command);
          }
        }

      } catch (err) {
        console.error("메시지 처리 중 에러:", err);
        console.warn("메시지 파싱 실패 (JSON 아님):", msg);
      }
    });

    ws.on('close', () => {
      if (ws === espClient) {
        espClient = null;
        console.log('ESP32 연결 해제');
      }
      if (webClients.has(ws)) {
        webClients.delete(ws);
        console.log('웹 클라이언트 연결 해제');
      }
    });
  });
}

setInterval(async () => {
  if (sensorBuffer.length > 0) {
    try {
      await Sensor.insertMany(sensorBuffer);
      console.log(`✅ 센서 데이터 ${sensorBuffer.length}건 저장됨.`);
      sensorBuffer = [];
    } catch (err) {
      console.error("센서 저장 실패:", err);
    }
  }
});

function getWebClients() {
  return [...webClients]; // 배열로 반환
}

module.exports = { setupWebSocket, getWebClients };
