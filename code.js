figma.showUI(__html__, { width: 240, height: 200 });

// Listen for selection changes to update UI with detected collections
figma.on('selectionchange', () => {
  detectAndSendCollections();
});

// Detect collections on plugin load
detectAndSendCollections();

function detectAndSendCollections() {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'NO_SELECTION', collections: [] });
    return;
  }
  
  const node = selection[0];
  const detectedCollections = getCollectionsUsedInNode(node);
  
  figma.ui.postMessage({ 
    type: 'COLLECTIONS_DETECTED', 
    collections: detectedCollections 
  });
}

function getCollectionsUsedInNode(node) {
  const collectionsMap = new Map();
  
  // Recursively check node and children for bound variables
  function checkNode(n) {
    if ('boundVariables' in n && n.boundVariables) {
      // Check all bound variable properties (fills, strokes, etc.)
      for (const [property, binding] of Object.entries(n.boundVariables)) {
        if (binding && typeof binding === 'object') {
          const bindings = Array.isArray(binding) ? binding : [binding];
          bindings.forEach(b => {
            if (b && b.id) {
              try {
                const variable = figma.variables.getVariableById(b.id);
                if (variable) {
                  const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
                  if (collection && !collectionsMap.has(collection.id)) {
                    collectionsMap.set(collection.id, {
                      id: collection.id,
                      name: collection.name,
                      modes: collection.modes.map(m => ({ id: m.modeId, name: m.name }))
                    });
                  }
                }
              } catch (e) {
                console.error('Error getting variable:', e);
              }
            }
          });
        }
      }
    }
    
    // Recursively check children
    if ('children' in n) {
      n.children.forEach(child => checkNode(child));
    }
  }
  
  checkNode(node);
  return Array.from(collectionsMap.values());
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'CREATE') {
    // Check if any collections are enabled
    if (!msg.collections || msg.collections.length === 0) {
      figma.notify('Please enable at least one collection.');
      return;
    }

    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      figma.notify('Please select a frame, section, component, or instance to generate variations.');
      return;
    }

    const baseNode = selection[0];
    
    // Validate node type
    const supportedTypes = ['FRAME', 'COMPONENT', 'COMPONENT_SET', 'SECTION', 'INSTANCE'];
    if (!supportedTypes.includes(baseNode.type)) {
      figma.notify('Please select a frame, section, component, or instance.');
      return;
    }
    
    const clones = [];
    
    // Process each enabled collection
    msg.collections.forEach((collectionData, colIndex) => {
      const collection = figma.variables.getVariableCollectionById(collectionData.id);
      if (!collection) return;
      
      collection.modes.forEach((mode, modeIndex) => {
        const clone = baseNode.clone();
        
        // Create wrapper frame
        const wrapperWidth = baseNode.width + 25;
        const wrapperHeight = baseNode.height + 25;
        
        const wrapper = figma.createFrame();
        wrapper.name = `${collection.name} - ${mode.name}`;
        wrapper.resize(wrapperWidth, wrapperHeight);
        wrapper.fills = [];
        
        wrapper.appendChild(clone);
        clone.x = 12.5;
        clone.y = 12.5;
        
        // Position wrapper
        wrapper.x = baseNode.x + baseNode.width + 100 + (modeIndex * (wrapperWidth + 100));
        wrapper.y = baseNode.y + (colIndex * (baseNode.height + 240));
        
        // Apply mode
        applyThemeModeValues(clone, collection, modeIndex);
        
        clones.push(wrapper);
      });
    });
    
    figma.currentPage.selection = clones;
    figma.notify(`Created ${clones.length} variations.`);
  }
};


// Helper function to set explicit variable mode for a node and its children
function applyThemeModeValues(node, collection, modeIndex) {
  try {
    const mode = collection.modes[modeIndex];
    if (!mode) {
      console.error('Mode not found');
      return;
    }
    
    // Set the explicit variable mode for this node using the correct modeId
    node.setExplicitVariableModeForCollection(collection.id, mode.modeId);
    
    // Recursively apply to children
    if ('children' in node) {
      node.children.forEach(child => applyThemeModeValues(child, collection, modeIndex));
    }
  } catch (error) {
    console.error('Error setting variable mode:', error);
  }
}
