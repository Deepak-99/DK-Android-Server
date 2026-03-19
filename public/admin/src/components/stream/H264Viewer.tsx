import { useEffect, useRef } from "react"
import { connectStream, onFrame, disconnectStream }
from "../../services/streamSocket"

import { H264Decoder }
from "../../services/h264Decoder"

import { wsEmit } from "../../services/websocket"

interface Props {
    deviceId: string
}

export default function H264Viewer({ deviceId }: Props) {

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const decoderRef = useRef<H264Decoder | null>(null)

    useEffect(() => {

        const canvas = canvasRef.current
        if (!canvas) return

        decoderRef.current = new H264Decoder(canvas)

        /* CONNECT STREAM */
        connectStream(deviceId)

        const unsub = onFrame(data => {
            decoderRef.current?.decode(data)
        })

        /* ===============================
           TOUCH CONTROL
        =============================== */

        const handlePointerDown = (e: PointerEvent) => {

            const rect = canvas.getBoundingClientRect()

            const x = (e.clientX - rect.left) / rect.width
            const y = (e.clientY - rect.top) / rect.height

            wsEmit("touch", {
                deviceId,
                x,
                y,
                action: "down"
            })
        }

        const handlePointerUp = (e: PointerEvent) => {

            const rect = canvas.getBoundingClientRect()

            const x = (e.clientX - rect.left) / rect.width
            const y = (e.clientY - rect.top) / rect.height

            wsEmit("touch", {
                deviceId,
                x,
                y,
                action: "up"
            })
        }

        const handlePointerMove = (e: PointerEvent) => {

            const rect = canvas.getBoundingClientRect()

            const x = (e.clientX - rect.left) / rect.width
            const y = (e.clientY - rect.top) / rect.height

            wsEmit("touch", {
                deviceId,
                x,
                y,
                action: "move"
            })
        }


        canvas.addEventListener("pointerdown", handlePointerDown)
        canvas.addEventListener("pointerup", handlePointerUp)
        canvas.addEventListener("pointermove", handlePointerMove)


        return () => {

            unsub()
            disconnectStream()

            canvas.removeEventListener("pointerdown", handlePointerDown)
            canvas.removeEventListener("pointerup", handlePointerUp)
            canvas.removeEventListener("pointermove", handlePointerMove)

        }

    }, [deviceId])

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                background: "black"
            }}
        />
    )
}
