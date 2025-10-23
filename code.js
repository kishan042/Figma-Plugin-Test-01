figma.showUI(__html__, { width: 320, height: 200 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create') {
    // For now, stub for creating variations - show notification
    figma.notify('Creating variations... (stub)');
  }
};
