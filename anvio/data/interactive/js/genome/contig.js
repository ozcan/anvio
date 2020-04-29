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
      x: 0,
      y: 3,
      width: this.length,
      height: 10,
      fill: 'rgba(0, 0, 0, 0.2)'
    })

    // draw genes
    this.genes.forEach((gene) => {
      let start = gene.start
      let width = gene.stop - gene.start
      let triangleWidth = (width >= 10) ? 10 : width
      let verticalPadding = 3;
      let height = 10;

      layer.path({
        fill: true,
        fillStyle: '#FF0000',
        points: [
          // starting from tip, then top
          [start, 8],
          [start + triangleWidth, 3],
          [start + width, 3],
          [start + width, 13],
          [start + triangleWidth, 13],

        ]
      })
    });

    return layer
  }
}

export {
  Contig
};
