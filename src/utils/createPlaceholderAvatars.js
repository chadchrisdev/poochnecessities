// Utility to create placeholder initial avatars as SVG strings
// These can be converted to PNGs using online tools or directly rendered in React Native

// Initial Letter Avatar 1 - Blue background (avatar1)
export const initialAvatar1SVG = `
<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="60" cy="60" r="58" fill="#4C6BF5" stroke="#3A54C5" stroke-width="4"/>
  
  <!-- Initial letter -->
  <text x="60" y="78" font-family="Arial, sans-serif" font-size="65" font-weight="bold" fill="white" text-anchor="middle">A</text>
</svg>
`;

// Initial Letter Avatar 2 - Green background (avatar2)
export const initialAvatar2SVG = `
<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="60" cy="60" r="58" fill="#4CAF50" stroke="#3A8A3F" stroke-width="4"/>
  
  <!-- Initial letter -->
  <text x="60" y="78" font-family="Arial, sans-serif" font-size="65" font-weight="bold" fill="white" text-anchor="middle">B</text>
</svg>
`;

// Initial Letter Avatar 3 - Purple background (avatar3)
export const initialAvatar3SVG = `
<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="60" cy="60" r="58" fill="#9C27B0" stroke="#7A1E8C" stroke-width="4"/>
  
  <!-- Initial letter -->
  <text x="60" y="78" font-family="Arial, sans-serif" font-size="65" font-weight="bold" fill="white" text-anchor="middle">C</text>
</svg>
`;

// HTML helper to test the SVGs in a browser
export const htmlForTesting = `
<!DOCTYPE html>
<html>
<head>
  <title>Initial Letter Avatars</title>
  <style>
    .avatar-container {
      display: flex;
      justify-content: space-around;
      margin: 50px;
    }
    .avatar {
      border: 2px solid #ccc;
      border-radius: 50%;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="avatar-container">
    <div class="avatar" id="avatar1"></div>
    <div class="avatar" id="avatar2"></div>
    <div class="avatar" id="avatar3"></div>
  </div>

  <script>
    document.getElementById('avatar1').innerHTML = \`${initialAvatar1SVG}\`;
    document.getElementById('avatar2').innerHTML = \`${initialAvatar2SVG}\`;
    document.getElementById('avatar3').innerHTML = \`${initialAvatar3SVG}\`;
  </script>
</body>
</html>
`;

// Instructions for generating PNGs:
/*
1. Create an HTML file with the content from htmlForTesting
2. Open the HTML file in a browser
3. For each avatar:
   - Right-click on the avatar
   - Select "Save image as..."
   - Save it as assets/avatars/avatar1.png, avatar2.png, or avatar3.png

Alternatively, use an online SVG to PNG converter tool:
1. Copy the SVG code for each avatar
2. Go to https://svgtopng.com/ or a similar tool
3. Paste the SVG code
4. Download the PNG file
5. Save it to the assets/avatars directory
*/ 