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

  render(xScale, yScale) {
    const buffer = new OffscreenCanvas(xScale * this.width, yScale * this.height)
    const ctx = buffer.getContext('2d');

    for (const obj of this.objects) {
      let shape = obj.shape
      let params = obj.params

      ctx.beginPath()

      if (shape == 'rectangle') {
        ctx.rect(
          xScale * params.x,
          yScale * params.y,
          xScale * params.width,
          yScale * params.height
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
}
