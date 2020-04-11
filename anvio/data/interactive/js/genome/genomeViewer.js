import {
  GenomeTrack
} from './genomeTrack.js';
import {
  TreeDrawer
} from './treeDrawer.js';
import {
  RenderCanvas
} from './drawing.js';


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
    this.layers = [];

    this.startPercent = 0;
    this.widthPercent = 100;
  }

  /*
      Events:
  */

  bindEvents() {
    this.canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
    this.canvas.addEventListener('mousedown', (event) => this.handleMouseDown(event));
    this.canvas.addEventListener('mouseup', (event) => this.handleMouseUp(event));
    this.canvas.addEventListener('wheel', (event) => this.handleWheel(event));
    window.addEventListener('resize', (event) => this.handleResize(event));
  }

  handleMouseMove(event) {
    if (this.mouseDown) {
      this.centerPos = event.x - this.panStart.x;
      this.draw();
    }
  }

  handleMouseDown(event) {
    this.mouseDown = true;
    this.panStart = {
      'x': event.x - this.centerPos,
      'y': event.y,
      'target': null
    };
  }

  handleMouseUp(event) {
    this.mouseDown = false;
  }

  handleResize(event) {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.draw();
  }

  handleWheel(event) {
    let deltaTime = Date.now() - this.lastScrollTime;

    if (deltaTime > 10) {
      this.centerPos -= event.deltaX * 4;
      this.lastScrollTime = Date.now();
    }

    this.draw();
  }


  /*
      Drawing methods
  */

  center() {
    this.centerPos = 0;
    this.draw();
  }

  clear() {
    let ctx = this.context;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  draw() {
    if (this.needsRedraw) {
      this.layers = [];

      this.genomeTracks.forEach((track) => {
        this.layers.push(track.getLayers());
      });

      //this.needsRedraw = false;
    }

    let max = Math.max(...this.genomeTracks.map((track) => {
      return track.getLongestContig();
    }));


    let treeWidth = 200;
    let padding = 10;

    this.clear();
    this.layers.forEach((layer, order) => {

      // TO DO: why?
      layer = layer[0]
      let render = new RenderCanvas(layer, 0.1, 1);

      this.context.drawImage(render.getBuffer(), 0, 50 + 40 * order);
    });

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
