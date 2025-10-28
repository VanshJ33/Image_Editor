# Image Editor Application - Features Documentation

## Table of Contents
1. [Core Architecture](#core-architecture)
2. [Canvas Management](#canvas-management)
3. [Template System](#template-system)
4. [Layer Management](#layer-management)
5. [Text Effects](#text-effects)
6. [UI Components](#ui-components)
7. [Global Functions](#global-functions)
8. [File Structure](#file-structure)

---

## Core Architecture

### EditorContext (Global State Management)
**File:** `frontend/src/contexts/EditorContext.jsx`

**Purpose:** Central state management for the entire editor application

**Global Functions:**
- `useEditor()` - Hook to access editor context globally
- `EditorProvider` - Context provider wrapper

**Key State Variables:**
- `canvas` - Fabric.js canvas instance
- `layers` - Array of canvas objects/layers
- `selectedLayer` - Currently selected layer
- `canvasSize` - Canvas dimensions {width, height}
- `zoom` - Current zoom level

**Core Functions:**

#### Canvas Management
```javascript
// Canvas initialization and setup
initializeCanvas(canvasElement)
- Location: EditorContext.jsx:45
- Purpose: Initialize Fabric.js canvas with default settings
- Used by: Canvas.jsx on component mount

// Canvas resizing with proportional scaling
resizeCanvas(newWidth, newHeight)
- Location: EditorContext.jsx:78
- Purpose: Resize canvas and scale all objects proportionally
- Used by: Canvas.jsx when dimensions change
- Algorithm: Calculates scale ratios and applies to all objects
```

#### Layer Management
```javascript
// Add new layer to canvas
addLayer(layerData)
- Location: EditorContext.jsx:112
- Purpose: Add text, image, or shape to canvas
- Used by: LeftSidebar.jsx, RightSidebar.jsx

// Update layer properties
updateLayer(layerId, properties)
- Location: EditorContext.jsx:125
- Purpose: Modify existing layer properties
- Used by: RightSidebar.jsx property panels

// Delete layer from canvas
deleteLayer(layerId)
- Location: EditorContext.jsx:138
- Purpose: Remove layer from canvas and state
- Used by: RightSidebar.jsx delete buttons

// Layer reordering functions
moveLayerUp(layerId)
moveLayerDown(layerId)
moveLayerToTop(layerId)
moveLayerToBottom(layerId)
- Location: EditorContext.jsx:151-184
- Purpose: Change layer z-index/stacking order
- Used by: RightSidebar.jsx layer management buttons
```

#### Template Loading
```javascript
// Load template onto canvas
loadTemplate(templateData)
- Location: EditorContext.jsx:197
- Purpose: Clear canvas and load template JSON
- Used by: LeftSidebar.jsx template selection
- Process: Clears canvas → Loads JSON → Updates layers state
```

---

## Canvas Management

### Canvas Component
**File:** `frontend/src/components/editor/Canvas.jsx`

**Purpose:** Fabric.js canvas wrapper and interaction handler

**Key Functions:**

#### Canvas Initialization
```javascript
// Canvas setup and event binding
useEffect(() => {
  const fabricCanvas = new fabric.Canvas(canvasRef.current)
  // Event listeners for object selection, modification
}, [])
- Location: Canvas.jsx:25
- Purpose: Create Fabric.js instance and bind events
```

#### Zoom Management
```javascript
// Auto-fit zoom calculation
const calculateAutoFitZoom = () => {
  const containerWidth = containerRef.current?.clientWidth || 800
  const containerHeight = containerRef.current?.clientHeight || 600
  const scaleX = containerWidth / canvasSize.width
  const scaleY = containerHeight / canvasSize.height
  return Math.min(scaleX, scaleY, 1) * 0.5 // Default 50% zoom
}
- Location: Canvas.jsx:45
- Purpose: Calculate optimal zoom level
- Default: 50% zoom instead of auto-fit
```

#### Canvas Events
```javascript
// Object selection handler
canvas.on('selection:created', (e) => {
  setSelectedLayer(e.selected[0])
})
- Location: Canvas.jsx:78
- Purpose: Update selected layer state when user clicks objects
```

---

## Template System

### Template Data Structure
**File:** `frontend/src/data/canvaTemplates.js`

**Purpose:** Store all template designs and configurations

**Template Categories:**
- Social Media (4 templates)
- Instagram Ads (4 templates)
- WhatsApp Ads (4 templates)
- Facebook Ads (4 templates)
- Ecommerce (4 templates)
- Advanced Effects (8 templates)

**Template Structure:**
```javascript
{
  title: "Template Name",
  category: "Category Name",
  filename: "template_file.json",
  json: {
    version: "5.3.0",
    objects: [
      // Fabric.js objects array
      {
        type: "textbox",
        left: 140,
        top: 200,
        width: 800,
        text: "Sample Text",
        fontSize: 96,
        fontFamily: "Montserrat",
        fill: "#ffffff",
        // Advanced text effects
        shadow: {
          color: "rgba(0,0,0,0.5)",
          blur: 20,
          offsetX: 5,
          offsetY: 5
        },
        stroke: "#000000",
        strokeWidth: 2,
        charSpacing: 100
      }
    ]
  }
}
```

### Template Loading System
**File:** `frontend/src/components/editor/LeftSidebar.jsx`

**Functions:**

#### Template Filtering
```javascript
// Filter templates by category
const filteredTemplates = templates.filter(template => 
  selectedCategory === 'All' || template.category === selectedCategory
)
- Location: LeftSidebar.jsx:45
- Purpose: Show templates based on selected category
```

#### Template Loading
```javascript
// Load selected template
const handleTemplateSelect = (template) => {
  loadTemplate(template.json)
  canvas.renderAll()
  // Additional render calls for proper loading
  setTimeout(() => canvas.renderAll(), 100)
  setTimeout(() => canvas.renderAll(), 500)
}
- Location: LeftSidebar.jsx:58
- Purpose: Load template and ensure proper rendering
```

---

## Layer Management

### Layer Panel
**File:** `frontend/src/components/editor/RightSidebar.jsx`

**Purpose:** Layer management interface with drag-and-drop reordering

**Key Features:**

#### Drag and Drop Reordering
```javascript
// Framer Motion Reorder component
<Reorder.Group values={layers} onReorder={handleReorder}>
  {layers.map((layer) => (
    <Reorder.Item key={layer.id} value={layer}>
      // Layer item content
    </Reorder.Item>
  ))}
</Reorder.Group>
- Location: RightSidebar.jsx:78
- Purpose: Enable drag-and-drop layer reordering
```

#### Layer Reordering Functions
```javascript
// Handle drag-and-drop reorder
const handleReorder = (newOrder) => {
  reorderLayers(newOrder)
}

// Reorder layers in context
const reorderLayers = (newOrder) => {
  setLayers(newOrder)
  // Update canvas object z-index
  newOrder.forEach((layer, index) => {
    const canvasObject = canvas.getObjects().find(obj => obj.id === layer.id)
    if (canvasObject) {
      canvas.moveTo(canvasObject, index)
    }
  })
  canvas.renderAll()
}
- Location: EditorContext.jsx:205
- Purpose: Sync layer order between state and canvas
```

#### Layer Movement Buttons
```javascript
// Move layer up/down/top/bottom buttons
<button onClick={() => moveLayerUp(layer.id)}>↑</button>
<button onClick={() => moveLayerDown(layer.id)}>↓</button>
<button onClick={() => moveLayerToTop(layer.id)}>⤴</button>
<button onClick={() => moveLayerToBottom(layer.id)}>⤵</button>
- Location: RightSidebar.jsx:125-140
- Purpose: Precise layer movement controls
```

---

## Text Effects

### Advanced Typography Effects
**Implemented in:** Template JSON objects

**Available Effects:**

#### Shadow Effects
```javascript
shadow: {
  color: "rgba(0,0,0,0.5)",    // Shadow color with transparency
  blur: 20,                    // Blur intensity (0-50)
  offsetX: 5,                  // Horizontal offset
  offsetY: 5                   // Vertical offset
}
```

#### Gradient Fills
```javascript
fill: {
  type: "linear",              // or "radial"
  coords: { 
    x1: 0, y1: 0,             // Start point
    x2: 800, y2: 0            // End point
  },
  colorStops: [
    { offset: 0, color: "#ff6b6b" },
    { offset: 0.5, color: "#4ecdc4" },
    { offset: 1, color: "#45b7d1" }
  ]
}
```

#### Stroke Effects
```javascript
stroke: "#ffffff",           // Stroke color
strokeWidth: 4               // Stroke thickness
```

#### Character Spacing
```javascript
charSpacing: 150             // Letter spacing in pixels
```

#### Text Transformations
```javascript
angle: 15,                   // Rotation angle
skewX: 10,                   // Horizontal skew
skewY: -20,                  // Vertical skew
scaleX: 1.2,                 // Horizontal scale
scaleY: 0.8                  // Vertical scale
```

#### Curved Text Effects
- **Wave Text:** Individual letters positioned at different angles
- **Arc Text:** Text rotation with angle property
- **Perspective Text:** Using skewY and scaleY for 3D effect

---

## UI Components

### Left Sidebar
**File:** `frontend/src/components/editor/LeftSidebar.jsx`

**Sections:**
1. **Templates Tab**
   - Category filter dropdown
   - Template grid display
   - Template preview and selection

2. **Elements Tab**
   - Text tools
   - Shape tools
   - Image upload

**Key Functions:**
```javascript
// Template category filtering
const handleCategoryChange = (category) => {
  setSelectedCategory(category)
}
- Location: LeftSidebar.jsx:35
```

### Right Sidebar
**File:** `frontend/src/components/editor/RightSidebar.jsx`

**Sections:**
1. **Layers Panel**
   - Layer list with drag-and-drop
   - Layer visibility toggles
   - Layer movement controls
   - Layer deletion

2. **Properties Panel**
   - Text properties (font, size, color)
   - Object properties (position, size)
   - Effect properties (shadow, stroke)

**Key Functions:**
```javascript
// Layer property updates
const handlePropertyChange = (property, value) => {
  updateLayer(selectedLayer.id, { [property]: value })
}
- Location: RightSidebar.jsx:95
```

### Top Toolbar
**File:** `frontend/src/components/editor/TopToolbar.jsx`

**Features:**
- Canvas size controls
- Zoom controls
- Undo/Redo (if implemented)
- Export options

---

## Global Functions

### Utility Functions
**File:** `frontend/src/utils/canvasUtils.js` (if exists)

**Common Operations:**
```javascript
// Generate unique IDs for layers
generateLayerId()

// Convert canvas to image
exportCanvasAsImage(canvas, format)

// Import image to canvas
importImageToCanvas(canvas, imageFile)
```

### Event Handlers
**Global event handling patterns:**

```javascript
// Canvas object selection
canvas.on('selection:created', handleObjectSelection)
canvas.on('selection:updated', handleObjectSelection)
canvas.on('selection:cleared', handleObjectDeselection)

// Canvas object modification
canvas.on('object:modified', handleObjectModification)
canvas.on('object:moving', handleObjectMoving)
canvas.on('object:scaling', handleObjectScaling)
```

---

## File Structure

```
app/
├── frontend/src/
│   ├── components/
│   │   └── editor/
│   │       ├── Canvas.jsx              # Main canvas component
│   │       ├── LeftSidebar.jsx         # Templates & elements
│   │       ├── RightSidebar.jsx        # Layers & properties
│   │       └── TopToolbar.jsx          # Canvas controls
│   ├── contexts/
│   │   └── EditorContext.jsx           # Global state management
│   ├── data/
│   │   └── canvaTemplates.js           # Template definitions
│   ├── utils/
│   │   └── canvasUtils.js              # Utility functions
│   └── styles/
│       └── editor.css                  # Editor styling
```

---

## Feature Integration Flow

### Template Loading Flow
1. User selects template in `LeftSidebar.jsx`
2. `handleTemplateSelect()` calls `loadTemplate()` from context
3. `EditorContext.jsx` clears canvas and loads JSON
4. Canvas objects are created and rendered
5. Layers state is updated
6. `RightSidebar.jsx` displays new layers

### Layer Management Flow
1. User interacts with layer in `RightSidebar.jsx`
2. Drag-and-drop triggers `handleReorder()`
3. `reorderLayers()` updates both state and canvas z-index
4. Canvas re-renders with new layer order
5. UI updates to reflect changes

### Canvas Interaction Flow
1. User clicks object on canvas
2. Fabric.js fires `selection:created` event
3. `Canvas.jsx` updates `selectedLayer` in context
4. `RightSidebar.jsx` shows properties for selected layer
5. Property changes update canvas object via context

---

## Performance Optimizations

### Canvas Rendering
- Multiple `renderAll()` calls for template loading
- Debounced property updates
- Selective re-rendering on layer changes

### State Management
- Minimal re-renders using React.memo
- Efficient layer updates using object references
- Optimized drag-and-drop with Framer Motion

### Memory Management
- Canvas object cleanup on template changes
- Event listener cleanup in useEffect
- Proper disposal of Fabric.js instances

---

## Extension Points

### Adding New Features
1. **New Text Effects:** Add to template JSON structure
2. **New Tools:** Extend LeftSidebar.jsx elements section
3. **New Properties:** Add to RightSidebar.jsx properties panel
4. **New Templates:** Add to canvaTemplates.js array

### Customization Options
- Template categories can be extended
- Canvas size presets can be modified
- UI themes can be implemented
- Export formats can be added

This documentation covers all major features, functions, and their locations within the image editor application. Each section provides specific file locations, function names, and usage patterns for easy reference and maintenance.