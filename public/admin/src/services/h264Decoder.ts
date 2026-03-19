export class H264Decoder {

    private decoder: VideoDecoder
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D

    constructor(canvas: HTMLCanvasElement) {

        this.canvas = canvas
        this.ctx = canvas.getContext("2d")!

        this.decoder = new VideoDecoder({
            output: this.handleFrame.bind(this),
            error: e => console.error("Decoder error", e)
        })

        this.decoder.configure({
            codec: "avc1.42E01E",
            optimizeForLatency: true
        })
    }

    decode(data: ArrayBuffer) {

        const chunk = new EncodedVideoChunk({
            type: "key",
            timestamp: performance.now() * 1000,
            data: new Uint8Array(data)
        })

        this.decoder.decode(chunk)
    }

    private handleFrame(frame: VideoFrame) {

        this.canvas.width = frame.displayWidth
        this.canvas.height = frame.displayHeight

        this.ctx.drawImage(frame, 0, 0)

        frame.close()
    }
}
