"use client";

/**
 * Turn a picked file into something a canvas can draw.
 *
 * The obvious call is `createImageBitmap(file)`, and that is what the cropper
 * used to do. On iOS it hands back a bitmap that reports a size and draws
 * nothing for some files — a PNG picked from Photos being the case that
 * turned up — so the crop stage came out plain white with no error anywhere:
 * the decode "succeeded", the draw did nothing, and the person is left
 * looking at a blank square wondering what they did wrong.
 *
 * So an `<img>` element is tried first. It is the oldest and most exercised
 * decode path in every engine, it handles HEIC on iOS as well as PNG and
 * JPEG, and it reports failure honestly through `onerror`.
 * `createImageBitmap` stays as the fallback for anything the element route
 * cannot take.
 *
 * A zero-sized result counts as failure in both routes. Drawing nothing and
 * calling it success is the exact bug this exists to close.
 */

export type DecodedImage = {
  /** Anything `ctx.drawImage` accepts. */
  source: CanvasImageSource;
  width: number;
  height: number;
  /** Release whatever the decode is holding. Safe to call twice. */
  close: () => void;
};

function viaElement(file: File): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      URL.revokeObjectURL(url);
    };

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      if (!width || !height) {
        release();
        reject(new Error("empty image"));
        return;
      }
      // The object URL is kept alive until close(): revoking it while the
      // element is still a draw source is undefined behaviour in some
      // engines, and this element is drawn on every pointer move.
      resolve({ source: img, width, height, close: release });
    };
    img.onerror = () => {
      release();
      reject(new Error("decode failed"));
    };

    img.src = url;
  });
}

async function viaBitmap(file: File): Promise<DecodedImage> {
  const bitmap = await createImageBitmap(file);
  if (!bitmap.width || !bitmap.height) {
    bitmap.close?.();
    throw new Error("empty bitmap");
  }
  return {
    source: bitmap,
    width: bitmap.width,
    height: bitmap.height,
    close: () => bitmap.close?.(),
  };
}

export async function decodeImageFile(file: File): Promise<DecodedImage> {
  try {
    return await viaElement(file);
  } catch {
    return await viaBitmap(file);
  }
}
