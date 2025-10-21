# ✨ MockScreen ✨

**一个灵活、强大的浏览器端截图生成器。**

[![部署状态](https://img.shields.io/static/v1?label=deployment&message=Cloudflare&color=orange&logo=cloudflare)](https://mock.yanxiaoxi.qzz.io/)
[![许可证: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub 语言数量](https://img.shields.io/github/languages/count/YANXIAOXIH/MockScreen)](https://github.com/YANXIAOXIH/MockScreen)

---

`MockScreen` 是一个零依赖、纯前端实现的在线工具，旨在帮助用户轻松创建高度可定制、外观逼真的各类应用截图。无论是支付宝的支付成功页面，还是复杂的账单详情，您都可以通过简单的参数设置，实时预览并生成高质量的PNG图片。

## 🔗 在线体验 (Live Demo)

您可以随时通过以下链接访问 `MockScreen` 的最新版本：

**https://mock.yanxiaoxi.qzz.io/**

*(提示: 您可以将其替换为自己部署在 Cloudflare Pages 上的最终域名)*

## 🚀 主要功能

*   **🎨 高度可定制**: 几乎所有可见元素（时间、电量、金额、商户名、图标等）均可修改。
*   **🧩 多模板支持**: 内置多个常用模板，如“支付宝-支付成功”和“支付宝-账单详情”。
*   **⚡️ 实时预览**: 所有参数修改都会即时反映在右侧的预览画布上，所见即所得。
*   **🖼️ 高清图片导出**: 一键下载当前预览为高质量、无损的 PNG 图片。
*   **📦 模块化架构**: 项目采用高度模块化的文件结构，添加一个全新的模板就像增加一个“插件”一样简单。
*   **💡 动态布局**: 支持根据用户操作动态调整布局，例如“支付有礼”模块的顺序会根据勾选先后动态排列。
*   **🌐 纯前端实现**: 无需后端服务，所有操作均在浏览器端完成，快速、安全且易于部署。

## 🔧 技术栈

*   **HTML5**
*   **CSS3**: 使用 Flexbox 进行现代化布局。
*   **JavaScript (ES6+)**:
    *   原生JS，无任何外部框架依赖。
    *   使用 **ES Modules** 实现代码的模块化和解耦。
    *   通过 **Canvas API** 进行所有图形的绘制和合成。

## 📁 项目结构

项目采用了清晰的“关注点分离”结构，每个模板都是一个独立的包。

```
.
├── css/
│   └── style.css            # 全局样式文件
├── fonts/                   # 全局字体文件
├── js/
│   ├── main.js              # 全局核心逻辑 (模板加载与调度)
│   └── utils.js             # 通用工具函数 (如绘图函数)
├── templates/               # 所有模板的“插件”目录
│   ├── alipay-success/      # “支付宝-支付成功”模板包
│   │   ├── icons/           # 该模板专属的图片资源
│   │   └── main.js          # 该模板的配置、HTML结构和绘制逻辑
│   └── alipay-details/      # “支付宝-账单详情”模板包
│       └── ...
└── index.html               # 程序主入口
```

## 🛠️ 本地开发

本项目无需复杂的构建步骤，您可以轻松地在本地运行。

1.  **克隆仓库**
    ```bash
    git clone https://github.com/YANXIAOXIH/MockScreen.git
    ```

2.  **进入项目目录**
    ```bash
    cd MockScreen
    ```

3.  **运行项目**
    由于项目使用了 ES Modules (`import`/`export`)，直接用浏览器打开 `index.html` 文件可能会遇到跨域问题。推荐使用一个简单的本地服务器来运行。

    如果您使用 **Visual Studio Code**，可以安装 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 插件，然后在 `index.html` 文件上右键，选择 "Open with Live Server"。

    您的浏览器将自动打开 `http://127.0.0.1:5500` (或类似地址)，项目即可正常运行。

## 🤝 如何贡献

欢迎为 `MockScreen` 贡献代码！如果您有好的想法或发现了Bug，请随时提交 Issue 或 Pull Request。

1.  **Fork** 本仓库
2.  创建您的新分支 (`git checkout -b feature/AmazingFeature`)
3.  提交您的修改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送您的分支 (`git push origin feature/AmazingFeature`)
5.  **提交一个 Pull Request**

## 📄 许可证

本项目基于 [MIT License](https://opensource.org/licenses/MIT) 开源。详情请见 `LICENSE` 文件。