class TreeDrawer {
  constructor(viewer, newick, treeWidth = 200, padding = 10) {
    this.viewer = viewer;
    this.treeWidth = treeWidth;
    this.padding = padding;

    this.newick = newick;

    this.tree = new Tree();
    this.tree.Parse(this.newick, false);
    this.tree.ComputeDepths();

    this.useEdgeLengths = this.tree.has_edge_lengths;
  }

  getLayers() {

  }

  getBuffer() {
    let buffer = new OffscreenCanvas(this.treeWidth, this.viewer.height);
    let ctx = buffer.getContext('2d');
    let deepestPathLength = 0;

    let t = this.tree;

    // 1
    if (this.useEdgeLengths) {
      var n = new PreorderIterator(t.root);
      var q = n.Begin();
      while (q != null) {
        var d = q.edge_length;
        if (d < 0.00001) {
          d = 0.0;
        }
        if (q != t.root) {
          q.path_length = q.ancestor.path_length + d;
        }

        deepestPathLength = Math.max(deepestPathLength, q.path_length);
        q = n.Next();
      }

      var n = new NodeIterator(t.root);
      var q = n.Begin();
    } else {
      deepestPathLength = t.root.depth;

      for (var i = 0; i < t.nodes.length; i++) {
        var n = t.nodes[i];
        if (n != t.root) {
          n.path_length = deepestPathLength - n.depth;
        }
      }
    }

    // 2
    let dummyYpos = 18;

    var n = new NodeIterator(t.root);
    var q = n.Begin();
    while (q != null) {
      if (q.IsLeaf()) {
        q.xy['x'] = this.padding + (this.treeWidth - 2 * this.padding) * q.path_length / deepestPathLength;
        q.xy['y'] = dummyYpos;
        dummyYpos += 40;
      } else {
        var pl = q.child.xy;
        var pr = q.child.GetRightMostSibling()
          .xy;

        q.xy['x'] = this.padding + (this.treeWidth - 2 * this.padding) * q.path_length / deepestPathLength;
        q.xy['y'] = pl['y'] + (pr['y'] - pl['y']) / 2;
      }
      q = n.Next();
    }

    // 3

    var n = new NodeIterator(t.root);
    var q = n.Begin();

    var lines = [];
    while (q != null) {
      if (q.IsLeaf()) {

        var p0 = q.xy
        var p1 = [];
        var anc = q.ancestor;
        if (anc) {
          p1['x'] = anc.xy['x'];
          p1['y'] = p0['y'];

          ctx.beginPath();
          ctx.moveTo(p0['x'], p0['y']);
          ctx.lineTo(p1['x'], p1['y']);
          ctx.stroke();
        }
      } else {
        var p0 = [];
        var p1 = [];

        p0['x'] = q.xy['x'];
        p0['y'] = q.xy['y'];

        var anc = q.ancestor;
        if (anc) {
          p1['x'] = anc.xy['x'];
          p1['y'] = p0['y'];

          ctx.beginPath();
          ctx.moveTo(p0['x'], p0['y']);
          ctx.lineTo(p1['x'], p1['y']);
          ctx.stroke();
        }

        // vertical line
        var pl = q.child.xy;
        var pr = q.child.GetRightMostSibling()
          .xy;

        p0['x'] = p0['x'];
        p0['y'] = pl['y'];

        p1['x'] = p0['x'];
        p1['y'] = pr['y'];

        ctx.beginPath();
        ctx.moveTo(p0['x'], p0['y']);
        ctx.lineTo(p1['x'], p1['y']);
        ctx.stroke();
      }
      q = n.Next();
    }


    return buffer;
  }
}


export {
  TreeDrawer
};
