export function warpWithDepth(
  ctx: CanvasRenderingContext2D,
  depth: HTMLImageElement
) {
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(depth, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
}
