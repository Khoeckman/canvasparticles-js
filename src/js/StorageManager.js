/**
 * @class ByteArrayConverter
 * @classdesc Utility class for converting between {@link Uint8Array} and
 * radix-based string representations.
 *
 * - Supports arbitrary numeric bases from 2 (binary) up to 36 (alphanumeric).
 * - Also supports Base64 (64), which is handled with separate
 *   encoding/decoding logic.
 *
 * Each byte is represented as a fixed-width digit group (for bases 2–36),
 * ensuring that conversions are lossless and reversible with
 * {@link encodeByteArrayToString} and {@link decodeStringToByteArray}.
 *
 * @license Copyright (c) 2025 Kyle Hoeckman, All rights reserved.
 */
class ByteArrayConverter {
  /**
   * Encodes a byte array into a string using the given radix.
   *
   * - For bases 2–36, each byte is converted into a fixed-width string segment
   *   so that the output can be losslessly decoded with
   *   {@link decodeStringToByteArray}.
   * - For radix 64, the output is a Base64-encoded string.
   *
   * @param {Uint8Array} byteArray - The array of bytes to encode.
   * @param {number} radix - The numeric base to use (2–36, or 64 for Base64).
   * @returns {string} Encoded string representation.
   *
   * @throws {TypeError} If `radix` is not an integer.
   * @throws {RangeError} If `radix` is outside the range 2–36 and not 64.
   *
   * @example
   * ```js
   * const bytes = new Uint8Array([15, 255, 128]);
   * const encoded = ByteArrayConverter.encodeByteArrayToString(bytes, 16);
   * // "0fff80"
   * ```
   */
  static encodeByteArrayToString(byteArray, radix) {
    if (!Array.isArray(byteArray) && !(byteArray instanceof Uint8Array))
      throw new TypeError('encodedString is neither an Array nor Uint8Array')
    if (!Number.isInteger(radix)) throw new TypeError('radix is not an integer')
    if ((radix < 2 || radix > 36) && radix !== 64) throw new RangeError('radix is not between 2 and 36 or 64')
    if (!(byteArray instanceof Uint8Array)) byteArray = new Uint8Array(byteArray)
    if (radix === 64) {
      if (typeof btoa === 'undefined') return Buffer.from(byteArray).toString('base64')
      let binary = ''
      const chunk = 0x8000 // 32k chunks to avoid arg limit
      for (let i = 0; i < byteArray.length; i += chunk)
        binary += String.fromCharCode(...byteArray.subarray(i, i + chunk))
      return btoa(binary)
    }
    const chunkSize = Math.ceil(Math.log(256) / Math.log(radix))
    return Array.from(byteArray)
      .map((b) => b.toString(radix).padStart(chunkSize, '0'))
      .join('')
  }
  /**
   * Decodes an encoded string back into a {@link Uint8Array}.
   *
   * - For bases 2–36, the string is divided into fixed-size chunks
   *   (based on the radix) and each chunk is parsed back into a byte value.
   * - For radix 64, the input is assumed to be Base64-encoded and is decoded
   *   via {@link atob}.
   *
   * @param {string} encodedString - The encoded string to decode.
   * @param {number} radix - The numeric base used in the string (2–36, or 64 for Base64).
   * @returns {Uint8Array} The decoded byte array.
   *
   * @throws {TypeError} If `radix` is not an integer.
   * @throws {RangeError} If `radix` is outside the range 2–36 and not 64.
   *
   * @example
   * ```js
   * const encoded = "0fff80";
   * const decoded = ByteArrayConverter.decodeStringToByteArray(encoded, 16);
   * // Uint8Array [15, 255, 128]
   * ```
   */
  static decodeStringToByteArray(encodedString, radix) {
    if (typeof encodedString !== 'string') throw new TypeError('encodedString is not a string')
    if (!Number.isInteger(radix)) throw new TypeError('radix is not an integer')
    if ((radix < 2 || radix > 36) && radix !== 64) throw new RangeError('radix is not between 2 and 36 or 64')
    if (radix === 64) {
      if (typeof atob === 'undefined') return Uint8Array.from(Buffer.from(encodedString, 'base64'))
      return Uint8Array.from(atob(encodedString), (c) => c.charCodeAt(0))
    }
    const chunkSize = Math.ceil(Math.log(256) / Math.log(radix))
    const chunkCount = Math.ceil(encodedString.length / chunkSize)
    const result = new Uint8Array(chunkCount)
    const resultSize = chunkCount * chunkSize
    let resultIdx = 0
    for (let chunkIdx = 0; chunkIdx < resultSize; chunkIdx += chunkSize)
      result[resultIdx++] = parseInt(encodedString.slice(chunkIdx, chunkIdx + chunkSize), radix) || 0
    return result
  }
}

