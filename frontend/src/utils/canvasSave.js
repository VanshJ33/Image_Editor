/**
 * Canvas Save Utility
 * Handles saving canvas data to organization folders
 */

export const saveCanvasToOrganization = async (canvas, organizationName, source = 'editor') => {
  try {
    if (!canvas || !organizationName) {
      return { success: false, error: 'Missing canvas or organization name' };
    }

    // Get canvas data
    const canvasData = {
      json: canvas.toJSON(),
      timestamp: Date.now(),
      source,
      organizationName
    };

    // Save to localStorage with organization prefix
    const storageKey = `org_${organizationName}_canvas_${Date.now()}`;
    localStorage.setItem(storageKey, JSON.stringify(canvasData));

    return { success: true, key: storageKey };
  } catch (error) {
    console.error('Error saving canvas to organization:', error);
    return { success: false, error: error.message };
  }
};

export const loadCanvasFromOrganization = async (organizationName) => {
  try {
    if (!organizationName) {
      return { success: false, error: 'Missing organization name' };
    }

    // Get all organization canvases from localStorage
    const orgCanvases = [];
    const prefix = `org_${organizationName}_canvas_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          orgCanvases.push({ key, ...data });
        } catch (e) {
          console.warn('Failed to parse canvas data:', key);
        }
      }
    }

    // Sort by timestamp (newest first)
    orgCanvases.sort((a, b) => b.timestamp - a.timestamp);

    return { success: true, canvases: orgCanvases };
  } catch (error) {
    console.error('Error loading canvases from organization:', error);
    return { success: false, error: error.message };
  }
};

export const deleteCanvasFromOrganization = async (key) => {
  try {
    if (!key) {
      return { success: false, error: 'Missing canvas key' };
    }

    localStorage.removeItem(key);
    return { success: true };
  } catch (error) {
    console.error('Error deleting canvas from organization:', error);
    return { success: false, error: error.message };
  }
};