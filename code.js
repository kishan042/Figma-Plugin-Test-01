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
  
  // Only process first selected node if multiple are selected
  const node = selection[0];
  
  // Notify user if multiple selections detected
  if (selection.length > 1) {
    figma.notify(`Processing first selection only (${selection.length} items selected)`);
  }
  
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
    
    // Generate all combinations of modes from enabled collections
    function generateCombinations(collections, currentCombination = [], collectionIndex = 0) {
      if (collectionIndex === collections.length) {
        // We have a complete combination, create the clone
        const clone = baseNode.clone();
        
        // Create wrapper frame
        const wrapperWidth = baseNode.width + 25;
        const wrapperHeight = baseNode.height + 25;
        
        const wrapper = figma.createFrame();
        
        // Build name from all modes: "Brand A + Mode 1"
        wrapper.name = currentCombination.map(c => c.modeName).join(' + ');
        wrapper.resize(wrapperWidth, wrapperHeight);
        wrapper.fills = [];
        
        wrapper.appendChild(clone);
        clone.x = 12.5;
        clone.y = 12.5;
        
        // Position wrapper (grid layout based on index)
        // Use the LAST collection's mode count for grid columns
        // This ensures each row contains all modes from the last collection
        const lastCollectionData = msg.collections[msg.collections.length - 1];
        const lastCollection = figma.variables.getVariableCollectionById(lastCollectionData.id);
        const gridColumns = lastCollection ? lastCollection.modes.length : 1;
        const cloneIndex = clones.length;
        const col = cloneIndex % gridColumns;
        const row = Math.floor(cloneIndex / gridColumns);
        
        wrapper.x = baseNode.x + baseNode.width + 100 + (col * (wrapperWidth + 100));
        wrapper.y = baseNode.y + (row * (baseNode.height + 240));
        
        // Apply all modes from the combination
        currentCombination.forEach(({ collection, modeIndex }) => {
          applyThemeModeValues(clone, collection, modeIndex);
        });
        
        clones.push(wrapper);
        return;
      }
      
      // Process current collection's modes
      const collectionData = collections[collectionIndex];
      const collection = figma.variables.getVariableCollectionById(collectionData.id);
      if (!collection) {
        generateCombinations(collections, currentCombination, collectionIndex + 1);
        return;
      }
      
      // For each mode in this collection
      collection.modes.forEach((mode, modeIndex) => {
        const newCombination = [
          ...currentCombination,
          {
            collection: collection,
            modeIndex: modeIndex,
            modeName: mode.name
          }
        ];
        generateCombinations(collections, newCombination, collectionIndex + 1);
      });
    }
    
    // Start generating combinations
    generateCombinations(msg.collections);
    
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
