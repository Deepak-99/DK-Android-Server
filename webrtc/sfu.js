const mediasoup = require("mediasoup")

let worker
let router

async function initSFU() {

    worker = await mediasoup.createWorker()

    router = await worker.createRouter({
        mediaCodecs: [
            {
                kind: "video",
                mimeType: "video/H264",
                clockRate: 90000
            },
            {
                kind: "audio",
                mimeType: "audio/opus",
                clockRate: 48000,
                channels: 2
            }
        ]
    })

    console.log("SFU router ready")
}

module.exports = {
    initSFU,
    getRouter: () => router
}