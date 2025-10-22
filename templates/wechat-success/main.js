import { drawRoundedRect } from '../../js/utils.js';

// 导出一个空的初始化函数
export function initialize() {
    const container = document.getElementById('template-controls-container');
    if (!container) return;
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

// 导出该模板的完整配置对象
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
        // 背景
        bg: 'templates/wechat-success/icons/background.png',
        // 支付通知横幅图片
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
        
        // --- [修改] 顶部状态栏 ---
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
        
        // --- 顶部微信支付通知 ---
        notification: {
            y: 133,                   // 整个通知图片顶部的Y坐标
            amountX: 389,                 // 动态金额文字的X坐标
            amountY: 308,                 // 动态金额文字的Y坐标
            amountFont: '40px "PingFang"', // 动态金额文字的字体
            amountColor: '#6e6e6e'         // 动态金额文字的颜色
        },

        // --- 核心支付信息 ---
        mainContent: {
            merchantY: 600,
            merchantFont: '55px "AlipayNumber"',
            amountY: 700,
            amountFont: 'bold 140px "AlipayNumber"',
            currencyFont: 'bold 101px "AlipayNumber"',
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
        },

        colors: { 
            statusBar: '#000000',
            mainText: '#1a1a1a',      // 用于商家名称等普通主要文本
            amountColor: '#1a1a1a',   //金额
            subText: '#808080'
        }
    },
    
    // 模板控制选项的HTML字符串
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
            <div class="input-group"><label>时间</label><input type="time" class="control" data-id="time" value="18:45"></div>

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
                <input type="checkbox" class="control" data-id="notificationToggle"><label>显示顶部支付通知</label>
            </div>
            <div class="input-group">
                <label>摇一摇优惠</label>
                <div class="radio-group" style="display: flex; gap: 15px; align-items: center;">
                    <input type="radio" name="shake-banner" class="control" data-id="shakeBannerSelection" value="shakeBanner1" checked> <label>样式一</label>
                    <input type="radio" name="shake-banner" class="control" data-id="shakeBannerSelection" value="shakeBanner2"> <label>样式二</label>
                    <input type="radio" name="shake-banner" class="control" data-id="shakeBannerSelection" value="none"> <label>不显示</label>
                </div>
            </div>
            <div class="input-group">
                <label>爱心助力</label>
                <input type="text" class="control" data-id="helpLinkText" value="助力乡村儿童营养改善">
                <div class="quick-buttons">
                    <button data-target="helpLinkText" data-value="助力乡村幼童科学养育">幼童科学</button>
                    <button data-target="helpLinkText" data-value="助力乡村儿童营养改善">儿童营养</button>
                    <button data-target="helpLinkText" data-value="关爱亚洲黑熊">亚洲黑熊</button>
                    <button data-target="helpLinkText" data-value="为环卫工人送爱心餐">环卫工人</button>
                </div>
            </div>
        </fieldset>
    `,

    // 模板专属的绘制函数
    draw: (ctx, config, controls, assets) => {
        if (!assets.bg) return;
        ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
        ctx.drawImage(assets.bg, 0, 0);

        // 定义一个辅助函数来绘制并更新X坐标
        function drawAndAdvanceIcon(controlKey, asset, height, gap) {
            if (controls[controlKey] && asset) {
                const calculatedWidth = height * (asset.width / asset.height);
                ctx.drawImage(asset, currentIconX, iconY, calculatedWidth, height);
                currentIconX += calculatedWidth + gap;
                return true; // 表示成功绘制
            }
            return false; // 表示未绘制
        }

        // 绘制顶部状态栏
        const st = config.statusBar; 
        ctx.fillStyle = config.colors.statusBar; 
        ctx.font = st.timeFont;
        ctx.textAlign = 'left'; 
        ctx.textBaseline = 'middle';
        ctx.fillText(controls.time, st.timeX, st.baseY);
        
        let currentIconX = st.iconstartX;
        const iconY = st.baseY - (st.iconHeight / 2);

        // 使用函数简化绘制逻辑
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

        //  WiFi 或 5G 图标
        let currentSignalX = st.batteryX;

        //  WiFi 图标
        if (controls.wifiIconToggle && assets.wifiIcon) {
            const asset = assets.wifiIcon;
            const iconHeight = st.signalIconHeight;
            const calculatedWidth = iconHeight * (asset.width / asset.height);
            
            // 计算图标的X坐标：当前右边界 - 间隙 - 图标自身宽度
            const iconX = currentSignalX - st.signalIconGapToBattery - calculatedWidth;
            const iconY = st.baseY - (iconHeight / 2); // 垂直居中
            
            ctx.drawImage(asset, iconX, iconY, calculatedWidth, iconHeight);
            
            // 更新右边界，作为下一个图标的绘制基准
            currentSignalX = iconX;
        }

        // 3. 绘制 LTE(信号) 图标
        if (controls.lteIconToggle && assets.lteIcon) {
            const asset = assets.lteIcon;
            const iconHeight = st.signalIconHeight;
            const calculatedWidth = iconHeight * (asset.width / asset.height);

            // 计算图标的X坐标：新的右边界 - 两个图标间的标准间隙 - 图标自身宽度
            const iconX = currentSignalX - st.IconGap - calculatedWidth;
            const iconY = st.baseY - (iconHeight / 2);

            ctx.drawImage(asset, iconX, iconY, calculatedWidth, iconHeight);

            // 再次更新右边界 (这是一个好习惯，方便未来继续添加图标)
            currentSignalX = iconX;
        }

        // 绘制电池
        const batteryY = st.baseY - st.batteryHeight / 2; 
        if (controls.battery > 0) { 
            const fillWidth = (st.batteryWidth - 8) * (controls.battery / 100);
            drawRoundedRect(ctx, st.batteryX + 4, batteryY + 2, fillWidth, st.batteryHeight - 8, 8); 
            ctx.fill(); 
        }

        // --- 2. 绘制顶部微信支付通知 ---
        if (controls.notificationToggle && assets.notificationBanner) {
            const nf = config.notification;
            const banner = assets.notificationBanner;

            const bannerX = (config.canvasWidth - banner.width) / 2;
            ctx.drawImage(banner, bannerX, nf.y);
            
            ctx.fillStyle = nf.amountColor;
            ctx.font = nf.amountFont;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const amountValue = (parseFloat(controls.amount) || 0).toFixed(2);
            ctx.fillText(`${amountValue}`, nf.amountX, nf.amountY);
        }

        // 绘制核心支付信息
        const mc = config.mainContent;
        // 绘制商家名称
        ctx.fillStyle = config.colors.mainText;
        ctx.font = mc.merchantFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(controls.merchantName, config.canvasWidth / 2, mc.merchantY);

        // 绘制金额
        ctx.fillStyle = config.colors.amountColor; 
        const amountText = (parseFloat(controls.amount) || 0).toFixed(2);
        const currencySymbol = '¥ ';

        // 步骤1: 分别设置字体，并测量各自的宽度
        ctx.font = mc.currencyFont;
        const currencyWidth = ctx.measureText(currencySymbol).width;
        ctx.font = mc.amountFont;
        const amountWidth = ctx.measureText(amountText).width;
        
        // ... 测量宽度 ...
        const totalWidth = currencyWidth + mc.currencyGap + amountWidth;
        const centerX = config.canvasWidth / 2;
        const startX = centerX - totalWidth / 2; // 和你的计算结果一样

        // 同样可以这样计算，逻辑上可能更直观
        const amountCenterY = mc.amountY; // 假设 amountY 是垂直中心
        ctx.textAlign = 'left'; 
        ctx.textBaseline = 'top'; //

        // 绘制人民币符号
        ctx.font = mc.currencyFont;
        ctx.fillText(currencySymbol, startX, amountCenterY);

        // 绘制金额数字
        ctx.font = mc.amountFont;
        ctx.fillText(amountText, startX + currencyWidth + mc.currencyGap, amountCenterY);


        // --- 4. 绘制可选的优惠券 (逻辑不变) ---
        const selectedBannerKey = controls.shakeBannerSelection;
        if (selectedBannerKey && selectedBannerKey !== 'none') {
            const bannerAsset = assets[selectedBannerKey];
            if (bannerAsset) {
                const bannerX = (config.canvasWidth - bannerAsset.width) / 2;
                ctx.drawImage(bannerAsset, bannerX, config.shakeBanner.y);
            }
        }

        if (controls.helpLinkText && controls.helpLinkText.trim() !== '') {
            
            const hl = config.helpLink;
            ctx.font = hl.font;
            
            // 1. 从控件获取修剪掉空格后的动态文本，并统一加上 ">" 符号
            const dynamicText = controls.helpLinkText.trim() + ' >';

            // 2. 使用这个动态文本来测量宽度
            const helpTextWidth = ctx.measureText(dynamicText).width;
            
            // 3. 计算总宽度以实现居中
            const helpTotalWidth = hl.iconSize + hl.iconTextGap + helpTextWidth;
            const helpStartX = (config.canvasWidth - helpTotalWidth) / 2;

            // 4. 绘制图标
            if (assets.helpIcon) {
                ctx.drawImage(assets.helpIcon, helpStartX, hl.y - hl.iconSize/2, hl.iconSize, hl.iconSize);
            }

            // 5. 绘制文本
            ctx.fillStyle = config.colors.subText;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(dynamicText, helpStartX + hl.iconSize + hl.iconTextGap, hl.y);
        }
    }
};