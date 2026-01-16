export function applyFalloff(
  ctx: CanvasRenderingContext2D,
  softness: number
) {
  for (let i = 1; i <= softness; i++) {
    ctx.globalAlpha = 1 - i / softness;
    ctx.filter = `blur(${i}px)`;
    ctx.drawImage(ctx.canvas, 0, i * 2);
  }
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
}
