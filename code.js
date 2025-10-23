figma.showUI(__html__, { width: 220, height: 260 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'CREATE') {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      figma.notify('Please select a frame or component to generate variations.');
      return;
    }
    const baseNode = selection[0];
    const clones = [];
    const numBrands = msg.theme ? 7 : 1;
    const numSizes = msg.dynamic ? 10 : 1;
    const startX = baseNode.x;
    const startY = baseNode.y;
    const spacingX = baseNode.width + 40;
    const spacingY = baseNode.height + 40;
    for (let i = 0; i < numBrands; i++) {
      for (let j = 0; j < numSizes; j++) {
        const clone = baseNode.clone();
        clone.x = startX + i * spacingX;
        clone.y = startY + j * spacingY;
        clones.push(clone);
      }
    }
    figma.currentPage.selection = clones;
    figma.notify(`Created ${numBrands * numSizes} variations.`);
  }
};
