export function drawContactShadow(
  ctx: CanvasRenderingContext2D,
  mask: HTMLCanvasElement
) {
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.filter = 'blur(1px)';
  ctx.drawImage(mask, 0, 0);
  ctx.restore();
}
