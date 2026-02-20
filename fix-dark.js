const fs = require('fs');
const files = [
    'frontend/src/pages/Dashboard.tsx',
    'frontend/src/pages/AffiliateDashboard.tsx',
    'frontend/src/pages/DownlineManage.tsx',
    ...fs.readdirSync('frontend/src/pages/admin').map(f => 'frontend/src/pages/admin/' + f)
];
files.forEach(file => {
    if (!file.endsWith('.tsx')) return;
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/bg-white/g, 'dark-card');
    content = content.replace(/text-gray-900/g, 'text-white');
    content = content.replace(/text-gray-800/g, 'text-gray-200');
    content = content.replace(/text-gray-700/g, 'text-gray-300');
    content = content.replace(/bg-gray-50/g, 'bg-[#131210]');
    content = content.replace(/bg-gray-100/g, 'bg-white/5');
    content = content.replace(/border-gray-100/g, 'border-[var(--color-border)]');
    content = content.replace(/border-gray-200/g, 'border-[var(--color-border)]');
    content = content.replace(/divide-gray-50/g, 'divide-white/10');
    content = content.replace(/divide-gray-100/g, 'divide-white/10');
    content = content.replace(/divide-gray-200/g, 'divide-white/10');
    content = content.replace(/backgroundColor: 'white'/g, 'backgroundColor: \'var(--color-bg-card)\', border: \'1px solid var(--color-border)\'');
    content = content.replace(/border-b\b(?! border-\[)/g, 'border-b border-[var(--color-border)]');
    fs.writeFileSync(file, content);
});
console.log('Fixed dark mode in ' + files.length + ' files');
