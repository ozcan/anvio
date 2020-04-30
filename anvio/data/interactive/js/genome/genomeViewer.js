import {
  Contig
} from './contig.js';
import {
  TreeDrawer
} from './treeDrawer.js';


class GenomeViewer {
  constructor(options) {
    let defaults = {
      'container': '',
      'showGenomeLabels': true,
      'showGeneLabels': true,
      'showTree': true,
      'showGCContentOverlay': true,
      'basesPerPixel': 10000
    }

    this.options = $.extend(defaults, options);
    this.canvas = this.options.canvas;
    this.context = this.canvas.getContext('2d');
    this.width = 0;
    this.height = 0;

    this.contigs = [];
    this.geneClusters = [];

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
    this.canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
  }

  handleResize(event) {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.draw();
  }

  handleMouseMove(event) {
    let point = {
      'x': event.clientX,
      'y': event.clientY
    };

    let treeBox = {
      'x': 0,
      'y': 0,
      'width': 200,
      'height': this.height + 80,
    }

    if (this.hasTree && this.pointInBox(point, treeBox)) {
      console.log('hovering tree');
    }
  }

  pointInBox(point, box) {
    return point.x >= box.x &&
      point.x <= (box.x + box.width) &&
      point.y >= box.y &&
      point.y <= (box.y + box.height)
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

    let max = Math.max(...this.contigs.map(contig => contig.length))
    let treeWidth = 200;
    let padding = 10;

    this.contigs.forEach((contig, i) => {
      let layers = contig.getLayers()
      console.log(layers.renderSVG())

      // const xScale = (1 / (this.widthPercent / 100)) * ((this.width - treeWidth) / max);
      // let buffer = track.getLayers()[0].render(xScale, 1);
      //
      // let trackWidth = this.hasTree ? this.width - treeWidth : this.width;
      //
      // // s -> source
      // // d -> destination
      // let sx = xScale * (max * this.startPercent / 100)
      // let sy = 0
      // let sWidth = trackWidth;
      // let sHeight = 40;
      //
      // let dx = treeWidth + track.offsetX * xScale;
      // let dy = 50 + 40 * i;
      // let dWidth = trackWidth;
      // let dHeight = 40;
      //
      // this.context.drawImage(buffer, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    });

    if (this.hasTree) {
      let tree = new TreeDrawer(this, this.order, treeWidth, padding);
      this.context.clearRect(0, 0, treeWidth, this.height + 80);
      this.context.drawImage(tree.getBuffer(), 0, 40);
    }
  }


  /*
      Data access
  */

  getContig(contigName) {
    let contig = this.contigs.find((c) => c.name == contigName);
  }

  addContig(contigData) {
    this.contigs.push(new Contig(contigData))
  }

  addGene(contigName, geneData) {
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
