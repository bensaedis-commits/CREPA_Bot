/**
 * CREPA Bot - Quaxly Restart Helper
 * يقوم بعمل Kill + Start للسيرفر (Restart خربانة حسب طلبك)
 * الاستخدام: node scripts/quaxly-restart.js
 */

const https = require('https');

const CONFIG = {
  panelUrl: 'panel.quaxly.com',
  serverId: '6f4e4fbd',
  // استخدم Private Key - هو نفسه الذي استعملناه للـ API
  apiKey: 'fp_3ea74903882b758e9dd284dfbc018ce0843fc3a5459bb4df1f949a5246222827',
};

function apiRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: CONFIG.panelUrl,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Accept': 'application/json',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

async function killAndStart() {
  console.log('[Quaxly] Sending Kill signal...');
  const kill = await apiRequest(`/api/user/servers/${CONFIG.serverId}/power/kill`, 'POST');
  console.log(`[Quaxly] Kill: ${kill.status} - ${kill.data.message || JSON.stringify(kill.data).slice(0, 200)}`);

  console.log('[Quaxly] Waiting 5s...');
  await new Promise((r) => setTimeout(r, 5000));

  console.log('[Quaxly] Sending Start signal...');
  const start = await apiRequest(`/api/user/servers/${CONFIG.serverId}/power/start`, 'POST');
  console.log(`[Quaxly] Start: ${start.status} - ${start.data.message || JSON.stringify(start.data).slice(0, 200)}`);

  if (kill.status === 200 && start.status === 200) {
    console.log('\n[SUCCESS] تم Kill + Start بنجاح! السيرفر سيسحب التحديث من GitHub تلقائياً (AUTO_UPDATE=1)');
    console.log('راقب اللوغ من: https://panel.quaxly.com/server/6f4e4fbd');
  } else {
    console.log('\n[ERROR] فشل أحد الأوامر، تحقق من API Key والـ Server ID');
  }
}

killAndStart().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});
