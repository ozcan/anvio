function initMiniMap(genomeViewer) {
  const qS = (s) => document.querySelector(s);
  let miniMap = qS('.minimap');
  let miniMapBackground = qS('.minimap-background');
  let miniMapSelection = qS('.minimap-inner');
  let miniMapCanvas = qS('.minimap-background-canvas')

  miniMapSelection.style.left = '0%';
  miniMapSelection.style.width = '100%';

  let resizing = false;
  let mouseDown = false;
  let panningStart = false;
  let panningEnd = false;
  let movingSelector = false;
  let pressedBackground = false;

  let mouseStartX = 0;


  let resizeHandler = () => {
    let bgBox = miniMapBackground.getBoundingClientRect();
    miniMapCanvas.width = bgBox.width;
    miniMapCanvas.height = bgBox.height;

    let ctx = miniMapCanvas.getContext('2d');
    ctx.clearRect(0, 0, bgBox.width, bgBox.height);
    let max = Math.max(...genomeViewer.genomeTracks.map((track) => {
      return track.getLongestContig();
    }));

    const numTracks = genomeViewer.genomeTracks.length;

    genomeViewer.genomeTracks.forEach((track, order) => {
      const xScale = miniMapCanvas.width / max;
      const layerBuffer = track.getLayers()[0].render(xScale, 1);
      ctx.drawImage(layerBuffer, 0, order / numTracks * miniMapCanvas.height);
    });
  }

  window.addEventListener('resize', resizeHandler);
  resizeHandler();

  miniMap.addEventListener('mousedown', (ev) => {
    mouseDown = true;
    let targetClass = ev.target.getAttribute('class');

    panningStart = targetClass.indexOf('-start') > -1
    panningEnd = targetClass.indexOf('-end') > -1
    movingSelector = targetClass.indexOf('-inner') > -1
    resizing = targetClass.indexOf('minimap-row-divider') > -1

    mouseStartX = ev.pageX;
  });

  document.body.addEventListener('mousemove', (ev) => {
    if (mouseDown && resizing) {
      miniMap.style.height = document.body.clientHeight - ev.clientY + 'px';
      resizeHandler();
    }
  });

  miniMap.addEventListener('mousemove', (ev) => {
    let bgBox = miniMapBackground.getBoundingClientRect();

    let startPercent = parseFloat(miniMapSelection.style.left);
    let widthPercent = parseFloat(miniMapSelection.style.width);

    let cursorPercent = (ev.pageX - bgBox.left) * 100 / bgBox.width;
    cursorPercent = Math.min(100, Math.max(0, cursorPercent));

    if (mouseDown && panningStart) {
      miniMapSelection.style.left = Math.max(0, cursorPercent) + '%';
      miniMapSelection.style.width = Math.max(1, (startPercent + widthPercent) - cursorPercent) + '%'
    } else if (mouseDown && panningEnd) {
      miniMapSelection.style.width = Math.max(1, Math.min(100, cursorPercent - startPercent)) + '%';
    } else if (mouseDown && movingSelector && startPercent + widthPercent <= 100 && startPercent >= 0) {
      let delta = ev.pageX - mouseStartX;
      let deltaPercent = delta * 100 / bgBox.width;
      if (startPercent + deltaPercent + widthPercent > 100) {
        deltaPercent = deltaPercent - (startPercent + deltaPercent + widthPercent - 100);
      }
      miniMapSelection.style.left = Math.max(0, startPercent + deltaPercent) + '%';
      mouseStartX = ev.pageX;
    }
  });

  miniMap.addEventListener('mouseup', (ev) => {
    if (mouseDown && (panningStart || panningEnd || movingSelector)) {
      genomeViewer.startPercent = parseFloat(miniMapSelection.style.left);
      genomeViewer.widthPercent = parseFloat(miniMapSelection.style.width);
      genomeViewer.draw();
    }
    mouseDown = false;
  });

}

export {
  initMiniMap
};
