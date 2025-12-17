// build.js - بناء الموقع للنشر
const fs = require('fs');
const path = require('path');

console.log('🚀 بدء بناء موقع ترحال السودان...');

const distDir = './dist';
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// قائمة الملفات والمجلدات المراد نسخها
const copyFiles = [
  { from: 'index.html', to: 'index.html' },
  { from: 'init.html', to: 'init.html' }, // تم الإضافة لضمان وجود صفحة التهيئة
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
    console.log(`⚠️ ملف غير موجود: ${item.from}`);
  }
});

// دالة مساعدة لنسخ المجلدات
function copyDir(source, target) {
  if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
  const files = fs.readdirSync(source);
  files.forEach(file => {
    const srcFile = path.join(source, file);
    const destFile = path.join(target, file);
    if (fs.statSync(srcFile).isDirectory()) copyDir(srcFile, destFile);
    else fs.copyFileSync(srcFile, destFile);
  });
}

console.log('✅ تم بناء الموقع بنجاح في مجلد dist/');
