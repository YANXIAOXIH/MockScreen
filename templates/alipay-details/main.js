/**
 * @file 支付宝账单详情页 - 模板模块 (已升级)
 * @description
 * 定义了“支付宝账单详情页”模板的所有专属配置、UI控件、交互逻辑和 Canvas 绘制方法。
 * [V2] 状态栏系统已升级，采用全局图标库和三区域拖放排序功能。
 * 模板原有的账单管理联动、支付奖励选择等功能均已保留。
 */

import { drawRoundedRect, drawWrappedText } from '../../js/utils.js';

// --- 模块级状态变量 (新) ---
// 用于实时存储用户在状态栏左右两侧区域排列的图标ID顺序。
let leftIconOrder = [];
let rightIconOrder = [];

/**
 * 模板专属的初始化函数。
 * 在模板加载后由主应用调用，负责为该模板的动态HTML控件绑定所有特殊的交互事件。
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


    // --- 2. [保留] 支付宝账单管理联动 ---
    const managementRadios = container.querySelectorAll('input[name="billManagementChoiceRadios"]');
    const categoryNameInput = container.querySelector('input[data-id="billCategoryName"]');
    const hiddenChoiceInput = container.querySelector('input[data-id="billManagementChoice"]');
    if (managementRadios.length > 0 && categoryNameInput && hiddenChoiceInput) {
        const updateBillCategory = (radio) => {
            if (radio.checked) {
                hiddenChoiceInput.value = radio.value;
                categoryNameInput.value = radio.nextElementSibling.textContent;
                hiddenChoiceInput.dispatchEvent(new Event('input'));
                categoryNameInput.dispatchEvent(new Event('input'));
            }
        };
        managementRadios.forEach(radio => radio.addEventListener('change', () => updateBillCategory(radio)));
        const checkedRadio = container.querySelector('input[name="billManagementChoiceRadios"]:checked');
        if (checkedRadio) updateBillCategory(checkedRadio);
    }
    
    // --- 3. [保留] 支付宝支付奖励联动 ---
    const rewardRadios = container.querySelectorAll('input[name="paymentRewardChoiceRadios"]');
    const hiddenRewardInput = container.querySelector('input[data-id="paymentRewardChoice"]');
    if (rewardRadios.length > 0 && hiddenRewardInput) {
        const updateReward = (radio) => {
            if(radio.checked) {
                hiddenRewardInput.value = radio.value;
                hiddenRewardInput.dispatchEvent(new Event('input'));
            }
        };
        rewardRadios.forEach(radio => radio.addEventListener('change', () => updateReward(radio)));
        const checkedRewardRadio = container.querySelector('input[name="paymentRewardChoiceRadios"]:checked');
        if(checkedRewardRadio) updateReward(checkedRewardRadio);
    }

    // --- 4. [保留] 商户头像选择器逻辑 ---
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
    // [升级] 模板主题，用于主应用加载 'nighi' 风格的通用图标。
    theme: 'night',
    
    // [升级] 模板专属资源。移除了所有状态栏图标。
    assets: {
        bg: 'templates/alipay-details/icons/background.png',
        // 商户图标
        defaultMerchantIcon1: 'icons/merchanticon1.png', 
        defaultMerchantIcon2: 'icons/merchanticon2.png',
        defaultMerchantIcon3: 'icons/merchanticon3.png',
        defaultMerchantIcon4: 'icons/merchanticon4.png',
        defaultMerchantIcon5: 'icons/merchanticon5.png',
        // 账单管理与支付奖励资源
        billManagementStyle1: 'templates/alipay-details/icons/bill-management-1.png',
        billManagementStyle2: 'templates/alipay-details/icons/bill-management-2.png',
        billManagementStyle3: 'templates/alipay-details/icons/bill-management-3.png',
        paymentReward1: 'templates/alipay-details/icons/reward-1.png',
        paymentReward2: 'templates/alipay-details/icons/reward-2.png',
    },

    // =================================================================================
    // 模板布局配置中心
    // =================================================================================
    config: {
        canvasWidth: 1290,                  // [画布] 画布的总宽度 (px)
        canvasHeight: 2796,                 // [画布] 画布的总高度 (px)
        
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
        mainCard: { 
            shopIconY: 383,                 // [核心卡片] 商户图标的顶部Y坐标
            shopiconsize: 138,              // [核心卡片] 商户图标的尺寸 (宽度和高度)
            shopNameY: 595,                 // [核心卡片] 商户名称文本的Y坐标
            shopNameFont: '48px "PingFang"', // [核心卡片] 商户名称文本的字体样式
            amountY: 725,                   // [核心卡片] 支付金额文本的Y坐标
            amountFont: 'bold 110px "AlipayNumber"',// [核心卡片] 支付金额文本的字体样式
        },
        detailsList: { 
            startY: 980,                    // [详情列表] 列表第一行的起始Y坐标 (整体位置)
            rowHeight: 105,                 // [详情列表] 每一行的基础高度，即行间距
            leftX: 80,                      // [详情列表] 左侧标签文本的起始X坐标
            rightX: 410,                    // [详情列表] 右侧内容文本的起始X坐标
            labelFont: '45px "PingFang"',   // [详情列表] 左侧标签的字体样式
            valueFont: '42px "PingFang"',   // [详情列表] 右侧内容的字体样式
            labelColor: '#999999',          // [详情列表] 左侧标签的颜色
            valueColor: '#333333',          // [详情列表] 右侧主内容的颜色
            arrowColor: '#c6c6c6',          // [详情列表] "付款方式"行右侧箭头的颜色
            multiLineHeight: 55,            // [详情列表] 多行文本(如收款方全称)的行高
            rewardImageWidth: 490,          // [详情列表] "支付奖励"图片的宽度
            rewardImageHeight: 109          // [详情列表] "支付奖励"图片的高度
        },
        bottomModules: {
            managementY: 2270,              // [底部模块] "账单管理" 图片的顶部Y坐标
            managementX: 56,                // [底部模块] "账单管理" 图片的左侧X坐标
            categoryY: 2589,                // [底部模块] "账单分类" 文本行的Y坐标
            categoryLeftX: 110,             // [底部模块] "账单分类" 左侧标签文本的X坐标
            categoryRightX: 1172,           // [底部模块] "账单分类" 右侧值文本的结束X坐标 (因右对齐)
            categoryFont: '46px "PingFang"',// [底部模块] "账单分类" 文本的字体样式
            categoryLabelColor: '#333333',  // [底部模块] "账单分类" 左侧标签的颜色
            categoryValueColor: '#999999',  // [底部模块] "账单分类" 右侧值的颜色
        },
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
            <!-- ICON_CONTROLS_PLACEHOLDER -->
            <div class="input-group"><label>时间</label><input type="time" class="control" data-id="time" value="21:10"></div>
            <div class="input-group">
                <label>电池电量: <span class="control-value" data-id="batteryValue">36</span>%</label>
                <input type="range" class="control" data-id="battery" min="0" max="100" value="36">
            </div>
        </fieldset>
        
        <fieldset>
            <legend>核心信息</legend>
            <div class="input-group"><label>商户名称</label><input type="text" class="control" data-id="shopName" value="简知"></div>
            <div class="input-group"><label>金额</label><input type="text" class="control" data-id="amount" value="4680"></div>
            <div class="input-group">
                <label>商户头像</label>
                <div class="merchant-icon-selector">
                    <img src="icons/merchanticon1.png" class="merchant-icon-option selected" data-asset-key="defaultMerchantIcon1">
                    <img src="icons/merchanticon2.png" class="merchant-icon-option" data-asset-key="defaultMerchantIcon2">
                    <img src="icons/merchanticon3.png" class="merchant-icon-option" data-asset-key="defaultMerchantIcon3">
                    <img src="icons/merchanticon4.png" class="merchant-icon-option" data-asset-key="defaultMerchantIcon4">
                    <img src="icons/merchanticon5.png" class="merchant-icon-option" data-asset-key="defaultMerchantIcon5">
                </div>
                <input type="hidden" class="control" data-id="merchantIconSelection" value="defaultMerchantIcon1">
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
            <legend>账单列表</legend>
            <div class="input-group">
                <label>支付时间</label>
                <input type="datetime-local" class="control" data-id="paymentTime" value="2025-10-20T17:06">
            </div>
            <div class="input-group">
                <label>付款方式</label>
                <input type="text" class="control" data-id="paymentMethod" value="邮储银行储蓄卡(1369)">
                <div class="quick-buttons">
                    <button data-target="paymentMethod" data-value="花呗">花呗</button>
                    <button data-target="paymentMethod" data-value="余额宝">余额宝</button>
                    <button data-target="paymentMethod" data-value="余额">余额</button>
                    <button data-target="paymentMethod" data-value="招商银行储蓄卡(5812)">招商银行</button>
                    <button data-target="paymentMethod" data-value="光大银行信用卡(6820)">光大银行</button>
                </div>
            </div>
            <div class="input-group"><label>商品说明</label><input type="text" class="control" data-id="productDesc" value="训练营:【升级版】平衡焕能瑜伽营"></div>
            <div class="input-group">
                <label>支付奖励</label>
                <div class="horizontal-controls-container" style="padding-top: 10px;">
                    <div class="radio-group"><input type="radio" class="control" name="paymentRewardChoiceRadios" value="reward1" checked> <label>15积分</label></div>
                    <div class="radio-group"><input type="radio" class="control" name="paymentRewardChoiceRadios" value="reward2"> <label>115积分</label></div>
                </div>
                <input type="hidden" class="control" data-id="paymentRewardChoice" value="reward1">
            </div>
            <div class="input-group"><label>收单机构</label><input type="text" class="control" data-id="acquirer" value="随行付支付有限公司"></div>
            <div class="input-group"><label>清算机构</label><input type="text" class="control" data-id="clearingHouse" value="中国银联股份有限公司"></div>
            <div class="input-group"><label>收款方全称</label><textarea class="control" data-id="payeeFullName">广州简知信息科技有限公司</textarea></div>
        </fieldset>
        
        <fieldset>
            <legend>账单管理</legend>
            <div class="input-group"><input type="text" class="control" data-id="billCategoryName" value="日用百货"></div>
            <div class="horizontal-controls-container">
                <div class="radio-group"><input type="radio" class="control" name="billManagementChoiceRadios" value="style1" checked> <label>日用百货</label></div>
                <div class="radio-group"><input type="radio" class="control" name="billManagementChoiceRadios" value="style2"> <label>餐饮美食</label></div>
                <div class="radio-group"><input type="radio" class="control" name="billManagementChoiceRadios" value="style3"> <label>家居数码</label></div>
            </div>
            <input type="hidden" class="control" data-id="billManagementChoice" value="style1">
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

        // --- 2. [保留] 绘制中间核心信息卡片 ---
        const mc = config.mainCard;
        let iconToDraw = controls.merchantIcon || (controls.merchantIconSelection && assets[controls.merchantIconSelection]);
        if (iconToDraw) {
            const iconSize = mc.shopiconsize;
            const iconX = (config.canvasWidth - iconSize) / 2;
            const iconY = mc.shopIconY;
            ctx.save();
            ctx.beginPath();
            ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
            ctx.clip(); 
            ctx.drawImage(iconToDraw, iconX, iconY, iconSize, iconSize);
            ctx.restore(); 
        }
        ctx.font = mc.shopNameFont; ctx.fillStyle = '#333333'; ctx.textAlign = 'center';
        ctx.fillText(controls.shopName, config.canvasWidth / 2, mc.shopNameY);
        ctx.font = mc.amountFont;
        ctx.fillText(`-${parseFloat(controls.amount || 0).toFixed(2)}`, config.canvasWidth / 2, mc.amountY);
        
        // --- 3. [保留] 绘制底部详情列表 ---
        const dl = config.detailsList; 
        ctx.textAlign = 'left'; 
        ctx.textBaseline = 'middle';
        let currentY = dl.startY;
        
        const drawRow = (label, value, hasArrow = false) => {
            ctx.font = dl.labelFont; ctx.fillStyle = dl.labelColor; 
            ctx.fillText(label, dl.leftX, currentY);
            ctx.font = dl.valueFont; ctx.fillStyle = dl.valueColor;
            if (label === '收款方全称') { 
                drawWrappedText(ctx, value, dl.rightX, currentY, config.canvasWidth - dl.rightX - dl.leftX, dl.multiLineHeight); 
            } else if (hasArrow) {
                const textWidth = ctx.measureText(value).width;
                ctx.fillText(value, dl.rightX, currentY);
                ctx.fillStyle = dl.arrowColor;
                ctx.fillText(' >', dl.rightX + textWidth, currentY);
            } else { 
                ctx.fillText(value, dl.rightX, currentY); 
            }
            // 动态计算行高
            if (label === '收款方全称') {
                const lineCount = Math.ceil(ctx.measureText(value).width / (config.canvasWidth - dl.rightX - dl.leftX));
                currentY += (lineCount > 1) ? (lineCount * dl.multiLineHeight + (dl.rowHeight - dl.multiLineHeight)) : dl.rowHeight;
            } else {
                 currentY += dl.rowHeight;
            }
        };
        
        let formattedPaymentTime = '';
        if (controls.paymentTime) {
            const randomSeconds = Math.floor(Math.random() * 60).toString().padStart(2, '0');
            formattedPaymentTime = `${controls.paymentTime.replace('T', ' ')}:${randomSeconds}`;
        }
        drawRow('支付时间', formattedPaymentTime); 
        drawRow('付款方式', controls.paymentMethod, true);
        drawRow('商品说明', controls.productDesc);
        
        ctx.font = dl.labelFont; ctx.fillStyle = dl.labelColor; 
        ctx.fillText('支付奖励', dl.leftX, currentY);
        const rewardKey = controls.paymentRewardChoice === 'reward1' ? 'paymentReward1' : 'paymentReward2';
        const rewardAsset = assets[rewardKey];
        if (rewardAsset) {
            const imageY = currentY - (dl.rewardImageHeight / 2) + 6;
            ctx.drawImage(rewardAsset, dl.rightX - 50, imageY, dl.rewardImageWidth, dl.rewardImageHeight);
        }
        currentY += dl.rowHeight + 20;
        
        drawRow('收单机构', controls.acquirer); 
        drawRow('清算机构', controls.clearingHouse);
        drawRow('收款方全称', controls.payeeFullName);
        drawRow('推荐服务', '');

        // --- 4. [保留] 绘制最下方的模块 ---
        const bm = config.bottomModules;

        if (controls.billManagementChoice === 'style1' && assets.billManagementStyle1) {
            ctx.drawImage(assets.billManagementStyle1, bm.managementX, bm.managementY);
        } else if (controls.billManagementChoice === 'style2' && assets.billManagementStyle2) {
            ctx.drawImage(assets.billManagementStyle2, bm.managementX, bm.managementY);
        } else if (controls.billManagementChoice === 'style3' && assets.billManagementStyle3) {
            ctx.drawImage(assets.billManagementStyle3, bm.managementX, bm.managementY);
        }
        
        ctx.font = bm.categoryFont;
        ctx.fillStyle = bm.categoryValueColor;
        ctx.textAlign = 'right';
        ctx.fillText(controls.billCategoryName, bm.categoryRightX, bm.categoryY);
    }
};
