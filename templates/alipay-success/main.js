import { drawRoundedRect } from '../../js/utils.js';

// 存储用户选择奖励的顺序
let rewardSelectionOrder = [];

/**
 * 模板专属的初始化函数。
 * 当模板被加载时，此函数会被主程序调用，用于绑定所有交互事件，
 * 包括支付有礼的勾选、状态栏图标的点击切换、拖拽排序以及Wi-Fi/LTE的互斥选择。
 * @param {function} drawCanvas - 主绘图函数的回调。在UI控件状态变更后调用此函数，以触发画布的实时重绘。
 */
export function initialize(drawCanvas) {
    // 清空上一次的顺序记录，以防模板切换后状态混乱
    rewardSelectionOrder = [];

    const container = document.getElementById('template-controls-container');
    if (!container) return;

    // --- “支付有礼”勾选逻辑 (保留原有功能) ---
    const rewardCheckboxes = container.querySelectorAll('.reward-checkbox');
    // 首次加载时，根据默认的勾选状态初始化顺序数组
    rewardCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const rewardId = checkbox.dataset.rewardId;
            if (!rewardSelectionOrder.includes(rewardId)) {
                rewardSelectionOrder.push(rewardId);
            }
        }
    });
    // 为每个复选框添加“change”事件监听
    rewardCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const rewardId = event.target.dataset.rewardId;
            const isChecked = event.target.checked;

            if (isChecked) {
                if (!rewardSelectionOrder.includes(rewardId)) {
                    rewardSelectionOrder.push(rewardId);
                }
            } else {
                rewardSelectionOrder = rewardSelectionOrder.filter(id => id !== rewardId);
            }
            drawCanvas(); // 状态更新后，立即重绘
        });
    });

    // --- [新增] 核心逻辑: 状态栏图标点击切换 ---
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
        icon.addEventListener('click', (event) => {
            const clickedIcon = event.currentTarget;
            const targetCheckbox = container.querySelector(`.control[data-id="${clickedIcon.dataset.target}"]`);
            if (!targetCheckbox) return;

            // 核心: 同步UI与数据。切换图标的UI激活状态，并更新背后隐藏复选框的`checked`属性。
            clickedIcon.classList.toggle('active');
            targetCheckbox.checked = clickedIcon.classList.contains('active');
            
            // --- [新增] 核心逻辑: WiFi 与 LTE 互斥选择 ---
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

    // --- [新增] 核心逻辑: 左侧状态栏图标拖拽排序 ---
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

// 导出该模板的完整配置对象
export const template = {
    assets: {
        bg: 'templates/alipay-success/icons/background.png',
        // 状态栏图标
        locationIcon: 'icons/IoslocatIcon.png',
        alarmIcon: 'icons/IosalarmIcon.png',
        bellIcon: 'icons/IosBellIcon.png',
        userIcon: 'icons/IosuserIcon.png',
        sleepIcon: 'icons/IossleepIcon.png',
        wifiIcon: 'icons/IosWifiIcon.png',
        lteIcon: 'icons/Ios5GIcon.png',

        reward1: 'templates/alipay-success/icons/reward-1.png',
        reward2: 'templates/alipay-success/icons/reward-2.png',
        reward3: 'templates/alipay-success/icons/reward-3.png',
        reward4: 'templates/alipay-success/icons/reward-4.png',
        reward5: 'templates/alipay-success/icons/reward-5.png',
        reward6: 'templates/alipay-success/icons/reward-6.png',
        reward7: 'templates/alipay-success/icons/reward-7.png',
        reward8: 'templates/alipay-success/icons/reward-8.png',
        reward9: 'templates/alipay-success/icons/reward-9.png',
        currency: 'templates/alipay-success/icons/currency.png',
    },

    // =================================================================================
    // 模板布局与样式配置中心
    // 集中管理所有绘制相关的尺寸、坐标、字体和颜色，便于后期调整。
    // =================================================================================
    config: {
        canvasWidth: 1170,                  // [画布] 画布的总宽度 (px)
        canvasHeight: 2532,                 // [画布] 画布的总高度 (px)

        // --- 顶部状态栏 ---
        statusBar: { 
            baseY: 74,                      // [状态栏] 所有元素的垂直对齐基线Y坐标
            timeX: 65,                      // [状态栏] 时间文本的起始X坐标
            timeFont: 'bold 50px "PingFang"',// [状态栏] 时间文本的字体样式
            iconstartX: 215,                // [状态栏] 左侧第一个图标的起始X坐标
            iconHeight: 35,                 // [状态栏] 左侧图标的统一高度
            IconGap: 20,                    // [状态栏] 图标之间的水平间隙
            signalIconHeight: 35,           // [状态栏] 右侧信号类图标(Wi-Fi, LTE)的高度
            signalIconGapToBattery: 15,     // [状态栏] 最右侧信号图标与电池图标之间的间距
            batteryX: 1040,                 // [状态栏] 电池图标外框的起始X坐标
            batteryWidth: 67,               // [状态栏] 电池图标外框的总宽度
            batteryHeight: 34               // [状态栏] 电池图标外框的总高度
        },

        // --- 核心支付信息 ---
        paymentInfo: { 
            amountY: 505,                   // [核心内容] 金额数字文本的基线Y坐标
            amountFont: ' 145px "AlipayNumber"',// [核心内容] 金额数字的字体样式
            currencySize: 90,               // [核心内容] 人民币图标的边长
            currencyGap: 10,                // [核心内容] 人民币图标与金额数字之间的空隙

            detailsAnchorY: 740,            // [详情] 作为定位基准的“交易方式”行的Y坐标
            detailsRowHeight: 75,           // [详情] 每一行的高度
            detailsLeftX: 70,               // [详情] 左侧文本的X坐标
            detailsRightX: 1095,            // [详情] 右侧文本的X坐标 (用于右对齐)
            payeeFont: '42px "PingFang"',   // [详情] 收款方行的字体
            detailsFont: '42px "PingFang"'  // [详情] 其他行的字体
        },

        // --- 底部奖励模块 ---
        rewards: { 
            startY: 952,                    // [奖励] 第一个奖励模块的起始Y坐标
            startX: 58,                     // [奖励] 所有奖励模块的统一X坐标
            gap: 66                         // [奖励] 模块之间的垂直间距
        },

        // --- 颜色配置 ---
        colors: { 
            statusBar: '#FFFFFF',           // [颜色] 状态栏所有元素的颜色
            mainText: '#FFFFFF',            // [颜色] 页面主要文本颜色 (金额、收款方等)
            deduction: '#FFFFFF'            // [颜色] “随机立减”行的文本颜色
        }
    },
    
    // 返回该模板控制选项的HTML字符串
    getControlsHTML: () => `
        <fieldset>
            <legend>顶部状态栏</legend>
            <!-- [修改] 调整HTML结构以支持拖拽和统一的事件处理 -->
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

            <div class="input-group"><label>时间</label><input type="time" class="control" data-id="time" value="03:00"></div>

            <div class="input-group">
                <label>电池电量: <span class="control-value" data-id="batteryValue">100</span>%</label>
                <input type="range" class="control" data-id="battery" min="0" max="100" value="68">
            </div>
        </fieldset>

        <fieldset>
            <legend>支付信息</legend>
            <div class="input-group"><label>收款方</label><input type="text" class="control" data-id="payee" value="简知"></div>
            <div class="input-group"><label>支付金额</label><input type="text" class="control" data-id="amount" value="4680"></div>
            <div class="input-group">
                <label>交易方式</label>
                <input type="text" class="control" data-id="methodInput" value="工商银行储蓄卡(5871)">
                <div class="quick-buttons">
                    <button data-target="methodInput" data-value="余额宝 (转出资金付款)">余额宝</button>
                    <button data-target="methodInput" data-value="余额">余额</button>
                    <button data-target="methodInput" data-value="花呗 (分期6期)">花呗</button>
                    <button data-target="methodInput" data-value="招商银行储蓄卡 (5812)">招商银行</button>
                    <button data-target="methodInput" data-value="光大银行信用卡 (6820)">光大银行</button>
                </div>
            </div>
            <div class="input-group checkbox-group"><input type="checkbox" class="control" data-id="deductionToggle"><label>随机立减</label><input type="text" class="control" data-id="deductionAmount" value="0.08" style="width: 80px;"></div>
        </fieldset>
        <fieldset>
            <legend>支付有礼</legend>
            <div class="horizontal-controls-container">
                <div class="checkbox-group">
                    <input type="checkbox" class="control reward-checkbox" data-id="reward1Toggle" data-reward-id="reward1" checked><label>支付积分</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" class="control reward-checkbox" data-id="reward2Toggle" data-reward-id="reward2" checked><label>蚂蚁庄园</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" class="control reward-checkbox" data-id="reward3Toggle" data-reward-id="reward3" checked><label>绿色能量</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" class="control reward-checkbox" data-id="reward4Toggle" data-reward-id="reward4" checked><label>里程币</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" class="control reward-checkbox" data-id="reward5Toggle" data-reward-id="reward5"><label>水果店</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" class="control reward-checkbox" data-id="reward6Toggle" data-reward-id="reward6"><label>健康能量</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" class="control reward-checkbox" data-id="reward7Toggle" data-reward-id="reward7"><label>绿色能量+71</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" class="control reward-checkbox" data-id="reward8Toggle" data-reward-id="reward8"><label>支付积分+18</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" class="control reward-checkbox" data-id="reward9Toggle" data-reward-id="reward9"><label>蚂蚁庄园+80</label>
                </div>
            </div>
        </fieldset>
    `,

    // 模板专属的绘制函数
    draw: (ctx, config, controls, assets) => {
        if (!assets.bg) return;
        ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
        ctx.drawImage(assets.bg, 0, 0);

        // --- 1. 绘制顶部状态栏 ---
        const st = config.statusBar; 
        ctx.fillStyle = config.colors.statusBar; 
        ctx.font = st.timeFont;
        ctx.textAlign = 'left'; 
        ctx.textBaseline = 'middle';
        ctx.fillText(controls.time, st.timeX, st.baseY);
        
        // --- [修改] 核心绘制逻辑: 左侧可排序图标 ---
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
                    currentIconX += calculatedWidth + st.IconGap;
                }
            });
        }
        
        // --- 绘制右侧固定图标 (从右向左绘制) ---
        let currentSignalX = st.batteryX;
        const signalIconY = st.baseY - (st.signalIconHeight / 2);
        if (controls.wifiIconToggle && assets.wifiIcon) {
            const asset = assets.wifiIcon;
            const calculatedWidth = st.signalIconHeight * (asset.width / asset.height);
            const iconX = currentSignalX - st.signalIconGapToBattery - calculatedWidth;
            ctx.drawImage(asset, iconX, signalIconY, calculatedWidth, st.signalIconHeight);
            currentSignalX = iconX;
        }

        if (controls.lteIconToggle && assets.lteIcon) {
            const asset = assets.lteIcon;
            const calculatedWidth = st.signalIconHeight * (asset.width / asset.height);
            const iconX = currentSignalX - st.IconGap - calculatedWidth + 7;
            ctx.drawImage(asset, iconX, signalIconY, calculatedWidth, st.signalIconHeight);
        }

        // --- 绘制电池 ---
        const batteryY = st.baseY - st.batteryHeight / 2; 
        if (controls.battery > 0) { 
            const fillWidth = (st.batteryWidth - 10) * (controls.battery / 100); 
            drawRoundedRect(ctx, st.batteryX + 5, batteryY + 5, fillWidth, st.batteryHeight - 10, 4); 
            ctx.fill(); 
        }

        // --- 2. 绘制核心支付信息  ---
        const pi = config.paymentInfo; 
        ctx.fillStyle = config.colors.mainText;
        const originalAmount = parseFloat(controls.amount) || 0; 
        const deduction = parseFloat(controls.deductionAmount) || 0; 
        let finalAmount = controls.deductionToggle ? (originalAmount - deduction) : originalAmount;

        if (assets.currency) {
            const amountText = finalAmount.toFixed(2);
            ctx.font = pi.amountFont;
            const textWidth = ctx.measureText(amountText).width;
            const totalWidth = pi.currencySize + pi.currencyGap + textWidth;
            const startX = (config.canvasWidth - totalWidth) / 2;
            const IconX = startX;
            const IconY = pi.amountY - pi.currencySize + 15; 
            ctx.drawImage(assets.currency, IconX, IconY, pi.currencySize, pi.currencySize);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic'; 
            ctx.fillText(amountText, IconX + pi.currencySize + pi.currencyGap, pi.amountY);
        } else {
            ctx.font = pi.amountFont; 
            ctx.textAlign = 'center'; 
            ctx.fillText(`¥${finalAmount.toFixed(2)}`, config.canvasWidth / 2, pi.amountY);
        }

        const currentRowHeight = controls.deductionToggle ? 65 : pi.detailsRowHeight;
        let payeeY;
        if (controls.deductionToggle) {
            payeeY = pi.detailsAnchorY - currentRowHeight * 2;
            const deductionY = payeeY + currentRowHeight;
            ctx.font = pi.detailsFont; ctx.textAlign = 'left'; ctx.fillText('支付宝随机立减', pi.detailsLeftX, deductionY);
            ctx.fillStyle = config.colors.deduction; ctx.textAlign = 'right'; ctx.fillText(`- ¥ ${deduction.toFixed(2)}`, pi.detailsRightX, deductionY);
        } else {
            payeeY = pi.detailsAnchorY - currentRowHeight;
        }
        
        ctx.font = pi.payeeFont; ctx.fillStyle = config.colors.mainText; ctx.textAlign = 'left'; ctx.fillText(controls.payee, pi.detailsLeftX, payeeY);
        ctx.textAlign = 'right'; ctx.fillText(`¥ ${originalAmount.toFixed(2)}`, pi.detailsRightX, payeeY);
        
        ctx.font = pi.detailsFont; 
        ctx.fillStyle = config.colors.mainText; 
        ctx.textAlign = 'left'; 
        ctx.fillText('交易方式', pi.detailsLeftX, pi.detailsAnchorY);
        ctx.textAlign = 'right'; 
        ctx.fillText(controls.methodInput, pi.detailsRightX, pi.detailsAnchorY);
        
        // --- 3. 绘制底部奖励模块  ---
        const rw = config.rewards;
        let currentRewardY = rw.startY;
        let currentRewardX = rw.startX;

        rewardSelectionOrder.forEach(rewardId => {
            const asset = assets[rewardId];
            if (asset) {
                ctx.drawImage(asset, currentRewardX, currentRewardY);
                currentRewardY += asset.height + rw.gap;
            }
        });
    }
};