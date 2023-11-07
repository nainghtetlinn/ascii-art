const canvas = document.getElementById("canvas1") as HTMLCanvasElement
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D

const inputSlider = document.getElementById("resolution") as HTMLInputElement
const inputLabel = document.getElementById(
  "resolutionLabel"
) as HTMLLabelElement
inputSlider.addEventListener("change", handleSlider)
inputSlider.addEventListener("input", handleSlider)

class Cell {
  x: number
  y: number
  symbol: string
  color: string
  constructor(x: number, y: number, symbol: string, color: string) {
    this.x = x
    this.y = y
    this.symbol = symbol
    this.color = color
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color
    ctx.fillText(this.symbol, this.x, this.y)
  }
}

class AsciiEffect {
  #imageCellArray: Cell[] = []
  #pixels: any
  #ctx
  #density
  #width
  #height
  constructor(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    density: string
  ) {
    this.#ctx = ctx
    this.#density = density
    this.#width = width
    this.#height = height
  }

  #convertToSymbol(g: number) {
    const len = this.#density.length

    if (g >= 0 && g <= 255) {
      const scaledNumber = (g / 255) * len
      return this.#density.charAt(Math.floor(scaledNumber))
    } else {
      return this.#density.charAt(len - 1)
    }
  }

  #scanImage(cellSize: number) {
    this.#imageCellArray = []
    for (let y = 0; y < this.#pixels.height; y += cellSize) {
      for (let x = 0; x < this.#pixels.width; x += cellSize) {
        const posX = x * 4
        const posY = y * 4
        const pos = posY * this.#pixels.width + posX

        const red = this.#pixels.data[pos]
        const green = this.#pixels.data[pos + 1]
        const blue = this.#pixels.data[pos + 2]
        const total = red + green + blue
        const avg = total / 3

        const color = `rgb(${avg}, ${avg}, ${avg})`
        const symbol = this.#convertToSymbol(avg)

        if (total > 100)
          this.#imageCellArray.push(new Cell(x, y, symbol, color))
      }
    }
  }

  #loadImage(img: HTMLImageElement | HTMLVideoElement) {
    this.#ctx.drawImage(img, 0, 0, this.#width, this.#height)
    this.#pixels = this.#ctx.getImageData(0, 0, this.#width, this.#height)
  }

  draw(el: HTMLImageElement | HTMLVideoElement, cellSize: number) {
    this.#loadImage(el)
    this.#scanImage(cellSize)
    this.#ctx.clearRect(0, 0, this.#width, this.#height)
    for (let i = 0; i < this.#imageCellArray.length; i++) {
      this.#imageCellArray[i].draw(this.#ctx)
    }
  }
}

let effect: AsciiEffect
let cellSize = 20
const videoEl = document.getElementById("video") as HTMLVideoElement

videoEl.addEventListener("play", () => {
  setInterval(() => {
    effect.draw(videoEl, cellSize)
  }, 100)
})

async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    })
    videoEl.srcObject = stream
    videoEl.onloadedmetadata = function () {
      videoEl.play()
    }

    const aspectRatio = videoEl.width / videoEl.height
    const canvasAspectRatio = canvas.width / canvas.height

    let scaleWidth, scaleHeight

    if (aspectRatio > canvasAspectRatio) {
      scaleWidth = canvas.width
      scaleHeight = canvas.width / aspectRatio
    } else {
      scaleWidth = canvas.height * aspectRatio
      scaleHeight = canvas.height
    }

    effect = new AsciiEffect(ctx, scaleWidth, scaleHeight, "@#$%^&?!*+=- ")
  } catch (error) {
    console.error("Error accessing the camera:", error)
  }
  handleSlider()
}
initCamera()

function handleSlider() {
  if (+inputSlider.value == 1) {
    inputLabel.innerHTML = "Original Image"
    cellSize = 1
  } else {
    inputLabel.innerHTML = "Resolution: " + inputSlider.value + " px"
    cellSize = +inputSlider.value
    ctx.font = cellSize * 1.2 + "px Verdana"
  }
}
