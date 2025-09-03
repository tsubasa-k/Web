## Research 2: 實作關於寄送一封帶有特殊連結的 Email，使用者點擊後導入本地端架設的一個頁面，即刻收集 IP 與裝置資訊

流程圖:
```
[寄 Email 帶連結] → [使用者點擊] → [導向 Server 頁面] → [收集 IP/裝置資訊 + 儲存 Log]
```

### 首先嘗試在本地端架設一個簡單的Web

1. 建立本地端收集伺服器（使用 Flask）
```
pip install flask
```
2. 建立 app.py

```python
from flask import Flask, request, render_template
import datetime

app = Flask(__name__)

@app.route("/")
def collect():
    user_ip = request.remote_addr
    user_agent = request.headers.get("User-Agent")
    referrer = request.headers.get("Referer")
    current_time = datetime.datetime.now().isoformat()

    log = f"[{current_time}] IP: {user_ip} | UA: {user_agent} | Referrer: {referrer}\n"
    print(log)

    with open("visitor_logs.txt", "a") as f:
        f.write(log)

    return render_template("info.html")

from flask import Flask, request, render_template, jsonify

@app.route("/device-info", methods=["POST"])
def device_info():
    data = request.get_json()
    data["ip"] = request.remote_addr
    data["time"] = datetime.datetime.now().isoformat()

    with open("device_info_log.txt", "a") as f:
        f.write(str(data) + "\n")

    return jsonify({"status": "received"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

**Flask 的 /device-info 接收端點**
```python
from flask import Flask, request, render_template, jsonify

@app.route("/device-info", methods=["POST"])
def device_info():
    data = request.get_json()
    data["ip"] = request.remote_addr
    data["time"] = datetime.datetime.now().isoformat()

    with open("device_info_log.txt", "a") as f:
        f.write(str(data) + "\n")

    return jsonify({"status": "received"})

```

3. 建立收集裝置資訊的 HTML 頁面 (info.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>請稍候...</title>
  <script>
    window.onload = function () {
      const data = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hardwareConcurrency: navigator.hardwareConcurrency
      };

      fetch("/device-info", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
      });
    };
  </script>
</head>
<body>
  <p>驗證中，請稍候...</p>
</body>
</html>
```
4.  寄送 Email 並內嵌特殊連結
建立 Email 內容（用 Gmail 寄送測試）

Ex:
```
主旨：帳戶安全驗證通知

內容：
您好，系統偵測到您帳戶異常登入，請於24小時內點擊以下連結進行驗證：

[點此立即驗證](http://<IP>:5000/?uid=abc123)

```

結果儲存成以下files:
- visitor_logs.txt：紀錄 IP、UA、Referrer、時間
- device_info_log.txt：詳細裝置資訊（螢幕解析度、平台、核心數、時區等）

*user_ip = request.remote_addr 會取得「瀏覽這個網頁的使用者的來源 IP 位址」，也就是連線到 Flask 伺服器的用戶端 IP

```
user_ip = request.remote_addr
```
在未經 Proxy 的狀況下，IP 是正確的來源端 IP（例如:使用者家裡、手機網路、公司網路的出站 IP）


### 嘗試架設免費的web，並可以透過browser可以直接存取
#### Google Sites

Google Sites 無法直接執行伺服器端程式 (例如 Flask)，只能放置 HTML、圖片等靜態內容。如果需求是「只要一個靜態收集頁面（JS + HTML）」，Google Sites 是可行的

1. 新增 HTML / JS 程式碼
Google Sites 不直接允許貼原始 HTML（例如 <script> 標籤），但可以用以下兩種方式：

- 方法 A：內嵌小工具
    - 在編輯畫面，選擇 「插入」→「內嵌」。
    - 選擇 「內嵌程式碼」。
    - 貼上 HTML 片段，例如：
    - 按下 「下一步」→「插入」。

- 方法 B：使用 iframe (未嘗試)
    - 如果要更彈性的程式碼，可以將完整的 HTML 上傳到 Google Drive，並設定為「可公開訪問」，再用 iframe 引入

**限制**
- 無法使用 Flask/PHP 這類後端程式，因此不能直接紀錄 IP 或寫入檔案。
- 如果要做 IP 收集與紀錄，需要一個可執行程式的伺服器

