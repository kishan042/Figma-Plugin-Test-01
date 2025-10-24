figma.showUI(__html__, { width: 240, height: 200 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'CREATE') {
    // Bug 2 fix: Do nothing if no toggles are ON
    if (!msg.theme && !msg.dynamic) {
      figma.notify('Please enable at least one option (Theme or Dynamic Type).');
      return;
    }

    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      figma.notify('Please select a frame, section, component, or instance to generate variations.');
      return;
    }

    const baseNode = selection[0];
    
    // Validate node type supports variable modes
    const supportedTypes = ['FRAME', 'COMPONENT', 'COMPONENT_SET', 'SECTION', 'INSTANCE'];
    if (!supportedTypes.includes(baseNode.type)) {
      figma.notify('Please select a frame, section, component, or instance.');
      return;
    }
    const clones = [];
    
    // Dynamic theme mode detection
    let numThemeModes = 1;
    let themeCollection = null;
    
    if (msg.theme) {
      const result = findThemeCollection();
      if (result) {
        themeCollection = result.collection;
        numThemeModes = result.modeCount;
      } else {
        figma.notify('Theme collection not found. Please create a collection named "Theme".');
        return;
      }
    }
    
    // Dynamic Type collection detection  
    if (msg.dynamic) {
      const dynamicResult = findDynamicTypeCollection();
      if (!dynamicResult) {
        figma.notify('Dynamic Type collection not found. Please create a collection named "Dynamic Type".');
        return;
      }
      // Dynamic Type collection exists - allow it to continue
    }
    
    const numSizes = msg.dynamic ? 10 : 1;
    
    const startX = baseNode.x;
    const startY = baseNode.y;
    const spacingX = baseNode.width + 40;
    const spacingY = baseNode.height + 40;
    
    // Create clones for each theme mode
    for (let i = 0; i < numThemeModes; i++) {
      for (let j = 0; j < numSizes; j++) {
        const clone = baseNode.clone();
        
        if (msg.theme && themeCollection) {
          // Calculate section dimensions based on frame size
          const sectionWidth = baseNode.width + 200;
          const sectionHeight = baseNode.height + 200;
          
          // Create section for this mode
          const section = figma.createSection();
          const mode = themeCollection.modes[i];
          section.name = mode.name; // Name section after the mode (e.g., "Mode 1", "Mode 2")
          
          // Position section on canvas
          section.x = startX + baseNode.width + 100 + (i * (sectionWidth + 100));
          section.y = startY + j * (baseNode.height + 240);
          
          // Add clone to section
          section.appendChild(clone);
          
          // Position clone relative to section (with padding) AFTER appendChild
          clone.x = 100;
          clone.y = 100;
          
          // Apply theme mode using resolved variable values
          applyThemeModeValues(clone, themeCollection, i);
          
          clones.push(section);
        } else {
          // No theme - just clone without section
          clone.x = startX + (i + 1) * spacingX;
          clone.y = startY + j * spacingY;
          clones.push(clone);
        }
      }
    }
    
    figma.currentPage.selection = clones;
    figma.notify(`Created ${numThemeModes * numSizes} variations.`);
  }
};

// Helper function to find Theme collection dynamically
function findThemeCollection() {
  try {
    const collections = figma.variables.getLocalVariableCollections();
    const themeCollection = collections.find(collection => 
      collection.name.toLowerCase() === 'theme'
    );
    
    if (themeCollection) {
      return {
        collection: themeCollection,
        modeCount: themeCollection.modes.length
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding theme collection:', error);
    return null;
  }
}

// Helper function to find Dynamic Type collection
function findDynamicTypeCollection() {
  try {
    const collections = figma.variables.getLocalVariableCollections();
    const dynamicCollection = collections.find(collection => 
      collection.name.toLowerCase() === 'dynamic type'
    );
    
    if (dynamicCollection) {
      return { collection: dynamicCollection };
    }
    return null;
  } catch (error) {
    console.error('Error finding dynamic type collection:', error);
    return null;
  }
}

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
