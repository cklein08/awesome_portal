import {
  convertHtmlListToArray, fetchSpreadsheetData, getBlockKeyValues, stripHtmlAndNewlines,
} from '../../scripts/scripts.js';

export default async function decorate(block) {
  // Get the block key-value pairs
  const blockObj = getBlockKeyValues(block);

  // Get configs spreadsheets
  const configs = await fetchSpreadsheetData('configs');
  const restrictedBrands = configs?.['shared-restricted-brands']?.data || configs?.data;

  // Clear the block content
  block.textContent = '';

  // Create container div for the React app
  const reactContainer = document.createElement('div');
  reactContainer.id = 'assets-search-container';
  reactContainer.className = 'assets-search-container';

  // Set container styles for natural page integration
  reactContainer.style.width = '100%';
  // Remove height: 100vh to allow natural scrolling
  reactContainer.style.minHeight = '600px';
  reactContainer.style.position = 'relative';

  // Create root div for React mounting (same ID as used in main.tsx)
  const reactRoot = document.createElement('div');
  reactRoot.id = 'root';
  reactRoot.className = 'assets-search-root';
  reactContainer.appendChild(reactRoot);

  // Append container to block
  block.append(reactContainer);

  // Configure external parameters for block integration
  window.assetsDashboardConfig = window.assetsDashboardConfig || {};

  // Helper function to safely parse JSON - returns empty object if not valid
  const safeJsonParse = (jsonString) => {
    if (!jsonString || jsonString.trim() === '') {
      return {};
    }
    try {
      return JSON.parse(stripHtmlAndNewlines(jsonString));
    } catch (error) {
      console.warn('Failed to parse JSON, using empty object:', error);
      return {};
    }
  };

  /** @type {import('../../assetsDashboard-react/src/types/index.js').ExternalParams} */
  window.assetsDashboardConfig.externalParams = {
    isBlockIntegration: true,
    accordionTitle: blockObj.accordionTitle || '',
    accordionContent: blockObj.accordionContent || '',
    hitsPerPage: stripHtmlAndNewlines(blockObj.hitsPerPage) || '',
    excFacets: safeJsonParse(blockObj.excFacets),
    restrictedBrands,
    presetFilters: blockObj.presetFilters ? convertHtmlListToArray(blockObj.presetFilters) : [],
    ...(window.assetsDashboardConfig.externalParams || {}),
  };

  // Load the built React app
  loadReactApp(reactRoot);
}

function loadReactApp(reactRoot) {
  try {
    // Check if we already have the built assets
    const basePath = '/tools/assets-browser';

    // First, load the CSS
    loadCSS(`${basePath}/assets/index.css`);

    // Then load the JavaScript bundle
    loadJS(`${basePath}/assets/index.js`)
      .catch((error) => {
        console.error('Failed to load React app:', error);
      });
  } catch (error) {
    console.error('Error initializing React app:', error);
  }
}

function loadCSS(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.onerror = () => console.warn(`Failed to load CSS: ${href}`);
  document.head.appendChild(link);
}

function loadJS(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
