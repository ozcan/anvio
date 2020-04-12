import {
  Contig
} from './contig.js';

class GenomeTrack {
  constructor(viewer, name) {
    this.viewer = viewer;
    this.name = name;
    this.contigs = [];
    this.offsetX = 0;
  }

  getContig(contigName) {
    let result = this.contigs.find((contig) => contig.name == contigName);

    if (typeof result === 'undefined') {
      throw `Contig "${contigName}" not found in the genome track "${this.name}".`;
    }

    return result;
  }

  getLongestContig() {
    return Math.max(...this.contigs.map((contig) => contig.length));
  }

  addContig(contigData) {
    let contig = new Contig(this.viewer);

    contig.name = contigData.name;
    contig.length = contigData.length;
    this.contigs.push(contig);
  }

  getLayers() {
    let layers = [];
    this.contigs.forEach((contig) => {
      layers.push(contig.getLayers())
    });
    return layers
  }
}


export {
  GenomeTrack
};
