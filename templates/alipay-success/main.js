import { drawRoundedRect } from '../../js/utils.js';

// 存储用户选择奖励的顺序
let rewardSelectionOrder = [];

// 导出一个模板专属的初始化函数
export function initialize(drawCanvasCallback) {
    // 清空上一次的顺序记录，以防模板切换后状态混乱
    rewardSelectionOrder = [];

    const container = document.getElementById('template-controls-container');
    if (!container) return;

    // 找到所有“支付有礼”的复选框
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
                // 如果是勾选，并且之前没在列表里，就把它添加到列表末尾
                if (!rewardSelectionOrder.includes(rewardId)) {
                    rewardSelectionOrder.push(rewardId);
                }
            } else {
                // 如果是取消勾选，就从列表中移除它
                rewardSelectionOrder = rewardSelectionOrder.filter(id => id !== rewardId);
            }
            
            // 状态更新后，立即调用主绘图函数重绘画布
            drawCanvasCallback();
        });
    });
}

// 导出该模板的完整配置对象
export const template = {
    assets: {
        bg: 'templates/alipay-success/icons/background.png',
        locationIcon: 'templates/alipay-success/icons/location.png',
        alarmIcon: 'templates/alipay-success/icons/alarmIcon.png',
        userIcon: 'templates/alipay-success/icons/userIcon.png',
        sleepIcon: 'templates/alipay-success/icons/sleepIcon.png',
        reward1: 'templates/alipay-success/icons/reward-1.png',
        reward2: 'templates/alipay-success/icons/reward-2.png',
        reward3: 'templates/alipay-success/icons/reward-3.png',
        reward4: 'templates/alipay-success/icons/reward-4.png',
        currency: 'templates/alipay-success/icons/currency.png',
    },

    // =================================================================================
    // 模板布局配置中心 (调整提示: 主要在这里修改数值来改变位置和样式)
    // =================================================================================
    config: {
        canvasWidth: 1170, // 画布的总宽度
        canvasHeight: 2532, // 画布的总高度

        // --- 顶部状态栏 ---
        statusBar: { 
            y: 50,             // 整个状态栏的垂直位置 (Y坐标)
            timeX: 65,         // 左侧时间的水平位置 (X坐标)
            timeFont: 'bold 48px "PingFang"', // 时间的字体样式
            iconstartX: 205,   // 第一个状态图标的起始X坐标
            IconY: 55,         // 所有状态图标的Y坐标
            iconsize: 40,      // 状态图标的边长 (正方形)
            IconGap: 8,       // 状态图标之间的间
            batteryX: 1040,    // 电池图标的X坐标
            batteryY: 57,      // 电池图标的Y坐标
            batteryWidth: 67,  // 电池图标主体的宽度
            batteryHeight: 34  // 电池图标主体的高度
        },

        // --- 核心支付信息 ---
        paymentInfo: { 
            amountY: 501,      // 金额数字文本的基线 Y 坐标
            amountFont: 'bold 135px "AlipayNumber"', // 金额数字的字体样式
            currencySize: 90,   // 人民币图标的边长
            currencyGap: 10,    // 人民币图标和金额数字之间的空隙

            // 下方详情区域的定位基准
            detailsAnchorY: 740,    // 作为基准线的“交易方式”这一行的 Y 坐标
            detailsRowHeight: 75,   // 详情区域每一行的高度
            detailsLeftX: 70,       // 详情区域左侧文本的 X 坐标
            detailsRightX: 1095,    // 详情区域右侧文本的 X 坐标 (用于右对齐)
            payeeFont: '42px "PingFang"',    // 收款方那一行的大字体
            detailsFont: '42px "PingFang"' // 其他详情行的小字体
        },

        // --- 底部奖励模块 ---
        rewards: { 
            startY: 952,        // 第一个奖励模块图片的起始 Y 坐标
            startX: 58,  // 奖励模块的水平位置 (X坐标)
            gap: 66 //奖励模块之间的垂直间距 (空隙)
        },

        // --- 颜色配置 ---
        colors: { 
            statusBar: '#FFFFFF', 
            mainText: '#FFFFFF', 
            deduction: '#FFFFFF' 
        }
    },
    
    // 返回该模板控制选项的HTML字符串
    getControlsHTML: () => `
        <fieldset>
            <legend>顶部状态栏</legend>
            <div class="input-group"><label>时间</label><input type="time" class="control" data-id="time" value="03:00"></div>

            <!-- [新] 使用我们刚刚创建的容器包裹所有需要水平排列的复选框 -->
            <div class="horizontal-controls-container">
                <div class="checkbox-group">
                    <input type="checkbox" class="control" data-id="locationToggle" checked><label>定位</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" class="control" data-id="alarmIconToggle"><label>声音</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" class="control" data-id="userIconToggle"><label>个人</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" class="control" data-id="sleepIconToggle"><label>睡眠</label>
                </div>
            </div>

            <div class="input-group">
                <label>电池电量: <span class="control-value" data-id="batteryValue">100</span>%</label>
                <input type="range" class="control" data-id="battery" min="0" max="100" value="100">
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
                    <button data-target="methodInput" data-value="花呗">花呗</button>
                    <button data-target="methodInput" data-value="招商银行储蓄卡(5812)">招商银行</button>
                    <button data-target="methodInput" data-value="光大银行信用卡(6820)">光大银行</button>
                </div>
            </div>
            <div class="input-group checkbox-group"><input type="checkbox" class="control" data-id="deductionToggle"><label>随机立减</label><input type="text" class="control" data-id="deductionAmount" value="0.08" style="width: 80px;"></div>
        </fieldset>
        <fieldset>
            <legend>支付有礼</legend>
            <div class="horizontal-controls-container">
                <div class="checkbox-group">
                    <!-- 添加 class="reward-checkbox" 和 data-reward-id="reward1" -->
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
        ctx.textBaseline = 'top'; 
        ctx.fillText(controls.time, st.timeX, st.y);
        
        // 依次绘制状态图标，每画一个，下一个的X坐标就向右移动
        let currentIconX = st.iconstartX;
        if (controls.locationToggle && assets.locationIcon) { ctx.drawImage(assets.locationIcon, currentIconX, st.IconY, st.iconsize, st.iconsize); currentIconX += st.iconsize + st.IconGap; }
        if (controls.alarmIconToggle && assets.alarmIcon) { ctx.drawImage(assets.alarmIcon, currentIconX, st.IconY, st.iconsize, st.iconsize); currentIconX += st.iconsize + st.IconGap; }
        if (controls.userIconToggle && assets.userIcon) { ctx.drawImage(assets.userIcon, currentIconX, st.IconY, st.iconsize, st.iconsize); }
        if (controls.sleepIconToggle && assets.sleepIcon) { ctx.drawImage(assets.sleepIcon, currentIconX, st.IconY, st.iconsize, st.iconsize); }
        
        // 绘制电池
        if (controls.battery > 0) { const fillWidth = (st.batteryWidth - 10) * (controls.battery / 100); drawRoundedRect(ctx, st.batteryX + 5, st.batteryY + 5, fillWidth, st.batteryHeight - 10, 4); ctx.fill(); }
        
        // --- 2. 绘制核心支付信息 ---
        const pi = config.paymentInfo; 
        ctx.fillStyle = config.colors.mainText;
        const originalAmount = parseFloat(controls.amount) || 0; 
        const deduction = parseFloat(controls.deductionAmount) || 0; 
        let finalAmount = controls.deductionToggle ? (originalAmount - deduction) : originalAmount;

        // --- 金额绘制逻辑 ---
        if (assets.currency) {
            const amountText = finalAmount.toFixed(2);
            ctx.font = pi.amountFont;

            // 步骤1: 计算图标和数字连在一起的总宽度
            const textWidth = ctx.measureText(amountText).width;
            const totalWidth = pi.currencySize + pi.currencyGap + textWidth;

            // 步骤2: 计算起始X坐标，以确保 "图标+数字" 这个整体在画布上水平居中
            const startX = (config.canvasWidth - totalWidth) / 2;

            // 步骤3: 计算图标的坐标
            const IconX = startX;
            // 调整提示: 这里的 '15' 是一个微调值，用于调整图标的垂直位置，使其与数字在视觉上对齐。
            // 减小这个值会使图标上移，增大则下移。
            const IconY = pi.amountY - pi.currencySize + 15; 

            // 步骤4: 绘制图标
            ctx.drawImage(assets.currency, IconX, IconY, pi.currencySize, pi.currencySize);

            // 步骤5: 绘制金额数字，位置在图标的右侧
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic'; 
            ctx.fillText(amountText, IconX + pi.currencySize + pi.currencyGap, pi.amountY);
        } else {
            // 如果图标加载失败，回退到原始的文本绘制方式
            ctx.font = pi.amountFont; 
            ctx.textAlign = 'center'; 
            ctx.fillText(`¥${finalAmount.toFixed(2)}`, config.canvasWidth / 2, pi.amountY);
        }

        // 根据是否开启“随机立减”，来决定实际使用的行高值
        const currentRowHeight = controls.deductionToggle ? 65 : pi.detailsRowHeight;

        // --- 详情信息绘制 (随机立减、收款方等) ---
        let payeeY;
        // 根据是否显示"随机立减"来决定上方收款方信息的位置
        if (controls.deductionToggle) {
            // 如果显示，收款方位置在基准线上方两行
            payeeY = pi.detailsAnchorY - currentRowHeight * 2;
            const deductionY = payeeY + currentRowHeight;  // 立减行在收款方下一行
            ctx.font = pi.detailsFont; ctx.textAlign = 'left'; ctx.fillText('支付宝随机立减', pi.detailsLeftX, deductionY);
            ctx.fillStyle = config.colors.deduction; ctx.textAlign = 'right'; ctx.fillText(`- ¥ ${deduction.toFixed(2)}`, pi.detailsRightX, deductionY);
        } else {
            // 使用动态计算出的行高来确定位置
            payeeY = pi.detailsAnchorY - currentRowHeight;
        }
        
        // 绘制收款方信息
        ctx.font = pi.payeeFont; ctx.fillStyle = config.colors.mainText; ctx.textAlign = 'left'; ctx.fillText(controls.payee, pi.detailsLeftX, payeeY);
        ctx.textAlign = 'right'; ctx.fillText(`¥ ${originalAmount.toFixed(2)}`, pi.detailsRightX, payeeY);
        
        // 绘制作为基准的"交易方式"行
        ctx.font = pi.detailsFont; ctx.fillStyle = config.colors.mainText; ctx.textAlign = 'left'; ctx.fillText('交易方式', pi.detailsLeftX, pi.detailsAnchorY);
        ctx.textAlign = 'right'; ctx.fillText(controls.methodInput, pi.detailsRightX, pi.detailsAnchorY);
        
        // --- [核心改动] 3. 绘制底部奖励模块 ---
        const rw = config.rewards;
        let currentRewardY = rw.startY;
        let currentRewardX = rw.startX;

        rewardSelectionOrder.forEach(rewardId => {
            // 根据 rewardId (如 'reward1') 从 assets 对象中获取对应的图片
            const asset = assets[rewardId];
            if (asset) {
                ctx.drawImage(asset, currentRewardX, currentRewardY);
                // 更新下一个模块的Y坐标
                currentRewardY += asset.height + rw.gap;
            }
        });
    }
};