**解決方式**
- 結合 Google Apps Script
可以在 Google Site 的 JS 代碼中，把收集的資訊（例如 UA、螢幕解析度、IP）送到 Google Apps Script 的 Web App（它是免費的 Serverless 平台）。

Google Apps Script 可以：
- 接收 AJAX POST 資料
- 儲存到 Google Sheet
- 不用自己租伺服器
------ 
    
#### Google Sites + Google Apps Script

流程圖:
```
[使用者點擊 Google Sites 頁面] →
  [載入 JS，收集裝置資訊 + 呼叫 Google Apps Script Web App] →
    [Apps Script 接收資料並存入 Google Sheet + 記錄 IP]
```

1. 建立 Google Sheet 作為資料存儲
- 建立一份新的 Google Sheet
- 第一列輸入欄位：
```  
時間, IP, User Agent, Referrer
```

2. 建立 Google Apps Script Web App
- 開啟 Google Sheet → 擴充功能 → App Script
- 貼上以下程式碼：
```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var ip = e.parameter.ip || "unknown";
  var ua = e.parameter.ua || "unknown";
  var res = e.parameter.resolution || "unknown";
  var platform = e.parameter.platform || "unknown";
  var lang = e.parameter.language || "unknown";
  var time = new Date();

  sheet.appendRow([time, ip, ua, res, platform, lang]);
  return ContentService.createTextOutput("ok");
}
```
- 點選左上角「部署」→「新部署」→ 選擇「網頁應用程式」
- 描述：log collector
- 執行應用程式的身份：你自己
- 允許誰訪問：任何人（含匿名者）
- 點選「部署」→ 取得網址，例如：
```
https://script.google.com/macros/s/xxx/exec
```
將原本 HTML 修改為：
- 從 api.ipify.org 取得外部 IP
- 將裝置資訊與 IP 組成 payload
- 傳送到 Google Apps Script Web App（https://script.google.com/macros/s/xxx/exec）

Ex: 
    
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>請稍候...</title>
  <script>
    window.onload = function () {
      fetch("https://api.ipify.org?format=json")
        .then(response => response.json())
        .then(ipData => {
          const params = new URLSearchParams({
            ip: ipData.ip,
            userAgent: navigator.userAgent,
            referrer: document.referrer || "None"
          });

          fetch("https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec", {
            method: "POST",
            body: params
          });
        });
    };
  </script>
</head>
<body>
  <p>驗證中，請稍候...</p>
</body>
</html>
```

**問題**
每次存取 Google Sites 上的頁面，Google Sheet 的內容都沒有更新

**原因**
Google Sites 不允許``<script>``執行，也無法直接呼叫外部 JS（包含 fetch）
Google Sites 對安全性限制非常嚴格，不允許在頁面內執行 ``<script>``、``<iframe>`` 中的 JavaScript（包含 fetch），所以即使在 HTML 中寫好 fetch(...) 傳送資料到 Google Apps Script Web App，也不會真的執行

**解決方式**
將收集 JavaScript 放在可以執行 JS 的地方（例如: GitHub / Vercel / Netlify），然後用 iframe 內嵌到 Google Sites

#### Vercel 

1. 上傳 index.html 到Vercel，自動部署成網站
建立一個 index.html（內容如下）：
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>資料收集中...</title>
  <script>
    window.onload = function () {
      fetch("https://api.ipify.org?format=json")
        .then(response => response.json())
        .then(ipData => {
          const params = new URLSearchParams({
            ip: ipData.ip,
            userAgent: navigator.userAgent,
            referrer: document.referrer || "None"
          });

          fetch("https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec", {
            method: "POST",
            body: params
          });
        });
    };
  </script>
</head>
<body>
  <p>正在驗證裝置資訊中...</p>
</body>
</html>
```
2. 修改 Google Apps Script 程式碼
```
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // 設定台灣時區時間（+08:00）
  const tz = "Asia/Taipei";
  const now = Utilities.formatDate(new Date(), tz, "yyyy/MM/dd HH:mm:ss");

  const ip = e.parameter.ip || "unknown";
  const ua = e.parameter.userAgent || "unknown";
  const ref = e.parameter.referrer || "None";

  // 每個欄位分開儲存
  sheet.appendRow([now, ip, ua, ref]);

  return ContentService.createTextOutput("OK");
}
```

