const WebSocket = require("ws")

const devices = new Map()
const viewers = new Map()

function createWebRTCGateway() {

  const wss = new WebSocket.Server({ noServer: true })

  wss.on("connection", (ws, req) => {

    ws.on("message", async msg => {

      const data = JSON.parse(msg)

      if (data.type === "device-register") {

        devices.set(data.deviceId, ws)
        return
      }

      if (data.type === "watch-device") {

        const list =
          viewers.get(data.deviceId) || []

        list.push(ws)

        viewers.set(data.deviceId, list)

        const device =
          devices.get(data.deviceId)

        device?.send(JSON.stringify({
          type: "viewer-joined"
        }))

        return
      }

      if (data.type === "offer") {

        const list =
          viewers.get(data.deviceId) || []

        for (const viewer of list) {

          viewer.send(JSON.stringify({
            type: "offer",
            offer: data.offer
          }))
        }
      }

      if (data.type === "answer") {

        const device =
          devices.get(data.deviceId)

        device?.send(JSON.stringify({
          type: "answer",
          answer: data.answer
        }))
      }

      if (data.type === "candidate") {

        const device =
          devices.get(data.deviceId)

        device?.send(JSON.stringify({
          type: "candidate",
          candidate: data.candidate
        }))
      }

    })

  })

  return wss
}

module.exports = createWebRTCGateway