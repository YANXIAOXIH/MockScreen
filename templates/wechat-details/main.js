/**
 * @file 微信账单详情页 - 模板模块
 * @description
 * 定义了“微信账单详情页”模板的所有专属配置、UI控件、交互逻辑和 Canvas 绘制方法。
 * [V2] 状态栏系统已升级，采用与 wechat-success 模板相同的全局图标库和三区域拖放排序功能。
 * 之前的 Wi-Fi/5G 互斥逻辑已被移除，现在所有图标均可独立控制。
 * 模板原有的日期单号联动、商户头像选择等功能均已保留。
 */

import { drawRoundedRect } from '../../js/utils.js';

// --- 模块级状态变量 (新) ---
// 用于实时存储用户在状态栏左右两侧区域排列的图标ID顺序。
let leftIconOrder = [];
let rightIconOrder = [];

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

    // --- 2. [保留] 日期与单号联动功能 ---
    const paymentTimeInput = container.querySelector('[data-id="paymentTime"]');
    const paymentSecondsInput = container.querySelector('[data-id="paymentSeconds"]');
    const transactionIdInput = container.querySelector('[data-id="transactionId"]');
    const merchantIdInput = container.querySelector('[data-id="merchantId"]');
    
    function generateRandomNumberString(length) {
        let result = '';
        const characters = '0123456789';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    if (paymentTimeInput && transactionIdInput && merchantIdInput && paymentSecondsInput) {
        const updateDynamicData = () => {
            const timeValue = paymentTimeInput.value;
            if (!timeValue) return;
            
            const dateString = timeValue.substring(0, 10).replace(/-/g, '');
            const newTransactionId = '4200002882' + dateString + generateRandomNumberString(10);
            const newMerchantId = dateString + generateRandomNumberString(10);
            const randomSeconds = Math.floor(Math.random() * 60).toString().padStart(2, '0');

            transactionIdInput.value = newTransactionId;
            merchantIdInput.value = newMerchantId;
            paymentSecondsInput.value = randomSeconds;

            transactionIdInput.dispatchEvent(new Event('input'));
            merchantIdInput.dispatchEvent(new Event('input'));
            paymentSecondsInput.dispatchEvent(new Event('input')); 
        };
        
        paymentTimeInput.addEventListener('input', updateDynamicData);
        updateDynamicData();
    }

    // --- 3. [保留] 商户头像选择器功能 ---
    const merchantIconSelector = container.querySelector('.merchant-icon-selector');
    const merchantHiddenInput = container.querySelector('[data-id="merchantIconSelection"]');
    if (merchantIconSelector && merchantHiddenInput) {
        const merchantIconOptions = merchantIconSelector.querySelectorAll('.merchant-icon-option');
        merchantIconOptions.forEach(icon => {
            icon.addEventListener('click', (event) => {
                merchantIconOptions.forEach(opt => opt.classList.remove('selected'));
                const clickedIcon = event.currentTarget;
                clickedIcon.classList.add('selected');
                merchantHiddenInput.value = clickedIcon.dataset.assetKey;
                merchantHiddenInput.dispatchEvent(new Event('input'));
            });
        });
    }
}

/**
 * 导出的模板定义对象。
 */
