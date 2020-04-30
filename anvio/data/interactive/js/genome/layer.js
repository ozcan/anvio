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

  renderSVG() {
    let elements = []

    for (const obj of this.objects) {
      let shape = obj.shape
      let params = obj.params

      let attrString = ""

      if (params.hasOwnProperty('fill')) {
        attrString += ` fill="${params.fill}"`
      }

      if (shape === 'rectangle') {
        elements.push(`<rect x="${params.x}"
                            y="${params.y}"
                            width="${params.width}"
                            height="${params.height}"
                            ${attrString}
                        />`)
      } else if (shape === 'path') {
        elements.push(`<rect x="${params.x}"
                            y="${params.y}"
                            width="${params.width}"
                            height="${params.height}"
                            ${attrString}
                        />`)
      }
    }
    return elements.join('\n')
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
      } else if (shape == 'path') {
        ctx.beginPath()
        for (let i = 0; i < params.points.length; i++) {
          let pointX = xScale * params.points[i][0]
          let pointY = yScale * params.points[i][1]

          if (i == 0) {
            ctx.moveTo(pointX, pointY)
          } else {
            ctx.lineTo(pointX, pointY)
          }
        }
      }

      if (params.hasOwnProperty('fill')) {
        ctx.fillStyle = params.fill
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
