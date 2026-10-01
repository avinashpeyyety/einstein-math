# Comic avatar style guide (Track P · W1b)

Owner: Studio · Implementer: Forge · Status: style locked 2026-10-01

This guide is for the explorer avatar made from a profile photo ("comicify"). The avatar has to look like it belongs in the same comic as the Einstein teacher panels (`assets/panels/*.png`) and the app chrome (`css/comic.css`). It covers the **look** only. Upload, storage and UI are Forge's job.

---

## 1. Reference: the Einstein comic voice

- **Medium:** hand-inked comic illustration with flat color, a warm cream page and a light halftone dot screen. It is not photoreal, not 3D or Pixar style, not anime, and not a watercolor wash.
- **Mood:** friendly, curious and a little playful. Expressions are open and readable at a glance.
- **Framing:** head and shoulders, with the figure filling the panel and a thin dark panel border.
- **The rule:** if an avatar placed next to `explain.png` looks like a different artist or a different decade, reject it.

## 2. Palette

Pull from the app tokens so avatars sit on the UI without clashing.

| Role | Token | Hex | Use in avatar |
|------|-------|-----|---------------|
| Ink / line | `--ink` | `#1A1A2E` | All outlines, hair strands, shadow hatching (never pure #000) |
| Page | `--paper` | `#FFF8E7` | Background base |
| Halftone | `--halftone` | `#1A1A2E` @ 8–12% | Dot screen on background only |
| Accent 1 | `--burst-yellow` | `#FFE66D` | Clothing / rim light |
| Accent 2 | `--burst-orange` | `#FF6B35` | Clothing / background burst |
| Accent 3 | `--burst-cyan` | `#4ECDC4` | Clothing (echoes Einstein's teal sweater) |
| Accent 4 | `--burst-pink` | `#FF6B9D` | Clothing or cheeks, used sparingly |
| Accent 5 | `--burst-purple` | `#A78BFA` | Clothing or background burst |

**Rules:**
- **Skin, hair and eyes keep the person's real tones**, flattened to 2–3 values: base, shadow, and an optional highlight. Never shift skin hue toward the accent colors. Never lighten or darken skin to "stylize."
- **At most 2 accent colors** per avatar, plus ink and page. Clothing can be recolored into the accents. Keep it close to the original garment hue when it's a near match.
- **Background:** a flat `--paper` with halftone dots, or one soft burst in the user's `avatarColor` (from `storage.js` `AVATAR_COLORS`), so the comic avatar and the letter fallback share an identity color.
- **Saturation:** medium. Match the panels, which are warm and slightly muted, not neon.

## 3. Line weight

The output is judged at its native 512×512 size and at 48 px, the circle used in the explorer list and top bar.

| Element | At 512 px | Notes |
|---------|-----------|-------|
| Outer silhouette (head, shoulders) | 6–8 px | The boldest line, so the shape still reads at 48 px |
| Interior features (jaw, ears, collar) | 3–4 px | |
| Eyes, brows, mouth | 3–5 px | Brows and mouth must still read at 48 px |
| Hair strands / hatching | 1.5–2.5 px | Sparse. Pick a few strands, like the panels do |
| Panel border, if drawn | 4 px `--ink` | Matches `.comic-panel` border: 4 px |

- **Line quality:** tapered brush or ink lines, not uniform vector strokes. Lines are closed around the silhouette.
- **Shading:** flat cel shadow on one side (light from upper left, matching the panels), plus a little cross-hatching or halftone in the shadow. No airbrush gradients.

## 4. Age-appropriate look (explorers are kids)

- **Recognizable but kind.** Keep the identity cues that make the child recognizable: face shape, hairstyle, skin tone, glasses, hijab or patka or other head covering. **Never remove or alter religious or cultural items, glasses, hearing aids or mobility aids.**
- **No caricature exaggeration.** No enlarged noses or ears, no teeth gags, no weight changes. Proportions stay natural, with eyes enlarged by 10% at most.
- **Expression:** a neutral to gentle smile, matching the friendly "idle" or "explain" register. If the photo is frowning, a neutral expression is fine. Never add a grin the child didn't have.
- **Not glamorized.** No makeup, no lipstick, no sharpened jawlines or "beauty filter" smoothing, no aging up. Kids stay looking their age.
- **Clothing:** simple shapes. Replace logos and text with plain color blocks.
- **Never:** costume changes the user didn't pick, weapons, scary or horror styling, partial nudity, or skin crops below the collarbone. No other people. Crop or blur any second face in the photo out before comicify.
- **Optional fun (user-chosen only):** a small prop from the subject switcher, like a pencil behind the ear, lab goggles on the forehead, or a star burst behind the head. These only come from a preset list and are never auto-added.

## 5. Output spec

| Property | Value |
|----------|-------|
| Size | 512×512 PNG (square), plus a 128×128 derivative for lists |
| Crop | Head and shoulders, eyes at roughly 40% from the top, face about 55–65% of the frame height |
| Background | Opaque `--paper` with halftone or an `avatarColor` burst. No transparency, so the circle mask stays clean |
| Text | **None.** No names, letters, speech bubbles or watermarks |
| Safe area | Keep the face inside the central 80% circle, because the UI masks it to a circle |
| File weight | ≤ 150 KB at 512 px (PNG-8 or quantized PNG is fine) |

## 6. Privacy and generation path (house rules)

- **Device-local by default.** The photo and the avatar stay in local profile storage and only travel in export/import. Nothing goes to a server unless the parent explicitly opts in on a cloud comicify step, with plain-language consent text.
- **No paid xAI API.** If cloud comicify is ever offered, it goes through Avinash's **SuperGrok consumer** limits only. The `main-mac` API key is retired for this.
- **Local method (default target):** a canvas pipeline. Face-centered crop, then posterize to 3 values per channel, then edge detection (Sobel or DoG) inked in `--ink`, then flat-fill using the palette rules above, then a halftone overlay on the background only. This meets §2–§5 without any model. A small on-device model (ONNX/WebGPU cartoonizer) is optional later, only if it's free and offline.
- **SuperGrok prompt template** (for consumer, parent-opted runs only):

  > Turn this photo into a friendly hand-inked comic book portrait of a child, head and shoulders, flat colors with a light halftone dot screen on a warm cream background, bold dark navy (#1A1A2E) outlines, tapered brush lines, cel shading lit from upper left. Keep the exact face shape, skin tone, hairstyle, glasses and any head covering. Natural proportions, gentle neutral smile, no makeup, no exaggeration, not photoreal, not 3D, not anime. Clothing in simple flat colors [ACCENT 1] and [ACCENT 2]. No text, no letters, no watermark. Square 1:1.

## 7. Forge handoff: acceptance checklist

The comicify output **passes** only if all of these hold. Run it on at least 6 test photos: different skin tones, glasses, a head covering, curly and straight hair, and a low-light photo.

1. **Same comic:** next to `assets/panels/explain.png` it reads as the same ink-and-flat-color style, with no photo texture showing through.
2. **Recognizable:** a parent would say "that's my kid." Skin tone stays within the person's own range, and glasses and head coverings are preserved.
3. **Reads at 48 px:** face, eyes and hairline are clear in the explorer list circle (`.user-avatar`).
4. **Palette:** outlines are `--ink`, not black. Background is `--paper` with halftone or the `avatarColor` burst. At most 2 accents.
5. **Kid-safe:** no makeup or beauty smoothing, no caricature, no added grin, no text or logos, no second person.
6. **Spec:** 512 PNG plus a 128 derivative, ≤150 KB, opaque, face inside the 80% circle.
7. **Private:** with the network off, local comicify still works. The cloud path is off until the parent opts in.

**Fail examples:** a photo with only an "oil paint" filter; a Pixar or 3D look; anime eyes; gray-skinned or recolored skin; neon backgrounds; generated text; black hairlines thinner than 1 px that vanish at 48 px; a cropped-off chin; a lost hijab or glasses.

**Fallback:** if comicify fails or is declined, keep the existing letter-in-color circle (`avatarColor`). It's always valid.

**Out of scope here:** upload UI, storage schema and sync (Forge, W1b wiring).
