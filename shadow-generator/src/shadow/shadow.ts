import { degToRad } from "../utils/math";

interface ShadowOptions {
    angle: number;
    elevation: number;
    softness: number;
    falloff: number;
    height: number;
    opacity: number;
};

export function generateObjectShadow(
    mask: HTMLCanvasElement,
    options: ShadowOptions
): HTMLCanvasElement {
    const {angle, elevation, softness, falloff, height, opacity} = options;

    const canvas = document.createElement('canvas');
    canvas.width = mask.width;
    canvas.height = mask.height;
    const ctx = canvas.getContext('2d')!;

    const elevationRad = degToRad(elevation);
    const angleRad = degToRad(angle);

    const scale = height/Math.tan(elevationRad);

    ctx.setTransform(
        1,
        Math.sin(angleRad) * scale,
        Math.cos(angleRad) * scale,
        1,
        0,
        0
    );
    
    ctx.drawImage(mask, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxDist = Math.hypot(cx, cy);

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const alpha = data[index + 3];

            if (alpha === 0) continue;

            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.hypot(dx, dy);
            
            const decay = Math.exp(-dist / (falloff * maxDist));
            data[index + 3] = alpha * decay * opacity;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}
