// client/src/reportWebVitals.js

import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

/**
 * With newer web-vitals, we use onCLS, onFID, etc., not the old getCLS getFID, etc.
 */
function reportWebVitals(onPerfEntry) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry);
    onFID(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
}

export default reportWebVitals;