**問題**
部署完Apps Script後，開啟網址會成功寫入 Google Sheet，但之後再次開啟就不會更新資料，存取網址只能更新一次

**可能原因 1：Google Apps Script Web App 回傳相同結果，瀏覽器快取導致請求被省略**
- Google Apps Script 的 Web App 是無狀態回應（返回相同結果 OK）。
- 如果瀏覽器認為「這個請求上次已經執行過，且沒有差異」，它可能會直接從快取回應而不再觸發 fetch() 請求。

**解法 1：在請求中加入亂數參數避免快取**
可以在 fetch(...) 的 URL 加上一個隨機的查詢參數，例如 timestamp，強迫瀏覽器重新請求：
```html
<script>
window.onload = function () {
  fetch("https://api.ipify.org?format=json")
    .then(response => response.json())
    .then(ipData => {
      const params = new URLSearchParams({
        ip: ipData.ip,
        userAgent: navigator.userAgent,
        referrer: document.referrer || "None"
      });

      // 加上時間戳避免被快取
      const url = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?ts=" + Date.now();

      fetch(url, {
        method: "POST",
        body: params
      });
    });
};
</script>
```

**可能原因 2：Vercel 網站有 cache 或無法觸發 window.onload 多次**
有些情況 window.onload 在 Vercel 上第二次進入時不會重新觸發（例如從快取載入）

**解法 2：改用 DOMContentLoaded（比 window.onload 更快、更穩定）**
```html
<script>
document.addEventListener("DOMContentLoaded", function () {
  fetch("https://api.ipify.org?format=json")
    .then(response => response.json())
    .then(ipData => {
      const params = new URLSearchParams({
        ip: ipData.ip,
        userAgent: navigator.userAgent,
        referrer: document.referrer || "None"
      });

      // 防止快取，加上時間戳
      const url = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?ts=" + Date.now();

      fetch(url, {
        method: "POST",
        body: params
      });
    });
});
</script>
```
**問題**
解法 1（加 ?ts=Date.now()）與解法 2（改用 DOMContentLoaded），但依然遇到：「第一次開啟 Vercel 網址會成功寫入 Google Sheet，但之後就不會更新」的問題。

