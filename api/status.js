// api/status.js - التحقق من حالة الخدمات
export default async function handler(req, res) {
  try {
    const status = {
      system: 'ترحال السودان',
      status: 'operational',
      timestamp: new Date().toISOString(),
      services: {
        website: 'operational',
        database: 'checking',
        payments: 'checking',
        maps: 'checking',
        sms: 'checking'
      },
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    };

    // يمكنك إضافة فحوصات للخدمات هنا
    
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      status: 'degraded'
    });
  }
}