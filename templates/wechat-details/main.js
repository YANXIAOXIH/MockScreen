import { drawRoundedRect, drawWrappedText } from '../../js/utils.js';

export function initialize() {
    // 1. 获取所有需要联动的输入框元素
    const container = document.getElementById('template-controls-container');
    if (!container) return;

    const paymentTimeInput = container.querySelector('[data-id="paymentTime"]');
    const transactionIdInput = container.querySelector('[data-id="transactionId"]');
    const merchantIdInput = container.querySelector('[data-id="merchantId"]');

    // 如果任何一个元素找不到，就提前退出，防止报错
    if (!paymentTimeInput || !transactionIdInput || !merchantIdInput) {
        console.warn('wechat-details: 缺少用于日期联动的输入框。');
        return;
    }

    // 2. 定义一个核心处理函数，用于更新单号
    const updateIdsBasedOnPaymentTime = () => {
        const timeValue = paymentTimeInput.value; // 例如 "2025年10月17日 21:33:33"
        
        // 如果值为空，则不操作
        if (!timeValue) return;

        // 直接替换掉非数字字符，得到 YYYYMMDD 格式的日期
        const dateString = timeValue.substring(0, 10).replace(/-/g, ''); // "2025-10-17" -> "20251017"

        const currentTransactionId = transactionIdInput.value;
        const currentMerchantId = merchantIdInput.value;

        // 交易单号格式: 前10位 + 8位日期 + 剩余部分
        const newTransactionId = currentTransactionId.substring(0, 10) + dateString + currentTransactionId.substring(18);
        
        // 商户单号格式: 8位日期 + 剩余部分
        const newMerchantId = dateString + currentMerchantId.substring(8);

        // 5. 将新生成的单号写回输入框
        transactionIdInput.value = newTransactionId;
        merchantIdInput.value = newMerchantId;

        // 6. [关键] 手动触发事件，让 Canvas 更新
        transactionIdInput.dispatchEvent(new Event('input'));
        merchantIdInput.dispatchEvent(new Event('input'));
    };

    // 7. 为“支付时间”输入框绑定事件监听器
    paymentTimeInput.addEventListener('input', updateIdsBasedOnPaymentTime);

    // 8. (可选但推荐) 页面首次加载时也运行一次，确保初始状态是同步的
    updateIdsBasedOnPaymentTime();
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
        defaultMerchantIcon: 'templates/wechat-details/icons/close-icon.png', // 默认商户图标
        billServiceStyle1: 'templates/wechat-details/icons/bill-service-1.png', // 账单服务样式一
        billServiceStyle2: 'templates/wechat-details/icons/bill-service-2.png', // 账单服务样式二
        billServiceStyle3: 'templates/wechat-details/icons/bill-service-3.png', // 账单服务样式三
    },

    // =================================================================================
    // 模板布局配置中心
    // =================================================================================
    config: {
        canvasWidth: 1290,
        canvasHeight: 2796,
        
        // --- 状态栏 ---
        statusBar: { 
            baseY: 88,
            timeX: 140,
            timeFont: 'bold 50px "PingFang"',
            iconstartX: 290,   // 第一个状态图标的起始X坐标
            iconHeight: 35,      // 状态图标的高
            IconGap: 20,       // 状态图标之间的间隙
            signalIconHeight: 42,         // 信号图标的高度
            signalIconGapToBattery: 25,   // 信号图标与电池之间的间距
            batteryX: 1087,    // 电池图标的X坐标
            batteryWidth: 80,  // 电池图标主体的宽度
            batteryHeight: 38  // 电池图标主体的高度
        },
        
        // --- 核心信息 ---
        mainContent: {
            merchantIconY: 350,
            merchantIconSize: 155,
            merchantNameY: 590,
            merchantNameFont: '48px "AlipayNumber"',
            amountY: 735,
            amountFont: '100px "AlipayNumber"',
        },
        
        // --- 账单详情列表 ---
        detailsList: { 
            startY: 1025,            // 列表第一行的 Y 坐标 (整体上下移动)
            leftX: 95,               // 左侧标签的 X 坐标
            rightX: 356,             // 右侧内容的 X 坐标
            rowHeight: 87,           // 每一行的基础高度 (行间距)
            multiLineSpacing: 55,    // 多行内容时，第二行的额外间距
            labelFont: '39px "AlipayNumber"', // 左侧标签的字体
            valueFont: '41px "PingFang SC"', // 右侧内容的字体
            labelColor: '#8f8f8f',   // 左侧标签的颜色
            valueColor: '#000000',   // 右侧主内容的颜色
            subValueColor: '#8f8f8f', // 右侧次要内容 (附注) 的颜色
        },

        // --- 账单服务 ---
        billServices: {
            imageY: 2125,
        },

        colors: {
            statusBar: '#000000'
        }
    },
    
    // =================================================================================
    // 模板控制选项HTML
    // =================================================================================
    getControlsHTML: () => `
        <fieldset>
            <legend>顶部状态栏 (复用)</legend>
            <div class="input-group"><label>时间</label><input type="time" class="control" data-id="time" value="18:40"></div>
            <div class="horizontal-controls-container">
                <div class="checkbox-group"><input type="checkbox" class="control" data-id="locationToggle"><label>定位</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control" data-id="alarmIconToggle"><label>闹钟</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control" data-id="bellIconToggle"><label>铃声</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control" data-id="userIconToggle"><label>个人</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control" data-id="sleepIconToggle"><label>睡眠</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control" data-id="wifiIconToggle"><label>wifi</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control" data-id="lteIconToggle"checked><label>信号</label></div>
            </div>

            <div class="input-group">
                <label>电池电量: <span class="control-value" data-id="batteryValue">80</span>%</label>
                <input type="range" class="control" data-id="battery" min="0" max="100" value="80">
            </div>
        </fieldset>

        <fieldset>
            <legend>核心信息</legend>
            <div class="input-group">
                <label>商户头像</label>
                <input type="file" class="control" data-id="merchantIcon">
            </div>
            <div class="input-group"><label>商户名称</label><input type="text" class="control" data-id="merchantName" value="简知"></div>
            <div class="input-group"><label>金额</label><input type="text" class="control" data-id="amount" value="4680"></div>
        </fieldset>
        
        <fieldset>
            <legend>账单详情</legend>
            <div class="input-group"><label>当前状态</label><input type="text" class="control" data-id="status" value="支付成功"></div>
            <div class="input-group"><label>支付时间</label><input type="datetime-local" class="control" data-id="paymentTime" value="2025-10-17T21:33"></div>
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

        // --- 2. 绘制状态栏 (逻辑不变) ---
        const st = config.statusBar;
        ctx.fillStyle = config.colors.statusBar;
        ctx.font = st.timeFont;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(controls.time, st.timeX, st.baseY);
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
        if (controls.sleepIconToggle && assets.sleepIcon) {
            const asset = assets.sleepIcon;
            const calculatedWidth = st.iconHeight * (asset.width / asset.height);
            ctx.drawImage(asset, currentIconX, iconY, calculatedWidth, st.iconHeight);
        }

        // --- 绘制右侧图标 ---
        let currentSignalX = st.batteryX;
        const iconY_signal = st.baseY - (st.signalIconHeight / 2);
        if (controls.wifiIconToggle && assets.wifiIcon) {
            const asset = assets.wifiIcon;
            const calculatedWidth = st.signalIconHeight * (asset.width / asset.height);
            const iconX = currentSignalX - st.signalIconGapToBattery - calculatedWidth;
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

        const batteryY = st.baseY - st.batteryHeight / 2;
        if (controls.battery > 0) {
            const fillWidth = (st.batteryWidth - 8) * (controls.battery / 100);
            drawRoundedRect(ctx, st.batteryX + 4, batteryY + 2, fillWidth, st.batteryHeight - 8, 8);
            ctx.fill();
        }

        // --- 4. 绘制核心信息 ---
        const mc = config.mainContent;
        const merchantIcon = controls.merchantIcon || assets.defaultMerchantIcon;
        if (merchantIcon) {
            ctx.save();
            ctx.beginPath();
            const iconX = config.canvasWidth / 2 - mc.merchantIconSize / 2;
            ctx.arc(iconX + mc.merchantIconSize / 2, mc.merchantIconY + mc.merchantIconSize / 2, mc.merchantIconSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(merchantIcon, iconX, mc.merchantIconY, mc.merchantIconSize, mc.merchantIconSize);
            ctx.restore();
        }
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000000';
        ctx.font = mc.merchantNameFont;
        ctx.fillText(controls.merchantName, config.canvasWidth / 2, mc.merchantNameY);
        ctx.font = mc.amountFont;
        ctx.fillText(`-${parseFloat(controls.amount || 0).toFixed(2)}`, config.canvasWidth / 2, mc.amountY);

        // --- 5. 绘制账单详情列表 ---
        const dl = config.detailsList;
        let currentY = dl.startY;
        
        // 定义一个强大的辅助函数来绘制每一行
        const drawDetailRow = (label, value, value2 = null) => {
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            // 绘制左侧标签
            ctx.font = dl.labelFont;
            ctx.fillStyle = dl.labelColor;
            ctx.fillText(label, dl.leftX, currentY);

            // 绘制右侧值
            ctx.font = dl.valueFont;
            ctx.fillStyle = dl.valueColor;
            ctx.fillText(value, dl.rightX, currentY);
            
            // 如果有第二行值，绘制它并增加额外的高度
            if (value2) {
                // 在绘制第二行文本前，切换到灰色
                ctx.fillStyle = dl.subValueColor; 
                ctx.fillText(value2, dl.rightX, currentY + dl.multiLineSpacing);
                currentY += dl.rowHeight + dl.multiLineSpacing;
            } else {
                currentY += dl.rowHeight;
            }
        };
        
        // --- [新增] 在这里进行支付时间的格式转换 ---
        let formattedPaymentTime = '';
        if (controls.paymentTime) { // controls.paymentTime 的值是 "2025-10-17T21:33"
            const parts = controls.paymentTime.split('T');
            const datePart = parts[0].replace(/-/g, '年', 1).replace('-', '月') + '日';
            const timePart = parts[1];
            // 由于 datetime-local 不带秒，我们手动添加一个默认的秒
            formattedPaymentTime = `${datePart} ${timePart}:33`;
        }
        
        drawDetailRow('当前状态', controls.status);
        drawDetailRow('支付时间', formattedPaymentTime); // 使用新变量
        drawDetailRow('商品', controls.product);
        drawDetailRow('商户全称', controls.merchantFullName);
        drawDetailRow('收单机构', controls.acquirer, controls.acquirerSub);
        drawDetailRow('支付方式', controls.paymentMethod, controls.paymentMethodSub, true);
        drawDetailRow('交易单号', controls.transactionId);
        drawDetailRow('商户单号', controls.merchantId);

        // --- 6. 绘制账单服务 ---
        const bs = config.billServices;

        const selectedServiceImage = assets[`billServiceStyle${controls.billServiceSelection.slice(-1)}`];
        if (selectedServiceImage) {
            const imageX = (config.canvasWidth - selectedServiceImage.width) / 2;
            ctx.drawImage(selectedServiceImage, imageX, bs.imageY);
        }

    }
};