export class InputPredictor {

    private lastX = 0
    private lastY = 0
    private velocityX = 0
    private velocityY = 0

    update(x: number, y: number) {

        this.velocityX = x - this.lastX
        this.velocityY = y - this.lastY

        this.lastX = x
        this.lastY = y
    }

    predict(latencyMs: number) {

        const frames =
            latencyMs / 16

        return {

            x:
                this.lastX +
                this.velocityX * frames,

            y:
                this.lastY +
                this.velocityY * frames
        }
    }
}