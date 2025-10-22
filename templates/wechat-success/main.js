/**
 * @file 微信支付成功页模板 - 核心逻辑与配置
 * @description 该文件定义了模板的所有行为，包括UI控件、资源、布局配置和绘制逻辑。
 */

import { drawRoundedRect } from '../../js/utils.js';

/**
 * 模板专属的初始化函数。
 * 当模板被加载时，此函数会被主程序调用，用于绑定所有交互事件，
 * 例如状态栏图标的点击切换、拖拽排序以及Wi-Fi/LTE的互斥选择。
 * @param {function} drawCanvas - 主绘图函数的回调。在UI控件状态变更后调用此函数，以触发画布的实时重绘。
 */
export function initialize(drawCanvas) {
    const container = document.getElementById('template-controls-container');
    if (!container) return;

    // --- 核心逻辑: 状态栏图标点击切换 ---
    // 遍历所有图标控件，为其绑定点击事件。
    const statusBarIconOptions = container.querySelectorAll('.icon-option');
    statusBarIconOptions.forEach(icon => {
        const targetId = icon.dataset.target;
        const checkbox = container.querySelector(`.control[data-id="${targetId}"]`);
        
        // 初始化时，根据复选框的默认`checked`状态，同步更新图标的`.active`高亮样式。
        if (checkbox && checkbox.checked) {
            icon.classList.add('active');
        }

        // 为每个图标绑定点击监听器。
        icon.addEventListener('click', () => {
            const clickedIcon = event.currentTarget;
            const targetCheckbox = container.querySelector(`.control[data-id="${clickedIcon.dataset.target}"]`);
            if (!targetCheckbox) return;

            // 核心: 同步UI与数据。切换图标的UI激活状态，并更新背后隐藏复选框的`checked`属性。
            clickedIcon.classList.toggle('active');
            targetCheckbox.checked = clickedIcon.classList.contains('active');
            
            // --- 核心逻辑: WiFi 与 LTE 互斥选择 ---
            const clickedTarget = clickedIcon.dataset.target;
            const isNowActive = clickedIcon.classList.contains('active');

            // 场景1: 如果本次操作激活了Wi-Fi，则强制关闭LTE。
            if (clickedTarget === 'wifiIconToggle' && isNowActive) {
                const lteIcon = container.querySelector('.icon-option[data-target="lteIconToggle"]');
                const lteCheckbox = container.querySelector('.control[data-id="lteIconToggle"]');
                if (lteIcon && lteCheckbox) {
                    lteIcon.classList.remove('active');
                    lteCheckbox.checked = false;
                }
            }
            // 场景2: 如果本次操作激活了LTE，则强制关闭Wi-Fi。
            if (clickedTarget === 'lteIconToggle' && isNowActive) {
                const wifiIcon = container.querySelector('.icon-option[data-target="wifiIconToggle"]');
                const wifiCheckbox = container.querySelector('.control[data-id="wifiIconToggle"]');
                if (wifiIcon && wifiCheckbox) {
                    wifiIcon.classList.remove('active');
                    wifiCheckbox.checked = false;
                }
            }

            // 触发input事件，通知主程序数据已变更，需要重绘画布。
            targetCheckbox.dispatchEvent(new Event('input'));
        });
    });
    
    // --- 核心逻辑: 左侧状态栏图标拖拽排序 ---
    // 使用HTML5原生拖放API在单个容器内实现特定元素的排序功能。
    const iconContainer = container.querySelector('.statusbar-icon-selector');
    if (iconContainer) {
        // 筛选出所有标记为`data-draggable="true"`的图标，并使其可被拖动。
        const draggableIcons = iconContainer.querySelectorAll('.icon-option[data-draggable="true"]');
        draggableIcons.forEach(icon => {
            icon.draggable = true;
        });

        let draggedItem = null; // 用于在拖拽会话中引用当前被拖动的元素。

        // 监听拖拽开始事件。
        iconContainer.addEventListener('dragstart', (event) => {
            // 安全检查：仅当拖拽源是可拖拽图标时才继续。
            if (event.target.dataset.draggable) {
                draggedItem = event.target;
                // 使用微任务延时，避免拖拽时元素自身的视觉残留。
                setTimeout(() => {
                    if (draggedItem) draggedItem.style.opacity = '0.5';
                }, 0);
            }
        });

        // 监听拖拽结束事件（无论成功与否）。
        iconContainer.addEventListener('dragend', () => {
            if (draggedItem) {
                draggedItem.style.opacity = '1'; // 恢复元素的正常外观。
                draggedItem = null;
                drawCanvas(); // 排序已在DOM中完成，触发重绘以更新画布。
            }
        });

        // 监听拖拽元素在放置目标上移动的事件。
        iconContainer.addEventListener('dragover', (event) => {
            event.preventDefault(); // 必须阻止默认行为，才能触发drop事件。
            if (!draggedItem) return;

            // 计算被拖拽元素应插入到哪个元素之前。
            const afterElement = getDragAfterElement(iconContainer, event.clientX);
            
            if (afterElement == null) {
                // 如果没有找到后续元素（即应放在末尾），则将其插入到第一个非拖拽元素之前。
                const firstNonDraggable = iconContainer.querySelector('.icon-option:not([data-draggable="true"]), .icon-spacer');
                if (firstNonDraggable) {
                    iconContainer.insertBefore(draggedItem, firstNonDraggable);
                } else {
                    iconContainer.appendChild(draggedItem); // 兼容无固定图标的情况。
                }
            } else {
                iconContainer.insertBefore(draggedItem, afterElement);
            }
        });

        /**
         * 计算并返回在拖拽过程中，被拖拽元素应当插入到哪个兄弟元素的前面。
         * @param {HTMLElement} container - 拖拽区域的容器元素。
         * @param {number} x - 鼠标当前的水平坐标。
         * @returns {HTMLElement|null} - 目标兄弟元素，如果应放在末尾则返回null。
         */
        function getDragAfterElement(container, x) {
            const draggableElements = [...container.querySelectorAll('.icon-option[data-draggable="true"]:not([style*="opacity: 0.5"])')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = x - box.left - box.width / 2;
                // 寻找鼠标右侧最近的元素。
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
    }
}


/**
 * @type {object}
 * @description 导出的模板配置对象，包含了模板所需的所有静态信息和函数。
 * 主程序将通过此对象来加载模板的资源、生成控制UI并执行绘制。
 */
export const template = {
    // =================================================================================
    // 资源文件路径定义
    // 键名用于在代码中引用，键值为相对于项目根目录的路径。
    // =================================================================================
    assets: {
        locationIcon: 'icons/IoslocatnighiIcon.png',
        alarmIcon: 'icons/IosalarmnighiIcon.png',
        bellIcon: 'icons/IosBellnighiIcon.png',
        userIcon: 'icons/IosusernighiIcon.png',
        sleepIcon: 'icons/IossleepnighiIcon.png',
        wifiIcon: 'icons/IosWifinighiIcon.png',
        lteIcon: 'icons/Ios5GnighiIcon.png',
        bg: 'templates/wechat-success/icons/background.png',
        notificationBanner: 'templates/wechat-success/icons/payicon.png',
        helpIcon: 'templates/wechat-success/icons/help-flower.png',
        shakeBanner1: 'templates/wechat-success/icons/reward-1.png',
        shakeBanner2: 'templates/wechat-success/icons/reward-2.png'
    },

    // =================================================================================
    // 模板布局与样式配置中心
    // 集中管理所有绘制相关的尺寸、坐标、字体和颜色，便于后期调整。
    // =================================================================================
    config: {
        canvasWidth: 1290,                  // 画布的总宽度 (px)
        canvasHeight: 2796,                 // 画布的总高度 (px)
        
        statusBar: { 
            baseY: 88,                      // [状态栏] 所有元素的垂直对齐基线Y坐标
            timeX: 140,                     // [状态栏] 时间文本的起始X坐标
            timeFont: 'bold 50px "PingFang"',// [状态栏] 时间文本的字体样式
            iconstartX: 290,                // [状态栏] 左侧第一个图标的起始X坐标
            iconHeight: 35,                 // [状态栏] 左侧图标的统一高度
            IconGap: 20,                    // [状态栏] 图标之间的水平间隙
            signalIconHeight: 42,           // [状态栏] 右侧信号类图标(Wi-Fi, LTE)的高度
            signalIconGapToBattery: 25,     // [状态栏] 最右侧信号图标与电池图标之间的间距
            batteryX: 1087,                 // [状态栏] 电池图标外框的起始X坐标
            batteryWidth: 80,               // [状态栏] 电池图标外框的总宽度
            batteryHeight: 38               // [状态栏] 电池图标外框的总高度
        },
        
        notification: {
            y: 133,                         // [顶部通知] 支付通知横幅图片的顶部Y坐标
            amountX: 389,                   // [顶部通知] 金额文本的起始X坐标
            amountY: 308,                   // [顶部通知] 金额文本的Y坐标
            amountFont: '40px "PingFang"',  // [顶部通知] 金额文本的字体样式
            amountColor: '#6e6e6e'          // [顶部通知] 金额文本的颜色
        },

        mainContent: {
            merchantY: 600,                 // [核心内容] 商家名称文本的Y坐标
            merchantFont: '55px "AlipayNumber"',// [核心内容] 商家名称文本的字体样式
            amountY: 700,                   // [核心内容] 支付金额文本的Y坐标
            amountFont: 'bold 140px "AlipayNumber"',// [核心内容] 支付金额数字部分的字体样式
            currencyFont: 'bold 101px "AlipayNumber"',// [核心内容] 货币符号(¥)的字体样式
            currencyGap: 5                  // [核心内容] 货币符号与金额数字之间的间隙
        },
        
        shakeBanner: {
            y: 965                          // [优惠券] 摇一摇优惠券图片的顶部Y坐标
        },

        helpLink: {
            y: 2125,                        // [底部助力] "爱心助力"整行内容的垂直对齐基线Y坐标
            iconSize: 45,                   // [底部助力] 助力图标的尺寸 (宽度和高度)
            iconTextGap: 25,                // [底部助力] 助力图标与右侧文本之间的间隙
            font: '40px "PingFang"',        // [底部助力] 助力文本的字体样式
        },

        colors: { 
            statusBar: '#000000',           // [颜色] 状态栏所有元素的颜色
            mainText: '#1a1a1a',            // [颜色] 页面主要文本颜色 (如商家名称)
            amountColor: '#1a1a1a',         // [颜色] 支付金额的颜色
            subText: '#808080'              // [颜色] 辅助性文本颜色 (如底部助力链接)
        }
    },
    
    /**
     * @returns {string} - 返回用于生成模板控制面板的HTML字符串。
     */
    getControlsHTML: () => `
        <fieldset>
            <legend>顶部状态栏</legend>
            <div class="input-group">
                <label>状态栏图标 (可拖拽排序)</label>
                <div class="statusbar-icon-selector">
                    <!-- 可拖拽图标: data-draggable="true" 是实现拖拽的关键标记 -->
                    <div class="icon-option icon-location" data-target="locationToggle" data-draggable="true"></div>
                    <div class="icon-option icon-alarm" data-target="alarmIconToggle" data-draggable="true"></div>
                    <div class="icon-option icon-bell" data-target="bellIconToggle" data-draggable="true"></div>
                    <div class="icon-option icon-user" data-target="userIconToggle" data-draggable="true"></div>
                    <div class="icon-option icon-sleep" data-target="sleepIconToggle" data-draggable="true"></div>
                    
                    <!-- 弹性分隔符: 利用flex-grow将固定图标推到容器右侧 -->
                    <div class="icon-spacer" style="flex-grow: 1;"></div>
                    
                    <!-- 固定图标: 没有data-draggable属性，不会响应拖拽事件 -->
                    <div class="icon-option icon-wifi" data-target="wifiIconToggle"></div>
                    <div class="icon-option icon-lte active" data-target="lteIconToggle"></div>
                </div>
            </div>
            
            <!-- 隐藏的复选框: 作为图标状态的真实数据源 -->
            <input type="checkbox" class="control" data-id="locationToggle" style="display: none;">
            <input type="checkbox" class="control" data-id="alarmIconToggle" style="display: none;">
            <input type="checkbox" class="control" data-id="bellIconToggle" style="display: none;">
            <input type="checkbox" class="control" data-id="userIconToggle" style="display: none;">
            <input type="checkbox" class="control" data-id="sleepIconToggle" style="display: none;">
            <input type="checkbox" class="control" data-id="wifiIconToggle" style="display: none;">
            <input type="checkbox" class="control" data-id="lteIconToggle" checked style="display: none;">

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
     * @param {CanvasRenderingContext2D} ctx - Canvas的2D渲染上下文。
     * @param {object} config - 包含所有布局和样式信息的配置对象。
     * @param {object} controls - 包含所有UI控件当前值的键值对对象。
     * @param {object} assets - 包含所有已加载图片资源的Image对象。
     */
    draw: (ctx, config, controls, assets) => {
        // 绘制前置检查
        if (!assets.bg) return;

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
        
        // 核心绘制逻辑: 左侧可排序图标
        let currentIconX = st.iconstartX;
        const iconY = st.baseY - (st.iconHeight / 2);
        const iconContainer = document.querySelector('.statusbar-icon-selector');
        if (iconContainer) {
            // a. 获取所有可拖拽图标，并保持其在DOM中的当前顺序。
            const orderedDraggableElements = Array.from(iconContainer.querySelectorAll('.icon-option[data-draggable="true"]'));
            const draggableIconMap = {
                locationToggle: assets.locationIcon, alarmIconToggle: assets.alarmIcon, bellIconToggle: assets.bellIcon,
                userIconToggle: assets.userIcon, sleepIconToggle: assets.sleepIcon,
            };

            // b. 过滤出当前被激活（勾选）的图标。
            const visibleIconsToDraw = orderedDraggableElements.filter(el => {
                const targetId = el.dataset.target;
                return controls[targetId] && draggableIconMap[targetId];
            });

            // c. 遍历并按顺序绘制这些可见的图标。
            visibleIconsToDraw.forEach((el, index) => {
                const targetId = el.dataset.target;
                const asset = draggableIconMap[targetId];
                if (asset) {
                    const calculatedWidth = st.iconHeight * (asset.width / asset.height);
                    ctx.drawImage(asset, currentIconX, iconY, calculatedWidth, st.iconHeight);
                    // 最后一个可见图标后面不添加间隙。
                    if (index < visibleIconsToDraw.length - 1) {
                        currentIconX += calculatedWidth + st.IconGap;
                    }
                }
            });
        }
        
        // 核心绘制逻辑: 右侧固定图标 (从右向左绘制)
        let currentSignalX = st.batteryX;
        if (controls.wifiIconToggle && assets.wifiIcon) {
            const asset = assets.wifiIcon;
            const iconHeight = st.signalIconHeight;
            const calculatedWidth = iconHeight * (asset.width / asset.height);
            const iconX = currentSignalX - st.signalIconGapToBattery - calculatedWidth;
            const signalIconY = st.baseY - (iconHeight / 2);
            ctx.drawImage(asset, iconX, signalIconY, calculatedWidth, iconHeight);
            currentSignalX = iconX; // 更新绘制边界
        }
        if (controls.lteIconToggle && assets.lteIcon) {
            const asset = assets.lteIcon;
            const iconHeight = st.signalIconHeight;
            const calculatedWidth = iconHeight * (asset.width / asset.height);
            const iconX = currentSignalX - st.IconGap - calculatedWidth;
            const signalIconY = st.baseY - (iconHeight / 2);
            ctx.drawImage(asset, iconX, signalIconY, calculatedWidth, iconHeight);
        }

        // 绘制电池
        const batteryY = st.baseY - st.batteryHeight / 2; 
        if (controls.battery > 0) { 
            const fillWidth = (st.batteryWidth - 8) * (controls.battery / 100);
            drawRoundedRect(ctx, st.batteryX + 4, batteryY + 2, fillWidth, st.batteryHeight - 8, 8); 
            ctx.fill(); 
        }

        // 步骤 3: 绘制页面主体内容
        // 绘制顶部微信支付通知
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

        // 绘制核心支付信息 (商家与金额)
        const mc = config.mainContent;
        ctx.fillStyle = config.colors.mainText;
        ctx.font = mc.merchantFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(controls.merchantName, config.canvasWidth / 2, mc.merchantY);

        ctx.fillStyle = config.colors.amountColor; 
        const amountText = (parseFloat(controls.amount) || 0).toFixed(2);
        const currencySymbol = '¥ ';
        ctx.font = mc.currencyFont;
        const currencyWidth = ctx.measureText(currencySymbol).width;
        ctx.font = mc.amountFont;
        const amountWidth = ctx.measureText(amountText).width;
        const totalWidth = currencyWidth + mc.currencyGap + amountWidth;
        const startX = (config.canvasWidth - totalWidth) / 2;
        const amountCenterY = mc.amountY;
        ctx.textAlign = 'left'; 
        ctx.textBaseline = 'top';
        ctx.font = mc.currencyFont;
        ctx.fillText(currencySymbol, startX, amountCenterY);
        ctx.font = mc.amountFont;
        ctx.fillText(amountText, startX + currencyWidth + mc.currencyGap, amountCenterY);

        // 绘制可选的优惠券
        const selectedBannerKey = controls.shakeBannerSelection;
        if (selectedBannerKey && selectedBannerKey !== 'none') {
            const bannerAsset = assets[selectedBannerKey];
            if (bannerAsset) {
                const bannerX = (config.canvasWidth - bannerAsset.width) / 2;
                ctx.drawImage(bannerAsset, bannerX, config.shakeBanner.y);
            }
        }

        // 绘制底部助力链接
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