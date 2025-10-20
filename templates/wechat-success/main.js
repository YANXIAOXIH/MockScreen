import { drawRoundedRect } from '../../js/utils.js';

// 导出一个空的初始化函数
export function initialize() {
    // 此模板不需要追踪勾选顺序
}

// 导出该模板的完整配置对象
export const template = {
    // =================================================================================
    // 资源文件路径
    // =================================================================================
    assets: {
        bg: 'templates/wechat-success/icons/background.png',
        // 状态栏图标
        locationIcon: 'templates/wechat-success/icons/location.png',
        alarmIcon: 'templates/wechat-success/icons/alarmIcon.png',
        userIcon: 'templates/wechat-success/icons/userIcon.png',
        sleepIcon: 'templates/wechat-success/icons/sleepIcon.png',
        // [关键修改] 将之前的支付通知图标，改名为支付通知横幅图片
        notificationBanner: 'templates/wechat-success/icons/payicon.png',
        // 底部助力图标
        helpIcon: 'templates/wechat-success/icons/help-flower.png',
        // 两种可选的优惠券图片
        shakeBanner1: 'templates/wechat-success/icons/reward-1.png',
        shakeBanner2: 'templates/wechat-success/icons/reward-2.png'
    },

    // =================================================================================
    // 模板布局配置中心
    // =================================================================================
    config: {
        canvasWidth: 1290, // 画布的总宽度
        canvasHeight: 2796, // 画布的总高度
        
        // --- [修改] 顶部状态栏 (恢复为支付宝模板的配置) ---
        statusBar: { 
            baseY: 88,
            timeX: 140,
            timeFont: '50px "PingFang"',
            iconstartX: 290,   // 第一个状态图标的起始X坐标
            iconsize: 48,      // 状态图标的边长
            IconGap: 8,       // 状态图标之间的间隙
            batteryX: 1089,    // 电池图标的X坐标
            batteryWidth: 75,  // 电池图标主体的宽度
            batteryHeight: 35  // 电池图标主体的高度
        },
        
        // --- 顶部微信支付通知 ---
        notification: {
            y: 130,                   // 整个通知图片顶部的Y坐标
            amountX: 390,                 // 动态金额文字的X坐标
            amountY: 305,                 // 动态金额文字的Y坐标
            amountFont: '40px "PingFang"', // 动态金额文字的字体
            amountColor: '#9e9e9e'         // 动态金额文字的颜色
        },

        // --- 核心支付信息 ---
        mainContent: {
            merchantY: 600,
            merchantFont: '55px "PingFang"', // 也可以适当调整字体大小
            amountY: 705,
            amountFont: 'bold 140px "AlipayNumber"',
            currencyFont: '100px "AlipayNumber"',
            currencyGap: 5
        },
        
        // --- 摇一摇优惠 ---
        shakeBanner: {
            y: 965
        },

        // --- 底部区域 ---
        helpLink: {
            y: 2125,
            iconSize: 45,
            iconTextGap: 25,
            font: '40px "PingFang"',
            text: '助力乡村儿童营养改善 >'
        },
        
        colors: { 
            statusBar: '#FFFFFF',
            mainText: '#FFFFFF',
            subText: '#9E9E9E'
        }
    },
    
    // 返回该模板控制选项的HTML字符串
    getControlsHTML: () => `
        <fieldset>
            <legend>顶部状态栏</legend>
            <div class="input-group"><label>时间</label><input type="time" class="control" data-id="time" value="18:45"></div>
            <div class="horizontal-controls-container">
                <div class="checkbox-group"><input type="checkbox" class="control" data-id="locationToggle" checked><label>定位</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control" data-id="alarmIconToggle"><label>声音</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control" data-id="userIconToggle"><label>个人</label></div>
                <div class="checkbox-group"><input type="checkbox" class="control" data-id="sleepIconToggle"><label>睡眠</label></div>
            </div>
            <div class="input-group">
                <label>电池电量: <span class="control-value" data-id="batteryValue">80</span>%</label>
                <input type="range" class="control" data-id="battery" min="0" max="100" value="80">
            </div>
        </fieldset>

        <fieldset>
            <legend>页面内容</legend>
            <div class="input-group"><label>商家名称</label><input type="text" class="control" data-id="merchantName" value="简知"></div>
            <div class="input-group"><label>支付金额</label><input type="text" class="control" data-id="amount" value="4680"></div>
            <div class="input-group checkbox-group">
                <input type="checkbox" class="control" data-id="notificationToggle" checked><label>显示顶部支付通知</label>
            </div>
            <div class="input-group">
                <label>摇一摇优惠</label>
                <div class="radio-group" style="display: flex; gap: 15px; align-items: center;">
                    <input type="radio" name="shake-banner" class="control" data-id="shakeBannerSelection" value="shakeBanner1" checked> <label>样式一</label>
                    <input type="radio" name="shake-banner" class="control" data-id="shakeBannerSelection" value="shakeBanner2"> <label>样式二</label>
                    <input type="radio" name="shake-banner" class="control" data-id="shakeBannerSelection" value="none"> <label>不显示</label>
                </div>
            </div>
        </fieldset>
    `,

    // 模板专属的绘制函数
    draw: (ctx, config, controls, assets) => {
        if (!assets.bg) return;
        ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
        ctx.drawImage(assets.bg, 0, 0);
        
        // 1. 绘制状态栏
        const st = config.statusBar; 
        ctx.fillStyle = config.colors.statusBar; 
        ctx.font = st.timeFont;
        ctx.textAlign = 'left'; 
        ctx.textBaseline = 'middle';
        ctx.fillText(controls.time, st.timeX, st.baseY);
        
        const iconY = st.baseY - (st.iconsize / 2);
        let currentIconX = st.iconstartX;
        if (controls.locationToggle && assets.locationIcon) { 
            ctx.drawImage(assets.locationIcon, currentIconX, iconY, st.iconsize, st.iconsize); 
            currentIconX += st.iconsize + st.IconGap; 
        }
        if (controls.alarmIconToggle && assets.alarmIcon) { 
            ctx.drawImage(assets.alarmIcon, currentIconX, iconY, st.iconsize, st.iconsize); 
            currentIconX += st.iconsize + st.IconGap; 
        }
        if (controls.userIconToggle && assets.userIcon) { 
            ctx.drawImage(assets.userIcon, currentIconX, iconY, st.iconsize, st.iconsize); 
            currentIconX += st.iconsize + st.IconGap;
        }
        if (controls.sleepIconToggle && assets.sleepIcon) { 
            ctx.drawImage(assets.sleepIcon, currentIconX, iconY, st.iconsize, st.iconsize); 
        }

        // 绘制电池
        const batteryY = st.baseY - st.batteryHeight / 2; 
        if (controls.battery > 0) { 
            const fillWidth = (st.batteryWidth - 8) * (controls.battery / 100);
            drawRoundedRect(ctx, st.batteryX + 4, batteryY + 2, fillWidth, st.batteryHeight - 8, 7); 
            ctx.fill(); 
        }

        // --- 2. [关键修改] 绘制顶部微信支付通知 (新逻辑) ---
        if (controls.notificationToggle && assets.notificationBanner) {
            const nf = config.notification;
            const banner = assets.notificationBanner;

            // 首先，将整个通知栏图片居中绘制
            const bannerX = (config.canvasWidth - banner.width) / 2;
            ctx.drawImage(banner, bannerX, nf.y);
            
            // 然后，在图片上叠加绘制动态金额文字
            ctx.fillStyle = nf.amountColor;
            ctx.font = nf.amountFont;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const amountValue = (parseFloat(controls.amount) || 0).toFixed(2);
            ctx.fillText(`${amountValue}`, nf.amountX, nf.amountY);
        }

        // --- 3. 绘制核心支付信息 ---
        const mc = config.mainContent;
        ctx.fillStyle = config.colors.mainText;
        
        // 绘制商家名称
        ctx.font = mc.merchantFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(controls.merchantName, config.canvasWidth / 2, mc.merchantY);

        // 绘制金额
        const amountText = (parseFloat(controls.amount) || 0).toFixed(2);
        const currencySymbol = '¥ ';

        // 步骤1: 分别设置字体，并测量各自的宽度
        ctx.font = mc.currencyFont;
        const currencyWidth = ctx.measureText(currencySymbol).width;
        ctx.font = mc.amountFont;
        const amountWidth = ctx.measureText(amountText).width;
        
        // 步骤2: 计算“符号 + 间隙 + 数字”的总宽度
        const totalWidth = currencyWidth + mc.currencyGap + amountWidth;
        
        // 步骤3: 计算出能让这个整体居中的起始X坐标
        const startX = (config.canvasWidth - totalWidth) / 2;

        // 步骤4: 依次绘制符号和数字
        ctx.textAlign = 'left'; // 因为我们手动计算了起点，所以这里必须是 left
        ctx.textBaseline = 'top'; // 使用同一基线对齐

        // 绘制人民币符号
        ctx.font = mc.currencyFont;
        ctx.fillText(currencySymbol, startX, mc.amountY);
        
        // 绘制金额数字
        ctx.font = mc.amountFont;
        ctx.fillText(amountText, startX + currencyWidth + mc.currencyGap, mc.amountY);


        // --- 4. 绘制可选的优惠券 (逻辑不变) ---
        const selectedBannerKey = controls.shakeBannerSelection;
        if (selectedBannerKey && selectedBannerKey !== 'none') {
            const bannerAsset = assets[selectedBannerKey];
            if (bannerAsset) {
                const bannerX = (config.canvasWidth - bannerAsset.width) / 2;
                ctx.drawImage(bannerAsset, bannerX, config.shakeBanner.y);
            }
        }

        // --- 5. 绘制底部助力链接 (逻辑不变) ---
        const hl = config.helpLink;
        ctx.font = hl.font;
        const helpTextWidth = ctx.measureText(hl.text).width;
        const helpTotalWidth = hl.iconSize + hl.iconTextGap + helpTextWidth;
        const helpStartX = (config.canvasWidth - helpTotalWidth) / 2;
        if (assets.helpIcon) {
            ctx.drawImage(assets.helpIcon, helpStartX, hl.y - hl.iconSize/2, hl.iconSize, hl.iconSize);
        }
        ctx.fillStyle = config.colors.subText;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(hl.text, helpStartX + hl.iconSize + hl.iconTextGap, hl.y);

    }
};