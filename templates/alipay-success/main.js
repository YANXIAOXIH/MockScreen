/**
 * @file 支付宝支付成功页 - 模板模块 (已升级)
 * @description
 * 定义了“支付宝支付成功页”模板的所有专属配置、UI控件、交互逻辑和 Canvas 绘制方法。
 * [V2] 状态栏系统已升级，采用全局图标库和三区域拖放排序功能。
 * 模板原有的“支付有礼”动态勾选排序功能已完整保留。
 */

import { drawRoundedRect } from '../../js/utils.js';

// --- 模块级状态变量 (新) ---
let leftIconOrder = [];
let rightIconOrder = [];

// [保留] 存储用户选择奖励的顺序
let rewardSelectionOrder = [];

/**
 * 模板专属的初始化函数。
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

    // --- 2. [保留] “支付有礼”勾选逻辑 ---
    // 清空上一次的顺序记录，以防模板切换后状态混乱
    rewardSelectionOrder = [];
    const rewardCheckboxes = container.querySelectorAll('.reward-checkbox');
    rewardCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const rewardId = checkbox.dataset.rewardId;
            if (!rewardSelectionOrder.includes(rewardId)) {
                rewardSelectionOrder.push(rewardId);
            }
        }
    });
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
}

/**
 * 导出的模板定义对象。
 */
export const template = {
    // [升级] 模板主题，用于主应用加载 'day' 风格的通用图标。
    theme: 'day',
    
    // [升级] 模板专属资源。移除了所有状态栏图标。
    assets: {
        bg: 'templates/alipay-success/icons/background.png',
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

    // 模板布局与样式配置中心 (statusBar 部分与 wechat-success 对齐)
    config: {
        canvasWidth: 1170,                  // [画布] 画布的总宽度 (px)
        canvasHeight: 2532,                 // [画布] 画布的总高度 (px)

        // --- 顶部状态栏 ---
        statusBar: { 
            baseY: 74,                      // [状态栏] 所有元素的垂直对齐基线Y坐标
            timeX: 65,                      // [状态栏] 时间文本的起始X坐标
            timeFont: '50px "PingFang"',// [状态栏] 时间文本的字体样式
            iconstartX: 215,                // [状态栏] 左侧第一个图标的起始X坐标
            iconHeight: 36,                 // [状态栏] 左侧图标的统一高度
            IconGap: 20,                    // [状态栏] 图标之间的水平间隙
            signalIconHeight: 36,           // [状态栏] 右侧信号类图标(Wi-Fi, LTE)的高度
            signalIconGapToBattery: 20,     // [状态栏] 最右侧信号图标与电池图标之间的间距
            batteryX: 1040,                 // [状态栏] 电池图标外框的起始X坐标
            batteryWidth: 67,               // [状态栏] 电池图标外框的总宽度
            batteryHeight: 36               // [状态栏] 电池图标外框的总高度
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
    
    /**
     * @returns {string} 返回用于生成此模板控制面板的 HTML 字符串。
     */
    getControlsHTML: () => `
        <fieldset>
            <legend>顶部状态栏</legend>
            <!-- [升级] 使用占位符 -->
            <!-- ICON_CONTROLS_PLACEHOLDER -->
            <div class="input-group"><label>时间</label><input type="time" class="control" data-id="time" value="03:00"></div>
            <div class="input-group">
                <label>电池电量: <span class="control-value" data-id="batteryValue">68</span>%</label>
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
                <div class="checkbox-group"><input type="checkbox" class="control reward-checkbox" data-id="reward1Toggle" data-reward-id="reward1" checked><label>支付积分</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control reward-checkbox" data-id="reward2Toggle" data-reward-id="reward2" checked><label>蚂蚁庄园</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control reward-checkbox" data-id="reward3Toggle" data-reward-id="reward3" checked><label>绿色能量</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control reward-checkbox" data-id="reward4Toggle" data-reward-id="reward4" checked><label>里程币</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control reward-checkbox" data-id="reward5Toggle" data-reward-id="reward5"><label>水果店</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control reward-checkbox" data-id="reward6Toggle" data-reward-id="reward6"><label>健康能量</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control reward-checkbox" data-id="reward7Toggle" data-reward-id="reward7"><label>绿色能量+71</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control reward-checkbox" data-id="reward8Toggle" data-reward-id="reward8"><label>支付积分+18</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control reward-checkbox" data-id="reward9Toggle" data-reward-id="reward9"><label>蚂蚁庄园+80</label></div>
            </div>
        </fieldset>
    `,

    /**
     * 模板的核心绘制函数。
     */
    draw: (ctx, config, controls, assets) => {
        if (!assets.bg) return;
        ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
        ctx.drawImage(assets.bg, 0, 0);

        // --- 1. [升级] 绘制状态栏 ---
        const st = config.statusBar;
        ctx.fillStyle = config.colors.statusBar;
        ctx.font = st.timeFont;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(controls.time, st.timeX, st.baseY);

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

        let currentSignalX = st.batteryX - st.signalIconGapToBattery;
        rightIconOrder.forEach(targetId => {
            const assetKey = targetId.replace('Toggle', '');
            const asset = assets[assetKey]; 
            const iconHeight = st.signalIconHeight;
            const signalIconY = st.baseY - (iconHeight / 2);
            if (asset && controls[targetId]) {
                const calculatedWidth = iconHeight * (asset.width / asset.height);
                const iconX = currentSignalX - calculatedWidth;
                ctx.drawImage(asset, iconX, signalIconY, calculatedWidth, iconHeight);
                currentSignalX = iconX - st.IconGap;
            }
        });
        
        const batteryY = st.baseY - st.batteryHeight / 2;
        if (controls.battery > 0) {
            const fillWidth = (st.batteryWidth - 10) * (controls.battery / 100);
            drawRoundedRect(ctx, st.batteryX + 5, batteryY + 5, fillWidth, st.batteryHeight - 10, 5);
            ctx.fill();
        }

        // --- 2. [保留] 绘制核心支付信息 ---
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
            ctx.font = pi.amountFont; ctx.textAlign = 'center';
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
        ctx.font = pi.detailsFont; ctx.fillStyle = config.colors.mainText; ctx.textAlign = 'left';
        ctx.fillText('交易方式', pi.detailsLeftX, pi.detailsAnchorY);
        ctx.textAlign = 'right'; ctx.fillText(controls.methodInput, pi.detailsRightX, pi.detailsAnchorY);
        
        // --- 3. [保留] 绘制底部奖励模块 (数据源: rewardSelectionOrder 数组) ---
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