/**
 * @class TRA - Text Rotation Algorithm
 * @classdesc A lightweight symmetric text obfuscation utility that operates on UTF-8
 * encoded bytes. The algorithm applies a pseudo-randomized, index-dependent
 * rotation to each byte and encodes the result as a string in a configurable
 * radix (binary, decimal, hex, base36, or base64).
 *
 * The transformation is symmetric: calling {@link TRA.encrypt()} followed by
 * {@link TRA.decrypt()} (with the same radix) restores the original string.
 *
 * ### Key Features
 * - Works with any UTF-8 text input.
 * - Reversible rotation based on array length and index.
 * - Configurable output encoding via radix (2–36, or 64 for Base64).
 * - No external dependencies except for a `ByteArrayConverter` helper.
 *
 * @example
 * ```js
 * import TRA from './TRA.js'
 *
 * const plaintext = "Hello, world!"
 * const encrypted = TRA.encrypt(plaintext, 16)
 * const decrypted = TRA.decrypt(encrypted, 16)
 *
 * console.log(encrypted) // Encrypted hex string
 * console.log(decrypted) // "Hello, world!"
 * ```
 *
 * @license Copyright (c) 2025 Kyle Hoeckman, All rights reserved.
 */
class TRA {
  /**
   * Encrypts a given string by encoding it to bytes, applying a
   * custom reversible rotation, and converting to a radix-based string.
   *
   * @static
   * @param {string} string - The plaintext string to encrypt.
   * @param {number} [radix] - The numeric base for output string encoding (2-36 or 64).
   * @returns {string} The encrypted string representation in the specified radix.
   *
   * @example
   * ```js
   * const encrypted = TRA.encrypt("Hello, world!", 16);
   * ```
   */
  static encrypt(string, radix = 64) {
    let uint8Array = new TextEncoder().encode(string)
    uint8Array = this.#rotate(uint8Array, 1)
    return ByteArrayConverter.encodeByteArrayToString(uint8Array, radix)
  }
  /**
   * Decrypts an encrypted radix-based string back into the original plaintext.
   *
   * The method decodes the string into bytes, applies the inverse rotation,
   * and then decodes back to a UTF-8 string.
   *
   * @static
   * @param {string} string - The encrypted string to decrypt.
   * @param {number} [radix] - The numeric base used in the encrypted string (2-36 or 64).
   * @returns {string|Error} The decrypted plaintext string, or an Error if decryption fails.
   *
   * @example
   * ```js
   * const decrypted = TRA.decrypt(encrypted, 16);
   * ```
   */
  static decrypt(string, radix = 64) {
    let uint8Array = ByteArrayConverter.decodeStringToByteArray(string, radix)
    uint8Array = this.#rotate(uint8Array, -1)
    return new TextDecoder().decode(uint8Array)
  }
  /**
   * Applies a reversible byte-wise rotation on a `Uint8Array`.
   *
   * Each byte is shifted by a pseudo-random offset that depends on its
   * index and the array length. The pseudo-random sequence is derived
   * from a hashed constant table and integer mixing operations.
   *
   * Because the transformation is symmetric under negation of `rotation`,
   * applying this method twice with `rotation = 1` and `rotation = -1`
   * restores the original array.
   *
   * @static
   * @param {Uint8Array} uint8Array - The input byte array to transform.
   * @param {number} rotation - Direction multiplier: `1` for encryption, `-1` for decryption.
   * @returns {Uint8Array} A new rotated `Uint8Array`.
   * @private
   */
  static #rotate(uint8Array, rotation) {
    if (!rotation) return uint8Array
    const len = uint8Array.length
    const K = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let x = i ^ (len * 0x45d8f3b)
      x = Math.imul(x ^ (x >>> 16), 0x27d4fb2d)
      x = Math.imul(x ^ (x >>> 15), 0x175667b1)
      x ^= x >>> 16
      K[i] = x
    }
    const result = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      let x = (i + 0x9e3769b9 * len + K[i & 0xff]) | 0
      x ^= x >>> 16
      x = Math.imul(x, 0x85ebba6b)
      x ^= x >>> 13
      x = Math.imul(x, 0xc3b2ae35)
      x ^= x >>> 16
      result[i] = (uint8Array[i] + (x & 0xff) * rotation) & 0xff
    }
    return result
  }
}