export const template = {
    // 模板主题，用于主应用加载 'nighi' 风格的通用图标。
    theme: 'night',
    
    // 模板专属资源。移除了所有状态栏图标，因为它们现在由主应用全局管理。
    assets: {
        bg: 'templates/wechat-details/icons/background.png',
        // 预设商户头像
        defaultMerchantIcon1: 'icons/merchanticon1.png',
        defaultMerchantIcon2: 'icons/merchanticon2.png',
        defaultMerchantIcon3: 'icons/merchanticon3.png',
        defaultMerchantIcon4: 'icons/merchanticon4.png',
        defaultMerchantIcon5: 'icons/merchanticon5.png',
        // 底部账单服务图片
        billServiceStyle1: 'templates/wechat-details/icons/bill-service-1.png',
        billServiceStyle2: 'templates/wechat-details/icons/bill-service-2.png',
        billServiceStyle3: 'templates/wechat-details/icons/bill-service-3.png',
    },

    // 模板布局与样式配置中心 (保持不变)
    config: {
        canvasWidth: 1290,                  // [全局] 画布的总宽度 (px)
        canvasHeight: 2796,                 // [全局] 画布的总高度 (px)
        
        // --- 状态栏配置 ---
        statusBar: { 
            baseY: 88,                      // [基线] 所有元素的垂直对齐基线Y坐标
            timeX: 140,                     // [时间] 时间文本的起始X坐标
            timeFont: 'bold 50px "PingFang"',// [时间] 时间文本的字体样式
            iconstartX: 290,                // [左图标] 左侧第一个图标的起始X坐标
            iconHeight: 36,                 // [左图标] 左侧图标的统一高度
            IconGap: 20,                    // [图标] 图标之间的水平间隙
            signalIconHeight: 42,           // [右图标] 右侧信号类图标(Wi-Fi, LTE)的高度
            signalIconGapToBattery: 22,     // [右图标] 最右侧信号图标与电池图标之间的间距
            batteryX: 1087,                 // [电池] 电池图标外框的起始X坐标
            batteryWidth: 80,               // [电池] 电池图标外框的总宽度
            batteryHeight: 38               // [电池] 电池图标外框的总高度
        },
        
        // --- 核心内容配置 (商户、金额) ---
        mainContent: {
            merchantIconY: 350,
            merchantIconSize: 155,
            merchantNameY: 590,
            merchantNameFont: '48px "AlipayNumber"',
            amountY: 735,
            amountFont: '100px "AlipayNumber"',
        },
        
        // --- 账单详情列表配置 ---
        detailsList: { 
            startY: 1025,                   // [定位] 列表第一行的顶部Y坐标 (用于整体定位)
            leftX: 95,                      // [定位] 左侧标签文本的起始X坐标
            rightX: 356,                    // [定位] 右侧内容文本的起始X坐标
            rowHeight: 87,                  // [布局] 每一行的基础高度 (行间距)
            multiLineSpacing: 55,           // [布局] 多行内容时，第二行相对于第一行的额外垂直间距
            labelFont: '39px "AlipayNumber"',// [字体] 左侧标签的字体样式
            valueFont: '41px "PingFang SC"', // [字体] 右侧内容的字体样式
            labelColor: '#8f8f8f',          // [颜色] 左侧标签的颜色
            valueColor: '#000000',          // [颜色] 右侧主内容的颜色
            subValueColor: '#8f8f8f',       // [颜色] 右侧次要内容(附注)的颜色
        },

        // --- 底部账单服务配置 ---
        billServices: {
            imageY: 2125,                   // [定位] 底部账单服务图片的顶部Y坐标
        },

        // --- 全局颜色配置 ---
        colors: {
            statusBar: '#000000'            // [颜色] 状态栏所有元素的颜色
        }
    },
    
    /**
     * @returns {string} 返回用于生成此模板控制面板的 HTML 字符串。
     */
    getControlsHTML: () => `
        <fieldset>
            <legend>顶部状态栏</legend>
            <!-- 使用占位符，主应用将在此处注入全局的状态栏图标控件 -->
            <!-- ICON_CONTROLS_PLACEHOLDER -->
            <div class="input-group"><label>时间</label><input type="time" class="control" data-id="time" value="18:40"></div>
            <div class="input-group">
                <label>电池电量: <span class="control-value" data-id="batteryValue">80</span>%</label>
                <input type="range" class="control" data-id="battery" min="0" max="100" value="80">
            </div>
        </fieldset>

        <!-- 以下为模板专属控件，保持不变 -->
        <fieldset>
            <legend>核心信息</legend>
            <div class="input-group"><label>商户名称</label><input type="text" class="control" data-id="merchantName" value="简知"></div>
            <div class="input-group"><label>金额</label><input type="text" class="control" data-id="amount" value="4680"></div>
            <div class="input-group">
                <label>商户头像</label>
                <div class="merchant-icon-selector">
                    <img src="icons/merchanticon1.png" class="merchant-icon-option" data-asset-key="defaultMerchantIcon1">
                    <img src="icons/merchanticon2.png" class="merchant-icon-option" data-asset-key="defaultMerchantIcon2">
                    <img src="icons/merchanticon3.png" class="merchant-icon-option selected" data-asset-key="defaultMerchantIcon3">
                    <img src="icons/merchanticon4.png" class="merchant-icon-option" data-asset-key="defaultMerchantIcon4">
                    <img src="icons/merchanticon5.png" class="merchant-icon-option" data-asset-key="defaultMerchantIcon5">
                </div>
                <input type="hidden" class="control" data-id="merchantIconSelection" value="defaultMerchantIcon3">
            </div>
            <div class="input-group">
                <label>上传自定义头像</label>
                <div>
                    <input type="file" class="control" data-id="merchantIcon" id="merchantIconUpload" style="display: none;">
                    
                    <label for="merchantIconUpload" class="button-like-label">选择文件</label>
                    
                    <span class="file-name-display" data-id="merchantIconFileName"></span>
                </div>
            </div>
        </fieldset>
        
        <fieldset>
            <legend>账单详情</legend>
            <div class="input-group"><label>当前状态</label><input type="text" class="control" data-id="status" value="支付成功"></div>
            <div class="input-group"><label>支付时间</label><input type="datetime-local" class="control" data-id="paymentTime" value="2025-10-17T21:33"></div>
            <input type="hidden" class="control" data-id="paymentSeconds" value="33">
            <div class="input-group"><label>商品</label><textarea class="control" data-id="product" rows="3">训练营:【升级版】平衡焕能瑜伽营</textarea></div>
            <div class="input-group"><label>商户全称</label><input type="text" class="control" data-id="merchantFullName" value="广州简知信息科技有限公司"></div>
            <div class="input-group"><label>收单机构</label><input type="text" class="control" data-id="acquirer" value="财付通支付科技有限公司"></div>
            <div class="input-group"><label>收单机构注释</label><input type="text" class="control" data-id="acquirerSub" value="由中国银联股份有限公司提供收款清算服务"></div>
            <div class="input-group">
            <label>支付方式</label>
                <input type="text" class="control" data-id="paymentMethod" value="中原银行储蓄卡(9820)">
                    <div class="quick-buttons">
                        <button data-target="paymentMethod" data-value="邮储银行储蓄卡(1369)">邮储银行</button>
                        <button data-target="paymentMethod" data-value="中原银行储蓄卡(9820)">中原银行</button>
                        <button data-target="paymentMethod" data-value="招商银行储蓄卡(5812)">招商银行</button>
                        <button data-target="paymentMethod" data-value="光大银行信用卡(6820)">光大银行</button>
                    </div>
                </div>
            <div class="input-group"><label>支付方式注释</label><input type="text" class="control" data-id="paymentMethodSub" value="由中国银联股份有限公司提供付款清算服务"></div>
            <div class="input-group"><label>交易单号</label><input type="text" class="control" data-id="transactionId" value="4200002882202510172887219911"></div>
            <div class="input-group"><label>商户单号</label><input type="text" class="control" data-id="merchantId" value="202510174046600814"></div>
        </fieldset>

        <fieldset>
            <legend>账单服务</legend>
            <div class="radio-group">
                <input type="radio" name="bill-service-choice" class="control" data-id="billServiceSelection" value="style1" checked> <label>样式一</label>
                <input type="radio" name="bill-service-choice" class="control" data-id="billServiceSelection" value="style2"> <label>样式二</label>
                <input type="radio" name="bill-service-choice" class="control" data-id="billServiceSelection" value="style3"> <label>样式三</label>
            </div>
        </fieldset>
    `,

    /**
     * 模板的核心绘制函数。
     */
    draw: (ctx, config, controls, assets) => {
        // --- 初始化画布 ---
        if (!assets.bg) return;
        ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
        ctx.drawImage(assets.bg, 0, 0);

        // --- 绘制状态栏 (采用 wechat-success 的最新绘制逻辑) ---
        const st = config.statusBar; 
        ctx.fillStyle = config.colors.statusBar; 
        ctx.font = st.timeFont;
        ctx.textAlign = 'left'; 
        ctx.textBaseline = 'middle';
        ctx.fillText(controls.time, st.timeX, st.baseY);
        
        // --- 绘制左侧图标 (数据源: leftIconOrder 数组) ---
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

        // --- 绘制右侧图标 (数据源: rightIconOrder 数组) ---
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
        
        // --- 绘制电池 ---
        const batteryY = st.baseY - st.batteryHeight / 2; 
        if (controls.battery > 0) { 
            const fillWidth = (st.batteryWidth - 8) * (controls.battery / 100);
            drawRoundedRect(ctx, st.batteryX + 4, batteryY + 2, fillWidth, st.batteryHeight - 8, 8); 
            ctx.fill(); 
        }

        // --- 绘制核心信息 (商户与金额) ---
        const mc = config.mainContent;
        let iconToDraw = controls.merchantIcon || (assets[controls.merchantIconSelection]);
        if (iconToDraw) {
            ctx.save();
            ctx.beginPath();
            const iconX = (config.canvasWidth - mc.merchantIconSize) / 2;
            ctx.arc(iconX + mc.merchantIconSize / 2, mc.merchantIconY + mc.merchantIconSize / 2, mc.merchantIconSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(iconToDraw, iconX, mc.merchantIconY, mc.merchantIconSize, mc.merchantIconSize);
            ctx.restore();
        }
        
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000000';
        ctx.font = mc.merchantNameFont;
        ctx.fillText(controls.merchantName, config.canvasWidth / 2, mc.merchantNameY);
        
        ctx.font = mc.amountFont;
        ctx.fillText(`-${parseFloat(controls.amount || 0).toFixed(2)}`, config.canvasWidth / 2, mc.amountY);

        // --- [保留] 绘制账单详情列表 ---
        const dl = config.detailsList;
        let currentY = dl.startY;
        
        const drawDetailRow = (label, value, value2 = null) => {
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.font = dl.labelFont;
            ctx.fillStyle = dl.labelColor;
            ctx.fillText(label, dl.leftX, currentY);
            ctx.font = dl.valueFont;
            ctx.fillStyle = dl.valueColor;
            ctx.fillText(value, dl.rightX, currentY);
            
            if (value2) {
                ctx.fillStyle = dl.subValueColor; 
                ctx.fillText(value2, dl.rightX, currentY + dl.multiLineSpacing);
                currentY += dl.rowHeight + dl.multiLineSpacing;
            } else {
                currentY += dl.rowHeight;
            }
        };
        
        let formattedPaymentTime = '';
        if (controls.paymentTime) {
            const date = new Date(controls.paymentTime);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const seconds = controls.paymentSeconds || '00';
            formattedPaymentTime = `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
        }
        
        drawDetailRow('当前状态', controls.status);
        drawDetailRow('支付时间', formattedPaymentTime);
        drawDetailRow('商品', controls.product);
        drawDetailRow('商户全称', controls.merchantFullName);
        drawDetailRow('收单机构', controls.acquirer, controls.acquirerSub);
        drawDetailRow('支付方式', controls.paymentMethod, controls.paymentMethodSub);
        drawDetailRow('交易单号', controls.transactionId);
        drawDetailRow('商户单号', controls.merchantId);

        // --- [保留] 绘制底部账单服务 ---
        const bs = config.billServices;
        const selectedServiceKey = 'billService' + controls.billServiceSelection.charAt(0).toUpperCase() + controls.billServiceSelection.slice(1);
        const selectedServiceImage = assets[selectedServiceKey];
        if (selectedServiceImage) {
            const imageX = (config.canvasWidth - selectedServiceImage.width) / 2;
            ctx.drawImage(selectedServiceImage, imageX, bs.imageY);
        }
    }
};