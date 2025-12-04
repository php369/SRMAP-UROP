const fs = require('fs');
const path = require('path');

console.log('🔧 Preparing web app for deployment...');

// Remove workspace config from parent package.json
const parentPkg = path.join(__dirname, '../../package.json');
if (fs.existsSync(parentPkg)) {
  const pkg = JSON.parse(fs.readFileSync(parentPkg, 'utf8'));
  if (pkg.workspaces) {
    delete pkg.workspaces;
    fs.writeFileSync(parentPkg, JSON.stringify(pkg, null, 2));
    console.log('✅ Removed workspace config from parent');
  }
}

// Remove pnpm-workspace.yaml
const workspaceYaml = path.join(__dirname, '../../pnpm-workspace.yaml');
if (fs.existsSync(workspaceYaml)) {
  fs.unlinkSync(workspaceYaml);
  console.log('✅ Removed pnpm-workspace.yaml');
}

// Remove pnpm-lock.yaml to prevent pnpm detection
const pnpmLock = path.join(__dirname, '../../pnpm-lock.yaml');
if (fs.existsSync(pnpmLock)) {
  fs.unlinkSync(pnpmLock);
  console.log('✅ Removed pnpm-lock.yaml');
}

// Ensure local package.json has no workspace dependencies
const localPkg = path.join(__dirname, 'package.json');
if (fs.existsSync(localPkg)) {
  const pkg = JSON.parse(fs.readFileSync(localPkg, 'utf8'));
  let modified = false;

  ['dependencies', 'devDependencies'].forEach((depType) => {
    if (pkg[depType]) {
      Object.keys(pkg[depType]).forEach((dep) => {
        if (pkg[depType][dep].startsWith('workspace:')) {
          console.log(`⚠️  Found workspace dependency: ${dep}`);
          delete pkg[depType][dep];
          modified = true;
        }
      });
    }
  });

  if (modified) {
    fs.writeFileSync(localPkg, JSON.stringify(pkg, null, 2));
    console.log('✅ Cleaned workspace dependencies from package.json');
  }
}

// Fix tsconfig.json to remove workspace extends
const tsconfig = path.join(__dirname, 'tsconfig.json');
if (fs.existsSync(tsconfig)) {
  const config = JSON.parse(fs.readFileSync(tsconfig, 'utf8'));
  if (config.extends && config.extends.includes('@srm-portal/config')) {
    delete config.extends;
    fs.writeFileSync(tsconfig, JSON.stringify(config, null, 2));
    console.log('✅ Removed workspace extends from tsconfig.json');
  }
}

// Fix tailwind.config.js to remove workspace imports
const tailwindConfig = path.join(__dirname, 'tailwind.config.js');
if (fs.existsSync(tailwindConfig)) {
  let content = fs.readFileSync(tailwindConfig, 'utf8');
  if (content.includes('@srm-portal/config')) {
    // Replace the workspace import with a standalone config
    content = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;
    fs.writeFileSync(tailwindConfig, content);
    console.log('✅ Removed workspace imports from tailwind.config.js');
  }
}

console.log('✅ Ready for deployment!');