/**
 * @class StorageManager
 * @classdesc A lightweight and efficient wrapper for managing data in a Storage-like interface
 * (defaulting to {@link window.localStorage}), with optional encoding and decoding support.
 * Automatically initializes with its default value if none is present.
 *
 * This class includes an internal cache (`#value`) to improve performance.
 * Using the {@link StorageManager.value|value} getter is significantly faster
 * than reading from storage repeatedly. However, if the stored value is modified
 * externally (e.g., via {@link Storage.setItem} or the browser console),
 * the cached value will become outdated.
 *
 * To re-synchronize the cache with the actual stored value, call
 * {@link StorageManager.getItem|getItem()}.
 *
 * @example
 * const storage = new StorageManager('userSettings', {
 *   defaultValue: { theme: 'dark', language: 'en' },
 *   encodeFn: (value) => btoa(value),  // optional encoding
 *   decodeFn: (value) => atob(value),  // optional decoding
 * });
 *
 * storage.value = { theme: 'light' };   // stores encoded and cached
 * console.log(storage.value);           // fast access from memory cache
 *
 * @example
 * const sessionStore = new StorageManager('tempData', {
 *   storage: window.sessionStorage,
 *   defaultValue: 'none',
 * });
 * sessionStore.value = 'temporary';
 *
 * @source https://github.com/Khoeckman/StorageManager
 */
