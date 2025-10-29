# Screen Layout - Figma Plugin

A powerful Figma plugin that automatically generates screen variations by detecting and combining variable collection modes from your designs.

## Features

### 🎨 Dynamic Collection Detection
- Automatically detects variable collections applied to selected frames
- Shows only relevant collections in the UI
- Works with any collection names (no hardcoded requirements)

### 🔄 Cross-Product Variations
- Generates all possible combinations of enabled collections
- Example: 4 theme modes × 6 accessibility modes = 24 variations
- Smart grid layout groups modes by collection

### 🎯 Intelligent Layout
- Groups all modes from the last collection in single rows
- Dynamic grid adapts to any number of modes
- 25px padding around each variation for clean spacing

### 💡 Smart UI
- All collections enabled by default
- Remembers toggle states when switching selections
- Multi-selection support (processes first item)

### 🏷️ Clear Naming
- Variations named with all applied modes
- Format: "Brand A + Mode 1", "Theme Dark + Size Large"
- Easy to identify and organize outputs

## Installation

1. Open Figma Desktop App
2. Go to **Plugins** → **Development** → **Import plugin from manifest...**
3. Select the `manifest.json` file from this repository
4. The plugin will appear in your plugins list

## Usage

### Step 1: Prepare Your Design
1. Create a frame with variable collections applied
2. Bind variables to properties (fills, strokes, text, etc.)
3. Ensure collections have multiple modes defined

### Step 2: Run the Plugin
1. Select your frame in Figma
2. Run **Screen Layout** from the Plugins menu
3. The UI will automatically detect applied collections

### Step 3: Generate Variations
1. Review detected collections (all enabled by default)
2. Toggle off any collections you don't want to include
3. Click **Create** to generate variations

### Step 4: Review Output
- Variations appear to the right of your original frame
- Each variation is wrapped in a frame with 25px padding
- Named with all applied collection modes
- Organized in a grid layout

## How It Works

### Collection Detection
The plugin recursively scans the selected frame and its children for bound variables, extracting all unique variable collections used.

### Cross-Product Generation
Uses a recursive algorithm to generate all possible combinations of modes from enabled collections:
- Collection A (4 modes) × Collection B (6 modes) = 24 variations
- Each variation applies the specific mode combination

### Grid Layout
- Columns: Based on the last collection's mode count
- Rows: Automatically calculated from total combinations
- Spacing: 100px between items, 240px between rows

### Frame Wrapping
Each variation is wrapped in a transparent frame with:
- Width: Original frame width + 25px
- Height: Original frame height + 25px
- Clone positioned at (12.5, 12.5) for centered padding

## Project Structure

```
screen-layout-figma-plugin/
├── manifest.json       # Plugin configuration
├── code.js            # Main plugin logic
├── ui.html            # Plugin user interface
└── README.md          # Documentation
```

### Key Functions

**`detectAndSendCollections()`**
- Detects collections on selection change
- Sends collection data to UI

**`getCollectionsUsedInNode(node)`**
- Recursively scans node for bound variables
- Returns unique collections with mode information

**`generateCombinations(collections, currentCombination, collectionIndex)`**
- Recursive cross-product generator
- Creates all mode combinations

**`applyThemeModeValues(node, collection, modeIndex)`**
- Applies specific collection mode to node
- Recursively updates children

## Development History

### Version 1.0 - Frame-Based Sizing
- Fixed section sizing issues
- Replaced sections with frames for proper dimension control
- Implemented 25px padding around variations

### Version 2.0 - Dynamic Collection Detection
- Added real-time collection detection
- Replaced static toggles with dynamic UI
- Implemented cross-product variation generation
- Added toggle state memory

### Version 2.1 - Grid Layout Improvements
- Fixed grid layout to group collection modes in rows
- Dynamic column calculation based on last collection
- Improved naming with combined mode names

### Version 2.2 - Final Polish
- Responsive UI with consistent margins
- Updated plugin naming and branding
- Comprehensive documentation

## Technical Details

- **Figma API Version:** 1.0.0
- **Supported Node Types:** Frame, Component, Component Set, Section, Instance
- **Variable Support:** All Figma variable types
- **Browser Compatibility:** Figma Desktop App

## License

MIT

## Author

Built with ❤️ for the Figma design community