按 F12 → Network，並觀察：
![image](https://hackmd.io/_uploads/r12RuOMDxg.png)
在紅色框這行，表示對 https://api.ipify.org?format=json 的 fetch 請求被阻擋了

**可能原因分析**
這通常是因為：
- 瀏覽器阻擋來自網站（vercel.app）跨站呼叫 https://api.ipify.org
- ipify 雖然通常可用，但偶爾會阻擋匿名跨網域 fetch 請求（視來源而定）

**解法一：改用替代 IP API**
改成 https://ipinfo.io/json
免費申請 IPinfo Token
- 註冊：https://ipinfo.io/signup
- 取得token（如：abcd1234efgh）
- 替換 <免費token> 後就能用

將 index.html 中的這段程式碼：
```
fetch("https://api.ipify.org?format=json")
```
改成：
```
fetch("https://ipinfo.io/json?token=<免費token>")
```

**問題**
使用了解法一，但還是出現錯誤

**可能原因分析**
CORS 限制，ipinfo.io 或 api.ipify.org 可能不允許從你網站的 origin 發送跨站請求


**解法二：直接在 Google Apps Script 中抓 IP**
如果不堅持前端抓 IP，也可以在 Apps Script 用 e.parameter 之外的 e 結構取得 IP：

在 Apps Script 中加入：
```
const ip = e.parameter.ip || e.headers['X-Forwarded-For'] || "unknown";
```
這樣就可以不用在前端打 ipify 或 ipinfo，改由後端抓取來源 IP

修改 Apps Script：後端自己抓來源 IP:
```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Log");
  const tz = "Asia/Taipei";
  const now = Utilities.formatDate(new Date(), tz, "yyyy/MM/dd HH:mm:ss");

  // 後端抓 IP（取自 request headers）
  let ip = "unknown";
  try {
    const forwarded = e?.headers?.['x-forwarded-for'];
    if (forwarded) {
      ip = forwarded.split(",")[0].trim();
    }
  } catch (err) {
    ip = "unknown";
  }

  const ua = e.parameter.userAgent || "unknown";
  const ref = e.parameter.referrer || "None";

  sheet.appendRow([now, ip, ua, ref]);
  return ContentService.createTextOutput("OK");
}
```
前端 index.html 簡化版本（不再需要抓 IP）
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>驗證中...</title>
  <script>
    document.addEventListener("DOMContentLoaded", function () {
      const params = new URLSearchParams({
        userAgent: navigator.userAgent,
        referrer: document.referrer || "None"
      });

      fetch("https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?ts=" + Date.now(), {
        method: "POST",
        body: params
      }).then(res => res.text()).then(t => console.log("Apps Script 回應:", t));
    });
  </script>
</head>
<body>
  <p>正在驗證裝置資訊，請稍候...</p>
</body>
</html>
```

**問題**
修改之後，每一次存取網址後，Apps Script都能更新，但是後端自己抓不到來源 IP
![image](https://hackmd.io/_uploads/HkIVTdGvle.png)

每一次存取 Vercel 網址都能成功寫入 Google Sheet，但後端抓到的 IP 欄位有多筆是 unknown

按 F12 → Network，並觀察：
![image](https://hackmd.io/_uploads/HkxIAuzwel.png)

紅色框這行，代表 Google Apps Script Web App 的請求經過了重導向（302 Redirect），這會導致：
- 請求的 header（如 x-forwarded-for）在 redirect 時可能被丟失
- e.headers['x-forwarded-for'] 在 doPost() 中可能是 undefined
- 結果在 Apps Script 無法從後端取得 IP

另外，點 exec?ts=... → Headers，檢查發現沒有 ``x-forwarded-for``

表示 Google Apps Script 在「Web App 模式」下，並不提供 x-forwarded-for header 給 doPost(e)，特別是在匿名用戶、無認證訪問的情況下

**解法：改用中介 Proxy 後端（真正抓 IP）再轉發給 Apps Script**
由於 Google Apps Script 無法提供 request IP，唯一可靠的方法是透過自己的中介伺服器先收 IP，再將資料轉發給 Apps Script

#### 快速解法（無需自己架伺服器）：用 Vercel Serverless Function 當 Proxy
1. 在 Vercel 新增一個 API 端點 /api/forward.js：
```javascript
export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";
  const ref = req.headers['referer'] || "unknown";

  // 將資料轉發到 Google Apps Script Web App
  const gscriptURL = "https://script.google.com/macros/s/AKfycbyM9jZAnb1q-4lpv8xXZcJzARjWIzbtC-qr7uYxPI0EiL09hkZdmNCVUbnaST4NECh0/exec";
  const params = new URLSearchParams({
    ip: ip,
    userAgent: ua,
    referrer: ref
  });

  await fetch(`${gscriptURL}?ts=${Date.now()}`, {
    method: "POST",
    body: params
  });

  res.status(200).send("OK");
}
```
2. 前端 index.html 改成呼叫自己的 Proxy：
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>驗證中...</title>
  <script>
    document.addEventListener("DOMContentLoaded", function () {
      fetch("/api/forward")
        .then(res => res.text())
        .then(msg => console.log("回應:", msg));
    });
  </script>
</head>
<body>
  <p>正在驗證裝置資訊，請稍候...</p>
</body>
</html>
```

流程圖:
```
[使用者開啟 Vercel 網站 index.html]
      ↓
[觸發 /api/forward Serverless Function]
      ↓
[取得來源 IP, UA, Referrer]
      ↓
[轉發到 Google Apps Script Web App]
      ↓
[寫入 Google Sheet 成功]
```

