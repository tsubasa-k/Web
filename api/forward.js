export default async function handler(req, res) {
    // 設定 CORS 標頭
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // 收集伺服器端可獲得的資訊
        const serverInfo = {
            // IP 相關資訊
            clientIP: getClientIP(req),
            forwardedIPs: req.headers['x-forwarded-for'] || '',
            realIP: req.headers['x-real-ip'] || '',
            
            // 基本請求標頭資訊
            userAgent: req.headers['user-agent'] || 'unknown',
            referer: req.headers['referer'] || req.headers['referrer'] || 'none',
            origin: req.headers['origin'] || 'none',
            host: req.headers['host'] || 'unknown',
            acceptLanguage: req.headers['accept-language'] || 'unknown',
            
            // 代理相關
            via: req.headers['via'] || 'none',
            xForwardedProto: req.headers['x-forwarded-proto'] || 'unknown',
            
            // 伺服器時間
            serverTimestamp: new Date().toISOString(),
            requestMethod: req.method
        };

        // 合併客戶端傳來的資訊
        let clientInfo = {};
        if (req.method === 'POST' && req.body) {
            try {
                clientInfo = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            } catch (e) {
                console.log('解析客戶端資料失敗:', e);
            }
        }

        const completeInfo = {
            ...serverInfo,
            ...clientInfo
        };

        // Google Apps Script URL
        const gscriptURL = "https://script.google.com/macros/s/AKfycbyM9jZAnb1q-4lpv8xXZcJzARjWIzbtC-qr7uYxPI0EiL09hkZdmNCVUbnaST4NECh0/exec";
        
        // 準備要傳送到 Google Apps Script 的資料
        const params = new URLSearchParams();
        
        // 將所有資訊編碼為 URL 參數
        Object.keys(completeInfo).forEach(key => {
            if (completeInfo[key] !== undefined && completeInfo[key] !== null) {
                params.append(key, String(completeInfo[key]));
            }
        });

        // 傳送到 Google Apps Script
        const gscriptResponse = await fetch(`${gscriptURL}?ts=${Date.now()}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        const gscriptResult = await gscriptResponse.text();
        console.log('Google Apps Script 回應:', gscriptResult);

        // 回應成功
        res.status(200).json({
            status: 'success',
            message: '資料已記錄',
            recordedFields: Object.keys(completeInfo).length
        });

    } catch (error) {
        console.error('處理請求時發生錯誤:', error);
        res.status(500).json({
            status: 'error',
            message: '內部伺服器錯誤'
        });
    }
}

// 獲取客戶端真實 IP 的函數
function getClientIP(req) {
    // 檢查各種可能包含真實 IP 的標頭
    const xForwardedFor = req.headers['x-forwarded-for'];
    const xRealIP = req.headers['x-real-ip'];
    const xClientIP = req.headers['x-client-ip'];
    const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare
    const trueClientIP = req.headers['true-client-ip'];
    
    if (xForwardedFor) {
        // X-Forwarded-For 可能包含多個 IP，第一個通常是客戶端真實 IP
        return xForwardedFor.split(',')[0].trim();
    }
    
    if (cfConnectingIP) return cfConnectingIP;
    if (trueClientIP) return trueClientIP;
    if (xRealIP) return xRealIP;
    if (xClientIP) return xClientIP;
    
    // 最後選擇：socket 連線 IP
    return req.socket?.remoteAddress || 
           req.connection?.remoteAddress || 
           req.ip || 
           'unknown';
}
