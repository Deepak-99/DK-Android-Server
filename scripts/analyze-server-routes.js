/**
 * Server Routes Analysis Script
 * Analyzes all routes in the server and generates a comprehensive report
 */

const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '..', 'routes');
const outputFile = path.join(__dirname, '..', 'server-routes-analysis.json');

console.log('🔍 DK Hawkshaw - Server Routes Analysis\n');
console.log('==========================================\n');

const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
const allRoutes = [];
const routesByModule = {};
const routesByMethod = { GET: [], POST: [], PUT: [], DELETE: [], PATCH: [] };

console.log(`Found ${routeFiles.length} route files\n`);

routeFiles.forEach(file => {
  const moduleName = file.replace('.js', '');
  console.log(`📁 Analyzing ${file}...`);
  
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  
  // Extract routes using regex patterns
  const routePatterns = [
    /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/gi,
    /app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/gi
  ];
  
  const moduleRoutes = [];
  
  routePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const path = match[2];
      
      // Extract middleware (basic detection)
      const lineStart = content.lastIndexOf('\n', match.index);
      const lineEnd = content.indexOf('\n', match.index);
      const line = content.substring(lineStart, lineEnd);
      
      const hasAuth = line.includes('authenticateToken') || line.includes('authenticateDevice');
      const requiresAdmin = line.includes('requireAdmin');
      const hasValidation = line.includes('body(') || line.includes('param(') || line.includes('query(');
      
      const route = {
        method,
        path,
        fullPath: `/api/${moduleName}${path}`,
        module: moduleName,
        authentication: hasAuth ? (requiresAdmin ? 'admin' : 'authenticated') : 'public',
        validation: hasValidation,
        file
      };
      
      moduleRoutes.push(route);
      allRoutes.push(route);
      
      if (routesByMethod[method]) {
        routesByMethod[method].push(route);
      }
    }
  });
  
  routesByModule[moduleName] = moduleRoutes;
  console.log(`   Found ${moduleRoutes.length} routes`);
});

console.log('\n📊 ROUTE SUMMARY');
console.log('================\n');
console.log(`Total Routes: ${allRoutes.length}`);
console.log(`Route Modules: ${routeFiles.length}`);
console.log(`\nBy HTTP Method:`);
Object.entries(routesByMethod).forEach(([method, routes]) => {
  if (routes.length > 0) {
    console.log(`  ${method}: ${routes.length} routes`);
  }
});

console.log(`\nBy Authentication:`);
const authStats = {
  public: allRoutes.filter(r => r.authentication === 'public').length,
  authenticated: allRoutes.filter(r => r.authentication === 'authenticated').length,
  admin: allRoutes.filter(r => r.authentication === 'admin').length
};
console.log(`  Public: ${authStats.public} routes`);
console.log(`  Authenticated: ${authStats.authenticated} routes`);
console.log(`  Admin Only: ${authStats.admin} routes`);

console.log('\n\n📋 ROUTES BY MODULE');
console.log('===================\n');

Object.entries(routesByModule).forEach(([module, routes]) => {
  console.log(`\n📁 ${module.toUpperCase()} (${routes.length} routes)`);
  console.log('─'.repeat(50));
  
  routes
    .sort((a, b) => {
      const methodOrder = { GET: 0, POST: 1, PUT: 2, PATCH: 3, DELETE: 4 };
      return methodOrder[a.method] - methodOrder[b.method];
    })
    .forEach(route => {
      const authIcon = route.authentication === 'admin' ? '🔒' : 
                       route.authentication === 'authenticated' ? '🔐' : '🌐';
      const validIcon = route.validation ? '✓' : ' ';
      console.log(`  ${authIcon} ${route.method.padEnd(6)} ${route.fullPath} [${validIcon}]`);
    });
});

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalRoutes: allRoutes.length,
    totalModules: routeFiles.length,
    byMethod: Object.fromEntries(
      Object.entries(routesByMethod).map(([k, v]) => [k, v.length])
    ),
    byAuthentication: authStats
  },
  modules: routesByModule,
  allRoutes: allRoutes.sort((a, b) => a.fullPath.localeCompare(b.fullPath))
};

fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));

console.log('\n\n✅ Analysis complete!');
console.log(`📄 Report saved to: server-routes-analysis.json\n`);

// Generate Markdown documentation
const mdContent = `# DK Hawkshaw Server - API Routes Documentation

**Generated:** ${new Date().toISOString()}  
**Total Routes:** ${allRoutes.length}

## Summary

- **Total Modules:** ${routeFiles.length}
- **Total Routes:** ${allRoutes.length}
- **Public Routes:** ${authStats.public}
- **Authenticated Routes:** ${authStats.authenticated}
- **Admin-Only Routes:** ${authStats.admin}

## Routes by HTTP Method

${Object.entries(routesByMethod)
  .filter(([_, routes]) => routes.length > 0)
  .map(([method, routes]) => `- **${method}:** ${routes.length} routes`)
  .join('\n')}

## API Endpoints

${Object.entries(routesByModule)
  .map(([module, routes]) => `
### ${module.charAt(0).toUpperCase() + module.slice(1)} Module

${routes
  .sort((a, b) => {
    const methodOrder = { GET: 0, POST: 1, PUT: 2, PATCH: 3, DELETE: 4 };
    return methodOrder[a.method] - methodOrder[b.method];
  })
  .map(route => {
    const authBadge = route.authentication === 'admin' ? '🔒 Admin' : 
                      route.authentication === 'authenticated' ? '🔐 Auth' : '🌐 Public';
    const valBadge = route.validation ? '✓ Validated' : '';
    return `#### \`${route.method}\` ${route.fullPath}

- **Auth:** ${authBadge}
- **Validation:** ${valBadge}
- **File:** \`routes/${route.file}\`
`;
  }).join('\n')}
`)
  .join('\n')}

## Legend

- 🌐 **Public** - No authentication required
- 🔐 **Auth** - Requires valid authentication token
- 🔒 **Admin** - Requires admin role
- ✓ **Validated** - Has input validation middleware

---

*Generated by analyze-server-routes.js*
`;

fs.writeFileSync('API_ROUTES_DOCUMENTATION.md', mdContent);
console.log(`📄 Markdown documentation saved to: API_ROUTES_DOCUMENTATION.md\n`);
