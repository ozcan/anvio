class Layer {
  constructor(width, height) {
    this.width = width
    this.height = height

    this.objects = []
    this.knownShapes = ['rectangle', 'line', 'path']

    this.knownShapes.forEach((currentShape) => {
      // This creates member functions like Layer.rectangle()
      this[currentShape] = (params) => {
        this.objects.push({
          'shape': currentShape,
          'params': params
        })
      }
    })
  }
}


class RenderCanvas {
  constructor(layer, xScale, yScale) {
    this.layer = layer
    this.xScale = xScale
    this.yScale = yScale
  }

  getBuffer() {
    const xS = (val) => {
      return val * this.xScale
    }
    const yS = (val) => {
      return val * this.yScale
    }

    const buffer = new OffscreenCanvas(xS(this.layer.width), yS(this.layer.height))
    const ctx = buffer.getContext('2d')

    for (const obj of this.layer.objects) {
      let shape = obj.shape
      let params = obj.params

      ctx.beginPath()

      if (shape == 'rectangle') {
        ctx.rect(
          xS(params.x),
          yS(params.y),
          xS(params.width),
          yS(params.height)
        )
      }

      if (params.hasOwnProperty('fillStyle')) {
        ctx.fillStyle = params.fillStyle
      }

      if (params.hasOwnProperty('fill') && params.fill) {
        ctx.fill()
      } else {
        ctx.stroke()
      }
    }

    return buffer
  }
}



export {
  Layer,
  RenderCanvas,
}
