import cv2
import torch
import numpy as np
from PIL import Image
import argparse

# -----------------------------
# CONFIG
# -----------------------------
LIGHT_ANGLE = 45        # degrees (0 = right, 90 = down)
LIGHT_ELEVATION = 35    # degrees (0 = horizon, 90 = overhead)
SHADOW_STRENGTH = 0.8
SOFTNESS = 25
parser = argparse.ArgumentParser(description="Shadow generator with light angle and elevation")
parser.add_argument("--angle", type=float, default=45, help="Light angle in degrees (0=right, 90=down)")
parser.add_argument("--elevation", type=float, default=35, help="Light elevation in degrees (0=horizon, 90=overhead)")
args = parser.parse_args()

LIGHT_ANGLE = args.angle
LIGHT_ELEVATION = args.elevation

print(f"Using light angle: {LIGHT_ANGLE} degrees")
print(f"Using light elevation: {LIGHT_ELEVATION} degrees")
# -----------------------------
# LOAD IMAGES
# -----------------------------
fg = Image.open("foreground.png").convert("RGBA")
bg = Image.open("background.JPG").convert("RGB")

fg_np = np.array(fg)
bg_np = np.array(bg)

fg = fg.resize(bg.size, Image.BILINEAR)
fg_np = np.array(fg)
alpha = fg_np[..., 3] / 255.0
mask = alpha > 0.01

# alpha = fg_np[..., 3] / 255.0
# mask = alpha > 0.01

# -----------------------------
# DEPTH ESTIMATION (MiDaS)
# -----------------------------
device = "cuda" if torch.cuda.is_available() else "cpu"

midas = torch.hub.load("intel-isl/MiDaS", "DPT_Large").to(device).eval()
transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
transform = transforms.dpt_transform

bg_np_float = np.array(bg).astype(np.float32) / 255.0

input_tensor = transform(bg_np_float)

# 🔥 critical fix
if input_tensor.ndim == 5:
    input_tensor = input_tensor.squeeze(1)

input_tensor = input_tensor.to(device)

with torch.no_grad():
    depth = midas(input_tensor)
    depth = torch.nn.functional.interpolate(
        depth.unsqueeze(1),
        size=bg_np.shape[:2],
        mode="bicubic",
        align_corners=False
    ).squeeze().cpu().numpy()

depth = cv2.normalize(depth, None, 0, 1, cv2.NORM_MINMAX)



# -----------------------------
# SHADOW PROJECTION
# -----------------------------
h, w = depth.shape
shadow = np.zeros((h, w), dtype=np.float32)

angle_rad = np.deg2rad(LIGHT_ANGLE)
elev_rad = np.deg2rad(LIGHT_ELEVATION)

dx = np.cos(angle_rad)
dy = np.sin(angle_rad)
dz = np.tan(elev_rad)

for y in range(h):
    for x in range(w):
        if mask[y, x]:
            z = depth[y, x]
            sx = int(x + dx * z * 300)
            sy = int(y + dy * z * 300)
            if 0 <= sx < w and 0 <= sy < h:
                shadow[sy, sx] += 1

shadow = cv2.GaussianBlur(shadow, (0, 0), SOFTNESS)
shadow = shadow / shadow.max()
shadow = 1 - shadow * SHADOW_STRENGTH

# -----------------------------
# COMPOSITE
# -----------------------------
shadow_rgb = np.stack([shadow]*3, axis=-1)
result = bg_np * shadow_rgb

# paste foreground on top
for c in range(3):
    result[..., c] = (
        result[..., c] * (1 - alpha) +
        fg_np[..., c] * alpha
    )

Image.fromarray(result.astype(np.uint8)).save("output.png")

# Save shadow-only image
shadow_img = (shadow * 255).astype(np.uint8)
shadow_img_rgb = np.stack([shadow_img]*3, axis=-1)
Image.fromarray(shadow_img_rgb).save("shadowDebug.png")
# Save mask image for foreground
mask_img = (mask * 255).astype(np.uint8)
mask_img_rgb = np.stack([mask_img]*3, axis=-1)
Image.fromarray(mask_img_rgb).save("maskDebug.png")