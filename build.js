// build.js - بناء الموقع للنشر
const fs = require('fs');
const path = require('path');

console.log('🚀 بدء بناء موقع ترحال السودان...');

// إنشاء مجلد dist إذا لم يكن موجوداً
const distDir = './dist';
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// نسخ الملفات الثابتة
const copyFiles = [
  { from: 'index.html', to: 'index.html' },
  { from: 'register.html', to: 'register.html' },
  { from: 'login.html', to: 'login.html' },
  { from: 'css', to: 'css' },
  { from: 'js', to: 'js' },
  { from: 'assets', to: 'assets' }
];

copyFiles.forEach(item => {
  const source = path.join(__dirname, item.from);
  const dest = path.join(__dirname, distDir, item.to);
  
  if (fs.existsSync(source)) {
    if (fs.statSync(source).isDirectory()) {
      copyDir(source, dest);
    } else {
      fs.copyFileSync(source, dest);
    }
    console.log(`✅ تم نسخ: ${item.from}`);
  } else {
    console.log(`⚠️  ملف غير موجود: ${item.from}`);
  }
});

// إنشاء ملف robots.txt
const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://travel-sudan.vercel.app/sitemap.xml`;

fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt);

// إنشاء ملف sitemap.xml
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://travel-sudan.vercel.app/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://travel-sudan.vercel.app/register.html</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://travel-sudan.vercel.app/login.html</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);

// نسخ ملف vercel.json
fs.copyFileSync('vercel.json', path.join(distDir, 'vercel.json'));

console.log('✅ تم بناء الموقع بنجاح في مجلد dist/');

// دالة مساعدة لنسخ المجلدات
function copyDir(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  files.forEach(file => {
    const srcFile = path.join(source, file);
    const destFile = path.join(target, file);
    
    if (fs.statSync(srcFile).isDirectory()) {
      copyDir(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}