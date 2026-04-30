# Utopia Uptime Page

一个基于UptimeRobot API的单文件纯前端的网站状态监控面板。  

A single-file, serverless status monitoring dashboard based on the UptimeRobot API.  

UptimeRobot APIを利用した単一HTMLのウェブサイトステータス監視ダッシュボードです。  

  

DEMO：[Utopia Uptime](https://status.utopiaxc.com/)  



## 特性 / Feature / 機能

- 单文件 / Single file /単一ファイル  
- 支持中英日语 / Multi-language support / 多言語対応  
- 深色模式 / Dark&Light mode / ダークモード  
- 卡片与列表 / Grid and List / グリッドとリストビュー  
- 可用率与响应时间 / Uptime and response time / 稼働率と応答時間  



## 配置 / Configuration / 設定

使用文本编辑器打开文件，修改 `<script id="configurationScript">` 中的 `ApplicationConfiguration`   

Open the file in a text editor and modify the `ApplicationConfiguration` object inside `<script id="configurationScript"> ` 

エディタでファイルを開き、`<script id="configurationScript">` 内の `ApplicationConfiguration` オブジェクトを編集します  

```js
const ApplicationConfiguration = {
    // 填入UptimeRobot的API Key
    // Input UptimeRobot API Key
    // UptimeRobotのAPI Keyを入力
    ApiKeys: [
        "urxxxxxxx-xxxxxxxxxxxxxxxxxxx" 
    ],
    
    // 统计与显示的天数
    // Number of days to calculate and display
    // 統計および表示する日数
    CountDays: 90,
    
    // 页面与浏览器标签标题
    // Page and browser tab title
    // ページおよびブラウザタブのタイトル
    PageTitle: "Utopia Uptime",
    
    // 页脚显示的用户名
    // Username displayed in the footer
    // フッターに表示されるユーザー名
    Username: "UtopiaXC",
    
    // 用户名的链接
    // URL linked to the username
    // ユーザー名にリンクされるURL
    UserUrl: "https://www.utopiaxc.cn/"
};
```

