import { drawRoundedRect, drawWrappedText } from '../../js/utils.js';

//导入模板初始化函数的能力。
export function initialize(drawCanvasCallback) {
    const container = document.getElementById('template-controls-container');
    if (!container) return;

    // --- 支付宝账单管理联动 ---
    const managementRadios = container.querySelectorAll('input[name="billManagementChoiceRadios"]');
    // [修正] 找到用于联动的文本输入框
    const categoryNameInput = container.querySelector('input[data-id="billCategoryName"]');
    // [修正] 找到用于存储最终值的隐藏输入框
    const hiddenChoiceInput = container.querySelector('input[data-id="billManagementChoice"]');

    if (managementRadios.length > 0 && categoryNameInput && hiddenChoiceInput) {
        managementRadios.forEach(radio => {
            radio.addEventListener('change', (event) => {
                const currentRadio = event.target;
                if (currentRadio.checked) {
                    hiddenChoiceInput.value = currentRadio.value;
                    categoryNameInput.value = currentRadio.nextElementSibling.textContent;
                    hiddenChoiceInput.dispatchEvent(new Event('input'));
                    categoryName-input.dispatchEvent(new Event('input'));
                }
            });
        });
        const checkedRadio = container.querySelector('input[name="billManagementChoiceRadios"]:checked');
        if (checkedRadio) {
            hiddenChoiceInput.value = checkedRadio.value;
            categoryNameInput.value = checkedRadio.nextElementSibling.textContent;
        }
    }
    
    // --- 支付宝支付奖励联动 ---
    const rewardRadios = container.querySelectorAll('input[name="paymentRewardChoiceRadios"]');
    const hiddenRewardInput = container.querySelector('input[data-id="paymentRewardChoice"]');
    if (rewardRadios.length > 0 && hiddenRewardInput) {
        rewardRadios.forEach(radio => {
            radio.addEventListener('change', (event) => {
                if(event.target.checked) {
                    hiddenRewardInput.value = event.target.value;
                    hiddenRewardInput.dispatchEvent(new Event('input'));
                }
            });
        });
        const checkedRewardRadio = container.querySelector('input[name="paymentRewardChoiceRadios"]:checked');
        if(checkedRewardRadio) {
            hiddenRewardInput.value = checkedRewardRadio.value;
        }
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
    
    // --- 状态栏图标切换逻辑 ---
    const statusBarIconSelector = container.querySelector('.statusbar-icon-selector');
    if (statusBarIconSelector) {
        const statusBarIconOptions = statusBarIconSelector.querySelectorAll('.icon-option');
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
                targetCheckbox.dispatchEvent(new Event('input'));
            });
        });
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

        // 背景
        bg: 'templates/alipay-details/icons/background.png',
        billManagementStyle1: 'templates/alipay-details/icons/bill-management-1.png',
        billManagementStyle2: 'templates/alipay-details/icons/bill-management-2.png',
        billManagementStyle3: 'templates/alipay-details/icons/bill-management-3.png',
        paymentReward1: 'templates/alipay-details/icons/reward-1.png',
        paymentReward2: 'templates/alipay-details/icons/reward-2.png',
    },

    // =================================================================================
    // 模板布局配置中心 (调整提示: 主要在这里修改数值来改变位置和样式)
    // =================================================================================
    config: {
        canvasWidth: 1290, // 画布的总宽度
        canvasHeight: 2796, // 画布的总高度
        
        // --- 顶部状态栏 ---
        statusBar: {
            baseY: 88,             // 整个状态栏的垂直位置 (Y坐标)
            timeX: 148,         // 左侧时间的水平位置 (X坐标)
            timeFont: 'bold 50px "PingFang"', // 时间的字体样式
            iconstartX: 290,   // 第一个状态图标的起始X坐标
            iconHeight: 35,      // 状态图标的高
            IconGap: 20,       // 状态图标之间的间隙
            signalIconHeight: 42,         // 信号图标的高度
            signalIconGapToBattery: 25,   // 信号图标与电池之间的间距
            batteryX: 1087,    // 电池图标的X坐标
            batteryWidth: 80,  // 电池图标主体的宽度
            batteryHeight: 37  // 电池图标主体的高度
        },
        
        // --- 中间核心信息卡片 ---
        mainCard: { 
            shopIconY: 383, 
            shopiconsize: 138, 
            shopNameY: 595, 
            shopNameFont: '48px "PingFang"', 
            amountY: 725, amountFont: 'bold 110px "AlipayNumber"',
        },

        // --- 底部详情列表 ---
        detailsList: { 
            startY: 980,      // [控制Y] 第一行的起始 Y 坐标
            rowHeight: 105,   // [控制间距] 每一行的高度，增大这个值可以增加行间距
            leftX: 80,       // [控制X] 左侧标签 (如 "支付时间") 的 X 坐标
            rightX: 410,      // [控制X] 右侧值 (如 "2025-10-20...") 的 X 坐标
            labelFont: '45px "PingFang"',
            valueFont: '42px "PingFang"', 
            labelColor: '#999999', 
            valueColor: '#333333',
            arrowColor: '#c6c6c6',
            multiLineHeight: 55,
            
            // 支付奖励图片尺寸
            rewardImageWidth: 490,
            rewardImageHeight: 109
        },

        // --- 最下方模块 ---
        bottomModules: {
            managementY: 2270,
            managementX: 56, 
            categoryY: 2589, 
            categoryLeftX: 110, 
            categoryRightX: 1172, 
            categoryFont: '46px "PingFang"',
            categoryLabelColor: '#333333', 
            categoryValueColor: '#999999',
        },

        // --- 颜色配置 ---
        colors: { 
            statusBar: '#000000' 
        }
    },

    // =================================================================================
    // 模板控制选项的HTML结构
    // =================================================================================
    getControlsHTML: () => `
        <fieldset>
            <legend>顶部状态栏</legend>

            <div class="input-group">
                <label>状态栏图标</label>
                <div class="statusbar-icon-selector">
                    <div class="icon-option icon-location" data-target="locationToggle"></div>
                    <input type="checkbox" class="control" data-id="locationToggle" style="display: none;">

                    <div class="icon-option icon-alarm" data-target="alarmIconToggle"></div>
                    <input type="checkbox" class="control" data-id="alarmIconToggle" style="display: none;">

                    <div class="icon-option icon-bell" data-target="bellIconToggle"></div>
                    <input type="checkbox" class="control" data-id="bellIconToggle" style="display: none;">
                    
                    <div class="icon-option icon-user" data-target="userIconToggle"></div>
                    <input type="checkbox" class="control" data-id="userIconToggle" style="display: none;">

                    <div class="icon-option icon-sleep" data-target="sleepIconToggle"></div>
                    <input type="checkbox" class="control" data-id="sleepIconToggle" style="display: none;">

                    <div class="icon-option icon-wifi" data-target="wifiIconToggle"></div>
                    <input type="checkbox" class="control" data-id="wifiIconToggle" style="display: none;">

                    <div class="icon-option icon-lte active" data-target="lteIconToggle"></div>
                    <input type="checkbox" class="control" data-id="lteIconToggle" checked style="display: none;">
                </div>
            </div>
            
            <div class="input-group"><label>时间</label><input type="time" class="control" data-id="time" value="21:10"></div>

            <div class="input-group"><label>电池电量: <span class="control-value" data-id="batteryValue">36</span>%</label><input type="range" class="control" data-id="battery" min="0" max="100" value="56"></div>
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
                <input type="file" class="control" data-id="merchantIcon">
            </div>
        </fieldset>
        
        <fieldset>
            <legend>账单列表</legend>
            <div class="input-group"><label>支付时间</label><input type="text" class="control" data-id="paymentTime" value="2025-10-20 17:06:37"></div>
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
            <legend>账单管理模块</legend>
            <div class="horizontal-controls-container">
                <div class="radio-group"><input type="radio" class="control" name="billManagementChoiceRadios" value="style1" checked> <label>日用百货</label></div>
                <div class="radio-group"><input type="radio" class="control" name="billManagementChoiceRadios" value="style2"> <label>餐饮美食</label></div>
                <div class="radio-group"><input type="radio" class="control" name="billManagementChoiceRadios" value="style3"> <label>家居数码</label></div>
            </div>
            <input type="hidden" class="control" data-id="billManagementChoice" value="style1">
        </fieldset>
        
        <fieldset>
            <legend>账单分类</legend>
            <div class="input-group">
                <input type="text" class="control" data-id="billCategoryName" value="日用百货">
            </div>
        </fieldset>
    `,

    // =================================================================================
    // 模板绘制函数
    // =================================================================================
    draw: (ctx, config, controls, assets) => {
        if (!assets.bg) return;
        ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
        ctx.drawImage(assets.bg, 0, 0);

        // 绘制顶部状态栏
        const st = config.statusBar;
        ctx.fillStyle = config.colors.statusBar;
        ctx.font = st.timeFont;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(controls.time, st.timeX, st.baseY);

        // --- 绘制左侧图标 ---
        let currentIconX = st.iconstartX;
        const iconY = st.baseY - (st.iconHeight / 2);
        const drawAndAdvanceIcon = (controlKey, asset, height, gap) => {
            if (controls[controlKey] && asset) {
                const calculatedWidth = height * (asset.width / asset.height);
                ctx.drawImage(asset, currentIconX, iconY, calculatedWidth, height);
                currentIconX += calculatedWidth + gap;
            }
        };
        drawAndAdvanceIcon('locationToggle', assets.locationIcon, st.iconHeight, st.IconGap);
        drawAndAdvanceIcon('alarmIconToggle', assets.alarmIcon, st.iconHeight, st.IconGap);
        drawAndAdvanceIcon('bellIconToggle', assets.bellIcon, st.iconHeight, st.IconGap);
        drawAndAdvanceIcon('userIconToggle', assets.userIcon, st.iconHeight, st.IconGap);

        // 最后一个图标后面不需要间隙，可以单独处理或修改辅助函数
        if (controls.sleepIconToggle && assets.sleepIcon) {
            const asset = assets.sleepIcon;
            const calculatedWidth = st.iconHeight * (asset.width / asset.height);
            ctx.drawImage(asset, currentIconX, iconY, calculatedWidth, st.iconHeight);
        }

        // --- 绘制右侧图标 ---
        let currentSignalX = st.batteryX; // 从电池左侧开始
        const iconY_signal = st.baseY - (st.signalIconHeight / 2);
        //  WiFi 图标
        if (controls.wifiIconToggle && assets.wifiIcon) {
            const asset = assets.wifiIcon;
            // [修正] 使用 st.signalIconHeight
            const calculatedWidth = st.signalIconHeight * (asset.width / asset.height);
            // [修正] 使用 st.signalIconGapToBattery
            const iconX = currentSignalX - st.signalIconGapToBattery - calculatedWidth;
            const iconY_signal = st.baseY - (st.signalIconHeight / 2);
            ctx.drawImage(asset, iconX, iconY_signal, calculatedWidth, st.signalIconHeight);
            currentSignalX = iconX;
        }

        // 绘制 LTE(信号) 图标
        if (controls.lteIconToggle && assets.lteIcon) {
            const asset = assets.lteIcon;
            const calculatedWidth = st.signalIconHeight * (asset.width / asset.height);
            // [修正] 使用 st.IconGap 作为信号和WiFi之间的间距
            const iconX = currentSignalX - st.IconGap - calculatedWidth;
            ctx.drawImage(asset, iconX, iconY_signal, calculatedWidth, st.signalIconHeight);
        }

        // --- 绘制电池 ---
        // [修正] 根据 st.baseY 和 st.batteryHeight 计算电池的Y坐标
        const batteryY = st.baseY - st.batteryHeight / 2;
        if (controls.battery > 0) {
            const fillWidth = (st.batteryWidth - 8) * (controls.battery / 100);
            drawRoundedRect(ctx, st.batteryX + 4, batteryY + 2, fillWidth, st.batteryHeight - 8, 8);
            ctx.fill();
        }

        // --- 2. 绘制中间核心信息卡片 ---
        const mc = config.mainCard;
        // 绘制商铺图标

        // [修正] 使用新的、更智能的头像选择逻辑
        let iconToDraw = null;
        if (controls.merchantIcon) { // 优先使用上传的头像
            iconToDraw = controls.merchantIcon;
        } else if (controls.merchantIconSelection && assets[controls.merchantIconSelection]) { // 其次使用选择的内置头像
            iconToDraw = assets[controls.merchantIconSelection];
        }
        
        // 使用 alipay-details 的配置
        if (iconToDraw) {
            const iconSize = mc.shopiconsize;
            const iconX = (config.canvasWidth - iconSize) / 2;
            const iconY = mc.shopIconY;

            // --- 开始圆形裁切 ---
            ctx.save(); // 1. 保存当前画布状态
            ctx.beginPath(); // 2. 开始一个新的路径
            
            // 3. 创建一个圆形路径 (arc的x,y是圆心坐标)
            ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
            
            // 4. 将这个圆形路径设置为“裁切区域”
            ctx.clip(); 
            
            // 5. 在这个圆形区域内绘制我们的(方形)图片
            ctx.drawImage(iconToDraw, iconX, iconY, iconSize, iconSize);
            
            // 6. 恢复画布状态，移除裁切效果，以免影响后续绘制
            ctx.restore(); 
        }
        
        // 绘制商户名称和金额
        ctx.font = mc.shopNameFont; ctx.fillStyle = '#333333'; ctx.textAlign = 'center';
        ctx.fillText(controls.shopName, config.canvasWidth / 2, mc.shopNameY);
        ctx.font = mc.amountFont;
        ctx.fillText(`-${parseFloat(controls.amount).toFixed(2)}`, config.canvasWidth / 2, mc.amountY);
        
        // --- 3. 绘制底部详情列表 ---
        const dl = config.detailsList; 
        ctx.textAlign = 'left'; 
        ctx.textBaseline = 'middle';
        let currentY = dl.startY;
        
        // [核心改动] 修改了 drawRow 函数，使其能处理带箭头的行
        const drawRow = (label, value, hasArrow = false) => {
            // 绘制左侧的灰色标签 (如 "支付时间")
            ctx.font = dl.labelFont; 
            ctx.fillStyle = dl.labelColor; 
            ctx.fillText(label, dl.leftX, currentY);
            
            // 绘制右侧的黑色值
            ctx.font = dl.valueFont; 
            ctx.fillStyle = dl.valueColor;
            
            // 特殊处理：收款方全称需要自动换行
            if (label === '收款方全称') { 
                drawWrappedText(ctx, value, dl.rightX, currentY, config.canvasWidth - dl.rightX - dl.leftX, dl.multiLineHeight); 
            } else if (hasArrow) {
                // 如果是带箭头的行 (如 "付款方式")
                const textWidth = ctx.measureText(value).width;
                const arrow = ' >';

                // 先绘制文本值 (如 "招商银行")
                ctx.fillText(value, dl.rightX, currentY);

                // 然后用配置中指定的新颜色，在文本右侧绘制箭头
                ctx.fillStyle = dl.arrowColor;
                ctx.fillText(arrow, dl.rightX + textWidth, currentY);
            } else { 
                // 普通的行，直接绘制值
                ctx.fillText(value, dl.rightX, currentY); 
            }
            currentY += dl.rowHeight + 2; // Y坐标下移，准备绘制下一行
        };
        
        // 依次调用函数绘制每一行
        drawRow('支付时间', controls.paymentTime); 
        drawRow('付款方式', controls.paymentMethod, true);
        drawRow('商品说明', controls.productDesc);
        
        // 1. 绘制左侧标签 "支付奖励"
        ctx.font = dl.labelFont; 
        ctx.fillStyle = dl.labelColor; 
        ctx.fillText('支付奖励', dl.leftX, currentY);

        // 2. 根据用户的选择，绘制右侧对应的图片
        if (controls.paymentRewardChoice === 'reward1' && assets.paymentReward1) {
            // 图片的Y坐标需要计算一下，使其在行内垂直居中
            const imageY = currentY - (dl.rewardImageHeight / 2) + 6;
            ctx.drawImage(assets.paymentReward1, dl.rightX - 50, imageY, dl.rewardImageWidth, dl.rewardImageHeight);
        } else if (controls.paymentRewardChoice === 'reward2' && assets.paymentReward2) {
            const imageY = currentY - (dl.rewardImageHeight / 2) + 6;
            ctx.drawImage(assets.paymentReward2, dl.rightX - 50, imageY, dl.rewardImageWidth, dl.rewardImageHeight);
        }
        
        // 3. 别忘了将 Y 坐标下移一行！
        currentY += dl.rowHeight + 20;
        
        drawRow('收单机构', controls.acquirer); 
        drawRow('清算机构', controls.clearingHouse);
        drawRow('收款方全称', controls.payeeFullName);
        drawRow('推荐服务', '');

        // --- 4. 绘制最下方的模块 ---
        const bm = config.bottomModules;

        // 根据单选按钮的值，绘制不同样式的“账单管理”图片
        if (controls.billManagementChoice === 'style1' && assets.billManagementStyle1) {
            ctx.drawImage(assets.billManagementStyle1, bm.managementX, bm.managementY);
        } else if (controls.billManagementChoice === 'style2' && assets.billManagementStyle2) {
            ctx.drawImage(assets.billManagementStyle2, bm.managementX, bm.managementY);
        } else if (controls.billManagementChoice === 'style3' && assets.billManagementStyle3) {
            ctx.drawImage(assets.billManagementStyle3, bm.managementX, bm.managementY);
        }
        
        // [改动] 移除了 if 判断，让“账单分类”模块始终绘制
        ctx.font = bm.categoryFont;
        ctx.fillStyle = bm.categoryValueColor;
        ctx.textAlign = 'right';
        // 使用 billCategoryName 的值来绘制，这个值已经通过JS联动自动更新了
        ctx.fillText(controls.billCategoryName, bm.categoryRightX, bm.categoryY);
    }
};