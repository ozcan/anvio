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
    const buffer = new OffscreenCanvas(this.xScale * this.layer.width, this.yScale * this.layer.height)
    const ctx = buffer.getContext('2d');

    for (const obj of this.layer.objects) {
      let shape = obj.shape
      let params = obj.params

      ctx.beginPath()

      if (shape == 'rectangle') {
        ctx.rect(
          this.xScale * params.x,
          this.yScale * params.y,
          this.xScale * params.width,
          this.yScale * params.height
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
