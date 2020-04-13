import {
  Layer
} from './layer.js';

class Contig {
  constructor() {
    this.name = null;
    this.length = 0;
    this.genes = [];
  }

  addGene(geneData) {
    this.genes.push(geneData);
  }

  getGene(gene_callers_id) {
    let gene = this.genes.find((gene) => {
      return (gene.gene_callers_id == gene_callers_id);
    });
    return gene;
  }

  getLayers() {
    let layer = new Layer(this.length, 20)

    // Background
    layer.rectangle({
      fill: true,
      x: 0,
      y: 3,
      width: this.length,
      height: 10,
      fillStyle: 'rgba(0, 0, 0, 0.2)'
    })

    // draw genes
    this.genes.forEach((gene) => {
      let start = gene.start
      let width = gene.stop - gene.start

      let triangleWidth = (width >= 10) ? 10 : width

      layer.rectangle({
        fill: true,
        x: start,
        y: 3,
        width: width,
        height: 10,
        fillStyle: (gene.direction == 'f') ? 'rgb(255, 0, 0)' : 'rgb(0, 255, 0)'
      })
      /*            draw.path({
                      'fill': true,
                      'fillStyle': '#F9A520',
                      'points': [{'x': start, 'y': 3}],
                      'flipX': (gene.direction == 'r') ? true : false
                  })*/

      /*
                  if (width > 4) {
                      // draw arrow head
                      if (gene.direction == 'f') {
                          ctx.moveTo(start + width - triangleWidth, 0);
                          ctx.lineTo(start + width, 8);
                          ctx.lineTo(start + width - triangleWidth, 16);
                      } else {
                          ctx.moveTo(start + triangleWidth, 0);
                          ctx.lineTo(start, 8);
                          ctx.lineTo(start + triangleWidth, 16);
                      }
                  } else {
                      // only rectangle
                      ctx.rect(start, 3, width, 10);
                  }

                  // draw rectangle near arrow head if there is space
                  if (width - triangleWidth > 0) {
                      if (gene.direction == 'f') {
                          ctx.rect(start, 3, width - triangleWidth, 10);
                      } else {
                          ctx.rect(start + triangleWidth, 3, width - triangleWidth, 10);
                      }
                  }
                  ctx.fill();*/
    });

    return layer
  }
}

export {
  Contig
};