class StorageManager {
  /** Version of the library, injected via Rollup replace plugin. */
  static version = '4.1.2'
  static TRA = TRA
  /** Key name under which the data is stored. */
  itemName
  /** Default value used when the key does not exist in storage. */
  defaultValue
  /** Function to encode values before storing. Defaults to TRA.encrypt with radix 64. */
  encodeFn
  /** Function to decode values when reading. Defaults to TRA.decrypt with radix 64. */
  decodeFn
  /** The underlying storage backend (defaults to `window.localStorage`). */
  storage
  /** Internal cached value to improve access speed. */
  #value
  /**
   * Creates a new StorageManager instance.
   *
   * @param {string} itemName - The key name under which the data will be stored.
   * @param {Object} [options={}] - Optional configuration parameters.
   * @param {T} [options.defaultValue] - Default value if the key does not exist.
   * @param {(value: string) => string} [options.encodeFn] - Optional function to encode stored values.
   * @param {(value: string) => string} [options.decodeFn] - Optional function to decode stored values.
   * @param {Storage} [options.storage=window.localStorage] - Optional custom storage backend.
   *
   * @throws {TypeError} If `itemName` is not a string.
   * @throws {TypeError} If `encodeFn` or `decodeFn` are defined but not functions.
   * @throws {TypeError} If `storage` does not implement the standard Storage API.
   */
  constructor(itemName, options = {}) {
    const {
      defaultValue,
      encodeFn = (value) => StorageManager.TRA.encrypt(value, 64),
      decodeFn = (value) => StorageManager.TRA.decrypt(value, 64),
      storage = window.localStorage,
    } = options
    if (typeof itemName !== 'string') throw new TypeError('itemName is not a string')
    this.itemName = itemName
    this.defaultValue = defaultValue
    if (encodeFn && typeof encodeFn !== 'function') throw new TypeError('encodeFn is defined but is not a function')
    this.encodeFn = encodeFn || ((v) => v)
    if (decodeFn && typeof decodeFn !== 'function') throw new TypeError('decodeFn is defined but is not a function')
    this.decodeFn = decodeFn || ((v) => v)
    if (!(storage instanceof Storage)) throw new TypeError('storage must be an instance of Storage')
    this.storage = storage
    this.sync()
  }
  /**
   * Sets the current value in storage.
   * Automatically encodes and caches the value.
   *
   * @param {T | DefaultValue} value - The value to store. Objects are automatically stringified.
   */
  set value(value) {
    this.#value = value
    const stringValue = typeof value === 'string' ? value : '\0JSON\0\x20' + JSON.stringify(value)
    this.storage.setItem(this.itemName, this.encodeFn(stringValue))
  }
  /**
   * Gets the current cached value.
   *
   * @returns {T | undefined} The cached value.
   */
  get value() {
    return this.#value ?? this.defaultValue
  }
  /**
   * Retrieves and synchronizes the internal cache (`value`) with the latest stored value.
   *
   * Applies decoding (using the provided `decodeFn` or the instance's default)
   * and automatically parses JSON-formatted values that were stored by this class.
   *
   * @param {(value: string) => string} [decodeFn=this.decodeFn] - Optional custom decoding function for the raw stored string.
   * @returns {T | DefaultValue} The actual decoded and parsed value from storage, or the default value if none exists.
   *
   * @example
   * storage.sync()
   * console.log(storage.value) // Cached value is now up to date with storage
   */
  sync(decodeFn = this.decodeFn) {
    let value = this.storage.getItem(this.itemName)
    if (typeof value !== 'string') return this.reset()
    value = decodeFn(value)
    if (!value.startsWith('\0JSON\0\x20')) return (this.value = value) // value can only be of type T as it is checked on assignment
    // Slice off '\0JSON\0\x20' prefix
    value = value.slice(7)
    // Manually convert unparseable JSON object
    if (value === 'undefined') return (this.value = undefined) // this can only ever happen if type T allows undefined
    return (this.value = JSON.parse(value))
  }
  /**
   * Resets the stored value to its configured default.
   *
   * Updates both the underlying storage and the internal cache.
   *
   * @returns {DefaultValue} The restored default value.
   *
   * @example
   * storage.reset()
   * console.log(storage.value) // Default value
   */
  reset() {
    return (this.value = this.defaultValue)
  }
  /**
   * Removes this specific key and its value from storage.
   *
   * Also clears the internal cache to prevent stale data access.
   *
   * @returns {void}
   */
  remove() {
    this.#value = undefined
    this.storage.removeItem(this.itemName)
  }
  /**
   * Clears **all** data from the associated storage backend.
   *
   * This affects every key in the storage instance, not just the one
   * managed by this StorageManager.
   * Also clears the internal cache to prevent stale data access.
   *
   * @returns {void}
   */
  clear() {
    this.#value = undefined
    this.storage.clear()
  }
  /**
   * Checks whether the current cached value matches the configured default value.
   *
   * Uses reference comparison for objects and strict equality for primitives.
   *
   * @returns {boolean} `true` if the cached value equals the default value, otherwise `false`.
   */
  isDefault() {
    return this.#value === this.defaultValue
  }
}

export { StorageManager as default }
