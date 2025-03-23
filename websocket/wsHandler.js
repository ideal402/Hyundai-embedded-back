const WebSocket = require('ws');
const Sensor = require("../models/Sensor"); 
const CarState = require("../models/CarState");

let espClient = null;
let webClient = null;
let sensorBuffer = [];

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    console.log('WebSocket 클라이언트 연결됨');

    ws.on('message', async (message) => {
      const msg = message.toString();
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

          sensorBuffer.push(newSensor);

          // 웹 클라이언트에게 실시간 전송
          if (webClient?.readyState === WebSocket.OPEN) {
            webClient.send(JSON.stringify({ type: "sensor", payload: newSensor }));
          }

          return;
        }
        else if (parsed.type === "carState" && parsed.payload) {
          const { isCarDoorOpen, isSunroofOpen, isACActive, isDriving } = parsed.payload;

          const updatedCarState = await CarState.findOneAndUpdate(
            {}, // 조건 없이 첫 문서
            {
              isCarDoorOpen,
              isSunroofOpen,
              isACActive,
              isDriving
            },
            { upsert: true, new: true } // 없으면 생성, 업데이트 후 문서 반환
          );
        
          // 웹 클라이언트에게 최신 상태를 실시간 전송
          if (webClient?.readyState === WebSocket.OPEN) {
            webClient.send(JSON.stringify({
              type: "carState",
              payload: {
                isCarDoorOpen: updatedCarState.isCarDoorOpen,
                isSunroofOpen: updatedCarState.isSunroofOpen,
                isACActive: updatedCarState.isACActive,
                isDriving: updatedCarState.isDriving
              }
            }));
          }

          return;
        }
        else if (parsed.type === "register") {
          if (parsed.role === "esp32") {
            espClient = ws;
            console.log("ESP32 등록됨");
          } else if (parsed.role === "web") {
            webClient = ws;
            console.log("웹 클라이언트 등록됨");
          }
        }
        else if (parsed.type === "command" && parsed.command) {
          const command = parsed.command;
          console.log("ESP32로 전송할 명령:", command);
        
          if (espClient && espClient.readyState === WebSocket.OPEN) {
            espClient.send(command);
          }
        }
      } catch (err) {
        console.log("error", err);
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

setInterval(async () => {
  if (sensorBuffer.length > 0) {
    try {
      await Sensor.insertMany(sensorBuffer);
      console.log(`✅ 센서 데이터 ${sensorBuffer.length}건 저장됨.`);
      sensorBuffer = []; // 저장 후 초기화
    } catch (err) {
      console.error("센서 저장 실패:", err);
    }
  }
}, 10000);


function getWebClient() {
  return webClient;
}

module.exports = { setupWebSocket, getWebClient };
