import { degToRad } from "../utils/math";

export function projectShadow (
    mask: HTMLCanvasElement,
    angle: number,
    elevation: number,
) {
    const canvas = document.createElement('canvas');
    canvas.width = mask.width;
    canvas.height = mask.height;
    const ctx = canvas.getContext('2d')!;
    const scale = 1/Math.tan(degToRad(elevation));

    ctx.setTransform(
        1,
        Math.sin(degToRad(angle)) * scale,
        Math.cos(degToRad(angle)) * scale,
        1,
        0,
        0
    );
    ctx.drawImage(mask, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    return canvas;
}
