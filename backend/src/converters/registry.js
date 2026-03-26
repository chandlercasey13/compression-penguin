import { imageToWebp } from "./image-to-webp.js";

const converters = {
  "image-to-webp": {
    label: "Image → WebP",
    convert: imageToWebp,
    outputExtension: "webp",
    outputContentType: "image/webp",
  },
};

export function getConverter(conversionType) {
  return converters[conversionType] || null;
}

export function listConversionTypes() {
  return Object.entries(converters).map(([key, { label }]) => ({ key, label }));
}
