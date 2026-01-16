import { loadImage, extractMask, extractObject, createMaskCanvasFromImage } from './utils/image';
import { projectShadow } from './shadow/projector';
import { applyFalloff } from './shadow/falloff';
import { drawContactShadow } from './shadow/contact';
import { warpWithDepth } from './shadow/depthWarp';
import { generateObjectShadow } from './shadow/shadow';

const output = document.getElementById('output') as HTMLCanvasElement;
const shadowDebug = document.getElementById('shadowDebug') as HTMLCanvasElement;
const maskDebug = document.getElementById('maskDebug') as HTMLCanvasElement;

const angle = document.getElementById('angle') as HTMLInputElement;
const elevation = document.getElementById('elevation') as HTMLInputElement;
const softness = document.getElementById('softness') as HTMLInputElement;
const falloff = document.getElementById('falloff') as HTMLInputElement;
const depthToggle = document.getElementById('depth') as HTMLInputElement;

async function init() {
  const fg = await loadImage('/foreground.png');
  const bg = await loadImage('/background.png');
  const depth = await loadImage('/depth.png');

  output.width = bg.width;
  output.height = bg.height;
  shadowDebug.width = bg.width;
  shadowDebug.height = bg.height;
  maskDebug.width = fg.width;
  maskDebug.height = fg.height;

  const ctx = output.getContext('2d')!;
  const sdbg = shadowDebug.getContext('2d')!;
  const mdbg = maskDebug.getContext('2d')!;

  function render() {
    ctx.clearRect(0, 0, output.width, output.height);
    sdbg.clearRect(0, 0, output.width, output.height);
    mdbg.clearRect(0, 0, maskDebug.width, maskDebug.height);

    const object = extractObject(fg);
    const mask = extractMask(fg);
    mdbg.drawImage(mask, 0, 0);

    const shadow = projectShadow(
      mask,
      Number(angle.value),
      Number(elevation.value),
    );

    const maskCanvas = createMaskCanvasFromImage(fg);
    const generatedShadow = generateObjectShadow(mask, {
      angle: Number(angle.value),
      elevation: Number(elevation.value),
      softness: Number(softness.value),
      falloff: Number(falloff.value),
      height: 150,
      opacity: 0.5,
    });
    console.log("generated shadow", generatedShadow);

    const sctx = shadow.getContext('2d')!;
    drawContactShadow(sctx, mask);
    applyFalloff(sctx, Number(falloff.value));

    if (depthToggle.checked) {
      warpWithDepth(sctx, depth);
    }

    ctx.drawImage(bg, 0, 0);
    ctx.drawImage(generatedShadow, 0, 0);

    // ctx.globalAlpha = 1;
    ctx.drawImage(object, 0, 0);

    sdbg.drawImage(shadow, 0, 0);

    const dataURL = output.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'output.png';
    link.click();

    const sdbgDataURL = shadowDebug.toDataURL('image/png');
    const sdbgLink = document.createElement('a');
    sdbgLink.href = sdbgDataURL;
    sdbgLink.download = 'shadowDebug.png';
    sdbgLink.click();

    const mdbgDataURL = maskDebug.toDataURL('image/png');
    const mdbgLink = document.createElement('a');
    mdbgLink.href = mdbgDataURL;
    mdbgLink.download = 'maskDebug.png';
    mdbgLink.click();
  }

  [angle, elevation, softness, falloff, depthToggle].forEach(el =>
    el.addEventListener('input', render)
  );

  render();
}

init();
