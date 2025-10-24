/**
 * @file 主应用程序逻辑
 * @description
 * 负责管理模板切换、资源加载、Canvas 绘制以及所有通用 UI 交互。
 * 这是整个图片生成器的核心控制器。
 */

// --- 全局变量和 DOM 元素获取 ---

// Canvas 相关元素
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 主要的 UI 交互元素
const templateSelect = document.getElementById('template-select');
const downloadBtn = document.getElementById('download-btn');

// 模板控制面板的容器。
// [重要] 使用 let 而不是 const，因为在切换模板时，我们会克隆并替换这个元素以移除旧的事件监听器。
let templateControlsContainer = document.getElementById('template-controls-container');

// 用于存储当前活动模板的模块和已加载的图片资源
let currentTemplateModule = null;
let currentLoadedAssets = {};


// --- 全局资源定义 ---

/**
 * @const {object} GLOBAL_ICON_DEFINITIONS
 * @description
 * 定义了所有模板可共用的状态栏图标。
 * [重要] 键名已统一，均不以 "Icon" 结尾，以确保代码能正确匹配。
 */
const GLOBAL_ICON_DEFINITIONS = {
    // iOS 风格图标 (键名已修正)
    Ioslocat: '../icons/Ioslocat{themeSuffix}Icon.png',
    Iosalarm: '../icons/Iosalarm{themeSuffix}Icon.png',
    Iosbell: '../icons/IosBell{themeSuffix}Icon.png',
    Iosuser: '../icons/Iosuser{themeSuffix}Icon.png',
    Iossleep: '../icons/Iossleep{themeSuffix}Icon.png',
    Ioswifi: '../icons/IosWifi{themeSuffix}Icon.png',
    Iosltea: '../icons/Iosltea{themeSuffix}Icon.png',
    Ioslteb: '../icons/Ioslteb{themeSuffix}Icon.png',
    Ioslte5Ga: '../icons/Ioslte5Ga{themeSuffix}Icon.png',

    // 其他系统风格图标 (键名已修正)
    iconchat: '../icons/chat{themeSuffix}Icon.png',
    iconwifia: '../icons/WifiArrow{themeSuffix}Icon.png',
    iconlte4Ga: '../icons/lte4Ga{themeSuffix}Icon.png',
    iconlte4Gb: '../icons/lte4Gb{themeSuffix}Icon.png',
    iconlte3G: '../icons/lte3G{themeSuffix}Icon.png',
    iconlte5Gb: '../icons/lte5Gb{themeSuffix}Icon.png',
    iconPhone: '../icons/Phone{themeSuffix}Icon.png',
    iconAlipay: '../icons/Alipay{themeSuffix}Icon.png',
    iconTaobao: '../icons/Taobao{themeSuffix}Icon.png',
    iconWechat: '../icons/Wechat{themeSuffix}Icon.png',
    iconWeibo: '../icons/Weibo{themeSuffix}Icon.png',
    iconZhihu: '../icons/Zhihu{themeSuffix}Icon.png',
    
    // 第三方圆角应用图标 (键名原本就是正确的)
    icon12306: '../icons/radius/12306Icon.png',
    icon163music: '../icons/radius/163musicIcon.png',
    iconAlidrive: '../icons/radius/AlidriveIcon.png',
    iconAtuin: '../icons/radius/AtuinIcon.png',
    iconBaidu: '../icons/radius/BaiduIcon.png',
    iconBaidudriveA: '../icons/radius/BaidudriveaIcon.png',
    iconBaidudriveB: '../icons/radius/BaidudrivebIcon.png',
    iconBilibili: '../icons/radius/BilibiliIcon.png',
    iconChrome: '../icons/radius/ChromeIcon.png',
    iconDoubao: '../icons/radius/DoubaoIcon.png',
    iconDsvideo: '../icons/radius/DsvideoIcon.png',
    iconEdge: '../icons/radius/EdgeIcon.png',
    iconFlclash: '../icons/radius/FlclashIcon.png',
    iconGoogle: '../icons/radius/GoogleIcon.png',
    iconGoogleCloud: '../icons/radius/GooglecloudIcon.png',
    iconGoogledrive: '../icons/radius/GoogledriveIcon.png',
    iconGooglemap: '../icons/radius/GooglemapIcon.png',
    iconIptv: '../icons/radius/IptvIcon.png',
    iconKmplayer: '../icons/radius/KmplayerIcon.png',
    iconMiwifi: '../icons/radius/MiwifiIcon.png',
    iconOffice: '../icons/radius/OfficeIcon.png',
    iconOnedev: '../icons/radius/OnedevIcon.png',
    iconPalworld: '../icons/radius/PalworldIcon.png'
};


