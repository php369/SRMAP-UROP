#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Bundle Analysis Script
 * Analyzes the production build bundle and provides optimization recommendations
 */

console.log('🔍 Starting bundle analysis...\n');

// Build the project first
console.log('📦 Building production bundle...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Analyze the dist directory
const distPath = path.join(__dirname, '../dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Dist directory not found. Make sure the build completed successfully.');
  process.exit(1);
}

console.log('\n📊 Bundle Analysis Results:');
console.log('=' .repeat(50));

// Get file sizes
const files = getAllFiles(distPath);
const analysis = analyzeFiles(files);

// Display results
displayResults(analysis);

// Provide recommendations
provideRecommendations(analysis);

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

/**
 * Analyze files and categorize them
 */
function analyzeFiles(files) {
  const analysis = {
    total: { count: 0, size: 0 },
    javascript: { count: 0, size: 0, files: [] },
    css: { count: 0, size: 0, files: [] },
    images: { count: 0, size: 0, files: [] },
    fonts: { count: 0, size: 0, files: [] },
    other: { count: 0, size: 0, files: [] },
  };

  files.forEach(filePath => {
    const stats = fs.statSync(filePath);
    const size = stats.size;
    const ext = path.extname(filePath).toLowerCase();
    const relativePath = path.relative(path.join(__dirname, '../dist'), filePath);

    analysis.total.count++;
    analysis.total.size += size;

    const fileInfo = { path: relativePath, size };

    if (['.js', '.mjs', '.jsx', '.ts', '.tsx'].includes(ext)) {
      analysis.javascript.count++;
      analysis.javascript.size += size;
      analysis.javascript.files.push(fileInfo);
    } else if (['.css', '.scss', '.sass', '.less'].includes(ext)) {
      analysis.css.count++;
      analysis.css.size += size;
      analysis.css.files.push(fileInfo);
    } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'].includes(ext)) {
      analysis.images.count++;
      analysis.images.size += size;
      analysis.images.files.push(fileInfo);
    } else if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(ext)) {
      analysis.fonts.count++;
      analysis.fonts.size += size;
      analysis.fonts.files.push(fileInfo);
    } else {
      analysis.other.count++;
      analysis.other.size += size;
      analysis.other.files.push(fileInfo);
    }
  });

  // Sort files by size (largest first)
  Object.keys(analysis).forEach(key => {
    if (analysis[key].files) {
      analysis[key].files.sort((a, b) => b.size - a.size);
    }
  });

  return analysis;
}

/**
 * Display analysis results
 */
function displayResults(analysis) {
  console.log(`📁 Total Files: ${analysis.total.count}`);
  console.log(`📏 Total Size: ${formatBytes(analysis.total.size)}\n`);

  // Display by category
  const categories = [
    { name: 'JavaScript', key: 'javascript', icon: '📜' },
    { name: 'CSS', key: 'css', icon: '🎨' },
    { name: 'Images', key: 'images', icon: '🖼️' },
    { name: 'Fonts', key: 'fonts', icon: '🔤' },
    { name: 'Other', key: 'other', icon: '📄' },
  ];

  categories.forEach(category => {
    const data = analysis[category.key];
    if (data.count > 0) {
      console.log(`${category.icon} ${category.name}:`);
      console.log(`   Files: ${data.count}`);
      console.log(`   Size: ${formatBytes(data.size)} (${((data.size / analysis.total.size) * 100).toFixed(1)}%)`);
      
      // Show largest files in category
      if (data.files.length > 0) {
        console.log('   Largest files:');
        data.files.slice(0, 3).forEach(file => {
          console.log(`     - ${file.path}: ${formatBytes(file.size)}`);
        });
      }
      console.log('');
    }
  });
}

/**
 * Provide optimization recommendations
 */
function provideRecommendations(analysis) {
  console.log('💡 Optimization Recommendations:');
  console.log('=' .repeat(50));

  const recommendations = [];

  // JavaScript recommendations
  if (analysis.javascript.size > 500 * 1024) { // 500KB
    recommendations.push('🔧 JavaScript bundle is large (>500KB). Consider:');
    recommendations.push('   - Code splitting with dynamic imports');
    recommendations.push('   - Tree shaking unused code');
    recommendations.push('   - Using smaller alternative libraries');
  }

  // CSS recommendations
  if (analysis.css.size > 100 * 1024) { // 100KB
    recommendations.push('🎨 CSS bundle is large (>100KB). Consider:');
    recommendations.push('   - Removing unused CSS with PurgeCSS');
    recommendations.push('   - Using CSS-in-JS for component-specific styles');
    recommendations.push('   - Minifying CSS further');
  }

  // Image recommendations
  if (analysis.images.size > 1024 * 1024) { // 1MB
    recommendations.push('🖼️ Images are large (>1MB). Consider:');
    recommendations.push('   - Using WebP or AVIF formats');
    recommendations.push('   - Implementing lazy loading');
    recommendations.push('   - Optimizing image compression');
    recommendations.push('   - Using responsive images with srcset');
  }

  // Font recommendations
  if (analysis.fonts.size > 200 * 1024) { // 200KB
    recommendations.push('🔤 Fonts are large (>200KB). Consider:');
    recommendations.push('   - Using font-display: swap');
    recommendations.push('   - Subsetting fonts to include only needed characters');
    recommendations.push('   - Using system fonts as fallbacks');
  }

  // General recommendations
  if (analysis.total.size > 2 * 1024 * 1024) { // 2MB
    recommendations.push('⚡ Total bundle is large (>2MB). Consider:');
    recommendations.push('   - Implementing service worker caching');
    recommendations.push('   - Using CDN for static assets');
    recommendations.push('   - Enabling gzip/brotli compression');
  }

  if (recommendations.length === 0) {
    console.log('✅ Bundle size looks good! No major optimizations needed.');
  } else {
    recommendations.forEach(rec => console.log(rec));
  }

  console.log('\n📈 Performance Budget Status:');
  console.log('=' .repeat(30));
  
  const budgets = [
    { name: 'JavaScript', current: analysis.javascript.size, budget: 500 * 1024 },
    { name: 'CSS', current: analysis.css.size, budget: 100 * 1024 },
    { name: 'Images', current: analysis.images.size, budget: 1024 * 1024 },
    { name: 'Total', current: analysis.total.size, budget: 2 * 1024 * 1024 },
  ];

  budgets.forEach(budget => {
    const percentage = (budget.current / budget.budget) * 100;
    const status = percentage <= 100 ? '✅' : '❌';
    console.log(`${status} ${budget.name}: ${formatBytes(budget.current)} / ${formatBytes(budget.budget)} (${percentage.toFixed(1)}%)`);
  });
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

console.log('\n🎉 Bundle analysis complete!');
console.log('Run this script after each build to monitor bundle size changes.');