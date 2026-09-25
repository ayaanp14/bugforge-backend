import { test } from "node:test";
import assert from "node:assert/strict";
import { CARD_HEIGHT, CARD_WIDTH, MAX_CARD_BYTES, isCardImage, jpegSize } from "./share-cards.js";

/**
 * A minimal JPEG head: SOI, an APP0 segment (as a canvas writes one), then a
 * baseline SOF0 frame header of the given size, padded to `length` bytes.
 */
function jpegHeader(width: number, height: number, length = 64, sof = 0xc0): Uint8Array {
  const bytes = new Uint8Array(length);
  let i = 0;
  const put = (...b: number[]) => { bytes.set(b, i); i += b.length; };
  put(0xff, 0xd8);
  put(0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00); // APP0 "JFIF"
  put(0xff, sof, 0x00, 0x11, 0x08, height >> 8, height & 0xff, width >> 8, width & 0xff, 0x03);
  return bytes;
}

test("the frame size is read past the APP0 segment", () => {
  assert.deepEqual(jpegSize(jpegHeader(CARD_WIDTH, CARD_HEIGHT)), { width: CARD_WIDTH, height: CARD_HEIGHT });
  // A progressive frame (SOF2) counts too.
  assert.deepEqual(jpegSize(jpegHeader(640, 480, 64, 0xc2)), { width: 640, height: 480 });
});

test("a JPEG of exactly the card's size is a card", () => {
  assert.equal(isCardImage(jpegHeader(CARD_WIDTH, CARD_HEIGHT)), true);
});

test("any other size is refused — the endpoint must not host arbitrary pictures", () => {
  assert.equal(isCardImage(jpegHeader(1200, 630)), false);
  assert.equal(isCardImage(jpegHeader(4000, 4000)), false);
});

test("a file that is not a JPEG is refused", () => {
  const png = jpegHeader(CARD_WIDTH, CARD_HEIGHT);
  png.set([0x89, 0x50, 0x4e, 0x47], 0);
  assert.equal(isCardImage(png), false);
  // A DHT table (0xC4) is not a frame header, whatever its bytes say.
  assert.equal(jpegSize(jpegHeader(CARD_WIDTH, CARD_HEIGHT, 64, 0xc4)), null);
  assert.equal(isCardImage(new Uint8Array([0xff, 0xd8])), false);
});

test("a file too large is refused", () => {
  assert.equal(isCardImage(jpegHeader(CARD_WIDTH, CARD_HEIGHT, MAX_CARD_BYTES + 1)), false);
});