// --- 核心功能函数 ---

/**
 * 生成并返回包含所有状态栏图标控件的 HTML 字符串。
 * 这些控件将被注入到各个模板的控制面板中。
 * @returns {string} 包含图标选择器和隐藏复选框的 HTML 字符串。
 */
function getGlobalIconControlsHTML() {
    // 注意：为了代码简洁，这里直接返回了较长的 HTML 字符串。
    // 在更复杂的应用中，可以考虑使用模板引擎或 DOM API 来构建。
    return `
        <div class="input-group">
            <label>状态栏图标</label>
            <div class="statusbar-icon-selector is-active-dropzone-container">
                <div id="left-icons-dropzone" class="icon-sub-dropzone"></div>
                <div class="icon-spacer" style="flex-grow: 1;"></div>
                <div id="right-icons-dropzone" class="icon-sub-dropzone"></div>
            </div>
        </div>
        <div class="input-group">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <label style="margin-bottom: 0;">图标库</label>
                <label class="button-like-label">
                    + 添加图标
                    <input type="file" id="custom-icon-upload" accept="image/*" style="display: none;">
                </label>
            </div>
            <div class="statusbar-icon-selector is-available-dropzone" id="available-icons-dropzone">
                <!-- 图标选项的 HTML 结构保持不变... -->
                <div class="icon-option icon-Ioslocat" data-target="IoslocatToggle" data-draggable="true"></div>
                <div class="icon-option icon-Iosalarm" data-target="IosalarmToggle" data-draggable="true"></div>
                <div class="icon-option icon-Iosbell" data-target="IosbellToggle" data-draggable="true"></div>
                <div class="icon-option icon-Iosuser" data-target="IosuserToggle" data-draggable="true"></div>
                <div class="icon-option icon-Iossleep" data-target="IossleepToggle" data-draggable="true"></div>
                <div class="icon-option icon-Ioswifi" data-target="IoswifiToggle" data-draggable="true"></div>
                <div class="icon-option icon-Ioslte5Ga" data-target="Ioslte5GaToggle" data-draggable="true"></div>
                <div class="icon-option icon-Iosltea" data-target="IoslteaToggle" data-draggable="true"></div>
                <div class="icon-option icon-Ioslteb" data-target="IosltebToggle" data-draggable="true"></div>
                <div class="icon-option icon-chat" data-target="iconchatToggle" data-draggable="true"></div>
                <div class="icon-option icon-wifia" data-target="iconwifiaToggle" data-draggable="true"></div>
                <div class="icon-option icon-lte4Ga" data-target="iconlte4GaToggle" data-draggable="true"></div>
                <div class="icon-option icon-lte4Gb" data-target="iconlte4GbToggle" data-draggable="true"></div>
                <div class="icon-option icon-lte3G" data-target="iconlte3GToggle" data-draggable="true"></div>
                <div class="icon-option icon-lte5Gb" data-target="iconlte5GbToggle" data-draggable="true"></div>
                <div class="icon-option icon-Phone" data-target="iconPhoneToggle" data-draggable="true"></div>
                <div class="icon-option icon-Alipay" data-target="iconAlipayToggle" data-draggable="true"></div>
                <div class="icon-option icon-Taobao" data-target="iconTaobaoToggle" data-draggable="true"></div>
                <div class="icon-option icon-Wechat" data-target="iconWechatToggle" data-draggable="true"></div>
                <div class="icon-option icon-Weibo" data-target="iconWeiboToggle" data-draggable="true"></div>
                <div class="icon-option icon-Zhihu" data-target="iconZhihuToggle" data-draggable="true"></div>
                <div class="icon-option icon-12306 app-icon" data-target="icon12306Toggle" data-draggable="true"></div>
                <div class="icon-option icon-163music app-icon" data-target="icon163musicToggle" data-draggable="true"></div>
                <div class="icon-option icon-alidrive app-icon" data-target="iconAlidriveToggle" data-draggable="true"></div>
                <div class="icon-option icon-atuin app-icon" data-target="iconAtuinToggle" data-draggable="true"></div>
                <div class="icon-option icon-baidu app-icon" data-target="iconBaiduToggle" data-draggable="true"></div>
                <div class="icon-option icon-baidudrivea app-icon" data-target="iconBaidudriveAToggle" data-draggable="true"></div>
                <div class="icon-option icon-baidudriveb app-icon" data-target="iconBaidudriveBToggle" data-draggable="true"></div>
                <div class="icon-option icon-bilibili app-icon" data-target="iconBilibiliToggle" data-draggable="true"></div>
                <div class="icon-option icon-chrome app-icon" data-target="iconChromeToggle" data-draggable="true"></div>
                <div class="icon-option icon-doubao app-icon" data-target="iconDoubaoToggle" data-draggable="true"></div>
                <div class="icon-option icon-dsvideo app-icon" data-target="iconDsvideoToggle" data-draggable="true"></div>
                <div class="icon-option icon-edge app-icon" data-target="iconEdgeToggle" data-draggable="true"></div>
                <div class="icon-option icon-flclash app-icon" data-target="iconFlclashToggle" data-draggable="true"></div>
                <div class="icon-option icon-google app-icon" data-target="iconGoogleToggle" data-draggable="true"></div>
                <div class="icon-option icon-googlecloud app-icon" data-target="iconGoogleCloudToggle" data-draggable="true"></div>
                <div class="icon-option icon-googledrive app-icon" data-target="iconGoogledriveToggle" data-draggable="true"></div>
                <div class="icon-option icon-googlemap app-icon" data-target="iconGooglemapToggle" data-draggable="true"></div>
                <div class="icon-option icon-iptv app-icon" data-target="iconIptvToggle" data-draggable="true"></div>
                <div class="icon-option icon-kmplayer app-icon" data-target="iconKmplayerToggle" data-draggable="true"></div>
                <div class="icon-option icon-miwifi app-icon" data-target="iconMiwifiToggle" data-draggable="true"></div>
                <div class="icon-option icon-office app-icon" data-target="iconOfficeToggle" data-draggable="true"></div>
                <div class="icon-option icon-onedev app-icon" data-target="iconOnedevToggle" data-draggable="true"></div>
                <div class="icon-option icon-palworld app-icon" data-target="iconPalworldToggle" data-draggable="true"></div>
            </div>
        </div>
        <!-- 隐藏的复选框，用于真正控制图标的显示状态 -->
        <input type="checkbox" class="control" data-id="IoslocatToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="IosalarmToggle" checked style="display: none;">
        <input type="checkbox" class="control" data-id="IosbellToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="IosuserToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="IossleepToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="IoswifiToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="Ioslte5GaToggle" checked style="display: none;">
        <input type="checkbox" class="control" data-id="IoslteaToggle" checked style="display: none;">
        <input type="checkbox" class="control" data-id="IosltebToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconchatToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconwifiaToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconlte4GaToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconlte4GbToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconlte3GToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconlte5GbToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconPhoneToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconAlipayToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconTaobaoToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconWechatToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconWeiboToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconZhihuToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="icon12306Toggle" style="display: none;">
        <input type="checkbox" class="control" data-id="icon163musicToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconAlidriveToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconAtuinToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconBaiduToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconBaidudriveAToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconBaidudriveBToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconBilibiliToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconChromeToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconDoubaoToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconDsvideoToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconEdgeToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconFlclashToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconGoogleToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconGoogleCloudToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconGoogledriveToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconGooglemapToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconIptvToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconKmplayerToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconMiwifiToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconOfficeToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconOnedevToggle" style="display: none;">
        <input type="checkbox" class="control" data-id="iconPalworldToggle" style="display: none;">
    `;
}

