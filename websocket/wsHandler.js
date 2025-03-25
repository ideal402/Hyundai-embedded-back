const WebSocket = require('ws');
const Sensor = require("../models/Sensor"); 
const CarState = require("../models/CarState");

let espClient = null;
let webClient = null;
let sensorBuffer = [];
let totalMileage = 0;

(async () => {
  try {
    const lastSensor = await Sensor.findOne().sort({ createdAt: -1 });
    if (lastSensor?.mileage) {
      totalMileage = lastSensor.mileage;
      console.log(`이전 주행거리 불러옴: ${totalMileage.toFixed(2)} km`);
    }
  } catch (err) {
    console.error("이전 주행거리 불러오기 실패:", err);
  }
})();

function sendStartCommandWithDelay() {
  if (espClient && espClient.readyState === WebSocket.OPEN) {
    setTimeout(() => {
      console.log("🟢 start 명령 전송됨");
      espClient.send("start");
    }, 2000);
  }
}

function convertToSpeed(potValue) {
  const potMin = 0;
  const potMax = 326;
  const speedMin = 0;
  const speedMax = 200;

  // 범위 내로 제한
  potValue = Math.max(potMin, Math.min(potValue, potMax));

  // 비율 계산 후 변환 (정수로 반올림)
  const speed = ((potValue - potMin) / (potMax - potMin)) * (speedMax - speedMin) + speedMin;
  return Math.round(speed);
}

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    console.log('WebSocket 클라이언트 연결됨');

    ws.on('message', async (message) => {
      const msg = message.toString();
      try {
        const parsed = JSON.parse(msg);

        if (parsed.type === "sensor" && parsed.payload) {
          const { temperature, humidity, motorSpeedRaw, illuminance, vib } = parsed.payload;
          
          const motorSpeed = convertToSpeed(motorSpeedRaw);

          totalMileage += motorSpeed / 3600;
          
          const newSensor = new Sensor({
            temperature,
            humidity,
            motorSpeed,
            illuminance,
            mileage: Number(totalMileage.toFixed(2))
          });

          sensorBuffer.push(newSensor);

          newSensor.vib = vib;
          console.log("🚀 ~ ws.on ~ newSensor:", newSensor)
          
          // 웹 클라이언트에게 실시간 전송
          if (webClient?.readyState === WebSocket.OPEN) {
            webClient.send(JSON.stringify({ type: "sensor", payload: newSensor, vid:vid }));
          }

          return;
        }
        else if (parsed.type === "carState" && parsed.payload) {
          const { isCarDoorOpen, isSunroofOpen, isACActive, isDriving, isAnomaly } = parsed.payload;

          const updatedCarState = await CarState.findOneAndUpdate(
            {}, // 조건 없이 첫 문서
            {
              isCarDoorOpen,
              isSunroofOpen,
              isACActive,
              isDriving,
              isAnomaly
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
                isDriving: updatedCarState.isDriving,
                isAnomaly: updatedCarState.isAnomaly
              }
            }));
          }

          return;
        }
        else if (parsed.type === "register") {
          if (parsed.role === "esp32") {
            espClient = ws;
            console.log("ESP32 등록됨");
            
            if (webClient && webClient.readyState === WebSocket.OPEN) {
              sendStartCommandWithDelay();
            }

          } else if (parsed.role === "web") {
            webClient = ws;
            console.log("웹 클라이언트 등록됨");
            
            if (espClient && espClient.readyState === WebSocket.OPEN) {
              console.log("🟢 start 명령 전송됨");
              espClient.send("start");
            }
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
      console.log(`센서 데이터 ${sensorBuffer.length}건 저장됨.`);
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