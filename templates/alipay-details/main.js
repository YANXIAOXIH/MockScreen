import { drawRoundedRect, drawWrappedText } from '../../js/utils.js';

//导入模板初始化函数的能力。
export function initialize(drawCanvasCallback) {
    const container = document.getElementById('template-controls-container');
    if (!container) return;

    // [修正] 通过 name 属性找到所有单选按钮
    const managementRadios = container.querySelectorAll('input[name="billManagementChoiceRadios"]');
    // [修正] 找到用于联动的文本输入框
    const categoryNameInput = container.querySelector('input[data-id="billCategoryName"]');
    // [修正] 找到用于存储最终值的隐藏输入框
    const hiddenChoiceInput = container.querySelector('input[data-id="billManagementChoice"]');

    managementRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            const currentRadio = event.target;
            if (currentRadio.checked && categoryNameInput && hiddenChoiceInput) {
                // 1. 更新隐藏输入框的值 (e.g., 'style1')
                hiddenChoiceInput.value = currentRadio.value;
                
                // 2. 更新可见的分类名称输入框的文本
                categoryNameInput.value = currentRadio.nextElementSibling.textContent;

                
                // 3. 在隐藏输入框上触发事件，通知主程序更新画布
                hiddenChoiceInput.dispatchEvent(new Event('input'));
                
                // 4. 同时也在可见输入框上触发事件，以防有其他逻辑依赖它
                categoryNameInput.dispatchEvent(new Event('input'));
            }
        });
    });

    // 页面首次加载时，确保所有值都正确同步
    const checkedRadio = container.querySelector('input[name="billManagementChoiceRadios"]:checked');
    if (checkedRadio && categoryNameInput && hiddenChoiceInput) {
        hiddenChoiceInput.value = checkedRadio.value;
        categoryNameInput.value = checkedRadio.nextElementSibling.textContent;
    }
    
    // --- [新增] 处理支付奖励联动 ---
    const rewardRadios = container.querySelectorAll('input[name="paymentRewardChoiceRadios"]');
    const hiddenRewardInput = container.querySelector('input[data-id="paymentRewardChoice"]');
    
    rewardRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            if(event.target.checked && hiddenRewardInput) {
                hiddenRewardInput.value = event.target.value;
                hiddenRewardInput.dispatchEvent(new Event('input'));
            }
        });
    });
    
    const checkedRewardRadio = container.querySelector('input[name="paymentRewardChoiceRadios"]:checked');
    if(checkedRewardRadio && hiddenRewardInput) {
        hiddenRewardInput.value = checkedRewardRadio.value;
    }
}

export const template = {
    assets: {
        bg: 'templates/alipay-details/icons/background.png',
        locationIcon: 'templates/alipay-details/icons/location.png',
        alarmIcon: 'templates/alipay-details/icons/alarmIcon.png',
        userIcon: 'templates/alipay-details/icons/userIcon.png',
        sleepIcon: 'templates/alipay-details/icons/sleepIcon.png',
        shopIcon: 'templates/alipay-details/icons/shop-icon.png',
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
            y: 88,             // 整个状态栏的垂直位置 (Y坐标)
            timeX: 148,         // 左侧时间的水平位置 (X坐标)
            timeFont: 'bold 50px "PingFang"', // 时间的字体样式
            iconstartX: 300,   // 第一个状态图标的起始X坐标
            iconY: 63,         // 所有状态图标的Y坐标
            iconsize: 48,      // 状态图标的边长 (正方形)
            iconGap: 8,       // 状态图标之间的间
            batteryX: 1086,    // 电池图标的X坐标
            batteryY: 66,      // 电池图标的Y坐标
            batteryWidth: 81,  // 电池图标主体的宽度
            batteryHeight: 40  // 电池图标主体的高度
        },
        
        // --- 中间核心信息卡片 ---
        mainCard: { 
            shopIconY: 385, 
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
            <div class="input-group"><label>时间</label><input type="time" class="control" data-id="time" value="21:10"></div>
            <div class="horizontal-controls-container">
                <div class="checkbox-group"><input type="checkbox" class="control" data-id="locationToggle" checked><label>定位</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control" data-id="alarmIconToggle"><label>声音</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control" data-id="userIconToggle"><label>个人</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control" data-id="sleepIconToggle"><label>睡眠</label></div>
            </div>

            <div class="input-group"><label>电池电量: <span class="control-value" data-id="batteryValue">36</span>%</label><input type="range" class="control" data-id="battery" min="0" max="100" value="56"></div>
        </fieldset>
        
        <fieldset>
            <legend>核心信息</legend>
            <div class="input-group"><label>商户名称</label><input type="text" class="control" data-id="shopName" value="简知"></div>
            <div class="input-group"><label>金额 (输入正数)</label><input type="text" class="control" data-id="amount" value="4680"></div>
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
        const st = config.statusBar;
        ctx.fillStyle = config.colors.statusBar;
        ctx.font = st.timeFont;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(controls.time, st.timeX, st.y);

        let currentIconX = st.iconstartX;
        if (controls.locationToggle && assets.locationIcon) { ctx.drawImage(assets.locationIcon, currentIconX, st.iconY, st.iconsize, st.iconsize); currentIconX += st.iconsize + st.iconGap; }
        if (controls.alarmIconToggle && assets.alarmIcon) { ctx.drawImage(assets.alarmIcon, currentIconX, st.iconY, st.iconsize, st.iconsize); currentIconX += st.iconsize + st.iconGap; }
        if (controls.userIconToggle && assets.userIcon) { ctx.drawImage(assets.userIcon, currentIconX, st.iconY, st.iconsize, st.iconsize); currentIconX += st.iconsize + st.iconGap; }
        if (controls.sleepIconToggle && assets.sleepIcon) { ctx.drawImage(assets.sleepIcon, currentIconX, st.iconY, st.iconsize, st.iconsize); } // 最后一个图标后面不加gap
        
        // 绘制电池
        if (controls.battery > 0) { const fillWidth = (st.batteryWidth - 10) * (controls.battery / 100); drawRoundedRect(ctx, st.batteryX + 5, st.batteryY + 5, fillWidth, st.batteryHeight - 10, 6); ctx.fill(); }
        
        // --- 2. 绘制中间核心信息卡片 ---
        const mc = config.mainCard;
        // 绘制商铺图标
        if (assets.shopIcon) ctx.drawImage(assets.shopIcon, config.canvasWidth / 2 - mc.shopiconsize / 2, mc.shopIconY, mc.shopiconsize, mc.shopiconsize);
        
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