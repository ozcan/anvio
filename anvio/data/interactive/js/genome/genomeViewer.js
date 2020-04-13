import {
  GenomeTrack
} from './genomeTrack.js';
import {
  TreeDrawer
} from './treeDrawer.js';


class GenomeViewer {
  constructor(options) {
    let defaults = {
      'canvas': '',
      'showGenomeLabels': true,
      'showGeneLabels': true,
      'showTree': true,
      'showGCContentOverlay': true,
    }

    this.options = $.extend(defaults, options);
    this.canvas = this.options.canvas;
    this.context = this.canvas.getContext('2d');
    this.width = 0;
    this.height = 0;

    this.genomeTracks = [];
    this.ribbons = [];

    this.mouseDown = false;
    this.hasTree = false;
    this.panStart = {
      'x': 0,
      'y': 0
    };

    this.lastScrollTime = 0;

    this.bindEvents();

    this.needsRedraw = true;

    this.startPercent = 0;
    this.widthPercent = 100;
  }

  /*
      Events:
  */

  bindEvents() {
    window.addEventListener('resize', (event) => this.handleResize(event));
  }

  handleResize(event) {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.draw();
  }


  /*
      Drawing methods
  */

  clear() {
    let ctx = this.context;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  draw() {
    this.clear()

    let max = Math.max(...this.genomeTracks.map((track) => {
      return track.getLongestContig();
    }));

    this.genomeTracks.forEach((track, i) => {
      const xScale = (1 / (this.widthPercent / 100)) * (this.width / max);
      let buffer = track.getLayers()[0].render(xScale, 1);

      // s -> source
      // d -> destination
      // void ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
      this.context.drawImage(buffer, xScale * (max * this.startPercent / 100), 0, this.width, 40,
        0, 50 + 40 * i, this.width, 40);
    });

    let treeWidth = 200;
    let padding = 10;

    if (this.hasTree) {
      let tree = new TreeDrawer(this, this.order, treeWidth, padding);
      this.context.clearRect(0, 0, treeWidth, this.height + 80);
      this.context.drawImage(tree.getBuffer(), 0, 40);
    }

    /*
    this.ribbons.forEach((ribbon) => {
        ribbon.draw();
    });*/
  }


  /*
      Data access
  */

  getGenomeTrack(genomeName) {
    let track = this.genomeTracks.find((track) => track.name == genomeName);

    if (typeof track === 'undefined') {
      track = new GenomeTrack(this, genomeName);
      this.genomeTracks.push(track);
    }

    return track;
  }

  addContig(genomeName, contigData) {
    let track = this.getGenomeTrack(genomeName);
    track.addContig(contigData);

  }

  addGene(genomeName, contigName, geneData) {
    let track = this.getGenomeTrack(genomeName);
    let contig = track.getContig(contigName);

    contig.addGene(geneData);
  }

  setOrder(order) {
    if (order.hasOwnProperty('newick')) {
      this.order = order['newick'];
      this.hasTree = true;
    }
  }
}

export {
  GenomeViewer
};
