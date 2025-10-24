/**
 * @file 微信支付成功页 - 模板模块
 * @description
 * 定义了“微信支付成功”模板的所有专属配置、UI控件、交互逻辑和 Canvas 绘制方法。
 * 该模块以 ES Module 的形式导出，由主应用 main.js 动态加载。
 */

import { drawRoundedRect } from '../../js/utils.js';

// --- 模块级状态变量 ---

/**
 * @type {string[]}
 * @description 实时存储用户在状态栏左侧区域排列的图标ID顺序。
 */
let leftIconOrder = [];

/**
 * @type {string[]}
 * @description 实时存储用户在状态栏右侧区域排列的图标ID顺序。
 */
let rightIconOrder = [];


// --- 模板专属功能 ---

/**
 * 模板专属的初始化函数。
 * 在模板加载后由主应用调用，负责为该模板的动态HTML控件绑定所有特殊的交互事件。
 * 核心功能是实现状态栏图标的拖放排序和点击切换。
 * @param {function} drawCanvas - 对主绘图函数的回调引用，用于在交互后触发画布重绘。
 */
export function initialize(drawCanvas) {
    const container = document.getElementById('template-controls-container');
    if (!container) return;

    // --- 1. 获取核心 DOM 元素 ---
    const leftDropzone = container.querySelector('#left-icons-dropzone');
    const rightDropzone = container.querySelector('#right-icons-dropzone');
    const availableDropzone = container.querySelector('#available-icons-dropzone');
    if (!leftDropzone || !rightDropzone || !availableDropzone) return;
    
    // --- 2. 定义辅助函数 ---

    /**
     * 从 DOM 中读取并更新左右两侧的图标顺序数组。
     */
    const updateAllOrders = () => {
        leftIconOrder = Array.from(leftDropzone.querySelectorAll('.icon-option')).map(icon => icon.dataset.target);
        rightIconOrder = Array.from(rightDropzone.querySelectorAll('.icon-option')).map(icon => icon.dataset.target);
    };

    /**
     * 同步图标的视觉状态（是否激活）与其背后隐藏的复选框（checkbox）的 `checked` 状态。
     * 这是将 UI 表现与实际数据（是否绘制）关联起来的关键。
     * @param {HTMLElement} icon - 被操作的图标元素。
     * @param {boolean} isActive - 图标是否应处于激活状态。
     */
    const syncCheckboxState = (icon, isActive) => {
        const checkbox = container.querySelector(`.control[data-id="${icon.dataset.target}"]`);
        if (checkbox) {
            checkbox.checked = isActive;
            icon.classList.toggle('active', isActive);
            // 手动触发 input 事件，确保主应用的 drawCanvas 函数能够接收到状态变更。
            checkbox.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };
    
    // --- 3. 初始化图标位置 ---
    // 遍历所有图标，如果其对应的隐藏复选框默认是 checked 状态，则将其从“图标库”移动到对应的状态栏区域。
    availableDropzone.querySelectorAll('.icon-option[data-draggable="true"]').forEach(icon => {
        const checkbox = container.querySelector(`.control[data-id="${icon.dataset.target}"]`);
        if (checkbox && checkbox.checked) {
            const targetId = icon.dataset.target.toLowerCase();
            // 根据图标类型，智能判断应该放入左侧还是右侧
            if (targetId.includes('lte') || targetId.includes('wifi') || targetId.includes('5g')) {
                rightDropzone.appendChild(icon);
            } else {
                leftDropzone.appendChild(icon);
            }
            icon.classList.add('active');
        }
    });
    updateAllOrders(); // 更新初始顺序

    // --- 4. 实现图标的拖放（Drag & Drop）功能 ---
    let draggedItem = null; // 用于在拖放操作期间引用被拖动的元素

    // 使所有可拖动的图标都具有 draggable 属性
    container.querySelectorAll('.icon-option[data-draggable="true"]').forEach(icon => { icon.draggable = true; });
    
    // 使用事件委托，在父容器上监听拖拽开始事件
    container.addEventListener('dragstart', (event) => {
        if (event.target.matches('.icon-option[data-draggable="true"]')) {
            draggedItem = event.target;
            // 使用 setTimeout 让浏览器有时间响应拖拽开始，然后再改变元素样式
            setTimeout(() => { if(draggedItem) draggedItem.style.opacity = '0.5'; }, 0);
        }
    });

    // 拖拽结束时，清理状态并重绘
    container.addEventListener('dragend', () => {
        if (draggedItem) {
            draggedItem.style.opacity = '1';
            draggedItem = null;
            [leftDropzone, rightDropzone, availableDropzone].forEach(z => z.classList.remove('drag-over'));
            updateAllOrders(); // 拖拽结束后，务必更新图标顺序
            drawCanvas();      // 并重绘 Canvas
        }
    });

    // 为所有三个可放置区域添加拖放事件监听
    [leftDropzone, rightDropzone, availableDropzone].forEach(zone => {
        zone.addEventListener('dragover', (event) => {
            event.preventDefault(); // 必须阻止默认行为，才能触发 drop 事件
            zone.classList.add('drag-over');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
        zone.addEventListener('drop', (event) => {
            event.preventDefault();
            zone.classList.remove('drag-over');
            if (!draggedItem) return;

            // 计算拖放位置，实现平滑插入排序效果
            const afterElement = getDragAfterElement(zone, event.clientX);
            if (afterElement) {
                zone.insertBefore(draggedItem, afterElement);
            } else {
                zone.appendChild(draggedItem);
            }
            
            // 如果图标被拖入“图标库”，则视为“取消激活”，否则视为“激活”
            syncCheckboxState(draggedItem, zone !== availableDropzone);
        });
    });

    /**
     * 计算在容器中，当前鼠标位置后面应该跟随哪个元素。
     * @param {HTMLElement} container - 放置区容器。
     * @param {number} x - 鼠标的水平坐标。
     * @returns {HTMLElement|null} 返回应该被插入的元素，如果应插在末尾则返回 null。
     */
    function getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.icon-option:not([style*="opacity: 0.5"])')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // --- 5. 实现图标的快捷点击切换功能 ---
    container.addEventListener('click', (event) => {
        const clickedIcon = event.target.closest('.icon-option[data-draggable="true"]');
        if (!clickedIcon) return;

        // 如果图标在“图标库”中，点击则默认添加到左侧
        if (clickedIcon.parentElement === availableDropzone) {
            leftDropzone.appendChild(clickedIcon);
            syncCheckboxState(clickedIcon, true);
        } else { // 如果图标已在状态栏中，点击则送回“图标库”
            availableDropzone.appendChild(clickedIcon);
            syncCheckboxState(clickedIcon, false);
        }
        updateAllOrders();
        drawCanvas();
    });
}

/**
 * @type {object}
 * @description
 * 导出的模板定义对象。
 * 主应用 `main.js` 会读取这个对象来获取模板的所有配置信息和绘制能力。
 */
export const template = {

    // === 1. 模板主题 ===
    // 用于主应用判断加载白天（''）还是黑夜（'nighi'）风格的通用图标。
    theme: 'night',
    
    // === 2. 模板专属资源 ===
    // 定义只有本模板才会用到的图片资源。
    assets: {
        bg: 'templates/wechat-success/icons/background.png',
        notificationBanner: 'templates/wechat-success/icons/payicon.png',
        helpIcon: 'templates/wechat-success/icons/help-flower.png',
        shakeBanner1: 'templates/wechat-success/icons/reward-1.png',
        shakeBanner2: 'templates/wechat-success/icons/reward-2.png'
    },

    // === 3. 布局与样式配置中心 ===
    // 将所有可调整的“魔法数字”（如坐标、字体、颜色）集中存放，便于维护。
    config: {
        canvasWidth: 1290,                  // 画布的总宽度 (px)
        canvasHeight: 2796,                 // 画布的总高度 (px)
        
        // [状态栏] 相关配置
        statusBar: { 
            baseY: 88,                      // [状态栏] 所有元素的垂直对齐基线Y坐标
            timeX: 140,                     // [状态栏] 时间文本的起始X坐标
            timeFont: 'bold 50px "PingFang"',// [状态栏] 时间文本的字体样式
            iconstartX: 290,                // [状态栏] 左侧第一个图标的起始X坐标
            iconHeight: 36,                 // [状态栏] 左侧图标的统一高度
            IconGap: 20,                    // [状态栏] 图标之间的水平间隙
            signalIconHeight: 42,           // [状态栏] 右侧信号类图标(Wi-Fi, LTE)的高度
            signalIconGapToBattery: 22,     // [状态栏] 最右侧信号图标与电池图标之间的间距
            batteryX: 1087,                 // [状态栏] 电池图标外框的起始X坐标
            batteryWidth: 80,               // [状态栏] 电池图标外框的总宽度
            batteryHeight: 38               // [状态栏] 电池图标外框的总高度
        },
        
        // [顶部通知] 相关配置
        notification: {
            y: 133,                         // [顶部通知] 支付通知横幅图片的顶部Y坐标
            amountX: 389,                   // [顶部通知] 金额文本的起始X坐标
            amountY: 308,                   // [顶部通知] 金额文本的Y坐标
            amountFont: '40px "PingFang"',  // [顶部通知] 金额文本的字体样式
            amountColor: '#6e6e6e'          // [顶部通知] 金额文本的颜色
        },

        // [核心内容] 相关配置
        mainContent: {
            merchantY: 600,                 // [核心内容] 商家名称文本的Y坐标
            merchantFont: '55px "AlipayNumber"',// [核心内容] 商家名称文本的字体样式
            amountY: 700,                   // [核心内容] 支付金额文本的Y坐标
            amountFont: 'bold 140px "AlipayNumber"',// [核心内容] 支付金额数字部分的字体样式
            currencyFont: 'bold 101px "AlipayNumber"',// [核心内容] 货币符号(¥)的字体样式
            currencyGap: 5                  // [核心内容] 货币符号与金额数字之间的间隙
        },
        
        // [优惠券] 相关配置
        shakeBanner: {
            y: 965                          // [优惠券] 摇一摇优惠券图片的顶部Y坐标
        },

        // [底部助力] 相关配置
        helpLink: {
            y: 2125,                        // [底部助力] "爱心助力"整行内容的垂直对齐基线Y坐标
            iconSize: 45,                   // [底部助力] 助力图标的尺寸 (宽度和高度)
            iconTextGap: 25,                // [底部助力] 助力图标与右侧文本之间的间隙
            font: '40px "PingFang"',        // [底部助力] 助力文本的字体样式
        },

        // [颜色] 相关配置
        colors: { 
            statusBar: '#000000',           // [颜色] 状态栏所有元素的颜色
            mainText: '#1a1a1a',            // [颜色] 页面主要文本颜色 (如商家名称)
            amountColor: '#1a1a1a',         // [颜色] 支付金额的颜色
            subText: '#808080'              // [颜色] 辅助性文本颜色 (如底部助力链接)
        }
    },
    
    /**
     * @returns {string} 返回用于生成此模板控制面板的 HTML 字符串。
     * `<!-- ICON_CONTROLS_PLACEHOLDER -->` 是一个特殊的占位符，
     * 主应用会将其替换为通用的状态栏图标控件。
     */
    getControlsHTML: () => `
        <fieldset>
            <legend>顶部状态栏</legend>
            <!-- ICON_CONTROLS_PLACEHOLDER -->
            <div class="input-group"><label>时间</label><input type="time" class="control" data-id="time" value="18:45"></div>
            <div class="input-group">
                <label>电池电量: <span class="control-value" data-id="batteryValue">80</span>%</label>
                <input type="range" class="control" data-id="battery" min="0" max="100" value="80">
            </div>
        </fieldset>
        
        <fieldset>
            <legend>页面内容</legend>
            <div class="input-group"><label>商家名称</label><input type="text" class="control" data-id="merchantName" value="简知"></div>
            <div class="input-group"><label>支付金额</label><input type="text" class="control" data-id="amount" value="4680"></div>
            <div class="input-group checkbox-group">
                <input type="checkbox" class="control" data-id="notificationToggle"><label>显示顶部支付通知</label>
            </div>
            <div class="input-group">
                <label>摇一摇优惠</label>
                <div class="radio-group" style="display: flex; gap: 15px; align-items: center;">
                    <input type="radio" name="shake-banner" class="control" data-id="shakeBannerSelection" value="shakeBanner1" checked> <label>样式一</label>
                    <input type="radio" name="shake-banner" class="control" data-id="shakeBannerSelection" value="shakeBanner2"> <label>样式二</label>
                    <input type="radio" name="shake-banner" class="control" data-id="shakeBannerSelection" value="none"> <label>不显示</label>
                </div>
            </div>
            <div class="input-group">
                <label>爱心助力</label>
                <input type="text" class="control" data-id="helpLinkText" value="助力乡村儿童营养改善">
                <div class="quick-buttons">
                    <button data-target="helpLinkText" data-value="助力乡村幼童科学养育">幼童科学</button>
                    <button data-target="helpLinkText" data-value="助力乡村儿童营养改善">儿童营养</button>
                    <button data-target="helpLinkText" data-value="关爱亚洲黑熊">亚洲黑熊</button>
                    <button data-target="helpLinkText" data-value="为环卫工人送爱心餐">环卫工人</button>
                </div>
            </div>
        </fieldset>
    `,

    /**
     * 模板的核心绘制函数。
     * 接收 Canvas 上下文、配置、用户输入和已加载的资源，然后将模板内容绘制到画布上。
     * @param {CanvasRenderingContext2D} ctx - 2D 绘图上下文。
     * @param {object} config - 从本模板 config 属性传入的配置对象。
     * @param {object} controls - 从控制面板收集到的用户输入值。
     * @param {object} assets - 包含所有已加载图片资源（Image 对象）的对象。
     */
    draw: (ctx, config, controls, assets) => {
        if (!assets.bg) return; // 安全检查，确保背景已加载

        // 步骤 1: 清空画布并绘制背景
        ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
        ctx.drawImage(assets.bg, 0, 0);

        // 步骤 2: 绘制状态栏
        const st = config.statusBar; 
        ctx.fillStyle = config.colors.statusBar; 
        ctx.font = st.timeFont;
        ctx.textAlign = 'left'; 
        ctx.textBaseline = 'middle';
        ctx.fillText(controls.time, st.timeX, st.baseY);
        


        // --- 绘制左侧图标 ---
        let currentIconX = st.iconstartX;
        const iconY = st.baseY - (st.iconHeight / 2);
        leftIconOrder.forEach(targetId => {
            const assetKey = targetId.replace('Toggle', '');
            const asset = assets[assetKey];
            if (asset && controls[targetId]) {
                const calculatedWidth = st.iconHeight * (asset.width / asset.height);
                ctx.drawImage(asset, currentIconX, iconY, calculatedWidth, st.iconHeight);
                currentIconX += calculatedWidth + st.IconGap;
            }
        });

        // --- 绘制右侧图标 ---
        let currentSignalX = st.batteryX - st.signalIconGapToBattery;
        rightIconOrder.forEach(targetId => {
            const assetKey = targetId.replace('Toggle', '');
            const asset = assets[assetKey]; 
            const iconHeight = st.signalIconHeight;
            const signalIconY = st.baseY - (iconHeight / 2);
            
            if (asset && controls[targetId]) {
                const calculatedWidth = iconHeight * (asset.width / asset.height);
                const iconX = currentSignalX - calculatedWidth; // 先计算出图标的左侧 X 坐标
                ctx.drawImage(asset, iconX, signalIconY, calculatedWidth, iconHeight);
                currentSignalX = iconX - st.IconGap; // 更新下一个图标的绘制起点
            }
        });
        
        // --- 绘制电池 ---
        // 电池填充宽度根据电量百分比计算，并留出内边距。
        const batteryY = st.baseY - st.batteryHeight / 2; 
        if (controls.battery > 0) { 
            const fillWidth = (st.batteryWidth - 8) * (controls.battery / 100);
            drawRoundedRect(ctx, st.batteryX + 4, batteryY + 2, fillWidth, st.batteryHeight - 8, 8); 
            ctx.fill(); 
        }

        // 步骤 3: 绘制页面主体内容
        
        // --- 绘制顶部微信支付通知 (如果用户勾选) ---
        if (controls.notificationToggle && assets.notificationBanner) {
            const nf = config.notification;
            const banner = assets.notificationBanner;
            const bannerX = (config.canvasWidth - banner.width) / 2;
            ctx.drawImage(banner, bannerX, nf.y);
            
            ctx.fillStyle = nf.amountColor;
            ctx.font = nf.amountFont;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const amountValue = (parseFloat(controls.amount) || 0).toFixed(2);
            ctx.fillText(`${amountValue}`, nf.amountX, nf.amountY);
        }

        // --- 绘制核心支付信息 (商家与金额) ---
        const mc = config.mainContent;
        ctx.fillStyle = config.colors.mainText;
        ctx.font = mc.merchantFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(controls.merchantName, config.canvasWidth / 2, mc.merchantY);

        // --- 绘制支付金额 (¥ 和数字)，并使其整体居中 ---
        ctx.fillStyle = config.colors.amountColor; 
        const amountText = (parseFloat(controls.amount) || 0).toFixed(2);
        const currencySymbol = '¥ ';
        // 1. 分别测量货币符号和金额数字的宽度
        ctx.font = mc.currencyFont;
        const currencyWidth = ctx.measureText(currencySymbol).width;
        ctx.font = mc.amountFont;
        const amountWidth = ctx.measureText(amountText).width;
        // 2. 计算总宽度并确定绘制起点 X
        const totalWidth = currencyWidth + mc.currencyGap + amountWidth;
        const startX = (config.canvasWidth - totalWidth) / 2;
        // 3. 依次绘制
        ctx.textAlign = 'left'; 
        ctx.textBaseline = 'top'; // 使用 'top' 基线便于对齐
        ctx.font = mc.currencyFont;
        ctx.fillText(currencySymbol, startX, mc.amountY);
        ctx.font = mc.amountFont;
        ctx.fillText(amountText, startX + currencyWidth + mc.currencyGap, mc.amountY);

        // --- 绘制可选的优惠券 (根据用户的 radio 选择) ---
        const selectedBannerKey = controls.shakeBannerSelection;
        if (selectedBannerKey && selectedBannerKey !== 'none') {
            const bannerAsset = assets[selectedBannerKey];
            if (bannerAsset) {
                const bannerX = (config.canvasWidth - bannerAsset.width) / 2;
                ctx.drawImage(bannerAsset, bannerX, config.shakeBanner.y);
            }
        }

        // --- 绘制底部助力链接 (如果用户输入了文本) ---
        if (controls.helpLinkText && controls.helpLinkText.trim() !== '') {
            const hl = config.helpLink;
            ctx.font = hl.font;
            const dynamicText = controls.helpLinkText.trim() + ' >';
            const helpTextWidth = ctx.measureText(dynamicText).width;
            const helpTotalWidth = hl.iconSize + hl.iconTextGap + helpTextWidth;
            const helpStartX = (config.canvasWidth - helpTotalWidth) / 2;

            if (assets.helpIcon) {
                ctx.drawImage(assets.helpIcon, helpStartX, hl.y - hl.iconSize/2, hl.iconSize, hl.iconSize);
            }

            ctx.fillStyle = config.colors.subText;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(dynamicText, helpStartX + hl.iconSize + hl.iconTextGap, hl.y);
        }
    }
};