/**
 * 异步加载一组图片资源。
 * @param {object} assetsToLoad - 键值对对象，key 为资源名，value 为图片路径。
 * @returns {Promise<object>} 返回一个 Promise，成功时解析为一个包含已加载 Image 对象的键值对。
 */
function loadAssets(assetsToLoad) {
    if (!assetsToLoad || Object.keys(assetsToLoad).length === 0) {
        return Promise.resolve({}); // 如果没有资源需要加载，立即返回一个空对象
    }

    const promises = Object.entries(assetsToLoad).map(([key, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ key, img });
            img.onerror = () => reject(new Error(`资源加载失败: ${src}`));
            img.src = src;
        });
    });

    return Promise.all(promises).then(results => {
        const loadedAssets = {};
        results.forEach(({ key, img }) => {
            loadedAssets[key] = img;
        });
        return loadedAssets;
    });
}

/**
 * 核心绘制函数。
 * 负责收集所有用户输入，并调用当前模板的 draw 方法来更新 Canvas。
 */
function drawCanvas() {
    if (!currentTemplateModule) return;

    const template = currentTemplateModule.template;
    const config = template.config;

    // 设置画布尺寸
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;

    // 收集所有控制面板上的值
    const controls = {};
    document.querySelectorAll('#template-controls-container .control').forEach(el => {
        const id = el.dataset.id;
        if (el.type === 'file') {
            // 对于文件输入，我们使用已加载到内存中的 Image 对象
            if (currentLoadedAssets[id]) {
                controls[id] = currentLoadedAssets[id];
            }
        } else if (el.type === 'radio') {
            if (el.checked) {
                controls[id] = el.value;
            }
        } else {
            controls[id] = (el.type === 'checkbox') ? el.checked : el.value;
        }
    });

    // 调用当前模板的绘制方法
    template.draw(ctx, config, controls, currentLoadedAssets);
}

