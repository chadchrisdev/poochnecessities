import { Platform } from 'react-native';

// Colors for avatar backgrounds
const AVATAR_COLORS = [
  '#4C6BF5', // Blue
  '#4CAF50', // Green
  '#9C27B0', // Purple
  '#FF5722', // Orange
  '#2196F3', // Light Blue
  '#E91E63'  // Pink
];

/**
 * Creates an SVG avatar with the user's first initial
 * @param {string} name - The user's full name
 * @returns {string} - SVG string of the avatar
 */
export const createInitialAvatar = (name) => {
  if (!name || typeof name !== 'string') {
    name = '?'; // Default for empty names
  }
  
  // Get first initial
  const initial = name.trim().charAt(0).toUpperCase();
  
  // Generate a consistent color based on the initial
  const colorIndex = initial.charCodeAt(0) % AVATAR_COLORS.length;
  const backgroundColor = AVATAR_COLORS[colorIndex];
  const strokeColor = adjustColor(backgroundColor, -30); // Darker version for stroke
  
  // Create SVG
  return `
<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="60" cy="60" r="58" fill="${backgroundColor}" stroke="${strokeColor}" stroke-width="4"/>
  
  <!-- Initial letter -->
  <text x="60" y="78" font-family="Arial, sans-serif" font-size="65" font-weight="bold" fill="white" text-anchor="middle">${initial}</text>
</svg>
`;
};

/**
 * Base64 encoding function for React Native
 * @param {string} str - String to encode
 * @returns {string} - Base64 encoded string
 */
const toBase64 = (str) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  
  // Convert string to UTF-8
  const utf8Str = encodeURIComponent(str).replace(
    /%([0-9A-F]{2})/g,
    (match, p1) => String.fromCharCode('0x' + p1)
  );
  
  let i = 0;
  while (i < utf8Str.length) {
    const char1 = utf8Str.charCodeAt(i++);
    const char2 = i < utf8Str.length ? utf8Str.charCodeAt(i++) : 0;
    const char3 = i < utf8Str.length ? utf8Str.charCodeAt(i++) : 0;
    
    const triplet = (char1 << 16) | (char2 << 8) | char3;
    
    const index1 = (triplet >> 18) & 0x3F;
    const index2 = (triplet >> 12) & 0x3F;
    const index3 = (triplet >> 6) & 0x3F;
    const index4 = triplet & 0x3F;
    
    output += characters.charAt(index1) + characters.charAt(index2) +
              characters.charAt(index3) + characters.charAt(index4);
  }
  
  // Handle padding
  const paddingLength = (3 - (utf8Str.length % 3)) % 3;
  let padding = '';
  for (let i = 0; i < paddingLength; i++) {
    padding += '=';
    output = output.slice(0, -1);
  }
  
  return output + padding;
};

/**
 * Converts SVG string to a data URI for use in image sources
 * @param {string} svgString - The SVG content 
 * @returns {string} - Data URI for the SVG
 */
export const svgToDataUri = (svgString) => {
  if (Platform.OS === 'web') {
    // In web environment, we can use btoa
    return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgString)))}`;
  } else {
    // For React Native, generate a hard-coded initial circle image URL based on the name
    // This is much more reliable than trying to render SVG data URIs in React Native
    const svgContent = svgString.trim();
    const initial = svgContent.match(/<text[^>]*>(.*?)<\/text>/i)?.[1] || '?';
    const bgColor = svgContent.match(/fill="(#[0-9A-Fa-f]{6})"/i)?.[1] || '#4C6BF5';
    
    // Use a remote service to generate the avatar image
    // This is more reliable than SVG data URIs in React Native
    return `https://ui-avatars.com/api/?name=${initial}&background=${bgColor.substring(1)}&color=fff&size=120&bold=true&font-size=0.5`;
  }
};

/**
 * Adjust a hex color by the given percent
 * @param {string} color - The hex color to adjust
 * @param {number} percent - Percent to adjust (-100 to 100)
 * @returns {string} - Adjusted hex color
 */
function adjustColor(color, percent) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = R > 0 ? R : 0;
  G = G > 0 ? G : 0;
  B = B > 0 ? B : 0;

  const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
  const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
  const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

  return "#" + RR + GG + BB;
} 