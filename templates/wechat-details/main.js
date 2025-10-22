import { drawRoundedRect, drawWrappedText } from '../../js/utils.js';

/**
 * 模板专属的初始化函数。
 * 当模板被加载时，此函数会被主程序调用，用于绑定所有交互事件，
 * 包括状态栏图标的点击切换、拖拽排序、Wi-Fi/LTE的互斥选择，以及其他模板特有的联动逻辑。
 * @param {function} drawCanvas - 主绘图函数的回调。在UI控件状态变更后调用此函数，以触发画布的实时重绘。
 */
export function initialize(drawCanvas) {
    const container = document.getElementById('template-controls-container');
    if (!container) return;

    /**
     * 生成指定长度的随机数字字符串。
     * @param {number} length - 需要生成的字符串长度。
     * @returns {string} - 生成的随机数字字符串。
     */
    function generateRandomNumberString(length) {
        let result = '';
        const characters = '0123456789';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // ---  日期与单号联动逻辑 ---
    const paymentTimeInput = container.querySelector('[data-id="paymentTime"]');
    const paymentSecondsInput = container.querySelector('[data-id="paymentSeconds"]');
    const transactionIdInput = container.querySelector('[data-id="transactionId"]');
    const merchantIdInput = container.querySelector('[data-id="merchantId"]');
    
    if (paymentTimeInput && transactionIdInput && merchantIdInput && paymentSecondsInput) {
        const updateDynamicData = () => {
            const timeValue = paymentTimeInput.value;
            if (!timeValue) return;
            
            // 核心: 从日期时间输入中提取 'YYYYMMDD' 格式的字符串。
            const dateString = timeValue.substring(0, 10).replace(/-/g, '');
            
            // 核心: 动态生成新的交易单号和商户单号。
            // 规则: 固定前缀 + YYYYMMDD + 10位随机数
            const newTransactionId = '4200002882' + dateString + generateRandomNumberString(10);
            // 规则: YYYYMMDD + 10位随机数
            const newMerchantId = dateString + generateRandomNumberString(10);

            // 动态生成一个两位数的秒值 (00-59)。
            const randomSeconds = Math.floor(Math.random() * 60).toString().padStart(2, '0');

            // 更新输入框的值并触发重绘。
            transactionIdInput.value = newTransactionId;
            merchantIdInput.value = newMerchantId;
            paymentSecondsInput.value = randomSeconds;

            transactionIdInput.dispatchEvent(new Event('input'));
            merchantIdInput.dispatchEvent(new Event('input'));
            paymentSecondsInput.dispatchEvent(new Event('input')); 
        };
        
        // 监听 "支付时间" 的变化，触发所有动态数据的更新。
        paymentTimeInput.addEventListener('input', updateDynamicData);
        
        // 初始化时立即执行一次，以确保初始值是动态生成的。
        updateDynamicData();
    }

    // --- 商户头像选择器逻辑 ---
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
    
    // --- 核心逻辑: 状态栏图标点击切换 ---
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

export const template = {
    // =================================================================================
    // 资源文件路径
    // =================================================================================
    assets: {
        // 状态栏图标
        locationIcon: 'icons/IoslocatnighiIcon.png',
        alarmIcon: 'icons/IosalarmnighiIcon.png',
        bellIcon: 'icons/IosBellnighiIcon.png',
        userIcon: 'icons/IosusernighiIcon.png',
        sleepIcon: 'icons/IossleepnighiIcon.png',
        wifiIcon: 'icons/IosWifinighiIcon.png',
        lteIcon: 'icons/Ios5GnighiIcon.png',

        // 模板专属资源
        bg: 'templates/wechat-details/icons/background.png',
        defaultMerchantIcon1: 'icons/merchanticon1.png',
        defaultMerchantIcon2: 'icons/merchanticon2.png',
        defaultMerchantIcon3: 'icons/merchanticon3.png',
        defaultMerchantIcon4: 'icons/merchanticon4.png',
        defaultMerchantIcon5: 'icons/merchanticon5.png',
        billServiceStyle1: 'templates/wechat-details/icons/bill-service-1.png',
        billServiceStyle2: 'templates/wechat-details/icons/bill-service-2.png',
        billServiceStyle3: 'templates/wechat-details/icons/bill-service-3.png',
    },

    // =================================================================================
    // 模板布局配置中心
    // =================================================================================
    config: {
        canvasWidth: 1290,                  // 画布的总宽度 (px)
        canvasHeight: 2796,                 // 画布的总高度 (px)
        
        // --- 状态栏 ---
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
        
        // --- 核心信息 ---
        mainContent: {
            merchantIconY: 350,             // [核心] 商户圆形头像的顶部Y坐标
            merchantIconSize: 155,          // [核心] 商户圆形头像的直径
            merchantNameY: 590,             // [核心] 商户名称文本的Y坐标
            merchantNameFont: '48px "AlipayNumber"', // [核心] 商户名称文本的字体样式
            amountY: 735,                   // [核心] 支付金额文本的Y坐标
            amountFont: '100px "AlipayNumber"', // [核心] 支付金额文本的字体样式
        },
        
        detailsList: { 
            startY: 1025,                   // [列表] 列表第一行的顶部Y坐标 (用于整体定位)
            leftX: 95,                      // [列表] 左侧标签文本的起始X坐标
            rightX: 356,                    // [列表] 右侧内容文本的起始X坐标
            rowHeight: 87,                  // [列表] 每一行的基础高度 (行间距)
            multiLineSpacing: 55,           // [列表] 多行内容时，第二行相对于第一行的额外垂直间距
            labelFont: '39px "AlipayNumber"',// [列表] 左侧标签的字体样式
            valueFont: '41px "PingFang SC"', // [列表] 右侧内容的字体样式
            labelColor: '#8f8f8f',          // [列表] 左侧标签的颜色
            valueColor: '#000000',          // [列表] 右侧主内容的颜色
            subValueColor: '#8f8f8f',       // [列表] 右侧次要内容(附注)的颜色
        },

        // --- 账单服务 ---
        billServices: {
            imageY: 2125,                   // [服务] 底部账单服务图片的顶部Y坐标
        },

        // --- 颜色配置 ---
        colors: {
            statusBar: '#000000'            // [颜色] 状态栏所有元素的颜色
        }
    },
    
    // =================================================================================
    // 模板控制选项HTML
    // =================================================================================
    getControlsHTML: () => `
        <fieldset>
            <legend>顶部状态栏</legend>
            <!-- 调整HTML结构以支持拖拽和统一的事件处理 -->
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
            
            <div class="input-group"><label>时间</label><input type="time" class="control" data-id="time" value="18:40"></div>

            <div class="input-group">
                <label>电池电量: <span class="control-value" data-id="batteryValue">80</span>%</label>
                <input type="range" class="control" data-id="battery" min="0" max="100" value="80">
            </div>
        </fieldset>

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
                <input type="file" class="control" data-id="merchantIcon">
            </div>
        </fieldset>
        
        <fieldset>
            <legend>账单详情</legend>
            <div class="input-group"><label>当前状态</label><input type="text" class="control" data-id="status" value="支付成功"></div>
            <div class="input-group"><label>支付时间</label><input type="datetime-local" class="control" data-id="paymentTime" value="2025-10-17T21:33"></div>
            <input type="hidden" class="control" data-id="paymentSeconds" value="33">
            <div class="input-group"><label>商品</label><input type="text" class="control" data-id="product" value="训练营:【升级版】平衡焕能瑜伽营"></div>
            <div class="input-group"><label>商户全称</label><input type="text" class="control" data-id="merchantFullName" value="广州简知信息科技有限公司"></div>
            <div class="input-group"><label>收单机构(第一行)</label><input type="text" class="control" data-id="acquirer" value="财付通支付科技有限公司"></div>
            <div class="input-group"><label>收单机构(第二行)</label><input type="text" class="control" data-id="acquirerSub" value="由中国银联股份有限公司提供收款清算服务"></div>
            <div class="input-group">
            <label>支付方式(第一行)</label>
                <input type="text" class="control" data-id="paymentMethod" value="中原银行储蓄卡(9820)">
                    <div class="quick-buttons">
                        <button data-target="paymentMethod" data-value="邮储银行储蓄卡(1369)">邮储银行</button>
                        <button data-target="paymentMethod" data-value="中原银行储蓄卡(9820)">中原银行</button>
                        <button data-target="paymentMethod" data-value="招商银行储蓄卡(5812)">招商银行</button>
                        <button data-target="paymentMethod" data-value="光大银行信用卡(6820)">光大银行</button>
                    </div>
                </div>
            <div class="input-group"><label>支付方式(第二行)</label><input type="text" class="control" data-id="paymentMethodSub" value="由中国银联股份有限公司提供付款清算服务"></div>
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

    // =================================================================================
    // 模板绘制函数
    // =================================================================================
    draw: (ctx, config, controls, assets) => {
        // --- 1. 初始化 ---
        if (!assets.bg) return;
        ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
        ctx.drawImage(assets.bg, 0, 0);

        // --- 2. 绘制状态栏 ---
        const st = config.statusBar;
        ctx.fillStyle = config.colors.statusBar;
        ctx.font = st.timeFont;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(controls.time, st.timeX, st.baseY);
        
        // --- 核心绘制逻辑: 左侧可排序图标 ---
        let currentIconX = st.iconstartX;
        const iconY = st.baseY - (st.iconHeight / 2);
        const iconContainer = document.querySelector('.statusbar-icon-selector');
        if (iconContainer) {
            const orderedDraggableElements = Array.from(iconContainer.querySelectorAll('.icon-option[data-draggable="true"]'));
            const draggableIconMap = {
                locationToggle: assets.locationIcon, alarmIconToggle: assets.alarmIcon, bellIconToggle: assets.bellIcon,
                userIconToggle: assets.userIcon, sleepIconToggle: assets.sleepIcon,
            };
            const visibleIconsToDraw = orderedDraggableElements.filter(el => {
                const targetId = el.dataset.target;
                return controls[targetId] && draggableIconMap[targetId];
            });
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
        const iconY_signal = st.baseY - (st.signalIconHeight / 2);
        if (controls.wifiIconToggle && assets.wifiIcon) {
            const asset = assets.wifiIcon;
            const calculatedWidth = st.signalIconHeight * (asset.width / asset.height);
            const iconX = currentSignalX - st.signalIconGapToBattery - calculatedWidth;
            ctx.drawImage(asset, iconX, iconY_signal, calculatedWidth, st.signalIconHeight);
            currentSignalX = iconX;
        }

        if (controls.lteIconToggle && assets.lteIcon) {
            const asset = assets.lteIcon;
            const calculatedWidth = st.signalIconHeight * (asset.width / asset.height);
            const iconX = currentSignalX - st.IconGap - calculatedWidth;
            ctx.drawImage(asset, iconX, iconY_signal, calculatedWidth, st.signalIconHeight);
        }

        // --- 绘制电池 ---
        const batteryY = st.baseY - st.batteryHeight / 2;
        if (controls.battery > 0) {
            const fillWidth = (st.batteryWidth - 8) * (controls.battery / 100);
            drawRoundedRect(ctx, st.batteryX + 4, batteryY + 2, fillWidth, st.batteryHeight - 8, 8);
            ctx.fill();
        }

        // --- 3. 绘制核心信息 ---
        const mc = config.mainContent;

        let iconToDraw = null;
        if (controls.merchantIcon) {
            iconToDraw = controls.merchantIcon;
        } else if (controls.merchantIconSelection && assets[controls.merchantIconSelection]) {
            iconToDraw = assets[controls.merchantIconSelection];
        }
        
        if (iconToDraw) {
            ctx.save();
            ctx.beginPath();
            const iconX = config.canvasWidth / 2 - mc.merchantIconSize / 2;
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

        // --- 4. 绘制账单详情列表 ---
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
            const parts = controls.paymentTime.split('T');
            const datePart = parts[0].replace(/-/g, '年', 1).replace('-', '月') + '日';
            const timePart = parts[1];
            const seconds = controls.paymentSeconds || '00'; // 从控件读取秒数
            formattedPaymentTime = `${datePart} ${timePart}:${seconds}`;
        }
        
        drawDetailRow('当前状态', controls.status);
        drawDetailRow('支付时间', formattedPaymentTime);
        drawDetailRow('商品', controls.product);
        drawDetailRow('商户全称', controls.merchantFullName);
        drawDetailRow('收单机构', controls.acquirer, controls.acquirerSub);
        drawDetailRow('支付方式', controls.paymentMethod, controls.paymentMethodSub);
        drawDetailRow('交易单号', controls.transactionId);
        drawDetailRow('商户单号', controls.merchantId);

        // --- 5. 绘制账单服务 ---
        const bs = config.billServices;
        const selectedServiceKey = 'billService' + controls.billServiceSelection.charAt(0).toUpperCase() + controls.billServiceSelection.slice(1);
        const selectedServiceImage = assets[selectedServiceKey];
        if (selectedServiceImage) {
            const imageX = (config.canvasWidth - selectedServiceImage.width) / 2;
            ctx.drawImage(selectedServiceImage, imageX, bs.imageY);
        }
    }
};