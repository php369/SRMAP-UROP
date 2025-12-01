#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📊 Analyzing bundle size...');

const distPath = path.join(__dirname, '../dist');
const assetsPath = path.join(distPath, 'assets');

if (!fs.existsSync(distPath)) {
  console.error('❌ Build directory not found. Run `npm run build` first.');
  process.exit(1);
}

// Get file sizes
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2); // KB
}

function analyzeDirectory(dirPath, prefix = '') {
  const files = fs.readdirSync(dirPath);
  const results = [];

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results.push(...analyzeDirectory(filePath, `${prefix}${file}/`));
    } else {
      const size = getFileSize(filePath);
      results.push({
        name: `${prefix}${file}`,
        size: parseFloat(size),
        path: filePath
      });
    }
  });

  return results;
}

try {
  const allFiles = analyzeDirectory(distPath);
  
  // Sort by size (largest first)
  allFiles.sort((a, b) => b.size - a.size);

  // Calculate totals
  const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);
  const jsFiles = allFiles.filter(f => f.name.endsWith('.js'));
  const cssFiles = allFiles.filter(f => f.name.endsWith('.css'));
  const assetFiles = allFiles.filter(f => !f.name.endsWith('.js') && !f.name.endsWith('.css') && !f.name.endsWith('.html'));

  const jsSize = jsFiles.reduce((sum, file) => sum + file.size, 0);
  const cssSize = cssFiles.reduce((sum, file) => sum + file.size, 0);
  const assetSize = assetFiles.reduce((sum, file) => sum + file.size, 0);

  console.log('\n📦 Bundle Analysis Results:');
  console.log('================================');
  console.log(`Total Size: ${totalSize.toFixed(2)} KB`);
  console.log(`JavaScript: ${jsSize.toFixed(2)} KB (${((jsSize/totalSize)*100).toFixed(1)}%)`);
  console.log(`CSS: ${cssSize.toFixed(2)} KB (${((cssSize/totalSize)*100).toFixed(1)}%)`);
  console.log(`Assets: ${assetSize.toFixed(2)} KB (${((assetSize/totalSize)*100).toFixed(1)}%)`);

  console.log('\n🔍 Largest Files:');
  console.log('==================');
  allFiles.slice(0, 10).forEach((file, index) => {
    console.log(`${index + 1}. ${file.name}: ${file.size} KB`);
  });

  // Performance budget checks
  const budgets = {
    total: 2000, // 2MB
    js: 1000,    // 1MB
    css: 200,    // 200KB
  };

  console.log('\n⚡ Performance Budget:');
  console.log('======================');
  
  const checks = [
    { name: 'Total Size', actual: totalSize, budget: budgets.total },
    { name: 'JavaScript', actual: jsSize, budget: budgets.js },
    { name: 'CSS', actual: cssSize, budget: budgets.css }
  ];

  let budgetPassed = true;
  checks.forEach(check => {
    const status = check.actual <= check.budget ? '✅' : '❌';
    const percentage = ((check.actual / check.budget) * 100).toFixed(1);
    console.log(`${status} ${check.name}: ${check.actual.toFixed(2)} KB / ${check.budget} KB (${percentage}%)`);
    
    if (check.actual > check.budget) {
      budgetPassed = false;
    }
  });

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalSize: totalSize,
    breakdown: {
      javascript: jsSize,
      css: cssSize,
      assets: assetSize
    },
    budgetChecks: checks,
    budgetPassed,
    largestFiles: allFiles.slice(0, 10)
  };

  fs.writeFileSync(
    path.join(__dirname, '../bundle-analysis.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n📄 Report saved to bundle-analysis.json');

  if (!budgetPassed) {
    console.log('\n⚠️  Performance budget exceeded!');
    if (process.env.CI) {
      process.exit(1);
    }
  } else {
    console.log('\n🎉 All performance budgets passed!');
  }

} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message);
  process.exit(1);
}