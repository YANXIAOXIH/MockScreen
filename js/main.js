// --- 全局变量和元素获取 ---
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const templateSelect = document.getElementById('template-select');
const downloadBtn = document.getElementById('download-btn');
const templateControlsContainer = document.getElementById('template-controls-container');

// 存储当前模板的模块和已加载的资源
let currentTemplateModule = null;
let currentLoadedAssets = {};

// --- 函数定义 ---

/**
 * 根据传入的资源列表，加载图片资源。
 * @param {object} assetsToLoad - 作为一个参数传入，不再依赖外部变量。
 * @returns {Promise<object>} - 返回一个Promise，成功时会提供加载好的资源对象。
 */
function loadAssets(assetsToLoad) {
    if (!assetsToLoad || Object.keys(assetsToLoad).length === 0) {
        return Promise.resolve({}); // 处理没有资源的情况
    }

    const promises = Object.entries(assetsToLoad).map(([key, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            // [关键改进]：不再修改外部变量，而是将结果通过 resolve 传出去
            img.onload = () => resolve({ key, img }); 
            img.onerror = () => reject(`资源加载失败: ${src}`);
            img.src = src;
        });
    });

    // [关键改进]：Promise.all 之后，将结果处理成一个干净的对象并返回
    return Promise.all(promises).then(results => {
        const loaded = {};
        results.forEach(({ key, img }) => { loaded[key] = img; });
        return loaded; // 函数的输出清晰明确
    });
}

/**
 * 主绘制函数。
 */
function drawCanvas() {
    if (!currentTemplateModule) return;

    const template = currentTemplateModule.template;
    const config = template.config;
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;

    const controls = {};
    document.querySelectorAll('#template-controls-container .control').forEach(el => {
        const id = el.dataset.id;
        if (el.type === 'radio') {
            if (el.checked) controls[id] = el.value;
        } else {
            controls[id] = el.type === 'checkbox' ? el.checked : el.value;
        }
    });

    template.draw(ctx, config, controls, currentLoadedAssets);
}

/**
 * 为动态加载的控件绑定事件监听器。
 */
function bindControlListeners() {
    // 实时更新
    document.querySelectorAll('#template-controls-container .control').forEach(element => {
        element.addEventListener('input', drawCanvas);
    });

    // 快捷按钮
    document.querySelectorAll('#template-controls-container .quick-buttons button').forEach(button => {
        button.addEventListener('click', () => {
            const targetInput = document.querySelector(`.control[data-id="${button.dataset.target}"]`);
            if (targetInput) {
                targetInput.value = button.dataset.value;
                targetInput.dispatchEvent(new Event('input'));
            }
        });
    });
    
    // 滑块数值显示
    document.querySelectorAll('#template-controls-container input[type="range"].control').forEach(slider => {
        const valueSpan = document.querySelector(`.control-value[data-id="${slider.dataset.id}Value"]`);
        if(valueSpan) {
            // 初始化显示
            valueSpan.textContent = slider.value;
            // 监听输入
            slider.addEventListener('input', () => {
                valueSpan.textContent = slider.value;
            });
        }
    });
}

/**
 * [核心改动] 切换模板的函数，现在会执行模板的初始化脚本。
 * @param {string} templateName - 要切换到的模板的名称 (即文件夹名)。
 */
async function switchTemplate(templateName) {
    const modulePath = `../templates/${templateName}/main.js`;

    try {
        templateControlsContainer.innerHTML = `<p>正在加载模板: ${templateName}...</p>`;
        
        // 1. 动态导入模板的JS模块
        const module = await import(modulePath);
        currentTemplateModule = module;
        const template = module.template;

        // 2. 注入HTML控件
        templateControlsContainer.innerHTML = template.getControlsHTML();

        // 3. 加载该模板所需的资源
        currentLoadedAssets = await loadAssets(template.assets);
        
        // 4. 为新注入的HTML控件绑定通用事件
        bindControlListeners();

        // [新] 5. 检查并执行模板专属的初始化函数
        // 如果 alipay-success.js 导出了 initialize 函数，就在这里执行它
        if (module.initialize && typeof module.initialize === 'function') {
            // 我们把主绘图函数 drawCanvas 作为回调传进去，
            // 这样模板的内部逻辑就可以在需要时触发重绘。
            module.initialize(drawCanvas);
        }

        // 6. 执行第一次绘制
        drawCanvas();

    } catch (error) {
        console.error(`加载模板 "${templateName}" 失败:`, error);
        templateControlsContainer.innerHTML = `<p style="color: red;">加载模板失败，请检查控制台获取更多信息。</p>`;
    }
}

// --- 程序初始化 ---

// 监听模板下拉框的变化
templateSelect.addEventListener('change', (e) => {
    switchTemplate(e.target.value);
});

// 绑定下载按钮事件
downloadBtn.addEventListener('click', () => {
    if (!currentTemplateModule) {
        alert("请先选择一个模板！");
        return;
    }
    // --- 日期格式化逻辑 ---

    // 1. 获取当前日期和时间
    const now = new Date();

    // 2. 格式化日期和时间的各个部分，并确保它们是两位数 (例如 09 而不是 9)
    //    String.padStart(2, '0') 的作用就是如果字符串不足两位，就在前面补 '0'
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份是从0开始的(0-11)，所以需要+1
    const day = String(now.getDate()).padStart(2, '0');

    // 3. 将格式化后的部分拼接成一个完整的文件名字符串
    //    格式如: alipay-success-2025-10-27.png
    const fileName = `${templateSelect.value}-${year}-${month}-${day}.png`;

    // --- 结束新增的日期格式化逻辑 ---
    const link = document.createElement('a');
    
    // 4. 使用我们新生成的、包含日期的文件名
    link.download = fileName; 
    
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// 首次加载，默认加载 `templateSelect` 中选中的模板
switchTemplate(templateSelect.value);