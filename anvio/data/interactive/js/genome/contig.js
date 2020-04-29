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
        fillStyle: (gene.direction == 'f') ? '#99BFB3' : '#395252'
      })
      /*            draw.path({
                      'fill': true,
                      'fillStyle': '#F9A520',
                      'points': [{'x': start, 'y': 3}],
                      'flipX': (gene.direction == 'r') ? true : false
                  })*/

        ]
      })
    });

    return layer
  }
}

export {
  Contig
};