3. Google Apps Script(跟第三版的一樣)
```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // 設定台灣時區時間（+08:00）
  const tz = "Asia/Taipei";
  const now = Utilities.formatDate(new Date(), tz, "yyyy/MM/dd HH:mm:ss");

  const ip = e.parameter.ip || "unknown";
  const ua = e.parameter.userAgent || "unknown";
  const ref = e.parameter.referrer || "None";

  // 每個欄位分開儲存
  sheet.appendRow([now, ip, ua, ref]);

  return ContentService.createTextOutput("OK");
}
```
**問題**
在Vercel架設網頁出現錯誤:
![image](https://hackmd.io/_uploads/HySzCIhvgg.png)
**解決方式**
Add a `vercel.json` file at the root of your project, and use "rewrites" to rewrite all incoming paths to refer to your index path.
```
{
  "rewrites":  [
    {"source": "/(.*)", "destination": "/"}
  ]
}
```
refer: https://medium.com/today-i-solved/deploy-spa-with-react-router-to-vercel-d10a6b2bfde8


***注意Google Apps Script每次更新都需要重新"新增部屬作業"**

### 測試結果
開啟部署的網址 https://web-tsubasa.vercel.app/ 後，每次都會：
- 自動觸發 /api/forward
- 抓到實際 IP（例如 140.114.x.x）
- 將資料送到 Apps Script
- 寫入 Google Sheet

![image](https://hackmd.io/_uploads/Skf_ztzPge.png)

如果要增加其他的硬體資訊
Web 登入後可取得的硬體資訊與 IP（無需使用外掛）
| 資訊類型               | 可否取得                                      | 說明                                                 |
| ------------------ | ----------------------------------------- | -------------------------------------------------- |
| Public IP          | ✅（透過後端 `req.headers` 或 `x-forwarded-for`） | 已實作於 `forward.js` 中                                |
| User-Agent         | ✅                                         | 提供 OS、瀏覽器版本資訊                                      |
| Referrer           | ✅                                         | 使用者來源頁面                                            |
| 語言設定               | ✅                                         | `navigator.language`                               |
| 作業系統平台             | ✅                                         | `navigator.platform`                               |
| 螢幕解析度              | ✅                                         | `screen.width`, `screen.height`                    |
| 硬體核心數              | ✅                                         | `navigator.hardwareConcurrency`                    |
| 時區                 | ✅                                         | `Intl.DateTimeFormat().resolvedOptions().timeZone` |
| 指紋資訊（Canvas/WebGL） | ⚠️ 需 FingerprintJS 第三方套件                  |                                                    |
| 裝置名稱 / MAC / 硬碟序號  | ❌                                         | 出於瀏覽器安全性，無法直接取得                                    |

1. 修改後的index.html
收集硬體資訊並送給 /api/forward：
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>驗證中...</title>
  <script>
    document.addEventListener("DOMContentLoaded", function () {
      const data = {
        userAgent: navigator.userAgent,
        referrer: document.referrer || "None",
        language: navigator.language,
        platform: navigator.platform,
        resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cores: navigator.hardwareConcurrency.toString()
      };

      fetch("/api/forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      .then(res => res.text())
      .then(msg => console.log("回應:", msg));
    });
  </script>
</head>
<body>
  <p>正在驗證裝置資訊，請稍候...</p>
</body>
</html>
```
2. 修改後的 api/forward.js（支援 JSON 傳入）
```javascript
export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";

  let body = {};
  try {
    body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body); // for Vercel raw JSON
    }
  } catch (e) {
    console.error("解析 JSON 失敗", e);
  }

  const ref = body.referrer || "None";
  const lang = body.language || "unknown";
  const platform = body.platform || "unknown";
  const resolution = body.resolution || "unknown";
  const timezone = body.timezone || "unknown";
  const cores = body.cores || "unknown";

  const gscriptURL = "https://script.google.com/macros/s/AKfycbw6Zbb8WVk8AYyqoyglxEBGab4iyewNaUgx0Ul68bNv-Bw-clfch40X880Cmtg2tesY/exec";
  const params = new URLSearchParams({
    ip,
    userAgent: ua,
    referrer: ref,
    language: lang,
    platform,
    resolution,
    timezone,
    cores
  });

  await fetch(`${gscriptURL}?ts=${Date.now()}`, {
    method: "POST",
    body: params
  });

  res.status(200).send("OK");
}
```
3.  修改 Google Apps Script：接收擴充欄位並寫入 Sheet
```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // 設定台灣時區時間（+08:00）
  const tz = "Asia/Taipei";
  const now = Utilities.formatDate(new Date(), tz, "yyyy/MM/dd HH:mm:ss");

  const ip = e.parameter.ip || "unknown";
  const ua = e.parameter.userAgent || "unknown";
  const ref = e.parameter.referrer || "None";
  const res = e.parameter.resolution || "unknown";
  const platform = e.parameter.platform || "unknown";
  const lang = e.parameter.language || "unknown";
  const tzName = e.parameter.timezone || "unknown";
  const cores = e.parameter.cores || "unknown";

  sheet.appendRow([now, ip, ua, ref, res, platform, lang, tzName, cores]);
  return ContentService.createTextOutput("OK");
}
```

如果要修改成讓使用者瀏覽網頁時：
:white_check_mark: 收集裝置資訊與 IP
:white_check_mark: 傳送到 Server
:white_check_mark: 將收集結果即時顯示在網頁上

整體架構變更摘要
要做的事是：
-  前端：收集資訊 → 傳送 /api/forward
-  後端（Vercel）：加入回傳收集資料（包含 IP）
-  前端：拿到伺服器回傳資料後，更新頁面 DOM

1. 修改後的 index.html
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>驗證中...</title>
  <style>
    #info-box {
      margin-top: 20px;
      padding: 10px;
      border: 1px solid #ccc;
      font-family: monospace;
      white-space: pre-wrap;
    }
  </style>
  <script>
    document.addEventListener("DOMContentLoaded", function () {
      const data = {
        userAgent: navigator.userAgent,
        referrer: document.referrer || "None",
        language: navigator.language,
        platform: navigator.platform,
        resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cores: navigator.hardwareConcurrency?.toString() || "unknown"
      };

      fetch("/api/forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      .then(res => res.json())  // ← 期待回傳 JSON
      .then(result => {
        const box = document.getElementById("info-box");
        box.innerText =
          `已回傳並收到以下裝置資訊：\n\n` +
          `時間：${result.timestamp}\n` +
          `IP：${result.ip}\n` +
          `User-Agent：${result.userAgent}\n` +
          `Referrer：${result.referrer}\n` +
          `Resolution：${result.resolution}\n` +
          `Platform：${result.platform}\n` +
          `Language：${result.language}\n` +
          `Timezone：${result.timezone}\n` +
          `CPU Cores：${result.cores}`;
      })
      .catch(err => {
        document.getElementById("info-box").innerText = "資訊回傳失敗：" + err;
      });
    });
  </script>
</head>
<body>
  <p>正在驗證裝置資訊，請稍候...</p>
  <div id="info-box">📡 等待伺服器回應...</div>
</body>
</html>
```

