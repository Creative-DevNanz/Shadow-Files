import cv2
import numpy as np

# =============================
# Paths
# =============================
BACKGROUND_PATH = "background.JPG"
DEPTH_PATH = "depth.JPG"
PERSON_PATH = "person.JPG"

OUT_PERSON = "person_no_bg.png"
OUT_COMPOSITE = "composited_depth_shadow.png"

# =============================
# Load images
# =============================
background = cv2.imread(BACKGROUND_PATH)
depth = cv2.imread(DEPTH_PATH, cv2.IMREAD_GRAYSCALE)
person = cv2.imread(PERSON_PATH)

if background is None or depth is None or person is None:
    raise RuntimeError("Failed to load one or more images")

# =============================
# Resize person
# =============================
scale = background.shape[0] / person.shape[0] * 0.6
person = cv2.resize(person, None, fx=scale, fy=scale)

# =============================
# Remove background (GrabCut)
# =============================
mask = np.zeros(person.shape[:2], np.uint8)
bgdModel = np.zeros((1, 65), np.float64)
fgdModel = np.zeros((1, 65), np.float64)

h, w = person.shape[:2]
rect = (5, 5, w - 10, h - 10)

cv2.grabCut(
    person,
    mask,
    rect,
    bgdModel,
    fgdModel,
    2,
    cv2.GC_INIT_WITH_RECT
)

mask = np.where((mask == 2) | (mask == 0), 0, 1).astype("uint8")

person_rgba = cv2.cvtColor(person * mask[:, :, None], cv2.COLOR_BGR2BGRA)
person_rgba[:, :, 3] = mask * 255

cv2.imwrite(OUT_PERSON, person_rgba)

# =============================
# Depth-based background blur
# =============================
depth = cv2.resize(depth, (background.shape[1], background.shape[0]))
depth = cv2.normalize(depth.astype(np.float32), None, 0.0, 1.0, cv2.NORM_MINMAX)

blurred_bg = cv2.GaussianBlur(background, (31, 31), 0)

bg_depth = (
    background * (1.0 - depth[:, :, None]) +
    blurred_bg * depth[:, :, None]
).astype(np.uint8)

# =============================
# Composite person
# =============================
x = (bg_depth.shape[1] - person_rgba.shape[1]) // 2
y = bg_depth.shape[0] - person_rgba.shape[0] - 20

alpha = person_rgba[:, :, 3] / 255.0

for c in range(3):
    bg_depth[y:y+h, x:x+w, c] = (
        person_rgba[:, :, c] * alpha +
        bg_depth[y:y+h, x:x+w, c] * (1.0 - alpha)
    )

# =============================
# Create realistic ground shadow
# =============================
shadow_mask = np.zeros(bg_depth.shape[:2], dtype=np.uint8)

# Feet area (bottom of person)
shadow_x = x
shadow_y = y + int(h * 0.9)

sh = min(person_rgba.shape[0], bg_depth.shape[0] - shadow_y)
sw = min(person_rgba.shape[1], bg_depth.shape[1] - shadow_x)

shadow_mask[shadow_y:shadow_y+sh, shadow_x:shadow_x+sw] = \
    person_rgba[:sh, :sw, 3]

# Flatten & stretch shadow
shadow_mask = cv2.resize(
    shadow_mask,
    None,
    fx=1.0,
    fy=0.35,
    interpolation=cv2.INTER_LINEAR
)

# Soften shadow edges
shadow_mask = cv2.GaussianBlur(shadow_mask, (61, 61), 0)

# Pad or resize shadow_mask to match background height
if shadow_mask.shape[0] < bg_depth.shape[0]:
    pad_height = bg_depth.shape[0] - shadow_mask.shape[0]
    shadow_mask = np.pad(shadow_mask, ((0, pad_height), (0, 0)), mode='constant', constant_values=0)
elif shadow_mask.shape[0] > bg_depth.shape[0]:
    shadow_mask = shadow_mask[:bg_depth.shape[0], :]

# Ensure width matches as well
if shadow_mask.shape[1] < bg_depth.shape[1]:
    pad_width = bg_depth.shape[1] - shadow_mask.shape[1]
    shadow_mask = np.pad(shadow_mask, ((0, 0), (0, pad_width)), mode='constant', constant_values=0)
elif shadow_mask.shape[1] > bg_depth.shape[1]:
    shadow_mask = shadow_mask[:, :bg_depth.shape[1]]

# Apply shadow to background
shadow_alpha = (shadow_mask / 255.0) * 0.45

for c in range(3):
    bg_depth[:, :, c] = (
        bg_depth[:, :, c] * (1.0 - shadow_alpha)
    ).astype(np.uint8)

# =============================
# Save result
# =============================
cv2.imwrite(OUT_COMPOSITE, bg_depth)

print("Done!")
print(f"Saved: {OUT_PERSON}")
print(f"Saved: {OUT_COMPOSITE}")
