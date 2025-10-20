/**
 * 在Canvas上绘制一个圆角矩形。
 * @param {CanvasRenderingContext2D} ctx - Canvas的2D上下文。
 * @param {number} x - 矩形左上角的X坐标。
 * @param {number} y - 矩形左上角的Y坐标。
 * @param {number} width - 矩形的宽度。
 * @param {number} height - 矩形的高度。
 * @param {number} radius - 圆角的半径。
 */
export function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
}

/**
 * 在Canvas上绘制可自动换行的文本。
 * @param {CanvasRenderingContext2D} ctx - Canvas的2D上下文。
 * @param {string} text - 要绘制的文本。
 * @param {number} x - 文本起始点的X坐标。
 * @param {number} y - 文本第一行的Y坐标。
 * @param {number} maxWidth - 文本行的最大宽度。
 * @param {number} lineHeight - 行高。
 */
export function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split('');
    let line = '';
    let testY = y;
    for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n];
        if (ctx.measureText(testLine).width > maxWidth && n > 0) {
            ctx.fillText(line, x, testY);
            line = words[n];
            testY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, testY);
}