2. 修改後的 forward.js
讓 server 回傳完整資料（包含時間與 IP）：
```javascript
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    console.error("JSON 解析失敗", e);
  }

  const now = new Date().toISOString();  // 傳給前端顯示時間（UTC 格式）

  const data = {
    timestamp: now,
    ip,
    userAgent: ua,
    referrer: body.referrer || "None",
    language: body.language || "unknown",
    platform: body.platform || "unknown",
    resolution: body.resolution || "unknown",
    timezone: body.timezone || "unknown",
    cores: body.cores || "unknown"
  };

  // 傳送到 Google Apps Script 儲存
  const gscriptURL = "https://script.google.com/macros/s/AKfycbw6Zbb8WVk8AYyqoyglxEBGab4iyewNaUgx0Ul68bNv-Bw-clfch40X880Cmtg2tesY/exec";
  const params = new URLSearchParams(data);

  try {
    await fetch(`${gscriptURL}?ts=${Date.now()}`, {
      method: "POST",
      body: params
    });
  } catch (err) {
    console.error("轉發到 GAS 失敗:", err);
  }

  // 回傳完整資料給前端
  res.status(200).json(data);
}
```

3. Google Apps Script 不需更動
```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // 設定台灣時區時間（+08:00）
  const tz = "Asia/Taipei";
  const now = Utilities.formatDate(new Date(), tz, "yyyy/MM/dd HH:mm:ss");

  const ip = e.parameter.ip || "unknown";
  const ua = e.parameter.userAgent || "unknown";
  const ref = e.parameter.referrer || "None";
  const res = e.parameter.resolution || "unknown";
  const platform = e.parameter.platform || "unknown";
  const lang = e.parameter.language || "unknown";
  const tzName = e.parameter.timezone || "unknown";
  const cores = e.parameter.cores || "unknown";

  sheet.appendRow([now, ip, ua, ref, res, platform, lang, tzName, cores]);
  return ContentService.createTextOutput("OK");
}
```
