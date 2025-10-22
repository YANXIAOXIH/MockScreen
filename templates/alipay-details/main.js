import { drawRoundedRect, drawWrappedText } from '../../js/utils.js';

/**
 * 模板专属的初始化函数。
 * 当模板被加载时，此函数会被主程序调用，用于绑定所有交互事件。
 * @param {function} drawCanvas - 主绘图函数的回调。
 */
export function initialize(drawCanvas) {
    const container = document.getElementById('template-controls-container');
    if (!container) return;

    // --- 支付宝账单管理联动 ---
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
    
    // --- 支付宝支付奖励联动 ---
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
        
        if (checkbox && checkbox.checked) {
            icon.classList.add('active');
        }

        icon.addEventListener('click', (event) => {
            const clickedIcon = event.currentTarget;
            const targetCheckbox = container.querySelector(`.control[data-id="${clickedIcon.dataset.target}"]`);
            if (!targetCheckbox) return;

            clickedIcon.classList.toggle('active');
            targetCheckbox.checked = clickedIcon.classList.contains('active');
            
            const clickedTarget = clickedIcon.dataset.target;
            const isNowActive = clickedIcon.classList.contains('active');

            if (clickedTarget === 'wifiIconToggle' && isNowActive) {
                const lteIcon = container.querySelector('.icon-option[data-target="lteIconToggle"]');
                const lteCheckbox = container.querySelector('.control[data-id="lteIconToggle"]');
                if (lteIcon && lteCheckbox) {
                    lteIcon.classList.remove('active');
                    lteCheckbox.checked = false;
                }
            }
            if (clickedTarget === 'lteIconToggle' && isNowActive) {
                const wifiIcon = container.querySelector('.icon-option[data-target="wifiIconToggle"]');
                const wifiCheckbox = container.querySelector('.control[data-id="wifiIconToggle"]');
                if (wifiIcon && wifiCheckbox) {
                    wifiIcon.classList.remove('active');
                    wifiCheckbox.checked = false;
                }
            }
            targetCheckbox.dispatchEvent(new Event('input'));
        });
    });

    // --- 核心逻辑: 左侧状态栏图标拖拽排序 ---
    const iconContainer = container.querySelector('.statusbar-icon-selector');
    if (iconContainer) {
        const draggableIcons = iconContainer.querySelectorAll('.icon-option[data-draggable="true"]');
        draggableIcons.forEach(icon => icon.draggable = true);

        let draggedItem = null;

        iconContainer.addEventListener('dragstart', (event) => {
            if (event.target.dataset.draggable) {
                draggedItem = event.target;
                setTimeout(() => { if (draggedItem) draggedItem.style.opacity = '0.5'; }, 0);
            }
        });

        iconContainer.addEventListener('dragend', () => {
            if (draggedItem) {
                draggedItem.style.opacity = '1';
                draggedItem = null;
                drawCanvas(); 
            }
        });

        iconContainer.addEventListener('dragover', (event) => {
            event.preventDefault();
            if (!draggedItem) return;

            const afterElement = getDragAfterElement(iconContainer, event.clientX);
            const firstNonDraggable = iconContainer.querySelector('.icon-option:not([data-draggable="true"]), .icon-spacer');
            
            if (afterElement == null) {
                if (firstNonDraggable) iconContainer.insertBefore(draggedItem, firstNonDraggable);
                else iconContainer.appendChild(draggedItem);
            } else {
                iconContainer.insertBefore(draggedItem, afterElement);
            }
        });

        function getDragAfterElement(container, x) {
            const draggableElements = [...container.querySelectorAll('.icon-option[data-draggable="true"]:not([style*="opacity: 0.5"])')];
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
    }
}

