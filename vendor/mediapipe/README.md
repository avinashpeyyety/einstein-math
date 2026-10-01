# vendor/mediapipe

On-device segmentation for the W1b comic avatar (`js/comicify.js`). Loaded lazily from this folder only when a parent picks a photo; never from a CDN. Cached by the service worker in `einstein-math-models-v1` after first use.

| File | Source | Size |
|---|---|---|
| `vision_bundle.mjs` | npm `@mediapipe/tasks-vision@1.0.1` | ~155 KB |
| `wasm/vision_wasm_internal.{js,wasm}` | same package, **SIMD build only** (non-SIMD build dropped) | ~11.8 MB |
| `selfie_segmenter.tflite` | `storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest (selfie_segmenter.tflite)/` | ~250 KB |
| `hair_segmenter.tflite` | `storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/` | ~780 KB |

The selfie model gives the person, the hair model gives hair, so hair vs face never depends on skin or hair colour. Browsers without WebAssembly SIMD (very old Safari) can't load the wasm and keep the letter avatar.

License: Apache-2.0 (see `LICENSE`).
