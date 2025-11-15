/**
 * pixi-integration-test.js
 * 
 * Sample test cases for Pixi.js integration.
 * These can be run manually in the browser console or automated with a test framework.
 * 
 * Usage:
 * 1. Open the editor in browser
 * 2. Open browser console
 * 3. Copy and paste test functions
 * 4. Run tests individually
 */

/**
 * Test 1: Verify Pixi initialization
 */
export function testPixiInitialization() {
  const { getPixiApp, isPixiAvailable } = require('./pixiLayer');
  
  const pixiApp = getPixiApp();
  const isAvailable = isPixiAvailable();
  
  console.log('Test 1: Pixi Initialization');
  console.log('Pixi App:', pixiApp ? '✅ Initialized' : '❌ Not initialized');
  console.log('WebGL Available:', isAvailable ? '✅ Yes' : '❌ No');
  console.log('Renderer Type:', pixiApp?.renderer?.type || 'N/A');
  
  return pixiApp !== null && isAvailable;
}

/**
 * Test 2: Verify viewport synchronization
 */
export function testViewportSync(canvas) {
  if (!canvas) {
    console.error('Test 2: Canvas not provided');
    return false;
  }
  
  const { getPixiApp } = require('./pixiLayer');
  const { syncToPixi } = require('./viewportSync');
  
  const pixiApp = getPixiApp();
  if (!pixiApp) {
    console.error('Test 2: Pixi not initialized');
    return false;
  }
  
  // Get Fabric viewport
  const vpt = canvas.viewportTransform;
  const fabricScale = vpt[0];
  const fabricTx = vpt[4];
  const fabricTy = vpt[5];
  
  // Sync to Pixi
  syncToPixi(canvas, pixiApp);
  
  // Get Pixi viewport
  const pixiScale = pixiApp.stage.scale.x;
  const pixiTx = pixiApp.stage.position.x;
  const pixiTy = pixiApp.stage.position.y;
  
  console.log('Test 2: Viewport Synchronization');
  console.log('Fabric Scale:', fabricScale, 'Pixi Scale:', pixiScale);
  console.log('Fabric TX:', fabricTx, 'Pixi TX:', pixiTx);
  console.log('Fabric TY:', fabricTy, 'Pixi TY:', pixiTy);
  
  const scaleMatch = Math.abs(fabricScale - pixiScale) < 0.001;
  const txMatch = Math.abs(fabricTx - pixiTx) < 1;
  const tyMatch = Math.abs(fabricTy - pixiTy) < 1;
  
  console.log('Scale Match:', scaleMatch ? '✅' : '❌');
  console.log('TX Match:', txMatch ? '✅' : '❌');
  console.log('TY Match:', tyMatch ? '✅' : '❌');
  
  return scaleMatch && txMatch && tyMatch;
}

/**
 * Test 3: Verify sprite creation for image objects
 */
export function testSpriteCreation(canvas) {
  if (!canvas) {
    console.error('Test 3: Canvas not provided');
    return false;
  }
  
  const { getSprite } = require('./pixiLayer');
  
  const objects = canvas.getObjects();
  const imageObjects = objects.filter(obj => obj.type === 'image');
  
  console.log('Test 3: Sprite Creation');
  console.log('Total Objects:', objects.length);
  console.log('Image Objects:', imageObjects.length);
  
  let spritesFound = 0;
  imageObjects.forEach(obj => {
    if (obj.id) {
      const sprite = getSprite(obj.id);
      if (sprite) {
        spritesFound++;
        console.log(`✅ Sprite found for object: ${obj.id}`);
      } else {
        console.log(`❌ No sprite for object: ${obj.id}`);
      }
    } else {
      console.log(`⚠️ Object has no ID:`, obj);
    }
  });
  
  console.log('Sprites Found:', spritesFound, '/', imageObjects.length);
  
  return spritesFound === imageObjects.length;
}

/**
 * Test 4: Verify filter application
 */
export function testFilterApplication(activeObject) {
  if (!activeObject || activeObject.type !== 'image') {
    console.error('Test 4: No image object selected');
    return false;
  }
  
  const { getSprite } = require('./pixiLayer');
  
  if (!activeObject.id) {
    console.error('Test 4: Object has no ID');
    return false;
  }
  
  const sprite = getSprite(activeObject.id);
  if (!sprite) {
    console.error('Test 4: No sprite found for object');
    return false;
  }
  
  console.log('Test 4: Filter Application');
  console.log('Fabric Filters:', activeObject.filters?.length || 0);
  console.log('Pixi Filters:', sprite.filters?.length || 0);
  
  const hasFilters = (activeObject.filters?.length > 0) || (sprite.filters?.length > 0);
  console.log('Filters Applied:', hasFilters ? '✅' : '❌');
  
  return hasFilters;
}

/**
 * Test 5: Performance test - multiple images
 */
export async function testPerformance(canvas) {
  if (!canvas) {
    console.error('Test 5: Canvas not provided');
    return false;
  }
  
  const { getPixiApp } = require('./pixiLayer');
  const pixiApp = getPixiApp();
  
  if (!pixiApp) {
    console.error('Test 5: Pixi not initialized');
    return false;
  }
  
  console.log('Test 5: Performance Test');
  
  const objects = canvas.getObjects();
  const imageCount = objects.filter(obj => obj.type === 'image').length;
  
  // Measure frame rate
  let frameCount = 0;
  const startTime = performance.now();
  
  const measureFPS = () => {
    frameCount++;
    if (frameCount < 60) {
      requestAnimationFrame(measureFPS);
    } else {
      const endTime = performance.now();
      const fps = (60 / (endTime - startTime)) * 1000;
      
      console.log('FPS:', fps.toFixed(2));
      console.log('Image Count:', imageCount);
      console.log('Performance:', fps > 50 ? '✅ Good' : fps > 30 ? '⚠️ Acceptable' : '❌ Poor');
    }
  };
  
  requestAnimationFrame(measureFPS);
  
  return true;
}

/**
 * Run all tests
 */
export async function runAllTests(canvas, activeObject) {
  console.log('=== Running All Pixi Integration Tests ===\n');
  
  const results = {
    initialization: testPixiInitialization(),
    viewportSync: testViewportSync(canvas),
    spriteCreation: testSpriteCreation(canvas),
    filterApplication: testFilterApplication(activeObject),
    performance: await testPerformance(canvas)
  };
  
  console.log('\n=== Test Results ===');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${test}:`, passed ? '✅ PASS' : '❌ FAIL');
  });
  
  const allPassed = Object.values(results).every(r => r);
  console.log('\nOverall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  return results;
}

/**
 * Example usage in browser console:
 * 
 * // Get canvas from React context (if available globally)
 * const canvas = window.editorCanvas; // You may need to expose this
 * const activeObject = canvas?.getActiveObject();
 * 
 * // Run tests
 * const { runAllTests } = require('./utils/pixi-integration-test');
 * runAllTests(canvas, activeObject);
 */

