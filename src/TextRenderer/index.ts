import loadImage from "../loadImage"
import noiseTextureUrl from "./thunder.png"
import textTextureUrl from "./potential.png"
import vertexShaderSource from "./effect.vert";
import fragmentShaderSource from "./effect.frag";
import { createShader, createProgram } from "../shader";

export class TextRenderer {

  #canvas: HTMLCanvasElement
  #tmpCanvas: HTMLCanvasElement
  #vertShader: WebGLShader
  #fragShader: WebGLShader
  #program: WebGLProgram

  #perlinTexture: HTMLImageElement | null = null
  #textTexture: HTMLImageElement | null = null

  constructor() {
    this.#canvas = document.createElement('canvas')
    this.#tmpCanvas = document.createElement('canvas')
    const gl = this.getWebGLContext()
    this.#vertShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    this.#fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    this.#program = createProgram(gl, this.#vertShader, this.#fragShader);
  }

  async setUp() {
    this.#perlinTexture = await loadImage(noiseTextureUrl)
    this.#textTexture = await loadImage(textTextureUrl)
  }

  setSize(width: number, height: number) {
    this.#canvas.width = width
    this.#canvas.height = height
    this.#tmpCanvas.width = width
    this.#tmpCanvas.height = height
  }

  getCanvas() {
    return this.#canvas
  }

  private getWebGLContext() {
    const ctx = this.#canvas.getContext('webgl')
    if (!ctx) {
      throw new Error("no context")
    }
    return ctx
  }

  render() {
    if (!this.#perlinTexture || !this.#textTexture) {
      throw new Error("no texture")
    }
    const gl = this.getWebGLContext()
    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(this.#program, "a_position");
    var texcoordLocation = gl.getAttribLocation(this.#program, "a_texCoord");
    // Create a buffer to put three 2d clip space points in
    var positionBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
     // Set a rectangle the same size as the image.
    this.setRectangle(gl, 0, 0, this.#canvas.width, this.#canvas.height);

    // provide texture coordinates for the rectangle.
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0,
    ]), gl.STATIC_DRAW);

    const noiseTexture = this.createTexture(this.#perlinTexture)
    const uNoiseLocation = gl.getUniformLocation(this.#program, "uNoise");
    gl.uniform1i(uNoiseLocation, 1);

    const textSize = 512
    const x = (this.#canvas.width - textSize) / 2;
    const y = (this.#canvas.height - textSize) / 2;
    const tmpContext = this.#tmpCanvas.getContext("2d")!;
    tmpContext.drawImage(this.#textTexture, x, y, textSize, textSize)

    const textTexture = this.createTexture(this.#textTexture)
    const uTextLocation = gl.getUniformLocation(this.#program, "uText");
    gl.uniform1i(uTextLocation, 2);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, textTexture);

    const randomLocation = gl.getUniformLocation(this.#program, "uRandom");
    gl.uniform1f(randomLocation, Math.random());
    const timeLocation = gl.getUniformLocation(this.#program, "uTime");
    gl.uniform1f(timeLocation, performance.now() / 1000);

    // lookup uniforms
    const resolutionLocation = gl.getUniformLocation(this.#program, "uResolution");

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(this.#program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // Turn on the texcoord attribute
    gl.enableVertexAttribArray(texcoordLocation);

    // bind the texcoord buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        texcoordLocation, size, type, normalize, stride, offset);

    // set the resolution
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
    gl.deleteTexture(noiseTexture)
    gl.deleteTexture(textTexture)
  }

  createTexture(image: HTMLCanvasElement | ImageBitmap | HTMLImageElement) {
    const gl = this.getWebGLContext()
    // Create a texture.
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    return texture;
  }

  setRectangle(gl: WebGLRenderingContext, x: number, y: number, width: number, height: number) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
       x1, y1,
       x2, y1,
       x1, y2,
       x1, y2,
       x2, y1,
       x2, y2,
    ]), gl.STATIC_DRAW);
  }
  
}