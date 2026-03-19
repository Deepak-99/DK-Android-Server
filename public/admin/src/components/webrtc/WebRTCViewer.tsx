import { useEffect, useRef } from "react"
import { wsEmit } from "../../services/websocket"
import { InputPredictor } from "../../services/inputPrediction"

interface Props {
  deviceId: string
}

export default function WebRTCViewer({ deviceId }: Props) {

  const videoRef = useRef<HTMLVideoElement>(null)
  const predictor = useRef(new InputPredictor())

  useEffect(() => {

    const pc = new RTCPeerConnection({

      iceServers: [

        { urls: "stun:stun.l.google.com:19302" },

        {
          urls: "turn:YOUR_SERVER_IP:3478",
          username: "hawkshaw",
          credential: "StrongPassword123"
        }

      ]

    })

      let controlChannel: RTCDataChannel | null = null

      controlChannel =
          pc.createDataChannel("control")

      controlChannel.onopen = () => {
          console.log("Control channel ready")
      }

      controlChannel.onerror = e => {
          console.error("Control channel error", e)
      }

      controlChannel.onopen = () => {
          console.log("control ready")
      }

      function sendTouch(x:number,y:number,action:string){

          if(!controlChannel) return

          controlChannel.send(
              JSON.stringify({
                  type:"touch",
                  x,
                  y,
                  action
              })
          )
      }

    const protocol =
      location.protocol === "https:" ? "wss" : "ws"

    const token =
      localStorage.getItem("token")

    const ws =
      new WebSocket(
        `${protocol}://${location.host}/ws/webrtc?token=${token}`
      )

    /* ---------------------------------
       SIGNALING
    ---------------------------------- */

    ws.onmessage = async msg => {

      const data = JSON.parse(msg.data)

      if (data.type === "offer") {

        await pc.setRemoteDescription(data.offer)

        const answer = await pc.createAnswer()

        await pc.setLocalDescription(answer)

        ws.send(JSON.stringify({
          type: "answer",
          deviceId,
          answer
        }))
      }

      if (data.type === "candidate") {

        await pc.addIceCandidate(data.candidate)
      }
    }

    /* ---------------------------------
       RECEIVE VIDEO
    ---------------------------------- */

    pc.ontrack = e => {

      if (videoRef.current)
        videoRef.current.srcObject = e.streams[0]

    }

    /* ---------------------------------
       ICE
    ---------------------------------- */

    pc.onicecandidate = e => {

      if (!e.candidate) return

      ws.send(JSON.stringify({
        type: "candidate",
        deviceId,
        candidate: e.candidate
      }))
    }

    /* ---------------------------------
       START WATCH
    ---------------------------------- */

    ws.onopen = () => {

      ws.send(JSON.stringify({
        type: "watch-device",
        deviceId
      }))
    }

    /* ---------------------------------
       INPUT PREDICTION + TOUCH
    ---------------------------------- */

    const video = videoRef.current

    if (video) {

      const handleMove = (e: MouseEvent) => {

        const rect = video.getBoundingClientRect()

        const x =
          (e.clientX - rect.left) / rect.width

        const y =
          (e.clientY - rect.top) / rect.height

        predictor.current.update(x, y)

        const predicted =
          predictor.current.predict(80)

          sendTouch(predicted.x,predicted.y,"move")
      }

      video.addEventListener(
        "mousemove",
        handleMove
      )

      return () => {

        video.removeEventListener(
          "mousemove",
          handleMove
        )

        pc.close()
        ws.close()
      }
    }

  }, [deviceId])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{
        width: "100%",
        height: "100%",
        background: "black",
        objectFit: "contain"
      }}
    />
  )
}