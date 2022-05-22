import Stats from "stats.js"
import { TextRenderer } from "./TextRenderer"

const stats = new Stats()
document.body.appendChild(stats.dom)

main()
async function main() {

  const cloudRenderer = new TextRenderer()
  cloudRenderer.setUp()

  const mainCanvas = document.createElement("canvas")
  const mainContext = mainCanvas.getContext("2d")!
  mainCanvas.style.height = "256px"
  mainCanvas.style.width = "256px"
  document.querySelector(".container")!.appendChild(mainCanvas)

  const rect = document.body.getBoundingClientRect()
  const vw = rect.width
  const vh = rect.height
  mainCanvas.width = vw
  mainCanvas.height = vh
  mainCanvas.style.maxHeight = `calc(100vw * ${vh / vw})`
  mainCanvas.style.maxWidth = `calc(100vh * ${vw / vh})`

  cloudRenderer.setSize(vw, vh)
  await cloudRenderer.setUp()

  process()

  async function process () {
    stats.begin()

    cloudRenderer.render()
    mainContext.clearRect(0, 0, vw, vh)
    mainContext.drawImage(cloudRenderer.getCanvas(), 0, 0, mainCanvas.width, mainCanvas.height)

    stats.end()
    requestAnimationFrame(process)
  }
}