/**
 * 为动态添加到页面的控件绑定通用事件监听器。
 */
function bindControlListeners() {
    // 为大部分输入控件绑定 'input' 事件，实现实时预览
    document.querySelectorAll('#template-controls-container .control').forEach(element => {
        // 文件上传使用 'change' 事件，其他大部分使用 'input'
        const eventType = (element.type === 'file' || element.type === 'radio') ? 'change' : 'input';
        element.addEventListener(eventType, drawCanvas);
    });

    // 单独处理文件上传的预览逻辑
    document.querySelectorAll('input[type="file"].control').forEach(element => {
        element.addEventListener('change', (event) => {
            const file = event.target.files[0];
            const id = element.dataset.id;
            
            const fileNameDisplay = document.querySelector(`.file-name-display[data-id="${id}FileName"]`);
            if (!file) {
                delete currentLoadedAssets[id]; 
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = ''; 
                }
                drawCanvas();
                return;
            }
            if (!file.type.startsWith('image/')) {
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = '非图片文件!'; 
                }
                alert('请选择一个有效的图片文件！');
                return;
            }

            if (fileNameDisplay) {
                fileNameDisplay.textContent = file.name; 
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    currentLoadedAssets[id] = img; 
                    drawCanvas();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    });

    // 为“快捷按钮”绑定点击事件
    document.querySelectorAll('#template-controls-container .quick-buttons button').forEach(button => {
        button.addEventListener('click', () => {
            const targetInput = document.querySelector(`.control[data-id="${button.dataset.target}"]`);
            if (targetInput) {
                targetInput.value = button.dataset.value;
                // 手动触发 input 事件，以确保 drawCanvas 被调用
                targetInput.dispatchEvent(new Event('input'));
            }
        });
    });
    
    // 为滑块（range input）同步显示数值
    document.querySelectorAll('#template-controls-container input[type="range"].control').forEach(slider => {
        const valueSpan = document.querySelector(`.control-value[data-id="${slider.dataset.id}Value"]`);
        if (valueSpan) {
            valueSpan.textContent = slider.value; // 初始化显示
            slider.addEventListener('input', () => {
                valueSpan.textContent = slider.value; // 滑动时更新
            });
        }
    });
    
    // [新增] 为自定义图标上传按钮绑定事件监听器
    const customIconUploader = document.getElementById('custom-icon-upload');
    if (customIconUploader) {
        customIconUploader.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file || !file.type.startsWith('image/')) {
                // 如果用户没选文件或文件非图片，则不做任何事
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // 1. 为新图标生成一个独一无二的 ID
                    const timestamp = Date.now();
                    const assetKey = `customIcon${timestamp}`;
                    const controlId = `${assetKey}Toggle`;

                    // 2. 将加载好的 Image 对象存入全局资源库
                    currentLoadedAssets[assetKey] = img;

                    // 3. 在“图标库”中创建这个新图标的 DOM 元素
                    const availableDropzone = document.getElementById('available-icons-dropzone');
                    const newIconDiv = document.createElement('div');
                    newIconDiv.className = 'icon-option app-icon'; // 使用 app-icon 样式
                    newIconDiv.dataset.target = controlId;
                    newIconDiv.dataset.draggable = 'true';
                    newIconDiv.draggable = true;
                    // 使用 FileReader 读取的 Data URL 作为预览背景图
                    newIconDiv.style.backgroundImage = `url(${e.target.result})`; 
                    
                    availableDropzone.appendChild(newIconDiv);

                    // 4. 为这个新图标创建一个隐藏的复选框，用于控制其显示状态
                    const newCheckbox = document.createElement('input');
                    newCheckbox.type = 'checkbox';
                    newCheckbox.className = 'control';
                    newCheckbox.dataset.id = controlId;
                    newCheckbox.style.display = 'none';
                    // 将复选框添加到容器的某个地方（例如末尾）
                    templateControlsContainer.appendChild(newCheckbox);

                    // 5. [重要] 清空 input 的值，以便用户可以连续上传同一个文件
                    event.target.value = null; 
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
}

/**
 * 切换模板的核心函数。
 * 负责清理旧模板、加载新模板模块、注入 HTML、加载资源和绑定事件。
 * @param {string} templateName - 要加载的模板的文件夹名。
 */
async function switchTemplate(templateName) {
    try {
        // [核心修复] 清理旧的事件监听器，防止内存泄漏和功能错乱。
        // 通过克隆并替换容器元素，可以移除所有附加在其上的事件监听器。
        // 这是确保模板之间状态完全隔离的最可靠方法。
        if (document.getElementById('template-controls-container')) {
            const oldContainer = templateControlsContainer;
            const newContainer = oldContainer.cloneNode(false); // false = 不克隆子元素
            oldContainer.parentNode.replaceChild(newContainer, oldContainer);
            templateControlsContainer = newContainer; // 更新全局引用到新的、干净的容器
        }

        templateControlsContainer.innerHTML = `<p>正在加载模板: ${templateName}...</p>`;

        // 1. 使用动态 import() 按需加载模板的 JS 模块
        const modulePath = `../templates/${templateName}/main.js`;
        const module = await import(modulePath);
        currentTemplateModule = module;
        const template = module.template;

        // 2. 将模板专属的 HTML 和通用的图标控件 HTML 组合并注入页面
        const templateSpecificHTML = template.getControlsHTML();
        const finalHTML = templateSpecificHTML.replace(
            '<!-- ICON_CONTROLS_PLACEHOLDER -->',
            getGlobalIconControlsHTML()
        );
        templateControlsContainer.innerHTML = finalHTML;

        // 3. 根据模板主题（'day' 或 'night'），动态生成最终的图标资源路径
        const theme = template.theme || 'day'; // 默认为白天主题
        const themeSuffix = theme === 'night' ? 'nighi' : '';
        const themedIconAssets = {};
        for (const key in GLOBAL_ICON_DEFINITIONS) {
            themedIconAssets[key] = GLOBAL_ICON_DEFINITIONS[key].replace('{themeSuffix}', themeSuffix);
        }

        // 4. 合并通用资源和模板专属资源，然后异步加载所有图片
        const assetsToLoad = { ...themedIconAssets, ...template.assets };
        currentLoadedAssets = await loadAssets(assetsToLoad);
        
        // 5. 为新注入的 HTML 控件绑定所有通用的事件监听器
        bindControlListeners();

        // 6. 如果模板模块提供了专属的初始化函数，则执行它（用于处理拖拽等特殊交互）
        if (module.initialize && typeof module.initialize === 'function') {
            module.initialize(drawCanvas);
        }

        // 7. 所有准备工作完成，执行第一次绘制
        drawCanvas();

    } catch (error) {
        console.error(`加载模板 "${templateName}" 失败:`, error);
        templateControlsContainer.innerHTML = `<p style="color: red;">加载模板失败，请检查浏览器控制台获取详细错误信息。</p>`;
    }
}


// --- 应用程序初始化 ---

// 1. 监听模板下拉选择框的 'change' 事件
templateSelect.addEventListener('change', (e) => {
    switchTemplate(e.target.value);
});

// 2. 为下载按钮绑定 'click' 事件
downloadBtn.addEventListener('click', () => {
    if (!currentTemplateModule) {
        alert("请先选择一个模板！");
        return;
    }
    // 生成一个带日期和模板名的文件名，例如 "wechat-success-2025-10-23.png"
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const fileName = `${templateSelect.value}-${year}-${month}-${day}.png`;
    
    // 创建一个临时的 a 标签来触发浏览器下载
    const link = document.createElement('a');
    link.download = fileName; 
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// 3. 页面首次加载时，自动加载下拉框中默认选中的模板
switchTemplate(templateSelect.value);
