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

console.log('✅ Ready for deployment!');