export const template = {
    assets: {
        // 状态栏图标
        locationIcon: 'icons/IoslocatnighiIcon.png',
        alarmIcon: 'icons/IosalarmnighiIcon.png',
        bellIcon: 'icons/IosBellnighiIcon.png',
        userIcon: 'icons/IosusernighiIcon.png',
        sleepIcon: 'icons/IossleepnighiIcon.png',
        wifiIcon: 'icons/IosWifinighiIcon.png',
        lteIcon: 'icons/Ios5GnighiIcon.png',
        // 商户图标
        defaultMerchantIcon1: 'icons/merchanticon1.png', 
        defaultMerchantIcon2: 'icons/merchanticon2.png',
        defaultMerchantIcon3: 'icons/merchanticon3.png',
        defaultMerchantIcon4: 'icons/merchanticon4.png',
        defaultMerchantIcon5: 'icons/merchanticon5.png',
        // 背景与其他资源
        bg: 'templates/alipay-details/icons/background.png',
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
        
        statusBar: {
            baseY: 88,                      // [状态栏] 所有元素的垂直对齐基线Y坐标
            timeX: 148,                     // [状态栏] 时间文本的起始X坐标
            timeFont: 'bold 50px "PingFang"',// [状态栏] 时间文本的字体样式
            iconstartX: 290,                // [状态栏] 左侧第一个图标的起始X坐标
            iconHeight: 35,                 // [状态栏] 左侧图标的统一高度
            IconGap: 20,                    // [状态栏] 图标之间的水平间隙
            signalIconHeight: 42,           // [状态栏] 右侧信号类图标(Wi-Fi, LTE)的高度
            signalIconGapToBattery: 25,     // [状态栏] 最右侧信号图标与电池图标之间的间距
            batteryX: 1087,                 // [状态栏] 电池图标外框的起始X坐标
            batteryWidth: 80,               // [状态栏] 电池图标外框的总宽度
            batteryHeight: 37               // [状态栏] 电池图标外框的总高度
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

    getControlsHTML: () => `
        <fieldset>
            <legend>顶部状态栏</legend>
            <!-- [修改] 调整HTML结构以支持拖拽和统一的事件处理 -->
            <div class="input-group">
                <label>状态栏图标 (可拖拽排序)</label>
                <div class="statusbar-icon-selector">
                    <div class="icon-option icon-location" data-target="locationToggle" data-draggable="true"></div>
                    <div class="icon-option icon-alarm" data-target="alarmIconToggle" data-draggable="true"></div>
                    <div class="icon-option icon-bell" data-target="bellIconToggle" data-draggable="true"></div>
                    <div class="icon-option icon-user" data-target="userIconToggle" data-draggable="true"></div>
                    <div class="icon-option icon-sleep" data-target="sleepIconToggle" data-draggable="true"></div>
                    <div class="icon-spacer" style="flex-grow: 1;"></div>
                    <div class="icon-option icon-wifi" data-target="wifiIconToggle"></div>
                    <div class="icon-option icon-lte active" data-target="lteIconToggle"></div>
                </div>
            </div>
            <input type="checkbox" class="control" data-id="locationToggle" style="display: none;">
            <input type="checkbox" class="control" data-id="alarmIconToggle" style="display: none;">
            <input type="checkbox" class="control" data-id="bellIconToggle" style="display: none;">
            <input type="checkbox" class="control" data-id="userIconToggle" style="display: none;">
            <input type="checkbox" class="control" data-id="sleepIconToggle" style="display: none;">
            <input type="checkbox" class="control" data-id="wifiIconToggle" style="display: none;">
            <input type="checkbox" class="control" data-id="lteIconToggle" checked style="display: none;">
            
            <div class="input-group"><label>时间</label><input type="time" class="control" data-id="time" value="21:10"></div>
            <div class="input-group"><label>电池电量: <span class="control-value" data-id="batteryValue">36</span>%</label><input type="range" class="control" data-id="battery" min="0" max="100" value="36"></div>
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
            <div class="input-group"><label>上传自定义头像</label><input type="file" class="control" data-id="merchantIcon"></div>
        </fieldset>
        
        <fieldset>
            <legend>账单列表</legend>
            <!-- [修改] 恢复为单个 datetime-local 输入框，与微信模板保持一致 -->
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

    draw: (ctx, config, controls, assets) => {
        if (!assets.bg) return;
        ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
        ctx.drawImage(assets.bg, 0, 0);

        // --- 1. 绘制状态栏 ---
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
            const orderedDraggableElements = Array.from(iconContainer.querySelectorAll('.icon-option[data-draggable="true"]'));
            const draggableIconMap = {
                locationToggle: assets.locationIcon, alarmIconToggle: assets.alarmIcon, bellIconToggle: assets.bellIcon,
                userIconToggle: assets.userIcon, sleepIconToggle: assets.sleepIcon,
            };
            const visibleIconsToDraw = orderedDraggableElements.filter(el => controls[el.dataset.target] && draggableIconMap[el.dataset.target]);
            visibleIconsToDraw.forEach(el => {
                const asset = draggableIconMap[el.dataset.target];
                if (asset) {
                    const calculatedWidth = st.iconHeight * (asset.width / asset.height);
                    ctx.drawImage(asset, currentIconX, iconY, calculatedWidth, st.iconHeight);
                    currentIconX += calculatedWidth + st.IconGap;
                }
            });
        }
        
        // --- 绘制右侧固定图标 ---
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

        // --- 2. 绘制中间核心信息卡片  ---
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
        ctx.fillText(`-${parseFloat(controls.amount).toFixed(2)}`, config.canvasWidth / 2, mc.amountY);
        
        // --- 3. 绘制底部详情列表  ---
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
            currentY += dl.rowHeight + 2;
        };
        
        // --- [修改] 在绘制前格式化支付时间并动态生成秒数 ---
        let formattedPaymentTime = '';
        if (controls.paymentTime) { // 值是 "2025-10-20T17:06"
            const randomSeconds = Math.floor(Math.random() * 60).toString().padStart(2, '0');
            // 将 'T' 替换为空格，并拼接上随机秒数
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

        // --- 4. 绘制最下方的模块 ---
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