var process = globalThis.process || { version: "v20.0.0", env: {}, browser: true };
var global = globalThis;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod2) => function __require() {
  try {
    return mod2 || (0, cb[__getOwnPropNames(cb)[0]])((mod2 = { exports: {} }).exports, mod2), mod2.exports;
  } catch (e) {
    throw mod2 = 0, e;
  }
};
var __copyProps = (to, from7, except, desc) => {
  if (from7 && typeof from7 === "object" || typeof from7 === "function") {
    for (let key of __getOwnPropNames(from7))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from7[key], enumerable: !(desc = __getOwnPropDesc(from7, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
  mod2
));

// node_modules/base64-js/index.js
var require_base64_js = __commonJS({
  "node_modules/base64-js/index.js"(exports) {
    "use strict";
    init_browser_buffer_global();
    exports.byteLength = byteLength;
    exports.toByteArray = toByteArray;
    exports.fromByteArray = fromByteArray;
    var lookup = [];
    var revLookup = [];
    var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
    var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }
    var i;
    var len;
    revLookup["-".charCodeAt(0)] = 62;
    revLookup["_".charCodeAt(0)] = 63;
    function getLens(b64) {
      var len2 = b64.length;
      if (len2 % 4 > 0) {
        throw new Error("Invalid string. Length must be a multiple of 4");
      }
      var validLen = b64.indexOf("=");
      if (validLen === -1) validLen = len2;
      var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
      return [validLen, placeHoldersLen];
    }
    function byteLength(b64) {
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function _byteLength(b64, validLen, placeHoldersLen) {
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function toByteArray(b64) {
      var tmp;
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
      var curByte = 0;
      var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
      var i2;
      for (i2 = 0; i2 < len2; i2 += 4) {
        tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
        arr[curByte++] = tmp >> 16 & 255;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 2) {
        tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 1) {
        tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      return arr;
    }
    function tripletToBase64(num) {
      return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
    }
    function encodeChunk(uint8, start, end) {
      var tmp;
      var output = [];
      for (var i2 = start; i2 < end; i2 += 3) {
        tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
        output.push(tripletToBase64(tmp));
      }
      return output.join("");
    }
    function fromByteArray(uint8) {
      var tmp;
      var len2 = uint8.length;
      var extraBytes = len2 % 3;
      var parts = [];
      var maxChunkLength = 16383;
      for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
        parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
      }
      if (extraBytes === 1) {
        tmp = uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
        );
      } else if (extraBytes === 2) {
        tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
        );
      }
      return parts.join("");
    }
  }
});

// node_modules/ieee754/index.js
var require_ieee754 = __commonJS({
  "node_modules/ieee754/index.js"(exports) {
    init_browser_buffer_global();
    exports.read = function(buffer, offset, isLE3, mLen, nBytes) {
      var e, m;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var nBits = -7;
      var i = isLE3 ? nBytes - 1 : 0;
      var d = isLE3 ? -1 : 1;
      var s = buffer[offset + i];
      i += d;
      e = s & (1 << -nBits) - 1;
      s >>= -nBits;
      nBits += eLen;
      for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      m = e & (1 << -nBits) - 1;
      e >>= -nBits;
      nBits += mLen;
      for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      if (e === 0) {
        e = 1 - eBias;
      } else if (e === eMax) {
        return m ? NaN : (s ? -1 : 1) * Infinity;
      } else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
    };
    exports.write = function(buffer, value, offset, isLE3, mLen, nBytes) {
      var e, m, c;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
      var i = isLE3 ? 0 : nBytes - 1;
      var d = isLE3 ? 1 : -1;
      var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
      value = Math.abs(value);
      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
      } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--;
          c *= 2;
        }
        if (e + eBias >= 1) {
          value += rt / c;
        } else {
          value += rt * Math.pow(2, 1 - eBias);
        }
        if (value * c >= 2) {
          e++;
          c /= 2;
        }
        if (e + eBias >= eMax) {
          m = 0;
          e = eMax;
        } else if (e + eBias >= 1) {
          m = (value * c - 1) * Math.pow(2, mLen);
          e = e + eBias;
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
          e = 0;
        }
      }
      for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
      }
      e = e << mLen | m;
      eLen += mLen;
      for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
      }
      buffer[offset + i - d] |= s * 128;
    };
  }
});

// node_modules/buffer/index.js
var require_buffer = __commonJS({
  "node_modules/buffer/index.js"(exports) {
    "use strict";
    init_browser_buffer_global();
    var base64 = require_base64_js();
    var ieee754 = require_ieee754();
    var customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
    exports.Buffer = Buffer3;
    exports.SlowBuffer = SlowBuffer;
    exports.INSPECT_MAX_BYTES = 50;
    var K_MAX_LENGTH = 2147483647;
    exports.kMaxLength = K_MAX_LENGTH;
    Buffer3.TYPED_ARRAY_SUPPORT = typedArraySupport();
    if (!Buffer3.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
      console.error(
        "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
      );
    }
    function typedArraySupport() {
      try {
        const arr = new Uint8Array(1);
        const proto = { foo: function() {
          return 42;
        } };
        Object.setPrototypeOf(proto, Uint8Array.prototype);
        Object.setPrototypeOf(arr, proto);
        return arr.foo() === 42;
      } catch (e) {
        return false;
      }
    }
    Object.defineProperty(Buffer3.prototype, "parent", {
      enumerable: true,
      get: function() {
        if (!Buffer3.isBuffer(this)) return void 0;
        return this.buffer;
      }
    });
    Object.defineProperty(Buffer3.prototype, "offset", {
      enumerable: true,
      get: function() {
        if (!Buffer3.isBuffer(this)) return void 0;
        return this.byteOffset;
      }
    });
    function createBuffer(length) {
      if (length > K_MAX_LENGTH) {
        throw new RangeError('The value "' + length + '" is invalid for option "size"');
      }
      const buf = new Uint8Array(length);
      Object.setPrototypeOf(buf, Buffer3.prototype);
      return buf;
    }
    function Buffer3(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        if (typeof encodingOrOffset === "string") {
          throw new TypeError(
            'The "string" argument must be of type string. Received type number'
          );
        }
        return allocUnsafe(arg);
      }
      return from7(arg, encodingOrOffset, length);
    }
    Buffer3.poolSize = 8192;
    function from7(value, encodingOrOffset, length) {
      if (typeof value === "string") {
        return fromString3(value, encodingOrOffset);
      }
      if (ArrayBuffer.isView(value)) {
        return fromArrayView(value);
      }
      if (value == null) {
        throw new TypeError(
          "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
        );
      }
      if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }
      if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }
      if (typeof value === "number") {
        throw new TypeError(
          'The "value" argument must not be of type number. Received type number'
        );
      }
      const valueOf = value.valueOf && value.valueOf();
      if (valueOf != null && valueOf !== value) {
        return Buffer3.from(valueOf, encodingOrOffset, length);
      }
      const b = fromObject(value);
      if (b) return b;
      if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") {
        return Buffer3.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
      }
      throw new TypeError(
        "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
      );
    }
    Buffer3.from = function(value, encodingOrOffset, length) {
      return from7(value, encodingOrOffset, length);
    };
    Object.setPrototypeOf(Buffer3.prototype, Uint8Array.prototype);
    Object.setPrototypeOf(Buffer3, Uint8Array);
    function assertSize4(size4) {
      if (typeof size4 !== "number") {
        throw new TypeError('"size" argument must be of type number');
      } else if (size4 < 0) {
        throw new RangeError('The value "' + size4 + '" is invalid for option "size"');
      }
    }
    function alloc(size4, fill, encoding) {
      assertSize4(size4);
      if (size4 <= 0) {
        return createBuffer(size4);
      }
      if (fill !== void 0) {
        return typeof encoding === "string" ? createBuffer(size4).fill(fill, encoding) : createBuffer(size4).fill(fill);
      }
      return createBuffer(size4);
    }
    Buffer3.alloc = function(size4, fill, encoding) {
      return alloc(size4, fill, encoding);
    };
    function allocUnsafe(size4) {
      assertSize4(size4);
      return createBuffer(size4 < 0 ? 0 : checked(size4) | 0);
    }
    Buffer3.allocUnsafe = function(size4) {
      return allocUnsafe(size4);
    };
    Buffer3.allocUnsafeSlow = function(size4) {
      return allocUnsafe(size4);
    };
    function fromString3(string, encoding) {
      if (typeof encoding !== "string" || encoding === "") {
        encoding = "utf8";
      }
      if (!Buffer3.isEncoding(encoding)) {
        throw new TypeError("Unknown encoding: " + encoding);
      }
      const length = byteLength(string, encoding) | 0;
      let buf = createBuffer(length);
      const actual = buf.write(string, encoding);
      if (actual !== length) {
        buf = buf.slice(0, actual);
      }
      return buf;
    }
    function fromArrayLike(array) {
      const length = array.length < 0 ? 0 : checked(array.length) | 0;
      const buf = createBuffer(length);
      for (let i = 0; i < length; i += 1) {
        buf[i] = array[i] & 255;
      }
      return buf;
    }
    function fromArrayView(arrayView) {
      if (isInstance(arrayView, Uint8Array)) {
        const copy2 = new Uint8Array(arrayView);
        return fromArrayBuffer(copy2.buffer, copy2.byteOffset, copy2.byteLength);
      }
      return fromArrayLike(arrayView);
    }
    function fromArrayBuffer(array, byteOffset, length) {
      if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('"offset" is outside of buffer bounds');
      }
      if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('"length" is outside of buffer bounds');
      }
      let buf;
      if (byteOffset === void 0 && length === void 0) {
        buf = new Uint8Array(array);
      } else if (length === void 0) {
        buf = new Uint8Array(array, byteOffset);
      } else {
        buf = new Uint8Array(array, byteOffset, length);
      }
      Object.setPrototypeOf(buf, Buffer3.prototype);
      return buf;
    }
    function fromObject(obj) {
      if (Buffer3.isBuffer(obj)) {
        const len = checked(obj.length) | 0;
        const buf = createBuffer(len);
        if (buf.length === 0) {
          return buf;
        }
        obj.copy(buf, 0, 0, len);
        return buf;
      }
      if (obj.length !== void 0) {
        if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
          return createBuffer(0);
        }
        return fromArrayLike(obj);
      }
      if (obj.type === "Buffer" && Array.isArray(obj.data)) {
        return fromArrayLike(obj.data);
      }
    }
    function checked(length) {
      if (length >= K_MAX_LENGTH) {
        throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
      }
      return length | 0;
    }
    function SlowBuffer(length) {
      if (+length != length) {
        length = 0;
      }
      return Buffer3.alloc(+length);
    }
    Buffer3.isBuffer = function isBuffer(b) {
      return b != null && b._isBuffer === true && b !== Buffer3.prototype;
    };
    Buffer3.compare = function compare(a, b) {
      if (isInstance(a, Uint8Array)) a = Buffer3.from(a, a.offset, a.byteLength);
      if (isInstance(b, Uint8Array)) b = Buffer3.from(b, b.offset, b.byteLength);
      if (!Buffer3.isBuffer(a) || !Buffer3.isBuffer(b)) {
        throw new TypeError(
          'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
        );
      }
      if (a === b) return 0;
      let x = a.length;
      let y = b.length;
      for (let i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };
    Buffer3.isEncoding = function isEncoding(encoding) {
      switch (String(encoding).toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "latin1":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return true;
        default:
          return false;
      }
    };
    Buffer3.concat = function concat3(list, length) {
      if (!Array.isArray(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      }
      if (list.length === 0) {
        return Buffer3.alloc(0);
      }
      let i;
      if (length === void 0) {
        length = 0;
        for (i = 0; i < list.length; ++i) {
          length += list[i].length;
        }
      }
      const buffer = Buffer3.allocUnsafe(length);
      let pos = 0;
      for (i = 0; i < list.length; ++i) {
        let buf = list[i];
        if (isInstance(buf, Uint8Array)) {
          if (pos + buf.length > buffer.length) {
            if (!Buffer3.isBuffer(buf)) buf = Buffer3.from(buf);
            buf.copy(buffer, pos);
          } else {
            Uint8Array.prototype.set.call(
              buffer,
              buf,
              pos
            );
          }
        } else if (!Buffer3.isBuffer(buf)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        } else {
          buf.copy(buffer, pos);
        }
        pos += buf.length;
      }
      return buffer;
    };
    function byteLength(string, encoding) {
      if (Buffer3.isBuffer(string)) {
        return string.length;
      }
      if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
        return string.byteLength;
      }
      if (typeof string !== "string") {
        throw new TypeError(
          'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string
        );
      }
      const len = string.length;
      const mustMatch = arguments.length > 2 && arguments[2] === true;
      if (!mustMatch && len === 0) return 0;
      let loweredCase = false;
      for (; ; ) {
        switch (encoding) {
          case "ascii":
          case "latin1":
          case "binary":
            return len;
          case "utf8":
          case "utf-8":
            return utf8ToBytes4(string).length;
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return len * 2;
          case "hex":
            return len >>> 1;
          case "base64":
            return base64ToBytes(string).length;
          default:
            if (loweredCase) {
              return mustMatch ? -1 : utf8ToBytes4(string).length;
            }
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer3.byteLength = byteLength;
    function slowToString(encoding, start, end) {
      let loweredCase = false;
      if (start === void 0 || start < 0) {
        start = 0;
      }
      if (start > this.length) {
        return "";
      }
      if (end === void 0 || end > this.length) {
        end = this.length;
      }
      if (end <= 0) {
        return "";
      }
      end >>>= 0;
      start >>>= 0;
      if (end <= start) {
        return "";
      }
      if (!encoding) encoding = "utf8";
      while (true) {
        switch (encoding) {
          case "hex":
            return hexSlice(this, start, end);
          case "utf8":
          case "utf-8":
            return utf8Slice(this, start, end);
          case "ascii":
            return asciiSlice(this, start, end);
          case "latin1":
          case "binary":
            return latin1Slice(this, start, end);
          case "base64":
            return base64Slice(this, start, end);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return utf16leSlice(this, start, end);
          default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = (encoding + "").toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer3.prototype._isBuffer = true;
    function swap(b, n, m) {
      const i = b[n];
      b[n] = b[m];
      b[m] = i;
    }
    Buffer3.prototype.swap16 = function swap16() {
      const len = this.length;
      if (len % 2 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 16-bits");
      }
      for (let i = 0; i < len; i += 2) {
        swap(this, i, i + 1);
      }
      return this;
    };
    Buffer3.prototype.swap32 = function swap32() {
      const len = this.length;
      if (len % 4 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 32-bits");
      }
      for (let i = 0; i < len; i += 4) {
        swap(this, i, i + 3);
        swap(this, i + 1, i + 2);
      }
      return this;
    };
    Buffer3.prototype.swap64 = function swap64() {
      const len = this.length;
      if (len % 8 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 64-bits");
      }
      for (let i = 0; i < len; i += 8) {
        swap(this, i, i + 7);
        swap(this, i + 1, i + 6);
        swap(this, i + 2, i + 5);
        swap(this, i + 3, i + 4);
      }
      return this;
    };
    Buffer3.prototype.toString = function toString2() {
      const length = this.length;
      if (length === 0) return "";
      if (arguments.length === 0) return utf8Slice(this, 0, length);
      return slowToString.apply(this, arguments);
    };
    Buffer3.prototype.toLocaleString = Buffer3.prototype.toString;
    Buffer3.prototype.equals = function equals(b) {
      if (!Buffer3.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
      if (this === b) return true;
      return Buffer3.compare(this, b) === 0;
    };
    Buffer3.prototype.inspect = function inspect() {
      let str = "";
      const max = exports.INSPECT_MAX_BYTES;
      str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
      if (this.length > max) str += " ... ";
      return "<Buffer " + str + ">";
    };
    if (customInspectSymbol) {
      Buffer3.prototype[customInspectSymbol] = Buffer3.prototype.inspect;
    }
    Buffer3.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
      if (isInstance(target, Uint8Array)) {
        target = Buffer3.from(target, target.offset, target.byteLength);
      }
      if (!Buffer3.isBuffer(target)) {
        throw new TypeError(
          'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target
        );
      }
      if (start === void 0) {
        start = 0;
      }
      if (end === void 0) {
        end = target ? target.length : 0;
      }
      if (thisStart === void 0) {
        thisStart = 0;
      }
      if (thisEnd === void 0) {
        thisEnd = this.length;
      }
      if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError("out of range index");
      }
      if (thisStart >= thisEnd && start >= end) {
        return 0;
      }
      if (thisStart >= thisEnd) {
        return -1;
      }
      if (start >= end) {
        return 1;
      }
      start >>>= 0;
      end >>>= 0;
      thisStart >>>= 0;
      thisEnd >>>= 0;
      if (this === target) return 0;
      let x = thisEnd - thisStart;
      let y = end - start;
      const len = Math.min(x, y);
      const thisCopy = this.slice(thisStart, thisEnd);
      const targetCopy = target.slice(start, end);
      for (let i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i];
          y = targetCopy[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };
    function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
      if (buffer.length === 0) return -1;
      if (typeof byteOffset === "string") {
        encoding = byteOffset;
        byteOffset = 0;
      } else if (byteOffset > 2147483647) {
        byteOffset = 2147483647;
      } else if (byteOffset < -2147483648) {
        byteOffset = -2147483648;
      }
      byteOffset = +byteOffset;
      if (numberIsNaN(byteOffset)) {
        byteOffset = dir ? 0 : buffer.length - 1;
      }
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
      if (byteOffset >= buffer.length) {
        if (dir) return -1;
        else byteOffset = buffer.length - 1;
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0;
        else return -1;
      }
      if (typeof val === "string") {
        val = Buffer3.from(val, encoding);
      }
      if (Buffer3.isBuffer(val)) {
        if (val.length === 0) {
          return -1;
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
      } else if (typeof val === "number") {
        val = val & 255;
        if (typeof Uint8Array.prototype.indexOf === "function") {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
          } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
          }
        }
        return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
      }
      throw new TypeError("val must be string, number or Buffer");
    }
    function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
      let indexSize = 1;
      let arrLength = arr.length;
      let valLength = val.length;
      if (encoding !== void 0) {
        encoding = String(encoding).toLowerCase();
        if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
          if (arr.length < 2 || val.length < 2) {
            return -1;
          }
          indexSize = 2;
          arrLength /= 2;
          valLength /= 2;
          byteOffset /= 2;
        }
      }
      function read(buf, i2) {
        if (indexSize === 1) {
          return buf[i2];
        } else {
          return buf.readUInt16BE(i2 * indexSize);
        }
      }
      let i;
      if (dir) {
        let foundIndex = -1;
        for (i = byteOffset; i < arrLength; i++) {
          if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i;
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
          } else {
            if (foundIndex !== -1) i -= i - foundIndex;
            foundIndex = -1;
          }
        }
      } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
        for (i = byteOffset; i >= 0; i--) {
          let found = true;
          for (let j = 0; j < valLength; j++) {
            if (read(arr, i + j) !== read(val, j)) {
              found = false;
              break;
            }
          }
          if (found) return i;
        }
      }
      return -1;
    }
    Buffer3.prototype.includes = function includes(val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1;
    };
    Buffer3.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
    };
    Buffer3.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
    };
    function hexWrite(buf, string, offset, length) {
      offset = Number(offset) || 0;
      const remaining = buf.length - offset;
      if (!length) {
        length = remaining;
      } else {
        length = Number(length);
        if (length > remaining) {
          length = remaining;
        }
      }
      const strLen = string.length;
      if (length > strLen / 2) {
        length = strLen / 2;
      }
      let i;
      for (i = 0; i < length; ++i) {
        const parsed = parseInt(string.substr(i * 2, 2), 16);
        if (numberIsNaN(parsed)) return i;
        buf[offset + i] = parsed;
      }
      return i;
    }
    function utf8Write(buf, string, offset, length) {
      return blitBuffer(utf8ToBytes4(string, buf.length - offset), buf, offset, length);
    }
    function asciiWrite(buf, string, offset, length) {
      return blitBuffer(asciiToBytes(string), buf, offset, length);
    }
    function base64Write(buf, string, offset, length) {
      return blitBuffer(base64ToBytes(string), buf, offset, length);
    }
    function ucs2Write(buf, string, offset, length) {
      return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
    }
    Buffer3.prototype.write = function write(string, offset, length, encoding) {
      if (offset === void 0) {
        encoding = "utf8";
        length = this.length;
        offset = 0;
      } else if (length === void 0 && typeof offset === "string") {
        encoding = offset;
        length = this.length;
        offset = 0;
      } else if (isFinite(offset)) {
        offset = offset >>> 0;
        if (isFinite(length)) {
          length = length >>> 0;
          if (encoding === void 0) encoding = "utf8";
        } else {
          encoding = length;
          length = void 0;
        }
      } else {
        throw new Error(
          "Buffer.write(string, encoding, offset[, length]) is no longer supported"
        );
      }
      const remaining = this.length - offset;
      if (length === void 0 || length > remaining) length = remaining;
      if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
        throw new RangeError("Attempt to write outside buffer bounds");
      }
      if (!encoding) encoding = "utf8";
      let loweredCase = false;
      for (; ; ) {
        switch (encoding) {
          case "hex":
            return hexWrite(this, string, offset, length);
          case "utf8":
          case "utf-8":
            return utf8Write(this, string, offset, length);
          case "ascii":
          case "latin1":
          case "binary":
            return asciiWrite(this, string, offset, length);
          case "base64":
            return base64Write(this, string, offset, length);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return ucs2Write(this, string, offset, length);
          default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    };
    Buffer3.prototype.toJSON = function toJSON() {
      return {
        type: "Buffer",
        data: Array.prototype.slice.call(this._arr || this, 0)
      };
    };
    function base64Slice(buf, start, end) {
      if (start === 0 && end === buf.length) {
        return base64.fromByteArray(buf);
      } else {
        return base64.fromByteArray(buf.slice(start, end));
      }
    }
    function utf8Slice(buf, start, end) {
      end = Math.min(buf.length, end);
      const res = [];
      let i = start;
      while (i < end) {
        const firstByte = buf[i];
        let codePoint = null;
        let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
        if (i + bytesPerSequence <= end) {
          let secondByte, thirdByte, fourthByte, tempCodePoint;
          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 128) {
                codePoint = firstByte;
              }
              break;
            case 2:
              secondByte = buf[i + 1];
              if ((secondByte & 192) === 128) {
                tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                if (tempCodePoint > 127) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 3:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 4:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              fourthByte = buf[i + 3];
              if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                  codePoint = tempCodePoint;
                }
              }
          }
        }
        if (codePoint === null) {
          codePoint = 65533;
          bytesPerSequence = 1;
        } else if (codePoint > 65535) {
          codePoint -= 65536;
          res.push(codePoint >>> 10 & 1023 | 55296);
          codePoint = 56320 | codePoint & 1023;
        }
        res.push(codePoint);
        i += bytesPerSequence;
      }
      return decodeCodePointsArray(res);
    }
    var MAX_ARGUMENTS_LENGTH = 4096;
    function decodeCodePointsArray(codePoints) {
      const len = codePoints.length;
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints);
      }
      let res = "";
      let i = 0;
      while (i < len) {
        res += String.fromCharCode.apply(
          String,
          codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        );
      }
      return res;
    }
    function asciiSlice(buf, start, end) {
      let ret = "";
      end = Math.min(buf.length, end);
      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i] & 127);
      }
      return ret;
    }
    function latin1Slice(buf, start, end) {
      let ret = "";
      end = Math.min(buf.length, end);
      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i]);
      }
      return ret;
    }
    function hexSlice(buf, start, end) {
      const len = buf.length;
      if (!start || start < 0) start = 0;
      if (!end || end < 0 || end > len) end = len;
      let out = "";
      for (let i = start; i < end; ++i) {
        out += hexSliceLookupTable[buf[i]];
      }
      return out;
    }
    function utf16leSlice(buf, start, end) {
      const bytes = buf.slice(start, end);
      let res = "";
      for (let i = 0; i < bytes.length - 1; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
      }
      return res;
    }
    Buffer3.prototype.slice = function slice4(start, end) {
      const len = this.length;
      start = ~~start;
      end = end === void 0 ? len : ~~end;
      if (start < 0) {
        start += len;
        if (start < 0) start = 0;
      } else if (start > len) {
        start = len;
      }
      if (end < 0) {
        end += len;
        if (end < 0) end = 0;
      } else if (end > len) {
        end = len;
      }
      if (end < start) end = start;
      const newBuf = this.subarray(start, end);
      Object.setPrototypeOf(newBuf, Buffer3.prototype);
      return newBuf;
    };
    function checkOffset(offset, ext, length) {
      if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
      if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
    }
    Buffer3.prototype.readUintLE = Buffer3.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength2 && (mul *= 256)) {
        val += this[offset + i] * mul;
      }
      return val;
    };
    Buffer3.prototype.readUintBE = Buffer3.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        checkOffset(offset, byteLength2, this.length);
      }
      let val = this[offset + --byteLength2];
      let mul = 1;
      while (byteLength2 > 0 && (mul *= 256)) {
        val += this[offset + --byteLength2] * mul;
      }
      return val;
    };
    Buffer3.prototype.readUint8 = Buffer3.prototype.readUInt8 = function readUInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      return this[offset];
    };
    Buffer3.prototype.readUint16LE = Buffer3.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] | this[offset + 1] << 8;
    };
    Buffer3.prototype.readUint16BE = Buffer3.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] << 8 | this[offset + 1];
    };
    Buffer3.prototype.readUint32LE = Buffer3.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
    };
    Buffer3.prototype.readUint32BE = Buffer3.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
    };
    Buffer3.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const lo = first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
      const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
      return BigInt(lo) + (BigInt(hi) << BigInt(32));
    });
    Buffer3.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const hi = first * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
      const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
      return (BigInt(hi) << BigInt(32)) + BigInt(lo);
    });
    Buffer3.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength2 && (mul *= 256)) {
        val += this[offset + i] * mul;
      }
      mul *= 128;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
      return val;
    };
    Buffer3.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let i = byteLength2;
      let mul = 1;
      let val = this[offset + --i];
      while (i > 0 && (mul *= 256)) {
        val += this[offset + --i] * mul;
      }
      mul *= 128;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
      return val;
    };
    Buffer3.prototype.readInt8 = function readInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      if (!(this[offset] & 128)) return this[offset];
      return (255 - this[offset] + 1) * -1;
    };
    Buffer3.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset] | this[offset + 1] << 8;
      return val & 32768 ? val | 4294901760 : val;
    };
    Buffer3.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset + 1] | this[offset] << 8;
      return val & 32768 ? val | 4294901760 : val;
    };
    Buffer3.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
    };
    Buffer3.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
    };
    Buffer3.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
      return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
    });
    Buffer3.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const val = (first << 24) + // Overflow
      this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
      return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
    });
    Buffer3.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, true, 23, 4);
    };
    Buffer3.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, false, 23, 4);
    };
    Buffer3.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, true, 52, 8);
    };
    Buffer3.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, false, 52, 8);
    };
    function checkInt(buf, value, offset, ext, max, min) {
      if (!Buffer3.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
      if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
      if (offset + ext > buf.length) throw new RangeError("Index out of range");
    }
    Buffer3.prototype.writeUintLE = Buffer3.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
        checkInt(this, value, offset, byteLength2, maxBytes, 0);
      }
      let mul = 1;
      let i = 0;
      this[offset] = value & 255;
      while (++i < byteLength2 && (mul *= 256)) {
        this[offset + i] = value / mul & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeUintBE = Buffer3.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
        checkInt(this, value, offset, byteLength2, maxBytes, 0);
      }
      let i = byteLength2 - 1;
      let mul = 1;
      this[offset + i] = value & 255;
      while (--i >= 0 && (mul *= 256)) {
        this[offset + i] = value / mul & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeUint8 = Buffer3.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
      this[offset] = value & 255;
      return offset + 1;
    };
    Buffer3.prototype.writeUint16LE = Buffer3.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer3.prototype.writeUint16BE = Buffer3.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
      return offset + 2;
    };
    Buffer3.prototype.writeUint32LE = Buffer3.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
      this[offset + 3] = value >>> 24;
      this[offset + 2] = value >>> 16;
      this[offset + 1] = value >>> 8;
      this[offset] = value & 255;
      return offset + 4;
    };
    Buffer3.prototype.writeUint32BE = Buffer3.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
      return offset + 4;
    };
    function wrtBigUInt64LE(buf, value, offset, min, max) {
      checkIntBI(value, min, max, buf, offset, 7);
      let lo = Number(value & BigInt(4294967295));
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      let hi = Number(value >> BigInt(32) & BigInt(4294967295));
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      return offset;
    }
    function wrtBigUInt64BE(buf, value, offset, min, max) {
      checkIntBI(value, min, max, buf, offset, 7);
      let lo = Number(value & BigInt(4294967295));
      buf[offset + 7] = lo;
      lo = lo >> 8;
      buf[offset + 6] = lo;
      lo = lo >> 8;
      buf[offset + 5] = lo;
      lo = lo >> 8;
      buf[offset + 4] = lo;
      let hi = Number(value >> BigInt(32) & BigInt(4294967295));
      buf[offset + 3] = hi;
      hi = hi >> 8;
      buf[offset + 2] = hi;
      hi = hi >> 8;
      buf[offset + 1] = hi;
      hi = hi >> 8;
      buf[offset] = hi;
      return offset + 8;
    }
    Buffer3.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
      return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    Buffer3.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
      return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    Buffer3.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength2 - 1);
        checkInt(this, value, offset, byteLength2, limit - 1, -limit);
      }
      let i = 0;
      let mul = 1;
      let sub = 0;
      this[offset] = value & 255;
      while (++i < byteLength2 && (mul *= 256)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength2 - 1);
        checkInt(this, value, offset, byteLength2, limit - 1, -limit);
      }
      let i = byteLength2 - 1;
      let mul = 1;
      let sub = 0;
      this[offset + i] = value & 255;
      while (--i >= 0 && (mul *= 256)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
      if (value < 0) value = 255 + value + 1;
      this[offset] = value & 255;
      return offset + 1;
    };
    Buffer3.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer3.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
      return offset + 2;
    };
    Buffer3.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      this[offset + 2] = value >>> 16;
      this[offset + 3] = value >>> 24;
      return offset + 4;
    };
    Buffer3.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
      if (value < 0) value = 4294967295 + value + 1;
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
      return offset + 4;
    };
    Buffer3.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
      return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    Buffer3.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
      return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    function checkIEEE754(buf, value, offset, ext, max, min) {
      if (offset + ext > buf.length) throw new RangeError("Index out of range");
      if (offset < 0) throw new RangeError("Index out of range");
    }
    function writeFloat(buf, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 4, 34028234663852886e22, -34028234663852886e22);
      }
      ieee754.write(buf, value, offset, littleEndian, 23, 4);
      return offset + 4;
    }
    Buffer3.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert);
    };
    Buffer3.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert);
    };
    function writeDouble(buf, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 8, 17976931348623157e292, -17976931348623157e292);
      }
      ieee754.write(buf, value, offset, littleEndian, 52, 8);
      return offset + 8;
    }
    Buffer3.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert);
    };
    Buffer3.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert);
    };
    Buffer3.prototype.copy = function copy2(target, targetStart, start, end) {
      if (!Buffer3.isBuffer(target)) throw new TypeError("argument should be a Buffer");
      if (!start) start = 0;
      if (!end && end !== 0) end = this.length;
      if (targetStart >= target.length) targetStart = target.length;
      if (!targetStart) targetStart = 0;
      if (end > 0 && end < start) end = start;
      if (end === start) return 0;
      if (target.length === 0 || this.length === 0) return 0;
      if (targetStart < 0) {
        throw new RangeError("targetStart out of bounds");
      }
      if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
      if (end < 0) throw new RangeError("sourceEnd out of bounds");
      if (end > this.length) end = this.length;
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start;
      }
      const len = end - start;
      if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
        this.copyWithin(targetStart, start, end);
      } else {
        Uint8Array.prototype.set.call(
          target,
          this.subarray(start, end),
          targetStart
        );
      }
      return len;
    };
    Buffer3.prototype.fill = function fill(val, start, end, encoding) {
      if (typeof val === "string") {
        if (typeof start === "string") {
          encoding = start;
          start = 0;
          end = this.length;
        } else if (typeof end === "string") {
          encoding = end;
          end = this.length;
        }
        if (encoding !== void 0 && typeof encoding !== "string") {
          throw new TypeError("encoding must be a string");
        }
        if (typeof encoding === "string" && !Buffer3.isEncoding(encoding)) {
          throw new TypeError("Unknown encoding: " + encoding);
        }
        if (val.length === 1) {
          const code = val.charCodeAt(0);
          if (encoding === "utf8" && code < 128 || encoding === "latin1") {
            val = code;
          }
        }
      } else if (typeof val === "number") {
        val = val & 255;
      } else if (typeof val === "boolean") {
        val = Number(val);
      }
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError("Out of range index");
      }
      if (end <= start) {
        return this;
      }
      start = start >>> 0;
      end = end === void 0 ? this.length : end >>> 0;
      if (!val) val = 0;
      let i;
      if (typeof val === "number") {
        for (i = start; i < end; ++i) {
          this[i] = val;
        }
      } else {
        const bytes = Buffer3.isBuffer(val) ? val : Buffer3.from(val, encoding);
        const len = bytes.length;
        if (len === 0) {
          throw new TypeError('The value "' + val + '" is invalid for argument "value"');
        }
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len];
        }
      }
      return this;
    };
    var errors = {};
    function E(sym, getMessage, Base) {
      errors[sym] = class NodeError extends Base {
        constructor() {
          super();
          Object.defineProperty(this, "message", {
            value: getMessage.apply(this, arguments),
            writable: true,
            configurable: true
          });
          this.name = `${this.name} [${sym}]`;
          this.stack;
          delete this.name;
        }
        get code() {
          return sym;
        }
        set code(value) {
          Object.defineProperty(this, "code", {
            configurable: true,
            enumerable: true,
            value,
            writable: true
          });
        }
        toString() {
          return `${this.name} [${sym}]: ${this.message}`;
        }
      };
    }
    E(
      "ERR_BUFFER_OUT_OF_BOUNDS",
      function(name) {
        if (name) {
          return `${name} is outside of buffer bounds`;
        }
        return "Attempt to access memory outside buffer bounds";
      },
      RangeError
    );
    E(
      "ERR_INVALID_ARG_TYPE",
      function(name, actual) {
        return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
      },
      TypeError
    );
    E(
      "ERR_OUT_OF_RANGE",
      function(str, range, input) {
        let msg = `The value of "${str}" is out of range.`;
        let received = input;
        if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
          received = addNumericalSeparator(String(input));
        } else if (typeof input === "bigint") {
          received = String(input);
          if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
            received = addNumericalSeparator(received);
          }
          received += "n";
        }
        msg += ` It must be ${range}. Received ${received}`;
        return msg;
      },
      RangeError
    );
    function addNumericalSeparator(val) {
      let res = "";
      let i = val.length;
      const start = val[0] === "-" ? 1 : 0;
      for (; i >= start + 4; i -= 3) {
        res = `_${val.slice(i - 3, i)}${res}`;
      }
      return `${val.slice(0, i)}${res}`;
    }
    function checkBounds(buf, offset, byteLength2) {
      validateNumber(offset, "offset");
      if (buf[offset] === void 0 || buf[offset + byteLength2] === void 0) {
        boundsError(offset, buf.length - (byteLength2 + 1));
      }
    }
    function checkIntBI(value, min, max, buf, offset, byteLength2) {
      if (value > max || value < min) {
        const n = typeof min === "bigint" ? "n" : "";
        let range;
        if (byteLength2 > 3) {
          if (min === 0 || min === BigInt(0)) {
            range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
          } else {
            range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
          }
        } else {
          range = `>= ${min}${n} and <= ${max}${n}`;
        }
        throw new errors.ERR_OUT_OF_RANGE("value", range, value);
      }
      checkBounds(buf, offset, byteLength2);
    }
    function validateNumber(value, name) {
      if (typeof value !== "number") {
        throw new errors.ERR_INVALID_ARG_TYPE(name, "number", value);
      }
    }
    function boundsError(value, length, type) {
      if (Math.floor(value) !== value) {
        validateNumber(value, type);
        throw new errors.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
      }
      if (length < 0) {
        throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
      }
      throw new errors.ERR_OUT_OF_RANGE(
        type || "offset",
        `>= ${type ? 1 : 0} and <= ${length}`,
        value
      );
    }
    var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
    function base64clean(str) {
      str = str.split("=")[0];
      str = str.trim().replace(INVALID_BASE64_RE, "");
      if (str.length < 2) return "";
      while (str.length % 4 !== 0) {
        str = str + "=";
      }
      return str;
    }
    function utf8ToBytes4(string, units) {
      units = units || Infinity;
      let codePoint;
      const length = string.length;
      let leadSurrogate = null;
      const bytes = [];
      for (let i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i);
        if (codePoint > 55295 && codePoint < 57344) {
          if (!leadSurrogate) {
            if (codePoint > 56319) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              continue;
            } else if (i + 1 === length) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              continue;
            }
            leadSurrogate = codePoint;
            continue;
          }
          if (codePoint < 56320) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
            leadSurrogate = codePoint;
            continue;
          }
          codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
        } else if (leadSurrogate) {
          if ((units -= 3) > -1) bytes.push(239, 191, 189);
        }
        leadSurrogate = null;
        if (codePoint < 128) {
          if ((units -= 1) < 0) break;
          bytes.push(codePoint);
        } else if (codePoint < 2048) {
          if ((units -= 2) < 0) break;
          bytes.push(
            codePoint >> 6 | 192,
            codePoint & 63 | 128
          );
        } else if (codePoint < 65536) {
          if ((units -= 3) < 0) break;
          bytes.push(
            codePoint >> 12 | 224,
            codePoint >> 6 & 63 | 128,
            codePoint & 63 | 128
          );
        } else if (codePoint < 1114112) {
          if ((units -= 4) < 0) break;
          bytes.push(
            codePoint >> 18 | 240,
            codePoint >> 12 & 63 | 128,
            codePoint >> 6 & 63 | 128,
            codePoint & 63 | 128
          );
        } else {
          throw new Error("Invalid code point");
        }
      }
      return bytes;
    }
    function asciiToBytes(str) {
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        byteArray.push(str.charCodeAt(i) & 255);
      }
      return byteArray;
    }
    function utf16leToBytes(str, units) {
      let c, hi, lo;
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break;
        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
      }
      return byteArray;
    }
    function base64ToBytes(str) {
      return base64.toByteArray(base64clean(str));
    }
    function blitBuffer(src, dst, offset, length) {
      let i;
      for (i = 0; i < length; ++i) {
        if (i + offset >= dst.length || i >= src.length) break;
        dst[i + offset] = src[i];
      }
      return i;
    }
    function isInstance(obj, type) {
      return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
    }
    function numberIsNaN(obj) {
      return obj !== obj;
    }
    var hexSliceLookupTable = (function() {
      const alphabet = "0123456789abcdef";
      const table = new Array(256);
      for (let i = 0; i < 16; ++i) {
        const i16 = i * 16;
        for (let j = 0; j < 16; ++j) {
          table[i16 + j] = alphabet[i] + alphabet[j];
        }
      }
      return table;
    })();
    function defineBigIntMethod(fn) {
      return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
    }
    function BufferBigIntNotDefined() {
      throw new Error("BigInt not supported");
    }
  }
});

// circle/arc/scripts/browser-buffer-global.js
var import_buffer;
var init_browser_buffer_global = __esm({
  "circle/arc/scripts/browser-buffer-global.js"() {
    import_buffer = __toESM(require_buffer());
    globalThis.Buffer = globalThis.Buffer || import_buffer.Buffer;
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/version.js
var init_version = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/version.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/errors.js
var init_errors = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/errors.js"() {
    init_browser_buffer_global();
    init_version();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/narrow.js
var init_narrow = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/narrow.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/regex.js
function execTyped(regex, string) {
  const match = regex.exec(string);
  return match?.groups;
}
var init_regex = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/regex.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/formatAbiParameter.js
function formatAbiParameter(abiParameter) {
  let type = abiParameter.type;
  if (tupleRegex.test(abiParameter.type) && "components" in abiParameter) {
    type = "(";
    const length = abiParameter.components.length;
    for (let i = 0; i < length; i++) {
      const component = abiParameter.components[i];
      type += formatAbiParameter(component);
      if (i < length - 1)
        type += ", ";
    }
    const result = execTyped(tupleRegex, abiParameter.type);
    type += `)${result?.array || ""}`;
    return formatAbiParameter({
      ...abiParameter,
      type
    });
  }
  if ("indexed" in abiParameter && abiParameter.indexed)
    type = `${type} indexed`;
  if (abiParameter.name)
    return `${type} ${abiParameter.name}`;
  return type;
}
var tupleRegex;
var init_formatAbiParameter = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/formatAbiParameter.js"() {
    init_browser_buffer_global();
    init_regex();
    tupleRegex = /^tuple(?<array>(\[(\d*)\])*)$/;
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/formatAbiParameters.js
function formatAbiParameters(abiParameters) {
  let params = "";
  const length = abiParameters.length;
  for (let i = 0; i < length; i++) {
    const abiParameter = abiParameters[i];
    params += formatAbiParameter(abiParameter);
    if (i !== length - 1)
      params += ", ";
  }
  return params;
}
var init_formatAbiParameters = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/formatAbiParameters.js"() {
    init_browser_buffer_global();
    init_formatAbiParameter();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/formatAbiItem.js
function formatAbiItem(abiItem) {
  if (abiItem.type === "function")
    return `function ${abiItem.name}(${formatAbiParameters(abiItem.inputs)})${abiItem.stateMutability && abiItem.stateMutability !== "nonpayable" ? ` ${abiItem.stateMutability}` : ""}${abiItem.outputs?.length ? ` returns (${formatAbiParameters(abiItem.outputs)})` : ""}`;
  if (abiItem.type === "event")
    return `event ${abiItem.name}(${formatAbiParameters(abiItem.inputs)})`;
  if (abiItem.type === "error")
    return `error ${abiItem.name}(${formatAbiParameters(abiItem.inputs)})`;
  if (abiItem.type === "constructor")
    return `constructor(${formatAbiParameters(abiItem.inputs)})${abiItem.stateMutability === "payable" ? " payable" : ""}`;
  if (abiItem.type === "fallback")
    return `fallback() external${abiItem.stateMutability === "payable" ? " payable" : ""}`;
  return "receive() external payable";
}
var init_formatAbiItem = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/formatAbiItem.js"() {
    init_browser_buffer_global();
    init_formatAbiParameters();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/formatAbi.js
var init_formatAbi = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/formatAbi.js"() {
    init_browser_buffer_global();
    init_formatAbiItem();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/runtime/signatures.js
var init_signatures = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/runtime/signatures.js"() {
    init_browser_buffer_global();
    init_regex();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/errors/abiItem.js
var init_abiItem = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/errors/abiItem.js"() {
    init_browser_buffer_global();
    init_errors();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/errors/abiParameter.js
var init_abiParameter = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/errors/abiParameter.js"() {
    init_browser_buffer_global();
    init_errors();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/errors/signature.js
var init_signature = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/errors/signature.js"() {
    init_browser_buffer_global();
    init_errors();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/errors/struct.js
var init_struct = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/errors/struct.js"() {
    init_browser_buffer_global();
    init_errors();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/errors/splitParameters.js
var init_splitParameters = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/errors/splitParameters.js"() {
    init_browser_buffer_global();
    init_errors();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/runtime/cache.js
var init_cache = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/runtime/cache.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/runtime/utils.js
var init_utils = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/runtime/utils.js"() {
    init_browser_buffer_global();
    init_regex();
    init_abiItem();
    init_abiParameter();
    init_signature();
    init_splitParameters();
    init_cache();
    init_signatures();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/runtime/structs.js
var init_structs = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/runtime/structs.js"() {
    init_browser_buffer_global();
    init_regex();
    init_abiItem();
    init_abiParameter();
    init_signature();
    init_struct();
    init_signatures();
    init_utils();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/parseAbi.js
var init_parseAbi = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/parseAbi.js"() {
    init_browser_buffer_global();
    init_signatures();
    init_structs();
    init_utils();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/parseAbiItem.js
var init_parseAbiItem = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/parseAbiItem.js"() {
    init_browser_buffer_global();
    init_abiItem();
    init_signatures();
    init_structs();
    init_utils();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/parseAbiParameter.js
var init_parseAbiParameter = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/parseAbiParameter.js"() {
    init_browser_buffer_global();
    init_abiParameter();
    init_signatures();
    init_structs();
    init_utils();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/human-readable/parseAbiParameters.js
var init_parseAbiParameters = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/human-readable/parseAbiParameters.js"() {
    init_browser_buffer_global();
    init_abiParameter();
    init_signatures();
    init_structs();
    init_utils();
    init_utils();
  }
});

// node_modules/viem/node_modules/abitype/dist/esm/exports/index.js
var init_exports = __esm({
  "node_modules/viem/node_modules/abitype/dist/esm/exports/index.js"() {
    init_browser_buffer_global();
    init_errors();
    init_narrow();
    init_formatAbi();
    init_formatAbiItem();
    init_formatAbiParameter();
    init_formatAbiParameters();
    init_parseAbi();
    init_parseAbiItem();
    init_parseAbiParameter();
    init_parseAbiParameters();
    init_abiItem();
    init_abiParameter();
    init_signature();
    init_splitParameters();
    init_struct();
  }
});

// node_modules/viem/_esm/accounts/utils/parseAccount.js
var init_parseAccount = __esm({
  "node_modules/viem/_esm/accounts/utils/parseAccount.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/viem/_esm/errors/version.js
var version2;
var init_version2 = __esm({
  "node_modules/viem/_esm/errors/version.js"() {
    init_browser_buffer_global();
    version2 = "2.52.2";
  }
});

// node_modules/viem/_esm/errors/base.js
function walk(err, fn) {
  if (fn?.(err))
    return err;
  if (err && typeof err === "object" && "cause" in err && err.cause !== void 0)
    return walk(err.cause, fn);
  return fn ? null : err;
}
var errorConfig, BaseError2;
var init_base = __esm({
  "node_modules/viem/_esm/errors/base.js"() {
    init_browser_buffer_global();
    init_version2();
    errorConfig = {
      getDocsUrl: ({ docsBaseUrl, docsPath: docsPath3 = "", docsSlug }) => docsPath3 ? `${docsBaseUrl ?? "https://viem.sh"}${docsPath3}${docsSlug ? `#${docsSlug}` : ""}` : void 0,
      version: `viem@${version2}`
    };
    BaseError2 = class _BaseError extends Error {
      constructor(shortMessage, args = {}) {
        const details = (() => {
          if (args.cause instanceof _BaseError)
            return args.cause.details;
          if (args.cause?.message)
            return args.cause.message;
          return args.details;
        })();
        const docsPath3 = (() => {
          if (args.cause instanceof _BaseError)
            return args.cause.docsPath || args.docsPath;
          return args.docsPath;
        })();
        const docsUrl = errorConfig.getDocsUrl?.({ ...args, docsPath: docsPath3 });
        const message = [
          shortMessage || "An error occurred.",
          "",
          ...args.metaMessages ? [...args.metaMessages, ""] : [],
          ...docsUrl ? [`Docs: ${docsUrl}`] : [],
          ...details ? [`Details: ${details}`] : [],
          ...errorConfig.version ? [`Version: ${errorConfig.version}`] : []
        ].join("\n");
        super(message, args.cause ? { cause: args.cause } : void 0);
        Object.defineProperty(this, "details", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "docsPath", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "metaMessages", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "shortMessage", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "version", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "BaseError"
        });
        this.details = details;
        this.docsPath = docsPath3;
        this.metaMessages = args.metaMessages;
        this.name = args.name ?? this.name;
        this.shortMessage = shortMessage;
        this.version = version2;
      }
      walk(fn) {
        return walk(this, fn);
      }
    };
  }
});

// node_modules/viem/_esm/errors/address.js
var InvalidAddressError;
var init_address = __esm({
  "node_modules/viem/_esm/errors/address.js"() {
    init_browser_buffer_global();
    init_base();
    InvalidAddressError = class extends BaseError2 {
      constructor({ address }) {
        super(`Address "${address}" is invalid.`, {
          metaMessages: [
            "- Address must be a hex value of 20 bytes (40 hex characters).",
            "- Address must match its checksum counterpart."
          ],
          name: "InvalidAddressError"
        });
      }
    };
  }
});

// node_modules/viem/_esm/utils/data/isHex.js
function isHex(value, { strict = true } = {}) {
  if (!value)
    return false;
  if (typeof value !== "string")
    return false;
  return strict ? /^0x[0-9a-fA-F]*$/.test(value) : value.startsWith("0x");
}
var init_isHex = __esm({
  "node_modules/viem/_esm/utils/data/isHex.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/viem/_esm/errors/data.js
var SliceOffsetOutOfBoundsError, SizeExceedsPaddingSizeError;
var init_data = __esm({
  "node_modules/viem/_esm/errors/data.js"() {
    init_browser_buffer_global();
    init_base();
    SliceOffsetOutOfBoundsError = class extends BaseError2 {
      constructor({ offset, position, size: size4 }) {
        super(`Slice ${position === "start" ? "starting" : "ending"} at offset "${offset}" is out-of-bounds (size: ${size4}).`, { name: "SliceOffsetOutOfBoundsError" });
      }
    };
    SizeExceedsPaddingSizeError = class extends BaseError2 {
      constructor({ size: size4, targetSize, type }) {
        super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (${size4}) exceeds padding size (${targetSize}).`, { name: "SizeExceedsPaddingSizeError" });
      }
    };
  }
});

// node_modules/viem/_esm/utils/data/pad.js
function pad(hexOrBytes, { dir, size: size4 = 32 } = {}) {
  if (typeof hexOrBytes === "string")
    return padHex(hexOrBytes, { dir, size: size4 });
  return padBytes(hexOrBytes, { dir, size: size4 });
}
function padHex(hex_, { dir, size: size4 = 32 } = {}) {
  if (size4 === null)
    return hex_;
  const hex = hex_.replace("0x", "");
  if (hex.length > size4 * 2)
    throw new SizeExceedsPaddingSizeError({
      size: Math.ceil(hex.length / 2),
      targetSize: size4,
      type: "hex"
    });
  return `0x${hex[dir === "right" ? "padEnd" : "padStart"](size4 * 2, "0")}`;
}
function padBytes(bytes, { dir, size: size4 = 32 } = {}) {
  if (size4 === null)
    return bytes;
  if (bytes.length > size4)
    throw new SizeExceedsPaddingSizeError({
      size: bytes.length,
      targetSize: size4,
      type: "bytes"
    });
  const paddedBytes = new Uint8Array(size4);
  for (let i = 0; i < size4; i++) {
    const padEnd = dir === "right";
    paddedBytes[padEnd ? i : size4 - i - 1] = bytes[padEnd ? i : bytes.length - i - 1];
  }
  return paddedBytes;
}
var init_pad = __esm({
  "node_modules/viem/_esm/utils/data/pad.js"() {
    init_browser_buffer_global();
    init_data();
  }
});

// node_modules/viem/_esm/errors/encoding.js
var IntegerOutOfRangeError, InvalidBytesBooleanError, SizeOverflowError;
var init_encoding = __esm({
  "node_modules/viem/_esm/errors/encoding.js"() {
    init_browser_buffer_global();
    init_base();
    IntegerOutOfRangeError = class extends BaseError2 {
      constructor({ max, min, signed, size: size4, value }) {
        super(`Number "${value}" is not in safe ${size4 ? `${size4 * 8}-bit ${signed ? "signed" : "unsigned"} ` : ""}integer range ${max ? `(${min} to ${max})` : `(above ${min})`}`, { name: "IntegerOutOfRangeError" });
      }
    };
    InvalidBytesBooleanError = class extends BaseError2 {
      constructor(bytes) {
        super(`Bytes value "${bytes}" is not a valid boolean. The bytes array must contain a single byte of either a 0 or 1 value.`, {
          name: "InvalidBytesBooleanError"
        });
      }
    };
    SizeOverflowError = class extends BaseError2 {
      constructor({ givenSize, maxSize }) {
        super(`Size cannot exceed ${maxSize} bytes. Given size: ${givenSize} bytes.`, { name: "SizeOverflowError" });
      }
    };
  }
});

// node_modules/viem/_esm/utils/data/size.js
function size(value) {
  if (isHex(value, { strict: false }))
    return Math.ceil((value.length - 2) / 2);
  return value.length;
}
var init_size = __esm({
  "node_modules/viem/_esm/utils/data/size.js"() {
    init_browser_buffer_global();
    init_isHex();
  }
});

// node_modules/viem/_esm/utils/data/trim.js
function trim(hexOrBytes, { dir = "left" } = {}) {
  let data = typeof hexOrBytes === "string" ? hexOrBytes.replace("0x", "") : hexOrBytes;
  let sliceLength = 0;
  for (let i = 0; i < data.length - 1; i++) {
    if (data[dir === "left" ? i : data.length - i - 1].toString() === "0")
      sliceLength++;
    else
      break;
  }
  data = dir === "left" ? data.slice(sliceLength) : data.slice(0, data.length - sliceLength);
  if (typeof hexOrBytes === "string") {
    if (data.length === 1 && dir === "right")
      data = `${data}0`;
    return `0x${data.length % 2 === 1 ? `0${data}` : data}`;
  }
  return data;
}
var init_trim = __esm({
  "node_modules/viem/_esm/utils/data/trim.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/viem/_esm/utils/encoding/fromHex.js
function assertSize(hexOrBytes, { size: size4 }) {
  if (size(hexOrBytes) > size4)
    throw new SizeOverflowError({
      givenSize: size(hexOrBytes),
      maxSize: size4
    });
}
function hexToBigInt(hex, opts = {}) {
  const { signed } = opts;
  if (opts.size)
    assertSize(hex, { size: opts.size });
  const value = BigInt(hex);
  if (!signed)
    return value;
  const size4 = (hex.length - 2) / 2;
  const max = (1n << BigInt(size4) * 8n - 1n) - 1n;
  if (value <= max)
    return value;
  return value - BigInt(`0x${"f".padStart(size4 * 2, "f")}`) - 1n;
}
function hexToNumber(hex, opts = {}) {
  const value = hexToBigInt(hex, opts);
  const number = Number(value);
  if (!Number.isSafeInteger(number))
    throw new IntegerOutOfRangeError({
      max: `${Number.MAX_SAFE_INTEGER}`,
      min: `${Number.MIN_SAFE_INTEGER}`,
      signed: opts.signed,
      size: opts.size,
      value: `${value}n`
    });
  return number;
}
var init_fromHex = __esm({
  "node_modules/viem/_esm/utils/encoding/fromHex.js"() {
    init_browser_buffer_global();
    init_encoding();
    init_size();
    init_trim();
    init_toBytes();
  }
});

// node_modules/viem/_esm/utils/encoding/toHex.js
function toHex(value, opts = {}) {
  if (typeof value === "number" || typeof value === "bigint")
    return numberToHex(value, opts);
  if (typeof value === "string") {
    return stringToHex(value, opts);
  }
  if (typeof value === "boolean")
    return boolToHex(value, opts);
  return bytesToHex(value, opts);
}
function boolToHex(value, opts = {}) {
  const hex = `0x${Number(value)}`;
  if (typeof opts.size === "number") {
    assertSize(hex, { size: opts.size });
    return pad(hex, { size: opts.size });
  }
  return hex;
}
function bytesToHex(value, opts = {}) {
  let string = "";
  for (let i = 0; i < value.length; i++) {
    string += hexes[value[i]];
  }
  const hex = `0x${string}`;
  if (typeof opts.size === "number") {
    assertSize(hex, { size: opts.size });
    return pad(hex, { dir: "right", size: opts.size });
  }
  return hex;
}
function numberToHex(value_, opts = {}) {
  const { signed, size: size4 } = opts;
  const value = BigInt(value_);
  let maxValue;
  if (size4) {
    if (signed)
      maxValue = (1n << BigInt(size4) * 8n - 1n) - 1n;
    else
      maxValue = 2n ** (BigInt(size4) * 8n) - 1n;
  } else if (typeof value_ === "number") {
    maxValue = BigInt(Number.MAX_SAFE_INTEGER);
  }
  const minValue = typeof maxValue === "bigint" && signed ? -maxValue - 1n : 0;
  if (maxValue && value > maxValue || value < minValue) {
    const suffix = typeof value_ === "bigint" ? "n" : "";
    throw new IntegerOutOfRangeError({
      max: maxValue ? `${maxValue}${suffix}` : void 0,
      min: `${minValue}${suffix}`,
      signed,
      size: size4,
      value: `${value_}${suffix}`
    });
  }
  const hex = `0x${(signed && value < 0 ? (1n << BigInt(size4 * 8)) + BigInt(value) : value).toString(16)}`;
  if (size4)
    return pad(hex, { size: size4 });
  return hex;
}
function stringToHex(value_, opts = {}) {
  const value = encoder.encode(value_);
  return bytesToHex(value, opts);
}
var hexes, encoder;
var init_toHex = __esm({
  "node_modules/viem/_esm/utils/encoding/toHex.js"() {
    init_browser_buffer_global();
    init_encoding();
    init_pad();
    init_fromHex();
    hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, "0"));
    encoder = /* @__PURE__ */ new TextEncoder();
  }
});

// node_modules/viem/_esm/utils/encoding/toBytes.js
function toBytes(value, opts = {}) {
  if (typeof value === "number" || typeof value === "bigint")
    return numberToBytes(value, opts);
  if (typeof value === "boolean")
    return boolToBytes(value, opts);
  if (isHex(value))
    return hexToBytes(value, opts);
  return stringToBytes(value, opts);
}
function boolToBytes(value, opts = {}) {
  const bytes = new Uint8Array(1);
  bytes[0] = Number(value);
  if (typeof opts.size === "number") {
    assertSize(bytes, { size: opts.size });
    return pad(bytes, { size: opts.size });
  }
  return bytes;
}
function charCodeToBase16(char) {
  if (char >= charCodeMap.zero && char <= charCodeMap.nine)
    return char - charCodeMap.zero;
  if (char >= charCodeMap.A && char <= charCodeMap.F)
    return char - (charCodeMap.A - 10);
  if (char >= charCodeMap.a && char <= charCodeMap.f)
    return char - (charCodeMap.a - 10);
  return void 0;
}
function hexToBytes(hex_, opts = {}) {
  let hex = hex_;
  if (opts.size) {
    assertSize(hex, { size: opts.size });
    hex = pad(hex, { dir: "right", size: opts.size });
  }
  let hexString = hex.slice(2);
  if (hexString.length % 2)
    hexString = `0${hexString}`;
  const length = hexString.length / 2;
  const bytes = new Uint8Array(length);
  for (let index = 0, j = 0; index < length; index++) {
    const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
    const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
    if (nibbleLeft === void 0 || nibbleRight === void 0) {
      throw new BaseError2(`Invalid byte sequence ("${hexString[j - 2]}${hexString[j - 1]}" in "${hexString}").`);
    }
    bytes[index] = nibbleLeft * 16 + nibbleRight;
  }
  return bytes;
}
function numberToBytes(value, opts) {
  const hex = numberToHex(value, opts);
  return hexToBytes(hex);
}
function stringToBytes(value, opts = {}) {
  const bytes = encoder2.encode(value);
  if (typeof opts.size === "number") {
    assertSize(bytes, { size: opts.size });
    return pad(bytes, { dir: "right", size: opts.size });
  }
  return bytes;
}
var encoder2, charCodeMap;
var init_toBytes = __esm({
  "node_modules/viem/_esm/utils/encoding/toBytes.js"() {
    init_browser_buffer_global();
    init_base();
    init_isHex();
    init_pad();
    init_fromHex();
    init_toHex();
    encoder2 = /* @__PURE__ */ new TextEncoder();
    charCodeMap = {
      zero: 48,
      nine: 57,
      A: 65,
      F: 70,
      a: 97,
      f: 102
    };
  }
});

// node_modules/viem/node_modules/@noble/hashes/esm/_u64.js
function fromBig(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function split(lst, le = false) {
  const len = lst.length;
  let Ah = new Uint32Array(len);
  let Al = new Uint32Array(len);
  for (let i = 0; i < len; i++) {
    const { h, l } = fromBig(lst[i], le);
    [Ah[i], Al[i]] = [h, l];
  }
  return [Ah, Al];
}
var U32_MASK64, _32n, rotlSH, rotlSL, rotlBH, rotlBL;
var init_u64 = __esm({
  "node_modules/viem/node_modules/@noble/hashes/esm/_u64.js"() {
    init_browser_buffer_global();
    U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
    _32n = /* @__PURE__ */ BigInt(32);
    rotlSH = (h, l, s) => h << s | l >>> 32 - s;
    rotlSL = (h, l, s) => l << s | h >>> 32 - s;
    rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
    rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
  }
});

// node_modules/viem/node_modules/@noble/hashes/esm/crypto.js
var crypto2;
var init_crypto = __esm({
  "node_modules/viem/node_modules/@noble/hashes/esm/crypto.js"() {
    init_browser_buffer_global();
    crypto2 = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
  }
});

// node_modules/viem/node_modules/@noble/hashes/esm/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function anumber(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function abytes(b, ...lengths) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
function u32(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function byteSwap(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
function byteSwap32(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
  return arr;
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes2(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes(data);
  return data;
}
function createHasher(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes2(msg)).digest();
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}
var isLE, swap32IfBE, Hash;
var init_utils2 = __esm({
  "node_modules/viem/node_modules/@noble/hashes/esm/utils.js"() {
    init_browser_buffer_global();
    init_crypto();
    isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
    swap32IfBE = isLE ? (u) => u : byteSwap32;
    Hash = class {
    };
  }
});

// node_modules/viem/node_modules/@noble/hashes/esm/sha3.js
function keccakP(s, rounds = 24) {
  const B = new Uint32Array(5 * 2);
  for (let round = 24 - rounds; round < 24; round++) {
    for (let x = 0; x < 10; x++)
      B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
    for (let x = 0; x < 10; x += 2) {
      const idx1 = (x + 8) % 10;
      const idx0 = (x + 2) % 10;
      const B0 = B[idx0];
      const B1 = B[idx0 + 1];
      const Th = rotlH(B0, B1, 1) ^ B[idx1];
      const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
      for (let y = 0; y < 50; y += 10) {
        s[x + y] ^= Th;
        s[x + y + 1] ^= Tl;
      }
    }
    let curH = s[2];
    let curL = s[3];
    for (let t = 0; t < 24; t++) {
      const shift = SHA3_ROTL[t];
      const Th = rotlH(curH, curL, shift);
      const Tl = rotlL(curH, curL, shift);
      const PI = SHA3_PI[t];
      curH = s[PI];
      curL = s[PI + 1];
      s[PI] = Th;
      s[PI + 1] = Tl;
    }
    for (let y = 0; y < 50; y += 10) {
      for (let x = 0; x < 10; x++)
        B[x] = s[y + x];
      for (let x = 0; x < 10; x++)
        s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
    }
    s[0] ^= SHA3_IOTA_H[round];
    s[1] ^= SHA3_IOTA_L[round];
  }
  clean(B);
}
var _0n, _1n, _2n, _7n, _256n, _0x71n, SHA3_PI, SHA3_ROTL, _SHA3_IOTA, IOTAS, SHA3_IOTA_H, SHA3_IOTA_L, rotlH, rotlL, Keccak, gen, keccak_256;
var init_sha3 = __esm({
  "node_modules/viem/node_modules/@noble/hashes/esm/sha3.js"() {
    init_browser_buffer_global();
    init_u64();
    init_utils2();
    _0n = BigInt(0);
    _1n = BigInt(1);
    _2n = BigInt(2);
    _7n = BigInt(7);
    _256n = BigInt(256);
    _0x71n = BigInt(113);
    SHA3_PI = [];
    SHA3_ROTL = [];
    _SHA3_IOTA = [];
    for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
      [x, y] = [y, (2 * x + 3 * y) % 5];
      SHA3_PI.push(2 * (5 * y + x));
      SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
      let t = _0n;
      for (let j = 0; j < 7; j++) {
        R = (R << _1n ^ (R >> _7n) * _0x71n) % _256n;
        if (R & _2n)
          t ^= _1n << (_1n << /* @__PURE__ */ BigInt(j)) - _1n;
      }
      _SHA3_IOTA.push(t);
    }
    IOTAS = split(_SHA3_IOTA, true);
    SHA3_IOTA_H = IOTAS[0];
    SHA3_IOTA_L = IOTAS[1];
    rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
    rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
    Keccak = class _Keccak extends Hash {
      // NOTE: we accept arguments in bytes instead of bits here.
      constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
        super();
        this.pos = 0;
        this.posOut = 0;
        this.finished = false;
        this.destroyed = false;
        this.enableXOF = false;
        this.blockLen = blockLen;
        this.suffix = suffix;
        this.outputLen = outputLen;
        this.enableXOF = enableXOF;
        this.rounds = rounds;
        anumber(outputLen);
        if (!(0 < blockLen && blockLen < 200))
          throw new Error("only keccak-f1600 function is supported");
        this.state = new Uint8Array(200);
        this.state32 = u32(this.state);
      }
      clone() {
        return this._cloneInto();
      }
      keccak() {
        swap32IfBE(this.state32);
        keccakP(this.state32, this.rounds);
        swap32IfBE(this.state32);
        this.posOut = 0;
        this.pos = 0;
      }
      update(data) {
        aexists(this);
        data = toBytes2(data);
        abytes(data);
        const { blockLen, state } = this;
        const len = data.length;
        for (let pos = 0; pos < len; ) {
          const take = Math.min(blockLen - this.pos, len - pos);
          for (let i = 0; i < take; i++)
            state[this.pos++] ^= data[pos++];
          if (this.pos === blockLen)
            this.keccak();
        }
        return this;
      }
      finish() {
        if (this.finished)
          return;
        this.finished = true;
        const { state, suffix, pos, blockLen } = this;
        state[pos] ^= suffix;
        if ((suffix & 128) !== 0 && pos === blockLen - 1)
          this.keccak();
        state[blockLen - 1] ^= 128;
        this.keccak();
      }
      writeInto(out) {
        aexists(this, false);
        abytes(out);
        this.finish();
        const bufferOut = this.state;
        const { blockLen } = this;
        for (let pos = 0, len = out.length; pos < len; ) {
          if (this.posOut >= blockLen)
            this.keccak();
          const take = Math.min(blockLen - this.posOut, len - pos);
          out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
          this.posOut += take;
          pos += take;
        }
        return out;
      }
      xofInto(out) {
        if (!this.enableXOF)
          throw new Error("XOF is not possible for this instance");
        return this.writeInto(out);
      }
      xof(bytes) {
        anumber(bytes);
        return this.xofInto(new Uint8Array(bytes));
      }
      digestInto(out) {
        aoutput(out, this);
        if (this.finished)
          throw new Error("digest() was already called");
        this.writeInto(out);
        this.destroy();
        return out;
      }
      digest() {
        return this.digestInto(new Uint8Array(this.outputLen));
      }
      destroy() {
        this.destroyed = true;
        clean(this.state);
      }
      _cloneInto(to) {
        const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
        to || (to = new _Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
        to.state32.set(this.state32);
        to.pos = this.pos;
        to.posOut = this.posOut;
        to.finished = this.finished;
        to.rounds = rounds;
        to.suffix = suffix;
        to.outputLen = outputLen;
        to.enableXOF = enableXOF;
        to.destroyed = this.destroyed;
        return to;
      }
    };
    gen = (suffix, blockLen, outputLen) => createHasher(() => new Keccak(blockLen, suffix, outputLen));
    keccak_256 = /* @__PURE__ */ (() => gen(1, 136, 256 / 8))();
  }
});

// node_modules/viem/_esm/utils/hash/keccak256.js
function keccak256(value, to_) {
  const to = to_ || "hex";
  const bytes = keccak_256(isHex(value, { strict: false }) ? toBytes(value) : value);
  if (to === "bytes")
    return bytes;
  return toHex(bytes);
}
var init_keccak256 = __esm({
  "node_modules/viem/_esm/utils/hash/keccak256.js"() {
    init_browser_buffer_global();
    init_sha3();
    init_isHex();
    init_toBytes();
    init_toHex();
  }
});

// node_modules/viem/_esm/utils/lru.js
var LruMap;
var init_lru = __esm({
  "node_modules/viem/_esm/utils/lru.js"() {
    init_browser_buffer_global();
    LruMap = class extends Map {
      constructor(size4) {
        super();
        Object.defineProperty(this, "maxSize", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.maxSize = size4;
      }
      get(key) {
        const value = super.get(key);
        if (super.has(key)) {
          super.delete(key);
          super.set(key, value);
        }
        return value;
      }
      set(key, value) {
        if (super.has(key))
          super.delete(key);
        super.set(key, value);
        if (this.maxSize && this.size > this.maxSize) {
          const firstKey = super.keys().next().value;
          if (firstKey !== void 0)
            super.delete(firstKey);
        }
        return this;
      }
    };
  }
});

// node_modules/viem/_esm/utils/address/isAddress.js
function isAddress(address, options) {
  const { strict = true } = options ?? {};
  const cacheKey = `${address}.${strict}`;
  if (isAddressCache.has(cacheKey))
    return isAddressCache.get(cacheKey);
  const result = (() => {
    if (!addressRegex.test(address))
      return false;
    if (address.toLowerCase() === address)
      return true;
    if (strict)
      return checksumAddress(address) === address;
    return true;
  })();
  isAddressCache.set(cacheKey, result);
  return result;
}
var addressRegex, isAddressCache;
var init_isAddress = __esm({
  "node_modules/viem/_esm/utils/address/isAddress.js"() {
    init_browser_buffer_global();
    init_lru();
    init_getAddress();
    addressRegex = /^0x[a-fA-F0-9]{40}$/;
    isAddressCache = /* @__PURE__ */ new LruMap(8192);
  }
});

// node_modules/viem/_esm/utils/address/getAddress.js
function checksumAddress(address_, chainId) {
  if (checksumAddressCache.has(`${address_}.${chainId}`))
    return checksumAddressCache.get(`${address_}.${chainId}`);
  const hexAddress = chainId ? `${chainId}${address_.toLowerCase()}` : address_.substring(2).toLowerCase();
  const hash2 = keccak256(stringToBytes(hexAddress), "bytes");
  const address = (chainId ? hexAddress.substring(`${chainId}0x`.length) : hexAddress).split("");
  for (let i = 0; i < 40; i += 2) {
    if (hash2[i >> 1] >> 4 >= 8 && address[i]) {
      address[i] = address[i].toUpperCase();
    }
    if ((hash2[i >> 1] & 15) >= 8 && address[i + 1]) {
      address[i + 1] = address[i + 1].toUpperCase();
    }
  }
  const result = `0x${address.join("")}`;
  checksumAddressCache.set(`${address_}.${chainId}`, result);
  return result;
}
var checksumAddressCache;
var init_getAddress = __esm({
  "node_modules/viem/_esm/utils/address/getAddress.js"() {
    init_browser_buffer_global();
    init_address();
    init_toBytes();
    init_keccak256();
    init_lru();
    init_isAddress();
    checksumAddressCache = /* @__PURE__ */ new LruMap(8192);
  }
});

// node_modules/viem/_esm/utils/abi/formatAbiItem.js
function formatAbiItem2(abiItem, { includeName = false } = {}) {
  if (abiItem.type !== "function" && abiItem.type !== "event" && abiItem.type !== "error")
    throw new InvalidDefinitionTypeError(abiItem.type);
  return `${abiItem.name}(${formatAbiParams(abiItem.inputs, { includeName })})`;
}
function formatAbiParams(params, { includeName = false } = {}) {
  if (!params)
    return "";
  return params.map((param) => formatAbiParam(param, { includeName })).join(includeName ? ", " : ",");
}
function formatAbiParam(param, { includeName }) {
  if (param.type.startsWith("tuple")) {
    return `(${formatAbiParams(param.components, { includeName })})${param.type.slice("tuple".length)}`;
  }
  return param.type + (includeName && param.name ? ` ${param.name}` : "");
}
var init_formatAbiItem2 = __esm({
  "node_modules/viem/_esm/utils/abi/formatAbiItem.js"() {
    init_browser_buffer_global();
    init_abi();
  }
});

// node_modules/viem/_esm/errors/abi.js
var AbiDecodingDataSizeTooSmallError, AbiDecodingZeroDataError, AbiEncodingArrayLengthMismatchError, AbiEncodingBytesSizeMismatchError, AbiEncodingLengthMismatchError, AbiFunctionNotFoundError, AbiFunctionOutputsNotFoundError, AbiItemAmbiguityError, InvalidAbiEncodingTypeError, InvalidAbiDecodingTypeError, InvalidArrayError, InvalidDefinitionTypeError;
var init_abi = __esm({
  "node_modules/viem/_esm/errors/abi.js"() {
    init_browser_buffer_global();
    init_formatAbiItem2();
    init_size();
    init_base();
    AbiDecodingDataSizeTooSmallError = class extends BaseError2 {
      constructor({ data, params, size: size4 }) {
        super([`Data size of ${size4} bytes is too small for given parameters.`].join("\n"), {
          metaMessages: [
            `Params: (${formatAbiParams(params, { includeName: true })})`,
            `Data:   ${data} (${size4} bytes)`
          ],
          name: "AbiDecodingDataSizeTooSmallError"
        });
        Object.defineProperty(this, "data", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "params", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "size", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.data = data;
        this.params = params;
        this.size = size4;
      }
    };
    AbiDecodingZeroDataError = class extends BaseError2 {
      constructor({ cause } = {}) {
        super('Cannot decode zero data ("0x") with ABI parameters.', {
          name: "AbiDecodingZeroDataError",
          cause
        });
      }
    };
    AbiEncodingArrayLengthMismatchError = class extends BaseError2 {
      constructor({ expectedLength, givenLength, type }) {
        super([
          `ABI encoding array length mismatch for type ${type}.`,
          `Expected length: ${expectedLength}`,
          `Given length: ${givenLength}`
        ].join("\n"), { name: "AbiEncodingArrayLengthMismatchError" });
      }
    };
    AbiEncodingBytesSizeMismatchError = class extends BaseError2 {
      constructor({ expectedSize, value }) {
        super(`Size of bytes "${value}" (bytes${size(value)}) does not match expected size (bytes${expectedSize}).`, { name: "AbiEncodingBytesSizeMismatchError" });
      }
    };
    AbiEncodingLengthMismatchError = class extends BaseError2 {
      constructor({ expectedLength, givenLength }) {
        super([
          "ABI encoding params/values length mismatch.",
          `Expected length (params): ${expectedLength}`,
          `Given length (values): ${givenLength}`
        ].join("\n"), { name: "AbiEncodingLengthMismatchError" });
      }
    };
    AbiFunctionNotFoundError = class extends BaseError2 {
      constructor(functionName, { docsPath: docsPath3 } = {}) {
        super([
          `Function ${functionName ? `"${functionName}" ` : ""}not found on ABI.`,
          "Make sure you are using the correct ABI and that the function exists on it."
        ].join("\n"), {
          docsPath: docsPath3,
          name: "AbiFunctionNotFoundError"
        });
      }
    };
    AbiFunctionOutputsNotFoundError = class extends BaseError2 {
      constructor(functionName, { docsPath: docsPath3 }) {
        super([
          `Function "${functionName}" does not contain any \`outputs\` on ABI.`,
          "Cannot decode function result without knowing what the parameter types are.",
          "Make sure you are using the correct ABI and that the function exists on it."
        ].join("\n"), {
          docsPath: docsPath3,
          name: "AbiFunctionOutputsNotFoundError"
        });
      }
    };
    AbiItemAmbiguityError = class extends BaseError2 {
      constructor(x, y) {
        super("Found ambiguous types in overloaded ABI items.", {
          metaMessages: [
            `\`${x.type}\` in \`${formatAbiItem2(x.abiItem)}\`, and`,
            `\`${y.type}\` in \`${formatAbiItem2(y.abiItem)}\``,
            "",
            "These types encode differently and cannot be distinguished at runtime.",
            "Remove one of the ambiguous items in the ABI."
          ],
          name: "AbiItemAmbiguityError"
        });
      }
    };
    InvalidAbiEncodingTypeError = class extends BaseError2 {
      constructor(type, { docsPath: docsPath3 }) {
        super([
          `Type "${type}" is not a valid encoding type.`,
          "Please provide a valid ABI type."
        ].join("\n"), { docsPath: docsPath3, name: "InvalidAbiEncodingType" });
      }
    };
    InvalidAbiDecodingTypeError = class extends BaseError2 {
      constructor(type, { docsPath: docsPath3 }) {
        super([
          `Type "${type}" is not a valid decoding type.`,
          "Please provide a valid ABI type."
        ].join("\n"), { docsPath: docsPath3, name: "InvalidAbiDecodingType" });
      }
    };
    InvalidArrayError = class extends BaseError2 {
      constructor(value) {
        super([`Value "${value}" is not a valid array.`].join("\n"), {
          name: "InvalidArrayError"
        });
      }
    };
    InvalidDefinitionTypeError = class extends BaseError2 {
      constructor(type) {
        super([
          `"${type}" is not a valid definition type.`,
          'Valid types: "function", "event", "error"'
        ].join("\n"), { name: "InvalidDefinitionTypeError" });
      }
    };
  }
});

// node_modules/viem/_esm/errors/cursor.js
var NegativeOffsetError, PositionOutOfBoundsError, RecursiveReadLimitExceededError;
var init_cursor = __esm({
  "node_modules/viem/_esm/errors/cursor.js"() {
    init_browser_buffer_global();
    init_base();
    NegativeOffsetError = class extends BaseError2 {
      constructor({ offset }) {
        super(`Offset \`${offset}\` cannot be negative.`, {
          name: "NegativeOffsetError"
        });
      }
    };
    PositionOutOfBoundsError = class extends BaseError2 {
      constructor({ length, position }) {
        super(`Position \`${position}\` is out of bounds (\`0 < position < ${length}\`).`, { name: "PositionOutOfBoundsError" });
      }
    };
    RecursiveReadLimitExceededError = class extends BaseError2 {
      constructor({ count, limit }) {
        super(`Recursive read limit of \`${limit}\` exceeded (recursive read count: \`${count}\`).`, { name: "RecursiveReadLimitExceededError" });
      }
    };
  }
});

// node_modules/viem/_esm/utils/cursor.js
function createCursor(bytes, { recursiveReadLimit = 8192 } = {}) {
  const cursor = Object.create(staticCursor);
  cursor.bytes = bytes;
  cursor.dataView = new DataView(bytes.buffer ?? bytes, bytes.byteOffset, bytes.byteLength);
  cursor.positionReadCount = /* @__PURE__ */ new Map();
  cursor.recursiveReadLimit = recursiveReadLimit;
  return cursor;
}
var staticCursor;
var init_cursor2 = __esm({
  "node_modules/viem/_esm/utils/cursor.js"() {
    init_browser_buffer_global();
    init_cursor();
    staticCursor = {
      bytes: new Uint8Array(),
      dataView: new DataView(new ArrayBuffer(0)),
      position: 0,
      positionReadCount: /* @__PURE__ */ new Map(),
      recursiveReadCount: 0,
      recursiveReadLimit: Number.POSITIVE_INFINITY,
      assertReadLimit() {
        if (this.recursiveReadCount >= this.recursiveReadLimit)
          throw new RecursiveReadLimitExceededError({
            count: this.recursiveReadCount + 1,
            limit: this.recursiveReadLimit
          });
      },
      assertPosition(position) {
        if (position < 0 || position > this.bytes.length - 1)
          throw new PositionOutOfBoundsError({
            length: this.bytes.length,
            position
          });
      },
      decrementPosition(offset) {
        if (offset < 0)
          throw new NegativeOffsetError({ offset });
        const position = this.position - offset;
        this.assertPosition(position);
        this.position = position;
      },
      getReadCount(position) {
        return this.positionReadCount.get(position || this.position) || 0;
      },
      incrementPosition(offset) {
        if (offset < 0)
          throw new NegativeOffsetError({ offset });
        const position = this.position + offset;
        this.assertPosition(position);
        this.position = position;
      },
      inspectByte(position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position);
        return this.bytes[position];
      },
      inspectBytes(length, position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + length - 1);
        return this.bytes.subarray(position, position + length);
      },
      inspectUint8(position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position);
        return this.bytes[position];
      },
      inspectUint16(position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + 1);
        return this.dataView.getUint16(position);
      },
      inspectUint24(position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + 2);
        return (this.dataView.getUint16(position) << 8) + this.dataView.getUint8(position + 2);
      },
      inspectUint32(position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + 3);
        return this.dataView.getUint32(position);
      },
      pushByte(byte) {
        this.assertPosition(this.position);
        this.bytes[this.position] = byte;
        this.position++;
      },
      pushBytes(bytes) {
        this.assertPosition(this.position + bytes.length - 1);
        this.bytes.set(bytes, this.position);
        this.position += bytes.length;
      },
      pushUint8(value) {
        this.assertPosition(this.position);
        this.bytes[this.position] = value;
        this.position++;
      },
      pushUint16(value) {
        this.assertPosition(this.position + 1);
        this.dataView.setUint16(this.position, value);
        this.position += 2;
      },
      pushUint24(value) {
        this.assertPosition(this.position + 2);
        this.dataView.setUint16(this.position, value >> 8);
        this.dataView.setUint8(this.position + 2, value & ~4294967040);
        this.position += 3;
      },
      pushUint32(value) {
        this.assertPosition(this.position + 3);
        this.dataView.setUint32(this.position, value);
        this.position += 4;
      },
      readByte() {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectByte();
        this.position++;
        return value;
      },
      readBytes(length, size4) {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectBytes(length);
        this.position += size4 ?? length;
        return value;
      },
      readUint8() {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint8();
        this.position += 1;
        return value;
      },
      readUint16() {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint16();
        this.position += 2;
        return value;
      },
      readUint24() {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint24();
        this.position += 3;
        return value;
      },
      readUint32() {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint32();
        this.position += 4;
        return value;
      },
      get remaining() {
        return this.bytes.length - this.position;
      },
      setPosition(position) {
        const oldPosition = this.position;
        this.assertPosition(position);
        this.position = position;
        return () => this.position = oldPosition;
      },
      _touch() {
        if (this.recursiveReadLimit === Number.POSITIVE_INFINITY)
          return;
        const count = this.getReadCount();
        this.positionReadCount.set(this.position, count + 1);
        if (count > 0)
          this.recursiveReadCount++;
      }
    };
  }
});

// node_modules/viem/_esm/utils/data/slice.js
function slice(value, start, end, { strict } = {}) {
  if (isHex(value, { strict: false }))
    return sliceHex(value, start, end, {
      strict
    });
  return sliceBytes(value, start, end, {
    strict
  });
}
function assertStartOffset(value, start) {
  if (typeof start === "number" && start > 0 && start > size(value) - 1)
    throw new SliceOffsetOutOfBoundsError({
      offset: start,
      position: "start",
      size: size(value)
    });
}
function assertEndOffset(value, start, end) {
  if (typeof start === "number" && typeof end === "number" && size(value) !== end - start) {
    throw new SliceOffsetOutOfBoundsError({
      offset: end,
      position: "end",
      size: size(value)
    });
  }
}
function sliceBytes(value_, start, end, { strict } = {}) {
  assertStartOffset(value_, start);
  const value = value_.slice(start, end);
  if (strict)
    assertEndOffset(value, start, end);
  return value;
}
function sliceHex(value_, start, end, { strict } = {}) {
  assertStartOffset(value_, start);
  const value = `0x${value_.replace("0x", "").slice((start ?? 0) * 2, (end ?? value_.length) * 2)}`;
  if (strict)
    assertEndOffset(value, start, end);
  return value;
}
var init_slice = __esm({
  "node_modules/viem/_esm/utils/data/slice.js"() {
    init_browser_buffer_global();
    init_data();
    init_isHex();
    init_size();
  }
});

// node_modules/viem/_esm/utils/encoding/fromBytes.js
function bytesToBigInt(bytes, opts = {}) {
  if (typeof opts.size !== "undefined")
    assertSize(bytes, { size: opts.size });
  const hex = bytesToHex(bytes, opts);
  return hexToBigInt(hex, opts);
}
function bytesToBool(bytes_, opts = {}) {
  let bytes = bytes_;
  if (typeof opts.size !== "undefined") {
    assertSize(bytes, { size: opts.size });
    bytes = trim(bytes);
  }
  if (bytes.length > 1 || bytes[0] > 1)
    throw new InvalidBytesBooleanError(bytes);
  return Boolean(bytes[0]);
}
function bytesToNumber(bytes, opts = {}) {
  if (typeof opts.size !== "undefined")
    assertSize(bytes, { size: opts.size });
  const hex = bytesToHex(bytes, opts);
  return hexToNumber(hex, opts);
}
function bytesToString(bytes_, opts = {}) {
  let bytes = bytes_;
  if (typeof opts.size !== "undefined") {
    assertSize(bytes, { size: opts.size });
    bytes = trim(bytes, { dir: "right" });
  }
  return new TextDecoder().decode(bytes);
}
var init_fromBytes = __esm({
  "node_modules/viem/_esm/utils/encoding/fromBytes.js"() {
    init_browser_buffer_global();
    init_encoding();
    init_trim();
    init_fromHex();
    init_toHex();
  }
});

// node_modules/viem/_esm/utils/data/concat.js
function concat(values) {
  if (typeof values[0] === "string")
    return concatHex(values);
  return concatBytes(values);
}
function concatBytes(values) {
  let length = 0;
  for (const arr of values) {
    length += arr.length;
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const arr of values) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
function concatHex(values) {
  return `0x${values.reduce((acc, x) => acc + x.replace("0x", ""), "")}`;
}
var init_concat = __esm({
  "node_modules/viem/_esm/utils/data/concat.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/viem/_esm/utils/regex.js
var integerRegex2;
var init_regex2 = __esm({
  "node_modules/viem/_esm/utils/regex.js"() {
    init_browser_buffer_global();
    integerRegex2 = /^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
  }
});

// node_modules/viem/_esm/utils/abi/encodeAbiParameters.js
function encodeAbiParameters(params, values) {
  if (params.length !== values.length)
    throw new AbiEncodingLengthMismatchError({
      expectedLength: params.length,
      givenLength: values.length
    });
  const preparedParams = prepareParams({
    params,
    values
  });
  const data = encodeParams(preparedParams);
  if (data.length === 0)
    return "0x";
  return data;
}
function prepareParams({ params, values }) {
  const preparedParams = [];
  for (let i = 0; i < params.length; i++) {
    preparedParams.push(prepareParam({ param: params[i], value: values[i] }));
  }
  return preparedParams;
}
function prepareParam({ param, value }) {
  const arrayComponents = getArrayComponents(param.type);
  if (arrayComponents) {
    const [length, type] = arrayComponents;
    return encodeArray(value, { length, param: { ...param, type } });
  }
  if (param.type === "tuple") {
    return encodeTuple(value, {
      param
    });
  }
  if (param.type === "address") {
    return encodeAddress(value);
  }
  if (param.type === "bool") {
    return encodeBool(value);
  }
  if (param.type.startsWith("uint") || param.type.startsWith("int")) {
    const signed = param.type.startsWith("int");
    const [, , size4 = "256"] = integerRegex2.exec(param.type) ?? [];
    return encodeNumber(value, {
      signed,
      size: Number(size4)
    });
  }
  if (param.type.startsWith("bytes")) {
    return encodeBytes(value, { param });
  }
  if (param.type === "string") {
    return encodeString(value);
  }
  throw new InvalidAbiEncodingTypeError(param.type, {
    docsPath: "/docs/contract/encodeAbiParameters"
  });
}
function encodeParams(preparedParams) {
  let staticSize = 0;
  for (let i = 0; i < preparedParams.length; i++) {
    const { dynamic, encoded } = preparedParams[i];
    if (dynamic)
      staticSize += 32;
    else
      staticSize += size(encoded);
  }
  const staticParams = [];
  const dynamicParams = [];
  let dynamicSize = 0;
  for (let i = 0; i < preparedParams.length; i++) {
    const { dynamic, encoded } = preparedParams[i];
    if (dynamic) {
      staticParams.push(numberToHex(staticSize + dynamicSize, { size: 32 }));
      dynamicParams.push(encoded);
      dynamicSize += size(encoded);
    } else {
      staticParams.push(encoded);
    }
  }
  return concat([...staticParams, ...dynamicParams]);
}
function encodeAddress(value) {
  if (!isAddress(value))
    throw new InvalidAddressError({ address: value });
  return { dynamic: false, encoded: padHex(value.toLowerCase()) };
}
function encodeArray(value, { length, param }) {
  const dynamic = length === null;
  if (!Array.isArray(value))
    throw new InvalidArrayError(value);
  if (!dynamic && value.length !== length)
    throw new AbiEncodingArrayLengthMismatchError({
      expectedLength: length,
      givenLength: value.length,
      type: `${param.type}[${length}]`
    });
  let dynamicChild = false;
  const preparedParams = [];
  for (let i = 0; i < value.length; i++) {
    const preparedParam = prepareParam({ param, value: value[i] });
    if (preparedParam.dynamic)
      dynamicChild = true;
    preparedParams.push(preparedParam);
  }
  if (dynamic || dynamicChild) {
    const data = encodeParams(preparedParams);
    if (dynamic) {
      const length2 = numberToHex(preparedParams.length, { size: 32 });
      return {
        dynamic: true,
        encoded: preparedParams.length > 0 ? concat([length2, data]) : length2
      };
    }
    if (dynamicChild)
      return { dynamic: true, encoded: data };
  }
  return {
    dynamic: false,
    encoded: concat(preparedParams.map(({ encoded }) => encoded))
  };
}
function encodeBytes(value, { param }) {
  const [, paramSize] = param.type.split("bytes");
  const bytesSize = size(value);
  if (!paramSize) {
    let value_ = value;
    if (bytesSize % 32 !== 0)
      value_ = padHex(value_, {
        dir: "right",
        size: Math.ceil((value.length - 2) / 2 / 32) * 32
      });
    return {
      dynamic: true,
      encoded: concat([padHex(numberToHex(bytesSize, { size: 32 })), value_])
    };
  }
  if (bytesSize !== Number.parseInt(paramSize, 10))
    throw new AbiEncodingBytesSizeMismatchError({
      expectedSize: Number.parseInt(paramSize, 10),
      value
    });
  return { dynamic: false, encoded: padHex(value, { dir: "right" }) };
}
function encodeBool(value) {
  if (typeof value !== "boolean")
    throw new BaseError2(`Invalid boolean value: "${value}" (type: ${typeof value}). Expected: \`true\` or \`false\`.`);
  return { dynamic: false, encoded: padHex(boolToHex(value)) };
}
function encodeNumber(value, { signed, size: size4 = 256 }) {
  if (typeof size4 === "number") {
    const max = 2n ** (BigInt(size4) - (signed ? 1n : 0n)) - 1n;
    const min = signed ? -max - 1n : 0n;
    if (value > max || value < min)
      throw new IntegerOutOfRangeError({
        max: max.toString(),
        min: min.toString(),
        signed,
        size: size4 / 8,
        value: value.toString()
      });
  }
  return {
    dynamic: false,
    encoded: numberToHex(value, {
      size: 32,
      signed
    })
  };
}
function encodeString(value) {
  const hexValue = stringToHex(value);
  const partsLength = Math.ceil(size(hexValue) / 32);
  const parts = [];
  for (let i = 0; i < partsLength; i++) {
    parts.push(padHex(slice(hexValue, i * 32, (i + 1) * 32), {
      dir: "right"
    }));
  }
  return {
    dynamic: true,
    encoded: concat([
      padHex(numberToHex(size(hexValue), { size: 32 })),
      ...parts
    ])
  };
}
function encodeTuple(value, { param }) {
  let dynamic = false;
  const preparedParams = [];
  for (let i = 0; i < param.components.length; i++) {
    const param_ = param.components[i];
    const index = Array.isArray(value) ? i : param_.name;
    const preparedParam = prepareParam({
      param: param_,
      value: value[index]
    });
    preparedParams.push(preparedParam);
    if (preparedParam.dynamic)
      dynamic = true;
  }
  return {
    dynamic,
    encoded: dynamic ? encodeParams(preparedParams) : concat(preparedParams.map(({ encoded }) => encoded))
  };
}
function getArrayComponents(type) {
  const matches = type.match(/^(.*)\[(\d+)?\]$/);
  return matches ? (
    // Return `null` if the array is dynamic.
    [matches[2] ? Number(matches[2]) : null, matches[1]]
  ) : void 0;
}
var init_encodeAbiParameters = __esm({
  "node_modules/viem/_esm/utils/abi/encodeAbiParameters.js"() {
    init_browser_buffer_global();
    init_abi();
    init_address();
    init_base();
    init_encoding();
    init_isAddress();
    init_concat();
    init_pad();
    init_size();
    init_slice();
    init_toHex();
    init_regex2();
  }
});

// node_modules/viem/_esm/utils/abi/decodeAbiParameters.js
function decodeAbiParameters(params, data) {
  const bytes = typeof data === "string" ? hexToBytes(data) : data;
  const cursor = createCursor(bytes);
  if (size(bytes) === 0 && params.length > 0)
    throw new AbiDecodingZeroDataError();
  if (size(data) && size(data) < 32)
    throw new AbiDecodingDataSizeTooSmallError({
      data: typeof data === "string" ? data : bytesToHex(data),
      params,
      size: size(data)
    });
  let consumed = 0;
  const values = [];
  for (let i = 0; i < params.length; ++i) {
    const param = params[i];
    cursor.setPosition(consumed);
    const [data2, consumed_] = decodeParameter(cursor, param, {
      staticPosition: 0
    });
    consumed += consumed_;
    values.push(data2);
  }
  return values;
}
function decodeParameter(cursor, param, { staticPosition }) {
  const arrayComponents = getArrayComponents(param.type);
  if (arrayComponents) {
    const [length, type] = arrayComponents;
    return decodeArray(cursor, { ...param, type }, { length, staticPosition });
  }
  if (param.type === "tuple")
    return decodeTuple(cursor, param, { staticPosition });
  if (param.type === "address")
    return decodeAddress(cursor);
  if (param.type === "bool")
    return decodeBool(cursor);
  if (param.type.startsWith("bytes"))
    return decodeBytes(cursor, param, { staticPosition });
  if (param.type.startsWith("uint") || param.type.startsWith("int"))
    return decodeNumber(cursor, param);
  if (param.type === "string")
    return decodeString(cursor, { staticPosition });
  throw new InvalidAbiDecodingTypeError(param.type, {
    docsPath: "/docs/contract/decodeAbiParameters"
  });
}
function decodeAddress(cursor) {
  const value = cursor.readBytes(32);
  return [checksumAddress(bytesToHex(sliceBytes(value, -20))), 32];
}
function decodeArray(cursor, param, { length, staticPosition }) {
  if (!length) {
    const offset = bytesToNumber(cursor.readBytes(sizeOfOffset));
    const start = staticPosition + offset;
    const startOfData = start + sizeOfLength;
    cursor.setPosition(start);
    const length2 = bytesToNumber(cursor.readBytes(sizeOfLength));
    const dynamicChild = hasDynamicChild(param);
    let consumed2 = 0;
    const value2 = [];
    for (let i = 0; i < length2; ++i) {
      cursor.setPosition(startOfData + (dynamicChild ? i * 32 : consumed2));
      const [data, consumed_] = decodeParameter(cursor, param, {
        staticPosition: startOfData
      });
      consumed2 += consumed_;
      value2.push(data);
    }
    cursor.setPosition(staticPosition + 32);
    return [value2, 32];
  }
  if (hasDynamicChild(param)) {
    const offset = bytesToNumber(cursor.readBytes(sizeOfOffset));
    const start = staticPosition + offset;
    const value2 = [];
    for (let i = 0; i < length; ++i) {
      cursor.setPosition(start + i * 32);
      const [data] = decodeParameter(cursor, param, {
        staticPosition: start
      });
      value2.push(data);
    }
    cursor.setPosition(staticPosition + 32);
    return [value2, 32];
  }
  let consumed = 0;
  const value = [];
  for (let i = 0; i < length; ++i) {
    const [data, consumed_] = decodeParameter(cursor, param, {
      staticPosition: staticPosition + consumed
    });
    consumed += consumed_;
    value.push(data);
  }
  return [value, consumed];
}
function decodeBool(cursor) {
  return [bytesToBool(cursor.readBytes(32), { size: 32 }), 32];
}
function decodeBytes(cursor, param, { staticPosition }) {
  const [_, size4] = param.type.split("bytes");
  if (!size4) {
    const offset = bytesToNumber(cursor.readBytes(32));
    cursor.setPosition(staticPosition + offset);
    const length = bytesToNumber(cursor.readBytes(32));
    if (length === 0) {
      cursor.setPosition(staticPosition + 32);
      return ["0x", 32];
    }
    const data = cursor.readBytes(length);
    cursor.setPosition(staticPosition + 32);
    return [bytesToHex(data), 32];
  }
  const value = bytesToHex(cursor.readBytes(Number.parseInt(size4, 10), 32));
  return [value, 32];
}
function decodeNumber(cursor, param) {
  const signed = param.type.startsWith("int");
  const size4 = Number.parseInt(param.type.split("int")[1] || "256", 10);
  const value = cursor.readBytes(32);
  return [
    size4 > 48 ? bytesToBigInt(value, { signed }) : bytesToNumber(value, { signed }),
    32
  ];
}
function decodeTuple(cursor, param, { staticPosition }) {
  const hasUnnamedChild = param.components.length === 0 || param.components.some(({ name }) => !name);
  const value = hasUnnamedChild ? [] : {};
  let consumed = 0;
  if (hasDynamicChild(param)) {
    const offset = bytesToNumber(cursor.readBytes(sizeOfOffset));
    const start = staticPosition + offset;
    for (let i = 0; i < param.components.length; ++i) {
      const component = param.components[i];
      cursor.setPosition(start + consumed);
      const [data, consumed_] = decodeParameter(cursor, component, {
        staticPosition: start
      });
      consumed += consumed_;
      value[hasUnnamedChild ? i : component?.name] = data;
    }
    cursor.setPosition(staticPosition + 32);
    return [value, 32];
  }
  for (let i = 0; i < param.components.length; ++i) {
    const component = param.components[i];
    const [data, consumed_] = decodeParameter(cursor, component, {
      staticPosition
    });
    value[hasUnnamedChild ? i : component?.name] = data;
    consumed += consumed_;
  }
  return [value, consumed];
}
function decodeString(cursor, { staticPosition }) {
  const offset = bytesToNumber(cursor.readBytes(32));
  const start = staticPosition + offset;
  cursor.setPosition(start);
  const length = bytesToNumber(cursor.readBytes(32));
  if (length === 0) {
    cursor.setPosition(staticPosition + 32);
    return ["", 32];
  }
  const data = cursor.readBytes(length, 32);
  const value = bytesToString(trim(data));
  cursor.setPosition(staticPosition + 32);
  return [value, 32];
}
function hasDynamicChild(param) {
  const { type } = param;
  if (type === "string")
    return true;
  if (type === "bytes")
    return true;
  if (type.endsWith("[]"))
    return true;
  if (type === "tuple")
    return param.components?.some(hasDynamicChild);
  const arrayComponents = getArrayComponents(param.type);
  if (arrayComponents && hasDynamicChild({ ...param, type: arrayComponents[1] }))
    return true;
  return false;
}
var sizeOfLength, sizeOfOffset;
var init_decodeAbiParameters = __esm({
  "node_modules/viem/_esm/utils/abi/decodeAbiParameters.js"() {
    init_browser_buffer_global();
    init_abi();
    init_getAddress();
    init_cursor2();
    init_size();
    init_slice();
    init_trim();
    init_fromBytes();
    init_toBytes();
    init_toHex();
    init_encodeAbiParameters();
    sizeOfLength = 32;
    sizeOfOffset = 32;
  }
});

// node_modules/viem/_esm/constants/solidity.js
var init_solidity = __esm({
  "node_modules/viem/_esm/constants/solidity.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/viem/_esm/utils/hash/hashSignature.js
function hashSignature(sig) {
  return hash(sig);
}
var hash;
var init_hashSignature = __esm({
  "node_modules/viem/_esm/utils/hash/hashSignature.js"() {
    init_browser_buffer_global();
    init_toBytes();
    init_keccak256();
    hash = (value) => keccak256(toBytes(value));
  }
});

// node_modules/viem/_esm/utils/hash/normalizeSignature.js
function normalizeSignature(signature) {
  let active = true;
  let current = "";
  let level = 0;
  let result = "";
  let valid = false;
  for (let i = 0; i < signature.length; i++) {
    const char = signature[i];
    if (["(", ")", ","].includes(char))
      active = true;
    if (char === "(")
      level++;
    if (char === ")")
      level--;
    if (!active)
      continue;
    if (level === 0) {
      if (char === " " && ["event", "function", ""].includes(result))
        result = "";
      else {
        result += char;
        if (char === ")") {
          valid = true;
          break;
        }
      }
      continue;
    }
    if (char === " ") {
      if (signature[i - 1] !== "," && current !== "," && current !== ",(") {
        current = "";
        active = false;
      }
      continue;
    }
    result += char;
    current += char;
  }
  if (!valid)
    throw new BaseError2("Unable to normalize signature.");
  return result;
}
var init_normalizeSignature = __esm({
  "node_modules/viem/_esm/utils/hash/normalizeSignature.js"() {
    init_browser_buffer_global();
    init_base();
  }
});

// node_modules/viem/_esm/utils/hash/toSignature.js
var toSignature;
var init_toSignature = __esm({
  "node_modules/viem/_esm/utils/hash/toSignature.js"() {
    init_browser_buffer_global();
    init_exports();
    init_normalizeSignature();
    toSignature = (def) => {
      const def_ = (() => {
        if (typeof def === "string")
          return def;
        return formatAbiItem(def);
      })();
      return normalizeSignature(def_);
    };
  }
});

// node_modules/viem/_esm/utils/hash/toSignatureHash.js
function toSignatureHash(fn) {
  return hashSignature(toSignature(fn));
}
var init_toSignatureHash = __esm({
  "node_modules/viem/_esm/utils/hash/toSignatureHash.js"() {
    init_browser_buffer_global();
    init_hashSignature();
    init_toSignature();
  }
});

// node_modules/viem/_esm/utils/hash/toFunctionSelector.js
var toFunctionSelector;
var init_toFunctionSelector = __esm({
  "node_modules/viem/_esm/utils/hash/toFunctionSelector.js"() {
    init_browser_buffer_global();
    init_slice();
    init_toSignatureHash();
    toFunctionSelector = (fn) => slice(toSignatureHash(fn), 0, 4);
  }
});

// node_modules/viem/_esm/utils/abi/decodeErrorResult.js
var init_decodeErrorResult = __esm({
  "node_modules/viem/_esm/utils/abi/decodeErrorResult.js"() {
    init_browser_buffer_global();
    init_solidity();
    init_abi();
    init_slice();
    init_toFunctionSelector();
    init_decodeAbiParameters();
    init_formatAbiItem2();
  }
});

// node_modules/viem/_esm/utils/hash/toEventSelector.js
var toEventSelector;
var init_toEventSelector = __esm({
  "node_modules/viem/_esm/utils/hash/toEventSelector.js"() {
    init_browser_buffer_global();
    init_toSignatureHash();
    toEventSelector = toSignatureHash;
  }
});

// node_modules/viem/_esm/utils/abi/decodeFunctionData.js
var init_decodeFunctionData = __esm({
  "node_modules/viem/_esm/utils/abi/decodeFunctionData.js"() {
    init_browser_buffer_global();
    init_abi();
    init_slice();
    init_toFunctionSelector();
    init_decodeAbiParameters();
    init_formatAbiItem2();
  }
});

// node_modules/viem/_esm/utils/abi/getAbiItem.js
function getAbiItem(parameters) {
  const { abi, args = [], name } = parameters;
  const isSelector = isHex(name, { strict: false });
  const abiItems = abi.filter((abiItem) => {
    if (isSelector) {
      if (abiItem.type === "function")
        return toFunctionSelector(abiItem) === name;
      if (abiItem.type === "event")
        return toEventSelector(abiItem) === name;
      return false;
    }
    return "name" in abiItem && abiItem.name === name;
  });
  if (abiItems.length === 0)
    return void 0;
  if (abiItems.length === 1)
    return abiItems[0];
  let matchedAbiItem;
  for (const abiItem of abiItems) {
    if (!("inputs" in abiItem))
      continue;
    if (!args || args.length === 0) {
      if (!abiItem.inputs || abiItem.inputs.length === 0)
        return abiItem;
      continue;
    }
    if (!abiItem.inputs)
      continue;
    if (abiItem.inputs.length === 0)
      continue;
    if (abiItem.inputs.length !== args.length)
      continue;
    const matched = args.every((arg, index) => {
      const abiParameter = "inputs" in abiItem && abiItem.inputs[index];
      if (!abiParameter)
        return false;
      return isArgOfType(arg, abiParameter);
    });
    if (matched) {
      if (matchedAbiItem && "inputs" in matchedAbiItem && matchedAbiItem.inputs) {
        const ambiguousTypes = getAmbiguousTypes(abiItem.inputs, matchedAbiItem.inputs, args);
        if (ambiguousTypes)
          throw new AbiItemAmbiguityError({
            abiItem,
            type: ambiguousTypes[0]
          }, {
            abiItem: matchedAbiItem,
            type: ambiguousTypes[1]
          });
      }
      matchedAbiItem = abiItem;
    }
  }
  if (matchedAbiItem)
    return matchedAbiItem;
  return abiItems[0];
}
function isArgOfType(arg, abiParameter) {
  const argType = typeof arg;
  const abiParameterType = abiParameter.type;
  switch (abiParameterType) {
    case "address":
      return isAddress(arg, { strict: false });
    case "bool":
      return argType === "boolean";
    case "function":
      return argType === "string";
    case "string":
      return argType === "string";
    default: {
      if (abiParameterType === "tuple" && "components" in abiParameter)
        return Object.values(abiParameter.components).every((component, index) => {
          return argType === "object" && isArgOfType(Object.values(arg)[index], component);
        });
      if (/^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/.test(abiParameterType))
        return argType === "number" || argType === "bigint";
      if (/^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/.test(abiParameterType))
        return argType === "string" || arg instanceof Uint8Array;
      if (/[a-z]+[1-9]{0,3}(\[[0-9]{0,}\])+$/.test(abiParameterType)) {
        return Array.isArray(arg) && arg.every((x) => isArgOfType(x, {
          ...abiParameter,
          // Pop off `[]` or `[M]` from end of type
          type: abiParameterType.replace(/(\[[0-9]{0,}\])$/, "")
        }));
      }
      return false;
    }
  }
}
function getAmbiguousTypes(sourceParameters, targetParameters, args) {
  for (const parameterIndex in sourceParameters) {
    const sourceParameter = sourceParameters[parameterIndex];
    const targetParameter = targetParameters[parameterIndex];
    if (sourceParameter.type === "tuple" && targetParameter.type === "tuple" && "components" in sourceParameter && "components" in targetParameter)
      return getAmbiguousTypes(sourceParameter.components, targetParameter.components, args[parameterIndex]);
    const types = [sourceParameter.type, targetParameter.type];
    const ambiguous = (() => {
      if (types.includes("address") && types.includes("bytes20"))
        return true;
      if (types.includes("address") && types.includes("string"))
        return isAddress(args[parameterIndex], { strict: false });
      if (types.includes("address") && types.includes("bytes"))
        return isAddress(args[parameterIndex], { strict: false });
      return false;
    })();
    if (ambiguous)
      return types;
  }
  return;
}
var init_getAbiItem = __esm({
  "node_modules/viem/_esm/utils/abi/getAbiItem.js"() {
    init_browser_buffer_global();
    init_abi();
    init_isHex();
    init_isAddress();
    init_toEventSelector();
    init_toFunctionSelector();
  }
});

// node_modules/viem/_esm/utils/abi/decodeFunctionResult.js
function decodeFunctionResult(parameters) {
  const { abi, args, functionName, data } = parameters;
  let abiItem = abi[0];
  if (functionName) {
    const item = getAbiItem({ abi, args, name: functionName });
    if (!item)
      throw new AbiFunctionNotFoundError(functionName, { docsPath });
    abiItem = item;
  }
  if (abiItem.type !== "function")
    throw new AbiFunctionNotFoundError(void 0, { docsPath });
  if (!abiItem.outputs)
    throw new AbiFunctionOutputsNotFoundError(abiItem.name, { docsPath });
  const values = decodeAbiParameters(abiItem.outputs, data);
  if (values && values.length > 1)
    return values;
  if (values && values.length === 1)
    return values[0];
  return void 0;
}
var docsPath;
var init_decodeFunctionResult = __esm({
  "node_modules/viem/_esm/utils/abi/decodeFunctionResult.js"() {
    init_browser_buffer_global();
    init_abi();
    init_decodeAbiParameters();
    init_getAbiItem();
    docsPath = "/docs/contract/decodeFunctionResult";
  }
});

// node_modules/viem/_esm/utils/abi/encodeDeployData.js
var init_encodeDeployData = __esm({
  "node_modules/viem/_esm/utils/abi/encodeDeployData.js"() {
    init_browser_buffer_global();
    init_abi();
    init_concat();
    init_encodeAbiParameters();
  }
});

// node_modules/viem/_esm/utils/abi/encodeErrorResult.js
var init_encodeErrorResult = __esm({
  "node_modules/viem/_esm/utils/abi/encodeErrorResult.js"() {
    init_browser_buffer_global();
    init_abi();
    init_concat();
    init_toFunctionSelector();
    init_encodeAbiParameters();
    init_formatAbiItem2();
    init_getAbiItem();
  }
});

// node_modules/viem/_esm/utils/abi/prepareEncodeFunctionData.js
function prepareEncodeFunctionData(parameters) {
  const { abi, args, functionName } = parameters;
  let abiItem = abi[0];
  if (functionName) {
    const item = getAbiItem({
      abi,
      args,
      name: functionName
    });
    if (!item)
      throw new AbiFunctionNotFoundError(functionName, { docsPath: docsPath2 });
    abiItem = item;
  }
  if (abiItem.type !== "function")
    throw new AbiFunctionNotFoundError(void 0, { docsPath: docsPath2 });
  return {
    abi: [abiItem],
    functionName: toFunctionSelector(formatAbiItem2(abiItem))
  };
}
var docsPath2;
var init_prepareEncodeFunctionData = __esm({
  "node_modules/viem/_esm/utils/abi/prepareEncodeFunctionData.js"() {
    init_browser_buffer_global();
    init_abi();
    init_toFunctionSelector();
    init_formatAbiItem2();
    init_getAbiItem();
    docsPath2 = "/docs/contract/encodeFunctionData";
  }
});

// node_modules/viem/_esm/utils/abi/encodeFunctionData.js
function encodeFunctionData(parameters) {
  const { args } = parameters;
  const { abi, functionName } = (() => {
    if (parameters.abi.length === 1 && parameters.functionName?.startsWith("0x"))
      return parameters;
    return prepareEncodeFunctionData(parameters);
  })();
  const abiItem = abi[0];
  const signature = functionName;
  const data = "inputs" in abiItem && abiItem.inputs ? encodeAbiParameters(abiItem.inputs, args ?? []) : void 0;
  return concatHex([signature, data ?? "0x"]);
}
var init_encodeFunctionData = __esm({
  "node_modules/viem/_esm/utils/abi/encodeFunctionData.js"() {
    init_browser_buffer_global();
    init_concat();
    init_encodeAbiParameters();
    init_prepareEncodeFunctionData();
  }
});

// node_modules/viem/_esm/utils/abi/encodeFunctionResult.js
var init_encodeFunctionResult = __esm({
  "node_modules/viem/_esm/utils/abi/encodeFunctionResult.js"() {
    init_browser_buffer_global();
    init_abi();
    init_encodeAbiParameters();
    init_getAbiItem();
  }
});

// node_modules/viem/_esm/utils/stringify.js
var stringify;
var init_stringify = __esm({
  "node_modules/viem/_esm/utils/stringify.js"() {
    init_browser_buffer_global();
    stringify = (value, replacer, space) => JSON.stringify(value, (key, value_) => {
      const value2 = typeof value_ === "bigint" ? value_.toString() : value_;
      return typeof replacer === "function" ? replacer(key, value2) : value2;
    }, space);
  }
});

// node_modules/viem/_esm/utils/abi/formatAbiItemWithArgs.js
var init_formatAbiItemWithArgs = __esm({
  "node_modules/viem/_esm/utils/abi/formatAbiItemWithArgs.js"() {
    init_browser_buffer_global();
    init_stringify();
  }
});

// node_modules/viem/_esm/utils/address/isAddressEqual.js
var init_isAddressEqual = __esm({
  "node_modules/viem/_esm/utils/address/isAddressEqual.js"() {
    init_browser_buffer_global();
    init_address();
    init_isAddress();
  }
});

// node_modules/viem/_esm/constants/unit.js
var gweiUnits;
var init_unit = __esm({
  "node_modules/viem/_esm/constants/unit.js"() {
    init_browser_buffer_global();
    gweiUnits = {
      ether: -9,
      wei: 9
    };
  }
});

// node_modules/viem/_esm/utils/unit/formatUnits.js
function formatUnits(value, decimals) {
  let display = value.toString();
  const negative = display.startsWith("-");
  if (negative)
    display = display.slice(1);
  display = display.padStart(decimals, "0");
  let [integer, fraction] = [
    display.slice(0, display.length - decimals),
    display.slice(display.length - decimals)
  ];
  fraction = fraction.replace(/(0+)$/, "");
  return `${negative ? "-" : ""}${integer || "0"}${fraction ? `.${fraction}` : ""}`;
}
var init_formatUnits = __esm({
  "node_modules/viem/_esm/utils/unit/formatUnits.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/viem/_esm/utils/unit/formatEther.js
var init_formatEther = __esm({
  "node_modules/viem/_esm/utils/unit/formatEther.js"() {
    init_browser_buffer_global();
    init_unit();
    init_formatUnits();
  }
});

// node_modules/viem/_esm/utils/unit/formatGwei.js
function formatGwei(wei, unit = "wei") {
  return formatUnits(wei, gweiUnits[unit]);
}
var init_formatGwei = __esm({
  "node_modules/viem/_esm/utils/unit/formatGwei.js"() {
    init_browser_buffer_global();
    init_unit();
    init_formatUnits();
  }
});

// node_modules/viem/_esm/errors/transaction.js
var init_transaction = __esm({
  "node_modules/viem/_esm/errors/transaction.js"() {
    init_browser_buffer_global();
    init_formatEther();
    init_formatGwei();
    init_base();
  }
});

// node_modules/viem/node_modules/@noble/hashes/esm/_md.js
var init_md = __esm({
  "node_modules/viem/node_modules/@noble/hashes/esm/_md.js"() {
    init_browser_buffer_global();
    init_utils2();
  }
});

// node_modules/viem/node_modules/@noble/hashes/esm/sha2.js
var init_sha2 = __esm({
  "node_modules/viem/node_modules/@noble/hashes/esm/sha2.js"() {
    init_browser_buffer_global();
    init_md();
    init_u64();
    init_utils2();
  }
});

// node_modules/viem/_esm/constants/number.js
var maxInt8, maxInt16, maxInt24, maxInt32, maxInt40, maxInt48, maxInt56, maxInt64, maxInt72, maxInt80, maxInt88, maxInt96, maxInt104, maxInt112, maxInt120, maxInt128, maxInt136, maxInt144, maxInt152, maxInt160, maxInt168, maxInt176, maxInt184, maxInt192, maxInt200, maxInt208, maxInt216, maxInt224, maxInt232, maxInt240, maxInt248, maxInt256, minInt8, minInt16, minInt24, minInt32, minInt40, minInt48, minInt56, minInt64, minInt72, minInt80, minInt88, minInt96, minInt104, minInt112, minInt120, minInt128, minInt136, minInt144, minInt152, minInt160, minInt168, minInt176, minInt184, minInt192, minInt200, minInt208, minInt216, minInt224, minInt232, minInt240, minInt248, minInt256, maxUint8, maxUint16, maxUint24, maxUint32, maxUint40, maxUint48, maxUint56, maxUint64, maxUint72, maxUint80, maxUint88, maxUint96, maxUint104, maxUint112, maxUint120, maxUint128, maxUint136, maxUint144, maxUint152, maxUint160, maxUint168, maxUint176, maxUint184, maxUint192, maxUint200, maxUint208, maxUint216, maxUint224, maxUint232, maxUint240, maxUint248, maxUint256;
var init_number = __esm({
  "node_modules/viem/_esm/constants/number.js"() {
    init_browser_buffer_global();
    maxInt8 = 2n ** (8n - 1n) - 1n;
    maxInt16 = 2n ** (16n - 1n) - 1n;
    maxInt24 = 2n ** (24n - 1n) - 1n;
    maxInt32 = 2n ** (32n - 1n) - 1n;
    maxInt40 = 2n ** (40n - 1n) - 1n;
    maxInt48 = 2n ** (48n - 1n) - 1n;
    maxInt56 = 2n ** (56n - 1n) - 1n;
    maxInt64 = 2n ** (64n - 1n) - 1n;
    maxInt72 = 2n ** (72n - 1n) - 1n;
    maxInt80 = 2n ** (80n - 1n) - 1n;
    maxInt88 = 2n ** (88n - 1n) - 1n;
    maxInt96 = 2n ** (96n - 1n) - 1n;
    maxInt104 = 2n ** (104n - 1n) - 1n;
    maxInt112 = 2n ** (112n - 1n) - 1n;
    maxInt120 = 2n ** (120n - 1n) - 1n;
    maxInt128 = 2n ** (128n - 1n) - 1n;
    maxInt136 = 2n ** (136n - 1n) - 1n;
    maxInt144 = 2n ** (144n - 1n) - 1n;
    maxInt152 = 2n ** (152n - 1n) - 1n;
    maxInt160 = 2n ** (160n - 1n) - 1n;
    maxInt168 = 2n ** (168n - 1n) - 1n;
    maxInt176 = 2n ** (176n - 1n) - 1n;
    maxInt184 = 2n ** (184n - 1n) - 1n;
    maxInt192 = 2n ** (192n - 1n) - 1n;
    maxInt200 = 2n ** (200n - 1n) - 1n;
    maxInt208 = 2n ** (208n - 1n) - 1n;
    maxInt216 = 2n ** (216n - 1n) - 1n;
    maxInt224 = 2n ** (224n - 1n) - 1n;
    maxInt232 = 2n ** (232n - 1n) - 1n;
    maxInt240 = 2n ** (240n - 1n) - 1n;
    maxInt248 = 2n ** (248n - 1n) - 1n;
    maxInt256 = 2n ** (256n - 1n) - 1n;
    minInt8 = -(2n ** (8n - 1n));
    minInt16 = -(2n ** (16n - 1n));
    minInt24 = -(2n ** (24n - 1n));
    minInt32 = -(2n ** (32n - 1n));
    minInt40 = -(2n ** (40n - 1n));
    minInt48 = -(2n ** (48n - 1n));
    minInt56 = -(2n ** (56n - 1n));
    minInt64 = -(2n ** (64n - 1n));
    minInt72 = -(2n ** (72n - 1n));
    minInt80 = -(2n ** (80n - 1n));
    minInt88 = -(2n ** (88n - 1n));
    minInt96 = -(2n ** (96n - 1n));
    minInt104 = -(2n ** (104n - 1n));
    minInt112 = -(2n ** (112n - 1n));
    minInt120 = -(2n ** (120n - 1n));
    minInt128 = -(2n ** (128n - 1n));
    minInt136 = -(2n ** (136n - 1n));
    minInt144 = -(2n ** (144n - 1n));
    minInt152 = -(2n ** (152n - 1n));
    minInt160 = -(2n ** (160n - 1n));
    minInt168 = -(2n ** (168n - 1n));
    minInt176 = -(2n ** (176n - 1n));
    minInt184 = -(2n ** (184n - 1n));
    minInt192 = -(2n ** (192n - 1n));
    minInt200 = -(2n ** (200n - 1n));
    minInt208 = -(2n ** (208n - 1n));
    minInt216 = -(2n ** (216n - 1n));
    minInt224 = -(2n ** (224n - 1n));
    minInt232 = -(2n ** (232n - 1n));
    minInt240 = -(2n ** (240n - 1n));
    minInt248 = -(2n ** (248n - 1n));
    minInt256 = -(2n ** (256n - 1n));
    maxUint8 = 2n ** 8n - 1n;
    maxUint16 = 2n ** 16n - 1n;
    maxUint24 = 2n ** 24n - 1n;
    maxUint32 = 2n ** 32n - 1n;
    maxUint40 = 2n ** 40n - 1n;
    maxUint48 = 2n ** 48n - 1n;
    maxUint56 = 2n ** 56n - 1n;
    maxUint64 = 2n ** 64n - 1n;
    maxUint72 = 2n ** 72n - 1n;
    maxUint80 = 2n ** 80n - 1n;
    maxUint88 = 2n ** 88n - 1n;
    maxUint96 = 2n ** 96n - 1n;
    maxUint104 = 2n ** 104n - 1n;
    maxUint112 = 2n ** 112n - 1n;
    maxUint120 = 2n ** 120n - 1n;
    maxUint128 = 2n ** 128n - 1n;
    maxUint136 = 2n ** 136n - 1n;
    maxUint144 = 2n ** 144n - 1n;
    maxUint152 = 2n ** 152n - 1n;
    maxUint160 = 2n ** 160n - 1n;
    maxUint168 = 2n ** 168n - 1n;
    maxUint176 = 2n ** 176n - 1n;
    maxUint184 = 2n ** 184n - 1n;
    maxUint192 = 2n ** 192n - 1n;
    maxUint200 = 2n ** 200n - 1n;
    maxUint208 = 2n ** 208n - 1n;
    maxUint216 = 2n ** 216n - 1n;
    maxUint224 = 2n ** 224n - 1n;
    maxUint232 = 2n ** 232n - 1n;
    maxUint240 = 2n ** 240n - 1n;
    maxUint248 = 2n ** 248n - 1n;
    maxUint256 = 2n ** 256n - 1n;
  }
});

// node_modules/viem/_esm/errors/chain.js
var init_chain = __esm({
  "node_modules/viem/_esm/errors/chain.js"() {
    init_browser_buffer_global();
    init_base();
  }
});

// node_modules/viem/_esm/errors/node.js
var ExecutionRevertedError, FeeCapTooHighError, FeeCapTooLowError, NonceTooHighError, NonceTooLowError, NonceMaxValueError, InsufficientFundsError, IntrinsicGasTooHighError, IntrinsicGasTooLowError, TransactionTypeNotSupportedError, TipAboveFeeCapError;
var init_node = __esm({
  "node_modules/viem/_esm/errors/node.js"() {
    init_browser_buffer_global();
    init_formatGwei();
    init_base();
    ExecutionRevertedError = class extends BaseError2 {
      constructor({ cause, message } = {}) {
        const reason = message?.replace("execution reverted: ", "")?.replace("execution reverted", "");
        super(`Execution reverted ${reason ? `with reason: ${reason}` : "for an unknown reason"}.`, {
          cause,
          name: "ExecutionRevertedError"
        });
      }
    };
    Object.defineProperty(ExecutionRevertedError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 3
    });
    Object.defineProperty(ExecutionRevertedError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /execution reverted|gas required exceeds allowance/
    });
    FeeCapTooHighError = class extends BaseError2 {
      constructor({ cause, maxFeePerGas } = {}) {
        super(`The fee cap (\`maxFeePerGas\`${maxFeePerGas ? ` = ${formatGwei(maxFeePerGas)} gwei` : ""}) cannot be higher than the maximum allowed value (2^256-1).`, {
          cause,
          name: "FeeCapTooHighError"
        });
      }
    };
    Object.defineProperty(FeeCapTooHighError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /max fee per gas higher than 2\^256-1|fee cap higher than 2\^256-1/
    });
    FeeCapTooLowError = class extends BaseError2 {
      constructor({ cause, maxFeePerGas } = {}) {
        super(`The fee cap (\`maxFeePerGas\`${maxFeePerGas ? ` = ${formatGwei(maxFeePerGas)}` : ""} gwei) cannot be lower than the block base fee.`, {
          cause,
          name: "FeeCapTooLowError"
        });
      }
    };
    Object.defineProperty(FeeCapTooLowError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /max fee per gas less than block base fee|fee cap less than block base fee|transaction is outdated/
    });
    NonceTooHighError = class extends BaseError2 {
      constructor({ cause, nonce } = {}) {
        super(`Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ""}is higher than the next one expected.`, { cause, name: "NonceTooHighError" });
      }
    };
    Object.defineProperty(NonceTooHighError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /nonce too high/
    });
    NonceTooLowError = class extends BaseError2 {
      constructor({ cause, nonce } = {}) {
        super([
          `Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ""}is lower than the current nonce of the account.`,
          "Try increasing the nonce or find the latest nonce with `getTransactionCount`."
        ].join("\n"), { cause, name: "NonceTooLowError" });
      }
    };
    Object.defineProperty(NonceTooLowError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /nonce too low|transaction already imported|already known/
    });
    NonceMaxValueError = class extends BaseError2 {
      constructor({ cause, nonce } = {}) {
        super(`Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ""}exceeds the maximum allowed nonce.`, { cause, name: "NonceMaxValueError" });
      }
    };
    Object.defineProperty(NonceMaxValueError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /nonce has max value/
    });
    InsufficientFundsError = class extends BaseError2 {
      constructor({ cause } = {}) {
        super([
          "The total cost (gas * gas fee + value) of executing this transaction exceeds the balance of the account."
        ].join("\n"), {
          cause,
          metaMessages: [
            "This error could arise when the account does not have enough funds to:",
            " - pay for the total gas fee,",
            " - pay for the value to send.",
            " ",
            "The cost of the transaction is calculated as `gas * gas fee + value`, where:",
            " - `gas` is the amount of gas needed for transaction to execute,",
            " - `gas fee` is the gas fee,",
            " - `value` is the amount of ether to send to the recipient."
          ],
          name: "InsufficientFundsError"
        });
      }
    };
    Object.defineProperty(InsufficientFundsError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /insufficient funds|exceeds transaction sender account balance/
    });
    IntrinsicGasTooHighError = class extends BaseError2 {
      constructor({ cause, gas } = {}) {
        super(`The amount of gas ${gas ? `(${gas}) ` : ""}provided for the transaction exceeds the limit allowed for the block.`, {
          cause,
          name: "IntrinsicGasTooHighError"
        });
      }
    };
    Object.defineProperty(IntrinsicGasTooHighError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /intrinsic gas too high|gas limit reached/
    });
    IntrinsicGasTooLowError = class extends BaseError2 {
      constructor({ cause, gas } = {}) {
        super(`The amount of gas ${gas ? `(${gas}) ` : ""}provided for the transaction is too low.`, {
          cause,
          name: "IntrinsicGasTooLowError"
        });
      }
    };
    Object.defineProperty(IntrinsicGasTooLowError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /intrinsic gas too low/
    });
    TransactionTypeNotSupportedError = class extends BaseError2 {
      constructor({ cause }) {
        super("The transaction type is not supported for this chain.", {
          cause,
          name: "TransactionTypeNotSupportedError"
        });
      }
    };
    Object.defineProperty(TransactionTypeNotSupportedError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /transaction type not valid/
    });
    TipAboveFeeCapError = class extends BaseError2 {
      constructor({ cause, maxPriorityFeePerGas, maxFeePerGas } = {}) {
        super([
          `The provided tip (\`maxPriorityFeePerGas\`${maxPriorityFeePerGas ? ` = ${formatGwei(maxPriorityFeePerGas)} gwei` : ""}) cannot be higher than the fee cap (\`maxFeePerGas\`${maxFeePerGas ? ` = ${formatGwei(maxFeePerGas)} gwei` : ""}).`
        ].join("\n"), {
          cause,
          name: "TipAboveFeeCapError"
        });
      }
    };
    Object.defineProperty(TipAboveFeeCapError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /max priority fee per gas higher than max fee per gas|tip higher than fee cap/
    });
  }
});

// node_modules/viem/_esm/errors/utils.js
var getUrl;
var init_utils3 = __esm({
  "node_modules/viem/_esm/errors/utils.js"() {
    init_browser_buffer_global();
    getUrl = (url) => {
      try {
        const parsed = new URL(url);
        if (!parsed.username && !parsed.password)
          return url;
        parsed.username = "";
        parsed.password = "";
        return parsed.toString();
      } catch {
        return url;
      }
    };
  }
});

// node_modules/viem/_esm/errors/request.js
var RpcRequestError;
var init_request = __esm({
  "node_modules/viem/_esm/errors/request.js"() {
    init_browser_buffer_global();
    init_stringify();
    init_base();
    init_utils3();
    RpcRequestError = class extends BaseError2 {
      constructor({ body, error, url }) {
        super("RPC Request failed.", {
          cause: error,
          details: error.message,
          metaMessages: [`URL: ${getUrl(url)}`, `Request body: ${stringify(body)}`],
          name: "RpcRequestError"
        });
        Object.defineProperty(this, "code", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "data", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "url", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.code = error.code;
        this.data = error.data;
        this.url = url;
      }
    };
  }
});

// node_modules/viem/_esm/errors/rpc.js
var unknownErrorCode, RpcError, ProviderRpcError, ParseRpcError, InvalidRequestRpcError, MethodNotFoundRpcError, InvalidParamsRpcError, InternalRpcError, InvalidInputRpcError, ResourceNotFoundRpcError, ResourceUnavailableRpcError, TransactionRejectedRpcError, MethodNotSupportedRpcError, LimitExceededRpcError, JsonRpcVersionUnsupportedError, UserRejectedRequestError, UnauthorizedProviderError, UnsupportedProviderMethodError, ProviderDisconnectedError, ChainDisconnectedError, SwitchChainError, UnsupportedNonOptionalCapabilityError, UnsupportedChainIdError, DuplicateIdError, UnknownBundleIdError, BundleTooLargeError, AtomicReadyWalletRejectedUpgradeError, AtomicityNotSupportedError, WalletConnectSessionSettlementError;
var init_rpc = __esm({
  "node_modules/viem/_esm/errors/rpc.js"() {
    init_browser_buffer_global();
    init_base();
    init_request();
    unknownErrorCode = -1;
    RpcError = class extends BaseError2 {
      constructor(cause, { code, docsPath: docsPath3, metaMessages, name, shortMessage }) {
        super(shortMessage, {
          cause,
          docsPath: docsPath3,
          metaMessages: metaMessages || cause?.metaMessages,
          name: name || "RpcError"
        });
        Object.defineProperty(this, "code", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.name = name || cause.name;
        this.code = cause instanceof RpcRequestError ? cause.code : code ?? unknownErrorCode;
      }
    };
    ProviderRpcError = class extends RpcError {
      constructor(cause, options) {
        super(cause, options);
        Object.defineProperty(this, "data", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.data = options.data;
      }
    };
    ParseRpcError = class _ParseRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _ParseRpcError.code,
          name: "ParseRpcError",
          shortMessage: "Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text."
        });
      }
    };
    Object.defineProperty(ParseRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32700
    });
    InvalidRequestRpcError = class _InvalidRequestRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _InvalidRequestRpcError.code,
          name: "InvalidRequestRpcError",
          shortMessage: "JSON is not a valid request object."
        });
      }
    };
    Object.defineProperty(InvalidRequestRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32600
    });
    MethodNotFoundRpcError = class _MethodNotFoundRpcError extends RpcError {
      constructor(cause, { method } = {}) {
        super(cause, {
          code: _MethodNotFoundRpcError.code,
          name: "MethodNotFoundRpcError",
          shortMessage: `The method${method ? ` "${method}"` : ""} does not exist / is not available.`
        });
      }
    };
    Object.defineProperty(MethodNotFoundRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32601
    });
    InvalidParamsRpcError = class _InvalidParamsRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _InvalidParamsRpcError.code,
          name: "InvalidParamsRpcError",
          shortMessage: [
            "Invalid parameters were provided to the RPC method.",
            "Double check you have provided the correct parameters."
          ].join("\n")
        });
      }
    };
    Object.defineProperty(InvalidParamsRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32602
    });
    InternalRpcError = class _InternalRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _InternalRpcError.code,
          name: "InternalRpcError",
          shortMessage: "An internal error was received."
        });
      }
    };
    Object.defineProperty(InternalRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32603
    });
    InvalidInputRpcError = class _InvalidInputRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _InvalidInputRpcError.code,
          name: "InvalidInputRpcError",
          shortMessage: [
            "Missing or invalid parameters.",
            "Double check you have provided the correct parameters."
          ].join("\n")
        });
      }
    };
    Object.defineProperty(InvalidInputRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32e3
    });
    ResourceNotFoundRpcError = class _ResourceNotFoundRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _ResourceNotFoundRpcError.code,
          name: "ResourceNotFoundRpcError",
          shortMessage: "Requested resource not found."
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "ResourceNotFoundRpcError"
        });
      }
    };
    Object.defineProperty(ResourceNotFoundRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32001
    });
    ResourceUnavailableRpcError = class _ResourceUnavailableRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _ResourceUnavailableRpcError.code,
          name: "ResourceUnavailableRpcError",
          shortMessage: "Requested resource not available."
        });
      }
    };
    Object.defineProperty(ResourceUnavailableRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32002
    });
    TransactionRejectedRpcError = class _TransactionRejectedRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _TransactionRejectedRpcError.code,
          name: "TransactionRejectedRpcError",
          shortMessage: "Transaction creation failed."
        });
      }
    };
    Object.defineProperty(TransactionRejectedRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32003
    });
    MethodNotSupportedRpcError = class _MethodNotSupportedRpcError extends RpcError {
      constructor(cause, { method } = {}) {
        super(cause, {
          code: _MethodNotSupportedRpcError.code,
          name: "MethodNotSupportedRpcError",
          shortMessage: `Method${method ? ` "${method}"` : ""} is not supported.`
        });
      }
    };
    Object.defineProperty(MethodNotSupportedRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32004
    });
    LimitExceededRpcError = class _LimitExceededRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _LimitExceededRpcError.code,
          name: "LimitExceededRpcError",
          shortMessage: "Request exceeds defined limit."
        });
      }
    };
    Object.defineProperty(LimitExceededRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32005
    });
    JsonRpcVersionUnsupportedError = class _JsonRpcVersionUnsupportedError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _JsonRpcVersionUnsupportedError.code,
          name: "JsonRpcVersionUnsupportedError",
          shortMessage: "Version of JSON-RPC protocol is not supported."
        });
      }
    };
    Object.defineProperty(JsonRpcVersionUnsupportedError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32006
    });
    UserRejectedRequestError = class _UserRejectedRequestError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _UserRejectedRequestError.code,
          name: "UserRejectedRequestError",
          shortMessage: "User rejected the request."
        });
      }
    };
    Object.defineProperty(UserRejectedRequestError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 4001
    });
    UnauthorizedProviderError = class _UnauthorizedProviderError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _UnauthorizedProviderError.code,
          name: "UnauthorizedProviderError",
          shortMessage: "The requested method and/or account has not been authorized by the user."
        });
      }
    };
    Object.defineProperty(UnauthorizedProviderError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 4100
    });
    UnsupportedProviderMethodError = class _UnsupportedProviderMethodError extends ProviderRpcError {
      constructor(cause, { method } = {}) {
        super(cause, {
          code: _UnsupportedProviderMethodError.code,
          name: "UnsupportedProviderMethodError",
          shortMessage: `The Provider does not support the requested method${method ? ` " ${method}"` : ""}.`
        });
      }
    };
    Object.defineProperty(UnsupportedProviderMethodError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 4200
    });
    ProviderDisconnectedError = class _ProviderDisconnectedError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _ProviderDisconnectedError.code,
          name: "ProviderDisconnectedError",
          shortMessage: "The Provider is disconnected from all chains."
        });
      }
    };
    Object.defineProperty(ProviderDisconnectedError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 4900
    });
    ChainDisconnectedError = class _ChainDisconnectedError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _ChainDisconnectedError.code,
          name: "ChainDisconnectedError",
          shortMessage: "The Provider is not connected to the requested chain."
        });
      }
    };
    Object.defineProperty(ChainDisconnectedError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 4901
    });
    SwitchChainError = class _SwitchChainError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _SwitchChainError.code,
          name: "SwitchChainError",
          shortMessage: "An error occurred when attempting to switch chain."
        });
      }
    };
    Object.defineProperty(SwitchChainError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 4902
    });
    UnsupportedNonOptionalCapabilityError = class _UnsupportedNonOptionalCapabilityError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _UnsupportedNonOptionalCapabilityError.code,
          name: "UnsupportedNonOptionalCapabilityError",
          shortMessage: "This Wallet does not support a capability that was not marked as optional."
        });
      }
    };
    Object.defineProperty(UnsupportedNonOptionalCapabilityError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 5700
    });
    UnsupportedChainIdError = class _UnsupportedChainIdError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _UnsupportedChainIdError.code,
          name: "UnsupportedChainIdError",
          shortMessage: "This Wallet does not support the requested chain ID."
        });
      }
    };
    Object.defineProperty(UnsupportedChainIdError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 5710
    });
    DuplicateIdError = class _DuplicateIdError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _DuplicateIdError.code,
          name: "DuplicateIdError",
          shortMessage: "There is already a bundle submitted with this ID."
        });
      }
    };
    Object.defineProperty(DuplicateIdError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 5720
    });
    UnknownBundleIdError = class _UnknownBundleIdError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _UnknownBundleIdError.code,
          name: "UnknownBundleIdError",
          shortMessage: "This bundle id is unknown / has not been submitted"
        });
      }
    };
    Object.defineProperty(UnknownBundleIdError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 5730
    });
    BundleTooLargeError = class _BundleTooLargeError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _BundleTooLargeError.code,
          name: "BundleTooLargeError",
          shortMessage: "The call bundle is too large for the Wallet to process."
        });
      }
    };
    Object.defineProperty(BundleTooLargeError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 5740
    });
    AtomicReadyWalletRejectedUpgradeError = class _AtomicReadyWalletRejectedUpgradeError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _AtomicReadyWalletRejectedUpgradeError.code,
          name: "AtomicReadyWalletRejectedUpgradeError",
          shortMessage: "The Wallet can support atomicity after an upgrade, but the user rejected the upgrade."
        });
      }
    };
    Object.defineProperty(AtomicReadyWalletRejectedUpgradeError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 5750
    });
    AtomicityNotSupportedError = class _AtomicityNotSupportedError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _AtomicityNotSupportedError.code,
          name: "AtomicityNotSupportedError",
          shortMessage: "The wallet does not support atomic execution but the request requires it."
        });
      }
    };
    Object.defineProperty(AtomicityNotSupportedError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 5760
    });
    WalletConnectSessionSettlementError = class _WalletConnectSessionSettlementError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _WalletConnectSessionSettlementError.code,
          name: "WalletConnectSessionSettlementError",
          shortMessage: "WalletConnect session settlement failed."
        });
      }
    };
    Object.defineProperty(WalletConnectSessionSettlementError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 7e3
    });
  }
});

// node_modules/ox/node_modules/@noble/curves/esm/abstract/utils.js
function isBytes3(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes2(item) {
  if (!isBytes3(item))
    throw new Error("Uint8Array expected");
}
function abool(title, value) {
  if (typeof value !== "boolean")
    throw new Error(title + " boolean expected, got " + value);
}
function numberToHexUnpadded(num) {
  const hex = num.toString(16);
  return hex.length & 1 ? "0" + hex : hex;
}
function hexToNumber2(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  return hex === "" ? _0n2 : BigInt("0x" + hex);
}
function bytesToHex2(bytes) {
  abytes2(bytes);
  if (hasHexBuiltin)
    return bytes.toHex();
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += hexes2[bytes[i]];
  }
  return hex;
}
function asciiToBase16(ch) {
  if (ch >= asciis._0 && ch <= asciis._9)
    return ch - asciis._0;
  if (ch >= asciis.A && ch <= asciis.F)
    return ch - (asciis.A - 10);
  if (ch >= asciis.a && ch <= asciis.f)
    return ch - (asciis.a - 10);
  return;
}
function hexToBytes2(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  if (hasHexBuiltin)
    return Uint8Array.fromHex(hex);
  const hl = hex.length;
  const al = hl / 2;
  if (hl % 2)
    throw new Error("hex string expected, got unpadded hex of length " + hl);
  const array = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex.charCodeAt(hi));
    const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0) {
      const char = hex[hi] + hex[hi + 1];
      throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array[ai] = n1 * 16 + n2;
  }
  return array;
}
function bytesToNumberBE(bytes) {
  return hexToNumber2(bytesToHex2(bytes));
}
function bytesToNumberLE(bytes) {
  abytes2(bytes);
  return hexToNumber2(bytesToHex2(Uint8Array.from(bytes).reverse()));
}
function numberToBytesBE(n, len) {
  return hexToBytes2(n.toString(16).padStart(len * 2, "0"));
}
function numberToBytesLE(n, len) {
  return numberToBytesBE(n, len).reverse();
}
function ensureBytes(title, hex, expectedLength) {
  let res;
  if (typeof hex === "string") {
    try {
      res = hexToBytes2(hex);
    } catch (e) {
      throw new Error(title + " must be hex string or Uint8Array, cause: " + e);
    }
  } else if (isBytes3(hex)) {
    res = Uint8Array.from(hex);
  } else {
    throw new Error(title + " must be hex string or Uint8Array");
  }
  const len = res.length;
  if (typeof expectedLength === "number" && len !== expectedLength)
    throw new Error(title + " of length " + expectedLength + " expected, got " + len);
  return res;
}
function concatBytes2(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    abytes2(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad4 = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad4);
    pad4 += a.length;
  }
  return res;
}
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new Error("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  let len;
  for (len = 0; n > _0n2; n >>= _1n2, len += 1)
    ;
  return len;
}
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
  if (typeof hashLen !== "number" || hashLen < 2)
    throw new Error("hashLen must be a number");
  if (typeof qByteLen !== "number" || qByteLen < 2)
    throw new Error("qByteLen must be a number");
  if (typeof hmacFn !== "function")
    throw new Error("hmacFn must be a function");
  let v = u8n(hashLen);
  let k = u8n(hashLen);
  let i = 0;
  const reset = () => {
    v.fill(1);
    k.fill(0);
    i = 0;
  };
  const h = (...b) => hmacFn(k, v, ...b);
  const reseed = (seed = u8n(0)) => {
    k = h(u8fr([0]), seed);
    v = h();
    if (seed.length === 0)
      return;
    k = h(u8fr([1]), seed);
    v = h();
  };
  const gen3 = () => {
    if (i++ >= 1e3)
      throw new Error("drbg: tried 1000 values");
    let len = 0;
    const out = [];
    while (len < qByteLen) {
      v = h();
      const sl = v.slice();
      out.push(sl);
      len += v.length;
    }
    return concatBytes2(...out);
  };
  const genUntil = (seed, pred) => {
    reset();
    reseed(seed);
    let res = void 0;
    while (!(res = pred(gen3())))
      reseed();
    reset();
    return res;
  };
  return genUntil;
}
function validateObject(object, validators, optValidators = {}) {
  const checkField = (fieldName, type, isOptional) => {
    const checkVal = validatorFns[type];
    if (typeof checkVal !== "function")
      throw new Error("invalid validator function");
    const val = object[fieldName];
    if (isOptional && val === void 0)
      return;
    if (!checkVal(val, object)) {
      throw new Error("param " + String(fieldName) + " is invalid. Expected " + type + ", got " + val);
    }
  };
  for (const [fieldName, type] of Object.entries(validators))
    checkField(fieldName, type, false);
  for (const [fieldName, type] of Object.entries(optValidators))
    checkField(fieldName, type, true);
  return object;
}
function memoized(fn) {
  const map = /* @__PURE__ */ new WeakMap();
  return (arg, ...args) => {
    const val = map.get(arg);
    if (val !== void 0)
      return val;
    const computed = fn(arg, ...args);
    map.set(arg, computed);
    return computed;
  };
}
var _0n2, _1n2, hasHexBuiltin, hexes2, asciis, isPosBig, bitMask, u8n, u8fr, validatorFns;
var init_utils4 = __esm({
  "node_modules/ox/node_modules/@noble/curves/esm/abstract/utils.js"() {
    init_browser_buffer_global();
    _0n2 = /* @__PURE__ */ BigInt(0);
    _1n2 = /* @__PURE__ */ BigInt(1);
    hasHexBuiltin = // @ts-ignore
    typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function";
    hexes2 = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
    asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
    isPosBig = (n) => typeof n === "bigint" && _0n2 <= n;
    bitMask = (n) => (_1n2 << BigInt(n)) - _1n2;
    u8n = (len) => new Uint8Array(len);
    u8fr = (arr) => Uint8Array.from(arr);
    validatorFns = {
      bigint: (val) => typeof val === "bigint",
      function: (val) => typeof val === "function",
      boolean: (val) => typeof val === "boolean",
      string: (val) => typeof val === "string",
      stringOrUint8Array: (val) => typeof val === "string" || isBytes3(val),
      isSafeInteger: (val) => Number.isSafeInteger(val),
      array: (val) => Array.isArray(val),
      field: (val, object) => object.Fp.isValid(val),
      hash: (val) => typeof val === "function" && Number.isSafeInteger(val.outputLen)
    };
  }
});

// node_modules/ox/_esm/core/version.js
var version3;
var init_version3 = __esm({
  "node_modules/ox/_esm/core/version.js"() {
    init_browser_buffer_global();
    version3 = "0.1.1";
  }
});

// node_modules/ox/_esm/core/internal/errors.js
function getVersion() {
  return version3;
}
var init_errors2 = __esm({
  "node_modules/ox/_esm/core/internal/errors.js"() {
    init_browser_buffer_global();
    init_version3();
  }
});

// node_modules/ox/_esm/core/Errors.js
function walk2(err, fn) {
  if (fn?.(err))
    return err;
  if (err && typeof err === "object" && "cause" in err && err.cause)
    return walk2(err.cause, fn);
  return fn ? null : err;
}
var BaseError3;
var init_Errors = __esm({
  "node_modules/ox/_esm/core/Errors.js"() {
    init_browser_buffer_global();
    init_errors2();
    BaseError3 = class _BaseError extends Error {
      static setStaticOptions(options) {
        _BaseError.prototype.docsOrigin = options.docsOrigin;
        _BaseError.prototype.showVersion = options.showVersion;
        _BaseError.prototype.version = options.version;
      }
      constructor(shortMessage, options = {}) {
        const details = (() => {
          if (options.cause instanceof _BaseError) {
            if (options.cause.details)
              return options.cause.details;
            if (options.cause.shortMessage)
              return options.cause.shortMessage;
          }
          if (options.cause && "details" in options.cause && typeof options.cause.details === "string")
            return options.cause.details;
          if (options.cause?.message)
            return options.cause.message;
          return options.details;
        })();
        const docsPath3 = (() => {
          if (options.cause instanceof _BaseError)
            return options.cause.docsPath || options.docsPath;
          return options.docsPath;
        })();
        const docsBaseUrl = options.docsOrigin ?? _BaseError.prototype.docsOrigin;
        const docs = `${docsBaseUrl}${docsPath3 ?? ""}`;
        const showVersion = Boolean(options.version ?? _BaseError.prototype.showVersion);
        const version5 = options.version ?? _BaseError.prototype.version;
        const message = [
          shortMessage || "An error occurred.",
          ...options.metaMessages ? ["", ...options.metaMessages] : [],
          ...details || docsPath3 || showVersion ? [
            "",
            details ? `Details: ${details}` : void 0,
            docsPath3 ? `See: ${docs}` : void 0,
            showVersion ? `Version: ${version5}` : void 0
          ] : []
        ].filter((x) => typeof x === "string").join("\n");
        super(message, options.cause ? { cause: options.cause } : void 0);
        Object.defineProperty(this, "details", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "docs", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "docsOrigin", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "docsPath", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "shortMessage", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "showVersion", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "version", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "cause", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "BaseError"
        });
        this.cause = options.cause;
        this.details = details;
        this.docs = docs;
        this.docsOrigin = docsBaseUrl;
        this.docsPath = docsPath3;
        this.shortMessage = shortMessage;
        this.showVersion = showVersion;
        this.version = version5;
      }
      walk(fn) {
        return walk2(this, fn);
      }
    };
    Object.defineProperty(BaseError3, "defaultStaticOptions", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: {
        docsOrigin: "https://oxlib.sh",
        showVersion: false,
        version: `ox@${getVersion()}`
      }
    });
    (() => {
      BaseError3.setStaticOptions(BaseError3.defaultStaticOptions);
    })();
  }
});

// node_modules/ox/_esm/core/internal/bytes.js
function assertSize2(bytes, size_) {
  if (size2(bytes) > size_)
    throw new SizeOverflowError2({
      givenSize: size2(bytes),
      maxSize: size_
    });
}
function charCodeToBase162(char) {
  if (char >= charCodeMap2.zero && char <= charCodeMap2.nine)
    return char - charCodeMap2.zero;
  if (char >= charCodeMap2.A && char <= charCodeMap2.F)
    return char - (charCodeMap2.A - 10);
  if (char >= charCodeMap2.a && char <= charCodeMap2.f)
    return char - (charCodeMap2.a - 10);
  return void 0;
}
function pad2(bytes, options = {}) {
  const { dir, size: size4 = 32 } = options;
  if (size4 === 0)
    return bytes;
  if (bytes.length > size4)
    throw new SizeExceedsPaddingSizeError2({
      size: bytes.length,
      targetSize: size4,
      type: "Bytes"
    });
  const paddedBytes = new Uint8Array(size4);
  for (let i = 0; i < size4; i++) {
    const padEnd = dir === "right";
    paddedBytes[padEnd ? i : size4 - i - 1] = bytes[padEnd ? i : bytes.length - i - 1];
  }
  return paddedBytes;
}
var charCodeMap2;
var init_bytes = __esm({
  "node_modules/ox/_esm/core/internal/bytes.js"() {
    init_browser_buffer_global();
    init_Bytes();
    charCodeMap2 = {
      zero: 48,
      nine: 57,
      A: 65,
      F: 70,
      a: 97,
      f: 102
    };
  }
});

// node_modules/ox/_esm/core/internal/hex.js
function assertSize3(hex, size_) {
  if (size3(hex) > size_)
    throw new SizeOverflowError3({
      givenSize: size3(hex),
      maxSize: size_
    });
}
function pad3(hex_, options = {}) {
  const { dir, size: size4 = 32 } = options;
  if (size4 === 0)
    return hex_;
  const hex = hex_.replace("0x", "");
  if (hex.length > size4 * 2)
    throw new SizeExceedsPaddingSizeError3({
      size: Math.ceil(hex.length / 2),
      targetSize: size4,
      type: "Hex"
    });
  return `0x${hex[dir === "right" ? "padEnd" : "padStart"](size4 * 2, "0")}`;
}
var init_hex = __esm({
  "node_modules/ox/_esm/core/internal/hex.js"() {
    init_browser_buffer_global();
    init_Hex();
  }
});

// node_modules/ox/_esm/core/Json.js
var init_Json = __esm({
  "node_modules/ox/_esm/core/Json.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/ox/_esm/core/Bytes.js
function from(value) {
  if (value instanceof Uint8Array)
    return value;
  if (typeof value === "string")
    return fromHex(value);
  return fromArray(value);
}
function fromArray(value) {
  return value instanceof Uint8Array ? value : new Uint8Array(value);
}
function fromHex(value, options = {}) {
  const { size: size4 } = options;
  let hex = value;
  if (size4) {
    assertSize3(value, size4);
    hex = padRight(value, size4);
  }
  let hexString = hex.slice(2);
  if (hexString.length % 2)
    hexString = `0${hexString}`;
  const length = hexString.length / 2;
  const bytes = new Uint8Array(length);
  for (let index = 0, j = 0; index < length; index++) {
    const nibbleLeft = charCodeToBase162(hexString.charCodeAt(j++));
    const nibbleRight = charCodeToBase162(hexString.charCodeAt(j++));
    if (nibbleLeft === void 0 || nibbleRight === void 0) {
      throw new BaseError3(`Invalid byte sequence ("${hexString[j - 2]}${hexString[j - 1]}" in "${hexString}").`);
    }
    bytes[index] = nibbleLeft << 4 | nibbleRight;
  }
  return bytes;
}
function fromString(value, options = {}) {
  const { size: size4 } = options;
  const bytes = encoder3.encode(value);
  if (typeof size4 === "number") {
    assertSize2(bytes, size4);
    return padRight2(bytes, size4);
  }
  return bytes;
}
function padRight2(value, size4) {
  return pad2(value, { dir: "right", size: size4 });
}
function size2(value) {
  return value.length;
}
var encoder3, SizeOverflowError2, SizeExceedsPaddingSizeError2;
var init_Bytes = __esm({
  "node_modules/ox/_esm/core/Bytes.js"() {
    init_browser_buffer_global();
    init_utils4();
    init_Errors();
    init_Hex();
    init_bytes();
    init_hex();
    init_Json();
    encoder3 = /* @__PURE__ */ new TextEncoder();
    SizeOverflowError2 = class extends BaseError3 {
      constructor({ givenSize, maxSize }) {
        super(`Size cannot exceed \`${maxSize}\` bytes. Given size: \`${givenSize}\` bytes.`);
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Bytes.SizeOverflowError"
        });
      }
    };
    SizeExceedsPaddingSizeError2 = class extends BaseError3 {
      constructor({ size: size4, targetSize, type }) {
        super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (\`${size4}\`) exceeds padding size (\`${targetSize}\`).`);
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Bytes.SizeExceedsPaddingSizeError"
        });
      }
    };
  }
});

// node_modules/ox/_esm/core/Hex.js
function concat2(...values) {
  return `0x${values.reduce((acc, x) => acc + x.replace("0x", ""), "")}`;
}
function fromBoolean(value, options = {}) {
  const hex = `0x${Number(value)}`;
  if (typeof options.size === "number") {
    assertSize3(hex, options.size);
    return padLeft(hex, options.size);
  }
  return hex;
}
function fromBytes(value, options = {}) {
  let string = "";
  for (let i = 0; i < value.length; i++)
    string += hexes3[value[i]];
  const hex = `0x${string}`;
  if (typeof options.size === "number") {
    assertSize3(hex, options.size);
    return padRight(hex, options.size);
  }
  return hex;
}
function fromNumber(value, options = {}) {
  const { signed, size: size4 } = options;
  const value_ = BigInt(value);
  let maxValue;
  if (size4) {
    if (signed)
      maxValue = (1n << BigInt(size4) * 8n - 1n) - 1n;
    else
      maxValue = 2n ** (BigInt(size4) * 8n) - 1n;
  } else if (typeof value === "number") {
    maxValue = BigInt(Number.MAX_SAFE_INTEGER);
  }
  const minValue = typeof maxValue === "bigint" && signed ? -maxValue - 1n : 0;
  if (maxValue && value_ > maxValue || value_ < minValue) {
    const suffix = typeof value === "bigint" ? "n" : "";
    throw new IntegerOutOfRangeError2({
      max: maxValue ? `${maxValue}${suffix}` : void 0,
      min: `${minValue}${suffix}`,
      signed,
      size: size4,
      value: `${value}${suffix}`
    });
  }
  const stringValue = (signed && value_ < 0 ? BigInt.asUintN(size4 * 8, BigInt(value_)) : value_).toString(16);
  const hex = `0x${stringValue}`;
  if (size4)
    return padLeft(hex, size4);
  return hex;
}
function fromString2(value, options = {}) {
  return fromBytes(encoder4.encode(value), options);
}
function padLeft(value, size4) {
  return pad3(value, { dir: "left", size: size4 });
}
function padRight(value, size4) {
  return pad3(value, { dir: "right", size: size4 });
}
function size3(value) {
  return Math.ceil((value.length - 2) / 2);
}
var encoder4, hexes3, IntegerOutOfRangeError2, SizeOverflowError3, SizeExceedsPaddingSizeError3;
var init_Hex = __esm({
  "node_modules/ox/_esm/core/Hex.js"() {
    init_browser_buffer_global();
    init_utils4();
    init_Bytes();
    init_Errors();
    init_bytes();
    init_hex();
    init_Json();
    encoder4 = /* @__PURE__ */ new TextEncoder();
    hexes3 = /* @__PURE__ */ Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, "0"));
    IntegerOutOfRangeError2 = class extends BaseError3 {
      constructor({ max, min, signed, size: size4, value }) {
        super(`Number \`${value}\` is not in safe${size4 ? ` ${size4 * 8}-bit` : ""}${signed ? " signed" : " unsigned"} integer range ${max ? `(\`${min}\` to \`${max}\`)` : `(above \`${min}\`)`}`);
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Hex.IntegerOutOfRangeError"
        });
      }
    };
    SizeOverflowError3 = class extends BaseError3 {
      constructor({ givenSize, maxSize }) {
        super(`Size cannot exceed \`${maxSize}\` bytes. Given size: \`${givenSize}\` bytes.`);
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Hex.SizeOverflowError"
        });
      }
    };
    SizeExceedsPaddingSizeError3 = class extends BaseError3 {
      constructor({ size: size4, targetSize, type }) {
        super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (\`${size4}\`) exceeds padding size (\`${targetSize}\`).`);
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Hex.SizeExceedsPaddingSizeError"
        });
      }
    };
  }
});

// node_modules/ox/_esm/core/Withdrawal.js
var init_Withdrawal = __esm({
  "node_modules/ox/_esm/core/Withdrawal.js"() {
    init_browser_buffer_global();
    init_Hex();
  }
});

// node_modules/ox/_esm/core/BlockOverrides.js
var init_BlockOverrides = __esm({
  "node_modules/ox/_esm/core/BlockOverrides.js"() {
    init_browser_buffer_global();
    init_Hex();
    init_Withdrawal();
  }
});

// node_modules/viem/_esm/constants/abis.js
var universalResolverErrors, universalResolverResolveAbi, universalResolverReverseAbi;
var init_abis = __esm({
  "node_modules/viem/_esm/constants/abis.js"() {
    init_browser_buffer_global();
    universalResolverErrors = [
      {
        inputs: [
          {
            name: "dns",
            type: "bytes"
          }
        ],
        name: "DNSDecodingFailed",
        type: "error"
      },
      {
        inputs: [
          {
            name: "ens",
            type: "string"
          }
        ],
        name: "DNSEncodingFailed",
        type: "error"
      },
      {
        inputs: [],
        name: "EmptyAddress",
        type: "error"
      },
      {
        inputs: [
          {
            name: "status",
            type: "uint16"
          },
          {
            name: "message",
            type: "string"
          }
        ],
        name: "HttpError",
        type: "error"
      },
      {
        inputs: [],
        name: "InvalidBatchGatewayResponse",
        type: "error"
      },
      {
        inputs: [
          {
            name: "errorData",
            type: "bytes"
          }
        ],
        name: "ResolverError",
        type: "error"
      },
      {
        inputs: [
          {
            name: "name",
            type: "bytes"
          },
          {
            name: "resolver",
            type: "address"
          }
        ],
        name: "ResolverNotContract",
        type: "error"
      },
      {
        inputs: [
          {
            name: "name",
            type: "bytes"
          }
        ],
        name: "ResolverNotFound",
        type: "error"
      },
      {
        inputs: [
          {
            name: "primary",
            type: "string"
          },
          {
            name: "primaryAddress",
            type: "bytes"
          }
        ],
        name: "ReverseAddressMismatch",
        type: "error"
      },
      {
        inputs: [
          {
            internalType: "bytes4",
            name: "selector",
            type: "bytes4"
          }
        ],
        name: "UnsupportedResolverProfile",
        type: "error"
      }
    ];
    universalResolverResolveAbi = [
      ...universalResolverErrors,
      {
        name: "resolveWithGateways",
        type: "function",
        stateMutability: "view",
        inputs: [
          { name: "name", type: "bytes" },
          { name: "data", type: "bytes" },
          { name: "gateways", type: "string[]" }
        ],
        outputs: [
          { name: "", type: "bytes" },
          { name: "address", type: "address" }
        ]
      }
    ];
    universalResolverReverseAbi = [
      ...universalResolverErrors,
      {
        name: "reverseWithGateways",
        type: "function",
        stateMutability: "view",
        inputs: [
          { type: "bytes", name: "reverseName" },
          { type: "uint256", name: "coinType" },
          { type: "string[]", name: "gateways" }
        ],
        outputs: [
          { type: "string", name: "resolvedName" },
          { type: "address", name: "resolver" },
          { type: "address", name: "reverseResolver" }
        ]
      }
    ];
  }
});

// node_modules/viem/_esm/constants/contract.js
var init_contract = __esm({
  "node_modules/viem/_esm/constants/contract.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/viem/_esm/constants/contracts.js
var init_contracts = __esm({
  "node_modules/viem/_esm/constants/contracts.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/viem/_esm/errors/stateOverride.js
var init_stateOverride = __esm({
  "node_modules/viem/_esm/errors/stateOverride.js"() {
    init_browser_buffer_global();
    init_base();
  }
});

// node_modules/viem/_esm/errors/contract.js
var init_contract2 = __esm({
  "node_modules/viem/_esm/errors/contract.js"() {
    init_browser_buffer_global();
    init_parseAccount();
    init_solidity();
    init_decodeErrorResult();
    init_formatAbiItem2();
    init_formatAbiItemWithArgs();
    init_getAbiItem();
    init_formatEther();
    init_formatGwei();
    init_abi();
    init_base();
    init_stateOverride();
    init_transaction();
    init_utils3();
  }
});

// node_modules/viem/_esm/utils/block/formatBlockParameter.js
function formatBlockParameter(parameters) {
  const { blockHash, blockNumber, blockTag, requireCanonical } = parameters;
  if (requireCanonical !== void 0 && !blockHash)
    throw new BaseError2("`requireCanonical` can only be provided when `blockHash` is set.");
  if (blockHash)
    return requireCanonical ? { blockHash, requireCanonical } : { blockHash };
  if (typeof blockNumber === "bigint")
    return numberToHex(blockNumber);
  return blockTag ?? "latest";
}
var init_formatBlockParameter = __esm({
  "node_modules/viem/_esm/utils/block/formatBlockParameter.js"() {
    init_browser_buffer_global();
    init_base();
    init_toHex();
  }
});

// node_modules/viem/_esm/utils/chain/getChainContractAddress.js
var init_getChainContractAddress = __esm({
  "node_modules/viem/_esm/utils/chain/getChainContractAddress.js"() {
    init_browser_buffer_global();
    init_chain();
  }
});

// node_modules/viem/_esm/utils/errors/getNodeError.js
var init_getNodeError = __esm({
  "node_modules/viem/_esm/utils/errors/getNodeError.js"() {
    init_browser_buffer_global();
    init_base();
    init_node();
    init_request();
    init_rpc();
  }
});

// node_modules/viem/_esm/utils/errors/getCallError.js
var init_getCallError = __esm({
  "node_modules/viem/_esm/utils/errors/getCallError.js"() {
    init_browser_buffer_global();
    init_contract2();
    init_node();
    init_getNodeError();
  }
});

// node_modules/viem/_esm/utils/formatters/extract.js
var init_extract = __esm({
  "node_modules/viem/_esm/utils/formatters/extract.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/viem/_esm/utils/formatters/formatter.js
var init_formatter = __esm({
  "node_modules/viem/_esm/utils/formatters/formatter.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/viem/_esm/utils/formatters/transactionRequest.js
var init_transactionRequest = __esm({
  "node_modules/viem/_esm/utils/formatters/transactionRequest.js"() {
    init_browser_buffer_global();
    init_toHex();
    init_formatter();
  }
});

// node_modules/viem/_esm/utils/promise/withResolvers.js
var init_withResolvers = __esm({
  "node_modules/viem/_esm/utils/promise/withResolvers.js"() {
    init_browser_buffer_global();
  }
});

// node_modules/viem/_esm/utils/promise/createBatchScheduler.js
var init_createBatchScheduler = __esm({
  "node_modules/viem/_esm/utils/promise/createBatchScheduler.js"() {
    init_browser_buffer_global();
    init_withResolvers();
  }
});

// node_modules/viem/_esm/utils/stateOverride.js
var init_stateOverride2 = __esm({
  "node_modules/viem/_esm/utils/stateOverride.js"() {
    init_browser_buffer_global();
    init_address();
    init_data();
    init_stateOverride();
    init_isAddress();
    init_toHex();
  }
});

// node_modules/viem/_esm/utils/transaction/assertRequest.js
var init_assertRequest = __esm({
  "node_modules/viem/_esm/utils/transaction/assertRequest.js"() {
    init_browser_buffer_global();
    init_parseAccount();
    init_number();
    init_address();
    init_node();
    init_isAddress();
  }
});

// node_modules/viem/_esm/actions/public/call.js
var init_call = __esm({
  "node_modules/viem/_esm/actions/public/call.js"() {
    init_browser_buffer_global();
    init_exports();
    init_BlockOverrides();
    init_parseAccount();
    init_abis();
    init_contract();
    init_contracts();
    init_base();
    init_chain();
    init_contract2();
    init_utils3();
    init_decodeFunctionResult();
    init_encodeDeployData();
    init_encodeFunctionData();
    init_isAddressEqual();
    init_formatBlockParameter();
    init_getChainContractAddress();
    init_getCallError();
    init_extract();
    init_transactionRequest();
    init_createBatchScheduler();
    init_stateOverride2();
    init_assertRequest();
  }
});

// node_modules/viem/_esm/errors/ccip.js
var init_ccip = __esm({
  "node_modules/viem/_esm/errors/ccip.js"() {
    init_browser_buffer_global();
    init_stringify();
    init_base();
    init_utils3();
  }
});

// node_modules/viem/_esm/utils/ens/localBatchGatewayRequest.js
var init_localBatchGatewayRequest = __esm({
  "node_modules/viem/_esm/utils/ens/localBatchGatewayRequest.js"() {
    init_browser_buffer_global();
    init_abis();
    init_solidity();
    init_decodeFunctionData();
    init_encodeErrorResult();
    init_encodeFunctionResult();
  }
});

// node_modules/viem/_esm/utils/ccip.js
var init_ccip2 = __esm({
  "node_modules/viem/_esm/utils/ccip.js"() {
    init_browser_buffer_global();
    init_call();
    init_ccip();
    init_request();
    init_utils3();
    init_decodeErrorResult();
    init_encodeAbiParameters();
    init_isAddressEqual();
    init_concat();
    init_isHex();
    init_localBatchGatewayRequest();
    init_stringify();
  }
});

// circle/arc/src/arc-radar.ts
init_browser_buffer_global();

// circle/arc/src/arc-radar-core.ts
init_browser_buffer_global();
var ARC_TESTNET_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
var legacyQuote = { address: ARC_TESTNET_USDC_ADDRESS, decimals: 6, symbol: "USDC" };
function quoteForPair(pair) {
  const quote = pair.quoteAsset ?? legacyQuote;
  const is0 = pair.token0.toLowerCase() === quote.address.toLowerCase();
  const is1 = pair.token1.toLowerCase() === quote.address.toLowerCase();
  return is0 !== is1 ? quote : null;
}
function logParameter(log, name) {
  return log.decoded?.parameters?.find((parameter) => parameter.name === name)?.value ?? null;
}
function decimalValue(raw, decimals) {
  if (raw === null || raw === void 0 || decimals === null || decimals === void 0) return 0;
  const value = Number(raw);
  const places = Number(decimals);
  if (!Number.isFinite(value) || !Number.isFinite(places)) return 0;
  return value / 10 ** places;
}
function fullyDilutedValue(price, supply, decimals) {
  if (!Number.isFinite(price) || price <= 0 || typeof supply !== "string" || !/^\d+$/.test(supply) || typeof decimals !== "string" || !/^\d+$/.test(decimals)) return null;
  const places = Number(decimals);
  const raw = Number(supply);
  if (!Number.isInteger(places) || places < 0 || places > 255 || !Number.isFinite(raw)) return null;
  const value = price * (raw / 10 ** places);
  return Number.isFinite(value) ? value : null;
}
function syncReserves(log, pair, tokenDecimals) {
  const quote = quoteForPair(pair);
  if (!quote) return null;
  if (!log.decoded?.method_call?.startsWith("Sync(")) return null;
  const reserve0 = logParameter(log, "reserve0");
  const reserve1 = logParameter(log, "reserve1");
  if (!reserve0 || !reserve1) return null;
  const tokenIs0 = pair.token0.toLowerCase() !== quote.address.toLowerCase();
  const tokenReserve = decimalValue(tokenIs0 ? reserve0 : reserve1, tokenDecimals);
  const usdcReserve = decimalValue(tokenIs0 ? reserve1 : reserve0, quote.decimals);
  if (tokenReserve < 0 || usdcReserve < 0) return null;
  return { tokenReserve, usdcReserve };
}
function latestSyncReserves(logs, pair, tokenDecimals) {
  let latest = null;
  for (const [sourcePosition, log] of logs.entries()) {
    const reserves = syncReserves(log, pair, tokenDecimals);
    if (!reserves) continue;
    const timestamp2 = log.block_timestamp ?? "";
    const parsedTimestamp = new Date(timestamp2).getTime();
    const timestampMs = Number.isFinite(parsedTimestamp) ? parsedTimestamp : Number.NEGATIVE_INFINITY;
    const logIndex = log.index ?? -1;
    const isNewer = !latest || timestampMs > latest.timestampMs || timestampMs === latest.timestampMs && logIndex > latest.logIndex || timestampMs === latest.timestampMs && logIndex === latest.logIndex && sourcePosition < latest.sourcePosition;
    if (isNewer) latest = { ...reserves, logIndex, sourcePosition, timestamp: timestamp2, timestampMs };
  }
  if (!latest) return null;
  return { timestamp: latest.timestamp, tokenReserve: latest.tokenReserve, usdcReserve: latest.usdcReserve };
}
function swapDirection(log, pair) {
  const quote = quoteForPair(pair);
  if (!quote) return null;
  if (!log.decoded?.method_call?.startsWith("Swap(")) return null;
  try {
    const amount0In = BigInt(logParameter(log, "amount0In") ?? "0");
    const amount1In = BigInt(logParameter(log, "amount1In") ?? "0");
    const amount0Out = BigInt(logParameter(log, "amount0Out") ?? "0");
    const amount1Out = BigInt(logParameter(log, "amount1Out") ?? "0");
    const tokenIs0 = pair.token0.toLowerCase() !== quote.address.toLowerCase();
    if (tokenIs0 && amount0In > 0n && amount1Out > 0n) return "sell";
    if (tokenIs0 && amount1In > 0n && amount0Out > 0n) return "buy";
    if (!tokenIs0 && amount1In > 0n && amount0Out > 0n) return "sell";
    if (!tokenIs0 && amount0In > 0n && amount1Out > 0n) return "buy";
  } catch {
    return null;
  }
  return null;
}
function swapUsdcValue(log, pair) {
  const quote = quoteForPair(pair);
  if (!quote || !log.decoded?.method_call?.startsWith("Swap(")) return 0;
  try {
    const usdcIs0 = pair.token0.toLowerCase() === quote.address.toLowerCase();
    const amountIn = BigInt(logParameter(log, usdcIs0 ? "amount0In" : "amount1In") ?? "0");
    const amountOut = BigInt(logParameter(log, usdcIs0 ? "amount0Out" : "amount1Out") ?? "0");
    return Number(amountIn + amountOut) / 10 ** quote.decimals;
  } catch {
    return 0;
  }
}

// circle/arc/src/arc-radar-discovery.ts
init_browser_buffer_global();
function timestamp(value) {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}
function refineMarkets(markets2, options) {
  const result = markets2.filter((market) => (options.minimumLiquidity <= 0 || Number.isFinite(market.totalLiquidity) && market.totalLiquidity >= options.minimumLiquidity) && (!options.traded24h || market.periods.h24.swapCount > 0) && (!options.sellSeen || market.sellCount > 0));
  if (options.sort === "default") return result;
  return result.sort((a, b) => {
    const difference = options.sort === "volume" ? b.periods.h24.volumeUsdc - a.periods.h24.volumeUsdc : options.sort === "liquidity" ? b.totalLiquidity - a.totalLiquidity : options.sort === "recent" ? timestamp(b.lastTradeAt) - timestamp(a.lastTradeAt) : 0;
    return difference || timestamp(b.createdAt) - timestamp(a.createdAt) || a.pairAddress.localeCompare(b.pairAddress);
  });
}
async function discoverSeeds(firstPath, limit, readPage, maxPages = 10) {
  const found = /* @__PURE__ */ new Map();
  const visited = /* @__PURE__ */ new Set();
  let path = firstPath;
  let stale = false;
  while (path && visited.size < maxPages && found.size <= limit && !visited.has(path)) {
    visited.add(path);
    const page = await readPage(path);
    stale ||= page.stale;
    for (const seed of page.seeds) {
      const key = seed.pairAddress.toLowerCase();
      if (!found.has(key)) found.set(key, seed);
    }
    path = page.nextPath;
  }
  return {
    seeds: [...found.values()].slice(0, limit),
    hasMore: found.size > limit,
    stale,
    limited: Boolean(path) && found.size <= limit
  };
}

// circle/arc/src/arc-radar-dex.ts
init_browser_buffer_global();
function createDexAdapter(source, network) {
  if (source.protocol !== "uniswap-v2") throw new Error(`Unsupported DEX protocol: ${source.protocol}`);
  if (!/^0x[0-9a-fA-F]{40}$/.test(source.factoryAddress)) throw new Error("Invalid factory address");
  const USDC_ADDRESS = network.quoteAsset.address.toLowerCase();
  function checkPool(pool) {
    if (pool.chainId !== network.chainId || pool.sourceId !== source.id || pool.quoteAsset.address.toLowerCase() !== USDC_ADDRESS || pool.quoteAsset.decimals !== network.quoteAsset.decimals) {
      throw new Error("Pool does not belong to this DEX and network");
    }
  }
  function pairSeeds(response) {
    const seen = /* @__PURE__ */ new Set();
    const seeds = [];
    for (const log of response.items ?? []) {
      if (!log.decoded?.method_call?.startsWith("PairCreated(")) continue;
      const token0 = logParameter(log, "token0");
      const token1 = logParameter(log, "token1");
      const pairAddress = logParameter(log, "pair");
      if (![token0, token1, pairAddress].every((value) => value && /^0x[0-9a-fA-F]{40}$/.test(value))) continue;
      if (!token0 || !token1 || !pairAddress || token0.toLowerCase() === token1.toLowerCase()) continue;
      const token0Lower = token0.toLowerCase();
      const token1Lower = token1.toLowerCase();
      if (token0Lower !== USDC_ADDRESS && token1Lower !== USDC_ADDRESS) continue;
      const key = pairAddress.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      seeds.push({
        sourceId: source.id,
        chainId: network.chainId,
        quoteAsset: network.quoteAsset,
        createdAt: log.block_timestamp ?? "",
        creationTx: log.transaction_hash ?? "",
        pairAddress,
        token0,
        token1,
        tokenAddress: token0Lower === USDC_ADDRESS ? token1 : token0
      });
    }
    return seeds;
  }
  function syncPrice(log, seed, tokenDecimals) {
    const reserves = syncReserves(log, seed, tokenDecimals);
    if (!reserves || reserves.tokenReserve <= 0 || reserves.usdcReserve <= 0) return null;
    return { price: reserves.usdcReserve / reserves.tokenReserve, timestamp: log.block_timestamp ?? "" };
  }
  function liquidityEventsFromLogs(logs, seed, tokenDecimals) {
    const syncByTransaction = /* @__PURE__ */ new Map();
    for (const log of logs) {
      if (!log.decoded?.method_call?.startsWith("Sync(") || !log.transaction_hash) continue;
      const key = log.transaction_hash.toLowerCase();
      syncByTransaction.set(key, [...syncByTransaction.get(key) ?? [], log]);
    }
    const tokenIs0 = seed.token0.toLowerCase() !== seed.quoteAsset.address.toLowerCase();
    const events = [];
    for (const log of logs) {
      const method = log.decoded?.method_call ?? "";
      const direction = method.startsWith("Mint(") ? "add" : method.startsWith("Burn(") ? "remove" : null;
      if (!direction || !log.transaction_hash) continue;
      const amount0 = logParameter(log, "amount0");
      const amount1 = logParameter(log, "amount1");
      if (!amount0 || !amount1) continue;
      const tokenAmount = decimalValue(tokenIs0 ? amount0 : amount1, tokenDecimals);
      const usdcAmount = decimalValue(tokenIs0 ? amount1 : amount0, seed.quoteAsset.decimals);
      if (tokenAmount <= 0 && usdcAmount <= 0) continue;
      const sync = [...syncByTransaction.get(log.transaction_hash.toLowerCase()) ?? []].sort((a, b) => Math.abs((a.index ?? 0) - (log.index ?? 0)) - Math.abs((b.index ?? 0) - (log.index ?? 0)))[0];
      const reservesAfter = sync ? syncReserves(sync, seed, tokenDecimals) : null;
      const reserveBefore = reservesAfter ? direction === "add" ? reservesAfter.usdcReserve - usdcAmount : reservesAfter.usdcReserve + usdcAmount : 0;
      const changePercent = reserveBefore > 0 ? usdcAmount / reserveBefore * 100 : null;
      events.push({
        changePercent,
        direction,
        fallbackAddress: logParameter(log, direction === "add" ? "sender" : "to"),
        timestamp: log.block_timestamp ?? "",
        tokenAmount,
        transactionHash: log.transaction_hash,
        usdcAmount
      });
    }
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  function tradeFromLog(log, seed) {
    const direction = swapDirection(log, seed);
    if (!direction) return null;
    return {
      direction,
      fallbackAddress: logParameter(log, "to"),
      timestamp: log.block_timestamp ?? "",
      transactionHash: log.transaction_hash ?? "",
      eventIndex: log.index,
      usdcValue: swapUsdcValue(log, seed)
    };
  }
  return {
    source,
    discoveryPath: `/addresses/${source.factoryAddress}/logs`,
    pairSeeds,
    latestReserves(logs, pool, decimals) {
      checkPool(pool);
      return latestSyncReserves(logs, pool, decimals);
    },
    pricePoint(log, pool, decimals) {
      checkPool(pool);
      return syncPrice(log, pool, decimals);
    },
    trade(log, pool) {
      checkPool(pool);
      return tradeFromLog(log, pool);
    },
    liquidityEvents(logs, pool, decimals) {
      checkPool(pool);
      return liquidityEventsFromLogs(logs, pool, decimals);
    }
  };
}
async function discoverDexPools(adapters, limit, readPage) {
  if (adapters.length === 0 || adapters.length > 4) throw new Error("Configure between one and four DEX sources");
  if (new Set(adapters.map((a) => a.source.id)).size !== adapters.length) throw new Error("Duplicate DEX source ID");
  const pools = /* @__PURE__ */ new Map();
  let hasMore = false;
  let stale = false;
  let limited = false;
  for (const adapter of adapters) {
    const result = await discoverSeeds(adapter.discoveryPath, limit, async (path) => {
      const page = await readPage(path);
      const next = page.data.next_page_params;
      const query = next ? new URLSearchParams(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, String(value)])).toString() : "";
      return { seeds: adapter.pairSeeds(page.data), stale: page.stale, nextPath: next ? `${adapter.discoveryPath}?${query}` : null };
    });
    for (const pool of result.seeds) {
      const key = `${pool.chainId}:${pool.pairAddress.toLowerCase()}`;
      if (!pools.has(key)) pools.set(key, pool);
    }
    hasMore ||= result.hasMore;
    stale ||= result.stale;
    limited ||= result.limited;
  }
  const sorted = [...pools.values()].sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || a.pairAddress.localeCompare(b.pairAddress));
  return { seeds: sorted.slice(0, limit), hasMore: hasMore || sorted.length > limit, stale, limited };
}

// circle/arc/src/arc-radar-networks.ts
init_browser_buffer_global();
var ARC_RADAR_TESTNET = {
  id: "arc-testnet",
  label: "Arc Testnet",
  chainId: 5042002,
  testnet: true,
  apiBase: "https://testnet.arcscan.app/api/v2",
  rpcUrl: "https://rpc.testnet.arc.io",
  explorerBase: "https://testnet.arcscan.app",
  quoteAsset: { address: ARC_TESTNET_USDC_ADDRESS, decimals: 6, symbol: "USDC" },
  sources: [{
    id: "arc-usdc-v2",
    label: "Arc USDC pools",
    protocol: "uniswap-v2",
    factoryAddress: "0x7483847D46Db2920DD64eFa676CF72dcF765814f"
  }]
};
var RADAR_NETWORKS = {
  "arc-testnet": { status: "ready", network: ARC_RADAR_TESTNET },
  "arc-mainnet": { status: "unconfigured", label: "Arc Mainnet" }
};
function resolveRadarNetwork(id = "arc-testnet") {
  if (!Object.hasOwn(RADAR_NETWORKS, id)) throw new Error("This network is not supported by ARCROW.");
  const entry = RADAR_NETWORKS[id];
  if (entry.status !== "ready") throw new Error(`${entry.label} is not available in ARCROW yet.`);
  return entry.network;
}
function radarStoragePrefix(network) {
  return `arcrow:v2:${network.id}:${network.chainId}:`;
}
function radarPoolKey(network, pairAddress) {
  return `${radarStoragePrefix(network)}pool:${pairAddress.toLowerCase()}`;
}

// circle/arc/src/arc-radar-ads.ts
init_browser_buffer_global();
function canPreviewAds(url) {
  return ["http:", "https:"].includes(url.protocol) && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) && url.searchParams.get("ads") === "preview";
}
function createVisibilityCheck() {
  let since = null;
  let qualified = false;
  return (now, visible) => {
    if (!visible) since = null;
    else {
      since ??= now;
      if (now - since >= 1e3) qualified = true;
    }
    return { qualified, remaining: visible && !qualified ? Math.max(0, 1e3 - (now - since)) : null };
  };
}
function initializeAdPreview(networkAvailable) {
  const inactive = { setContentAvailable: (_value) => {
  } };
  if (!networkAvailable || !canPreviewAds(new URL(location.href))) return inactive;
  const controls = document.querySelector("#adPreviewControls");
  const toggle = document.querySelector("#adPreviewToggle");
  const slot = document.querySelector("[data-ad-preview]");
  const creative = slot.querySelector(".ad-preview-creative");
  const placement = document.querySelector("#adPreviewPlacement");
  const result = document.querySelector("#adPreviewVisibility");
  const status = document.querySelector("#adPreviewStatus");
  const summary = document.querySelector(".market-pulse");
  const markets2 = document.querySelector("#markets");
  let contentAvailable = false;
  let check = createVisibilityCheck();
  let timer;
  const measure = () => {
    window.clearTimeout(timer);
    const rect = creative.getBoundingClientRect();
    const width = Math.max(0, Math.min(rect.right, document.documentElement.clientWidth) - Math.max(rect.left, 0));
    const height = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
    const area = rect.width * rect.height;
    const visible = toggle.checked && contentAvailable && !document.hidden && area > 0 && width * height / area >= 0.5;
    const sample = check(performance.now(), visible);
    result.textContent = sample.qualified ? "Yes" : "No";
    if (sample.remaining !== null) timer = window.setTimeout(measure, sample.remaining + 10);
  };
  controls.hidden = false;
  toggle.checked = true;
  const update = () => {
    slot.hidden = !toggle.checked;
    slot.style.visibility = contentAvailable ? "visible" : "hidden";
    status.textContent = !toggle.checked ? "Off" : contentAvailable ? "Preview only" : "Waiting for market content";
    measure();
  };
  toggle.addEventListener("change", update);
  placement.addEventListener("change", () => {
    if (placement.value === "summary") summary.after(slot);
    else markets2.append(slot);
    check = createVisibilityCheck();
    measure();
  });
  window.addEventListener("scroll", measure, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  document.addEventListener("visibilitychange", measure);
  update();
  return { setContentAvailable(value) {
    contentAvailable = value;
    update();
  } };
}

// circle/arc/src/arc-radar-navigation.ts
init_browser_buffer_global();
function readPoolRoute(url) {
  if (!url.searchParams.has("pool")) return null;
  const values = url.searchParams.getAll("pool");
  if (values.length !== 1 || !/^0x[0-9a-fA-F]{40}$/.test(values[0])) throw new Error("Invalid pool link.");
  return values[0].toLowerCase();
}
function marketUrl(base, network, pool) {
  const url = new URL(base);
  url.search = "";
  url.hash = "";
  url.searchParams.set("network", network);
  if (pool) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(pool)) throw new Error("Invalid pool address.");
    url.searchParams.set("pool", pool.toLowerCase());
  }
  return url.href;
}
async function resolveLinkedPool(pool, adapters, readAddress, readLogs) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(pool)) throw new Error("Invalid pool address.");
  const address = await readAddress(pool);
  const tx = address.creation_transaction_hash;
  if (!tx || !/^0x[0-9a-fA-F]{64}$/.test(tx)) throw new Error("Pool creation transaction is unavailable.");
  let path = `/transactions/${tx}/logs`;
  const seen = /* @__PURE__ */ new Set();
  for (let page = 0; page < 4 && !seen.has(path); page++) {
    seen.add(path);
    const logs = await readLogs(path);
    for (const adapter of adapters) {
      const items = (logs.items ?? []).filter((log) => log.address?.hash?.toLowerCase() === adapter.source.factoryAddress.toLowerCase() && log.transaction_hash?.toLowerCase() === tx.toLowerCase());
      const found = adapter.pairSeeds({ items }).find((seed) => seed.pairAddress.toLowerCase() === pool.toLowerCase());
      if (found) return found;
    }
    if (!logs.next_page_params) break;
    path = `/transactions/${tx}/logs?${new URLSearchParams(Object.entries(logs.next_page_params).map(([k, v]) => [k, String(v)]))}`;
  }
  throw new Error("No supported USDC pool was verified in the available creation logs.");
}
function recentWatchChanges(events, since, now) {
  return events.filter((event) => event.type !== "system" && Number.isFinite(Date.parse(event.observedAt)) && Date.parse(event.observedAt) <= now && (since === null || Date.parse(event.observedAt) > since)).sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt)).slice(0, 12);
}

// circle/arc/src/arc-radar-market-tools.ts
init_browser_buffer_global();
function observeSellEvents(trades, previous, limit = 2e3) {
  const floor = Number.isFinite(previous?.ignoreThrough) ? previous.ignoreThrough : -1;
  const stored = /* @__PURE__ */ new Map();
  for (const record of previous?.seen ?? []) {
    if (typeof record?.id === "string" && Number.isFinite(record.time)) stored.set(record.id, record);
  }
  let added = 0;
  for (const trade of trades) {
    const time = Date.parse(trade.timestamp);
    if (trade.direction !== "sell" || !/^0x[0-9a-fA-F]{64}$/.test(trade.transactionHash) || !Number.isSafeInteger(trade.eventIndex) || trade.eventIndex < 0 || !Number.isFinite(time) || time <= floor) continue;
    const id = `${trade.transactionHash.toLowerCase()}:${trade.eventIndex}`;
    if (!stored.has(id)) {
      if (previous) added++;
      stored.set(id, { id, time });
    }
  }
  const all = [...stored.values()].sort((a, b) => b.time - a.time || a.id.localeCompare(b.id));
  const removed = all.slice(limit);
  const ignoreThrough = removed.length ? Math.max(floor, removed[0].time) : floor;
  return { added, state: { seen: all.slice(0, limit), ignoreThrough } };
}
function groupTokenPools(pools) {
  const groups = /* @__PURE__ */ new Map();
  for (const pool of pools) {
    const key = `${pool.chainId}:${pool.tokenAddress.toLowerCase()}`;
    const group = groups.get(key) ?? /* @__PURE__ */ new Map();
    group.set(pool.pairAddress.toLowerCase(), pool);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => {
    const sorted = [...group.values()].sort((a, b) => Number(a.stale) - Number(b.stale) || (Number.isFinite(b.totalLiquidity) ? b.totalLiquidity : 0) - (Number.isFinite(a.totalLiquidity) ? a.totalLiquidity : 0) || a.pairAddress.toLowerCase().localeCompare(b.pairAddress.toLowerCase()));
    return { primary: sorted[0], pools: sorted };
  });
}

// circle/arc/src/arc-radar-quality.ts
init_browser_buffer_global();
function sourceState(result) {
  return result === null ? "unavailable" : result.stale ? "cached" : "fresh";
}
function holderShare(raw, supply) {
  if (raw === null || raw === void 0 || raw === "" || !supply) return null;
  const amount = Number(raw);
  const total = Number(supply);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(total) || total <= 0) return null;
  return amount / total * 100;
}
var BURN = /* @__PURE__ */ new Set(["0x0000000000000000000000000000000000000000", "0x000000000000000000000000000000000000dead"]);
function knownTokenPools(selected, loaded) {
  return new Set([selected, ...loaded].filter((pool) => pool.chainId === selected.chainId && pool.tokenAddress.toLowerCase() === selected.tokenAddress.toLowerCase()).map((pool) => pool.pairAddress.toLowerCase()));
}
function holderMetrics(result, supply, pools) {
  const valid = result && Array.isArray(result.data.items) && result.data.items.every((holder) => /^0x[0-9a-f]{40}$/i.test(holder.address?.hash ?? "") && /^\d+$/.test(holder.value));
  const state = valid ? sourceState(result) : "unavailable";
  const holders = valid ? [...result.data.items].sort((a, b) => Number(b.value) - Number(a.value)) : [];
  const partial = Boolean(result?.data.next_page_params);
  const complete = state !== "unavailable" && !partial;
  const positions = holders.filter((holder) => !pools.has(holder.address.hash.toLowerCase()) && !BURN.has(holder.address.hash.toLowerCase()));
  const sum = (rows) => rows.reduce((total, holder) => total + Number(holder.value), 0);
  return {
    state,
    partial,
    holders,
    positions,
    top: (count) => complete || state !== "unavailable" && positions.length >= count ? holderShare(sum(positions.slice(0, count)), supply) : null,
    shareAt: (address) => {
      if (!address || state === "unavailable") return null;
      const holder = holders.find((row) => row.address.hash.toLowerCase() === address.toLowerCase());
      return holderShare(holder?.value ?? (complete ? 0 : null), supply);
    },
    burned: complete ? holderShare(sum(holders.filter((holder) => BURN.has(holder.address.hash.toLowerCase()))), supply) : null
  };
}
function windowPriceChange(points, current, cutoff) {
  if (!Number.isFinite(current) || current <= 0 || !Number.isFinite(cutoff)) return null;
  const baseline = points.filter((point) => Number.isFinite(point.price) && point.price > 0 && Date.parse(point.timestamp) <= cutoff).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
  if (!baseline) return null;
  const change = (current - baseline.price) / baseline.price * 100;
  return Number.isFinite(change) ? change : null;
}
function tradeActor(sender, recipient) {
  return sender ? { address: sender, role: "Sender" } : recipient ? { address: recipient, role: "Recipient" } : null;
}
function nextOwnershipSnapshot(previous, input, fresh) {
  const next = { ...input };
  const comparable = { creatorShare: false, lpBurnedShare: false, top10Share: false };
  for (const key of ["creatorShare", "lpBurnedShare", "top10Share"]) {
    const usable = fresh[key] && input[key] !== null && Number.isFinite(input[key]);
    next[key] = usable ? input[key] : previous?.[key] ?? null;
    comparable[key] = usable && previous?.[key] !== null && previous?.[key] !== void 0 && Number.isFinite(previous[key]);
  }
  comparable.top10Share &&= previous?.poolScope === input.poolScope;
  next.poolScope = fresh.top10Share && input.top10Share !== null ? input.poolScope : previous?.poolScope;
  return { next, comparable };
}

// circle/arc/src/arc-radar-evidence.ts
init_browser_buffer_global();
function detectCapabilities(address, contract) {
  const names = [...new Set((contract?.abi ?? []).filter((entry) => entry.type === "function" && !["view", "pure"].includes(entry.stateMutability ?? "") && entry.name).map((entry) => entry.name))];
  const rules = [
    ["mint", /^(?:mint|mintTo|mintBatch|increaseSupply|issue)(?:$|[A-Z_])/],
    ["restrict", /blacklist|blocklist|denylist|freeze|wipe|seize/i],
    ["pause", /^pause$|^unpause$|setPaused|emergencyPause/i],
    ["upgrade", /upgrade|changeAdmin|setImplementation|updateImplementation/i],
    ["fee", /^(?:(?:set|update|configure).*(?:fee|tax)|(?:fee|tax).*(?:set|update))/i]
  ];
  return rules.flatMap(([kind, pattern]) => {
    const functions = names.filter((name) => pattern.test(name));
    const proxyType = kind === "upgrade" ? address?.proxy_type ?? null : null;
    return functions.length || proxyType ? [{ kind, functions, proxyType }] : [];
  });
}
function capabilityText(finding) {
  const labels = {
    mint: "Supply-related function names",
    restrict: "Restriction-related function names",
    pause: "Pause-related function names",
    upgrade: "Upgrade or proxy indicators",
    fee: "Fee-related function names"
  };
  const evidence = [
    finding.functions.length ? `ABI: ${finding.functions.join(", ")}.` : "",
    finding.proxyType ? `Explorer proxy type: ${finding.proxyType}.` : ""
  ].filter(Boolean).join(" ");
  return {
    title: labels[finding.kind],
    basis: "unverified",
    detail: `${evidence} Names alone do not establish current permissions or execution paths. Selected getter values, when requested, appear separately under Contract state and do not confirm this capability is usable.`
  };
}
function evidenceSummary(items) {
  const observed = items.filter((item) => item.basis === "observed").length;
  const estimates = items.filter((item) => item.basis === "estimate").length;
  const unverified = items.filter((item) => item.basis === "unverified").length;
  return { observed, estimates, unverified, label: unverified ? "Checks incomplete" : "Evidence only" };
}
function marketBriefs(markets2, now, limit = 6) {
  const withinDay = (timestamp2) => Date.parse(timestamp2) <= now && Date.parse(timestamp2) > now - 864e5;
  const validTx = (hash2) => /^0x[0-9a-f]{64}$/i.test(hash2);
  const candidates = [];
  for (const market of markets2) {
    if (market.stale) continue;
    const removed = market.liquidityEvents.filter((event) => event.direction === "remove" && withinDay(event.timestamp) && validTx(event.transactionHash) && event.changePercent !== null && Number.isFinite(event.changePercent) && event.changePercent >= 10 && Number.isFinite(event.usdcAmount) && event.usdcAmount > 0).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
    if (removed) candidates.push({
      market,
      basis: "observed",
      kind: "liquidity",
      timestamp: removed.timestamp,
      title: "Liquidity removed",
      transactionHash: removed.transactionHash,
      value: removed.usdcAmount,
      secondaryValue: removed.changePercent
    });
    const change = market.periods.h1.priceChange;
    const latestTrade = market.trades.filter((event) => withinDay(event.timestamp)).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
    if (market.reserveSource === "sync" && !market.historyTruncated && change !== null && Number.isFinite(change) && Math.abs(change) >= 30 && latestTrade && Date.parse(latestTrade.timestamp) > now - 36e5) {
      candidates.push({
        market,
        basis: "estimate",
        kind: "price",
        timestamp: new Date(now).toISOString(),
        title: "Large 1H price move",
        transactionHash: null,
        value: change
      });
    }
    if (withinDay(market.createdAt) && validTx(market.creationTx) && latestTrade && Date.parse(latestTrade.timestamp) >= Date.parse(market.createdAt)) candidates.push({
      market,
      basis: "observed",
      kind: "launch",
      timestamp: market.createdAt,
      title: "New pool with indexed trades",
      transactionHash: market.creationTx,
      value: 0
    });
  }
  const priority = { liquidity: 0, price: 1, launch: 2 };
  candidates.sort((a, b) => priority[a.kind] - priority[b.kind] || Date.parse(b.timestamp) - Date.parse(a.timestamp) || a.market.pairAddress.localeCompare(b.market.pairAddress));
  const seen = /* @__PURE__ */ new Set();
  return candidates.filter((item) => {
    const key = `${item.market.chainId}:${item.market.tokenAddress.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, Math.max(0, limit));
}
function nextWatchBatch(pools, checkedAt, now, ttl, limit = 3) {
  return pools.filter((pool) => now - (checkedAt(pool) ?? 0) >= ttl).sort((a, b) => (checkedAt(a) ?? 0) - (checkedAt(b) ?? 0) || a.pairAddress.localeCompare(b.pairAddress)).slice(0, limit);
}

// circle/arc/src/arc-radar-authority.ts
init_browser_buffer_global();

// node_modules/viem/_esm/utils/index.js
init_browser_buffer_global();
init_exports();
init_parseAccount();

// node_modules/viem/_esm/accounts/utils/publicKeyToAddress.js
init_browser_buffer_global();
init_getAddress();
init_keccak256();

// node_modules/viem/_esm/utils/index.js
init_decodeAbiParameters();
init_decodeErrorResult();

// node_modules/viem/_esm/utils/abi/decodeEventLog.js
init_browser_buffer_global();
init_abi();
init_cursor();
init_size();
init_toEventSelector();
init_decodeAbiParameters();
init_formatAbiItem2();

// node_modules/viem/_esm/utils/index.js
init_decodeFunctionData();
init_decodeFunctionResult();
init_encodeAbiParameters();
init_encodeDeployData();
init_encodeErrorResult();

// node_modules/viem/_esm/utils/abi/encodeEventTopics.js
init_browser_buffer_global();
init_abi();

// node_modules/viem/_esm/errors/log.js
init_browser_buffer_global();
init_base();

// node_modules/viem/_esm/utils/abi/encodeEventTopics.js
init_toBytes();
init_keccak256();
init_toEventSelector();
init_encodeAbiParameters();
init_formatAbiItem2();
init_getAbiItem();

// node_modules/viem/_esm/utils/index.js
init_encodeFunctionData();
init_encodeFunctionResult();

// node_modules/viem/_esm/utils/abi/encodePacked.js
init_browser_buffer_global();
init_abi();
init_address();
init_isAddress();
init_concat();
init_pad();
init_toHex();
init_regex2();

// node_modules/viem/_esm/utils/index.js
init_formatAbiItem2();
init_formatAbiItemWithArgs();
init_getAbiItem();

// node_modules/viem/_esm/utils/abi/parseEventLogs.js
init_browser_buffer_global();
init_isAddressEqual();
init_toBytes();

// node_modules/viem/_esm/utils/formatters/log.js
init_browser_buffer_global();

// node_modules/viem/_esm/utils/abi/parseEventLogs.js
init_keccak256();
init_toEventSelector();

// node_modules/viem/_esm/utils/index.js
init_getAddress();

// node_modules/viem/_esm/utils/address/getContractAddress.js
init_browser_buffer_global();
init_concat();

// node_modules/viem/_esm/utils/data/isBytes.js
init_browser_buffer_global();

// node_modules/viem/_esm/utils/address/getContractAddress.js
init_pad();
init_slice();
init_toBytes();

// node_modules/viem/_esm/utils/encoding/toRlp.js
init_browser_buffer_global();
init_base();
init_cursor2();
init_toBytes();
init_toHex();

// node_modules/viem/_esm/utils/address/getContractAddress.js
init_keccak256();
init_getAddress();

// node_modules/viem/_esm/utils/index.js
init_isAddress();
init_isAddressEqual();

// node_modules/viem/_esm/utils/authorization/hashAuthorization.js
init_browser_buffer_global();
init_concat();
init_toBytes();
init_toHex();
init_keccak256();

// node_modules/viem/_esm/utils/authorization/recoverAuthorizationAddress.js
init_browser_buffer_global();

// node_modules/viem/_esm/utils/signature/recoverAddress.js
init_browser_buffer_global();

// node_modules/viem/_esm/utils/signature/recoverPublicKey.js
init_browser_buffer_global();
init_isHex();
init_size();
init_fromHex();
init_toHex();

// node_modules/viem/_esm/utils/authorization/serializeAuthorizationList.js
init_browser_buffer_global();
init_toHex();

// node_modules/viem/_esm/utils/transaction/serializeTransaction.js
init_browser_buffer_global();
init_transaction();

// node_modules/viem/_esm/utils/blob/blobsToCommitments.js
init_browser_buffer_global();
init_toBytes();
init_toHex();

// node_modules/viem/_esm/utils/blob/blobsToProofs.js
init_browser_buffer_global();
init_toBytes();
init_toHex();

// node_modules/viem/_esm/utils/blob/commitmentsToVersionedHashes.js
init_browser_buffer_global();

// node_modules/viem/_esm/utils/blob/commitmentToVersionedHash.js
init_browser_buffer_global();
init_toHex();

// node_modules/viem/_esm/utils/hash/sha256.js
init_browser_buffer_global();

// node_modules/viem/node_modules/@noble/hashes/esm/sha256.js
init_browser_buffer_global();
init_sha2();

// node_modules/viem/_esm/utils/hash/sha256.js
init_isHex();
init_toBytes();
init_toHex();

// node_modules/viem/_esm/utils/blob/toBlobSidecars.js
init_browser_buffer_global();

// node_modules/viem/_esm/utils/blob/toBlobs.js
init_browser_buffer_global();

// node_modules/viem/_esm/constants/blob.js
init_browser_buffer_global();
var blobsPerTransaction = 6;
var bytesPerFieldElement = 32;
var fieldElementsPerBlob = 4096;
var bytesPerBlob = bytesPerFieldElement * fieldElementsPerBlob;
var maxBytesPerTransaction = bytesPerBlob * blobsPerTransaction - // terminator byte (0x80).
1 - // zero byte (0x00) appended to each field element.
1 * fieldElementsPerBlob * blobsPerTransaction;

// node_modules/viem/_esm/errors/blob.js
init_browser_buffer_global();

// node_modules/viem/_esm/constants/kzg.js
init_browser_buffer_global();

// node_modules/viem/_esm/errors/blob.js
init_base();

// node_modules/viem/_esm/utils/blob/toBlobs.js
init_cursor2();
init_size();
init_toBytes();
init_toHex();

// node_modules/viem/_esm/utils/transaction/serializeTransaction.js
init_concat();
init_trim();
init_toHex();

// node_modules/viem/_esm/utils/transaction/assertTransaction.js
init_browser_buffer_global();
init_number();
init_address();
init_base();
init_chain();
init_node();
init_isAddress();
init_size();
init_slice();
init_fromHex();

// node_modules/viem/_esm/utils/transaction/getTransactionType.js
init_browser_buffer_global();
init_transaction();

// node_modules/viem/_esm/utils/transaction/serializeAccessList.js
init_browser_buffer_global();
init_address();
init_transaction();
init_isAddress();

// node_modules/viem/_esm/utils/authorization/verifyAuthorization.js
init_browser_buffer_global();
init_getAddress();
init_isAddressEqual();

// node_modules/viem/_esm/utils/buildRequest.js
init_browser_buffer_global();
init_base();
init_request();
init_rpc();
init_utils3();

// node_modules/viem/_esm/utils/promise/withDedupe.js
init_browser_buffer_global();
init_lru();

// node_modules/viem/_esm/utils/promise/withRetry.js
init_browser_buffer_global();
init_utils3();

// node_modules/viem/_esm/utils/wait.js
init_browser_buffer_global();
init_utils3();

// node_modules/viem/_esm/utils/buildRequest.js
init_stringify();

// node_modules/viem/_esm/utils/index.js
init_ccip2();

// node_modules/viem/_esm/utils/ccipTunnel.js
init_browser_buffer_global();
init_abis();
init_solidity();
init_request();
init_decodeErrorResult();
init_decodeFunctionResult();
init_encodeFunctionData();
init_ccip2();
init_localBatchGatewayRequest();

// node_modules/viem/_esm/utils/chain/assertCurrentChain.js
init_browser_buffer_global();
init_chain();

// node_modules/viem/_esm/utils/chain/defineChain.js
init_browser_buffer_global();

// node_modules/viem/_esm/utils/chain/extractChain.js
init_browser_buffer_global();

// node_modules/viem/_esm/utils/index.js
init_getChainContractAddress();
init_concat();
init_isHex();
init_pad();
init_size();
init_slice();
init_trim();
init_fromBytes();
init_fromHex();

// node_modules/viem/_esm/utils/encoding/fromRlp.js
init_browser_buffer_global();
init_base();
init_encoding();
init_cursor2();
init_toBytes();
init_toHex();

// node_modules/viem/_esm/utils/index.js
init_toBytes();
init_toHex();
init_getCallError();

// node_modules/viem/_esm/utils/errors/getContractError.js
init_browser_buffer_global();
init_abi();
init_base();
init_contract2();
init_request();
init_rpc();

// node_modules/viem/_esm/utils/errors/getEstimateGasError.js
init_browser_buffer_global();

// node_modules/viem/_esm/errors/estimateGas.js
init_browser_buffer_global();
init_formatEther();
init_formatGwei();
init_base();
init_transaction();

// node_modules/viem/_esm/utils/errors/getEstimateGasError.js
init_node();
init_getNodeError();

// node_modules/viem/_esm/utils/index.js
init_getNodeError();

// node_modules/viem/_esm/utils/errors/getTransactionError.js
init_browser_buffer_global();
init_node();
init_transaction();
init_getNodeError();

// node_modules/viem/_esm/utils/formatters/block.js
init_browser_buffer_global();
init_formatter();

// node_modules/viem/_esm/utils/formatters/transaction.js
init_browser_buffer_global();
init_fromHex();
init_formatter();

// node_modules/viem/_esm/utils/index.js
init_extract();
init_formatter();

// node_modules/viem/_esm/utils/formatters/transactionReceipt.js
init_browser_buffer_global();
init_fromHex();
init_formatter();

// node_modules/viem/_esm/utils/index.js
init_transactionRequest();

// node_modules/viem/_esm/utils/getAction.js
init_browser_buffer_global();

// node_modules/viem/_esm/utils/hash/isHash.js
init_browser_buffer_global();
init_isHex();
init_size();

// node_modules/viem/_esm/utils/index.js
init_keccak256();

// node_modules/viem/_esm/utils/hash/ripemd160.js
init_browser_buffer_global();

// node_modules/viem/node_modules/@noble/hashes/esm/ripemd160.js
init_browser_buffer_global();

// node_modules/viem/node_modules/@noble/hashes/esm/legacy.js
init_browser_buffer_global();
init_md();
init_utils2();

// node_modules/viem/_esm/utils/hash/ripemd160.js
init_isHex();
init_toBytes();
init_toHex();

// node_modules/viem/_esm/utils/hash/toEventHash.js
init_browser_buffer_global();
init_toSignatureHash();

// node_modules/viem/_esm/utils/index.js
init_toEventSelector();

// node_modules/viem/_esm/utils/hash/toEventSignature.js
init_browser_buffer_global();
init_toSignature();

// node_modules/viem/_esm/utils/hash/toFunctionHash.js
init_browser_buffer_global();
init_toSignatureHash();

// node_modules/viem/_esm/utils/index.js
init_toFunctionSelector();

// node_modules/viem/_esm/utils/hash/toFunctionSignature.js
init_browser_buffer_global();
init_toSignature();

// node_modules/viem/_esm/utils/nonceManager.js
init_browser_buffer_global();

// node_modules/viem/_esm/actions/public/getTransactionCount.js
init_browser_buffer_global();
init_formatBlockParameter();
init_fromHex();
async function getTransactionCount(client, { address, blockHash, blockNumber, blockTag = "latest", requireCanonical }) {
  const block = formatBlockParameter({
    blockHash,
    blockNumber,
    blockTag,
    requireCanonical
  });
  const count = await client.request({
    method: "eth_getTransactionCount",
    params: [address, block]
  }, {
    dedupe: typeof blockNumber === "bigint" || blockHash !== void 0
  });
  return hexToNumber(count);
}

// node_modules/viem/_esm/utils/nonceManager.js
init_lru();
function createNonceManager(parameters) {
  const { source } = parameters;
  const deltaMap = /* @__PURE__ */ new Map();
  const nonceMap = new LruMap(8192);
  const promiseMap = /* @__PURE__ */ new Map();
  const getKey = ({ address, chainId }) => `${address}.${chainId}`;
  const resetCache = (key) => {
    deltaMap.delete(key);
    promiseMap.delete(key);
  };
  return {
    async consume({ address, chainId, client }) {
      const key = getKey({ address, chainId });
      const promise = this.get({ address, chainId, client });
      this.increment({ address, chainId });
      const nonce = await promise;
      await source.set({ address, chainId }, nonce);
      nonceMap.set(key, nonce);
      return nonce;
    },
    async increment({ address, chainId }) {
      const key = getKey({ address, chainId });
      const delta = deltaMap.get(key) ?? 0;
      deltaMap.set(key, delta + 1);
    },
    async get({ address, chainId, client }) {
      const key = getKey({ address, chainId });
      let promise = promiseMap.get(key);
      if (!promise) {
        promise = (async () => {
          try {
            const nonce = await source.get({ address, chainId, client });
            const previousNonce = nonceMap.get(key) ?? 0;
            if (previousNonce > 0 && nonce <= previousNonce)
              return previousNonce + 1;
            nonceMap.delete(key);
            return nonce;
          } finally {
            resetCache(key);
          }
        })();
        promiseMap.set(key, promise);
      }
      const delta = deltaMap.get(key) ?? 0;
      return delta + await promise;
    },
    reset({ address, chainId }) {
      const key = getKey({ address, chainId });
      nonceMap.delete(key);
      resetCache(key);
    }
  };
}
function jsonRpc() {
  return {
    async get(parameters) {
      const { address, client } = parameters;
      return getTransactionCount(client, {
        address,
        blockTag: "pending"
      });
    },
    set() {
    }
  };
}
var nonceManager = /* @__PURE__ */ createNonceManager({
  source: jsonRpc()
});

// node_modules/viem/_esm/utils/index.js
init_regex2();

// node_modules/viem/_esm/utils/rpc/compat.js
init_browser_buffer_global();

// node_modules/viem/_esm/utils/rpc/http.js
init_browser_buffer_global();
init_request();
init_utils3();

// node_modules/viem/_esm/utils/promise/withTimeout.js
init_browser_buffer_global();
init_utils3();

// node_modules/viem/_esm/utils/rpc/http.js
init_stringify();

// node_modules/viem/_esm/utils/rpc/id.js
init_browser_buffer_global();

// node_modules/viem/_esm/utils/rpc/webSocket.js
init_browser_buffer_global();
init_request();

// node_modules/viem/_esm/utils/rpc/socket.js
init_browser_buffer_global();
init_request();
init_createBatchScheduler();

// node_modules/viem/_esm/utils/signature/hashMessage.js
init_browser_buffer_global();
init_keccak256();

// node_modules/viem/_esm/utils/signature/toPrefixedMessage.js
init_browser_buffer_global();

// node_modules/viem/_esm/constants/strings.js
init_browser_buffer_global();

// node_modules/viem/_esm/utils/signature/toPrefixedMessage.js
init_concat();
init_size();
init_toHex();

// node_modules/viem/_esm/utils/signature/hashTypedData.js
init_browser_buffer_global();
init_encodeAbiParameters();
init_concat();
init_toHex();
init_keccak256();

// node_modules/viem/_esm/utils/typedData.js
init_browser_buffer_global();
init_abi();
init_address();

// node_modules/viem/_esm/errors/typedData.js
init_browser_buffer_global();
init_stringify();
init_base();

// node_modules/viem/_esm/utils/typedData.js
init_isAddress();
init_size();
init_toHex();
init_regex2();
init_stringify();

// node_modules/viem/_esm/utils/signature/isErc6492Signature.js
init_browser_buffer_global();

// node_modules/viem/_esm/constants/bytes.js
init_browser_buffer_global();

// node_modules/viem/_esm/utils/signature/isErc6492Signature.js
init_slice();

// node_modules/viem/_esm/utils/signature/isErc8010Signature.js
init_browser_buffer_global();

// node_modules/ox/_esm/erc8010/index.js
init_browser_buffer_global();

// node_modules/ox/_esm/erc8010/SignatureErc8010.js
init_browser_buffer_global();

// node_modules/ox/_esm/core/AbiParameters.js
init_browser_buffer_global();

// node_modules/abitype/dist/esm/exports/index.js
init_browser_buffer_global();

// node_modules/abitype/dist/esm/errors.js
init_browser_buffer_global();

// node_modules/abitype/dist/esm/version.js
init_browser_buffer_global();
var version4 = "1.2.4";

// node_modules/abitype/dist/esm/errors.js
var BaseError4 = class _BaseError extends Error {
  constructor(shortMessage, args = {}) {
    const details = args.cause instanceof _BaseError ? args.cause.details : args.cause?.message ? args.cause.message : args.details;
    const docsPath3 = args.cause instanceof _BaseError ? args.cause.docsPath || args.docsPath : args.docsPath;
    const message = [
      shortMessage || "An error occurred.",
      "",
      ...args.metaMessages ? [...args.metaMessages, ""] : [],
      ...docsPath3 ? [`Docs: https://abitype.dev${docsPath3}`] : [],
      ...details ? [`Details: ${details}`] : [],
      `Version: abitype@${version4}`
    ].join("\n");
    super(message);
    Object.defineProperty(this, "details", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "docsPath", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "metaMessages", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "shortMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "AbiTypeError"
    });
    if (args.cause)
      this.cause = args.cause;
    this.details = details;
    this.docsPath = docsPath3;
    this.metaMessages = args.metaMessages;
    this.shortMessage = shortMessage;
  }
};

// node_modules/abitype/dist/esm/narrow.js
init_browser_buffer_global();

// node_modules/abitype/dist/esm/human-readable/formatAbi.js
init_browser_buffer_global();

// node_modules/abitype/dist/esm/human-readable/formatAbiItem.js
init_browser_buffer_global();

// node_modules/abitype/dist/esm/human-readable/formatAbiParameters.js
init_browser_buffer_global();

// node_modules/abitype/dist/esm/human-readable/formatAbiParameter.js
init_browser_buffer_global();

// node_modules/abitype/dist/esm/regex.js
init_browser_buffer_global();
function execTyped2(regex, string) {
  const match = regex.exec(string);
  return match?.groups;
}
var bytesRegex3 = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
var integerRegex3 = /^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
var isTupleRegex2 = /^\(.+?\).*?$/;

// node_modules/abitype/dist/esm/human-readable/parseAbi.js
init_browser_buffer_global();

// node_modules/abitype/dist/esm/human-readable/runtime/signatures.js
init_browser_buffer_global();
var structSignatureRegex = /^struct (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*) \{(?<properties>.*?)\}$/;
function isStructSignature2(signature) {
  return structSignatureRegex.test(signature);
}
function execStructSignature2(signature) {
  return execTyped2(structSignatureRegex, signature);
}
var modifiers2 = /* @__PURE__ */ new Set([
  "memory",
  "indexed",
  "storage",
  "calldata"
]);
var functionModifiers2 = /* @__PURE__ */ new Set([
  "calldata",
  "memory",
  "storage"
]);

// node_modules/abitype/dist/esm/human-readable/runtime/structs.js
init_browser_buffer_global();

// node_modules/abitype/dist/esm/human-readable/errors/abiItem.js
init_browser_buffer_global();
var UnknownTypeError2 = class extends BaseError4 {
  constructor({ type }) {
    super("Unknown type.", {
      metaMessages: [
        `Type "${type}" is not a valid ABI type. Perhaps you forgot to include a struct signature?`
      ]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "UnknownTypeError"
    });
  }
};
var UnknownSolidityTypeError2 = class extends BaseError4 {
  constructor({ type }) {
    super("Unknown type.", {
      metaMessages: [`Type "${type}" is not a valid ABI type.`]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "UnknownSolidityTypeError"
    });
  }
};

// node_modules/abitype/dist/esm/human-readable/errors/abiParameter.js
init_browser_buffer_global();
var InvalidAbiParametersError2 = class extends BaseError4 {
  constructor({ params }) {
    super("Failed to parse ABI parameters.", {
      details: `parseAbiParameters(${JSON.stringify(params, null, 2)})`,
      docsPath: "/api/human#parseabiparameters-1"
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "InvalidAbiParametersError"
    });
  }
};
var InvalidParameterError2 = class extends BaseError4 {
  constructor({ param }) {
    super("Invalid ABI parameter.", {
      details: param
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "InvalidParameterError"
    });
  }
};
var SolidityProtectedKeywordError2 = class extends BaseError4 {
  constructor({ param, name }) {
    super("Invalid ABI parameter.", {
      details: param,
      metaMessages: [
        `"${name}" is a protected Solidity keyword. More info: https://docs.soliditylang.org/en/latest/cheatsheet.html`
      ]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "SolidityProtectedKeywordError"
    });
  }
};
var InvalidModifierError2 = class extends BaseError4 {
  constructor({ param, type, modifier }) {
    super("Invalid ABI parameter.", {
      details: param,
      metaMessages: [
        `Modifier "${modifier}" not allowed${type ? ` in "${type}" type` : ""}.`
      ]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "InvalidModifierError"
    });
  }
};
var InvalidFunctionModifierError2 = class extends BaseError4 {
  constructor({ param, type, modifier }) {
    super("Invalid ABI parameter.", {
      details: param,
      metaMessages: [
        `Modifier "${modifier}" not allowed${type ? ` in "${type}" type` : ""}.`,
        `Data location can only be specified for array, struct, or mapping types, but "${modifier}" was given.`
      ]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "InvalidFunctionModifierError"
    });
  }
};
var InvalidAbiTypeParameterError2 = class extends BaseError4 {
  constructor({ abiParameter }) {
    super("Invalid ABI parameter.", {
      details: JSON.stringify(abiParameter, null, 2),
      metaMessages: ["ABI parameter type is invalid."]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "InvalidAbiTypeParameterError"
    });
  }
};

// node_modules/abitype/dist/esm/human-readable/errors/signature.js
init_browser_buffer_global();
var InvalidSignatureError2 = class extends BaseError4 {
  constructor({ signature, type }) {
    super(`Invalid ${type} signature.`, {
      details: signature
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "InvalidSignatureError"
    });
  }
};
var InvalidStructSignatureError2 = class extends BaseError4 {
  constructor({ signature }) {
    super("Invalid struct signature.", {
      details: signature,
      metaMessages: ["No properties exist."]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "InvalidStructSignatureError"
    });
  }
};

// node_modules/abitype/dist/esm/human-readable/errors/struct.js
init_browser_buffer_global();
var CircularReferenceError2 = class extends BaseError4 {
  constructor({ type }) {
    super("Circular reference detected.", {
      metaMessages: [`Struct "${type}" is a circular reference.`]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "CircularReferenceError"
    });
  }
};

// node_modules/abitype/dist/esm/human-readable/runtime/utils.js
init_browser_buffer_global();

// node_modules/abitype/dist/esm/human-readable/errors/splitParameters.js
init_browser_buffer_global();
var InvalidParenthesisError2 = class extends BaseError4 {
  constructor({ current, depth }) {
    super("Unbalanced parentheses.", {
      metaMessages: [
        `"${current.trim()}" has too many ${depth > 0 ? "opening" : "closing"} parentheses.`
      ],
      details: `Depth "${depth}"`
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "InvalidParenthesisError"
    });
  }
};

// node_modules/abitype/dist/esm/human-readable/runtime/cache.js
init_browser_buffer_global();
function getParameterCacheKey2(param, type, structs) {
  let structKey = "";
  if (structs)
    for (const struct of Object.entries(structs)) {
      if (!struct)
        continue;
      let propertyKey = "";
      for (const property of struct[1]) {
        propertyKey += `[${property.type}${property.name ? `:${property.name}` : ""}]`;
      }
      structKey += `(${struct[0]}{${propertyKey}})`;
    }
  if (type)
    return `${type}:${param}${structKey}`;
  return `${param}${structKey}`;
}
var parameterCache2 = /* @__PURE__ */ new Map([
  // Unnamed
  ["address", { type: "address" }],
  ["bool", { type: "bool" }],
  ["bytes", { type: "bytes" }],
  ["bytes32", { type: "bytes32" }],
  ["int", { type: "int256" }],
  ["int256", { type: "int256" }],
  ["string", { type: "string" }],
  ["uint", { type: "uint256" }],
  ["uint8", { type: "uint8" }],
  ["uint16", { type: "uint16" }],
  ["uint24", { type: "uint24" }],
  ["uint32", { type: "uint32" }],
  ["uint64", { type: "uint64" }],
  ["uint96", { type: "uint96" }],
  ["uint112", { type: "uint112" }],
  ["uint160", { type: "uint160" }],
  ["uint192", { type: "uint192" }],
  ["uint256", { type: "uint256" }],
  // Named
  ["address owner", { type: "address", name: "owner" }],
  ["address to", { type: "address", name: "to" }],
  ["bool approved", { type: "bool", name: "approved" }],
  ["bytes _data", { type: "bytes", name: "_data" }],
  ["bytes data", { type: "bytes", name: "data" }],
  ["bytes signature", { type: "bytes", name: "signature" }],
  ["bytes32 hash", { type: "bytes32", name: "hash" }],
  ["bytes32 r", { type: "bytes32", name: "r" }],
  ["bytes32 root", { type: "bytes32", name: "root" }],
  ["bytes32 s", { type: "bytes32", name: "s" }],
  ["string name", { type: "string", name: "name" }],
  ["string symbol", { type: "string", name: "symbol" }],
  ["string tokenURI", { type: "string", name: "tokenURI" }],
  ["uint tokenId", { type: "uint256", name: "tokenId" }],
  ["uint8 v", { type: "uint8", name: "v" }],
  ["uint256 balance", { type: "uint256", name: "balance" }],
  ["uint256 tokenId", { type: "uint256", name: "tokenId" }],
  ["uint256 value", { type: "uint256", name: "value" }],
  // Indexed
  [
    "event:address indexed from",
    { type: "address", name: "from", indexed: true }
  ],
  ["event:address indexed to", { type: "address", name: "to", indexed: true }],
  [
    "event:uint indexed tokenId",
    { type: "uint256", name: "tokenId", indexed: true }
  ],
  [
    "event:uint256 indexed tokenId",
    { type: "uint256", name: "tokenId", indexed: true }
  ]
]);

// node_modules/abitype/dist/esm/human-readable/runtime/utils.js
var abiParameterWithoutTupleRegex = /^(?<type>[a-zA-Z$_][a-zA-Z0-9$_]*(?:\spayable)?)(?<array>(?:\[\d*?\])+?)?(?:\s(?<modifier>calldata|indexed|memory|storage{1}))?(?:\s(?<name>[a-zA-Z$_][a-zA-Z0-9$_]*))?$/;
var abiParameterWithTupleRegex = /^\((?<type>.+?)\)(?<array>(?:\[\d*?\])+?)?(?:\s(?<modifier>calldata|indexed|memory|storage{1}))?(?:\s(?<name>[a-zA-Z$_][a-zA-Z0-9$_]*))?$/;
var dynamicIntegerRegex = /^u?int$/;
function parseAbiParameter3(param, options) {
  const parameterCacheKey = getParameterCacheKey2(param, options?.type, options?.structs);
  if (parameterCache2.has(parameterCacheKey))
    return parameterCache2.get(parameterCacheKey);
  const isTuple = isTupleRegex2.test(param);
  const match = execTyped2(isTuple ? abiParameterWithTupleRegex : abiParameterWithoutTupleRegex, param);
  if (!match)
    throw new InvalidParameterError2({ param });
  if (match.name && isSolidityKeyword(match.name))
    throw new SolidityProtectedKeywordError2({ param, name: match.name });
  const name = match.name ? { name: match.name } : {};
  const indexed = match.modifier === "indexed" ? { indexed: true } : {};
  const structs = options?.structs ?? {};
  let type;
  let components = {};
  if (isTuple) {
    type = "tuple";
    const params = splitParameters2(match.type);
    const components_ = [];
    const length = params.length;
    for (let i = 0; i < length; i++) {
      components_.push(parseAbiParameter3(params[i], { structs }));
    }
    components = { components: components_ };
  } else if (match.type in structs) {
    type = "tuple";
    components = { components: structs[match.type] };
  } else if (dynamicIntegerRegex.test(match.type)) {
    type = `${match.type}256`;
  } else if (match.type === "address payable") {
    type = "address";
  } else {
    type = match.type;
    if (!(options?.type === "struct") && !isSolidityType2(type))
      throw new UnknownSolidityTypeError2({ type });
  }
  if (match.modifier) {
    if (!options?.modifiers?.has?.(match.modifier))
      throw new InvalidModifierError2({
        param,
        type: options?.type,
        modifier: match.modifier
      });
    if (functionModifiers2.has(match.modifier) && !isValidDataLocation(type, !!match.array))
      throw new InvalidFunctionModifierError2({
        param,
        type: options?.type,
        modifier: match.modifier
      });
  }
  const abiParameter = {
    type: `${type}${match.array ?? ""}`,
    ...name,
    ...indexed,
    ...components
  };
  parameterCache2.set(parameterCacheKey, abiParameter);
  return abiParameter;
}
function splitParameters2(params, result = [], current = "", depth = 0) {
  const length = params.trim().length;
  for (let i = 0; i < length; i++) {
    const char = params[i];
    const tail = params.slice(i + 1);
    switch (char) {
      case ",":
        return depth === 0 ? splitParameters2(tail, [...result, current.trim()]) : splitParameters2(tail, result, `${current}${char}`, depth);
      case "(":
        return splitParameters2(tail, result, `${current}${char}`, depth + 1);
      case ")":
        return splitParameters2(tail, result, `${current}${char}`, depth - 1);
      default:
        return splitParameters2(tail, result, `${current}${char}`, depth);
    }
  }
  if (current === "")
    return result;
  if (depth !== 0)
    throw new InvalidParenthesisError2({ current, depth });
  result.push(current.trim());
  return result;
}
function isSolidityType2(type) {
  return type === "address" || type === "bool" || type === "function" || type === "string" || bytesRegex3.test(type) || integerRegex3.test(type);
}
var protectedKeywordsRegex = /^(?:after|alias|anonymous|apply|auto|byte|calldata|case|catch|constant|copyof|default|defined|error|event|external|false|final|function|immutable|implements|in|indexed|inline|internal|let|mapping|match|memory|mutable|null|of|override|partial|private|promise|public|pure|reference|relocatable|return|returns|sizeof|static|storage|struct|super|supports|switch|this|true|try|typedef|typeof|var|view|virtual)$/;
function isSolidityKeyword(name) {
  return name === "address" || name === "bool" || name === "function" || name === "string" || name === "tuple" || bytesRegex3.test(name) || integerRegex3.test(name) || protectedKeywordsRegex.test(name);
}
function isValidDataLocation(type, isArray) {
  return isArray || type === "bytes" || type === "string" || type === "tuple";
}

// node_modules/abitype/dist/esm/human-readable/runtime/structs.js
function parseStructs2(signatures) {
  const shallowStructs = {};
  const signaturesLength = signatures.length;
  for (let i = 0; i < signaturesLength; i++) {
    const signature = signatures[i];
    if (!isStructSignature2(signature))
      continue;
    const match = execStructSignature2(signature);
    if (!match)
      throw new InvalidSignatureError2({ signature, type: "struct" });
    const properties = match.properties.split(";");
    const components = [];
    const propertiesLength = properties.length;
    for (let k = 0; k < propertiesLength; k++) {
      const property = properties[k];
      const trimmed = property.trim();
      if (!trimmed)
        continue;
      const abiParameter = parseAbiParameter3(trimmed, {
        type: "struct"
      });
      components.push(abiParameter);
    }
    if (!components.length)
      throw new InvalidStructSignatureError2({ signature });
    shallowStructs[match.name] = components;
  }
  const resolvedStructs = {};
  const entries = Object.entries(shallowStructs);
  const entriesLength = entries.length;
  for (let i = 0; i < entriesLength; i++) {
    const [name, parameters] = entries[i];
    resolvedStructs[name] = resolveStructs(parameters, shallowStructs);
  }
  return resolvedStructs;
}
var typeWithoutTupleRegex = /^(?<type>[a-zA-Z$_][a-zA-Z0-9$_]*)(?<array>(?:\[\d*?\])+?)?$/;
function resolveStructs(abiParameters = [], structs = {}, ancestors = /* @__PURE__ */ new Set()) {
  const components = [];
  const length = abiParameters.length;
  for (let i = 0; i < length; i++) {
    const abiParameter = abiParameters[i];
    const isTuple = isTupleRegex2.test(abiParameter.type);
    if (isTuple)
      components.push(abiParameter);
    else {
      const match = execTyped2(typeWithoutTupleRegex, abiParameter.type);
      if (!match?.type)
        throw new InvalidAbiTypeParameterError2({ abiParameter });
      const { array, type } = match;
      if (type in structs) {
        if (ancestors.has(type))
          throw new CircularReferenceError2({ type });
        components.push({
          ...abiParameter,
          type: `tuple${array ?? ""}`,
          components: resolveStructs(structs[type], structs, /* @__PURE__ */ new Set([...ancestors, type]))
        });
      } else {
        if (isSolidityType2(type))
          components.push(abiParameter);
        else
          throw new UnknownTypeError2({ type });
      }
    }
  }
  return components;
}

// node_modules/abitype/dist/esm/human-readable/parseAbiItem.js
init_browser_buffer_global();

// node_modules/abitype/dist/esm/human-readable/parseAbiParameter.js
init_browser_buffer_global();

// node_modules/abitype/dist/esm/human-readable/parseAbiParameters.js
init_browser_buffer_global();
function parseAbiParameters2(params) {
  const abiParameters = [];
  if (typeof params === "string") {
    const parameters = splitParameters2(params);
    const length = parameters.length;
    for (let i = 0; i < length; i++) {
      abiParameters.push(parseAbiParameter3(parameters[i], { modifiers: modifiers2 }));
    }
  } else {
    const structs = parseStructs2(params);
    const length = params.length;
    for (let i = 0; i < length; i++) {
      const signature = params[i];
      if (isStructSignature2(signature))
        continue;
      const parameters = splitParameters2(signature);
      const length2 = parameters.length;
      for (let k = 0; k < length2; k++) {
        abiParameters.push(parseAbiParameter3(parameters[k], { modifiers: modifiers2, structs }));
      }
    }
  }
  if (abiParameters.length === 0)
    throw new InvalidAbiParametersError2({ params });
  return abiParameters;
}

// node_modules/ox/_esm/core/Address.js
init_browser_buffer_global();
init_Bytes();

// node_modules/ox/_esm/core/Caches.js
init_browser_buffer_global();

// node_modules/ox/_esm/core/internal/lru.js
init_browser_buffer_global();
var LruMap2 = class extends Map {
  constructor(size4) {
    super();
    Object.defineProperty(this, "maxSize", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.maxSize = size4;
  }
  get(key) {
    const value = super.get(key);
    if (super.has(key) && value !== void 0) {
      this.delete(key);
      super.set(key, value);
    }
    return value;
  }
  set(key, value) {
    super.set(key, value);
    if (this.maxSize && this.size > this.maxSize) {
      const firstKey = this.keys().next().value;
      if (firstKey)
        this.delete(firstKey);
    }
    return this;
  }
};

// node_modules/ox/_esm/core/Caches.js
var caches = {
  checksum: /* @__PURE__ */ new LruMap2(8192)
};
var checksum = caches.checksum;

// node_modules/ox/_esm/core/Address.js
init_Errors();

// node_modules/ox/_esm/core/Hash.js
init_browser_buffer_global();

// node_modules/ox/node_modules/@noble/hashes/esm/hmac.js
init_browser_buffer_global();

// node_modules/ox/node_modules/@noble/hashes/esm/utils.js
init_browser_buffer_global();

// node_modules/ox/node_modules/@noble/hashes/esm/crypto.js
init_browser_buffer_global();
var crypto3 = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;

// node_modules/ox/node_modules/@noble/hashes/esm/utils.js
function isBytes4(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function anumber2(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function abytes3(b, ...lengths) {
  if (!isBytes4(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function ahash(h) {
  if (typeof h !== "function" || typeof h.create !== "function")
    throw new Error("Hash should be wrapped by utils.createHasher");
  anumber2(h.outputLen);
  anumber2(h.blockLen);
}
function aexists2(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput2(out, instance) {
  abytes3(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
function u322(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean2(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView2(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr2(word, shift) {
  return word << 32 - shift | word >>> shift;
}
var isLE2 = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
function byteSwap2(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
function byteSwap322(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = byteSwap2(arr[i]);
  }
  return arr;
}
var swap32IfBE2 = isLE2 ? (u) => u : byteSwap322;
function utf8ToBytes2(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes3(data) {
  if (typeof data === "string")
    data = utf8ToBytes2(data);
  abytes3(data);
  return data;
}
function concatBytes3(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    abytes3(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad4 = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad4);
    pad4 += a.length;
  }
  return res;
}
var Hash2 = class {
};
function createHasher2(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes3(msg)).digest();
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}
function randomBytes(bytesLength = 32) {
  if (crypto3 && typeof crypto3.getRandomValues === "function") {
    return crypto3.getRandomValues(new Uint8Array(bytesLength));
  }
  if (crypto3 && typeof crypto3.randomBytes === "function") {
    return Uint8Array.from(crypto3.randomBytes(bytesLength));
  }
  throw new Error("crypto.getRandomValues must be defined");
}

// node_modules/ox/node_modules/@noble/hashes/esm/hmac.js
var HMAC = class extends Hash2 {
  constructor(hash2, _key) {
    super();
    this.finished = false;
    this.destroyed = false;
    ahash(hash2);
    const key = toBytes3(_key);
    this.iHash = hash2.create();
    if (typeof this.iHash.update !== "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen;
    this.outputLen = this.iHash.outputLen;
    const blockLen = this.blockLen;
    const pad4 = new Uint8Array(blockLen);
    pad4.set(key.length > blockLen ? hash2.create().update(key).digest() : key);
    for (let i = 0; i < pad4.length; i++)
      pad4[i] ^= 54;
    this.iHash.update(pad4);
    this.oHash = hash2.create();
    for (let i = 0; i < pad4.length; i++)
      pad4[i] ^= 54 ^ 92;
    this.oHash.update(pad4);
    clean2(pad4);
  }
  update(buf) {
    aexists2(this);
    this.iHash.update(buf);
    return this;
  }
  digestInto(out) {
    aexists2(this);
    abytes3(out, this.outputLen);
    this.finished = true;
    this.iHash.digestInto(out);
    this.oHash.update(out);
    this.oHash.digestInto(out);
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.oHash.outputLen);
    this.digestInto(out);
    return out;
  }
  _cloneInto(to) {
    to || (to = Object.create(Object.getPrototypeOf(this), {}));
    const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
    to = to;
    to.finished = finished;
    to.destroyed = destroyed;
    to.blockLen = blockLen;
    to.outputLen = outputLen;
    to.oHash = oHash._cloneInto(to.oHash);
    to.iHash = iHash._cloneInto(to.iHash);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = true;
    this.oHash.destroy();
    this.iHash.destroy();
  }
};
var hmac = (hash2, key, message) => new HMAC(hash2, key).update(message).digest();
hmac.create = (hash2, key) => new HMAC(hash2, key);

// node_modules/ox/node_modules/@noble/hashes/esm/ripemd160.js
init_browser_buffer_global();

// node_modules/ox/node_modules/@noble/hashes/esm/legacy.js
init_browser_buffer_global();

// node_modules/ox/node_modules/@noble/hashes/esm/_md.js
init_browser_buffer_global();
function setBigUint64(view, byteOffset, value, isLE3) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE3);
  const _32n3 = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n3 & _u32_max);
  const wl = Number(value & _u32_max);
  const h = isLE3 ? 4 : 0;
  const l = isLE3 ? 0 : 4;
  view.setUint32(byteOffset + h, wh, isLE3);
  view.setUint32(byteOffset + l, wl, isLE3);
}
function Chi2(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj2(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD2 = class extends Hash2 {
  constructor(blockLen, outputLen, padOffset, isLE3) {
    super();
    this.finished = false;
    this.length = 0;
    this.pos = 0;
    this.destroyed = false;
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE3;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView2(this.buffer);
  }
  update(data) {
    aexists2(this);
    data = toBytes3(data);
    abytes3(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView2(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists2(this);
    aoutput2(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE: isLE3 } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean2(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE3);
    this.process(view, 0);
    const oview = createView2(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE3);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to || (to = new this.constructor());
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA256_IV2 = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);

// node_modules/ox/node_modules/@noble/hashes/esm/sha3.js
init_browser_buffer_global();

// node_modules/ox/node_modules/@noble/hashes/esm/_u64.js
init_browser_buffer_global();
var U32_MASK642 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
var _32n2 = /* @__PURE__ */ BigInt(32);
function fromBig2(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK642), l: Number(n >> _32n2 & U32_MASK642) };
  return { h: Number(n >> _32n2 & U32_MASK642) | 0, l: Number(n & U32_MASK642) | 0 };
}
function split2(lst, le = false) {
  const len = lst.length;
  let Ah = new Uint32Array(len);
  let Al = new Uint32Array(len);
  for (let i = 0; i < len; i++) {
    const { h, l } = fromBig2(lst[i], le);
    [Ah[i], Al[i]] = [h, l];
  }
  return [Ah, Al];
}
var rotlSH2 = (h, l, s) => h << s | l >>> 32 - s;
var rotlSL2 = (h, l, s) => l << s | h >>> 32 - s;
var rotlBH2 = (h, l, s) => l << s - 32 | h >>> 64 - s;
var rotlBL2 = (h, l, s) => h << s - 32 | l >>> 64 - s;

// node_modules/ox/node_modules/@noble/hashes/esm/sha3.js
var _0n3 = BigInt(0);
var _1n3 = BigInt(1);
var _2n2 = BigInt(2);
var _7n2 = BigInt(7);
var _256n2 = BigInt(256);
var _0x71n2 = BigInt(113);
var SHA3_PI2 = [];
var SHA3_ROTL2 = [];
var _SHA3_IOTA2 = [];
for (let round = 0, R = _1n3, x = 1, y = 0; round < 24; round++) {
  [x, y] = [y, (2 * x + 3 * y) % 5];
  SHA3_PI2.push(2 * (5 * y + x));
  SHA3_ROTL2.push((round + 1) * (round + 2) / 2 % 64);
  let t = _0n3;
  for (let j = 0; j < 7; j++) {
    R = (R << _1n3 ^ (R >> _7n2) * _0x71n2) % _256n2;
    if (R & _2n2)
      t ^= _1n3 << (_1n3 << /* @__PURE__ */ BigInt(j)) - _1n3;
  }
  _SHA3_IOTA2.push(t);
}
var IOTAS2 = split2(_SHA3_IOTA2, true);
var SHA3_IOTA_H2 = IOTAS2[0];
var SHA3_IOTA_L2 = IOTAS2[1];
var rotlH2 = (h, l, s) => s > 32 ? rotlBH2(h, l, s) : rotlSH2(h, l, s);
var rotlL2 = (h, l, s) => s > 32 ? rotlBL2(h, l, s) : rotlSL2(h, l, s);
function keccakP2(s, rounds = 24) {
  const B = new Uint32Array(5 * 2);
  for (let round = 24 - rounds; round < 24; round++) {
    for (let x = 0; x < 10; x++)
      B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
    for (let x = 0; x < 10; x += 2) {
      const idx1 = (x + 8) % 10;
      const idx0 = (x + 2) % 10;
      const B0 = B[idx0];
      const B1 = B[idx0 + 1];
      const Th = rotlH2(B0, B1, 1) ^ B[idx1];
      const Tl = rotlL2(B0, B1, 1) ^ B[idx1 + 1];
      for (let y = 0; y < 50; y += 10) {
        s[x + y] ^= Th;
        s[x + y + 1] ^= Tl;
      }
    }
    let curH = s[2];
    let curL = s[3];
    for (let t = 0; t < 24; t++) {
      const shift = SHA3_ROTL2[t];
      const Th = rotlH2(curH, curL, shift);
      const Tl = rotlL2(curH, curL, shift);
      const PI = SHA3_PI2[t];
      curH = s[PI];
      curL = s[PI + 1];
      s[PI] = Th;
      s[PI + 1] = Tl;
    }
    for (let y = 0; y < 50; y += 10) {
      for (let x = 0; x < 10; x++)
        B[x] = s[y + x];
      for (let x = 0; x < 10; x++)
        s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
    }
    s[0] ^= SHA3_IOTA_H2[round];
    s[1] ^= SHA3_IOTA_L2[round];
  }
  clean2(B);
}
var Keccak2 = class _Keccak extends Hash2 {
  // NOTE: we accept arguments in bytes instead of bits here.
  constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
    super();
    this.pos = 0;
    this.posOut = 0;
    this.finished = false;
    this.destroyed = false;
    this.enableXOF = false;
    this.blockLen = blockLen;
    this.suffix = suffix;
    this.outputLen = outputLen;
    this.enableXOF = enableXOF;
    this.rounds = rounds;
    anumber2(outputLen);
    if (!(0 < blockLen && blockLen < 200))
      throw new Error("only keccak-f1600 function is supported");
    this.state = new Uint8Array(200);
    this.state32 = u322(this.state);
  }
  clone() {
    return this._cloneInto();
  }
  keccak() {
    swap32IfBE2(this.state32);
    keccakP2(this.state32, this.rounds);
    swap32IfBE2(this.state32);
    this.posOut = 0;
    this.pos = 0;
  }
  update(data) {
    aexists2(this);
    data = toBytes3(data);
    abytes3(data);
    const { blockLen, state } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      for (let i = 0; i < take; i++)
        state[this.pos++] ^= data[pos++];
      if (this.pos === blockLen)
        this.keccak();
    }
    return this;
  }
  finish() {
    if (this.finished)
      return;
    this.finished = true;
    const { state, suffix, pos, blockLen } = this;
    state[pos] ^= suffix;
    if ((suffix & 128) !== 0 && pos === blockLen - 1)
      this.keccak();
    state[blockLen - 1] ^= 128;
    this.keccak();
  }
  writeInto(out) {
    aexists2(this, false);
    abytes3(out);
    this.finish();
    const bufferOut = this.state;
    const { blockLen } = this;
    for (let pos = 0, len = out.length; pos < len; ) {
      if (this.posOut >= blockLen)
        this.keccak();
      const take = Math.min(blockLen - this.posOut, len - pos);
      out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
      this.posOut += take;
      pos += take;
    }
    return out;
  }
  xofInto(out) {
    if (!this.enableXOF)
      throw new Error("XOF is not possible for this instance");
    return this.writeInto(out);
  }
  xof(bytes) {
    anumber2(bytes);
    return this.xofInto(new Uint8Array(bytes));
  }
  digestInto(out) {
    aoutput2(out, this);
    if (this.finished)
      throw new Error("digest() was already called");
    this.writeInto(out);
    this.destroy();
    return out;
  }
  digest() {
    return this.digestInto(new Uint8Array(this.outputLen));
  }
  destroy() {
    this.destroyed = true;
    clean2(this.state);
  }
  _cloneInto(to) {
    const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
    to || (to = new _Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
    to.state32.set(this.state32);
    to.pos = this.pos;
    to.posOut = this.posOut;
    to.finished = this.finished;
    to.rounds = rounds;
    to.suffix = suffix;
    to.outputLen = outputLen;
    to.enableXOF = enableXOF;
    to.destroyed = this.destroyed;
    return to;
  }
};
var gen2 = (suffix, blockLen, outputLen) => createHasher2(() => new Keccak2(blockLen, suffix, outputLen));
var keccak_2562 = /* @__PURE__ */ (() => gen2(1, 136, 256 / 8))();

// node_modules/ox/node_modules/@noble/hashes/esm/sha256.js
init_browser_buffer_global();

// node_modules/ox/node_modules/@noble/hashes/esm/sha2.js
init_browser_buffer_global();
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA2562 = class extends HashMD2 {
  constructor(outputLen = 32) {
    super(64, outputLen, 8, false);
    this.A = SHA256_IV2[0] | 0;
    this.B = SHA256_IV2[1] | 0;
    this.C = SHA256_IV2[2] | 0;
    this.D = SHA256_IV2[3] | 0;
    this.E = SHA256_IV2[4] | 0;
    this.F = SHA256_IV2[5] | 0;
    this.G = SHA256_IV2[6] | 0;
    this.H = SHA256_IV2[7] | 0;
  }
  get() {
    const { A, B, C, D, E, F, G, H } = this;
    return [A, B, C, D, E, F, G, H];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr2(W15, 7) ^ rotr2(W15, 18) ^ W15 >>> 3;
      const s1 = rotr2(W2, 17) ^ rotr2(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr2(E, 6) ^ rotr2(E, 11) ^ rotr2(E, 25);
      const T1 = H + sigma1 + Chi2(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr2(A, 2) ^ rotr2(A, 13) ^ rotr2(A, 22);
      const T2 = sigma0 + Maj2(A, B, C) | 0;
      H = G;
      G = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G = G + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G, H);
  }
  roundClean() {
    clean2(SHA256_W);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean2(this.buffer);
  }
};
var sha2564 = /* @__PURE__ */ createHasher2(() => new SHA2562());

// node_modules/ox/_esm/core/Hash.js
init_Bytes();
init_Hex();
function keccak2562(value, options = {}) {
  const { as = typeof value === "string" ? "Hex" : "Bytes" } = options;
  const bytes = keccak_2562(from(value));
  if (as === "Bytes")
    return bytes;
  return fromBytes(bytes);
}

// node_modules/ox/_esm/core/PublicKey.js
init_browser_buffer_global();
init_Bytes();
init_Errors();
init_Hex();
init_Json();

// node_modules/ox/_esm/core/Address.js
var addressRegex2 = /^0x[a-fA-F0-9]{40}$/;
function assert(value, options = {}) {
  const { strict = true } = options;
  if (!addressRegex2.test(value))
    throw new InvalidAddressError2({
      address: value,
      cause: new InvalidInputError()
    });
  if (strict) {
    if (value.toLowerCase() === value)
      return;
    if (checksum2(value) !== value)
      throw new InvalidAddressError2({
        address: value,
        cause: new InvalidChecksumError()
      });
  }
}
function checksum2(address) {
  if (checksum.has(address))
    return checksum.get(address);
  assert(address, { strict: false });
  const hexAddress = address.substring(2).toLowerCase();
  const hash2 = keccak2562(fromString(hexAddress), { as: "Bytes" });
  const characters = hexAddress.split("");
  for (let i = 0; i < 40; i += 2) {
    if (hash2[i >> 1] >> 4 >= 8 && characters[i]) {
      characters[i] = characters[i].toUpperCase();
    }
    if ((hash2[i >> 1] & 15) >= 8 && characters[i + 1]) {
      characters[i + 1] = characters[i + 1].toUpperCase();
    }
  }
  const result = `0x${characters.join("")}`;
  checksum.set(address, result);
  return result;
}
var InvalidAddressError2 = class extends BaseError3 {
  constructor({ address, cause }) {
    super(`Address "${address}" is invalid.`, {
      cause
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Address.InvalidAddressError"
    });
  }
};
var InvalidInputError = class extends BaseError3 {
  constructor() {
    super("Address is not a 20 byte (40 hexadecimal character) value.");
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Address.InvalidInputError"
    });
  }
};
var InvalidChecksumError = class extends BaseError3 {
  constructor() {
    super("Address does not match its checksum counterpart.");
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Address.InvalidChecksumError"
    });
  }
};

// node_modules/ox/_esm/core/AbiParameters.js
init_Bytes();
init_Errors();
init_Hex();

// node_modules/ox/_esm/core/internal/abiParameters.js
init_browser_buffer_global();
init_Bytes();
init_Errors();
init_Hex();

// node_modules/ox/_esm/core/Solidity.js
init_browser_buffer_global();
var arrayRegex2 = /^(.*)\[([0-9]*)\]$/;
var bytesRegex4 = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
var integerRegex4 = /^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
var maxInt82 = 2n ** (8n - 1n) - 1n;
var maxInt162 = 2n ** (16n - 1n) - 1n;
var maxInt242 = 2n ** (24n - 1n) - 1n;
var maxInt322 = 2n ** (32n - 1n) - 1n;
var maxInt402 = 2n ** (40n - 1n) - 1n;
var maxInt482 = 2n ** (48n - 1n) - 1n;
var maxInt562 = 2n ** (56n - 1n) - 1n;
var maxInt642 = 2n ** (64n - 1n) - 1n;
var maxInt722 = 2n ** (72n - 1n) - 1n;
var maxInt802 = 2n ** (80n - 1n) - 1n;
var maxInt882 = 2n ** (88n - 1n) - 1n;
var maxInt962 = 2n ** (96n - 1n) - 1n;
var maxInt1042 = 2n ** (104n - 1n) - 1n;
var maxInt1122 = 2n ** (112n - 1n) - 1n;
var maxInt1202 = 2n ** (120n - 1n) - 1n;
var maxInt1282 = 2n ** (128n - 1n) - 1n;
var maxInt1362 = 2n ** (136n - 1n) - 1n;
var maxInt1442 = 2n ** (144n - 1n) - 1n;
var maxInt1522 = 2n ** (152n - 1n) - 1n;
var maxInt1602 = 2n ** (160n - 1n) - 1n;
var maxInt1682 = 2n ** (168n - 1n) - 1n;
var maxInt1762 = 2n ** (176n - 1n) - 1n;
var maxInt1842 = 2n ** (184n - 1n) - 1n;
var maxInt1922 = 2n ** (192n - 1n) - 1n;
var maxInt2002 = 2n ** (200n - 1n) - 1n;
var maxInt2082 = 2n ** (208n - 1n) - 1n;
var maxInt2162 = 2n ** (216n - 1n) - 1n;
var maxInt2242 = 2n ** (224n - 1n) - 1n;
var maxInt2322 = 2n ** (232n - 1n) - 1n;
var maxInt2402 = 2n ** (240n - 1n) - 1n;
var maxInt2482 = 2n ** (248n - 1n) - 1n;
var maxInt2562 = 2n ** (256n - 1n) - 1n;
var minInt82 = -(2n ** (8n - 1n));
var minInt162 = -(2n ** (16n - 1n));
var minInt242 = -(2n ** (24n - 1n));
var minInt322 = -(2n ** (32n - 1n));
var minInt402 = -(2n ** (40n - 1n));
var minInt482 = -(2n ** (48n - 1n));
var minInt562 = -(2n ** (56n - 1n));
var minInt642 = -(2n ** (64n - 1n));
var minInt722 = -(2n ** (72n - 1n));
var minInt802 = -(2n ** (80n - 1n));
var minInt882 = -(2n ** (88n - 1n));
var minInt962 = -(2n ** (96n - 1n));
var minInt1042 = -(2n ** (104n - 1n));
var minInt1122 = -(2n ** (112n - 1n));
var minInt1202 = -(2n ** (120n - 1n));
var minInt1282 = -(2n ** (128n - 1n));
var minInt1362 = -(2n ** (136n - 1n));
var minInt1442 = -(2n ** (144n - 1n));
var minInt1522 = -(2n ** (152n - 1n));
var minInt1602 = -(2n ** (160n - 1n));
var minInt1682 = -(2n ** (168n - 1n));
var minInt1762 = -(2n ** (176n - 1n));
var minInt1842 = -(2n ** (184n - 1n));
var minInt1922 = -(2n ** (192n - 1n));
var minInt2002 = -(2n ** (200n - 1n));
var minInt2082 = -(2n ** (208n - 1n));
var minInt2162 = -(2n ** (216n - 1n));
var minInt2242 = -(2n ** (224n - 1n));
var minInt2322 = -(2n ** (232n - 1n));
var minInt2402 = -(2n ** (240n - 1n));
var minInt2482 = -(2n ** (248n - 1n));
var minInt2562 = -(2n ** (256n - 1n));
var maxUint82 = 2n ** 8n - 1n;
var maxUint162 = 2n ** 16n - 1n;
var maxUint242 = 2n ** 24n - 1n;
var maxUint322 = 2n ** 32n - 1n;
var maxUint402 = 2n ** 40n - 1n;
var maxUint482 = 2n ** 48n - 1n;
var maxUint562 = 2n ** 56n - 1n;
var maxUint642 = 2n ** 64n - 1n;
var maxUint722 = 2n ** 72n - 1n;
var maxUint802 = 2n ** 80n - 1n;
var maxUint882 = 2n ** 88n - 1n;
var maxUint962 = 2n ** 96n - 1n;
var maxUint1042 = 2n ** 104n - 1n;
var maxUint1122 = 2n ** 112n - 1n;
var maxUint1202 = 2n ** 120n - 1n;
var maxUint1282 = 2n ** 128n - 1n;
var maxUint1362 = 2n ** 136n - 1n;
var maxUint1442 = 2n ** 144n - 1n;
var maxUint1522 = 2n ** 152n - 1n;
var maxUint1602 = 2n ** 160n - 1n;
var maxUint1682 = 2n ** 168n - 1n;
var maxUint1762 = 2n ** 176n - 1n;
var maxUint1842 = 2n ** 184n - 1n;
var maxUint1922 = 2n ** 192n - 1n;
var maxUint2002 = 2n ** 200n - 1n;
var maxUint2082 = 2n ** 208n - 1n;
var maxUint2162 = 2n ** 216n - 1n;
var maxUint2242 = 2n ** 224n - 1n;
var maxUint2322 = 2n ** 232n - 1n;
var maxUint2402 = 2n ** 240n - 1n;
var maxUint2482 = 2n ** 248n - 1n;
var maxUint2562 = 2n ** 256n - 1n;

// node_modules/ox/_esm/core/internal/cursor.js
init_browser_buffer_global();
init_Errors();
var staticCursor2 = {
  bytes: new Uint8Array(),
  dataView: new DataView(new ArrayBuffer(0)),
  position: 0,
  positionReadCount: /* @__PURE__ */ new Map(),
  recursiveReadCount: 0,
  recursiveReadLimit: Number.POSITIVE_INFINITY,
  assertReadLimit() {
    if (this.recursiveReadCount >= this.recursiveReadLimit)
      throw new RecursiveReadLimitExceededError2({
        count: this.recursiveReadCount + 1,
        limit: this.recursiveReadLimit
      });
  },
  assertPosition(position) {
    if (position < 0 || position > this.bytes.length - 1)
      throw new PositionOutOfBoundsError2({
        length: this.bytes.length,
        position
      });
  },
  decrementPosition(offset) {
    if (offset < 0)
      throw new NegativeOffsetError2({ offset });
    const position = this.position - offset;
    this.assertPosition(position);
    this.position = position;
  },
  getReadCount(position) {
    return this.positionReadCount.get(position || this.position) || 0;
  },
  incrementPosition(offset) {
    if (offset < 0)
      throw new NegativeOffsetError2({ offset });
    const position = this.position + offset;
    this.assertPosition(position);
    this.position = position;
  },
  inspectByte(position_) {
    const position = position_ ?? this.position;
    this.assertPosition(position);
    return this.bytes[position];
  },
  inspectBytes(length, position_) {
    const position = position_ ?? this.position;
    this.assertPosition(position + length - 1);
    return this.bytes.subarray(position, position + length);
  },
  inspectUint8(position_) {
    const position = position_ ?? this.position;
    this.assertPosition(position);
    return this.bytes[position];
  },
  inspectUint16(position_) {
    const position = position_ ?? this.position;
    this.assertPosition(position + 1);
    return this.dataView.getUint16(position);
  },
  inspectUint24(position_) {
    const position = position_ ?? this.position;
    this.assertPosition(position + 2);
    return (this.dataView.getUint16(position) << 8) + this.dataView.getUint8(position + 2);
  },
  inspectUint32(position_) {
    const position = position_ ?? this.position;
    this.assertPosition(position + 3);
    return this.dataView.getUint32(position);
  },
  pushByte(byte) {
    this.assertPosition(this.position);
    this.bytes[this.position] = byte;
    this.position++;
  },
  pushBytes(bytes) {
    this.assertPosition(this.position + bytes.length - 1);
    this.bytes.set(bytes, this.position);
    this.position += bytes.length;
  },
  pushUint8(value) {
    this.assertPosition(this.position);
    this.bytes[this.position] = value;
    this.position++;
  },
  pushUint16(value) {
    this.assertPosition(this.position + 1);
    this.dataView.setUint16(this.position, value);
    this.position += 2;
  },
  pushUint24(value) {
    this.assertPosition(this.position + 2);
    this.dataView.setUint16(this.position, value >> 8);
    this.dataView.setUint8(this.position + 2, value & ~4294967040);
    this.position += 3;
  },
  pushUint32(value) {
    this.assertPosition(this.position + 3);
    this.dataView.setUint32(this.position, value);
    this.position += 4;
  },
  readByte() {
    this.assertReadLimit();
    this._touch();
    const value = this.inspectByte();
    this.position++;
    return value;
  },
  readBytes(length, size4) {
    this.assertReadLimit();
    this._touch();
    const value = this.inspectBytes(length);
    this.position += size4 ?? length;
    return value;
  },
  readUint8() {
    this.assertReadLimit();
    this._touch();
    const value = this.inspectUint8();
    this.position += 1;
    return value;
  },
  readUint16() {
    this.assertReadLimit();
    this._touch();
    const value = this.inspectUint16();
    this.position += 2;
    return value;
  },
  readUint24() {
    this.assertReadLimit();
    this._touch();
    const value = this.inspectUint24();
    this.position += 3;
    return value;
  },
  readUint32() {
    this.assertReadLimit();
    this._touch();
    const value = this.inspectUint32();
    this.position += 4;
    return value;
  },
  get remaining() {
    return this.bytes.length - this.position;
  },
  setPosition(position) {
    const oldPosition = this.position;
    this.assertPosition(position);
    this.position = position;
    return () => this.position = oldPosition;
  },
  _touch() {
    if (this.recursiveReadLimit === Number.POSITIVE_INFINITY)
      return;
    const count = this.getReadCount();
    this.positionReadCount.set(this.position, count + 1);
    if (count > 0)
      this.recursiveReadCount++;
  }
};
var NegativeOffsetError2 = class extends BaseError3 {
  constructor({ offset }) {
    super(`Offset \`${offset}\` cannot be negative.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Cursor.NegativeOffsetError"
    });
  }
};
var PositionOutOfBoundsError2 = class extends BaseError3 {
  constructor({ length, position }) {
    super(`Position \`${position}\` is out of bounds (\`0 < position < ${length}\`).`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Cursor.PositionOutOfBoundsError"
    });
  }
};
var RecursiveReadLimitExceededError2 = class extends BaseError3 {
  constructor({ count, limit }) {
    super(`Recursive read limit of \`${limit}\` exceeded (recursive read count: \`${count}\`).`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Cursor.RecursiveReadLimitExceededError"
    });
  }
};

// node_modules/ox/_esm/core/AbiParameters.js
function encodePacked(types, values) {
  if (types.length !== values.length)
    throw new LengthMismatchError({
      expectedLength: types.length,
      givenLength: values.length
    });
  const data = [];
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const value = values[i];
    data.push(encodePacked.encode(type, value));
  }
  return concat2(...data);
}
(function(encodePacked3) {
  function encode3(type, value, isArray = false) {
    if (type === "address") {
      const address = value;
      assert(address);
      return padLeft(address.toLowerCase(), isArray ? 32 : 0);
    }
    if (type === "string")
      return fromString2(value);
    if (type === "bytes")
      return value;
    if (type === "bool")
      return padLeft(fromBoolean(value), isArray ? 32 : 1);
    const intMatch = type.match(integerRegex4);
    if (intMatch) {
      const [_type, baseType, bits = "256"] = intMatch;
      const size4 = Number.parseInt(bits, 10) / 8;
      return fromNumber(value, {
        size: isArray ? 32 : size4,
        signed: baseType === "int"
      });
    }
    const bytesMatch = type.match(bytesRegex4);
    if (bytesMatch) {
      const [_type, size4] = bytesMatch;
      if (Number.parseInt(size4, 10) !== (value.length - 2) / 2)
        throw new BytesSizeMismatchError2({
          expectedSize: Number.parseInt(size4, 10),
          value
        });
      return padRight(value, isArray ? 32 : 0);
    }
    const arrayMatch = type.match(arrayRegex2);
    if (arrayMatch && Array.isArray(value)) {
      const [_type, childType] = arrayMatch;
      const data = [];
      for (let i = 0; i < value.length; i++) {
        data.push(encode3(childType, value[i], true));
      }
      if (data.length === 0)
        return "0x";
      return concat2(...data);
    }
    throw new InvalidTypeError(type);
  }
  encodePacked3.encode = encode3;
})(encodePacked || (encodePacked = {}));
function from3(parameters) {
  if (Array.isArray(parameters) && typeof parameters[0] === "string")
    return parseAbiParameters2(parameters);
  if (typeof parameters === "string")
    return parseAbiParameters2(parameters);
  return parameters;
}
var BytesSizeMismatchError2 = class extends BaseError3 {
  constructor({ expectedSize, value }) {
    super(`Size of bytes "${value}" (bytes${size3(value)}) does not match expected size (bytes${expectedSize}).`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "AbiParameters.BytesSizeMismatchError"
    });
  }
};
var LengthMismatchError = class extends BaseError3 {
  constructor({ expectedLength, givenLength }) {
    super([
      "ABI encoding parameters/values length mismatch.",
      `Expected length (parameters): ${expectedLength}`,
      `Given length (values): ${givenLength}`
    ].join("\n"));
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "AbiParameters.LengthMismatchError"
    });
  }
};
var InvalidTypeError = class extends BaseError3 {
  constructor(type) {
    super(`Type \`${type}\` is not a valid ABI Type.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "AbiParameters.InvalidTypeError"
    });
  }
};

// node_modules/ox/_esm/core/Authorization.js
init_browser_buffer_global();
init_Hex();

// node_modules/ox/_esm/core/Rlp.js
init_browser_buffer_global();
init_Bytes();
init_Errors();
init_Hex();

// node_modules/ox/_esm/core/Signature.js
init_browser_buffer_global();

// node_modules/ox/node_modules/@noble/curves/esm/secp256k1.js
init_browser_buffer_global();

// node_modules/ox/node_modules/@noble/curves/esm/_shortw_utils.js
init_browser_buffer_global();

// node_modules/ox/node_modules/@noble/curves/esm/abstract/weierstrass.js
init_browser_buffer_global();

// node_modules/ox/node_modules/@noble/curves/esm/abstract/curve.js
init_browser_buffer_global();

// node_modules/ox/node_modules/@noble/curves/esm/abstract/modular.js
init_browser_buffer_global();
init_utils4();
var _0n4 = BigInt(0);
var _1n4 = BigInt(1);
var _2n3 = /* @__PURE__ */ BigInt(2);
var _3n = /* @__PURE__ */ BigInt(3);
var _4n = /* @__PURE__ */ BigInt(4);
var _5n = /* @__PURE__ */ BigInt(5);
var _8n = /* @__PURE__ */ BigInt(8);
function mod(a, b) {
  const result = a % b;
  return result >= _0n4 ? result : b + result;
}
function pow2(x, power, modulo) {
  let res = x;
  while (power-- > _0n4) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number, modulo) {
  if (number === _0n4)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _0n4)
    throw new Error("invert: expected positive modulus, got " + modulo);
  let a = mod(number, modulo);
  let b = modulo;
  let x = _0n4, y = _1n4, u = _1n4, v = _0n4;
  while (a !== _0n4) {
    const q = b / a;
    const r = b % a;
    const m = x - u * q;
    const n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  const gcd = b;
  if (gcd !== _1n4)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function sqrt3mod4(Fp, n) {
  const p1div4 = (Fp.ORDER + _1n4) / _4n;
  const root = Fp.pow(n, p1div4);
  if (!Fp.eql(Fp.sqr(root), n))
    throw new Error("Cannot find square root");
  return root;
}
function sqrt5mod8(Fp, n) {
  const p5div8 = (Fp.ORDER - _5n) / _8n;
  const n2 = Fp.mul(n, _2n3);
  const v = Fp.pow(n2, p5div8);
  const nv = Fp.mul(n, v);
  const i = Fp.mul(Fp.mul(nv, _2n3), v);
  const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
  if (!Fp.eql(Fp.sqr(root), n))
    throw new Error("Cannot find square root");
  return root;
}
function tonelliShanks(P) {
  if (P < BigInt(3))
    throw new Error("sqrt is not defined for small field");
  let Q = P - _1n4;
  let S = 0;
  while (Q % _2n3 === _0n4) {
    Q /= _2n3;
    S++;
  }
  let Z = _2n3;
  const _Fp = Field(P);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1e3)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n4) / _2n3;
  return function tonelliSlow(Fp, n) {
    if (Fp.is0(n))
      return n;
    if (FpLegendre(Fp, n) !== 1)
      throw new Error("Cannot find square root");
    let M = S;
    let c = Fp.mul(Fp.ONE, cc);
    let t = Fp.pow(n, Q);
    let R = Fp.pow(n, Q1div2);
    while (!Fp.eql(t, Fp.ONE)) {
      if (Fp.is0(t))
        return Fp.ZERO;
      let i = 1;
      let t_tmp = Fp.sqr(t);
      while (!Fp.eql(t_tmp, Fp.ONE)) {
        i++;
        t_tmp = Fp.sqr(t_tmp);
        if (i === M)
          throw new Error("Cannot find square root");
      }
      const exponent = _1n4 << BigInt(M - i - 1);
      const b = Fp.pow(c, exponent);
      M = i;
      c = Fp.sqr(b);
      t = Fp.mul(t, c);
      R = Fp.mul(R, b);
    }
    return R;
  };
}
function FpSqrt(P) {
  if (P % _4n === _3n)
    return sqrt3mod4;
  if (P % _8n === _5n)
    return sqrt5mod8;
  return tonelliShanks(P);
}
var FIELD_FIELDS = [
  "create",
  "isValid",
  "is0",
  "neg",
  "inv",
  "sqrt",
  "sqr",
  "eql",
  "add",
  "sub",
  "mul",
  "pow",
  "div",
  "addN",
  "subN",
  "mulN",
  "sqrN"
];
function validateField(field) {
  const initial = {
    ORDER: "bigint",
    MASK: "bigint",
    BYTES: "isSafeInteger",
    BITS: "isSafeInteger"
  };
  const opts = FIELD_FIELDS.reduce((map, val) => {
    map[val] = "function";
    return map;
  }, initial);
  return validateObject(field, opts);
}
function FpPow(Fp, num, power) {
  if (power < _0n4)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n4)
    return Fp.ONE;
  if (power === _1n4)
    return num;
  let p = Fp.ONE;
  let d = num;
  while (power > _0n4) {
    if (power & _1n4)
      p = Fp.mul(p, d);
    d = Fp.sqr(d);
    power >>= _1n4;
  }
  return p;
}
function FpInvertBatch(Fp, nums, passZero = false) {
  const inverted = new Array(nums.length).fill(passZero ? Fp.ZERO : void 0);
  const multipliedAcc = nums.reduce((acc, num, i) => {
    if (Fp.is0(num))
      return acc;
    inverted[i] = acc;
    return Fp.mul(acc, num);
  }, Fp.ONE);
  const invertedAcc = Fp.inv(multipliedAcc);
  nums.reduceRight((acc, num, i) => {
    if (Fp.is0(num))
      return acc;
    inverted[i] = Fp.mul(acc, inverted[i]);
    return Fp.mul(acc, num);
  }, invertedAcc);
  return inverted;
}
function FpLegendre(Fp, n) {
  const p1mod2 = (Fp.ORDER - _1n4) / _2n3;
  const powered = Fp.pow(n, p1mod2);
  const yes = Fp.eql(powered, Fp.ONE);
  const zero = Fp.eql(powered, Fp.ZERO);
  const no = Fp.eql(powered, Fp.neg(Fp.ONE));
  if (!yes && !zero && !no)
    throw new Error("invalid Legendre symbol result");
  return yes ? 1 : zero ? 0 : -1;
}
function nLength(n, nBitLength) {
  if (nBitLength !== void 0)
    anumber2(nBitLength);
  const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
function Field(ORDER, bitLen2, isLE3 = false, redef = {}) {
  if (ORDER <= _0n4)
    throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
  const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen2);
  if (BYTES > 2048)
    throw new Error("invalid field: expected ORDER of <= 2048 bytes");
  let sqrtP;
  const f = Object.freeze({
    ORDER,
    isLE: isLE3,
    BITS,
    BYTES,
    MASK: bitMask(BITS),
    ZERO: _0n4,
    ONE: _1n4,
    create: (num) => mod(num, ORDER),
    isValid: (num) => {
      if (typeof num !== "bigint")
        throw new Error("invalid field element: expected bigint, got " + typeof num);
      return _0n4 <= num && num < ORDER;
    },
    is0: (num) => num === _0n4,
    isOdd: (num) => (num & _1n4) === _1n4,
    neg: (num) => mod(-num, ORDER),
    eql: (lhs, rhs) => lhs === rhs,
    sqr: (num) => mod(num * num, ORDER),
    add: (lhs, rhs) => mod(lhs + rhs, ORDER),
    sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
    mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
    pow: (num, power) => FpPow(f, num, power),
    div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
    // Same as above, but doesn't normalize
    sqrN: (num) => num * num,
    addN: (lhs, rhs) => lhs + rhs,
    subN: (lhs, rhs) => lhs - rhs,
    mulN: (lhs, rhs) => lhs * rhs,
    inv: (num) => invert(num, ORDER),
    sqrt: redef.sqrt || ((n) => {
      if (!sqrtP)
        sqrtP = FpSqrt(ORDER);
      return sqrtP(f, n);
    }),
    toBytes: (num) => isLE3 ? numberToBytesLE(num, BYTES) : numberToBytesBE(num, BYTES),
    fromBytes: (bytes) => {
      if (bytes.length !== BYTES)
        throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
      return isLE3 ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
    },
    // TODO: we don't need it here, move out to separate fn
    invertBatch: (lst) => FpInvertBatch(f, lst),
    // We can't move this out because Fp6, Fp12 implement it
    // and it's unclear what to return in there.
    cmov: (a, b, c) => c ? b : a
  });
  return Object.freeze(f);
}
function getFieldBytesLength(fieldOrder) {
  if (typeof fieldOrder !== "bigint")
    throw new Error("field order must be bigint");
  const bitLength = fieldOrder.toString(2).length;
  return Math.ceil(bitLength / 8);
}
function getMinHashLength(fieldOrder) {
  const length = getFieldBytesLength(fieldOrder);
  return length + Math.ceil(length / 2);
}
function mapHashToField(key, fieldOrder, isLE3 = false) {
  const len = key.length;
  const fieldLen = getFieldBytesLength(fieldOrder);
  const minLen = getMinHashLength(fieldOrder);
  if (len < 16 || len < minLen || len > 1024)
    throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
  const num = isLE3 ? bytesToNumberLE(key) : bytesToNumberBE(key);
  const reduced = mod(num, fieldOrder - _1n4) + _1n4;
  return isLE3 ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}

// node_modules/ox/node_modules/@noble/curves/esm/abstract/curve.js
init_utils4();
var _0n5 = BigInt(0);
var _1n5 = BigInt(1);
function constTimeNegate(condition, item) {
  const neg = item.negate();
  return condition ? neg : item;
}
function validateW(W, bits) {
  if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
    throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
}
function calcWOpts(W, scalarBits) {
  validateW(W, scalarBits);
  const windows = Math.ceil(scalarBits / W) + 1;
  const windowSize = 2 ** (W - 1);
  const maxNumber = 2 ** W;
  const mask = bitMask(W);
  const shiftBy = BigInt(W);
  return { windows, windowSize, mask, maxNumber, shiftBy };
}
function calcOffsets(n, window2, wOpts) {
  const { windowSize, mask, maxNumber, shiftBy } = wOpts;
  let wbits = Number(n & mask);
  let nextN = n >> shiftBy;
  if (wbits > windowSize) {
    wbits -= maxNumber;
    nextN += _1n5;
  }
  const offsetStart = window2 * windowSize;
  const offset = offsetStart + Math.abs(wbits) - 1;
  const isZero = wbits === 0;
  const isNeg = wbits < 0;
  const isNegF = window2 % 2 !== 0;
  const offsetF = offsetStart;
  return { nextN, offset, isZero, isNeg, isNegF, offsetF };
}
function validateMSMPoints(points, c) {
  if (!Array.isArray(points))
    throw new Error("array expected");
  points.forEach((p, i) => {
    if (!(p instanceof c))
      throw new Error("invalid point at index " + i);
  });
}
function validateMSMScalars(scalars, field) {
  if (!Array.isArray(scalars))
    throw new Error("array of scalars expected");
  scalars.forEach((s, i) => {
    if (!field.isValid(s))
      throw new Error("invalid scalar at index " + i);
  });
}
var pointPrecomputes = /* @__PURE__ */ new WeakMap();
var pointWindowSizes = /* @__PURE__ */ new WeakMap();
function getW(P) {
  return pointWindowSizes.get(P) || 1;
}
function wNAF(c, bits) {
  return {
    constTimeNegate,
    hasPrecomputes(elm) {
      return getW(elm) !== 1;
    },
    // non-const time multiplication ladder
    unsafeLadder(elm, n, p = c.ZERO) {
      let d = elm;
      while (n > _0n5) {
        if (n & _1n5)
          p = p.add(d);
        d = d.double();
        n >>= _1n5;
      }
      return p;
    },
    /**
     * Creates a wNAF precomputation window. Used for caching.
     * Default window size is set by `utils.precompute()` and is equal to 8.
     * Number of precomputed points depends on the curve size:
     * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
     * - 𝑊 is the window size
     * - 𝑛 is the bitlength of the curve order.
     * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
     * @param elm Point instance
     * @param W window size
     * @returns precomputed point tables flattened to a single array
     */
    precomputeWindow(elm, W) {
      const { windows, windowSize } = calcWOpts(W, bits);
      const points = [];
      let p = elm;
      let base = p;
      for (let window2 = 0; window2 < windows; window2++) {
        base = p;
        points.push(base);
        for (let i = 1; i < windowSize; i++) {
          base = base.add(p);
          points.push(base);
        }
        p = base.double();
      }
      return points;
    },
    /**
     * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
     * @param W window size
     * @param precomputes precomputed tables
     * @param n scalar (we don't check here, but should be less than curve order)
     * @returns real and fake (for const-time) points
     */
    wNAF(W, precomputes, n) {
      let p = c.ZERO;
      let f = c.BASE;
      const wo = calcWOpts(W, bits);
      for (let window2 = 0; window2 < wo.windows; window2++) {
        const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window2, wo);
        n = nextN;
        if (isZero) {
          f = f.add(constTimeNegate(isNegF, precomputes[offsetF]));
        } else {
          p = p.add(constTimeNegate(isNeg, precomputes[offset]));
        }
      }
      return { p, f };
    },
    /**
     * Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
     * @param W window size
     * @param precomputes precomputed tables
     * @param n scalar (we don't check here, but should be less than curve order)
     * @param acc accumulator point to add result of multiplication
     * @returns point
     */
    wNAFUnsafe(W, precomputes, n, acc = c.ZERO) {
      const wo = calcWOpts(W, bits);
      for (let window2 = 0; window2 < wo.windows; window2++) {
        if (n === _0n5)
          break;
        const { nextN, offset, isZero, isNeg } = calcOffsets(n, window2, wo);
        n = nextN;
        if (isZero) {
          continue;
        } else {
          const item = precomputes[offset];
          acc = acc.add(isNeg ? item.negate() : item);
        }
      }
      return acc;
    },
    getPrecomputes(W, P, transform) {
      let comp = pointPrecomputes.get(P);
      if (!comp) {
        comp = this.precomputeWindow(P, W);
        if (W !== 1)
          pointPrecomputes.set(P, transform(comp));
      }
      return comp;
    },
    wNAFCached(P, n, transform) {
      const W = getW(P);
      return this.wNAF(W, this.getPrecomputes(W, P, transform), n);
    },
    wNAFCachedUnsafe(P, n, transform, prev) {
      const W = getW(P);
      if (W === 1)
        return this.unsafeLadder(P, n, prev);
      return this.wNAFUnsafe(W, this.getPrecomputes(W, P, transform), n, prev);
    },
    // We calculate precomputes for elliptic curve point multiplication
    // using windowed method. This specifies window size and
    // stores precomputed values. Usually only base point would be precomputed.
    setWindowSize(P, W) {
      validateW(W, bits);
      pointWindowSizes.set(P, W);
      pointPrecomputes.delete(P);
    }
  };
}
function pippenger(c, fieldN, points, scalars) {
  validateMSMPoints(points, c);
  validateMSMScalars(scalars, fieldN);
  const plength = points.length;
  const slength = scalars.length;
  if (plength !== slength)
    throw new Error("arrays of points and scalars must have equal length");
  const zero = c.ZERO;
  const wbits = bitLen(BigInt(plength));
  let windowSize = 1;
  if (wbits > 12)
    windowSize = wbits - 3;
  else if (wbits > 4)
    windowSize = wbits - 2;
  else if (wbits > 0)
    windowSize = 2;
  const MASK = bitMask(windowSize);
  const buckets = new Array(Number(MASK) + 1).fill(zero);
  const lastBits = Math.floor((fieldN.BITS - 1) / windowSize) * windowSize;
  let sum = zero;
  for (let i = lastBits; i >= 0; i -= windowSize) {
    buckets.fill(zero);
    for (let j = 0; j < slength; j++) {
      const scalar = scalars[j];
      const wbits2 = Number(scalar >> BigInt(i) & MASK);
      buckets[wbits2] = buckets[wbits2].add(points[j]);
    }
    let resI = zero;
    for (let j = buckets.length - 1, sumI = zero; j > 0; j--) {
      sumI = sumI.add(buckets[j]);
      resI = resI.add(sumI);
    }
    sum = sum.add(resI);
    if (i !== 0)
      for (let j = 0; j < windowSize; j++)
        sum = sum.double();
  }
  return sum;
}
function validateBasic(curve) {
  validateField(curve.Fp);
  validateObject(curve, {
    n: "bigint",
    h: "bigint",
    Gx: "field",
    Gy: "field"
  }, {
    nBitLength: "isSafeInteger",
    nByteLength: "isSafeInteger"
  });
  return Object.freeze({
    ...nLength(curve.n, curve.nBitLength),
    ...curve,
    ...{ p: curve.Fp.ORDER }
  });
}

// node_modules/ox/node_modules/@noble/curves/esm/abstract/weierstrass.js
init_utils4();
function validateSigVerOpts(opts) {
  if (opts.lowS !== void 0)
    abool("lowS", opts.lowS);
  if (opts.prehash !== void 0)
    abool("prehash", opts.prehash);
}
function validatePointOpts(curve) {
  const opts = validateBasic(curve);
  validateObject(opts, {
    a: "field",
    b: "field"
  }, {
    allowInfinityPoint: "boolean",
    allowedPrivateKeyLengths: "array",
    clearCofactor: "function",
    fromBytes: "function",
    isTorsionFree: "function",
    toBytes: "function",
    wrapPrivateKey: "boolean"
  });
  const { endo, Fp, a } = opts;
  if (endo) {
    if (!Fp.eql(a, Fp.ZERO)) {
      throw new Error("invalid endo: CURVE.a must be 0");
    }
    if (typeof endo !== "object" || typeof endo.beta !== "bigint" || typeof endo.splitScalar !== "function") {
      throw new Error('invalid endo: expected "beta": bigint and "splitScalar": function');
    }
  }
  return Object.freeze({ ...opts });
}
var DERErr = class extends Error {
  constructor(m = "") {
    super(m);
  }
};
var DER = {
  // asn.1 DER encoding utils
  Err: DERErr,
  // Basic building block is TLV (Tag-Length-Value)
  _tlv: {
    encode: (tag, data) => {
      const { Err: E } = DER;
      if (tag < 0 || tag > 256)
        throw new E("tlv.encode: wrong tag");
      if (data.length & 1)
        throw new E("tlv.encode: unpadded data");
      const dataLen = data.length / 2;
      const len = numberToHexUnpadded(dataLen);
      if (len.length / 2 & 128)
        throw new E("tlv.encode: long form length too big");
      const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
      const t = numberToHexUnpadded(tag);
      return t + lenLen + len + data;
    },
    // v - value, l - left bytes (unparsed)
    decode(tag, data) {
      const { Err: E } = DER;
      let pos = 0;
      if (tag < 0 || tag > 256)
        throw new E("tlv.encode: wrong tag");
      if (data.length < 2 || data[pos++] !== tag)
        throw new E("tlv.decode: wrong tlv");
      const first = data[pos++];
      const isLong = !!(first & 128);
      let length = 0;
      if (!isLong)
        length = first;
      else {
        const lenLen = first & 127;
        if (!lenLen)
          throw new E("tlv.decode(long): indefinite length not supported");
        if (lenLen > 4)
          throw new E("tlv.decode(long): byte length is too big");
        const lengthBytes = data.subarray(pos, pos + lenLen);
        if (lengthBytes.length !== lenLen)
          throw new E("tlv.decode: length bytes not complete");
        if (lengthBytes[0] === 0)
          throw new E("tlv.decode(long): zero leftmost byte");
        for (const b of lengthBytes)
          length = length << 8 | b;
        pos += lenLen;
        if (length < 128)
          throw new E("tlv.decode(long): not minimal encoding");
      }
      const v = data.subarray(pos, pos + length);
      if (v.length !== length)
        throw new E("tlv.decode: wrong value length");
      return { v, l: data.subarray(pos + length) };
    }
  },
  // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
  // since we always use positive integers here. It must always be empty:
  // - add zero byte if exists
  // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
  _int: {
    encode(num) {
      const { Err: E } = DER;
      if (num < _0n6)
        throw new E("integer: negative integers are not allowed");
      let hex = numberToHexUnpadded(num);
      if (Number.parseInt(hex[0], 16) & 8)
        hex = "00" + hex;
      if (hex.length & 1)
        throw new E("unexpected DER parsing assertion: unpadded hex");
      return hex;
    },
    decode(data) {
      const { Err: E } = DER;
      if (data[0] & 128)
        throw new E("invalid signature integer: negative");
      if (data[0] === 0 && !(data[1] & 128))
        throw new E("invalid signature integer: unnecessary leading zero");
      return bytesToNumberBE(data);
    }
  },
  toSig(hex) {
    const { Err: E, _int: int, _tlv: tlv } = DER;
    const data = ensureBytes("signature", hex);
    const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
    if (seqLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
    const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
    if (sLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    return { r: int.decode(rBytes), s: int.decode(sBytes) };
  },
  hexFromSig(sig) {
    const { _tlv: tlv, _int: int } = DER;
    const rs = tlv.encode(2, int.encode(sig.r));
    const ss = tlv.encode(2, int.encode(sig.s));
    const seq = rs + ss;
    return tlv.encode(48, seq);
  }
};
function numToSizedHex(num, size4) {
  return bytesToHex2(numberToBytesBE(num, size4));
}
var _0n6 = BigInt(0);
var _1n6 = BigInt(1);
var _2n4 = BigInt(2);
var _3n2 = BigInt(3);
var _4n2 = BigInt(4);
function weierstrassPoints(opts) {
  const CURVE = validatePointOpts(opts);
  const { Fp } = CURVE;
  const Fn = Field(CURVE.n, CURVE.nBitLength);
  const toBytes5 = CURVE.toBytes || ((_c, point, _isCompressed) => {
    const a = point.toAffine();
    return concatBytes2(Uint8Array.from([4]), Fp.toBytes(a.x), Fp.toBytes(a.y));
  });
  const fromBytes3 = CURVE.fromBytes || ((bytes) => {
    const tail = bytes.subarray(1);
    const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
    const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
    return { x, y };
  });
  function weierstrassEquation(x) {
    const { a, b } = CURVE;
    const x2 = Fp.sqr(x);
    const x3 = Fp.mul(x2, x);
    return Fp.add(Fp.add(x3, Fp.mul(x, a)), b);
  }
  function isValidXY(x, y) {
    const left = Fp.sqr(y);
    const right = weierstrassEquation(x);
    return Fp.eql(left, right);
  }
  if (!isValidXY(CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n2), _4n2);
  const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
  if (Fp.is0(Fp.add(_4a3, _27b2)))
    throw new Error("bad curve params: a or b");
  function isWithinCurveOrder(num) {
    return inRange(num, _1n6, CURVE.n);
  }
  function normPrivateKeyToScalar(key) {
    const { allowedPrivateKeyLengths: lengths, nByteLength, wrapPrivateKey, n: N } = CURVE;
    if (lengths && typeof key !== "bigint") {
      if (isBytes3(key))
        key = bytesToHex2(key);
      if (typeof key !== "string" || !lengths.includes(key.length))
        throw new Error("invalid private key");
      key = key.padStart(nByteLength * 2, "0");
    }
    let num;
    try {
      num = typeof key === "bigint" ? key : bytesToNumberBE(ensureBytes("private key", key, nByteLength));
    } catch (error) {
      throw new Error("invalid private key, expected hex or " + nByteLength + " bytes, got " + typeof key);
    }
    if (wrapPrivateKey)
      num = mod(num, N);
    aInRange("private key", num, _1n6, N);
    return num;
  }
  function aprjpoint(other) {
    if (!(other instanceof Point))
      throw new Error("ProjectivePoint expected");
  }
  const toAffineMemo = memoized((p, iz) => {
    const { px: x, py: y, pz: z } = p;
    if (Fp.eql(z, Fp.ONE))
      return { x, y };
    const is0 = p.is0();
    if (iz == null)
      iz = is0 ? Fp.ONE : Fp.inv(z);
    const ax = Fp.mul(x, iz);
    const ay = Fp.mul(y, iz);
    const zz = Fp.mul(z, iz);
    if (is0)
      return { x: Fp.ZERO, y: Fp.ZERO };
    if (!Fp.eql(zz, Fp.ONE))
      throw new Error("invZ was invalid");
    return { x: ax, y: ay };
  });
  const assertValidMemo = memoized((p) => {
    if (p.is0()) {
      if (CURVE.allowInfinityPoint && !Fp.is0(p.py))
        return;
      throw new Error("bad point: ZERO");
    }
    const { x, y } = p.toAffine();
    if (!Fp.isValid(x) || !Fp.isValid(y))
      throw new Error("bad point: x or y not FE");
    if (!isValidXY(x, y))
      throw new Error("bad point: equation left != right");
    if (!p.isTorsionFree())
      throw new Error("bad point: not in prime-order subgroup");
    return true;
  });
  class Point {
    constructor(px, py, pz) {
      if (px == null || !Fp.isValid(px))
        throw new Error("x required");
      if (py == null || !Fp.isValid(py) || Fp.is0(py))
        throw new Error("y required");
      if (pz == null || !Fp.isValid(pz))
        throw new Error("z required");
      this.px = px;
      this.py = py;
      this.pz = pz;
      Object.freeze(this);
    }
    // Does not validate if the point is on-curve.
    // Use fromHex instead, or call assertValidity() later.
    static fromAffine(p) {
      const { x, y } = p || {};
      if (!p || !Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("invalid affine point");
      if (p instanceof Point)
        throw new Error("projective point not allowed");
      const is0 = (i) => Fp.eql(i, Fp.ZERO);
      if (is0(x) && is0(y))
        return Point.ZERO;
      return new Point(x, y, Fp.ONE);
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    /**
     * Takes a bunch of Projective Points but executes only one
     * inversion on all of them. Inversion is very slow operation,
     * so this improves performance massively.
     * Optimization: converts a list of projective points to a list of identical points with Z=1.
     */
    static normalizeZ(points) {
      const toInv = FpInvertBatch(Fp, points.map((p) => p.pz));
      return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
    }
    /**
     * Converts hash string or Uint8Array to Point.
     * @param hex short/long ECDSA hex
     */
    static fromHex(hex) {
      const P = Point.fromAffine(fromBytes3(ensureBytes("pointHex", hex)));
      P.assertValidity();
      return P;
    }
    // Multiplies generator point by privateKey.
    static fromPrivateKey(privateKey) {
      return Point.BASE.multiply(normPrivateKeyToScalar(privateKey));
    }
    // Multiscalar Multiplication
    static msm(points, scalars) {
      return pippenger(Point, Fn, points, scalars);
    }
    // "Private method", don't use it directly
    _setWindowSize(windowSize) {
      wnaf.setWindowSize(this, windowSize);
    }
    // A point on curve is valid if it conforms to equation.
    assertValidity() {
      assertValidMemo(this);
    }
    hasEvenY() {
      const { y } = this.toAffine();
      if (Fp.isOdd)
        return !Fp.isOdd(y);
      throw new Error("Field doesn't support isOdd");
    }
    /**
     * Compare one point to another.
     */
    equals(other) {
      aprjpoint(other);
      const { px: X1, py: Y1, pz: Z1 } = this;
      const { px: X2, py: Y2, pz: Z2 } = other;
      const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
      const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
      return U1 && U2;
    }
    /**
     * Flips point to one corresponding to (x, -y) in Affine coordinates.
     */
    negate() {
      return new Point(this.px, Fp.neg(this.py), this.pz);
    }
    // Renes-Costello-Batina exception-free doubling formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 3
    // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
    double() {
      const { a, b } = CURVE;
      const b3 = Fp.mul(b, _3n2);
      const { px: X1, py: Y1, pz: Z1 } = this;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      let t0 = Fp.mul(X1, X1);
      let t1 = Fp.mul(Y1, Y1);
      let t2 = Fp.mul(Z1, Z1);
      let t3 = Fp.mul(X1, Y1);
      t3 = Fp.add(t3, t3);
      Z3 = Fp.mul(X1, Z1);
      Z3 = Fp.add(Z3, Z3);
      X3 = Fp.mul(a, Z3);
      Y3 = Fp.mul(b3, t2);
      Y3 = Fp.add(X3, Y3);
      X3 = Fp.sub(t1, Y3);
      Y3 = Fp.add(t1, Y3);
      Y3 = Fp.mul(X3, Y3);
      X3 = Fp.mul(t3, X3);
      Z3 = Fp.mul(b3, Z3);
      t2 = Fp.mul(a, t2);
      t3 = Fp.sub(t0, t2);
      t3 = Fp.mul(a, t3);
      t3 = Fp.add(t3, Z3);
      Z3 = Fp.add(t0, t0);
      t0 = Fp.add(Z3, t0);
      t0 = Fp.add(t0, t2);
      t0 = Fp.mul(t0, t3);
      Y3 = Fp.add(Y3, t0);
      t2 = Fp.mul(Y1, Z1);
      t2 = Fp.add(t2, t2);
      t0 = Fp.mul(t2, t3);
      X3 = Fp.sub(X3, t0);
      Z3 = Fp.mul(t2, t1);
      Z3 = Fp.add(Z3, Z3);
      Z3 = Fp.add(Z3, Z3);
      return new Point(X3, Y3, Z3);
    }
    // Renes-Costello-Batina exception-free addition formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 1
    // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
    add(other) {
      aprjpoint(other);
      const { px: X1, py: Y1, pz: Z1 } = this;
      const { px: X2, py: Y2, pz: Z2 } = other;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      const a = CURVE.a;
      const b3 = Fp.mul(CURVE.b, _3n2);
      let t0 = Fp.mul(X1, X2);
      let t1 = Fp.mul(Y1, Y2);
      let t2 = Fp.mul(Z1, Z2);
      let t3 = Fp.add(X1, Y1);
      let t4 = Fp.add(X2, Y2);
      t3 = Fp.mul(t3, t4);
      t4 = Fp.add(t0, t1);
      t3 = Fp.sub(t3, t4);
      t4 = Fp.add(X1, Z1);
      let t5 = Fp.add(X2, Z2);
      t4 = Fp.mul(t4, t5);
      t5 = Fp.add(t0, t2);
      t4 = Fp.sub(t4, t5);
      t5 = Fp.add(Y1, Z1);
      X3 = Fp.add(Y2, Z2);
      t5 = Fp.mul(t5, X3);
      X3 = Fp.add(t1, t2);
      t5 = Fp.sub(t5, X3);
      Z3 = Fp.mul(a, t4);
      X3 = Fp.mul(b3, t2);
      Z3 = Fp.add(X3, Z3);
      X3 = Fp.sub(t1, Z3);
      Z3 = Fp.add(t1, Z3);
      Y3 = Fp.mul(X3, Z3);
      t1 = Fp.add(t0, t0);
      t1 = Fp.add(t1, t0);
      t2 = Fp.mul(a, t2);
      t4 = Fp.mul(b3, t4);
      t1 = Fp.add(t1, t2);
      t2 = Fp.sub(t0, t2);
      t2 = Fp.mul(a, t2);
      t4 = Fp.add(t4, t2);
      t0 = Fp.mul(t1, t4);
      Y3 = Fp.add(Y3, t0);
      t0 = Fp.mul(t5, t4);
      X3 = Fp.mul(t3, X3);
      X3 = Fp.sub(X3, t0);
      t0 = Fp.mul(t3, t1);
      Z3 = Fp.mul(t5, Z3);
      Z3 = Fp.add(Z3, t0);
      return new Point(X3, Y3, Z3);
    }
    subtract(other) {
      return this.add(other.negate());
    }
    is0() {
      return this.equals(Point.ZERO);
    }
    wNAF(n) {
      return wnaf.wNAFCached(this, n, Point.normalizeZ);
    }
    /**
     * Non-constant-time multiplication. Uses double-and-add algorithm.
     * It's faster, but should only be used when you don't care about
     * an exposed private key e.g. sig verification, which works over *public* keys.
     */
    multiplyUnsafe(sc) {
      const { endo: endo2, n: N } = CURVE;
      aInRange("scalar", sc, _0n6, N);
      const I = Point.ZERO;
      if (sc === _0n6)
        return I;
      if (this.is0() || sc === _1n6)
        return this;
      if (!endo2 || wnaf.hasPrecomputes(this))
        return wnaf.wNAFCachedUnsafe(this, sc, Point.normalizeZ);
      let { k1neg, k1, k2neg, k2 } = endo2.splitScalar(sc);
      let k1p = I;
      let k2p = I;
      let d = this;
      while (k1 > _0n6 || k2 > _0n6) {
        if (k1 & _1n6)
          k1p = k1p.add(d);
        if (k2 & _1n6)
          k2p = k2p.add(d);
        d = d.double();
        k1 >>= _1n6;
        k2 >>= _1n6;
      }
      if (k1neg)
        k1p = k1p.negate();
      if (k2neg)
        k2p = k2p.negate();
      k2p = new Point(Fp.mul(k2p.px, endo2.beta), k2p.py, k2p.pz);
      return k1p.add(k2p);
    }
    /**
     * Constant time multiplication.
     * Uses wNAF method. Windowed method may be 10% faster,
     * but takes 2x longer to generate and consumes 2x memory.
     * Uses precomputes when available.
     * Uses endomorphism for Koblitz curves.
     * @param scalar by which the point would be multiplied
     * @returns New point
     */
    multiply(scalar) {
      const { endo: endo2, n: N } = CURVE;
      aInRange("scalar", scalar, _1n6, N);
      let point, fake;
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = endo2.splitScalar(scalar);
        let { p: k1p, f: f1p } = this.wNAF(k1);
        let { p: k2p, f: f2p } = this.wNAF(k2);
        k1p = wnaf.constTimeNegate(k1neg, k1p);
        k2p = wnaf.constTimeNegate(k2neg, k2p);
        k2p = new Point(Fp.mul(k2p.px, endo2.beta), k2p.py, k2p.pz);
        point = k1p.add(k2p);
        fake = f1p.add(f2p);
      } else {
        const { p, f } = this.wNAF(scalar);
        point = p;
        fake = f;
      }
      return Point.normalizeZ([point, fake])[0];
    }
    /**
     * Efficiently calculate `aP + bQ`. Unsafe, can expose private key, if used incorrectly.
     * Not using Strauss-Shamir trick: precomputation tables are faster.
     * The trick could be useful if both P and Q are not G (not in our case).
     * @returns non-zero affine point
     */
    multiplyAndAddUnsafe(Q, a, b) {
      const G = Point.BASE;
      const mul = (P, a2) => a2 === _0n6 || a2 === _1n6 || !P.equals(G) ? P.multiplyUnsafe(a2) : P.multiply(a2);
      const sum = mul(this, a).add(mul(Q, b));
      return sum.is0() ? void 0 : sum;
    }
    // Converts Projective point to affine (x, y) coordinates.
    // Can accept precomputed Z^-1 - for example, from invertBatch.
    // (x, y, z) ∋ (x=x/z, y=y/z)
    toAffine(iz) {
      return toAffineMemo(this, iz);
    }
    isTorsionFree() {
      const { h: cofactor, isTorsionFree } = CURVE;
      if (cofactor === _1n6)
        return true;
      if (isTorsionFree)
        return isTorsionFree(Point, this);
      throw new Error("isTorsionFree() has not been declared for the elliptic curve");
    }
    clearCofactor() {
      const { h: cofactor, clearCofactor } = CURVE;
      if (cofactor === _1n6)
        return this;
      if (clearCofactor)
        return clearCofactor(Point, this);
      return this.multiplyUnsafe(CURVE.h);
    }
    toRawBytes(isCompressed = true) {
      abool("isCompressed", isCompressed);
      this.assertValidity();
      return toBytes5(Point, this, isCompressed);
    }
    toHex(isCompressed = true) {
      abool("isCompressed", isCompressed);
      return bytesToHex2(this.toRawBytes(isCompressed));
    }
  }
  Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
  Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
  const { endo, nBitLength } = CURVE;
  const wnaf = wNAF(Point, endo ? Math.ceil(nBitLength / 2) : nBitLength);
  return {
    CURVE,
    ProjectivePoint: Point,
    normPrivateKeyToScalar,
    weierstrassEquation,
    isWithinCurveOrder
  };
}
function validateOpts(curve) {
  const opts = validateBasic(curve);
  validateObject(opts, {
    hash: "hash",
    hmac: "function",
    randomBytes: "function"
  }, {
    bits2int: "function",
    bits2int_modN: "function",
    lowS: "boolean"
  });
  return Object.freeze({ lowS: true, ...opts });
}
function weierstrass(curveDef) {
  const CURVE = validateOpts(curveDef);
  const { Fp, n: CURVE_ORDER, nByteLength, nBitLength } = CURVE;
  const compressedLen = Fp.BYTES + 1;
  const uncompressedLen = 2 * Fp.BYTES + 1;
  function modN(a) {
    return mod(a, CURVE_ORDER);
  }
  function invN(a) {
    return invert(a, CURVE_ORDER);
  }
  const { ProjectivePoint: Point, normPrivateKeyToScalar, weierstrassEquation, isWithinCurveOrder } = weierstrassPoints({
    ...CURVE,
    toBytes(_c, point, isCompressed) {
      const a = point.toAffine();
      const x = Fp.toBytes(a.x);
      const cat = concatBytes2;
      abool("isCompressed", isCompressed);
      if (isCompressed) {
        return cat(Uint8Array.from([point.hasEvenY() ? 2 : 3]), x);
      } else {
        return cat(Uint8Array.from([4]), x, Fp.toBytes(a.y));
      }
    },
    fromBytes(bytes) {
      const len = bytes.length;
      const head = bytes[0];
      const tail = bytes.subarray(1);
      if (len === compressedLen && (head === 2 || head === 3)) {
        const x = bytesToNumberBE(tail);
        if (!inRange(x, _1n6, Fp.ORDER))
          throw new Error("Point is not on curve");
        const y2 = weierstrassEquation(x);
        let y;
        try {
          y = Fp.sqrt(y2);
        } catch (sqrtError) {
          const suffix = sqrtError instanceof Error ? ": " + sqrtError.message : "";
          throw new Error("Point is not on curve" + suffix);
        }
        const isYOdd = (y & _1n6) === _1n6;
        const isHeadOdd = (head & 1) === 1;
        if (isHeadOdd !== isYOdd)
          y = Fp.neg(y);
        return { x, y };
      } else if (len === uncompressedLen && head === 4) {
        const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
        const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
        return { x, y };
      } else {
        const cl = compressedLen;
        const ul = uncompressedLen;
        throw new Error("invalid Point, expected length of " + cl + ", or uncompressed " + ul + ", got " + len);
      }
    }
  });
  function isBiggerThanHalfOrder(number) {
    const HALF = CURVE_ORDER >> _1n6;
    return number > HALF;
  }
  function normalizeS(s) {
    return isBiggerThanHalfOrder(s) ? modN(-s) : s;
  }
  const slcNum = (b, from7, to) => bytesToNumberBE(b.slice(from7, to));
  class Signature {
    constructor(r, s, recovery) {
      aInRange("r", r, _1n6, CURVE_ORDER);
      aInRange("s", s, _1n6, CURVE_ORDER);
      this.r = r;
      this.s = s;
      if (recovery != null)
        this.recovery = recovery;
      Object.freeze(this);
    }
    // pair (bytes of r, bytes of s)
    static fromCompact(hex) {
      const l = nByteLength;
      hex = ensureBytes("compactSignature", hex, l * 2);
      return new Signature(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
    }
    // DER encoded ECDSA signature
    // https://bitcoin.stackexchange.com/questions/57644/what-are-the-parts-of-a-bitcoin-transaction-input-script
    static fromDER(hex) {
      const { r, s } = DER.toSig(ensureBytes("DER", hex));
      return new Signature(r, s);
    }
    /**
     * @todo remove
     * @deprecated
     */
    assertValidity() {
    }
    addRecoveryBit(recovery) {
      return new Signature(this.r, this.s, recovery);
    }
    recoverPublicKey(msgHash) {
      const { r, s, recovery: rec } = this;
      const h = bits2int_modN(ensureBytes("msgHash", msgHash));
      if (rec == null || ![0, 1, 2, 3].includes(rec))
        throw new Error("recovery id invalid");
      const radj = rec === 2 || rec === 3 ? r + CURVE.n : r;
      if (radj >= Fp.ORDER)
        throw new Error("recovery id 2 or 3 invalid");
      const prefix = (rec & 1) === 0 ? "02" : "03";
      const R = Point.fromHex(prefix + numToSizedHex(radj, Fp.BYTES));
      const ir = invN(radj);
      const u1 = modN(-h * ir);
      const u2 = modN(s * ir);
      const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2);
      if (!Q)
        throw new Error("point at infinify");
      Q.assertValidity();
      return Q;
    }
    // Signatures should be low-s, to prevent malleability.
    hasHighS() {
      return isBiggerThanHalfOrder(this.s);
    }
    normalizeS() {
      return this.hasHighS() ? new Signature(this.r, modN(-this.s), this.recovery) : this;
    }
    // DER-encoded
    toDERRawBytes() {
      return hexToBytes2(this.toDERHex());
    }
    toDERHex() {
      return DER.hexFromSig(this);
    }
    // padded bytes of r, then padded bytes of s
    toCompactRawBytes() {
      return hexToBytes2(this.toCompactHex());
    }
    toCompactHex() {
      const l = nByteLength;
      return numToSizedHex(this.r, l) + numToSizedHex(this.s, l);
    }
  }
  const utils = {
    isValidPrivateKey(privateKey) {
      try {
        normPrivateKeyToScalar(privateKey);
        return true;
      } catch (error) {
        return false;
      }
    },
    normPrivateKeyToScalar,
    /**
     * Produces cryptographically secure private key from random of size
     * (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
     */
    randomPrivateKey: () => {
      const length = getMinHashLength(CURVE.n);
      return mapHashToField(CURVE.randomBytes(length), CURVE.n);
    },
    /**
     * Creates precompute table for an arbitrary EC point. Makes point "cached".
     * Allows to massively speed-up `point.multiply(scalar)`.
     * @returns cached point
     * @example
     * const fast = utils.precompute(8, ProjectivePoint.fromHex(someonesPubKey));
     * fast.multiply(privKey); // much faster ECDH now
     */
    precompute(windowSize = 8, point = Point.BASE) {
      point._setWindowSize(windowSize);
      point.multiply(BigInt(3));
      return point;
    }
  };
  function getPublicKey(privateKey, isCompressed = true) {
    return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
  }
  function isProbPub(item) {
    if (typeof item === "bigint")
      return false;
    if (item instanceof Point)
      return true;
    const arr = ensureBytes("key", item);
    const len = arr.length;
    const fpl = Fp.BYTES;
    const compLen = fpl + 1;
    const uncompLen = 2 * fpl + 1;
    if (CURVE.allowedPrivateKeyLengths || nByteLength === compLen) {
      return void 0;
    } else {
      return len === compLen || len === uncompLen;
    }
  }
  function getSharedSecret(privateA, publicB, isCompressed = true) {
    if (isProbPub(privateA) === true)
      throw new Error("first arg must be private key");
    if (isProbPub(publicB) === false)
      throw new Error("second arg must be public key");
    const b = Point.fromHex(publicB);
    return b.multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
  }
  const bits2int = CURVE.bits2int || function(bytes) {
    if (bytes.length > 8192)
      throw new Error("input is too large");
    const num = bytesToNumberBE(bytes);
    const delta = bytes.length * 8 - nBitLength;
    return delta > 0 ? num >> BigInt(delta) : num;
  };
  const bits2int_modN = CURVE.bits2int_modN || function(bytes) {
    return modN(bits2int(bytes));
  };
  const ORDER_MASK = bitMask(nBitLength);
  function int2octets(num) {
    aInRange("num < 2^" + nBitLength, num, _0n6, ORDER_MASK);
    return numberToBytesBE(num, nByteLength);
  }
  function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
    if (["recovered", "canonical"].some((k) => k in opts))
      throw new Error("sign() legacy options not supported");
    const { hash: hash2, randomBytes: randomBytes2 } = CURVE;
    let { lowS, prehash, extraEntropy: ent } = opts;
    if (lowS == null)
      lowS = true;
    msgHash = ensureBytes("msgHash", msgHash);
    validateSigVerOpts(opts);
    if (prehash)
      msgHash = ensureBytes("prehashed msgHash", hash2(msgHash));
    const h1int = bits2int_modN(msgHash);
    const d = normPrivateKeyToScalar(privateKey);
    const seedArgs = [int2octets(d), int2octets(h1int)];
    if (ent != null && ent !== false) {
      const e = ent === true ? randomBytes2(Fp.BYTES) : ent;
      seedArgs.push(ensureBytes("extraEntropy", e));
    }
    const seed = concatBytes2(...seedArgs);
    const m = h1int;
    function k2sig(kBytes) {
      const k = bits2int(kBytes);
      if (!isWithinCurveOrder(k))
        return;
      const ik = invN(k);
      const q = Point.BASE.multiply(k).toAffine();
      const r = modN(q.x);
      if (r === _0n6)
        return;
      const s = modN(ik * modN(m + r * d));
      if (s === _0n6)
        return;
      let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n6);
      let normS = s;
      if (lowS && isBiggerThanHalfOrder(s)) {
        normS = normalizeS(s);
        recovery ^= 1;
      }
      return new Signature(r, normS, recovery);
    }
    return { seed, k2sig };
  }
  const defaultSigOpts = { lowS: CURVE.lowS, prehash: false };
  const defaultVerOpts = { lowS: CURVE.lowS, prehash: false };
  function sign(msgHash, privKey, opts = defaultSigOpts) {
    const { seed, k2sig } = prepSig(msgHash, privKey, opts);
    const C = CURVE;
    const drbg = createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac);
    return drbg(seed, k2sig);
  }
  Point.BASE._setWindowSize(8);
  function verify(signature, msgHash, publicKey, opts = defaultVerOpts) {
    const sg = signature;
    msgHash = ensureBytes("msgHash", msgHash);
    publicKey = ensureBytes("publicKey", publicKey);
    const { lowS, prehash, format } = opts;
    validateSigVerOpts(opts);
    if ("strict" in opts)
      throw new Error("options.strict was renamed to lowS");
    if (format !== void 0 && format !== "compact" && format !== "der")
      throw new Error("format must be compact or der");
    const isHex2 = typeof sg === "string" || isBytes3(sg);
    const isObj = !isHex2 && !format && typeof sg === "object" && sg !== null && typeof sg.r === "bigint" && typeof sg.s === "bigint";
    if (!isHex2 && !isObj)
      throw new Error("invalid signature, expected Uint8Array, hex string or Signature instance");
    let _sig = void 0;
    let P;
    try {
      if (isObj)
        _sig = new Signature(sg.r, sg.s);
      if (isHex2) {
        try {
          if (format !== "compact")
            _sig = Signature.fromDER(sg);
        } catch (derError) {
          if (!(derError instanceof DER.Err))
            throw derError;
        }
        if (!_sig && format !== "der")
          _sig = Signature.fromCompact(sg);
      }
      P = Point.fromHex(publicKey);
    } catch (error) {
      return false;
    }
    if (!_sig)
      return false;
    if (lowS && _sig.hasHighS())
      return false;
    if (prehash)
      msgHash = CURVE.hash(msgHash);
    const { r, s } = _sig;
    const h = bits2int_modN(msgHash);
    const is = invN(s);
    const u1 = modN(h * is);
    const u2 = modN(r * is);
    const R = Point.BASE.multiplyAndAddUnsafe(P, u1, u2)?.toAffine();
    if (!R)
      return false;
    const v = modN(R.x);
    return v === r;
  }
  return {
    CURVE,
    getPublicKey,
    getSharedSecret,
    sign,
    verify,
    ProjectivePoint: Point,
    Signature,
    utils
  };
}

// node_modules/ox/node_modules/@noble/curves/esm/_shortw_utils.js
function getHash(hash2) {
  return {
    hash: hash2,
    hmac: (key, ...msgs) => hmac(hash2, key, concatBytes3(...msgs)),
    randomBytes
  };
}
function createCurve(curveDef, defHash) {
  const create2 = (hash2) => weierstrass({ ...curveDef, ...getHash(hash2) });
  return { ...create2(defHash), create: create2 };
}

// node_modules/ox/node_modules/@noble/curves/esm/abstract/hash-to-curve.js
init_browser_buffer_global();
init_utils4();

// node_modules/ox/node_modules/@noble/curves/esm/secp256k1.js
init_utils4();
var secp256k1P = BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f");
var secp256k1N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
var _0n7 = BigInt(0);
var _1n7 = BigInt(1);
var _2n5 = BigInt(2);
var divNearest = (a, b) => (a + b / _2n5) / b;
function sqrtMod(y) {
  const P = secp256k1P;
  const _3n3 = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
  const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
  const b2 = y * y * y % P;
  const b3 = b2 * b2 * y % P;
  const b6 = pow2(b3, _3n3, P) * b3 % P;
  const b9 = pow2(b6, _3n3, P) * b3 % P;
  const b11 = pow2(b9, _2n5, P) * b2 % P;
  const b22 = pow2(b11, _11n, P) * b11 % P;
  const b44 = pow2(b22, _22n, P) * b22 % P;
  const b88 = pow2(b44, _44n, P) * b44 % P;
  const b176 = pow2(b88, _88n, P) * b88 % P;
  const b220 = pow2(b176, _44n, P) * b44 % P;
  const b223 = pow2(b220, _3n3, P) * b3 % P;
  const t1 = pow2(b223, _23n, P) * b22 % P;
  const t2 = pow2(t1, _6n, P) * b2 % P;
  const root = pow2(t2, _2n5, P);
  if (!Fpk1.eql(Fpk1.sqr(root), y))
    throw new Error("Cannot find square root");
  return root;
}
var Fpk1 = Field(secp256k1P, void 0, void 0, { sqrt: sqrtMod });
var secp256k1 = createCurve({
  a: _0n7,
  b: BigInt(7),
  Fp: Fpk1,
  n: secp256k1N,
  Gx: BigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),
  Gy: BigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),
  h: BigInt(1),
  lowS: true,
  // Allow only low-S signatures by default in sign() and verify()
  endo: {
    // Endomorphism, see above
    beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
    splitScalar: (k) => {
      const n = secp256k1N;
      const a1 = BigInt("0x3086d221a7d46bcde86c90e49284eb15");
      const b1 = -_1n7 * BigInt("0xe4437ed6010e88286f547fa90abfe4c3");
      const a2 = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8");
      const b2 = a1;
      const POW_2_128 = BigInt("0x100000000000000000000000000000000");
      const c1 = divNearest(b2 * k, n);
      const c2 = divNearest(-b1 * k, n);
      let k1 = mod(k - c1 * a1 - c2 * a2, n);
      let k2 = mod(-c1 * b1 - c2 * b2, n);
      const k1neg = k1 > POW_2_128;
      const k2neg = k2 > POW_2_128;
      if (k1neg)
        k1 = n - k1;
      if (k2neg)
        k2 = n - k2;
      if (k1 > POW_2_128 || k2 > POW_2_128) {
        throw new Error("splitScalar: Endomorphism failed, k=" + k);
      }
      return { k1neg, k1, k2neg, k2 };
    }
  }
}, sha2564);

// node_modules/ox/_esm/core/Signature.js
init_Bytes();
init_Errors();
init_Hex();
init_Json();

// node_modules/ox/_esm/erc8010/SignatureErc8010.js
init_Errors();
init_Hex();

// node_modules/ox/_esm/core/Secp256k1.js
init_browser_buffer_global();
init_Bytes();
init_Hex();

// node_modules/ox/_esm/core/internal/entropy.js
init_browser_buffer_global();

// node_modules/ox/_esm/erc8010/SignatureErc8010.js
var suffixParameters = from3("(uint256 chainId, address delegation, uint256 nonce, uint8 yParity, uint256 r, uint256 s), address to, bytes data");

// node_modules/viem/_esm/utils/signature/parseErc6492Signature.js
init_browser_buffer_global();
init_decodeAbiParameters();

// node_modules/viem/_esm/utils/signature/parseErc8010Signature.js
init_browser_buffer_global();
init_toHex();

// node_modules/viem/_esm/utils/signature/recoverMessageAddress.js
init_browser_buffer_global();

// node_modules/viem/_esm/utils/signature/recoverTypedDataAddress.js
init_browser_buffer_global();

// node_modules/viem/_esm/utils/signature/serializeErc6492Signature.js
init_browser_buffer_global();
init_encodeAbiParameters();
init_concat();
init_toBytes();

// node_modules/viem/_esm/utils/signature/serializeErc8010Signature.js
init_browser_buffer_global();
init_toBytes();

// node_modules/viem/_esm/utils/signature/verifyHash.js
init_browser_buffer_global();
init_getAddress();
init_isAddressEqual();

// node_modules/viem/_esm/utils/signature/verifyMessage.js
init_browser_buffer_global();
init_getAddress();
init_isAddressEqual();

// node_modules/viem/_esm/utils/signature/verifyTypedData.js
init_browser_buffer_global();
init_getAddress();
init_isAddressEqual();

// node_modules/viem/_esm/utils/index.js
init_stringify();
init_assertRequest();

// node_modules/viem/_esm/utils/transaction/getSerializedTransactionType.js
init_browser_buffer_global();
init_transaction();
init_slice();
init_fromHex();

// node_modules/viem/_esm/utils/transaction/parseTransaction.js
init_browser_buffer_global();
init_address();
init_transaction();
init_isAddress();
init_isHex();
init_pad();
init_trim();
init_fromHex();

// node_modules/viem/_esm/utils/index.js
init_formatEther();
init_formatGwei();
init_formatUnits();

// node_modules/viem/_esm/utils/unit/parseEther.js
init_browser_buffer_global();
init_unit();

// node_modules/viem/_esm/utils/unit/parseUnits.js
init_browser_buffer_global();

// node_modules/viem/_esm/errors/unit.js
init_browser_buffer_global();
init_base();

// node_modules/viem/_esm/utils/unit/parseGwei.js
init_browser_buffer_global();
init_unit();

// circle/arc/src/arc-radar-authority.ts
var addressPattern = /^0x[0-9a-f]{40}$/i;
var hashPattern = /^0x[0-9a-f]{64}$/i;
var quantityPattern = /^0x(?:0|[1-9a-f][0-9a-f]*)$/i;
var ZERO = `0x${"0".repeat(40)}`;
var MEMBER_LIMIT = 5;
var READS = [
  ["owner", "address", "Owner"],
  ["pendingOwner", "address", "Pending owner"],
  ["paused", "bool", "Paused flag"],
  ["cap", "uint256", "Supply cap"],
  ["totalSupply", "uint256", "Total supply"]
];
var ROLES = ["DEFAULT_ADMIN_ROLE", "MINTER_ROLE"];
function matchingRead(abi, name, inputs, output) {
  return abi.find((item) => {
    if (!item || typeof item !== "object") return false;
    const entry = item;
    return entry.type === "function" && entry.name === name && ["view", "pure"].includes(entry.stateMutability) && Array.isArray(entry.inputs) && entry.inputs.length === inputs.length && entry.inputs.every((parameter, index) => parameter?.type === inputs[index]) && Array.isArray(entry.outputs) && entry.outputs.length === 1 && entry.outputs[0]?.type === output;
  }) ?? null;
}
function missing(label) {
  return { label, state: "unsupported", value: "Not checked", note: "No matching read function in the available verified ABI. Other controls may exist." };
}
async function readAuthoritySnapshot(network, address, fetcher = fetch) {
  if (!addressPattern.test(address)) throw new Error("Invalid token address.");
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), 3e4);
  const snapshot = {
    address,
    chainId: network.chainId,
    checkedAt: Date.now(),
    block: null,
    abiAddresses: [],
    rows: [],
    notes: []
  };
  let requestId = 0;
  async function json(url, init) {
    const response = await fetcher(url, {
      ...init,
      credentials: "omit",
      cache: "no-store",
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8e3)])
    });
    if (!response.ok) throw new Error(`Read service returned HTTP ${response.status}.`);
    return response.json();
  }
  async function rpc2(method, params) {
    const id = ++requestId;
    const result = await json(network.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params })
    });
    if (result?.id !== id || result?.error || result?.result === void 0) throw new Error("RPC read failed or returned an invalid response.");
    return result.result;
  }
  try {
    const metadata = await json(`${network.apiBase}/addresses/${address}`);
    const implementations = Array.isArray(metadata?.implementations) ? [...new Set(metadata.implementations.map((item) => item?.address_hash?.toLowerCase()).filter((value) => typeof value === "string" && addressPattern.test(value)))] : [];
    const abi = [];
    const candidates = metadata?.is_verified === true ? [address] : [];
    if (implementations.length === 1 && implementations[0] !== address.toLowerCase()) {
      try {
        const implementation = await json(`${network.apiBase}/addresses/${implementations[0]}`);
        if (implementation?.is_verified === true) candidates.push(implementations[0]);
        else snapshot.notes.push("Implementation ABI is not verified in the explorer.");
      } catch {
        snapshot.notes.push("Implementation verification could not be fetched.");
      }
    }
    if (implementations.length > 1) snapshot.notes.push("Multiple implementations reported; implementation reads are not inferred.");
    for (const candidate of candidates) {
      try {
        const contract = await json(`${network.apiBase}/smart-contracts/${candidate}`);
        if (Array.isArray(contract?.abi) && contract.abi.length) {
          abi.push(...contract.abi);
          snapshot.abiAddresses.push(candidate);
        } else snapshot.notes.push("A verified ABI was unavailable.");
      } catch {
        snapshot.notes.push("An ABI request failed; coverage is incomplete.");
      }
    }
    if (metadata?.proxy_type || implementations.length) snapshot.notes.push("Proxy reads target the token address. The explorer's implementation mapping is not verified against proxy storage.");
    const hasReads = READS.some(([name, output]) => matchingRead(abi, name, [], output)) || ROLES.some((name) => matchingRead(abi, name, [], "bytes32"));
    if (!hasReads) {
      snapshot.rows = [...READS.map(([, , label]) => missing(label)), ...ROLES.map(missing)];
      snapshot.notes.push("No supported verified read signatures were available. No RPC state was inferred.");
      snapshot.checkedAt = Date.now();
      return snapshot;
    }
    const chain = await rpc2("eth_chainId", []);
    if (typeof chain !== "string" || !quantityPattern.test(chain) || BigInt(chain) !== BigInt(network.chainId)) throw new Error("RPC chain ID does not match the selected network. No state is shown.");
    const block = await rpc2("eth_getBlockByNumber", ["latest", false]);
    if (!block || !quantityPattern.test(block.number) || !quantityPattern.test(block.timestamp) || !hashPattern.test(block.hash)) throw new Error("RPC block metadata is unavailable.");
    const blockTime = Number(BigInt(block.timestamp)) * 1e3;
    if (!Number.isFinite(blockTime) || Math.abs(Date.now() - blockTime) > 3e5) throw new Error("RPC block is too old or has an invalid timestamp. No current state is shown.");
    snapshot.block = { number: BigInt(block.number).toString(), hash: block.hash, timestamp: new Date(blockTime).toISOString() };
    async function read(fn, args = []) {
      const data = encodeFunctionData({ abi: [fn], functionName: fn.name, args });
      const result = await rpc2("eth_call", [{ to: address, data }, block.number]);
      if (typeof result !== "string" || !hashPattern.test(result)) throw new Error("Invalid return data.");
      const value = decodeFunctionResult({ abi: [fn], functionName: fn.name, data: result });
      if (fn.outputs[0]?.type === "bool" && ![0n, 1n].includes(BigInt(result))) throw new Error("Invalid boolean.");
      if (typeof value !== "string" && typeof value !== "bigint" && typeof value !== "boolean") throw new Error("Unexpected return type.");
      return value;
    }
    for (const [name, output, label] of READS) {
      const fn = matchingRead(abi, name, [], output);
      if (!fn) {
        snapshot.rows.push(missing(label));
        continue;
      }
      try {
        const value = await read(fn);
        let note = `${name}() returned this value at the displayed block.`;
        if (output === "address") note = String(value).toLowerCase() === ZERO ? "Zero address returned. This does not prove all permissions were renounced." : "Reported by this getter; not a complete inventory of control.";
        if (output === "bool") note = "Reported pause flag only; not proof that transfers or sales will succeed.";
        if (output === "uint256") note = "Exact base units, not decimal-adjusted tokens. Does not prove a limit is enforced on every mint path.";
        snapshot.rows.push({
          label,
          state: "returned",
          value: String(value),
          note,
          ...output === "address" ? { addresses: [String(value)] } : {}
        });
      } catch {
        snapshot.rows.push({ label, state: "unavailable", value: "Unavailable", note: "The read failed or returned invalid data. No zero/false value is assumed." });
      }
    }
    const countFn = matchingRead(abi, "getRoleMemberCount", ["bytes32"], "uint256");
    const memberFn = matchingRead(abi, "getRoleMember", ["bytes32", "uint256"], "address");
    for (const name of ROLES) {
      const roleFn = matchingRead(abi, name, [], "bytes32");
      if (!roleFn) {
        snapshot.rows.push(missing(name));
        continue;
      }
      try {
        const role = await read(roleFn);
        if (!countFn || !memberFn) {
          snapshot.rows.push({
            label: name,
            state: "unsupported",
            value: "Members not enumerable",
            note: `Role ID ${role}. Member discovery is unavailable; holders are not assumed absent.`
          });
          continue;
        }
        const count = await read(countFn, [role]);
        const limit = Number(count > BigInt(MEMBER_LIMIT) ? BigInt(MEMBER_LIMIT) : count);
        const members = [];
        let failed = 0;
        for (let index = 0; index < limit; index += 2) {
          await Promise.all(Array.from({ length: Math.min(2, limit - index) }, async (_, offset) => {
            try {
              members[index + offset] = String(await read(memberFn, [role, BigInt(index + offset)]));
            } catch {
              failed++;
            }
          }));
        }
        snapshot.rows.push({
          label: name,
          state: failed ? "unavailable" : "returned",
          value: `${count} reported members`,
          addresses: members.filter(Boolean),
          note: `${members.filter(Boolean).length} of ${count} members read (limit ${MEMBER_LIMIT}).${failed ? ` ${failed} member reads failed.` : ""} Role membership does not establish which execution paths it controls.`
        });
      } catch {
        snapshot.rows.push({ label: name, state: "unavailable", value: "Unavailable", note: "Role or member count read failed. No empty role is assumed." });
      }
    }
    const finalBlock = await rpc2("eth_getBlockByNumber", [block.number, false]);
    if (finalBlock?.hash?.toLowerCase() !== block.hash.toLowerCase()) throw new Error("RPC block changed during the reads. Snapshot discarded; read again.");
    snapshot.checkedAt = Date.now();
    return snapshot;
  } finally {
    clearTimeout(deadline);
  }
}

// circle/arc/src/arc-radar-i18n.ts
init_browser_buffer_global();
var copy = (key, values = {}) => ({ key, values });
var KOREAN = {
  "Partial update": "\uC77C\uBD80 \uAC31\uC2E0",
  "All discovered pools failed to load. Market activity is unknown. Retry with Refresh.": "\uBC1C\uACAC\uB41C \uD480\uC744 \uBAA8\uB450 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC2DC\uC7A5 \uD65C\uB3D9\uC740 \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC0C8\uB85C\uACE0\uCE68\uC73C\uB85C \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694.",
  "Market activity is unknown because pool data could not be loaded.": "\uD480 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD574 \uC2DC\uC7A5 \uD65C\uB3D9\uC744 \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "Pool loads failed: {count}. Totals cover available pools only.": "\uD480 {count}\uAC1C\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uD569\uACC4\uC5D0\uB294 \uC870\uD68C\uB41C \uD480\uB9CC \uD3EC\uD568\uB429\uB2C8\uB2E4.",
  "Showing {shown} of {count} indexed liquidity events. 24H totals use fetched events only{partial}.": "\uC218\uC9D1\uB41C \uC720\uB3D9\uC131 \uC774\uBCA4\uD2B8 {count}\uAC74 \uC911 {shown}\uAC74 \uD45C\uC2DC. 24\uC2DC\uAC04 \uD569\uACC4\uB294 \uC870\uD68C\uB41C \uC774\uBCA4\uD2B8\uB9CC \uD3EC\uD568\uD569\uB2C8\uB2E4{partial}.",
  "; history may be incomplete": "; \uC774\uB825\uC774 \uC77C\uBD80 \uB204\uB77D\uB418\uC5C8\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4",
  "; partial history": "; \uC77C\uBD80 \uC774\uB825",
  "; partial holder page": "; \uBCF4\uC720 \uC8FC\uC18C \uC77C\uBD80 \uC870\uD68C",
  "; first page only": "; \uCCAB \uD398\uC774\uC9C0\uB9CC \uC870\uD68C",
  "Transfers: {transfers}{partial}. Holders: {holders}. Pool transfers are not proof of a swap or full exit.": "\uC804\uC1A1: {transfers}{partial}. \uBCF4\uC720 \uC8FC\uC18C: {holders}. \uD480\uB85C \uC804\uC1A1\uD588\uB2E4\uACE0 \uC2A4\uC651\uC774\uB098 \uC804\uB7C9 \uB9E4\uB3C4\uB77C\uB294 \uB73B\uC740 \uC544\uB2D9\uB2C8\uB2E4.",
  "Transfer history could not be loaded. Wallet activity is unknown.": "\uC804\uC1A1 \uC774\uB825\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD574 \uC9C0\uAC11 \uD65C\uB3D9\uC744 \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "No wallet movement matches this filter in the available indexed transfers.": "\uC870\uD68C\uB41C \uC804\uC1A1 \uC774\uB825\uC5D0\uC11C \uD604\uC7AC \uC870\uAC74\uC5D0 \uB9DE\uB294 \uC9C0\uAC11 \uC6C0\uC9C1\uC784\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "{share} of LP supply is held by burn addresses.": "LP \uACF5\uAE09\uB7C9\uC758 {share}\uAC00 \uC18C\uAC01 \uC8FC\uC18C\uC5D0 \uC788\uC2B5\uB2C8\uB2E4.",
  "Top {holder} controls {share} of LP supply; a lock is not confirmed.": "\uCD5C\uB300 \uBCF4\uC720 {holder}\uC758 LP \uBE44\uC911\uC740 {share}\uC774\uBA70, \uC7A0\uAE08\uC740 \uD655\uC778\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.",
  "contract": "\uACC4\uC57D",
  "wallet": "\uC9C0\uAC11",
  "LP ownership is unavailable from the current index.": "\uD604\uC7AC \uC778\uB371\uC2A4\uC5D0\uC11C LP \uBCF4\uC720 \uD604\uD669\uC744 \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "{ownership} LP data: {state}{partial}.": "{ownership} LP \uB370\uC774\uD130: {state}{partial}.",
  "No Mint or Burn event appears in the visible pair history.": "\uC870\uD68C\uB41C \uD480 \uC774\uB825\uC5D0 Mint \uB610\uB294 Burn \uC774\uBCA4\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "{percent}% of prior USDC reserve": "\uC9C1\uC804 USDC \uC900\uBE44\uAE08\uC758 {percent}%",
  "Holders: {state}{partial}. Selected pool {poolShare} \xB7 Burned {burnedShare}. Rankings exclude burn addresses and {count} known same-token pool(s), not all possible pools.": "\uBCF4\uC720 \uC8FC\uC18C: {state}{partial}. \uC120\uD0DD \uD480 {poolShare} \xB7 \uC18C\uAC01 {burnedShare}. \uC21C\uC704\uB294 \uC18C\uAC01 \uC8FC\uC18C\uC640 \uD655\uC778\uB41C \uB3D9\uC77C \uD1A0\uD070 \uD480 {count}\uAC1C\uB97C \uC81C\uC678\uD569\uB2C8\uB2E4. \uBAA8\uB4E0 \uD480\uC744 \uC81C\uC678\uD55C \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4.",
  "Holder positions are unavailable from the current index.": "\uD604\uC7AC \uC778\uB371\uC2A4\uC5D0\uC11C \uBCF4\uC720 \uC8FC\uC18C\uBCC4 \uC794\uC561\uC744 \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "Holder connections cannot be checked without holder and transfer data.": "\uBCF4\uC720 \uC8FC\uC18C\uC640 \uC804\uC1A1 \uB370\uC774\uD130\uAC00 \uC5C6\uC5B4 \uC5F0\uACB0 \uAD00\uACC4\uB97C \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "No connection appears in the available post-launch history. Holders: {holders}; transfers: {transfers}.": "\uC870\uD68C\uB41C \uCD9C\uC2DC \uC774\uD6C4 \uC774\uB825\uC5D0\uC11C \uC5F0\uACB0\uC774 \uD655\uC778\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBCF4\uC720 \uC8FC\uC18C: {holders}; \uC804\uC1A1: {transfers}.",
  "Loaded pools: {count}. Quotes are pool-specific, not executable prices. Default: fresh data first, then highest liquidity.": "\uD480 {count}\uAC1C \uC870\uD68C. \uAC00\uACA9\uC740 \uAC1C\uBCC4 \uD480 \uAE30\uC900\uC774\uBA70 \uC2E4\uC81C \uCCB4\uACB0 \uACAC\uC801\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uC815\uC0C1 \uC870\uD68C\uB41C \uD480\uC744 \uC6B0\uC120\uD558\uACE0, \uADF8\uB2E4\uC74C \uC720\uB3D9\uC131\uC21C\uC73C\uB85C \uC815\uB82C\uD569\uB2C8\uB2E4.",
  "{state}{partial} \xB7 {trade}": "{state}{partial} \xB7 {trade}",
  "{amount} USDC exit side \xB7 {source}": "\uB9E4\uB3C4 \uCE21 {amount} USDC \xB7 {source}",
  "Sync reserves": "Sync \uC900\uBE44\uAE08",
  "balance fallback": "\uC794\uC561 \uAE30\uC900 \uB300\uCCB4 \uACC4\uC0B0",
  "{count} signals": "\uC6C0\uC9C1\uC784 {count}\uAC74",
  "{count} events": "\uC774\uBCA4\uD2B8 {count}\uAC74",
  "{count} indexed": "\uC218\uC9D1 \uC8FC\uC18C {count}\uAC1C",
  "No visible links": "\uC870\uD68C\uB41C \uC5F0\uACB0 \uC5C6\uC74C",
  "{count} links": "\uC5F0\uACB0 {count}\uAC1C",
  "Liquidity added": "\uC720\uB3D9\uC131 \uCD94\uAC00",
  "Initial / unknown base": "\uCD08\uAE30 \uC0C1\uD0DC / \uAE30\uC900\uAC12 \uBBF8\uD655\uC778",
  "Reading indexed changes...": "\uC218\uC9D1\uB41C \uBCC0\uD654 \uC870\uD68C \uC911",
  "Reading the last 24 hours...": "\uCD5C\uADFC 24\uC2DC\uAC04 \uC774\uB825 \uC870\uD68C \uC911",
  "Loading indexed pools...": "\uC218\uC9D1\uB41C \uD480 \uBD88\uB7EC\uC624\uB294 \uC911",
  "Reading source coverage...": "\uB370\uC774\uD130 \uC870\uD68C \uBC94\uC704 \uD655\uC778 \uC911",
  "Filter token markets": "\uD1A0\uD070 \uC2DC\uC7A5 \uD544\uD130",
  "Filter wallet signals": "\uC9C0\uAC11 \uC6C0\uC9C1\uC784 \uD544\uD130",
  "Baseline {time} \xB7 stored in this browser.": "\uAE30\uC900 \uC2DC\uAC01 {time} \xB7 \uC774 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC800\uC7A5\uB429\uB2C8\uB2E4.",
  "1% -> {amount} USDC \xB7 {impact}% impact": "1% \uB9E4\uB3C4 \u2192 {amount} USDC \xB7 \uAC00\uACA9 \uC601\uD5A5 {impact}%",
  "Reading verified ABI and public RPC state...": "\uAC80\uC99D\uB41C ABI\uC640 \uACF5\uAC1C RPC \uC0C1\uD0DC \uC870\uD68C \uC911",
  "Fixed-block snapshot. Values may have changed since this read.": "\uD2B9\uC815 \uBE14\uB85D\uC758 \uC870\uD68C \uACB0\uACFC\uC785\uB2C8\uB2E4. \uC774\uD6C4 \uAC12\uC774 \uB2EC\uB77C\uC84C\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  "State not read: no supported verified getters available.": "\uC9C0\uC6D0\uB418\uB294 \uAC80\uC99D\uB41C \uC870\uD68C \uD568\uC218\uAC00 \uC5C6\uC5B4 \uC0C1\uD0DC\uB97C \uC77D\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.",
  "No state snapshot requested.": "\uC544\uC9C1 \uC0C1\uD0DC\uB97C \uC870\uD68C\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.",
  "{count} checks unavailable from ABI": "ABI\uB85C \uC870\uD68C\uD558\uC9C0 \uBABB\uD55C \uD56D\uBAA9 {count}\uAC1C",
  "Owner": "\uC624\uB108",
  "Pending owner": "\uC624\uB108 \uBCC0\uACBD \uB300\uAE30 \uC8FC\uC18C",
  "Paused flag": "\uC77C\uC2DC\uC815\uC9C0 \uD50C\uB798\uADF8",
  "Supply cap": "\uACF5\uAE09\uB7C9 \uC0C1\uD55C",
  "Total supply": "\uCD1D\uACF5\uAE09\uB7C9",
  "Not checked": "\uBBF8\uD655\uC778",
  "No matching read function in the available verified ABI. Other controls may exist.": "\uAC80\uC99D\uB41C ABI\uC5D0 \uC77C\uCE58\uD558\uB294 \uC870\uD68C \uD568\uC218\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uB978 \uC81C\uC5B4 \uAD8C\uD55C\uC774 \uC874\uC7AC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  "No supported verified read signatures were available. No RPC state was inferred.": "\uC9C0\uC6D0\uB418\uB294 \uAC80\uC99D\uB41C \uC870\uD68C \uD568\uC218\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. RPC \uC0C1\uD0DC\uB97C \uCD94\uCE21\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
  "Reported by this getter; not a complete inventory of control.": "\uC870\uD68C \uD568\uC218\uC758 \uBC18\uD658\uAC12\uC774\uBA70 \uBAA8\uB4E0 \uC81C\uC5B4 \uAD8C\uD55C\uC758 \uBAA9\uB85D\uC740 \uC544\uB2D9\uB2C8\uB2E4.",
  "Zero address returned. This does not prove all permissions were renounced.": "0 \uC8FC\uC18C\uAC00 \uBC18\uD658\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBAA8\uB4E0 \uAD8C\uD55C\uC744 \uD3EC\uAE30\uD588\uB2E4\uB294 \uC99D\uAC70\uB294 \uC544\uB2D9\uB2C8\uB2E4.",
  "Reported pause flag only; not proof that transfers or sales will succeed.": "\uC870\uD68C\uB41C \uC77C\uC2DC\uC815\uC9C0 \uD50C\uB798\uADF8\uC77C \uBFD0\uC774\uBA70 \uC804\uC1A1\xB7\uB9E4\uB3C4 \uC131\uACF5\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
  "The read failed or returned invalid data. No zero/false value is assumed.": "\uC870\uD68C \uC2E4\uD328 \uB610\uB294 \uC798\uBABB\uB41C \uBC18\uD658\uAC12\uC785\uB2C8\uB2E4. 0\uC774\uB098 false\uB85C \uAC04\uC8FC\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
  "Exact base units, not decimal-adjusted tokens. Does not prove a limit is enforced on every mint path.": "\uC18C\uC218\uC810 \uC870\uC815 \uC804\uC758 \uC815\uD655\uD55C \uAE30\uBCF8 \uB2E8\uC704\uC785\uB2C8\uB2E4. \uBAA8\uB4E0 \uBC1C\uD589 \uACBD\uB85C\uC5D0 \uC0C1\uD55C\uC774 \uC801\uC6A9\uB41C\uB2E4\uB294 \uC99D\uAC70\uB294 \uC544\uB2D9\uB2C8\uB2E4.",
  "BUY": "\uB9E4\uC218",
  "SELL": "\uB9E4\uB3C4",
  "Sender": "\uBC1C\uC2E0\uC790",
  "Recipient": "\uC218\uC2E0\uC790",
  "Sender unknown": "\uBC1C\uC2E0\uC790 \uBBF8\uD655\uC778",
  "No trades": "\uAC70\uB798 \uC5C6\uC74C",
  "{count} visible": "\uC870\uD68C {count}\uAC74",
  "No swaps are available in the indexed history.": "\uC218\uC9D1\uB41C \uC774\uB825\uC5D0 \uC2A4\uC651\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "Checking": "\uD655\uC778 \uC911",
  "Paused": "\uC77C\uC2DC \uC911\uC9C0",
  "Tab-only monitoring": "\uD604\uC7AC \uD0ED\uC5D0\uC11C\uB9CC \uAD00\uCE21",
  "{covered} / {total} watched tokens loaded \xB7 {checked} / {pools} pools with recent ownership reads \xB7 {state}": "\uAD00\uC2EC \uD1A0\uD070 {covered}/{total}\uAC1C \uC870\uD68C \xB7 \uCD5C\uADFC \uBCF4\uC720 \uBD84\uD3EC \uD655\uC778 \uD480 {checked}/{pools}\uAC1C \xB7 {state}",
  "Up to 3 loaded watched pools checked per minute while this tab is visible. No monitoring while hidden or closed. {review}": "\uD0ED\uC774 \uBCF4\uC774\uB294 \uB3D9\uC548 \uC870\uD68C\uB41C \uAD00\uC2EC \uD480\uC744 \uBD84\uB2F9 \uCD5C\uB300 3\uAC1C \uD655\uC778\uD569\uB2C8\uB2E4. \uC228\uAE40\xB7\uC885\uB8CC \uC0C1\uD0DC\uC5D0\uC11C\uB294 \uAD00\uCE21\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. {review}",
  "Reviewed {time}.": "\uD655\uC778 \uC2DC\uAC01: {time}.",
  "Not reviewed yet.": "\uC544\uC9C1 \uD655\uC778\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.",
  "No watched tokens.": "\uAD00\uC2EC \uD1A0\uD070\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "Watched tokens are outside the loaded pool coverage.": "\uAD00\uC2EC \uD1A0\uD070\uC774 \uD604\uC7AC \uC870\uD68C\uD55C \uD480 \uBC94\uC704\uC5D0 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "No recorded changes in this view. Gaps in observation are not proof of no activity.": "\uD604\uC7AC \uBC94\uC704\uC5D0\uC11C \uAE30\uB85D\uB41C \uBCC0\uD654\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uAD00\uCE21 \uACF5\uBC31\uC774 \uD65C\uB3D9 \uBD80\uC7AC\uB97C \uC758\uBBF8\uD558\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4.",
  "Reading pools and recent trades...": "\uD480\uACFC \uCD5C\uADFC \uAC70\uB798 \uC870\uD68C \uC911",
  "Price, flow, ownership, and exit risk will appear here.": "\uC120\uD0DD\uD55C \uD1A0\uD070\uC758 \uAC00\uACA9, \uAC70\uB798 \uD750\uB984, \uBCF4\uC720 \uBD84\uD3EC\uC640 \uB9E4\uB3C4 \uC601\uD5A5\uC744 \uD655\uC778\uD569\uB2C8\uB2E4.",
  "Reading holders, liquidity, and trading controls.": "\uBCF4\uC720 \uC8FC\uC18C, \uC720\uB3D9\uC131, \uAC70\uB798 \uC81C\uC5B4 \uC815\uBCF4 \uC870\uD68C \uC911",
  "Public RPC cooldown: one request per token per minute.": "\uACF5\uAC1C RPC \uC870\uD68C \uAC04\uACA9: \uD1A0\uD070\uB2F9 \uBD84\uB2F9 1\uD68C",
  "Read selected contract getters without connecting a wallet": "\uC9C0\uAC11 \uC5F0\uACB0 \uC5C6\uC774 \uC77C\uBD80 \uACC4\uC57D \uD568\uC218\uB97C \uC870\uD68C\uD569\uB2C8\uB2E4.",
  "No indexed sell, or quote-side reserve below 10 USDC. Sorted by quote reserve, not a safety rating.": "\uC218\uC9D1\uB41C \uB9E4\uB3C4\uAC00 \uC5C6\uAC70\uB098 \uB9E4\uB3C4 \uCE21 \uC900\uBE44\uAE08\uC774 10 USDC \uBBF8\uB9CC\uC778 \uD480\uC785\uB2C8\uB2E4. \uC900\uBE44\uAE08\uC21C\uC774\uBA70 \uC548\uC804 \uB4F1\uAE09\uC774 \uC544\uB2D9\uB2C8\uB2E4.",
  "Search token or contract": "\uD1A0\uD070 \uB610\uB294 \uACC4\uC57D \uC8FC\uC18C \uAC80\uC0C9",
  "Search token, symbol, or contract": "\uD1A0\uD070\uBA85, \uC2EC\uBCFC, \uACC4\uC57D \uC8FC\uC18C \uAC80\uC0C9",
  "Search": "\uAC80\uC0C9",
  "Refresh": "\uC0C8\uB85C\uACE0\uCE68",
  "Refreshing": "\uAC31\uC2E0 \uC911",
  "Color theme": "\uD654\uBA74 \uD14C\uB9C8",
  "Light": "\uBC1D\uAC8C",
  "Dark": "\uC5B4\uB461\uAC8C",
  "System": "\uC2DC\uC2A4\uD15C",
  "Language": "\uC5B8\uC5B4",
  "Back to markets": "\uC2DC\uC7A5 \uBAA9\uB85D",
  "Changes to review": "\uD655\uC778\uD560 \uBCC0\uD654",
  "Selection criteria": "\uC120\uC815 \uAE30\uC900",
  "Loaded pool activity": "\uBD88\uB7EC\uC628 \uD480\uC758 \uD65C\uB3D9",
  "24H volume": "24\uC2DC\uAC04 \uAC70\uB798\uB7C9",
  "USDC pool flow": "\uD480\uC758 USDC \uAC70\uB798\uB7C9",
  "24H buys / sells": "24\uC2DC\uAC04 \uB9E4\uC218 / \uB9E4\uB3C4",
  "indexed swaps": "\uC218\uC9D1\uB41C \uC2A4\uC651",
  "Net flow": "\uC21C\uC720\uC785",
  "buy minus sell": "\uB9E4\uC218\uC561 \u2212 \uB9E4\uB3C4\uC561",
  "Newest pool": "\uCD5C\uC2E0 \uD480",
  "Sell observed": "\uB9E4\uB3C4 \uAD00\uCE21",
  "markets with an indexed sell": "\uB9E4\uB3C4\uAC00 \uC218\uC9D1\uB41C \uC2DC\uC7A5",
  "Watchlist changes": "\uAD00\uC2EC \uBAA9\uB85D \uBCC0\uD654",
  "Watchlist change view": "\uAD00\uC2EC \uBAA9\uB85D \uC870\uD68C \uBC94\uC704",
  "Since review": "\uC9C0\uB09C \uD655\uC778 \uC774\uD6C4",
  "Recent history": "\uCD5C\uADFC \uAE30\uB85D",
  "Mark all reviewed": "\uBAA8\uB450 \uD655\uC778\uD568",
  "Arc meme markets": "Arc \uBC08\uCF54\uC778 \uC2DC\uC7A5",
  "All": "\uC804\uCCB4",
  "Watchlist": "\uAD00\uC2EC \uBAA9\uB85D",
  "Moving 24H": "24\uC2DC\uAC04 \uD65C\uB3D9",
  "New": "\uC2E0\uADDC",
  "Sell seen": "\uB9E4\uB3C4 \uAD00\uCE21",
  "Needs review": "\uD655\uC778 \uD544\uC694",
  "Sort by": "\uC815\uB82C",
  "View default": "\uAE30\uBCF8 \uC815\uB82C",
  "Liquidity": "\uC720\uB3D9\uC131",
  "Latest trade": "\uCD5C\uADFC \uAC70\uB798\uC21C",
  "Min. liquidity (USDC)": "\uCD5C\uC18C \uC720\uB3D9\uC131 (USDC)",
  "Any": "\uC81C\uD55C \uC5C6\uC74C",
  "Traded in 24H": "24\uC2DC\uAC04 \uB0B4 \uAC70\uB798",
  "Token": "\uD1A0\uD070",
  "Price": "\uAC00\uACA9",
  "Market pulse": "\uAC00\uACA9 \uD750\uB984",
  "Buys / Sells": "\uB9E4\uC218 / \uB9E4\uB3C4",
  "Age": "\uC0DD\uC131 \uD6C4",
  "Select a token": "\uD1A0\uD070 \uC120\uD0DD",
  "Checking the token": "\uD1A0\uD070 \uD655\uC778 \uC911",
  "Full details": "\uC0C1\uC138 \uD398\uC774\uC9C0",
  "Copy link": "\uB9C1\uD06C \uBCF5\uC0AC",
  "fully diluted": "\uC644\uC804 \uD76C\uC11D \uAC00\uCE58",
  "Holders": "\uBCF4\uC720 \uC8FC\uC18C",
  "indexed addresses": "\uC218\uC9D1\uB41C \uC8FC\uC18C \uC218",
  "Observed changes": "\uAD00\uCE21\uB41C \uBCC0\uD654",
  "Stored in this browser.": "\uC774 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC800\uC7A5\uB429\uB2C8\uB2E4.",
  "Pool comparison": "\uD480 \uBE44\uAD50",
  "Selected pool": "\uC120\uD0DD\uD55C \uD480",
  "Pool": "\uD480",
  "Price (USDC)": "\uAC00\uACA9 (USDC)",
  "Data": "\uB370\uC774\uD130",
  "Pool price": "\uD480 \uAE30\uC900 \uAC00\uACA9",
  "Indexed price path": "\uC218\uC9D1\uB41C \uAC00\uACA9 \uD750\uB984",
  "Last 24 hours": "\uCD5C\uADFC 24\uC2DC\uAC04",
  "Recent market flow": "\uCD5C\uADFC \uAC70\uB798 \uD750\uB984",
  "Buys": "\uB9E4\uC218",
  "Sells": "\uB9E4\uB3C4",
  "Volume": "\uAC70\uB798\uB7C9",
  "Last trade": "\uB9C8\uC9C0\uB9C9 \uAC70\uB798",
  "Visible transactions": "\uC870\uD68C\uB41C \uAC70\uB798",
  "Recent trade tape": "\uCD5C\uADFC \uCCB4\uACB0 \uB0B4\uC5ED",
  "Wallet intelligence": "\uC9C0\uAC11 \uD65C\uB3D9",
  "Wallet signals": "\uC9C0\uAC11 \uC6C0\uC9C1\uC784",
  "Creation sender": "\uD480 \uC0DD\uC131 \uAC70\uB798 \uBC1C\uC2E0\uC790",
  "moves": "\uC6C0\uC9C1\uC784",
  "Whales": "\uB300\uADDC\uBAA8 \uBCF4\uC720 \uC8FC\uC18C",
  "top / large": "\uC0C1\uC704 \xB7 \uB300\uADDC\uBAA8",
  "Receipts": "\uC218\uC2E0",
  "first visible": "\uC870\uD68C \uBC94\uC704 \uB0B4 \uCD5C\uCD08",
  "To pool": "\uD480\uB85C \uC804\uC1A1",
  "transfers": "\uC804\uC1A1",
  "Pool safety": "\uD480 \uC810\uAC80",
  "Liquidity monitor": "\uC720\uB3D9\uC131 \uBCC0\uD654",
  "Exit side": "\uB9E4\uB3C4 \uCE21 \uC900\uBE44\uAE08",
  "USDC now": "\uD604\uC7AC USDC",
  "24H added": "24\uC2DC\uAC04 \uCD94\uAC00",
  "24H removed": "24\uC2DC\uAC04 \uC81C\uAC70",
  "LP burned": "\uC18C\uAC01 \uC8FC\uC18C\uC758 LP",
  "of LP supply": "LP \uACF5\uAE09\uB7C9 \uB300\uBE44",
  "Ownership": "\uBCF4\uC720 \uBD84\uD3EC",
  "Holder distribution": "\uBCF4\uC720 \uC8FC\uC18C \uBD84\uD3EC",
  "Top 1": "\uC0C1\uC704 1\uAC1C",
  "Top 5": "\uC0C1\uC704 5\uAC1C",
  "Top 10": "\uC0C1\uC704 10\uAC1C",
  "of supply": "\uACF5\uAE09\uB7C9 \uB300\uBE44",
  "indexed share": "\uC218\uC9D1\uB41C \uBE44\uC911",
  "On-chain relationships": "\uC628\uCCB4\uC778 \uC5F0\uACB0 \uAD00\uACC4",
  "Holder connections": "\uBCF4\uC720 \uC8FC\uC18C \uC5F0\uACB0",
  "Connections": "\uC5F0\uACB0",
  "indexed links": "\uC218\uC9D1\uB41C \uC5F0\uACB0",
  "Connected": "\uC5F0\uACB0 \uC8FC\uC18C",
  "top holders": "\uC0C1\uC704 \uBCF4\uC720 \uC8FC\uC18C",
  "Clusters": "\uC5F0\uACB0 \uADF8\uB8F9",
  "linked groups": "\uC5F0\uACB0\uB41C \uADF8\uB8F9",
  "Largest": "\uCD5C\uB300 \uADF8\uB8F9",
  "Evidence, not a safety score": "\uC548\uC804 \uC810\uC218\uAC00 \uC544\uB2CC \uD655\uC778 \uADFC\uAC70",
  "Token checks": "\uD1A0\uD070 \uC810\uAC80",
  "Read-only RPC": "\uC77D\uAE30 \uC804\uC6A9 RPC",
  "Contract state": "\uACC4\uC57D \uC0C1\uD0DC",
  "Read state": "\uC0C1\uD0DC \uC870\uD68C",
  "Read again": "\uB2E4\uC2DC \uC870\uD68C",
  "Reading...": "\uC870\uD68C \uC911",
  "Exit pressure": "\uB9E4\uB3C4 \uC555\uB825",
  "Sell-size impact": "\uB9E4\uB3C4 \uADDC\uBAA8\uBCC4 \uAC00\uACA9 \uC601\uD5A5",
  "0.1% supply": "\uACF5\uAE09\uB7C9\uC758 0.1%",
  "5% supply": "\uACF5\uAE09\uB7C9\uC758 5%",
  "Loading pools...": "\uD480 \uBD88\uB7EC\uC624\uB294 \uC911",
  "Retry loading": "\uB2E4\uC2DC \uBD88\uB7EC\uC624\uAE30",
  "Load 15 more": "15\uAC1C \uB354 \uBCF4\uAE30",
  "Scan limit reached": "\uC870\uD68C \uD55C\uB3C4 \uB3C4\uB2EC",
  "No more pools": "\uB9C8\uC9C0\uB9C9 \uD480\uC785\uB2C8\uB2E4",
  "No token has indexed trading activity in the last 24 hours.": "\uCD5C\uADFC 24\uC2DC\uAC04 \uB0B4 \uC218\uC9D1\uB41C \uAC70\uB798\uAC00 \uC788\uB294 \uD1A0\uD070\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "No token is currently on this browser's watchlist.": "\uC774 \uBE0C\uB77C\uC6B0\uC800\uC758 \uAD00\uC2EC \uBAA9\uB85D\uC5D0 \uB4F1\uB85D\uB41C \uD1A0\uD070\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "No token matches this view.": "\uD604\uC7AC \uC870\uAC74\uC5D0 \uB9DE\uB294 \uD1A0\uD070\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "Price unavailable": "\uAC00\uACA9 \uD655\uC778 \uBD88\uAC00",
  "Indexed event": "\uC218\uC9D1\uB41C \uC774\uBCA4\uD2B8",
  "Calculated": "\uACC4\uC0B0\uAC12",
  "Unverified": "\uBBF8\uD655\uC778",
  "Checks incomplete": "\uD655\uC778 \uBBF8\uC644\uB8CC",
  "Evidence only": "\uADFC\uAC70\uB9CC \uD45C\uC2DC",
  "Source TX": "\uADFC\uAC70 \uAC70\uB798",
  "Liquidity removed": "\uC720\uB3D9\uC131 \uC81C\uAC70",
  "Large 1H price move": "1\uC2DC\uAC04 \uAC00\uACA9 \uAE09\uBCC0",
  "New pool with indexed trades": "\uAC70\uB798\uAC00 \uC218\uC9D1\uB41C \uC2E0\uADDC \uD480",
  "{count} tokens": "\uD1A0\uD070 {count}\uAC1C",
  "{count} more changes": "\uBCC0\uD654 {count}\uAC1C \uB354 \uBCF4\uAE30",
  "{symbol} \xB7 {title}": "{symbol} \xB7 {title}",
  "{amount} USDC removed; {percent}% of prior USDC reserve.": "USDC {amount} \uC81C\uAC70 \xB7 \uAE30\uC874 USDC \uC900\uBE44\uAE08\uC758 {percent}%",
  "1H reserve-price change: {change}. Not an executable quote.": "1\uC2DC\uAC04 \uC900\uBE44\uAE08 \uAE30\uC900 \uAC00\uACA9 \uBCC0\uD654: {change}. \uC2E4\uC81C \uCCB4\uACB0 \uAC00\uB2A5\uD55C \uACAC\uC801\uC740 \uC544\uB2D9\uB2C8\uB2E4.",
  "Pool creation and subsequent trades appear in the available index. Not a token endorsement.": "\uC870\uD68C\uD55C \uC778\uB371\uC2A4\uC5D0\uC11C \uD480 \uC0DD\uC131\uACFC \uC774\uD6C4 \uAC70\uB798\uAC00 \uD655\uC778\uB429\uB2C8\uB2E4. \uD1A0\uD070\uC744 \uCD94\uCC9C\uD558\uB294 \uC758\uBBF8\uB294 \uC544\uB2D9\uB2C8\uB2E4.",
  "Market refresh failed. Recent changes cannot be assessed.": "\uC2DC\uC7A5 \uAC31\uC2E0 \uC2E4\uD328\uB85C \uCD5C\uADFC \uBCC0\uD654\uB97C \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "No qualifying recent change in the loaded pools. This is not an all-clear.": "\uC870\uD68C\uD55C \uD480\uC5D0\uC11C \uC870\uAC74\uC5D0 \uB9DE\uB294 \uCD5C\uADFC \uBCC0\uD654\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uC548\uC804\uD558\uB2E4\uB294 \uB73B\uC740 \uC544\uB2D9\uB2C8\uB2E4.",
  "{tokens} tokens \xB7 {pools} loaded pools \xB7 representative pools: {trades} indexed swaps \xB7 {liquidity} USDC liquidity \xB7 {partial} partial histories": "\uD1A0\uD070 {tokens}\uAC1C \xB7 \uD480 {pools}\uAC1C \xB7 \uB300\uD45C \uD480: \uC218\uC9D1 \uC2A4\uC651 {trades}\uAC74 \xB7 \uC720\uB3D9\uC131 {liquidity} USDC \xB7 \uC77C\uBD80 \uC774\uB825 {partial}\uAC1C",
  "{pools} pools loaded \xB7 {sources} {network} USDC market sources{limit}": "\uD480 {pools}\uAC1C \xB7 {network} USDC \uC18C\uC2A4 {sources}\uAC1C{limit}",
  " \xB7 Scan limit reached": " \xB7 \uC870\uD68C \uD55C\uB3C4 \uB3C4\uB2EC",
  " \xB7 150-pool limit": " \xB7 \uD480 150\uAC1C \uD55C\uB3C4",
  " \xB7 {count} unavailable": " \xB7 {count}\uAC1C \uC870\uD68C \uBD88\uAC00",
  "{network} \xB7 {sources} configured v2 source(s) \xB7 {pools} loaded pools \xB7 Not the whole chain": "{network} \xB7 \uB4F1\uB85D\uB41C v2 \uC18C\uC2A4 {sources}\uAC1C \xB7 \uD480 {pools}\uAC1C \xB7 \uCCB4\uC778 \uC804\uCCB4\uAC00 \uC544\uB2D8",
  "{cached} cached \xB7 {partial} partial histories{failed}": "\uCE90\uC2DC {cached}\uAC1C \xB7 \uC77C\uBD80 \uC774\uB825 {partial}\uAC1C{failed}",
  " \xB7 Refresh failed": " \xB7 \uAC31\uC2E0 \uC2E4\uD328",
  "{count} swaps indexed in the last 24 hours \xB7 {partial} partial pools \xB7 {cached} cached pools": "\uCD5C\uADFC 24\uC2DC\uAC04 \uC218\uC9D1 \uC2A4\uC651 {count}\uAC74 \xB7 \uC77C\uBD80 \uC774\uB825 \uD480 {partial}\uAC1C \xB7 \uCE90\uC2DC \uD480 {cached}\uAC1C",
  "{holders} holders \xB7 {pools} pools": "\uBCF4\uC720 \uC8FC\uC18C {holders}\uAC1C \xB7 \uD480 {pools}\uAC1C",
  "Cached": "\uCE90\uC2DC",
  "Fetched": "\uC870\uD68C\uB428",
  "Updated": "\uAC31\uC2E0",
  "fresh": "\uC870\uD68C\uB428",
  "cached": "\uCE90\uC2DC",
  "unavailable": "\uC870\uD68C \uBD88\uAC00",
  "Unavailable": "\uC870\uD68C \uBD88\uAC00",
  "None": "\uC5C6\uC74C",
  " \xB7 Partial history": " \xB7 \uC77C\uBD80 \uC774\uB825",
  " \xB7 partial history": " \xB7 \uC77C\uBD80 \uC774\uB825",
  "{state}{partial}": "{state}{partial}",
  "{amount} exit side": "\uB9E4\uB3C4 \uCE21 {amount}",
  "B {count}": "\uB9E4\uC218 {count}",
  "S {count}": "\uB9E4\uB3C4 {count}",
  "no trades": "\uAC70\uB798 \uC5C6\uC74C",
  "{time} ago": "{time} \uC804",
  "{time} old": "{time} \uACBD\uACFC",
  "trade {time}": "\uAC70\uB798 {time} \uC804",
  "No pool indexed": "\uC218\uC9D1\uB41C \uD480 \uC5C6\uC74C",
  "Pool {address} \xB7 {time} ago{partial}": "\uD480 {address} \xB7 {time} \uC804{partial}",
  "Open {symbol} market": "{symbol} \uC2DC\uC7A5 \uC5F4\uAE30",
  "Add token to watchlist": "\uD1A0\uD070\uC744 \uAD00\uC2EC \uBAA9\uB85D\uC5D0 \uCD94\uAC00",
  "Remove token from watchlist": "\uD1A0\uD070\uC744 \uAD00\uC2EC \uBAA9\uB85D\uC5D0\uC11C \uC81C\uAC70",
  "Add to watchlist": "\uAD00\uC2EC \uBAA9\uB85D\uC5D0 \uCD94\uAC00",
  "Remove from watchlist": "\uAD00\uC2EC \uBAA9\uB85D\uC5D0\uC11C \uC81C\uAC70",
  "Link copied": "\uB9C1\uD06C \uBCF5\uC0AC\uB428",
  "Copy unavailable. Use the Full details link.": "\uB9C1\uD06C\uB97C \uBCF5\uC0AC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC0C1\uC138 \uD398\uC774\uC9C0 \uB9C1\uD06C\uB97C \uC774\uC6A9\uD558\uC138\uC694.",
  "Connecting...": "\uC5F0\uACB0 \uC911",
  "Connection unavailable": "\uC5F0\uACB0 \uBD88\uAC00",
  "Network unavailable": "\uB124\uD2B8\uC6CC\uD06C \uC0AC\uC6A9 \uBD88\uAC00",
  "Invalid link": "\uC798\uBABB\uB41C \uB9C1\uD06C",
  "{state} {time}": "{state} {time}",
  "{network} MARKET FEED": "{network} \uC2DC\uC7A5 \uB370\uC774\uD130",
  "No match in the loaded pools with these filters.": "\uC870\uD68C\uD55C \uD480 \uC911 \uD604\uC7AC \uD544\uD130\uC5D0 \uB9DE\uB294 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "Live indexing is temporarily unavailable. Showing the latest cached market snapshot.": "\uC2E4\uC2DC\uAC04 \uC778\uB371\uC2A4 \uC870\uD68C\uAC00 \uC77C\uC2DC\uC801\uC73C\uB85C \uBD88\uAC00\uD558\uC5EC \uB9C8\uC9C0\uB9C9 \uCE90\uC2DC \uB370\uC774\uD130\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
  "Market data unavailable: {error}": "\uC2DC\uC7A5 \uB370\uC774\uD130 \uC870\uD68C \uBD88\uAC00: {error}",
  "Market data unavailable.": "\uC2DC\uC7A5 \uB370\uC774\uD130\uB97C \uC870\uD68C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "Detail checks are incomplete": "\uC0C1\uC138 \uD655\uC778 \uBBF8\uC644\uB8CC",
  "Holder index is partial": "\uBCF4\uC720 \uC8FC\uC18C \uC774\uB825\uC774 \uC77C\uBD80\uB9CC \uC870\uD68C\uB428",
  "Only the first holder page is available. Unseen balances and incomplete burn totals remain unknown.": "\uBCF4\uC720 \uC8FC\uC18C\uC758 \uCCAB \uD398\uC774\uC9C0\uB9CC \uC870\uD68C\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC870\uD68C\uB418\uC9C0 \uC54A\uC740 \uC794\uC561\uACFC \uC18C\uAC01 \uD569\uACC4\uB294 \uC54C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "24H starting price unavailable": "24\uC2DC\uAC04 \uAE30\uC900 \uC2DC\uC791 \uAC00\uACA9 \uC5C6\uC74C",
  "The 24H return is not estimated from a shorter window.": "\uB354 \uC9E7\uC740 \uAE30\uAC04\uC758 \uB370\uC774\uD130\uB85C 24\uC2DC\uAC04 \uC218\uC775\uB960\uC744 \uCD94\uC815\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
  "24-hour activity is partial": "24\uC2DC\uAC04 \uD65C\uB3D9 \uC774\uB825 \uC77C\uBD80 \uB204\uB77D",
  "Older events beyond the ArcScan page limit are not included in totals.": "ArcScan \uD398\uC774\uC9C0 \uD55C\uB3C4\uB97C \uB118\uB294 \uACFC\uAC70 \uC774\uBCA4\uD2B8\uB294 \uD569\uACC4\uC5D0 \uD3EC\uD568\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
  "Token-balance fallback": "\uD1A0\uD070 \uC794\uC561 \uAE30\uC900 \uB300\uCCB4 \uACC4\uC0B0",
  "No indexed Sync event was available. Price and liquidity are derived from the pair's token balances.": "\uC218\uC9D1\uB41C Sync \uC774\uBCA4\uD2B8\uAC00 \uC5C6\uC5B4 \uD480\uC758 \uD1A0\uD070 \uC794\uC561\uC73C\uB85C \uAC00\uACA9\uACFC \uC720\uB3D9\uC131\uC744 \uACC4\uC0B0\uD588\uC2B5\uB2C8\uB2E4.",
  "Sell event indexed": "\uB9E4\uB3C4 \uC774\uBCA4\uD2B8 \uC218\uC9D1\uB428",
  "No sell in available history": "\uC870\uD68C \uC774\uB825\uC5D0 \uB9E4\uB3C4 \uC5C6\uC74C",
  "Absence of indexed sells does not prove a token is unsellable.": "\uC218\uC9D1\uB41C \uB9E4\uB3C4\uAC00 \uC5C6\uB2E4\uACE0 \uD574\uC11C \uB9E4\uB3C4 \uBD88\uAC00\uB2A5\uD55C \uD1A0\uD070\uC774\uB77C\uB294 \uB73B\uC740 \uC544\uB2D9\uB2C8\uB2E4.",
  "Pool liquidity below 200 USDC": "\uD480 \uC720\uB3D9\uC131 200 USDC \uBBF8\uB9CC",
  "Top-10 ownership exceeds 25%": "\uC0C1\uC704 10\uAC1C \uC8FC\uC18C \uBE44\uC911 25% \uC774\uC0C1",
  "Pool-creation sender holds at least 10%": "\uD480 \uC0DD\uC131 \uAC70\uB798 \uBC1C\uC2E0\uC790\uC758 \uBCF4\uC720 \uBE44\uC911 10% \uC774\uC0C1",
  "LP at burn addresses": "\uC18C\uAC01 \uC8FC\uC18C\uC5D0 \uC788\uB294 LP",
  "Liquidity lock not independently checked": "\uC720\uB3D9\uC131 \uC7A0\uAE08 \uBCC4\uB3C4 \uBBF8\uAC80\uC99D",
  "LP ownership or lock terms could not be established.": "LP \uBCF4\uC720 \uAD00\uACC4 \uB610\uB294 \uC7A0\uAE08 \uC870\uAC74\uC744 \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "Execution paths not verified": "\uC2E4\uD589 \uACBD\uB85C \uBBF8\uAC80\uC99D",
  "Contract ABI unavailable": "\uACC4\uC57D ABI \uC870\uD68C \uBD88\uAC00",
  "No matching ABI names": "\uC77C\uCE58\uD558\uB294 ABI \uD568\uC218\uBA85 \uC5C6\uC74C",
  "No sell simulation or full permission audit is performed. Optional contract-state reads below report selected getter values only; they do not prove a control is usable, disabled, or absent elsewhere.": "\uB9E4\uB3C4 \uC2DC\uBBAC\uB808\uC774\uC158\uC774\uB098 \uC804\uCCB4 \uAD8C\uD55C \uAC10\uC0AC\uB97C \uC218\uD589\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC544\uB798 \uACC4\uC57D \uC0C1\uD0DC \uC870\uD68C\uB294 \uC77C\uBD80 \uD568\uC218\uC758 \uBC18\uD658\uAC12\uB9CC \uD45C\uC2DC\uD558\uBA70, \uD574\uB2F9 \uAD8C\uD55C\uC758 \uC2E4\uD589 \uAC00\uB2A5 \uC5EC\uBD80\uB098 \uBE44\uD65C\uC131\uD654 \uC5EC\uBD80, \uB2E4\uB978 \uAD8C\uD55C\uC758 \uBD80\uC7AC\uB97C \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
  "Supply and trading controls cannot be assessed from the available ABI.": "\uC870\uD68C \uAC00\uB2A5\uD55C ABI\uB9CC\uC73C\uB85C \uBC1C\uD589\xB7\uAC70\uB798 \uC81C\uC5B4 \uAD8C\uD55C\uC744 \uD3C9\uAC00\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
  "No configured function-name pattern matched. Custom logic, external contracts, or different function names may still impose restrictions.": "\uC124\uC815\uB41C \uD568\uC218\uBA85 \uD328\uD134\uACFC \uC77C\uCE58\uD558\uB294 \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uBCC4\uB3C4 \uB85C\uC9C1, \uC678\uBD80 \uACC4\uC57D, \uB2E4\uB978 \uC774\uB984\uC758 \uD568\uC218\uAC00 \uC81C\uD55C\uC744 \uC801\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  "{sources}. Missing data is not a clean risk check.": "{sources}. \uB204\uB77D\uB41C \uB370\uC774\uD130\uAC00 \uC788\uB2E4\uACE0 \uD574\uC11C \uC704\uD5D8\uC774 \uC5C6\uB2E4\uB294 \uB73B\uC740 \uC544\uB2D9\uB2C8\uB2E4.",
  "A token-to-USDC Swap was indexed {time} ago. This does not prove that any wallet can sell now.": "{time} \uC804 \uD1A0\uD070\u2192USDC \uC2A4\uC651\uC774 \uC218\uC9D1\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uD604\uC7AC \uBAA8\uB4E0 \uC9C0\uAC11\uC774 \uB9E4\uB3C4\uD560 \uC218 \uC788\uB2E4\uB294 \uC99D\uAC70\uB294 \uC544\uB2D9\uB2C8\uB2E4.",
  "Reserve-based estimate: {total} USDC total, {quote} USDC on the quote side. This threshold is a screening rule, not a safety rating.": "\uC900\uBE44\uAE08 \uAE30\uC900 \uCD94\uC815\uCE58: \uCD1D {total} USDC, \uB9E4\uB3C4 \uCE21 {quote} USDC. \uC774 \uAE30\uC900\uC740 \uC870\uD68C \uC870\uAC74\uC774\uC9C0 \uC548\uC804 \uB4F1\uAE09\uC774 \uC544\uB2D9\uB2C8\uB2E4.",
  "{share}% of indexed supply, excluding burn addresses and known pools. Addresses are not necessarily independent owners.": "\uC18C\uAC01 \uC8FC\uC18C\uC640 \uD655\uC778\uB41C \uD480\uC744 \uC81C\uC678\uD55C \uACF5\uAE09\uB7C9 \uBE44\uC911\uC740 {share}%\uC785\uB2C8\uB2E4. \uC11C\uB85C \uB2E4\uB978 \uC8FC\uC18C\uAC00 \uB3C5\uB9BD\uB41C \uC18C\uC720\uC790\uB77C\uB294 \uB73B\uC740 \uC544\uB2D9\uB2C8\uB2E4.",
  "Indexed share: {share}%. This transaction sender may be a relayer; it is not proof of the token team's identity.": "\uC218\uC9D1\uB41C \uBE44\uC911: {share}%. \uAC70\uB798 \uBC1C\uC2E0\uC790\uB294 \uC911\uACC4\uC790\uC77C \uC218 \uC788\uC73C\uBA70 \uD1A0\uD070 \uD300\uC758 \uC2E0\uC6D0\uC744 \uC99D\uBA85\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
  "{share}% of indexed LP supply. This does not establish token safety or sale availability.": "\uC218\uC9D1\uB41C LP \uACF5\uAE09\uB7C9\uC758 {share}%\uC785\uB2C8\uB2E4. \uD1A0\uD070\uC758 \uC548\uC804\uC131\uC774\uB098 \uB9E4\uB3C4 \uAC00\uB2A5\uC131\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
  "Top indexed LP holder: {share}%. Lock contract rules and unlock times have not been checked.": "\uC870\uD68C\uB41C \uCD5C\uB300 LP \uBCF4\uC720 \uBE44\uC911: {share}%. \uC7A0\uAE08 \uACC4\uC57D\uC758 \uADDC\uCE59\uACFC \uD574\uC81C \uC2DC\uAC01\uC740 \uD655\uC778\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.",
  "Supply-related function names": "\uBC1C\uD589 \uAD00\uB828 \uD568\uC218\uBA85",
  "Restriction-related function names": "\uC81C\uD55C \uAD00\uB828 \uD568\uC218\uBA85",
  "Pause-related function names": "\uC77C\uC2DC\uC815\uC9C0 \uAD00\uB828 \uD568\uC218\uBA85",
  "Upgrade or proxy indicators": "\uC5C5\uADF8\uB808\uC774\uB4DC\xB7\uD504\uB85D\uC2DC \uB2E8\uC11C",
  "Fee-related function names": "\uC218\uC218\uB8CC \uAD00\uB828 \uD568\uC218\uBA85",
  "{evidence} Names alone do not establish current permissions or execution paths. Selected getter values, when requested, appear separately under Contract state and do not confirm this capability is usable.": "{evidence} \uD568\uC218\uBA85\uB9CC\uC73C\uB85C \uD604\uC7AC \uAD8C\uD55C\uACFC \uC2E4\uD589 \uACBD\uB85C\uB97C \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC870\uD68C\uD55C \uBC18\uD658\uAC12\uC740 \uACC4\uC57D \uC0C1\uD0DC\uC5D0 \uBCC4\uB3C4\uB85C \uD45C\uC2DC\uB418\uBA70, \uD574\uB2F9 \uAE30\uB2A5\uC774 \uC2E4\uD589 \uAC00\uB2A5\uD558\uB2E4\uB294 \uB73B\uC740 \uC544\uB2D9\uB2C8\uB2E4.",
  "{indexed} indexed \xB7 {calculated} calculated \xB7 {unverified} unverified": "\uC218\uC9D1 \uADFC\uAC70 {indexed}\uAC1C \xB7 \uACC4\uC0B0\uAC12 {calculated}\uAC1C \xB7 \uBBF8\uD655\uC778 {unverified}\uAC1C",
  "Market: {market} \xB7 Contract: {contract} \xB7 Holders: {holders} \xB7 No safety score": "\uC2DC\uC7A5: {market} \xB7 \uACC4\uC57D: {contract} \xB7 \uBCF4\uC720 \uC8FC\uC18C: {holders} \xB7 \uC548\uC804 \uC810\uC218 \uC5C6\uC74C",
  "Evidence completeness, not a risk score or safety verdict.": "\uADFC\uAC70\uC758 \uD655\uC778 \uBC94\uC704\uC774\uBA70 \uC704\uD5D8 \uC810\uC218\uB098 \uC548\uC804 \uD310\uC815\uC774 \uC544\uB2D9\uB2C8\uB2E4.",
  "Token contract": "\uD1A0\uD070 \uACC4\uC57D",
  "Pool events": "\uD480 \uC774\uBCA4\uD2B8",
  "Holder index": "\uBCF4\uC720 \uC8FC\uC18C \uC778\uB371\uC2A4",
  "Source: ArcScan. Indexing may lag. V2 pools only; mainnet and other DEX protocols are not connected.": "\uCD9C\uCC98: ArcScan. \uC778\uB371\uC2F1\uC774 \uC9C0\uC5F0\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4. V2 \uD480\uB9CC \uC9C0\uC6D0\uD558\uBA70 \uBA54\uC778\uB137\uACFC \uB2E4\uB978 DEX \uD504\uB85C\uD1A0\uCF5C\uC740 \uC5F0\uACB0\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.",
  "Loaded pools only. Latest liquidity removal of at least 10% of prior USDC reserve, then 1H price moves of at least 30%, then newly created pools with indexed trades. One item per token, up to six. Cached markets are excluded. These are screening rules, not recommendations.": "\uC870\uD68C\uD55C \uD480\uB9CC \uB300\uC0C1\uC785\uB2C8\uB2E4. \uAE30\uC874 USDC \uC900\uBE44\uAE08\uC758 10% \uC774\uC0C1 \uC720\uB3D9\uC131 \uC81C\uAC70, 1\uC2DC\uAC04 \uAC00\uACA9 \uBCC0\uB3D9 30% \uC774\uC0C1, \uAC70\uB798\uAC00 \uC218\uC9D1\uB41C \uC2E0\uADDC \uD480 \uC21C\uC73C\uB85C \uD45C\uC2DC\uD569\uB2C8\uB2E4. \uD1A0\uD070\uB2F9 1\uAC1C, \uCD5C\uB300 6\uAC1C\uC774\uBA70 \uCE90\uC2DC \uB370\uC774\uD130\uB294 \uC81C\uC678\uD569\uB2C8\uB2E4. \uCD94\uCC9C\uC774 \uC544\uB2CC \uC870\uD68C \uAE30\uC900\uC785\uB2C8\uB2E4.",
  "Pool changes are calculated from indexed Mint, Burn, and Sync events.": "\uD480 \uBCC0\uD654\uB294 \uC218\uC9D1\uB41C Mint, Burn, Sync \uC774\uBCA4\uD2B8\uB85C \uACC4\uC0B0\uD569\uB2C8\uB2E4.",
  "Connections mean an indexed direct transfer or a shared non-contract source. They do not prove common ownership.": "\uC5F0\uACB0\uC740 \uC218\uC9D1\uB41C \uC9C1\uC811 \uC804\uC1A1 \uB610\uB294 \uB3D9\uC77C\uD55C \uBE44\uACC4\uC57D \uC8FC\uC18C\uB85C\uBD80\uD130\uC758 \uC218\uC2E0\uC744 \uB73B\uD569\uB2C8\uB2E4. \uB3D9\uC77C \uC18C\uC720\uC790\uB77C\uB294 \uC99D\uAC70\uB294 \uC544\uB2D9\uB2C8\uB2E4.",
  "Selected getters only. No sell simulation, proxy-storage verification, or complete permission audit. Missing reads do not imply safety.": "\uC77C\uBD80 \uC870\uD68C \uD568\uC218\uB9CC \uD655\uC778\uD569\uB2C8\uB2E4. \uB9E4\uB3C4 \uC2DC\uBBAC\uB808\uC774\uC158, \uD504\uB85D\uC2DC \uC800\uC7A5\uC18C \uAC80\uC99D, \uC804\uCCB4 \uAD8C\uD55C \uAC10\uC0AC\uB294 \uC218\uD589\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC870\uD68C\uB418\uC9C0 \uC54A\uC558\uB2E4\uACE0 \uC548\uC804\uD55C \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4.",
  "Single-pool v2 estimate with an assumed 0.3% fee. No sell simulation. Token taxes, limits, MEV, and routing are not included.": "\uB2E8\uC77C V2 \uD480\uACFC \uC218\uC218\uB8CC 0.3%\uB97C \uAC00\uC815\uD55C \uCD94\uC815\uCE58\uC785\uB2C8\uB2E4. \uB9E4\uB3C4 \uC2DC\uBBAC\uB808\uC774\uC158\uC774 \uC544\uB2C8\uBA70 \uD1A0\uD070 \uC138\uAE08, \uC81C\uD55C, MEV, \uB77C\uC6B0\uD305\uC740 \uBC18\uC601\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
  "Independent read-only analytics. Not affiliated with Circle or Arc. No token is endorsed and no safety result is guaranteed.": "\uB3C5\uB9BD\uC801\uC778 \uC77D\uAE30 \uC804\uC6A9 \uBD84\uC11D \uC11C\uBE44\uC2A4\uC785\uB2C8\uB2E4. Circle\xB7Arc\uC640 \uC81C\uD734 \uAD00\uACC4\uAC00 \uC5C6\uC73C\uBA70, \uC5B4\uB5A4 \uD1A0\uD070\uB3C4 \uCD94\uCC9C\uD558\uAC70\uB098 \uC548\uC804\uC131\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
};
var JAPANESE = {
  "Partial update": "\u4E00\u90E8\u66F4\u65B0",
  "All discovered pools failed to load. Market activity is unknown. Retry with Refresh.": "\u898B\u3064\u304B\u3063\u305F\u30D7\u30FC\u30EB\u3092\u3059\u3079\u3066\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u5E02\u5834\u306E\u6D3B\u52D5\u306F\u4E0D\u660E\u3067\u3059\u3002\u66F4\u65B0\u3057\u3066\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  "Market activity is unknown because pool data could not be loaded.": "\u30D7\u30FC\u30EB\u30C7\u30FC\u30BF\u3092\u8AAD\u307F\u8FBC\u3081\u306A\u3044\u305F\u3081\u3001\u5E02\u5834\u306E\u6D3B\u52D5\u306F\u4E0D\u660E\u3067\u3059\u3002",
  "Pool loads failed: {count}. Totals cover available pools only.": "{count}\u30D7\u30FC\u30EB\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u5408\u8A08\u306B\u306F\u53D6\u5F97\u3067\u304D\u305F\u30D7\u30FC\u30EB\u306E\u307F\u542B\u307E\u308C\u307E\u3059\u3002",
  "Showing {shown} of {count} indexed liquidity events. 24H totals use fetched events only{partial}.": "\u53D6\u5F97\u6E08\u307F\u306E\u6D41\u52D5\u6027\u30A4\u30D9\u30F3\u30C8{count}\u4EF6\u4E2D{shown}\u4EF6\u3092\u8868\u793A\u300224\u6642\u9593\u306E\u5408\u8A08\u306F\u53D6\u5F97\u6E08\u307F\u30A4\u30D9\u30F3\u30C8\u306E\u307F\u3067\u3059{partial}\u3002",
  "; history may be incomplete": "\u3002\u5C65\u6B74\u306B\u6B20\u843D\u306E\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059",
  "; partial history": "\u3001\u5C65\u6B74\u306F\u4E00\u90E8\u306E\u307F",
  "; partial holder page": "\u3001\u4FDD\u6709\u30A2\u30C9\u30EC\u30B9\u306F\u4E00\u90E8\u306E\u307F",
  "; first page only": "\u3001\u6700\u521D\u306E\u30DA\u30FC\u30B8\u306E\u307F",
  "Transfers: {transfers}{partial}. Holders: {holders}. Pool transfers are not proof of a swap or full exit.": "\u9001\u91D1: {transfers}{partial}\u3002\u4FDD\u6709\u30A2\u30C9\u30EC\u30B9: {holders}\u3002\u30D7\u30FC\u30EB\u3078\u306E\u9001\u91D1\u306F\u30B9\u30EF\u30C3\u30D7\u3084\u5168\u984D\u58F2\u5374\u306E\u8A3C\u62E0\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Transfer history could not be loaded. Wallet activity is unknown.": "\u9001\u91D1\u5C65\u6B74\u3092\u8AAD\u307F\u8FBC\u3081\u306A\u3044\u305F\u3081\u3001\u30A6\u30A9\u30EC\u30C3\u30C8\u306E\u6D3B\u52D5\u306F\u4E0D\u660E\u3067\u3059\u3002",
  "No wallet movement matches this filter in the available indexed transfers.": "\u53D6\u5F97\u6E08\u307F\u306E\u9001\u91D1\u5C65\u6B74\u306B\u73FE\u5728\u306E\u6761\u4EF6\u306B\u4E00\u81F4\u3059\u308B\u52D5\u304D\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "{share} of LP supply is held by burn addresses.": "LP\u4F9B\u7D66\u91CF\u306E{share}\u304C\u30D0\u30FC\u30F3\u5148\u30A2\u30C9\u30EC\u30B9\u306B\u3042\u308A\u307E\u3059\u3002",
  "Top {holder} controls {share} of LP supply; a lock is not confirmed.": "\u6700\u5927\u4FDD\u6709{holder}\u306ELP\u6BD4\u7387\u306F{share}\u3067\u3059\u3002\u30ED\u30C3\u30AF\u306F\u78BA\u8A8D\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002",
  "contract": "\u30B3\u30F3\u30C8\u30E9\u30AF\u30C8",
  "wallet": "\u30A6\u30A9\u30EC\u30C3\u30C8",
  "LP ownership is unavailable from the current index.": "\u73FE\u5728\u306E\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u3067\u306FLP\u4FDD\u6709\u72B6\u6CC1\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002",
  "{ownership} LP data: {state}{partial}.": "{ownership} LP\u30C7\u30FC\u30BF: {state}{partial}\u3002",
  "No Mint or Burn event appears in the visible pair history.": "\u53D6\u5F97\u3057\u305F\u30D7\u30FC\u30EB\u5C65\u6B74\u306BMint\u307E\u305F\u306FBurn\u30A4\u30D9\u30F3\u30C8\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "{percent}% of prior USDC reserve": "\u76F4\u524D\u306EUSDC\u6E96\u5099\u91D1\u306E{percent}%",
  "Holders: {state}{partial}. Selected pool {poolShare} \xB7 Burned {burnedShare}. Rankings exclude burn addresses and {count} known same-token pool(s), not all possible pools.": "\u4FDD\u6709\u30A2\u30C9\u30EC\u30B9: {state}{partial}\u3002\u9078\u629E\u30D7\u30FC\u30EB{poolShare} \xB7 \u30D0\u30FC\u30F3{burnedShare}\u3002\u9806\u4F4D\u306F\u30D0\u30FC\u30F3\u5148\u3068\u65E2\u77E5\u306E\u540C\u4E00\u30C8\u30FC\u30AF\u30F3\u30D7\u30FC\u30EB{count}\u4EF6\u3092\u9664\u5916\u3057\u307E\u3059\u3002\u3059\u3079\u3066\u306E\u30D7\u30FC\u30EB\u3092\u9664\u5916\u3057\u305F\u3082\u306E\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Holder positions are unavailable from the current index.": "\u73FE\u5728\u306E\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u3067\u306F\u4FDD\u6709\u30A2\u30C9\u30EC\u30B9\u5225\u306E\u6B8B\u9AD8\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002",
  "Holder connections cannot be checked without holder and transfer data.": "\u4FDD\u6709\u30A2\u30C9\u30EC\u30B9\u3068\u9001\u91D1\u30C7\u30FC\u30BF\u304C\u306A\u3044\u305F\u3081\u3001\u95A2\u9023\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002",
  "No connection appears in the available post-launch history. Holders: {holders}; transfers: {transfers}.": "\u53D6\u5F97\u3057\u305F\u30ED\u30FC\u30F3\u30C1\u5F8C\u306E\u5C65\u6B74\u306B\u95A2\u9023\u306F\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002\u4FDD\u6709\u30A2\u30C9\u30EC\u30B9: {holders}\u3001\u9001\u91D1: {transfers}\u3002",
  "Loaded pools: {count}. Quotes are pool-specific, not executable prices. Default: fresh data first, then highest liquidity.": "{count}\u30D7\u30FC\u30EB\u53D6\u5F97\u3002\u4FA1\u683C\u306F\u30D7\u30FC\u30EB\u56FA\u6709\u3067\u3042\u308A\u3001\u5B9F\u969B\u306B\u7D04\u5B9A\u3067\u304D\u308B\u898B\u7A4D\u3082\u308A\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u6B63\u5E38\u306B\u53D6\u5F97\u3067\u304D\u305F\u30D7\u30FC\u30EB\u3092\u512A\u5148\u3057\u3001\u6B21\u306B\u6D41\u52D5\u6027\u9806\u3067\u8868\u793A\u3057\u307E\u3059\u3002",
  "{state}{partial} \xB7 {trade}": "{state}{partial} \xB7 {trade}",
  "{amount} USDC exit side \xB7 {source}": "\u58F2\u5374\u5148 {amount} USDC \xB7 {source}",
  "Sync reserves": "Sync\u6E96\u5099\u91D1",
  "balance fallback": "\u6B8B\u9AD8\u306B\u3088\u308B\u4EE3\u66FF\u8A08\u7B97",
  "{count} signals": "\u52D5\u304D {count}\u4EF6",
  "{count} events": "\u30A4\u30D9\u30F3\u30C8 {count}\u4EF6",
  "{count} indexed": "\u53D6\u5F97\u6E08\u307F {count}\u30A2\u30C9\u30EC\u30B9",
  "No visible links": "\u78BA\u8A8D\u3067\u304D\u308B\u95A2\u9023\u306A\u3057",
  "{count} links": "\u95A2\u9023 {count}\u4EF6",
  "Liquidity added": "\u6D41\u52D5\u6027\u306E\u8FFD\u52A0",
  "Initial / unknown base": "\u521D\u671F\u72B6\u614B / \u57FA\u6E96\u5024\u4E0D\u660E",
  "Reading indexed changes...": "\u53D6\u5F97\u6E08\u307F\u306E\u5909\u5316\u3092\u78BA\u8A8D\u4E2D",
  "Reading the last 24 hours...": "\u904E\u53BB24\u6642\u9593\u306E\u5C65\u6B74\u3092\u53D6\u5F97\u4E2D",
  "Loading indexed pools...": "\u30D7\u30FC\u30EB\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D",
  "Reading source coverage...": "\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u7BC4\u56F2\u3092\u78BA\u8A8D\u4E2D",
  "Filter token markets": "\u30C8\u30FC\u30AF\u30F3\u5E02\u5834\u306E\u7D5E\u308A\u8FBC\u307F",
  "Filter wallet signals": "\u30A6\u30A9\u30EC\u30C3\u30C8\u306E\u52D5\u304D\u306E\u7D5E\u308A\u8FBC\u307F",
  "Baseline {time} \xB7 stored in this browser.": "\u57FA\u6E96\u6642\u523B {time} \xB7 \u3053\u306E\u30D6\u30E9\u30A6\u30B6\u306B\u4FDD\u5B58\u3055\u308C\u3066\u3044\u307E\u3059\u3002",
  "1% -> {amount} USDC \xB7 {impact}% impact": "1%\u58F2\u5374 \u2192 {amount} USDC \xB7 \u4FA1\u683C\u5F71\u97FF {impact}%",
  "Reading verified ABI and public RPC state...": "\u691C\u8A3C\u6E08\u307FABI\u3068\u516C\u958BRPC\u306E\u72B6\u614B\u3092\u53D6\u5F97\u4E2D",
  "Fixed-block snapshot. Values may have changed since this read.": "\u7279\u5B9A\u30D6\u30ED\u30C3\u30AF\u6642\u70B9\u306E\u5024\u3067\u3059\u3002\u53D6\u5F97\u5F8C\u306B\u5909\u308F\u3063\u3066\u3044\u308B\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002",
  "State not read: no supported verified getters available.": "\u5BFE\u5FDC\u3059\u308B\u691C\u8A3C\u6E08\u307F\u306E\u53C2\u7167\u95A2\u6570\u304C\u306A\u3044\u305F\u3081\u3001\u72B6\u614B\u3092\u53D6\u5F97\u3057\u3066\u3044\u307E\u305B\u3093\u3002",
  "No state snapshot requested.": "\u307E\u3060\u72B6\u614B\u3092\u53D6\u5F97\u3057\u3066\u3044\u307E\u305B\u3093\u3002",
  "{count} checks unavailable from ABI": "ABI\u304B\u3089\u78BA\u8A8D\u3067\u304D\u306A\u3044\u9805\u76EE {count}\u4EF6",
  "Owner": "\u30AA\u30FC\u30CA\u30FC",
  "Pending owner": "\u5909\u66F4\u5F85\u3061\u306E\u30AA\u30FC\u30CA\u30FC",
  "Paused flag": "\u4E00\u6642\u505C\u6B62\u30D5\u30E9\u30B0",
  "Supply cap": "\u4F9B\u7D66\u4E0A\u9650",
  "Total supply": "\u7DCF\u4F9B\u7D66\u91CF",
  "Not checked": "\u672A\u78BA\u8A8D",
  "No matching read function in the available verified ABI. Other controls may exist.": "\u691C\u8A3C\u6E08\u307FABI\u306B\u8A72\u5F53\u3059\u308B\u53C2\u7167\u95A2\u6570\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u4ED6\u306E\u5236\u5FA1\u6A5F\u80FD\u304C\u5B58\u5728\u3059\u308B\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002",
  "No supported verified read signatures were available. No RPC state was inferred.": "\u5BFE\u5FDC\u3059\u308B\u691C\u8A3C\u6E08\u307F\u306E\u53C2\u7167\u95A2\u6570\u304C\u3042\u308A\u307E\u305B\u3093\u3002RPC\u306E\u72B6\u614B\u306F\u63A8\u6E2C\u3057\u3066\u3044\u307E\u305B\u3093\u3002",
  "Reported by this getter; not a complete inventory of control.": "\u3053\u306E\u53C2\u7167\u95A2\u6570\u306E\u623B\u308A\u5024\u3067\u3042\u308A\u3001\u5236\u5FA1\u6A29\u9650\u306E\u5168\u5BB9\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Zero address returned. This does not prove all permissions were renounced.": "\u30BC\u30ED\u30A2\u30C9\u30EC\u30B9\u304C\u8FD4\u3055\u308C\u307E\u3057\u305F\u3002\u3059\u3079\u3066\u306E\u6A29\u9650\u304C\u653E\u68C4\u3055\u308C\u305F\u8A3C\u62E0\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Reported pause flag only; not proof that transfers or sales will succeed.": "\u53D6\u5F97\u3057\u305F\u4E00\u6642\u505C\u6B62\u30D5\u30E9\u30B0\u306E\u307F\u3092\u793A\u3057\u307E\u3059\u3002\u9001\u91D1\u3084\u58F2\u5374\u306E\u6210\u529F\u306F\u4FDD\u8A3C\u3057\u307E\u305B\u3093\u3002",
  "The read failed or returned invalid data. No zero/false value is assumed.": "\u53D6\u5F97\u306B\u5931\u6557\u3057\u305F\u304B\u3001\u7121\u52B9\u306A\u5024\u304C\u8FD4\u3055\u308C\u307E\u3057\u305F\u30020\u3084false\u3068\u306F\u307F\u306A\u3057\u307E\u305B\u3093\u3002",
  "Exact base units, not decimal-adjusted tokens. Does not prove a limit is enforced on every mint path.": "\u5C0F\u6570\u70B9\u8ABF\u6574\u524D\u306E\u6B63\u78BA\u306A\u6700\u5C0F\u5358\u4F4D\u3067\u3059\u3002\u3059\u3079\u3066\u306E\u767A\u884C\u7D4C\u8DEF\u3067\u4E0A\u9650\u304C\u9069\u7528\u3055\u308C\u308B\u8A3C\u62E0\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "BUY": "\u8CB7\u3044",
  "SELL": "\u58F2\u308A",
  "Sender": "\u9001\u4FE1\u8005",
  "Recipient": "\u53D7\u53D6\u4EBA",
  "Sender unknown": "\u9001\u4FE1\u8005\u4E0D\u660E",
  "No trades": "\u53D6\u5F15\u306A\u3057",
  "{count} visible": "\u53D6\u5F97\u6E08\u307F {count}\u4EF6",
  "No swaps are available in the indexed history.": "\u53D6\u5F97\u3057\u305F\u5C65\u6B74\u306B\u30B9\u30EF\u30C3\u30D7\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Checking": "\u78BA\u8A8D\u4E2D",
  "Paused": "\u4E00\u6642\u505C\u6B62",
  "Tab-only monitoring": "\u3053\u306E\u30BF\u30D6\u3067\u306E\u307F\u76E3\u8996",
  "{covered} / {total} watched tokens loaded \xB7 {checked} / {pools} pools with recent ownership reads \xB7 {state}": "\u30A6\u30A9\u30C3\u30C1\u4E2D {covered}/{total}\u30C8\u30FC\u30AF\u30F3\u53D6\u5F97 \xB7 \u4FDD\u6709\u5206\u5E03\u306E\u76F4\u8FD1\u53D6\u5F97 {checked}/{pools}\u30D7\u30FC\u30EB \xB7 {state}",
  "Up to 3 loaded watched pools checked per minute while this tab is visible. No monitoring while hidden or closed. {review}": "\u30BF\u30D6\u8868\u793A\u4E2D\u306E\u307F\u3001\u8AAD\u307F\u8FBC\u307F\u6E08\u307F\u306E\u30A6\u30A9\u30C3\u30C1\u5BFE\u8C61\u3092\u6BCE\u5206\u6700\u59273\u30D7\u30FC\u30EB\u78BA\u8A8D\u3057\u307E\u3059\u3002\u975E\u8868\u793A\u30FB\u7D42\u4E86\u6642\u306F\u76E3\u8996\u3057\u307E\u305B\u3093\u3002{review}",
  "Reviewed {time}.": "\u78BA\u8A8D\u6642\u523B: {time}\u3002",
  "Not reviewed yet.": "\u307E\u3060\u78BA\u8A8D\u3057\u3066\u3044\u307E\u305B\u3093\u3002",
  "No watched tokens.": "\u30A6\u30A9\u30C3\u30C1\u4E2D\u306E\u30C8\u30FC\u30AF\u30F3\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Watched tokens are outside the loaded pool coverage.": "\u30A6\u30A9\u30C3\u30C1\u4E2D\u306E\u30C8\u30FC\u30AF\u30F3\u306F\u8AAD\u307F\u8FBC\u307F\u6E08\u307F\u306E\u30D7\u30FC\u30EB\u7BC4\u56F2\u5916\u3067\u3059\u3002",
  "No recorded changes in this view. Gaps in observation are not proof of no activity.": "\u3053\u306E\u8868\u793A\u7BC4\u56F2\u306B\u8A18\u9332\u3055\u308C\u305F\u5909\u5316\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u89B3\u6E2C\u306E\u7A7A\u767D\u306F\u6D3B\u52D5\u304C\u306A\u3044\u8A3C\u62E0\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Reading pools and recent trades...": "\u30D7\u30FC\u30EB\u3068\u6700\u8FD1\u306E\u53D6\u5F15\u3092\u53D6\u5F97\u4E2D",
  "Price, flow, ownership, and exit risk will appear here.": "\u9078\u629E\u3057\u305F\u30C8\u30FC\u30AF\u30F3\u306E\u4FA1\u683C\u3001\u53D6\u5F15\u30D5\u30ED\u30FC\u3001\u4FDD\u6709\u5206\u5E03\u3001\u58F2\u5374\u30EA\u30B9\u30AF\u3092\u8868\u793A\u3057\u307E\u3059\u3002",
  "Reading holders, liquidity, and trading controls.": "\u4FDD\u6709\u30A2\u30C9\u30EC\u30B9\u3001\u6D41\u52D5\u6027\u3001\u53D6\u5F15\u306E\u5236\u5FA1\u60C5\u5831\u3092\u53D6\u5F97\u4E2D",
  "Public RPC cooldown: one request per token per minute.": "\u516C\u958BRPC\u306E\u53D6\u5F97\u9593\u9694: \u30C8\u30FC\u30AF\u30F3\u3054\u3068\u306B\u6BCE\u52061\u56DE",
  "Read selected contract getters without connecting a wallet": "\u30A6\u30A9\u30EC\u30C3\u30C8\u3092\u63A5\u7D9A\u305B\u305A\u306B\u4E00\u90E8\u306E\u30B3\u30F3\u30C8\u30E9\u30AF\u30C8\u95A2\u6570\u3092\u53C2\u7167\u3057\u307E\u3059\u3002",
  "No indexed sell, or quote-side reserve below 10 USDC. Sorted by quote reserve, not a safety rating.": "\u53D6\u5F97\u3057\u305F\u58F2\u308A\u53D6\u5F15\u304C\u306A\u3044\u3001\u307E\u305F\u306F\u58F2\u5374\u5148\u306E\u6E96\u5099\u91D1\u304C10 USDC\u672A\u6E80\u306E\u30D7\u30FC\u30EB\u3067\u3059\u3002\u6E96\u5099\u91D1\u9806\u3067\u3042\u308A\u3001\u5B89\u5168\u6027\u306E\u8A55\u4FA1\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Search token or contract": "\u30C8\u30FC\u30AF\u30F3\u30FB\u30B3\u30F3\u30C8\u30E9\u30AF\u30C8\u691C\u7D22",
  "Search token, symbol, or contract": "\u30C8\u30FC\u30AF\u30F3\u540D\u30FB\u30B7\u30F3\u30DC\u30EB\u30FB\u30A2\u30C9\u30EC\u30B9\u691C\u7D22",
  "Search": "\u691C\u7D22",
  "Refresh": "\u66F4\u65B0",
  "Refreshing": "\u66F4\u65B0\u4E2D",
  "Color theme": "\u8868\u793A\u30C6\u30FC\u30DE",
  "Light": "\u30E9\u30A4\u30C8",
  "Dark": "\u30C0\u30FC\u30AF",
  "System": "\u81EA\u52D5",
  "Language": "\u8A00\u8A9E",
  "Back to markets": "\u5E02\u5834\u4E00\u89A7\u3078",
  "Changes to review": "\u78BA\u8A8D\u3059\u3079\u304D\u5909\u5316",
  "Selection criteria": "\u62BD\u51FA\u57FA\u6E96",
  "Loaded pool activity": "\u53D6\u5F97\u6E08\u307F\u30D7\u30FC\u30EB\u306E\u52D5\u5411",
  "24H volume": "24\u6642\u9593\u53D6\u5F15\u91CF",
  "USDC pool flow": "\u30D7\u30FC\u30EB\u306EUSDC\u53D6\u5F15\u91CF",
  "24H buys / sells": "24\u6642\u9593 \u8CB7\u3044 / \u58F2\u308A",
  "indexed swaps": "\u53D6\u5F97\u6E08\u307F\u30B9\u30EF\u30C3\u30D7",
  "Net flow": "\u7D14\u6D41\u5165",
  "buy minus sell": "\u8CB7\u3044\u984D \u2212 \u58F2\u308A\u984D",
  "Newest pool": "\u6700\u65B0\u30D7\u30FC\u30EB",
  "Sell observed": "\u58F2\u308A\u3092\u78BA\u8A8D",
  "markets with an indexed sell": "\u58F2\u308A\u53D6\u5F15\u3092\u53D6\u5F97\u3057\u305F\u5E02\u5834",
  "Watchlist changes": "\u30A6\u30A9\u30C3\u30C1\u30EA\u30B9\u30C8\u306E\u5909\u5316",
  "Watchlist change view": "\u30A6\u30A9\u30C3\u30C1\u30EA\u30B9\u30C8\u306E\u8868\u793A\u7BC4\u56F2",
  "Since review": "\u524D\u56DE\u78BA\u8A8D\u4EE5\u964D",
  "Recent history": "\u6700\u8FD1\u306E\u5C65\u6B74",
  "Mark all reviewed": "\u3059\u3079\u3066\u78BA\u8A8D\u6E08\u307F\u306B\u3059\u308B",
  "Arc meme markets": "Arc \u30DF\u30FC\u30E0\u5E02\u5834",
  "All": "\u3059\u3079\u3066",
  "Watchlist": "\u30A6\u30A9\u30C3\u30C1",
  "Moving 24H": "24\u6642\u9593\u306E\u52D5\u304D",
  "New": "\u65B0\u898F",
  "Sell seen": "\u58F2\u308A\u78BA\u8A8D\u6E08\u307F",
  "Needs review": "\u8981\u78BA\u8A8D",
  "Sort by": "\u4E26\u3073\u9806",
  "View default": "\u6A19\u6E96",
  "Liquidity": "\u6D41\u52D5\u6027",
  "Latest trade": "\u76F4\u8FD1\u306E\u53D6\u5F15",
  "Min. liquidity (USDC)": "\u6700\u4F4E\u6D41\u52D5\u6027 (USDC)",
  "Any": "\u6307\u5B9A\u306A\u3057",
  "Traded in 24H": "24\u6642\u9593\u4EE5\u5185\u306E\u53D6\u5F15",
  "Token": "\u30C8\u30FC\u30AF\u30F3",
  "Price": "\u4FA1\u683C",
  "Market pulse": "\u4FA1\u683C\u63A8\u79FB",
  "Buys / Sells": "\u8CB7\u3044 / \u58F2\u308A",
  "Age": "\u7D4C\u904E\u6642\u9593",
  "Select a token": "\u30C8\u30FC\u30AF\u30F3\u3092\u9078\u629E",
  "Checking the token": "\u30C8\u30FC\u30AF\u30F3\u3092\u78BA\u8A8D\u4E2D",
  "Full details": "\u8A73\u7D30\u30DA\u30FC\u30B8",
  "Copy link": "\u30EA\u30F3\u30AF\u3092\u30B3\u30D4\u30FC",
  "fully diluted": "\u5B8C\u5168\u5E0C\u8584\u5316\u8A55\u4FA1\u984D",
  "Holders": "\u4FDD\u6709\u30A2\u30C9\u30EC\u30B9",
  "indexed addresses": "\u53D6\u5F97\u6E08\u307F\u30A2\u30C9\u30EC\u30B9\u6570",
  "Observed changes": "\u89B3\u6E2C\u3055\u308C\u305F\u5909\u5316",
  "Stored in this browser.": "\u3053\u306E\u30D6\u30E9\u30A6\u30B6\u306B\u4FDD\u5B58\u3055\u308C\u3066\u3044\u307E\u3059\u3002",
  "Pool comparison": "\u30D7\u30FC\u30EB\u6BD4\u8F03",
  "Selected pool": "\u9078\u629E\u4E2D\u306E\u30D7\u30FC\u30EB",
  "Pool": "\u30D7\u30FC\u30EB",
  "Price (USDC)": "\u4FA1\u683C (USDC)",
  "Data": "\u30C7\u30FC\u30BF",
  "Pool price": "\u30D7\u30FC\u30EB\u57FA\u6E96\u4FA1\u683C",
  "Indexed price path": "\u53D6\u5F97\u6E08\u307F\u306E\u4FA1\u683C\u63A8\u79FB",
  "Last 24 hours": "\u904E\u53BB24\u6642\u9593",
  "Recent market flow": "\u6700\u8FD1\u306E\u53D6\u5F15\u30D5\u30ED\u30FC",
  "Buys": "\u8CB7\u3044",
  "Sells": "\u58F2\u308A",
  "Volume": "\u53D6\u5F15\u91CF",
  "Last trade": "\u6700\u7D42\u53D6\u5F15",
  "Visible transactions": "\u53D6\u5F97\u6E08\u307F\u306E\u53D6\u5F15",
  "Recent trade tape": "\u6700\u8FD1\u306E\u7D04\u5B9A\u5C65\u6B74",
  "Wallet intelligence": "\u30A6\u30A9\u30EC\u30C3\u30C8\u5206\u6790",
  "Wallet signals": "\u30A6\u30A9\u30EC\u30C3\u30C8\u306E\u52D5\u304D",
  "Creation sender": "\u30D7\u30FC\u30EB\u4F5C\u6210TX\u306E\u9001\u4FE1\u8005",
  "moves": "\u52D5\u304D",
  "Whales": "\u5927\u53E3\u4FDD\u6709\u8005",
  "top / large": "\u4E0A\u4F4D\u30FB\u5927\u53E3",
  "Receipts": "\u53D7\u53D6",
  "first visible": "\u53D6\u5F97\u7BC4\u56F2\u5185\u306E\u521D\u56DE",
  "To pool": "\u30D7\u30FC\u30EB\u3078",
  "transfers": "\u9001\u91D1",
  "Pool safety": "\u30D7\u30FC\u30EB\u306E\u78BA\u8A8D",
  "Liquidity monitor": "\u6D41\u52D5\u6027\u306E\u5909\u5316",
  "Exit side": "\u58F2\u5374\u5148\u306E\u6E96\u5099\u91D1",
  "USDC now": "\u73FE\u5728\u306EUSDC",
  "24H added": "24\u6642\u9593\u306E\u8FFD\u52A0",
  "24H removed": "24\u6642\u9593\u306E\u5F15\u304D\u51FA\u3057",
  "LP burned": "\u30D0\u30FC\u30F3\u5148\u306ELP",
  "of LP supply": "LP\u4F9B\u7D66\u91CF\u306B\u5BFE\u3059\u308B\u6BD4\u7387",
  "Ownership": "\u4FDD\u6709\u5206\u5E03",
  "Holder distribution": "\u4FDD\u6709\u30A2\u30C9\u30EC\u30B9\u306E\u5206\u5E03",
  "Top 1": "\u4E0A\u4F4D1\u4EF6",
  "Top 5": "\u4E0A\u4F4D5\u4EF6",
  "Top 10": "\u4E0A\u4F4D10\u4EF6",
  "of supply": "\u4F9B\u7D66\u91CF\u306B\u5BFE\u3059\u308B\u6BD4\u7387",
  "indexed share": "\u53D6\u5F97\u6E08\u307F\u306E\u6BD4\u7387",
  "On-chain relationships": "\u30AA\u30F3\u30C1\u30A7\u30FC\u30F3\u306E\u95A2\u9023",
  "Holder connections": "\u4FDD\u6709\u30A2\u30C9\u30EC\u30B9\u306E\u95A2\u9023",
  "Connections": "\u95A2\u9023",
  "indexed links": "\u53D6\u5F97\u6E08\u307F\u306E\u95A2\u9023",
  "Connected": "\u95A2\u9023\u30A2\u30C9\u30EC\u30B9",
  "top holders": "\u4E0A\u4F4D\u4FDD\u6709\u8005",
  "Clusters": "\u30B0\u30EB\u30FC\u30D7",
  "linked groups": "\u95A2\u9023\u30B0\u30EB\u30FC\u30D7",
  "Largest": "\u6700\u5927\u30B0\u30EB\u30FC\u30D7",
  "Evidence, not a safety score": "\u5B89\u5168\u30B9\u30B3\u30A2\u3067\u306F\u306A\u304F\u78BA\u8A8D\u6839\u62E0",
  "Token checks": "\u30C8\u30FC\u30AF\u30F3\u306E\u78BA\u8A8D",
  "Read-only RPC": "\u53C2\u7167\u5C02\u7528RPC",
  "Contract state": "\u30B3\u30F3\u30C8\u30E9\u30AF\u30C8\u306E\u72B6\u614B",
  "Read state": "\u72B6\u614B\u3092\u53D6\u5F97",
  "Read again": "\u518D\u53D6\u5F97",
  "Reading...": "\u53D6\u5F97\u4E2D",
  "Exit pressure": "\u58F2\u308A\u5727\u529B",
  "Sell-size impact": "\u58F2\u5374\u898F\u6A21\u5225\u306E\u4FA1\u683C\u5F71\u97FF",
  "0.1% supply": "\u4F9B\u7D66\u91CF\u306E0.1%",
  "5% supply": "\u4F9B\u7D66\u91CF\u306E5%",
  "Loading pools...": "\u30D7\u30FC\u30EB\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D",
  "Retry loading": "\u518D\u8AAD\u307F\u8FBC\u307F",
  "Load 15 more": "\u3055\u3089\u306B15\u4EF6",
  "Scan limit reached": "\u53D6\u5F97\u4E0A\u9650\u306B\u5230\u9054",
  "No more pools": "\u3059\u3079\u3066\u8AAD\u307F\u8FBC\u307F\u6E08\u307F",
  "No token has indexed trading activity in the last 24 hours.": "\u904E\u53BB24\u6642\u9593\u306B\u53D6\u5F15\u3092\u53D6\u5F97\u3057\u305F\u30C8\u30FC\u30AF\u30F3\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "No token is currently on this browser's watchlist.": "\u3053\u306E\u30D6\u30E9\u30A6\u30B6\u306E\u30A6\u30A9\u30C3\u30C1\u30EA\u30B9\u30C8\u306B\u30C8\u30FC\u30AF\u30F3\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "No token matches this view.": "\u6761\u4EF6\u306B\u4E00\u81F4\u3059\u308B\u30C8\u30FC\u30AF\u30F3\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Price unavailable": "\u4FA1\u683C\u53D6\u5F97\u4E0D\u53EF",
  "Indexed event": "\u53D6\u5F97\u6E08\u307F\u30A4\u30D9\u30F3\u30C8",
  "Calculated": "\u8A08\u7B97\u5024",
  "Unverified": "\u672A\u691C\u8A3C",
  "Checks incomplete": "\u78BA\u8A8D\u672A\u5B8C\u4E86",
  "Evidence only": "\u6839\u62E0\u306E\u307F",
  "Source TX": "\u6839\u62E0TX",
  "Liquidity removed": "\u6D41\u52D5\u6027\u306E\u5F15\u304D\u51FA\u3057",
  "Large 1H price move": "1\u6642\u9593\u306E\u4FA1\u683C\u6025\u5909",
  "New pool with indexed trades": "\u53D6\u5F15\u3092\u53D6\u5F97\u3057\u305F\u65B0\u898F\u30D7\u30FC\u30EB",
  "{count} tokens": "{count}\u30C8\u30FC\u30AF\u30F3",
  "{count} more changes": "\u3055\u3089\u306B{count}\u4EF6\u306E\u5909\u5316",
  "{symbol} \xB7 {title}": "{symbol} \xB7 {title}",
  "{amount} USDC removed; {percent}% of prior USDC reserve.": "{amount} USDC\u5F15\u304D\u51FA\u3057 \xB7 \u76F4\u524D\u306EUSDC\u6E96\u5099\u91D1\u306E{percent}%",
  "1H reserve-price change: {change}. Not an executable quote.": "1\u6642\u9593\u306E\u6E96\u5099\u91D1\u57FA\u6E96\u4FA1\u683C\u306E\u5909\u5316: {change}\u3002\u5B9F\u969B\u306B\u7D04\u5B9A\u3067\u304D\u308B\u4FA1\u683C\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Pool creation and subsequent trades appear in the available index. Not a token endorsement.": "\u53D6\u5F97\u3057\u305F\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u3067\u30D7\u30FC\u30EB\u4F5C\u6210\u3068\u305D\u306E\u5F8C\u306E\u53D6\u5F15\u3092\u78BA\u8A8D\u3057\u307E\u3057\u305F\u3002\u30C8\u30FC\u30AF\u30F3\u306E\u63A8\u5968\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Market refresh failed. Recent changes cannot be assessed.": "\u5E02\u5834\u30C7\u30FC\u30BF\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u6700\u8FD1\u306E\u5909\u5316\u306F\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002",
  "No qualifying recent change in the loaded pools. This is not an all-clear.": "\u53D6\u5F97\u6E08\u307F\u30D7\u30FC\u30EB\u306B\u6761\u4EF6\u3092\u6E80\u305F\u3059\u6700\u8FD1\u306E\u5909\u5316\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u5B89\u5168\u3068\u3044\u3046\u610F\u5473\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "{tokens} tokens \xB7 {pools} loaded pools \xB7 representative pools: {trades} indexed swaps \xB7 {liquidity} USDC liquidity \xB7 {partial} partial histories": "{tokens}\u30C8\u30FC\u30AF\u30F3 \xB7 {pools}\u30D7\u30FC\u30EB \xB7 \u4EE3\u8868\u30D7\u30FC\u30EB: \u53D6\u5F97\u6E08\u307F\u30B9\u30EF\u30C3\u30D7{trades}\u4EF6 \xB7 \u6D41\u52D5\u6027{liquidity} USDC \xB7 \u5C65\u6B74\u304C\u4E00\u90E8\u306E\u307F{partial}\u4EF6",
  "{pools} pools loaded \xB7 {sources} {network} USDC market sources{limit}": "{pools}\u30D7\u30FC\u30EB\u53D6\u5F97 \xB7 {network} USDC\u30C7\u30FC\u30BF\u30BD\u30FC\u30B9{sources}\u4EF6{limit}",
  " \xB7 Scan limit reached": " \xB7 \u53D6\u5F97\u4E0A\u9650\u306B\u5230\u9054",
  " \xB7 150-pool limit": " \xB7 \u4E0A\u9650150\u30D7\u30FC\u30EB",
  " \xB7 {count} unavailable": " \xB7 {count}\u4EF6\u53D6\u5F97\u4E0D\u53EF",
  "{network} \xB7 {sources} configured v2 source(s) \xB7 {pools} loaded pools \xB7 Not the whole chain": "{network} \xB7 \u767B\u9332\u6E08\u307Fv2\u30BD\u30FC\u30B9{sources}\u4EF6 \xB7 {pools}\u30D7\u30FC\u30EB \xB7 \u30C1\u30A7\u30FC\u30F3\u5168\u4F53\u3067\u306F\u3042\u308A\u307E\u305B\u3093",
  "{cached} cached \xB7 {partial} partial histories{failed}": "\u30AD\u30E3\u30C3\u30B7\u30E5{cached}\u4EF6 \xB7 \u5C65\u6B74\u304C\u4E00\u90E8\u306E\u307F{partial}\u4EF6{failed}",
  " \xB7 Refresh failed": " \xB7 \u66F4\u65B0\u5931\u6557",
  "{count} swaps indexed in the last 24 hours \xB7 {partial} partial pools \xB7 {cached} cached pools": "\u904E\u53BB24\u6642\u9593\u306E\u53D6\u5F97\u6E08\u307F\u30B9\u30EF\u30C3\u30D7{count}\u4EF6 \xB7 \u5C65\u6B74\u304C\u4E00\u90E8\u306E\u307F{partial}\u30D7\u30FC\u30EB \xB7 \u30AD\u30E3\u30C3\u30B7\u30E5{cached}\u30D7\u30FC\u30EB",
  "{holders} holders \xB7 {pools} pools": "\u4FDD\u6709\u30A2\u30C9\u30EC\u30B9{holders}\u4EF6 \xB7 {pools}\u30D7\u30FC\u30EB",
  "Cached": "\u30AD\u30E3\u30C3\u30B7\u30E5",
  "Fetched": "\u53D6\u5F97\u6E08\u307F",
  "Updated": "\u66F4\u65B0",
  "fresh": "\u53D6\u5F97\u6E08\u307F",
  "cached": "\u30AD\u30E3\u30C3\u30B7\u30E5",
  "unavailable": "\u53D6\u5F97\u4E0D\u53EF",
  "Unavailable": "\u53D6\u5F97\u4E0D\u53EF",
  "None": "\u306A\u3057",
  " \xB7 Partial history": " \xB7 \u5C65\u6B74\u306F\u4E00\u90E8\u306E\u307F",
  " \xB7 partial history": " \xB7 \u5C65\u6B74\u306F\u4E00\u90E8\u306E\u307F",
  "{state}{partial}": "{state}{partial}",
  "{amount} exit side": "\u58F2\u5374\u5148 {amount}",
  "B {count}": "\u8CB7\u3044 {count}",
  "S {count}": "\u58F2\u308A {count}",
  "no trades": "\u53D6\u5F15\u306A\u3057",
  "{time} ago": "{time}\u524D",
  "{time} old": "{time}\u7D4C\u904E",
  "trade {time}": "\u53D6\u5F15 {time}\u524D",
  "No pool indexed": "\u53D6\u5F97\u6E08\u307F\u30D7\u30FC\u30EB\u306A\u3057",
  "Pool {address} \xB7 {time} ago{partial}": "\u30D7\u30FC\u30EB {address} \xB7 {time}\u524D{partial}",
  "Open {symbol} market": "{symbol}\u306E\u5E02\u5834\u3092\u958B\u304F",
  "Add token to watchlist": "\u30C8\u30FC\u30AF\u30F3\u3092\u30A6\u30A9\u30C3\u30C1\u30EA\u30B9\u30C8\u306B\u8FFD\u52A0",
  "Remove token from watchlist": "\u30C8\u30FC\u30AF\u30F3\u3092\u30A6\u30A9\u30C3\u30C1\u30EA\u30B9\u30C8\u304B\u3089\u524A\u9664",
  "Add to watchlist": "\u30A6\u30A9\u30C3\u30C1\u30EA\u30B9\u30C8\u306B\u8FFD\u52A0",
  "Remove from watchlist": "\u30A6\u30A9\u30C3\u30C1\u30EA\u30B9\u30C8\u304B\u3089\u524A\u9664",
  "Link copied": "\u30EA\u30F3\u30AF\u3092\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F",
  "Copy unavailable. Use the Full details link.": "\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\u3002\u8A73\u7D30\u30DA\u30FC\u30B8\u306E\u30EA\u30F3\u30AF\u3092\u3054\u5229\u7528\u304F\u3060\u3055\u3044\u3002",
  "Connecting...": "\u63A5\u7D9A\u4E2D",
  "Connection unavailable": "\u63A5\u7D9A\u4E0D\u53EF",
  "Network unavailable": "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u5229\u7528\u4E0D\u53EF",
  "Invalid link": "\u7121\u52B9\u306A\u30EA\u30F3\u30AF",
  "{state} {time}": "{state} {time}",
  "{network} MARKET FEED": "{network} \u5E02\u5834\u30C7\u30FC\u30BF",
  "No match in the loaded pools with these filters.": "\u53D6\u5F97\u6E08\u307F\u30D7\u30FC\u30EB\u306B\u73FE\u5728\u306E\u6761\u4EF6\u3068\u4E00\u81F4\u3059\u308B\u3082\u306E\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Live indexing is temporarily unavailable. Showing the latest cached market snapshot.": "\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u306E\u53D6\u5F97\u304C\u4E00\u6642\u7684\u306B\u3067\u304D\u306A\u3044\u305F\u3081\u3001\u6700\u65B0\u306E\u30AD\u30E3\u30C3\u30B7\u30E5\u30C7\u30FC\u30BF\u3092\u8868\u793A\u3057\u3066\u3044\u307E\u3059\u3002",
  "Market data unavailable: {error}": "\u5E02\u5834\u30C7\u30FC\u30BF\u53D6\u5F97\u4E0D\u53EF: {error}",
  "Market data unavailable.": "\u5E02\u5834\u30C7\u30FC\u30BF\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3002",
  "Detail checks are incomplete": "\u8A73\u7D30\u78BA\u8A8D\u304C\u672A\u5B8C\u4E86",
  "Holder index is partial": "\u4FDD\u6709\u30A2\u30C9\u30EC\u30B9\u306E\u53D6\u5F97\u306F\u4E00\u90E8\u306E\u307F",
  "Only the first holder page is available. Unseen balances and incomplete burn totals remain unknown.": "\u4FDD\u6709\u30A2\u30C9\u30EC\u30B9\u306E\u6700\u521D\u306E\u30DA\u30FC\u30B8\u306E\u307F\u53D6\u5F97\u3067\u304D\u307E\u3057\u305F\u3002\u672A\u53D6\u5F97\u306E\u6B8B\u9AD8\u3084\u30D0\u30FC\u30F3\u306E\u7DCF\u91CF\u306F\u4E0D\u660E\u3067\u3059\u3002",
  "24H starting price unavailable": "24\u6642\u9593\u524D\u306E\u57FA\u6E96\u4FA1\u683C\u306A\u3057",
  "The 24H return is not estimated from a shorter window.": "\u77ED\u3044\u671F\u9593\u306E\u30C7\u30FC\u30BF\u304B\u308924\u6642\u9593\u306E\u9A30\u843D\u7387\u306F\u63A8\u5B9A\u3057\u307E\u305B\u3093\u3002",
  "24-hour activity is partial": "24\u6642\u9593\u306E\u5C65\u6B74\u306F\u4E00\u90E8\u306E\u307F",
  "Older events beyond the ArcScan page limit are not included in totals.": "ArcScan\u306E\u30DA\u30FC\u30B8\u4E0A\u9650\u3092\u8D85\u3048\u308B\u904E\u53BB\u306E\u30A4\u30D9\u30F3\u30C8\u306F\u5408\u8A08\u306B\u542B\u307E\u308C\u307E\u305B\u3093\u3002",
  "Token-balance fallback": "\u30C8\u30FC\u30AF\u30F3\u6B8B\u9AD8\u306B\u3088\u308B\u4EE3\u66FF\u8A08\u7B97",
  "No indexed Sync event was available. Price and liquidity are derived from the pair's token balances.": "Sync\u30A4\u30D9\u30F3\u30C8\u3092\u53D6\u5F97\u3067\u304D\u306A\u304B\u3063\u305F\u305F\u3081\u3001\u30DA\u30A2\u306E\u30C8\u30FC\u30AF\u30F3\u6B8B\u9AD8\u304B\u3089\u4FA1\u683C\u3068\u6D41\u52D5\u6027\u3092\u8A08\u7B97\u3057\u3066\u3044\u307E\u3059\u3002",
  "Sell event indexed": "\u58F2\u308A\u30A4\u30D9\u30F3\u30C8\u3092\u53D6\u5F97\u6E08\u307F",
  "No sell in available history": "\u53D6\u5F97\u5C65\u6B74\u306B\u58F2\u308A\u306A\u3057",
  "Absence of indexed sells does not prove a token is unsellable.": "\u53D6\u5F97\u6E08\u307F\u306E\u58F2\u308A\u304C\u306A\u3044\u3053\u3068\u306F\u3001\u58F2\u5374\u3067\u304D\u306A\u3044\u8A3C\u62E0\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Pool liquidity below 200 USDC": "\u30D7\u30FC\u30EB\u6D41\u52D5\u6027200 USDC\u672A\u6E80",
  "Top-10 ownership exceeds 25%": "\u4E0A\u4F4D10\u30A2\u30C9\u30EC\u30B9\u306E\u4FDD\u6709\u738725%\u8D85",
  "Pool-creation sender holds at least 10%": "\u30D7\u30FC\u30EB\u4F5C\u6210TX\u306E\u9001\u4FE1\u8005\u304C10%\u4EE5\u4E0A\u4FDD\u6709",
  "LP at burn addresses": "\u30D0\u30FC\u30F3\u5148\u30A2\u30C9\u30EC\u30B9\u306ELP",
  "Liquidity lock not independently checked": "\u6D41\u52D5\u6027\u30ED\u30C3\u30AF\u306F\u672A\u691C\u8A3C",
  "LP ownership or lock terms could not be established.": "LP\u306E\u4FDD\u6709\u72B6\u6CC1\u3084\u30ED\u30C3\u30AF\u6761\u4EF6\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002",
  "Execution paths not verified": "\u5B9F\u884C\u7D4C\u8DEF\u306F\u672A\u691C\u8A3C",
  "Contract ABI unavailable": "\u30B3\u30F3\u30C8\u30E9\u30AF\u30C8ABI\u53D6\u5F97\u4E0D\u53EF",
  "No matching ABI names": "\u4E00\u81F4\u3059\u308BABI\u95A2\u6570\u540D\u306A\u3057",
  "No sell simulation or full permission audit is performed. Optional contract-state reads below report selected getter values only; they do not prove a control is usable, disabled, or absent elsewhere.": "\u58F2\u5374\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3084\u6A29\u9650\u306E\u5168\u9762\u76E3\u67FB\u306F\u884C\u3044\u307E\u305B\u3093\u3002\u4EE5\u4E0B\u306E\u4EFB\u610F\u306E\u72B6\u614B\u53D6\u5F97\u306F\u4E00\u90E8\u306E\u53C2\u7167\u95A2\u6570\u306E\u623B\u308A\u5024\u306E\u307F\u3067\u3001\u6A29\u9650\u306E\u5B9F\u884C\u53EF\u5426\u3001\u7121\u52B9\u5316\u3001\u4ED6\u306E\u5236\u5FA1\u306E\u4E0D\u5728\u3092\u8A3C\u660E\u3057\u307E\u305B\u3093\u3002",
  "Supply and trading controls cannot be assessed from the available ABI.": "\u53D6\u5F97\u53EF\u80FD\u306AABI\u3060\u3051\u3067\u306F\u4F9B\u7D66\u30FB\u53D6\u5F15\u306E\u5236\u5FA1\u3092\u8A55\u4FA1\u3067\u304D\u307E\u305B\u3093\u3002",
  "No configured function-name pattern matched. Custom logic, external contracts, or different function names may still impose restrictions.": "\u8A2D\u5B9A\u6E08\u307F\u306E\u95A2\u6570\u540D\u30D1\u30BF\u30FC\u30F3\u306B\u4E00\u81F4\u3057\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u72EC\u81EA\u30ED\u30B8\u30C3\u30AF\u3001\u5916\u90E8\u30B3\u30F3\u30C8\u30E9\u30AF\u30C8\u3001\u5225\u306E\u95A2\u6570\u540D\u3067\u5236\u9650\u3055\u308C\u3066\u3044\u308B\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002",
  "{sources}. Missing data is not a clean risk check.": "{sources}\u3002\u30C7\u30FC\u30BF\u306E\u6B20\u843D\u306F\u30EA\u30B9\u30AF\u304C\u306A\u3044\u3053\u3068\u3092\u610F\u5473\u3057\u307E\u305B\u3093\u3002",
  "A token-to-USDC Swap was indexed {time} ago. This does not prove that any wallet can sell now.": "{time}\u524D\u306B\u30C8\u30FC\u30AF\u30F3\u304B\u3089USDC\u3078\u306E\u30B9\u30EF\u30C3\u30D7\u3092\u53D6\u5F97\u3057\u307E\u3057\u305F\u3002\u73FE\u5728\u3069\u306E\u30A6\u30A9\u30EC\u30C3\u30C8\u3067\u3082\u58F2\u5374\u3067\u304D\u308B\u8A3C\u62E0\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Reserve-based estimate: {total} USDC total, {quote} USDC on the quote side. This threshold is a screening rule, not a safety rating.": "\u6E96\u5099\u91D1\u30D9\u30FC\u30B9\u306E\u63A8\u5B9A: \u5408\u8A08{total} USDC\u3001\u58F2\u5374\u5148{quote} USDC\u3002\u3053\u306E\u95BE\u5024\u306F\u62BD\u51FA\u57FA\u6E96\u3067\u3042\u308A\u3001\u5B89\u5168\u6027\u306E\u8A55\u4FA1\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "{share}% of indexed supply, excluding burn addresses and known pools. Addresses are not necessarily independent owners.": "\u30D0\u30FC\u30F3\u5148\u3068\u65E2\u77E5\u306E\u30D7\u30FC\u30EB\u3092\u9664\u304F\u4F9B\u7D66\u91CF\u306E{share}%\u3067\u3059\u3002\u7570\u306A\u308B\u30A2\u30C9\u30EC\u30B9\u304C\u72EC\u7ACB\u3057\u305F\u6240\u6709\u8005\u3068\u306F\u9650\u308A\u307E\u305B\u3093\u3002",
  "Indexed share: {share}%. This transaction sender may be a relayer; it is not proof of the token team's identity.": "\u53D6\u5F97\u6E08\u307F\u306E\u6BD4\u7387: {share}%\u3002\u9001\u4FE1\u8005\u306F\u4E2D\u7D99\u8005\u306E\u53EF\u80FD\u6027\u304C\u3042\u308A\u3001\u30C8\u30FC\u30AF\u30F3\u30C1\u30FC\u30E0\u306E\u8EAB\u5143\u3092\u8A3C\u660E\u3057\u307E\u305B\u3093\u3002",
  "{share}% of indexed LP supply. This does not establish token safety or sale availability.": "\u53D6\u5F97\u6E08\u307FLP\u4F9B\u7D66\u91CF\u306E{share}%\u3067\u3059\u3002\u30C8\u30FC\u30AF\u30F3\u306E\u5B89\u5168\u6027\u3084\u58F2\u5374\u53EF\u80FD\u6027\u3092\u8A3C\u660E\u3057\u307E\u305B\u3093\u3002",
  "Top indexed LP holder: {share}%. Lock contract rules and unlock times have not been checked.": "\u53D6\u5F97\u6E08\u307F\u306E\u6700\u5927LP\u4FDD\u6709\u7387: {share}%\u3002\u30ED\u30C3\u30AF\u5951\u7D04\u306E\u6761\u4EF6\u3084\u89E3\u9664\u6642\u523B\u306F\u78BA\u8A8D\u3057\u3066\u3044\u307E\u305B\u3093\u3002",
  "Supply-related function names": "\u4F9B\u7D66\u95A2\u9023\u306E\u95A2\u6570\u540D",
  "Restriction-related function names": "\u5236\u9650\u95A2\u9023\u306E\u95A2\u6570\u540D",
  "Pause-related function names": "\u4E00\u6642\u505C\u6B62\u95A2\u9023\u306E\u95A2\u6570\u540D",
  "Upgrade or proxy indicators": "\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9\u30FB\u30D7\u30ED\u30AD\u30B7\u306E\u624B\u639B\u304B\u308A",
  "Fee-related function names": "\u624B\u6570\u6599\u95A2\u9023\u306E\u95A2\u6570\u540D",
  "{evidence} Names alone do not establish current permissions or execution paths. Selected getter values, when requested, appear separately under Contract state and do not confirm this capability is usable.": "{evidence} \u95A2\u6570\u540D\u3060\u3051\u3067\u306F\u73FE\u5728\u306E\u6A29\u9650\u3084\u5B9F\u884C\u7D4C\u8DEF\u306F\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002\u53C2\u7167\u3057\u305F\u623B\u308A\u5024\u306F\u30B3\u30F3\u30C8\u30E9\u30AF\u30C8\u306E\u72B6\u614B\u306B\u5225\u9014\u8868\u793A\u3055\u308C\u307E\u3059\u304C\u3001\u6A5F\u80FD\u304C\u5B9F\u884C\u53EF\u80FD\u3067\u3042\u308B\u3053\u3068\u306F\u8A3C\u660E\u3057\u307E\u305B\u3093\u3002",
  "{indexed} indexed \xB7 {calculated} calculated \xB7 {unverified} unverified": "\u53D6\u5F97\u6E08\u307F{indexed}\u4EF6 \xB7 \u8A08\u7B97\u5024{calculated}\u4EF6 \xB7 \u672A\u691C\u8A3C{unverified}\u4EF6",
  "Market: {market} \xB7 Contract: {contract} \xB7 Holders: {holders} \xB7 No safety score": "\u5E02\u5834: {market} \xB7 \u30B3\u30F3\u30C8\u30E9\u30AF\u30C8: {contract} \xB7 \u4FDD\u6709\u30A2\u30C9\u30EC\u30B9: {holders} \xB7 \u5B89\u5168\u30B9\u30B3\u30A2\u306A\u3057",
  "Evidence completeness, not a risk score or safety verdict.": "\u6839\u62E0\u306E\u53D6\u5F97\u72B6\u6CC1\u3067\u3042\u308A\u3001\u30EA\u30B9\u30AF\u30B9\u30B3\u30A2\u3084\u5B89\u5168\u6027\u306E\u5224\u5B9A\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Token contract": "\u30C8\u30FC\u30AF\u30F3\u5951\u7D04",
  "Pool events": "\u30D7\u30FC\u30EB\u30A4\u30D9\u30F3\u30C8",
  "Holder index": "\u4FDD\u6709\u30A2\u30C9\u30EC\u30B9\u4E00\u89A7",
  "Source: ArcScan. Indexing may lag. V2 pools only; mainnet and other DEX protocols are not connected.": "\u51FA\u5178: ArcScan\u3002\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u306B\u9045\u5EF6\u306E\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002V2\u30D7\u30FC\u30EB\u306E\u307F\u5BFE\u5FDC\u3057\u3001\u30E1\u30A4\u30F3\u30CD\u30C3\u30C8\u3084\u4ED6\u306EDEX\u30D7\u30ED\u30C8\u30B3\u30EB\u306F\u672A\u63A5\u7D9A\u3067\u3059\u3002",
  "Loaded pools only. Latest liquidity removal of at least 10% of prior USDC reserve, then 1H price moves of at least 30%, then newly created pools with indexed trades. One item per token, up to six. Cached markets are excluded. These are screening rules, not recommendations.": "\u53D6\u5F97\u6E08\u307F\u30D7\u30FC\u30EB\u306E\u307F\u304C\u5BFE\u8C61\u3067\u3059\u3002\u76F4\u524D\u306EUSDC\u6E96\u5099\u91D1\u306E10%\u4EE5\u4E0A\u306E\u5F15\u304D\u51FA\u3057\u30011\u6642\u9593\u306730%\u4EE5\u4E0A\u306E\u4FA1\u683C\u5909\u52D5\u3001\u53D6\u5F15\u3092\u53D6\u5F97\u3057\u305F\u65B0\u898F\u30D7\u30FC\u30EB\u306E\u9806\u306B\u8868\u793A\u3057\u307E\u3059\u3002\u30C8\u30FC\u30AF\u30F3\u3054\u3068\u306B1\u4EF6\u3001\u6700\u59276\u4EF6\u3002\u30AD\u30E3\u30C3\u30B7\u30E5\u306F\u9664\u5916\u3057\u307E\u3059\u3002\u63A8\u5968\u3067\u306F\u306A\u304F\u62BD\u51FA\u57FA\u6E96\u3067\u3059\u3002",
  "Pool changes are calculated from indexed Mint, Burn, and Sync events.": "\u30D7\u30FC\u30EB\u306E\u5909\u5316\u306F\u53D6\u5F97\u6E08\u307F\u306EMint\u3001Burn\u3001Sync\u30A4\u30D9\u30F3\u30C8\u304B\u3089\u8A08\u7B97\u3057\u307E\u3059\u3002",
  "Connections mean an indexed direct transfer or a shared non-contract source. They do not prove common ownership.": "\u95A2\u9023\u306F\u53D6\u5F97\u6E08\u307F\u306E\u76F4\u63A5\u9001\u91D1\u3001\u307E\u305F\u306F\u540C\u3058\u975E\u30B3\u30F3\u30C8\u30E9\u30AF\u30C8\u30A2\u30C9\u30EC\u30B9\u304B\u3089\u306E\u53D7\u53D6\u3092\u793A\u3057\u307E\u3059\u3002\u540C\u4E00\u6240\u6709\u8005\u306E\u8A3C\u62E0\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
  "Selected getters only. No sell simulation, proxy-storage verification, or complete permission audit. Missing reads do not imply safety.": "\u4E00\u90E8\u306E\u53C2\u7167\u95A2\u6570\u306E\u307F\u3092\u78BA\u8A8D\u3057\u307E\u3059\u3002\u58F2\u5374\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3001\u30D7\u30ED\u30AD\u30B7\u306E\u30B9\u30C8\u30EC\u30FC\u30B8\u691C\u8A3C\u3001\u6A29\u9650\u306E\u5168\u9762\u76E3\u67FB\u306F\u884C\u3044\u307E\u305B\u3093\u3002\u53D6\u5F97\u3067\u304D\u306A\u3044\u9805\u76EE\u304C\u3042\u3063\u3066\u3082\u5B89\u5168\u3068\u306F\u9650\u308A\u307E\u305B\u3093\u3002",
  "Single-pool v2 estimate with an assumed 0.3% fee. No sell simulation. Token taxes, limits, MEV, and routing are not included.": "\u5358\u4E00\u306EV2\u30D7\u30FC\u30EB\u3068\u624B\u6570\u65990.3%\u3092\u4EEE\u5B9A\u3057\u305F\u63A8\u5B9A\u5024\u3067\u3059\u3002\u58F2\u5374\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3067\u306F\u306A\u304F\u3001\u30C8\u30FC\u30AF\u30F3\u7A0E\u3001\u5236\u9650\u3001MEV\u3001\u30EB\u30FC\u30C6\u30A3\u30F3\u30B0\u306F\u542B\u307F\u307E\u305B\u3093\u3002",
  "Independent read-only analytics. Not affiliated with Circle or Arc. No token is endorsed and no safety result is guaranteed.": "\u72EC\u7ACB\u3057\u305F\u53C2\u7167\u5C02\u7528\u306E\u5206\u6790\u30B5\u30FC\u30D3\u30B9\u3067\u3059\u3002Circle\u30FBArc\u3068\u306E\u63D0\u643A\u95A2\u4FC2\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u30C8\u30FC\u30AF\u30F3\u306E\u63A8\u5968\u3084\u5B89\u5168\u6027\u306E\u4FDD\u8A3C\u306F\u884C\u3044\u307E\u305B\u3093\u3002"
};
function resolveLanguage(saved, browserLanguages) {
  if (saved === "ko" || saved === "en" || saved === "ja") return saved;
  const primary = browserLanguages[0]?.toLowerCase().split("-")[0];
  return primary === "ko" || primary === "ja" ? primary : "en";
}
function translate(message, language2) {
  const dictionary = language2 === "ko" ? KOREAN : language2 === "ja" ? JAPANESE : void 0;
  const template = dictionary && Object.hasOwn(dictionary, message.key) ? dictionary[message.key] : message.key;
  return template.replace(/\{([\w]+)\}/g, (placeholder, name) => {
    const value = message.values[name];
    return value === void 0 ? placeholder : typeof value === "object" ? translate(value, language2) : String(value);
  });
}
var language = "en";
var bindings = /* @__PURE__ */ new WeakMap();
function localize(node, message, attribute = "text") {
  const entries = bindings.get(node) ?? /* @__PURE__ */ new Map();
  const value = typeof message === "string" ? copy(message) : message;
  entries.set(attribute, value);
  bindings.set(node, entries);
  node.setAttribute("data-i18n-bound", "");
  const rendered = translate(value, language);
  if (attribute === "text") node.textContent = rendered;
  else node.setAttribute(attribute, rendered);
}
function applyLanguage(root) {
  root.documentElement.lang = language;
  for (const node of root.querySelectorAll("[data-i18n], [data-i18n-placeholder], [data-i18n-aria-label], [data-i18n-title]")) {
    for (const attribute of ["text", "placeholder", "aria-label", "title"]) {
      const key = node.getAttribute(attribute === "text" ? "data-i18n" : `data-i18n-${attribute}`);
      if (key && !bindings.get(node)?.has(attribute)) localize(node, key, attribute);
    }
  }
  for (const node of root.querySelectorAll("[data-i18n-bound]")) {
    for (const [attribute, message] of bindings.get(node) ?? []) localize(node, message, attribute);
  }
  const select = root.getElementById("languageSelect");
  if (select) {
    select.value = language;
    select.disabled = false;
  }
}
function initializeLanguage(root = document, host = window) {
  const key = "arcrow:language";
  const browserLanguages = host.navigator.languages?.length ? host.navigator.languages : [host.navigator.language];
  let storage = null;
  let saved = null;
  try {
    storage = host.localStorage;
    saved = storage.getItem(key);
  } catch {
  }
  language = resolveLanguage(saved, browserLanguages);
  applyLanguage(root);
  root.getElementById("languageSelect")?.addEventListener("change", (event) => {
    language = resolveLanguage(event.target.value, browserLanguages);
    try {
      storage?.setItem(key, language);
    } catch {
    }
    applyLanguage(root);
  });
  host.addEventListener("storage", (event) => {
    if (storage && event.storageArea === storage && (event.key === key || event.key === null)) {
      language = resolveLanguage(event.newValue, browserLanguages);
      applyLanguage(root);
    }
  });
}

// circle/arc/src/arc-radar.ts
var routeError = "";
var linkedPool = (() => {
  try {
    return readPoolRoute(new URL(location.href));
  } catch (error) {
    routeError = error instanceof Error ? error.message : "Invalid pool link.";
    return null;
  }
})();
var networkError = "";
var NETWORK = (() => {
  try {
    const network = resolveRadarNetwork(new URLSearchParams(location.search).get("network") ?? void 0);
    network.sources.forEach((source) => createDexAdapter(source, network));
    return network;
  } catch (error) {
    networkError = error instanceof Error ? error.message : "Network unavailable.";
    return null;
  }
})();
var dexAdapters = NETWORK ? NETWORK.sources.map((source) => createDexAdapter(source, NETWORK)) : [];
var adPreview = initializeAdPreview(Boolean(NETWORK));
var API_BASE = NETWORK?.apiBase ?? "";
var EXPLORER_BASE = NETWORK?.explorerBase ?? "";
var CACHE_PREFIX = NETWORK ? radarStoragePrefix(NETWORK) : "arcrow:unavailable:";
var WATCHLIST_STORAGE_KEY = `${CACHE_PREFIX}watchlist`;
var TRACKING_STORAGE_PREFIX = `${CACHE_PREFIX}tracking:pool:v1:`;
var MARKET_LIMIT = 15;
var MAX_MARKETS = 150;
var LOG_PAGE_LIMIT = 4;
var TRANSFER_PAGE_LIMIT = 3;
var DAY_MS = 864e5;
var DETAIL_CACHE_TTL_MS = 12e4;
var AUTO_REFRESH_MS = 6e4;
var BURN_ADDRESSES = /* @__PURE__ */ new Set([
  "0x0000000000000000000000000000000000000000",
  "0x000000000000000000000000000000000000dead"
]);
var markets = [];
var selectedPair = "";
var activeQuery = "";
var activeFilter = "all";
var marketLimit = MARKET_LIMIT;
var hasMoreMarkets = false;
var discoveryLimited = false;
var failedMarketCount = 0;
var marketLoadFailed = false;
var discoveryOptions = { sort: "default", minimumLiquidity: 0, traded24h: false, sellSeen: false };
var activeWalletSignalFilter = "all";
var loading = false;
var detailRequest = 0;
var lastRefreshAt = 0;
var watchlist = NETWORK ? readWatchlist() : /* @__PURE__ */ new Set();
var detailCache = /* @__PURE__ */ new Map();
var detailFlights = /* @__PURE__ */ new Map();
var authorityReads = /* @__PURE__ */ new Map();
var authorityRunning = "";
var watchCheckAttempts = /* @__PURE__ */ new Map();
var watchScanRunning = false;
var lastWatchScanAt = 0;
var trackingMemory = /* @__PURE__ */ new Map();
var watchReviewedAt = (() => {
  if (!NETWORK || linkedPool || routeError) return null;
  try {
    const previous = Number(localStorage.getItem(`${CACHE_PREFIX}watch-reviewed-at`) ?? localStorage.getItem(`${CACHE_PREFIX}last-market-visit`));
    const now = Date.now();
    return previous > 0 && previous <= now ? previous : null;
  } catch {
    return null;
  }
})();
function byId(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node;
}
function poolCacheKey(pool) {
  if (!NETWORK) throw new Error(networkError);
  return radarPoolKey(NETWORK, pool.pairAddress);
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== void 0) {
    if (typeof text === "string") node.textContent = text;
    else localize(node, text);
  }
  return node;
}
function setCopy(id, message) {
  localize(byId(id), message);
}
function svgNode(tag, attributes) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}
function shortHash(value, start = 7, end = 5) {
  if (!value) return "--";
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}
function readCache(key) {
  try {
    const value = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}
function writeCache(key, data) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
  }
}
function readWatchlist() {
  try {
    const legacy = NETWORK?.id === "arc-testnet" ? localStorage.getItem("arc-meme-radar:v1:watchlist") : null;
    const stored = JSON.parse(localStorage.getItem(WATCHLIST_STORAGE_KEY) ?? legacy ?? "[]");
    if (!Array.isArray(stored)) return /* @__PURE__ */ new Set();
    return new Set(stored.filter((value) => typeof value === "string").map((value) => value.toLowerCase()));
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
function saveWatchlist() {
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify([...watchlist]));
  } catch {
  }
}
function readTracking(address) {
  const memory = trackingMemory.get(address.toLowerCase());
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(`${TRACKING_STORAGE_PREFIX}${address.toLowerCase()}`);
    const value = raw ? JSON.parse(raw) : null;
    if (!value || typeof value.startedAt !== "string" || !Array.isArray(value.alerts)) return null;
    if (value.sellObservation && !Array.isArray(value.sellObservation.seen)) value.sellObservation = void 0;
    if (value.detailSnapshot && !value.detailSnapshot.poolScope) value.detailSnapshot = void 0;
    value.alerts = value.alerts.filter((alert) => alert && typeof alert.title === "string" && typeof alert.detail === "string" && typeof alert.observedAt === "string" && ["warning", "info", "good"].includes(alert.tone)).slice(0, 30);
    trackingMemory.set(address.toLowerCase(), value);
    return value;
  } catch {
    return null;
  }
}
function saveTracking(address, tracking) {
  trackingMemory.set(address.toLowerCase(), tracking);
  try {
    localStorage.setItem(`${TRACKING_STORAGE_PREFIX}${address.toLowerCase()}`, JSON.stringify(tracking));
  } catch {
  }
}
function appendObservedAlerts(tracking, alerts) {
  if (alerts.length === 0) return;
  tracking.alerts = [...alerts, ...tracking.alerts ?? []].slice(0, 30);
}
async function fetchData(path, ttlMs, force = false) {
  if (!NETWORK) throw new Error(networkError);
  const key = path.replace(/[^a-z0-9]+/gi, "-");
  const cached = readCache(key);
  if (!force && cached && Date.now() - cached.savedAt < ttlMs) return { data: cached.data, stale: false };
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12e3);
  try {
    const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json" }, signal: controller.signal });
    if (!response.ok) throw new Error(`ArcScan returned HTTP ${response.status}`);
    const data = await response.json();
    writeCache(key, data);
    return { data, stale: false };
  } catch (error) {
    if (cached) return { data: cached.data, stale: true };
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
async function fetchOptional(path, ttlMs, force = false) {
  try {
    return await fetchData(path, ttlMs, force);
  } catch {
    return null;
  }
}
async function fetchAddressLogs(address, ttlMs, force, cutoffMs) {
  const items = [];
  const seen = /* @__PURE__ */ new Set();
  let nextPath = `/addresses/${address}/logs`;
  let stale = false;
  let truncated = false;
  for (let page = 0; page < LOG_PAGE_LIMIT; page += 1) {
    const result = await fetchData(nextPath, ttlMs, force);
    stale ||= result.stale;
    for (const log of result.data.items ?? []) {
      const key = `${log.transaction_hash ?? ""}:${log.index ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(log);
    }
    const oldestTimestamp = items.at(-1)?.block_timestamp;
    if (oldestTimestamp && new Date(oldestTimestamp).getTime() <= cutoffMs) break;
    const next = result.data.next_page_params;
    if (!next) break;
    if (page === LOG_PAGE_LIMIT - 1) {
      truncated = true;
      break;
    }
    const query = new URLSearchParams(Object.entries(next).map(([name, value]) => [name, String(value)])).toString();
    nextPath = `/addresses/${address}/logs?${query}`;
  }
  return { items, stale, truncated };
}
async function fetchTokenTransfers(address, force) {
  const items = [];
  const seen = /* @__PURE__ */ new Set();
  let nextPath = `/tokens/${address}/transfers`;
  let stale = false;
  let truncated = false;
  for (let page = 0; page < TRANSFER_PAGE_LIMIT; page += 1) {
    const result = await fetchData(nextPath, 12e4, force);
    stale ||= result.stale;
    for (const transfer of result.data.items ?? []) {
      const key = `${transfer.transaction_hash ?? ""}:${transfer.log_index ?? ""}:${transfer.type ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(transfer);
    }
    const next = result.data.next_page_params;
    if (!next) break;
    if (page === TRANSFER_PAGE_LIMIT - 1) {
      truncated = true;
      break;
    }
    const query = new URLSearchParams(Object.entries(next).map(([name, value]) => [name, String(value)])).toString();
    nextPath = `/tokens/${address}/transfers?${query}`;
  }
  items.sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime());
  return { items, stale, truncated };
}
function fullNumber(value) {
  if (value === null || value === void 0 || value === "") return "--";
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(number);
}
function formatValue(value, maximumFractionDigits = 2) {
  if (!Number.isFinite(value)) return "--";
  if (value >= 1e3) return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(value);
  if (value > 0 && value < 0.01) return "<0.01";
  return new Intl.NumberFormat("en", { maximumFractionDigits }).format(value);
}
var SUBSCRIPT_DIGITS = ["\u2080", "\u2081", "\u2082", "\u2083", "\u2084", "\u2085", "\u2086", "\u2087", "\u2088", "\u2089"];
function subscriptNumber(value) {
  return String(value).split("").map((digit) => SUBSCRIPT_DIGITS[Number(digit)]).join("");
}
function formatFullPrice(value) {
  if (!Number.isFinite(value) || value <= 0) return "--";
  const exponent = Math.floor(Math.log10(value));
  const fractionDigits = exponent < 0 ? Math.min(20, Math.max(9, -exponent + 5)) : 4;
  return value.toLocaleString("en", { maximumFractionDigits: fractionDigits });
}
function priceFormat(value) {
  if (!Number.isFinite(value) || value <= 0) return { full: "--", leadingZeros: null, significant: "", text: "--" };
  const full = formatFullPrice(value);
  if (value >= 1) {
    const text = value.toLocaleString("en", { maximumFractionDigits: 4 });
    return { full, leadingZeros: null, significant: "", text };
  }
  if (value >= 0.01) {
    const text = value.toLocaleString("en", { maximumFractionDigits: 6 });
    return { full, leadingZeros: null, significant: "", text };
  }
  if (value >= 1e-4) {
    const text = value.toLocaleString("en", { maximumFractionDigits: 9 });
    return { full, leadingZeros: null, significant: "", text };
  }
  const [coefficient, exponentText] = value.toExponential(3).split("e");
  const leadingZeros = Math.max(1, -Number(exponentText) - 1);
  const significant = coefficient.replace(".", "").replace(/0+$/, "");
  return {
    full,
    leadingZeros,
    significant,
    text: `0.0${subscriptNumber(leadingZeros)}${significant}`
  };
}
function formatPrice(value) {
  return priceFormat(value).text;
}
function priceElement(value, includeUnit = false) {
  const formatted = priceFormat(value);
  const node = element("strong", "price-value");
  if (formatted.leadingZeros === null) {
    node.textContent = formatted.text;
  } else {
    node.append("0.0", element("sub", "price-zero-count", String(formatted.leadingZeros)), formatted.significant);
  }
  if (includeUnit) node.append(element("span", "price-unit", "USDC"));
  node.title = formatted.full === "--" ? "Price unavailable" : `${formatted.full} USDC`;
  node.setAttribute("aria-label", formatted.full === "--" ? "Price unavailable" : `${formatted.full} USDC`);
  return node;
}
function formatChange(value) {
  if (value === null || !Number.isFinite(value)) return "No price history";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}
function compactChange(value) {
  if (value === null || !Number.isFinite(value)) return "--";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}
function formatSignedUsdc(value) {
  if (!Number.isFinite(value) || Math.abs(value) < 5e-4) return "0 USDC";
  return `${value > 0 ? "+" : "-"}${formatValue(Math.abs(value), 3)} USDC`;
}
function relativeTime(value) {
  if (!value) return "--";
  const milliseconds = new Date(value).getTime();
  if (!Number.isFinite(milliseconds)) return "--";
  const seconds = Math.max(0, Math.floor((Date.now() - milliseconds) / 1e3));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 2592e3) return `${Math.floor(seconds / 86400)}d`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
function adapterFor(pool) {
  const adapter = dexAdapters.find((entry) => entry.source.id === pool.sourceId);
  if (!adapter) throw new Error("Unknown DEX source");
  return adapter;
}
function periodMetrics(trades, pricePoints, currentPrice, durationMs, nowMs) {
  const cutoff = nowMs - durationMs;
  const windowTrades = trades.filter((trade) => new Date(trade.timestamp).getTime() >= cutoff);
  const buys = windowTrades.filter((trade) => trade.direction === "buy");
  const sells = windowTrades.filter((trade) => trade.direction === "sell");
  return {
    buyCount: buys.length,
    netFlowUsdc: buys.reduce((sum, trade) => sum + trade.usdcValue, 0) - sells.reduce((sum, trade) => sum + trade.usdcValue, 0),
    priceChange: windowPriceChange(pricePoints, currentPrice, cutoff),
    sellCount: sells.length,
    swapCount: windowTrades.length,
    volumeUsdc: windowTrades.reduce((sum, trade) => sum + trade.usdcValue, 0)
  };
}
function marketPeriods(trades, pricePoints, currentPrice, nowMs) {
  return {
    m5: periodMetrics(trades, pricePoints, currentPrice, 5 * 6e4, nowMs),
    h1: periodMetrics(trades, pricePoints, currentPrice, 60 * 6e4, nowMs),
    h6: periodMetrics(trades, pricePoints, currentPrice, 6 * 60 * 6e4, nowMs),
    h24: periodMetrics(trades, pricePoints, currentPrice, DAY_MS, nowMs)
  };
}
function snapshotForMarket(market) {
  const holderCount = market.token.holders_count === null ? null : Number(market.token.holders_count);
  return {
    holderCount: holderCount !== null && Number.isFinite(holderCount) ? holderCount : null,
    price: market.currentPrice,
    sellCount: market.sellCount,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    usdcReserve: market.usdcReserve
  };
}
function startTracking(market) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const tracking = readTracking(market.pairAddress) ?? {
    alerts: [],
    startedAt: now
  };
  if (!tracking.marketSnapshot) {
    tracking.marketSnapshot = snapshotForMarket(market);
    appendObservedAlerts(tracking, [{
      detail: "A local market and risk baseline was recorded for this token.",
      observedAt: now,
      title: "Watch started",
      tone: "info",
      type: "system"
    }]);
  }
  if (!tracking.sellObservation) tracking.sellObservation = observeSellEvents(market.trades).state;
  saveTracking(market.pairAddress, tracking);
  return tracking;
}
function observeMarketChanges(market) {
  if (market.stale || !watchlist.has(market.tokenAddress.toLowerCase())) return;
  const tracking = readTracking(market.pairAddress) ?? startTracking(market);
  const previous = tracking.marketSnapshot;
  const next = snapshotForMarket(market);
  if (!previous) {
    tracking.marketSnapshot = next;
    saveTracking(market.pairAddress, tracking);
    return;
  }
  const alerts = [];
  const observedAt = next.timestamp;
  if (previous.usdcReserve > 0) {
    const reserveChange = (next.usdcReserve - previous.usdcReserve) / previous.usdcReserve * 100;
    if (Math.abs(reserveChange) >= 10 && Math.abs(next.usdcReserve - previous.usdcReserve) >= 1e-3) {
      alerts.push({
        detail: `USDC exit-side changed from ${formatValue(previous.usdcReserve, 3)} to ${formatValue(next.usdcReserve, 3)} (${reserveChange > 0 ? "+" : ""}${reserveChange.toFixed(1)}%).`,
        observedAt,
        title: reserveChange < 0 ? "Liquidity dropped" : "Liquidity increased",
        tone: reserveChange < 0 ? "warning" : "good",
        type: "liquidity"
      });
    }
  }
  if (previous.price > 0 && next.price > 0) {
    const priceChange = (next.price - previous.price) / previous.price * 100;
    if (Math.abs(priceChange) >= 30) {
      alerts.push({
        detail: `Pool price moved ${priceChange > 0 ? "+" : ""}${priceChange.toFixed(1)}% from the previous observed baseline.`,
        observedAt,
        title: priceChange < 0 ? "Price moved sharply down" : "Price moved sharply up",
        tone: priceChange < 0 ? "warning" : "info",
        type: "price"
      });
    }
  }
  if (next.holderCount !== null && previous.holderCount !== null && next.holderCount !== previous.holderCount) {
    const difference = next.holderCount - previous.holderCount;
    alerts.push({
      detail: `Indexed holder count changed from ${fullNumber(previous.holderCount)} to ${fullNumber(next.holderCount)}.`,
      observedAt,
      title: difference > 0 ? `${difference} holder${difference === 1 ? "" : "s"} added` : `${Math.abs(difference)} holder${difference === -1 ? "" : "s"} left`,
      tone: difference > 0 ? "good" : "warning",
      type: "holders"
    });
  }
  const sellObservation = observeSellEvents(market.trades, tracking.sellObservation);
  tracking.sellObservation = sellObservation.state;
  if (sellObservation.added > 0) {
    const difference = sellObservation.added;
    alerts.push({
      detail: `${difference} previously unseen token-to-USDC sell event${difference === 1 ? " was" : "s were"} found in the available indexed history. This may include delayed indexing.`,
      observedAt,
      title: "Newly observed sell events",
      tone: "info",
      type: "sell"
    });
  }
  appendObservedAlerts(tracking, alerts);
  tracking.marketSnapshot = next;
  saveTracking(market.pairAddress, tracking);
}
function observeDetailChanges(market, detail) {
  if (market.stale || Date.now() - detail.checkedAt >= DETAIL_CACHE_TTL_MS || !watchlist.has(market.tokenAddress.toLowerCase())) return;
  const tracking = readTracking(market.pairAddress) ?? startTracking(market);
  const previous = tracking.detailSnapshot;
  const { next, comparable } = nextOwnershipSnapshot(previous, {
    creatorShare: detail.creatorShare,
    lpBurnedShare: detail.lpBurnedShare,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    top10Share: detail.top10Share,
    poolScope: detail.poolScope
  }, {
    creatorShare: detail.sources.holders === "fresh" && detail.sources.creator === "fresh",
    lpBurnedShare: detail.sources.lp === "fresh",
    top10Share: detail.sources.holders === "fresh"
  });
  if (previous) {
    const alerts = [];
    if (comparable.top10Share && previous.top10Share !== null && next.top10Share !== null && Math.abs(next.top10Share - previous.top10Share) >= 3) {
      const difference = next.top10Share - previous.top10Share;
      alerts.push({
        detail: `Top 10 non-pool ownership changed from ${shareText(previous.top10Share)} to ${shareText(next.top10Share)}.`,
        observedAt: next.timestamp,
        title: difference > 0 ? "Holder concentration increased" : "Holder concentration decreased",
        tone: difference > 0 ? "warning" : "good",
        type: "ownership"
      });
    }
    if (comparable.creatorShare && previous.creatorShare !== null && next.creatorShare !== null && Math.abs(next.creatorShare - previous.creatorShare) >= 1) {
      const difference = next.creatorShare - previous.creatorShare;
      alerts.push({
        detail: `Pool-creation sender holding changed from ${shareText(previous.creatorShare)} to ${shareText(next.creatorShare)}. This sender is not necessarily the token team.`,
        observedAt: next.timestamp,
        title: difference < 0 ? "Creation sender reduced holdings" : "Creation sender holdings increased",
        tone: difference < 0 ? "warning" : "info",
        type: "ownership"
      });
    }
    if (comparable.lpBurnedShare && previous.lpBurnedShare !== null && next.lpBurnedShare !== null && Math.abs(next.lpBurnedShare - previous.lpBurnedShare) >= 1) {
      const difference = next.lpBurnedShare - previous.lpBurnedShare;
      alerts.push({
        detail: `LP tokens held by burn addresses changed from ${shareText(previous.lpBurnedShare)} to ${shareText(next.lpBurnedShare)}.`,
        observedAt: next.timestamp,
        title: difference > 0 ? "More LP tokens burned" : "Burned LP share decreased",
        tone: difference > 0 ? "good" : "warning",
        type: "lp"
      });
    }
    appendObservedAlerts(tracking, alerts);
  }
  tracking.detailSnapshot = next;
  saveTracking(market.pairAddress, tracking);
}
async function mapLimited(values, limit, mapper) {
  const output = new Array(values.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await mapper(values[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, () => worker()));
  return output;
}
async function loadMarketPair(seed, force) {
  try {
    const adapter = adapterFor(seed);
    const nowMs = Date.now();
    const [tokenResult, logResult] = await Promise.all([
      fetchData(`/tokens/${seed.tokenAddress}`, 3e5, force),
      fetchAddressLogs(seed.pairAddress, 3e4, force, nowMs - DAY_MS)
    ]);
    const token = tokenResult.data;
    const logs = logResult.items;
    const latestSync = adapter.latestReserves(logs, seed, token.decimals);
    let tokenReserve = latestSync?.tokenReserve ?? 0;
    let usdcReserve = latestSync?.usdcReserve ?? 0;
    let balanceStale = false;
    const reserveSource = latestSync ? "sync" : "balance";
    if (!latestSync) {
      const balanceResult = await fetchData(`/addresses/${seed.pairAddress}/token-balances`, 3e4, force);
      const tokenBalance = balanceResult.data.find((balance) => balance.token.address_hash.toLowerCase() === seed.tokenAddress.toLowerCase());
      const usdcBalance = balanceResult.data.find((balance) => balance.token.address_hash.toLowerCase() === seed.quoteAsset.address.toLowerCase());
      tokenReserve = decimalValue(tokenBalance?.value, tokenBalance?.token.decimals);
      usdcReserve = decimalValue(usdcBalance?.value, usdcBalance?.token.decimals);
      balanceStale = balanceResult.stale;
    }
    const currentPrice = tokenReserve > 0 ? usdcReserve / tokenReserve : 0;
    const trades = logs.map((log) => adapter.trade(log, seed)).filter((trade) => trade !== null).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const buys = trades.filter((trade) => trade.direction === "buy");
    const sells = trades.filter((trade) => trade.direction === "sell");
    const liquidityEvents = adapter.liquidityEvents(logs, seed, token.decimals);
    const pricePoints = logs.map((log) => adapter.pricePoint(log, seed, token.decimals)).filter((point) => point !== null).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const firstPrice = pricePoints[0]?.price;
    const priceChange = firstPrice && currentPrice ? (currentPrice - firstPrice) / firstPrice * 100 : null;
    const market = {
      ...seed,
      buyCount: buys.length,
      currentPrice,
      fdv: fullyDilutedValue(currentPrice, token.total_supply, token.decimals),
      historyTruncated: logResult.truncated,
      lastSellAt: sells[0]?.timestamp ?? null,
      lastTradeAt: trades[0]?.timestamp ?? null,
      liquidityEvents,
      periods: marketPeriods(trades, pricePoints, currentPrice, nowMs),
      priceChange,
      pricePoints,
      reserveSource,
      sellCount: sells.length,
      stale: tokenResult.stale || logResult.stale || balanceStale,
      swapCount: trades.length,
      token,
      tokenReserve,
      totalLiquidity: usdcReserve * 2,
      trades,
      usdcReserve,
      volumeUsdc: trades.reduce((sum, trade) => sum + trade.usdcValue, 0)
    };
    observeMarketChanges(market);
    return market;
  } catch {
    return null;
  }
}
function needsReview(market) {
  return market.sellCount === 0 || market.usdcReserve < 10;
}
function visibleMarkets() {
  const query = activeQuery.toLowerCase();
  const filtered = markets.filter((market) => {
    const matchesQuery = !query || [market.token.name, market.token.symbol, market.tokenAddress, market.pairAddress].some((value) => value?.toLowerCase().includes(query));
    if (!matchesQuery) return false;
    if (activeFilter === "watchlist") return watchlist.has(market.tokenAddress.toLowerCase());
    if (activeFilter === "active") return market.periods.h24.swapCount > 0;
    if (activeFilter === "new") return Date.now() - new Date(market.createdAt).getTime() <= 7 * 864e5;
    if (activeFilter === "sells") return market.sellCount > 0;
    if (activeFilter === "risky") return needsReview(market);
    return true;
  });
  const eligible = refineMarkets(filtered, { ...discoveryOptions, sort: "default" });
  const representatives = groupTokenPools(eligible).map((group) => group.primary);
  return refineMarkets(representatives.sort((a, b) => {
    if (activeFilter === "active") return b.periods.h24.volumeUsdc - a.periods.h24.volumeUsdc || b.periods.h24.swapCount - a.periods.h24.swapCount || new Date(b.lastTradeAt ?? 0).getTime() - new Date(a.lastTradeAt ?? 0).getTime();
    if (activeFilter === "sells") return b.sellCount - a.sellCount;
    if (activeFilter === "risky") return a.usdcReserve - b.usdcReserve;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }), discoveryOptions);
}
function renderMarketSummary() {
  if (marketLoadFailed && markets.length === 0) {
    setCopy("marketSummary", "Market activity is unknown because pool data could not be loaded.");
    return;
  }
  const shown = visibleMarkets();
  const trades = shown.reduce((sum, market) => sum + market.swapCount, 0);
  const liquidity = shown.reduce((sum, market) => sum + market.totalLiquidity, 0);
  const partial = shown.filter((market) => market.historyTruncated).length;
  setCopy("marketSummary", copy("{tokens} tokens \xB7 {pools} loaded pools \xB7 representative pools: {trades} indexed swaps \xB7 {liquidity} USDC liquidity \xB7 {partial} partial histories", { tokens: shown.length, pools: markets.length, trades, liquidity: formatValue(liquidity), partial }));
}
function renderDiscoveryControls() {
  const button = byId("loadMoreMarkets");
  button.disabled = loading || !marketLoadFailed && (!hasMoreMarkets || marketLimit >= MAX_MARKETS);
  localize(button, loading ? "Loading pools..." : marketLoadFailed ? "Retry loading" : hasMoreMarkets && marketLimit < MAX_MARKETS ? "Load 15 more" : discoveryLimited || hasMoreMarkets && marketLimit >= MAX_MARKETS ? "Scan limit reached" : "No more pools");
  setCopy("discoveryCoverage", copy("{pools} pools loaded \xB7 {sources} {network} USDC market sources{limit}", {
    pools: markets.length,
    sources: dexAdapters.length,
    network: NETWORK?.label ?? "",
    limit: copy("{scan}{cap}{failed}", { scan: copy(discoveryLimited ? " \xB7 Scan limit reached" : ""), cap: copy(marketLimit >= MAX_MARKETS && hasMoreMarkets ? " \xB7 150-pool limit" : ""), failed: copy(failedMarketCount ? " \xB7 {count} unavailable" : "", { count: failedMarketCount }) })
  }));
  renderCoverage();
}
function renderCoverage() {
  const cached = markets.filter((market) => market.stale).length;
  const partial = markets.filter((market) => market.historyTruncated).length;
  setCopy("coverageSummary", copy("{network} \xB7 {sources} configured v2 source(s) \xB7 {pools} loaded pools \xB7 Not the whole chain", { network: NETWORK?.label ?? "--", sources: dexAdapters.length, pools: markets.length }));
  setCopy("coverageStatus", copy("{cached} cached \xB7 {partial} partial histories{failed}", { cached, partial, failed: copy(marketLoadFailed ? " \xB7 Refresh failed" : "") }));
  const sources = byId("coverageSources");
  sources.replaceChildren();
  for (const adapter of dexAdapters) {
    const link = element("a", "", `${adapter.source.label} \xB7 ${shortHash(adapter.source.factoryAddress)}`);
    link.href = `${EXPLORER_BASE}/address/${adapter.source.factoryAddress}`;
    link.target = "_blank";
    link.rel = "noreferrer";
    sources.append(link);
  }
}
function renderMarketBrief() {
  const list = byId("marketBriefList");
  const expanded = list.querySelector(".brief-more")?.open ?? false;
  list.replaceChildren();
  const briefs = marketLoadFailed ? [] : marketBriefs(markets, Date.now());
  setCopy("marketBriefCount", copy("{count} tokens", { count: briefs.length }));
  if (!briefs.length) {
    list.append(element("p", "brief-empty", copy(marketLoadFailed ? "Market refresh failed. Recent changes cannot be assessed." : "No qualifying recent change in the loaded pools. This is not an all-clear.")));
    return;
  }
  const more = element("details", "brief-more");
  more.open = expanded;
  const moreList = element("div", "brief-more-list");
  more.append(element("summary", "", copy("{count} more changes", { count: Math.max(0, briefs.length - 3) })), moreList);
  for (const [index, brief] of briefs.entries()) {
    const row = element("article", "brief-row");
    const copyBlock = element("div", "brief-copy");
    const title = element("a", "", copy("{symbol} \xB7 {title}", { symbol: brief.market.token.symbol || "Token", title: copy(brief.title) }));
    title.href = marketUrl(location.href, NETWORK.id, brief.market.pairAddress);
    const description = brief.kind === "liquidity" ? copy("{amount} USDC removed; {percent}% of prior USDC reserve.", { amount: formatValue(brief.value, 4), percent: brief.secondaryValue.toFixed(1) }) : brief.kind === "price" ? copy("1H reserve-price change: {change}. Not an executable quote.", { change: compactChange(brief.value) }) : copy("Pool creation and subsequent trades appear in the available index. Not a token endorsement.");
    copyBlock.append(title, element("p", "", description), element("small", "", copy("Pool {address} \xB7 {time} ago{partial}", { address: shortHash(brief.market.pairAddress), time: relativeTime(brief.timestamp), partial: copy(brief.market.historyTruncated ? " \xB7 partial history" : "") })));
    const evidence = element("div", "brief-evidence");
    evidence.append(element("span", `evidence-label ${brief.basis}`, copy(brief.basis === "observed" ? "Indexed event" : "Calculated")));
    if (brief.transactionHash) {
      const link = element("a", "", copy("Source TX"));
      link.href = `${EXPLORER_BASE}/tx/${brief.transactionHash}`;
      link.target = "_blank";
      link.rel = "noreferrer";
      evidence.append(link);
    }
    row.append(copyBlock, evidence);
    (index < 3 ? list : moreList).append(row);
  }
  if (briefs.length > 3) list.append(more);
}
function renderMarketPulse() {
  if (marketLoadFailed && markets.length === 0) {
    for (const id of ["pulseVolume", "pulseTrades", "pulseNetFlow", "pulseNewest", "pulseNewestAge", "pulseSellVerified"]) byId(id).textContent = "--";
    setCopy("pulseNewestAge", "Unavailable");
    setCopy("pulseStatus", "Market activity is unknown because pool data could not be loaded.");
    return;
  }
  const period = markets.map((market) => market.periods.h24);
  const volume = period.reduce((sum, metrics) => sum + metrics.volumeUsdc, 0);
  const buys = period.reduce((sum, metrics) => sum + metrics.buyCount, 0);
  const sells = period.reduce((sum, metrics) => sum + metrics.sellCount, 0);
  const netFlow = period.reduce((sum, metrics) => sum + metrics.netFlowUsdc, 0);
  const newest = [...markets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const sellVerified = markets.filter((market) => market.sellCount > 0).length;
  const partial = markets.filter((market) => market.historyTruncated).length;
  byId("pulseVolume").textContent = `${formatValue(volume, 3)} USDC`;
  byId("pulseTrades").textContent = `${buys} / ${sells}`;
  const net = byId("pulseNetFlow");
  net.textContent = formatSignedUsdc(netFlow);
  net.className = changeClass(netFlow);
  byId("pulseNewest").textContent = newest ? newest.token.symbol || newest.token.name || "Unknown" : "--";
  setCopy("pulseNewestAge", newest ? copy("{time} old", { time: relativeTime(newest.createdAt) }) : "No pool indexed");
  byId("pulseSellVerified").textContent = `${sellVerified} / ${markets.length}`;
  const swapTotal = buys + sells;
  const cached = markets.filter((market) => market.stale).length;
  setCopy("pulseStatus", copy("{count} swaps indexed in the last 24 hours \xB7 {partial} partial pools \xB7 {cached} cached pools", { count: swapTotal, partial, cached }));
}
function changeClass(value) {
  if (value === null || Math.abs(value) < 0.05) return "neutral";
  return value > 0 ? "positive" : "negative";
}
function renderMarketRows() {
  const container = byId("marketRows");
  container.replaceChildren();
  const shown = visibleMarkets();
  adPreview.setContentAvailable(shown.length > 0);
  renderMarketSummary();
  renderMarketPulse();
  renderMarketBrief();
  renderWatchDigest();
  if (shown.length === 0) {
    const message = marketLoadFailed && markets.length === 0 ? "Market activity is unknown because pool data could not be loaded." : activeFilter === "active" ? "No token has indexed trading activity in the last 24 hours." : activeFilter === "watchlist" ? "No token is currently on this browser's watchlist." : "No token matches this view.";
    container.append(element("div", "market-loading-row", copy(message)));
    return;
  }
  for (const market of shown) {
    const row = element("button", "market-row");
    row.type = "button";
    row.title = `${adapterFor(market).source.label} \xB7 ${market.pairAddress}`;
    const selected = markets.find((entry) => entry.pairAddress.toLowerCase() === selectedPair);
    const isSelected = selected?.tokenAddress.toLowerCase() === market.tokenAddress.toLowerCase();
    row.classList.toggle("selected", isSelected);
    row.setAttribute("aria-pressed", String(isSelected));
    localize(row, copy("Open {symbol} market", { symbol: market.token.symbol || market.token.name || "token" }), "aria-label");
    const identity = element("span", "market-token");
    const icon = element("span", "market-token-icon", (market.token.symbol || market.token.name || "?").slice(0, 2).toUpperCase());
    const copyBlock = element("span", "market-token-copy");
    const watched = watchlist.has(market.tokenAddress.toLowerCase());
    const poolCount = markets.filter((entry) => entry.tokenAddress.toLowerCase() === market.tokenAddress.toLowerCase()).length;
    copyBlock.append(
      element("strong", watched ? "watched-token" : "", `${watched ? "\u2605 " : ""}${market.token.symbol || "Unknown"}`),
      element("span", "", market.token.name || shortHash(market.tokenAddress)),
      element("small", "", copy("{holders} holders \xB7 {pools} pools", { holders: fullNumber(market.token.holders_count), pools: poolCount })),
      element("small", "market-data-state", copy("{state}{partial}", { state: copy(market.stale ? "Cached" : "Fetched"), partial: copy(market.historyTruncated ? " \xB7 Partial history" : "") }))
    );
    identity.append(icon, copyBlock);
    const price = element("span", "market-cell price-cell");
    price.append(priceElement(market.currentPrice), element("small", changeClass(market.periods.m5.priceChange), `5M ${compactChange(market.periods.m5.priceChange)}`));
    const pulse = element("span", "market-cell pulse-cell");
    pulse.append(
      element("strong", changeClass(market.periods.h1.priceChange), `1H ${compactChange(market.periods.h1.priceChange)}`),
      element("small", changeClass(market.periods.h24.priceChange), `24H ${compactChange(market.periods.h24.priceChange)} \xB7 ${formatValue(market.periods.h24.volumeUsdc, 3)} USDC${market.historyTruncated ? " \xB7 partial" : ""}`)
    );
    const liquidity = element("span", "market-cell");
    liquidity.append(element("strong", "", `${formatValue(market.totalLiquidity)} USDC`), element("small", "", copy("{amount} exit side", { amount: formatValue(market.usdcReserve) })));
    const flow = element("span", "row-flow");
    const counts = element("strong");
    counts.append(element("span", "positive", copy("B {count}", { count: market.buyCount })), element("span", "negative", copy("S {count}", { count: market.sellCount })));
    const track = element("span", "mini-flow-track");
    const total = Math.max(1, market.buyCount + market.sellCount);
    const buyBar = element("span");
    const sellBar = element("span");
    buyBar.style.width = `${market.buyCount / total * 100}%`;
    sellBar.style.width = `${market.sellCount / total * 100}%`;
    track.append(buyBar, sellBar);
    flow.append(counts, track, element("small", "", `${formatValue(market.volumeUsdc, 3)} USDC`));
    const age = element("span", "market-cell");
    age.append(element("strong", "", relativeTime(market.createdAt)), element("small", "", market.lastTradeAt ? copy("trade {time}", { time: relativeTime(market.lastTradeAt) }) : copy("no trades")));
    row.append(identity, price, pulse, liquidity, flow, age);
    row.addEventListener("click", () => void selectMarket(market, true));
    container.append(row);
  }
}
function classifyWalletSignals(market, transfers, holders, creatorAddress, pools) {
  const creator = creatorAddress?.toLowerCase() ?? null;
  const currentHolders = new Set(holders.filter((holder) => Number(holder.value || 0) > 0 && holder.address?.hash).map((holder) => holder.address.hash.toLowerCase()));
  const topHolders = new Set(holders.filter((holder) => {
    const hash2 = holder.address?.hash?.toLowerCase();
    return Boolean(hash2 && !pools.has(hash2) && !BURN_ADDRESSES.has(hash2));
  }).slice(0, 10).map((holder) => holder.address.hash.toLowerCase()));
  const chronological = [...transfers].sort((a, b) => new Date(a.timestamp ?? 0).getTime() - new Date(b.timestamp ?? 0).getTime());
  const seenReceivers = /* @__PURE__ */ new Set();
  const signals = [];
  const createdAt = new Date(market.createdAt).getTime();
  for (const transfer of chronological) {
    if (transfer.type !== "token_transfer") continue;
    const fromAddress = transfer.from?.hash;
    const toAddress = transfer.to?.hash;
    if (!fromAddress || !toAddress || !transfer.timestamp || !transfer.transaction_hash) continue;
    const from7 = fromAddress.toLowerCase();
    const to = toAddress.toLowerCase();
    const firstIndexedReceipt = !seenReceivers.has(to);
    seenReceivers.add(to);
    const timestamp2 = new Date(transfer.timestamp).getTime();
    if (transfer.transaction_hash.toLowerCase() === market.creationTx.toLowerCase()) continue;
    if (Number.isFinite(createdAt) && timestamp2 < createdAt) continue;
    if (BURN_ADDRESSES.has(from7) || BURN_ADDRESSES.has(to)) continue;
    const amount = decimalValue(transfer.total?.value, transfer.total?.decimals ?? market.token.decimals);
    const share = holderShare(transfer.total?.value, market.token.total_supply);
    if (amount <= 0 || share === null) continue;
    const fromPool = pools.has(from7);
    const toPool = pools.has(to);
    if (fromPool && toPool) continue;
    const creatorInvolved = Boolean(creator && (from7 === creator || to === creator));
    const topHolderInvolved = topHolders.has(from7) || topHolders.has(to);
    const poolOutflow = !fromPool && toPool;
    const firstEntry = !toPool && !transfer.to?.is_contract && firstIndexedReceipt && currentHolders.has(to) && share >= 0.1;
    const whaleMove = share >= 1 || topHolderInvolved;
    const categories = /* @__PURE__ */ new Set();
    if (creatorInvolved) categories.add("creator");
    if (whaleMove) categories.add("whale");
    if (firstEntry) categories.add("entry");
    if (poolOutflow) categories.add("exit");
    if (categories.size === 0) continue;
    let title = "Wallet movement";
    let detail = "A token transfer moved between two indexed addresses.";
    let tone = "info";
    if (creatorInvolved) {
      if (from7 === creator && toPool) {
        title = "Creation sender sent to pool";
        detail = "The PairCreated transaction sender moved tokens into the pool.";
        tone = "warning";
      } else if (to === creator && fromPool) {
        title = "Creation sender received from pool";
        detail = "The PairCreated transaction sender acquired tokens from the pool.";
        tone = "info";
      } else if (from7 === creator) {
        title = "Creation sender sent tokens";
        detail = "The PairCreated transaction sender transferred tokens to another address.";
        tone = "warning";
      } else {
        title = "Creation sender received tokens";
        detail = "Tokens moved into the PairCreated transaction sender.";
      }
    } else if (poolOutflow) {
      title = topHolders.has(from7) ? "Top holder sent to pool" : "Wallet sent to pool";
      detail = "Tokens moved into a known pool. A transfer alone does not confirm a sale or a full exit.";
      tone = "warning";
    } else if (whaleMove) {
      if (fromPool) {
        title = topHolders.has(to) ? "Top holder received from pool" : "Large transfer from pool";
        detail = "Tokens moved out of a known pool; this may be a swap or a liquidity withdrawal.";
        tone = "info";
      } else {
        title = topHolders.has(from7) ? "Top holder transferred" : "Large wallet transfer";
        detail = "A large token position moved directly between addresses.";
      }
    } else if (firstEntry) {
      title = "First visible receipt";
      detail = "This is the wallet's first receipt in the visible indexed transfer history.";
      tone = "good";
    }
    signals.push({
      amount,
      categories: [...categories],
      detail,
      fromAddress,
      share,
      timestamp: transfer.timestamp,
      title,
      toAddress,
      tone,
      transactionHash: transfer.transaction_hash
    });
  }
  return signals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);
}
function analyzeHolderConnections(market, transfers, positions, pools) {
  const positionByAddress = new Map(positions.map((position) => [position.address.toLowerCase(), position]));
  const createdAt = new Date(market.createdAt).getTime();
  const connectionMap = /* @__PURE__ */ new Map();
  const sharedSources = /* @__PURE__ */ new Map();
  const connectionKey = (addressA, addressB) => [addressA.toLowerCase(), addressB.toLowerCase()].sort().join(":");
  for (const transfer of transfers) {
    if (transfer.type !== "token_transfer" || !transfer.from?.hash || !transfer.to?.hash || !transfer.transaction_hash) continue;
    if (transfer.transaction_hash.toLowerCase() === market.creationTx.toLowerCase()) continue;
    const timestamp2 = new Date(transfer.timestamp ?? 0).getTime();
    if (Number.isFinite(createdAt) && timestamp2 < createdAt) continue;
    const from7 = transfer.from.hash.toLowerCase();
    const to = transfer.to.hash.toLowerCase();
    if (pools.has(from7) || pools.has(to) || BURN_ADDRESSES.has(from7) || BURN_ADDRESSES.has(to)) continue;
    if (positionByAddress.has(from7) && positionByAddress.has(to) && from7 !== to) {
      connectionMap.set(connectionKey(from7, to), {
        addressA: positionByAddress.get(from7).address,
        addressB: positionByAddress.get(to).address,
        kind: "direct",
        source: null,
        transactionHash: transfer.transaction_hash
      });
    }
    if (!transfer.from.is_contract && positionByAddress.has(to) && from7 !== to) {
      const source = sharedSources.get(from7) ?? { address: transfer.from.hash, recipients: /* @__PURE__ */ new Set() };
      source.recipients.add(to);
      sharedSources.set(from7, source);
    }
  }
  for (const source of sharedSources.values()) {
    const recipients = [...source.recipients];
    if (recipients.length < 2) continue;
    for (let left = 0; left < recipients.length - 1; left += 1) {
      for (let right = left + 1; right < recipients.length; right += 1) {
        const addressA = recipients[left];
        const addressB = recipients[right];
        const key = connectionKey(addressA, addressB);
        if (connectionMap.has(key)) continue;
        connectionMap.set(key, {
          addressA: positionByAddress.get(addressA).address,
          addressB: positionByAddress.get(addressB).address,
          kind: "shared-source",
          source: source.address,
          transactionHash: null
        });
      }
    }
  }
  const connections = [...connectionMap.values()].slice(0, 20);
  const parent = new Map(positions.map((position) => [position.address.toLowerCase(), position.address.toLowerCase()]));
  const find = (address) => {
    const current = parent.get(address) ?? address;
    if (current === address) return address;
    const root = find(current);
    parent.set(address, root);
    return root;
  };
  const union = (addressA, addressB) => {
    const rootA = find(addressA);
    const rootB = find(addressB);
    if (rootA !== rootB) parent.set(rootB, rootA);
  };
  connections.forEach((connection) => union(connection.addressA.toLowerCase(), connection.addressB.toLowerCase()));
  const groups = /* @__PURE__ */ new Map();
  for (const position of positions) {
    const root = find(position.address.toLowerCase());
    groups.set(root, [...groups.get(root) ?? [], position.address]);
  }
  const clusters = [...groups.values()].filter((members) => members.length > 1).map((members) => ({
    members,
    share: members.reduce((sum, address) => sum + (positionByAddress.get(address.toLowerCase())?.share ?? 0), 0)
  })).sort((a, b) => b.share - a.share);
  return { clusters, connections };
}
function mergeContracts(proxy, implementation) {
  if (!proxy && !implementation) return null;
  const abi = [...proxy?.abi ?? [], ...implementation?.abi ?? []];
  const seen = /* @__PURE__ */ new Set();
  return {
    abi: abi.filter((entry) => {
      const key = `${entry.type}:${entry.name}:${entry.stateMutability}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
    is_fully_verified: Boolean(proxy?.is_fully_verified && (!implementation || implementation.is_fully_verified)),
    is_verified: Boolean(proxy?.is_verified || implementation?.is_verified)
  };
}
function contractFunctions(contract) {
  return (contract?.abi ?? []).filter((entry) => entry.type === "function" && Boolean(entry.name));
}
async function fetchMarketDetail(market, force) {
  const transactionHashes = [...new Set([
    ...market.trades.map((trade) => trade.transactionHash),
    ...market.liquidityEvents.map((event) => event.transactionHash)
  ].filter(Boolean))].slice(0, 12);
  const transactionRequests = mapLimited(
    transactionHashes,
    3,
    async (hash2) => ({
      hash: hash2,
      transaction: await fetchOptional(`/transactions/${hash2}`, 3e5, force)
    })
  );
  const [holderData, lpHolderData, pairToken, addressResult, transaction, resolvedTransactions, transferHistory] = await Promise.all([
    fetchOptional(`/tokens/${market.tokenAddress}/holders`, 12e4, force),
    fetchOptional(`/tokens/${market.pairAddress}/holders`, 12e4, force),
    fetchOptional(`/tokens/${market.pairAddress}`, 3e5, force),
    fetchOptional(`/addresses/${market.tokenAddress}`, 12e4, force),
    market.creationTx ? fetchOptional(`/transactions/${market.creationTx}`, 3e5, force) : Promise.resolve(null),
    transactionRequests,
    fetchTokenTransfers(market.tokenAddress, force).catch(() => null)
  ]);
  const address = addressResult?.data ?? null;
  const implementationAddress = address?.implementations?.[0]?.address_hash;
  const [proxyContract, implementationContract] = await Promise.all([
    address?.is_verified ? fetchOptional(`/smart-contracts/${market.tokenAddress}`, 3e5, force) : Promise.resolve(null),
    implementationAddress ? fetchOptional(`/smart-contracts/${implementationAddress}`, 3e5, force) : Promise.resolve(null)
  ]);
  const contract = mergeContracts(proxyContract?.data ?? null, implementationContract?.data ?? null);
  const pools = knownTokenPools(market, markets);
  const ownership = holderMetrics(holderData, market.token.total_supply, pools);
  const holders = ownership.holders;
  const pairLower = market.pairAddress.toLowerCase();
  const creatorAddress = transaction?.data.from?.hash ?? null;
  const creator = creatorAddress?.toLowerCase() ?? null;
  const holderPositions = ownership.positions.slice(0, 8).flatMap((holder) => {
    const hash2 = holder.address?.hash;
    if (!hash2) return [];
    return [{
      address: hash2,
      balance: decimalValue(holder.value, market.token.decimals),
      isContract: Boolean(holder.address?.is_contract),
      isCreator: hash2.toLowerCase() === creator,
      name: holder.address?.name ?? null,
      share: holderShare(holder.value, market.token.total_supply)
    }];
  });
  const lp = holderMetrics(lpHolderData, pairToken?.data.total_supply ?? null, /* @__PURE__ */ new Set());
  const topLp = lp.positions[0];
  const transactionSenders = Object.fromEntries(resolvedTransactions.filter((entry) => entry.transaction?.data.from?.hash).map((entry) => [entry.hash.toLowerCase(), entry.transaction.data.from.hash]));
  const walletSignals = classifyWalletSignals(market, transferHistory?.items ?? [], holders, creatorAddress, pools);
  const holderNetwork = analyzeHolderConnections(market, transferHistory?.items ?? [], holderPositions, pools);
  const combinedState = (...states) => states.includes("unavailable") ? "unavailable" : states.includes("cached") ? "cached" : "fresh";
  const contractState = combinedState(
    sourceState(addressResult),
    sourceState(proxyContract),
    ...implementationAddress ? [sourceState(implementationContract)] : []
  );
  return {
    checkedAt: Date.now(),
    sources: {
      holders: ownership.state,
      lp: combinedState(lp.state, sourceState(pairToken)),
      contract: contractFunctions(contract).length > 0 ? contractState : "unavailable",
      creator: creatorAddress ? sourceState(transaction) : "unavailable",
      transfers: transferHistory ? transferHistory.stale ? "cached" : "fresh" : "unavailable",
      senders: combinedState(...resolvedTransactions.map((entry) => entry.transaction?.data.from?.hash ? sourceState(entry.transaction) : "unavailable"))
    },
    holderHistoryPartial: ownership.partial,
    lpHistoryPartial: lp.partial,
    poolScope: [...pools].sort().join(","),
    burnedTokenShare: ownership.burned,
    capabilities: detectCapabilities(address, contract),
    contractVisible: contractFunctions(contract).length > 0,
    creatorShare: ownership.shareAt(creatorAddress),
    holderClusters: holderNetwork.clusters,
    holderConnections: holderNetwork.connections,
    holderPositions,
    lpBurnedShare: lp.burned,
    lpTopHolderIsContract: Boolean(topLp?.address?.is_contract),
    lpTopHolderShare: lp.top(1),
    poolShare: ownership.shareAt(pairLower),
    top1Share: ownership.top(1),
    top5Share: ownership.top(5),
    top10Share: ownership.top(10),
    transferHistoryTruncated: transferHistory?.truncated ?? true,
    transactionSenders,
    walletSignals
  };
}
function buildWarnings(market, detail) {
  const warnings = [];
  const incomplete = Object.entries(detail.sources).filter(([, state]) => state !== "fresh");
  if (incomplete.length) warnings.push({ basis: "unverified", title: "Detail checks are incomplete", detail: copy("{sources}. Missing data is not a clean risk check.", { sources: incomplete.map(([name, state]) => `${name}: ${state}`).join("; ") }), tone: "warning" });
  if (detail.holderHistoryPartial || detail.lpHistoryPartial) warnings.push({ basis: "unverified", title: "Holder index is partial", detail: "Only the first holder page is available. Unseen balances and incomplete burn totals remain unknown.", tone: "info" });
  if (market.periods.h24.priceChange === null) warnings.push({ basis: "unverified", title: "24H starting price unavailable", detail: "The 24H return is not estimated from a shorter window.", tone: "info" });
  if (market.historyTruncated) warnings.push({ basis: "unverified", title: "24-hour activity is partial", detail: "Older events beyond the ArcScan page limit are not included in totals.", tone: "info" });
  if (market.reserveSource === "balance") warnings.push({ basis: "estimate", title: "Token-balance fallback", detail: "No indexed Sync event was available. Price and liquidity are derived from the pair's token balances.", tone: "info" });
  if (market.sellCount > 0) warnings.push({ basis: "observed", title: "Sell event indexed", detail: copy("A token-to-USDC Swap was indexed {time} ago. This does not prove that any wallet can sell now.", { time: relativeTime(market.lastSellAt) }), tone: "info" });
  else warnings.push({ basis: "unverified", title: "No sell in available history", detail: "Absence of indexed sells does not prove a token is unsellable.", tone: "info" });
  if (market.totalLiquidity < 200) warnings.push({ basis: "estimate", title: "Pool liquidity below 200 USDC", detail: copy("Reserve-based estimate: {total} USDC total, {quote} USDC on the quote side. This threshold is a screening rule, not a safety rating.", { total: formatValue(market.totalLiquidity), quote: formatValue(market.usdcReserve) }), tone: "warning" });
  if (detail.top10Share !== null && detail.top10Share >= 25) warnings.push({ basis: "estimate", title: "Top-10 ownership exceeds 25%", detail: copy("{share}% of indexed supply, excluding burn addresses and known pools. Addresses are not necessarily independent owners.", { share: detail.top10Share.toFixed(1) }), tone: "warning" });
  if (detail.creatorShare !== null && detail.creatorShare >= 10) warnings.push({ basis: "estimate", title: "Pool-creation sender holds at least 10%", detail: copy("Indexed share: {share}%. This transaction sender may be a relayer; it is not proof of the token team's identity.", { share: detail.creatorShare.toFixed(1) }), tone: "info" });
  if (detail.lpBurnedShare !== null) warnings.push({ basis: "estimate", title: "LP at burn addresses", detail: copy("{share}% of indexed LP supply. This does not establish token safety or sale availability.", { share: detail.lpBurnedShare.toFixed(1) }), tone: "info" });
  warnings.push({ basis: "unverified", title: "Liquidity lock not independently checked", detail: detail.lpTopHolderShare !== null ? copy("Top indexed LP holder: {share}%. Lock contract rules and unlock times have not been checked.", { share: detail.lpTopHolderShare.toFixed(1) }) : "LP ownership or lock terms could not be established.", tone: "info" });
  detail.capabilities.forEach((finding) => warnings.push({ ...capabilityText(finding), detail: copy("{evidence} Names alone do not establish current permissions or execution paths. Selected getter values, when requested, appear separately under Contract state and do not confirm this capability is usable.", {
    evidence: [finding.functions.length ? `ABI: ${finding.functions.join(", ")}.` : "", finding.proxyType ? `Explorer proxy type: ${finding.proxyType}.` : ""].filter(Boolean).join(" ")
  }), tone: "info" }));
  warnings.push({ basis: "unverified", title: "Execution paths not verified", detail: "No sell simulation or full permission audit is performed. Optional contract-state reads below report selected getter values only; they do not prove a control is usable, disabled, or absent elsewhere.", tone: "info" });
  if (!detail.contractVisible) warnings.push({ basis: "unverified", title: "Contract ABI unavailable", detail: "Supply and trading controls cannot be assessed from the available ABI.", tone: "info" });
  else if (detail.capabilities.length === 0) warnings.push({ basis: "unverified", title: "No matching ABI names", detail: "No configured function-name pattern matched. Custom logic, external contracts, or different function names may still impose restrictions.", tone: "info" });
  return warnings;
}
function setDetailState(state) {
  byId("marketDetailEmpty").classList.toggle("hidden", state !== "empty");
  byId("marketDetailLoading").classList.toggle("hidden", state !== "loading");
  byId("marketDetailContent").classList.toggle("hidden", state !== "content");
}
function renderPriceChart(market) {
  const chart = byId("priceChart");
  chart.replaceChildren();
  const points = market.pricePoints;
  if (points.length === 0) {
    const label = svgNode("text", { x: "12", y: "36", class: "chart-label" });
    label.textContent = "No reserve history is available.";
    chart.append(label);
    byId("priceWindow").textContent = "No indexed reserve updates.";
    return;
  }
  const width = 440;
  const height = 180;
  const padding = { top: 16, right: 8, bottom: 12, left: 55 };
  const values = points.map((point) => point.price);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const paddingValue = Math.max((rawMax - rawMin) * 0.15, rawMax * 0.02, 1e-12);
  const min = Math.max(0, rawMin - paddingValue);
  const max = rawMax + paddingValue;
  const range = Math.max(max - min, 1e-12);
  const x = (index) => padding.left + (points.length === 1 ? 0.5 : index / (points.length - 1)) * (width - padding.left - padding.right);
  const y = (value) => padding.top + (1 - (value - min) / range) * (height - padding.top - padding.bottom);
  for (let index = 0; index < 3; index += 1) {
    const value = max - index / 2 * range;
    const rowY = y(value);
    chart.append(svgNode("line", { x1: String(padding.left), y1: String(rowY), x2: String(width - padding.right), y2: String(rowY), class: "chart-grid" }));
    const label = svgNode("text", { x: "0", y: String(rowY + 3), class: "chart-label" });
    label.textContent = formatPrice(value);
    chart.append(label);
  }
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(2)},${y(point.price).toFixed(2)}`).join(" ");
  const baseline = height - padding.bottom;
  chart.append(
    svgNode("path", { d: `${path} L${x(points.length - 1)},${baseline} L${x(0)},${baseline} Z`, class: "price-area" }),
    svgNode("path", { d: path, class: "price-line" })
  );
  points.forEach((point, index) => chart.append(svgNode("circle", { cx: String(x(index)), cy: String(y(point.price)), r: "4", class: "price-dot" })));
  byId("priceWindow").textContent = `${points.length} indexed reserve update${points.length === 1 ? "" : "s"} from this pool's visible history.${market.historyTruncated ? " Older events were not included." : ""}`;
}
function renderWindowMetrics(market) {
  const windows = [
    { changeId: "window5mChange", flowId: "window5mFlow", metrics: market.periods.m5 },
    { changeId: "window1hChange", flowId: "window1hFlow", metrics: market.periods.h1 },
    { changeId: "window6hChange", flowId: "window6hFlow", metrics: market.periods.h6 },
    { changeId: "window24hChange", flowId: "window24hFlow", metrics: market.periods.h24 }
  ];
  for (const window2 of windows) {
    const change = byId(window2.changeId);
    change.textContent = compactChange(window2.metrics.priceChange);
    change.className = changeClass(window2.metrics.priceChange);
    byId(window2.flowId).textContent = `${window2.metrics.buyCount}B / ${window2.metrics.sellCount}S \xB7 ${formatValue(window2.metrics.volumeUsdc, 3)} USDC`;
  }
}
function renderTradeTape(market, detail) {
  const list = byId("tradeList");
  list.replaceChildren();
  const trades = market.trades.slice(0, 10);
  setCopy("detailTradeCount", trades.length > 0 ? copy("{count} visible", { count: trades.length }) : "No trades");
  if (trades.length === 0) {
    list.append(element("div", "trade-empty", copy("No swaps are available in the indexed history.")));
    return;
  }
  for (const trade of trades) {
    const row = element("div", `trade-row ${trade.direction}`);
    const side = element("span", "trade-side", copy(trade.direction === "buy" ? "BUY" : "SELL"));
    const value = element("span", "trade-value");
    value.append(element("strong", "", `${formatValue(trade.usdcValue, 4)} USDC`), element("small", "", `${relativeTime(trade.timestamp)} ago`));
    const links = element("span", "trade-links");
    const actor = tradeActor(detail.transactionSenders[trade.transactionHash.toLowerCase()], trade.fallbackAddress);
    if (actor) {
      const senderLink = element("a", "", shortHash(actor.address, 5, 4));
      senderLink.href = `${EXPLORER_BASE}/address/${actor.address}`;
      senderLink.target = "_blank";
      senderLink.rel = "noreferrer";
      senderLink.title = `${actor.role}: ${actor.address}`;
      senderLink.setAttribute("aria-label", `${actor.role} ${actor.address}`);
      links.append(element("span", "trade-sender-label", copy(actor.role)), senderLink);
    } else {
      links.append(element("span", "", copy("Sender unknown")));
    }
    if (trade.transactionHash) {
      const txLink = element("a", "trade-tx-link", "TX");
      txLink.href = `${EXPLORER_BASE}/tx/${trade.transactionHash}`;
      txLink.target = "_blank";
      txLink.rel = "noreferrer";
      links.append(txLink);
    }
    row.append(side, value, links);
    list.append(row);
  }
}
function renderWalletSignals(market, detail) {
  const signals = detail.walletSignals;
  const count = (category) => signals.filter((signal) => signal.categories.includes(category)).length;
  setCopy("walletSignalCount", detail.sources.transfers === "unavailable" ? "Unavailable" : copy("{count} signals", { count: signals.length }));
  byId("walletCreatorMoves").textContent = String(count("creator"));
  byId("walletWhaleMoves").textContent = String(count("whale"));
  byId("walletEntries").textContent = String(count("entry"));
  byId("walletExits").textContent = String(count("exit"));
  if (detail.sources.transfers === "unavailable") {
    for (const id of ["walletCreatorMoves", "walletWhaleMoves", "walletEntries", "walletExits"]) byId(id).textContent = "--";
  } else {
    if (detail.sources.creator === "unavailable") byId("walletCreatorMoves").textContent = "--";
    if (detail.sources.holders === "unavailable") byId("walletEntries").textContent = "--";
  }
  setCopy("walletSignalNote", copy("Transfers: {transfers}{partial}. Holders: {holders}. Pool transfers are not proof of a swap or full exit.", {
    transfers: copy(detail.sources.transfers),
    partial: copy(detail.transferHistoryTruncated ? "; partial history" : ""),
    holders: copy(detail.sources.holders)
  }));
  document.querySelectorAll("[data-wallet-filter]").forEach((button) => {
    const active = button.dataset.walletFilter === activeWalletSignalFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const filter = activeWalletSignalFilter;
  const visible = filter === "all" ? signals : signals.filter((signal) => signal.categories.includes(filter));
  const list = byId("walletSignalList");
  list.replaceChildren();
  if (visible.length === 0) {
    list.append(element("div", "wallet-signal-empty", copy(detail.sources.transfers === "unavailable" ? "Transfer history could not be loaded. Wallet activity is unknown." : "No wallet movement matches this filter in the available indexed transfers.")));
    return;
  }
  for (const signal of visible) {
    const row = element("div", `wallet-signal-row ${signal.tone}`);
    const head = element("div", "wallet-signal-head");
    const time = element("time", "", `${relativeTime(signal.timestamp)} ago`);
    time.dateTime = signal.timestamp;
    head.append(element("strong", "", signal.title), time);
    const meta = element("div", "wallet-signal-meta");
    const amount = element("span", "wallet-signal-amount");
    amount.append(
      element("strong", "", `${formatValue(signal.amount, 3)} ${market.token.symbol || "tokens"}`),
      element("span", "", `${shareText(signal.share)} supply`)
    );
    const links = element("span", "wallet-signal-links");
    const fromLink = element("a", "", shortHash(signal.fromAddress, 5, 4));
    fromLink.href = `${EXPLORER_BASE}/address/${signal.fromAddress}`;
    fromLink.target = "_blank";
    fromLink.rel = "noreferrer";
    fromLink.title = signal.fromAddress;
    const toLink = element("a", "", shortHash(signal.toAddress, 5, 4));
    toLink.href = `${EXPLORER_BASE}/address/${signal.toAddress}`;
    toLink.target = "_blank";
    toLink.rel = "noreferrer";
    toLink.title = signal.toAddress;
    const txLink = element("a", "", "TX");
    txLink.href = `${EXPLORER_BASE}/tx/${signal.transactionHash}`;
    txLink.target = "_blank";
    txLink.rel = "noreferrer";
    links.append(fromLink, element("span", "", "->"), toLink, txLink);
    meta.append(amount, links);
    row.append(head, element("p", "", signal.detail), meta);
    list.append(row);
  }
}
function renderLiquidityMonitor(market, detail) {
  const events = market.liquidityEvents;
  const now = Date.now();
  const cutoff = now - DAY_MS;
  const recent = events.filter((event) => Date.parse(event.timestamp) >= cutoff && Date.parse(event.timestamp) <= now);
  const added = recent.filter((event) => event.direction === "add").reduce((sum, event) => sum + event.usdcAmount, 0);
  const removed = recent.filter((event) => event.direction === "remove").reduce((sum, event) => sum + event.usdcAmount, 0);
  setCopy("liquidityEventCount", copy("{count} events", { count: events.length }));
  setCopy("liquidityHistoryNote", copy("Showing {shown} of {count} indexed liquidity events. 24H totals use fetched events only{partial}.", {
    shown: Math.min(events.length, 8),
    count: events.length,
    partial: copy(market.historyTruncated ? "; history may be incomplete" : "")
  }));
  byId("liquidityCurrent").textContent = formatValue(market.usdcReserve, 3);
  byId("liquidityAdded").textContent = formatValue(added, 3);
  byId("liquidityRemoved").textContent = formatValue(removed, 3);
  byId("liquidityBurned").textContent = shareText(detail.lpBurnedShare);
  const lpOwnership = detail.lpBurnedShare !== null && detail.lpBurnedShare >= 90 ? copy("{share} of LP supply is held by burn addresses.", { share: shareText(detail.lpBurnedShare) }) : detail.lpTopHolderShare !== null ? copy("Top {holder} controls {share} of LP supply; a lock is not confirmed.", { holder: copy(detail.lpTopHolderIsContract ? "contract" : "wallet"), share: shareText(detail.lpTopHolderShare) }) : copy("LP ownership is unavailable from the current index.");
  setCopy("liquidityLpStatus", copy("{ownership} LP data: {state}{partial}.", {
    ownership: lpOwnership,
    state: copy(detail.sources.lp),
    partial: copy(detail.lpHistoryPartial ? "; partial holder page" : "")
  }));
  const list = byId("liquidityEventList");
  list.replaceChildren();
  if (events.length === 0) {
    list.append(element("div", "liquidity-empty", copy("No Mint or Burn event appears in the visible pair history.")));
    return;
  }
  for (const event of events.slice(0, 8)) {
    const row = element("div", `liquidity-event-row ${event.direction}`);
    const head = element("div", "liquidity-event-head");
    const time = element("time", "", copy("{time} ago", { time: relativeTime(event.timestamp) }));
    time.dateTime = event.timestamp;
    head.append(element("strong", "", copy(event.direction === "add" ? "Liquidity added" : "Liquidity removed")), time);
    const values = element("div", "liquidity-event-values");
    values.append(
      element("strong", "", `${formatValue(event.usdcAmount, 4)} USDC`),
      element("span", "", `${formatValue(event.tokenAmount, 3)} ${market.token.symbol || "tokens"}`),
      element("span", "", event.changePercent === null ? copy("Initial / unknown base") : copy("{percent}% of prior USDC reserve", { percent: event.changePercent.toFixed(1) }))
    );
    const links = element("span", "liquidity-event-links");
    const wallet = detail.transactionSenders[event.transactionHash.toLowerCase()] ?? event.fallbackAddress;
    if (wallet) {
      const walletLink = element("a", "", shortHash(wallet, 5, 4));
      walletLink.href = `${EXPLORER_BASE}/address/${wallet}`;
      walletLink.target = "_blank";
      walletLink.rel = "noreferrer";
      walletLink.title = wallet;
      links.append(walletLink);
    }
    const txLink = element("a", "", "TX");
    txLink.href = `${EXPLORER_BASE}/tx/${event.transactionHash}`;
    txLink.target = "_blank";
    txLink.rel = "noreferrer";
    links.append(txLink);
    row.append(head, values, links);
    list.append(row);
  }
}
function shareText(value) {
  if (value === null || !Number.isFinite(value)) return "--";
  return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
}
function renderHolders(market, detail) {
  setCopy("holderCountSummary", copy("{count} indexed", { count: fullNumber(market.token.holders_count) }));
  byId("holderTop1").textContent = shareText(detail.top1Share);
  byId("holderTop5").textContent = shareText(detail.top5Share);
  byId("holderTop10").textContent = shareText(detail.top10Share);
  byId("holderCreator").textContent = shareText(detail.creatorShare);
  setCopy("holderSupplyNote", copy("Holders: {state}{partial}. Selected pool {poolShare} \xB7 Burned {burnedShare}. Rankings exclude burn addresses and {count} known same-token pool(s), not all possible pools.", {
    state: copy(detail.sources.holders),
    partial: copy(detail.holderHistoryPartial ? "; first page only" : ""),
    poolShare: shareText(detail.poolShare),
    burnedShare: shareText(detail.burnedTokenShare),
    count: detail.poolScope.split(",").filter(Boolean).length
  }));
  const list = byId("holderList");
  list.replaceChildren();
  if (detail.holderPositions.length === 0) {
    list.append(element("div", "holder-empty", copy("Holder positions are unavailable from the current index.")));
    return;
  }
  detail.holderPositions.forEach((position, index) => {
    const row = element("div", "holder-row");
    const rank = element("span", "holder-rank", `#${index + 1}`);
    const identity = element("div", "holder-identity");
    const addressLine = element("div", "holder-address-line");
    const address = element("a", "holder-address", position.name || shortHash(position.address, 6, 4));
    address.href = `${EXPLORER_BASE}/address/${position.address}`;
    address.target = "_blank";
    address.rel = "noreferrer";
    address.title = position.address;
    addressLine.append(address);
    if (position.isCreator) addressLine.append(element("span", "holder-tag creator", copy("Creation sender")));
    if (position.isContract) addressLine.append(element("span", "holder-tag contract", "Contract"));
    identity.append(addressLine, element("small", "", `${formatValue(position.balance, 3)} ${market.token.symbol || "tokens"}`));
    const ownership = element("div", "holder-ownership");
    ownership.append(element("strong", "", shareText(position.share)));
    const track = element("span", "holder-track");
    const fill = element("span", "holder-fill");
    fill.style.width = `${Math.min(100, Math.max(0, position.share ?? 0))}%`;
    track.append(fill);
    ownership.append(track);
    row.append(rank, identity, ownership);
    list.append(row);
  });
}
function renderHolderConnections(detail) {
  const connections = detail.holderConnections;
  const clusters = detail.holderClusters;
  const connectedWallets = new Set(connections.flatMap((connection) => [connection.addressA.toLowerCase(), connection.addressB.toLowerCase()]));
  const unavailable = detail.sources.holders === "unavailable" || detail.sources.transfers === "unavailable";
  setCopy("holderClusterSummary", unavailable ? "Unavailable" : connections.length === 0 ? "No visible links" : copy("{count} links", { count: connections.length }));
  byId("clusterConnections").textContent = String(connections.length);
  byId("clusterWallets").textContent = String(connectedWallets.size);
  byId("clusterCount").textContent = String(clusters.length);
  byId("clusterLargest").textContent = clusters[0] ? shareText(clusters[0].share) : "--";
  if (unavailable) {
    for (const id of ["clusterConnections", "clusterWallets", "clusterCount"]) byId(id).textContent = "--";
  }
  const positionByAddress = new Map(detail.holderPositions.map((position) => [position.address.toLowerCase(), position]));
  const map = byId("holderClusterMap");
  map.replaceChildren();
  if (clusters.length === 0) {
    map.append(element("div", "cluster-empty", unavailable ? copy("Holder connections cannot be checked without holder and transfer data.") : copy("No connection appears in the available post-launch history. Holders: {holders}; transfers: {transfers}.", { holders: copy(detail.sources.holders), transfers: copy(detail.sources.transfers) })));
  } else {
    clusters.forEach((cluster, index) => {
      const group = element("div", "cluster-group");
      const head = element("div", "cluster-group-head");
      head.append(
        element("strong", "", `Cluster ${index + 1}`),
        element("span", "", `${cluster.members.length} wallets \xB7 ${shareText(cluster.share)} supply`)
      );
      const nodes = element("div", "cluster-nodes");
      cluster.members.forEach((address) => {
        const position = positionByAddress.get(address.toLowerCase());
        const node = element("a", "cluster-node");
        node.href = `${EXPLORER_BASE}/address/${address}`;
        node.target = "_blank";
        node.rel = "noreferrer";
        node.title = address;
        if (position?.isCreator) node.classList.add("creator");
        if (position?.isContract) node.classList.add("contract");
        node.append(element("strong", "", shortHash(address, 4, 3)), element("span", "", shareText(position?.share ?? null)));
        nodes.append(node);
      });
      group.append(head, nodes);
      map.append(group);
    });
  }
  const list = byId("holderConnectionList");
  list.replaceChildren();
  for (const connection of connections.slice(0, 8)) {
    const row = element("div", "connection-row");
    const copy2 = element("div", "connection-copy");
    copy2.append(
      element("strong", "", connection.kind === "direct" ? "Direct holder transfer" : "Shared funding source"),
      element("span", "", connection.kind === "direct" ? "Tokens moved directly between these top holders." : "Both top holders received tokens from the same indexed wallet.")
    );
    const links = element("span", "connection-links");
    for (const address of [connection.addressA, connection.addressB]) {
      const link = element("a", "", shortHash(address, 4, 3));
      link.href = `${EXPLORER_BASE}/address/${address}`;
      link.target = "_blank";
      link.rel = "noreferrer";
      links.append(link);
    }
    if (connection.source) {
      const source = element("a", "", "Source");
      source.href = `${EXPLORER_BASE}/address/${connection.source}`;
      source.target = "_blank";
      source.rel = "noreferrer";
      links.append(source);
    } else if (connection.transactionHash) {
      const transaction = element("a", "", "TX");
      transaction.href = `${EXPLORER_BASE}/tx/${connection.transactionHash}`;
      transaction.target = "_blank";
      transaction.rel = "noreferrer";
      links.append(transaction);
    }
    row.append(copy2, links);
    list.append(row);
  }
}
function updateWatchToggle(market) {
  const watched = watchlist.has(market.tokenAddress.toLowerCase());
  const button = byId("watchToggle");
  button.classList.toggle("active", watched);
  button.setAttribute("aria-pressed", String(watched));
  localize(button, watched ? "Remove token from watchlist" : "Add token to watchlist", "aria-label");
  localize(button, watched ? "Remove from watchlist" : "Add to watchlist", "title");
  byId("watchIcon").textContent = watched ? "\u2605" : "\u2606";
}
function renderWatchDigest() {
  const section = byId("watchDigest");
  section.classList.toggle("hidden", Boolean(linkedPool));
  if (linkedPool) return;
  const watched = markets.filter((market) => watchlist.has(market.tokenAddress.toLowerCase()));
  const events = watched.flatMap((market) => (readTracking(market.pairAddress)?.alerts ?? []).map((alert) => ({ ...alert, market })));
  const onlyNew = byId("watchChangeView").value === "new";
  const recent = recentWatchChanges(events, onlyNew ? watchReviewedAt : null, Date.now());
  localize(byId("watchDigestTitle"), "Watchlist changes");
  const covered = new Set(watched.map((market) => market.tokenAddress.toLowerCase())).size;
  const checked = watched.filter((market) => {
    const detail = detailCache.get(poolCacheKey(market));
    return !market.stale && detail && Date.now() - detail.data.checkedAt < DETAIL_CACHE_TTL_MS && detail.data.sources.holders === "fresh" && detail.data.sources.lp === "fresh" && detail.data.sources.creator === "fresh";
  }).length;
  setCopy("watchDigestCoverage", copy("{covered} / {total} watched tokens loaded \xB7 {checked} / {pools} pools with recent ownership reads \xB7 {state}", { covered, total: watchlist.size, checked, pools: watched.length, state: copy(watchScanRunning ? "Checking" : document.hidden ? "Paused" : "Tab-only monitoring") }));
  setCopy("watchMonitorNote", copy("Up to 3 loaded watched pools checked per minute while this tab is visible. No monitoring while hidden or closed. {review}", { review: watchReviewedAt ? copy("Reviewed {time}.", { time: new Date(watchReviewedAt).toLocaleString() }) : copy("Not reviewed yet.") }));
  byId("markWatchReviewed").disabled = recent.length === 0 || marketLoadFailed;
  const list = byId("watchDigestList");
  list.replaceChildren();
  if (!recent.length) {
    list.append(element("p", "watch-digest-empty", copy(watchlist.size === 0 ? "No watched tokens." : covered === 0 ? "Watched tokens are outside the loaded pool coverage." : "No recorded changes in this view. Gaps in observation are not proof of no activity.")));
    return;
  }
  for (const event of recent) {
    const row = element("article", `watch-digest-item ${event.tone}`);
    const title = element("a", "", `${event.market.token.symbol ?? "Token"}: ${event.title}`);
    title.href = marketUrl(location.href, NETWORK.id, event.market.pairAddress);
    const head = element("div", "observed-alert-head");
    head.append(title, element("time", "", `Observed ${relativeTime(event.observedAt)} ago`));
    const evidence = element("a", "watch-evidence-link", event.type === "sell" ? "Indexed pool events" : "Snapshot comparison \xB7 source");
    evidence.href = `${EXPLORER_BASE}/${["ownership", "holders"].includes(event.type) ? `token/${event.market.tokenAddress}` : `address/${event.market.pairAddress}`}`;
    evidence.target = "_blank";
    evidence.rel = "noreferrer";
    row.append(head, element("p", "", event.detail), evidence, element("small", "", `Pool ${shortHash(event.market.pairAddress)}${event.market.stale ? " \xB7 cached now" : ""}`));
    list.append(row);
  }
}
async function checkWatchedPools() {
  if (watchScanRunning || document.hidden || linkedPool || marketLoadFailed || Date.now() - lastWatchScanAt < AUTO_REFRESH_MS) return;
  const watched = markets.filter((market) => !market.stale && watchlist.has(market.tokenAddress.toLowerCase()));
  const batch = nextWatchBatch(watched, (market) => Math.max(
    watchCheckAttempts.get(poolCacheKey(market)) ?? 0,
    detailCache.get(poolCacheKey(market))?.data.checkedAt ?? 0
  ), Date.now(), DETAIL_CACHE_TTL_MS);
  if (!batch.length) {
    renderWatchDigest();
    return;
  }
  lastWatchScanAt = Date.now();
  watchScanRunning = true;
  renderWatchDigest();
  try {
    for (const market of batch) {
      if (document.hidden) break;
      if (!watchlist.has(market.tokenAddress.toLowerCase())) continue;
      watchCheckAttempts.set(poolCacheKey(market), Date.now());
      try {
        const detail = await getMarketDetail(market, false);
        if (!marketLoadFailed && markets.includes(market)) observeDetailChanges(market, detail);
      } catch {
      }
      renderWatchDigest();
    }
  } finally {
    watchScanRunning = false;
    renderWatchDigest();
  }
}
function renderObservedAlerts(market) {
  renderWatchDigest();
  const watched = watchlist.has(market.tokenAddress.toLowerCase());
  const section = byId("observedAlertSection");
  section.classList.toggle("hidden", !watched);
  if (!watched) return;
  const tracking = readTracking(market.pairAddress) ?? startTracking(market);
  const alerts = tracking.alerts ?? [];
  setCopy("observedAlertCount", copy("{count} events", { count: alerts.length }));
  const list = byId("observedAlertList");
  list.replaceChildren();
  if (alerts.length === 0) {
    list.append(element("div", "observed-alert-empty", "No material change has been observed from the saved baseline."));
  } else {
    for (const alert of alerts.slice(0, 12)) {
      const row = element("div", `observed-alert-row ${alert.tone}`);
      const head = element("div", "observed-alert-head");
      const time = element("time", "", `${relativeTime(alert.observedAt)} ago`);
      time.dateTime = alert.observedAt;
      head.append(element("strong", "", alert.title), time);
      const type = element("span", "observed-alert-type", alert.type);
      row.append(head, element("p", "", alert.detail), type);
      list.append(row);
    }
  }
  const started = new Date(tracking.startedAt);
  const baseline = Number.isFinite(started.getTime()) ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(started) : "this browser";
  setCopy("observedAlertNote", copy("Baseline {time} \xB7 stored in this browser.", { time: baseline }));
}
function exitEstimate(market, supplyPercent) {
  const supply = decimalValue(market.token.total_supply, market.token.decimals);
  const amountIn = supply * (supplyPercent / 100);
  if (amountIn <= 0 || market.tokenReserve <= 0 || market.usdcReserve <= 0) return null;
  const amountAfterFee = amountIn * 0.997;
  const output = amountAfterFee * market.usdcReserve / (market.tokenReserve + amountAfterFee);
  const idealOutput = amountIn * (market.usdcReserve / market.tokenReserve);
  const impact = idealOutput > 0 ? Math.max(0, (1 - output / idealOutput) * 100) : 0;
  return { impact, output };
}
function renderExitCurve(market) {
  const chart = byId("exitCurve");
  chart.replaceChildren();
  const percentages = [0.1, 0.5, 1, 2, 5];
  const estimates = percentages.map((percent) => ({ percent, estimate: exitEstimate(market, percent) }));
  if (estimates.some((entry) => entry.estimate === null)) {
    const label = svgNode("text", { x: "12", y: "36", class: "chart-label" });
    label.textContent = "Pool reserves are unavailable.";
    chart.append(label);
    localize(byId("exitEstimate"), "Unavailable");
    return;
  }
  const width = 440;
  const height = 170;
  const padding = { top: 16, right: 8, bottom: 12, left: 42 };
  const impacts = estimates.map((entry) => entry.estimate.impact);
  const maxImpact = Math.max(5, Math.ceil(Math.max(...impacts) / 5) * 5);
  const x = (index) => padding.left + index / (estimates.length - 1) * (width - padding.left - padding.right);
  const y = (impact) => padding.top + (1 - impact / maxImpact) * (height - padding.top - padding.bottom);
  for (let index = 0; index < 3; index += 1) {
    const impact = maxImpact * (1 - index / 2);
    const rowY = y(impact);
    chart.append(svgNode("line", { x1: String(padding.left), y1: String(rowY), x2: String(width - padding.right), y2: String(rowY), class: "chart-grid" }));
    const label = svgNode("text", { x: "0", y: String(rowY + 3), class: "chart-label" });
    label.textContent = `${impact.toFixed(0)}%`;
    chart.append(label);
  }
  const path = estimates.map((entry, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(2)},${y(entry.estimate.impact).toFixed(2)}`).join(" ");
  const baseline = height - padding.bottom;
  chart.append(
    svgNode("path", { d: `${path} L${x(estimates.length - 1)},${baseline} L${x(0)},${baseline} Z`, class: "exit-area" }),
    svgNode("path", { d: path, class: "exit-line" })
  );
  estimates.forEach((entry, index) => chart.append(svgNode("circle", { cx: String(x(index)), cy: String(y(entry.estimate.impact)), r: "4", class: "exit-dot" })));
  const onePercent = estimates.find((entry) => entry.percent === 1).estimate;
  setCopy("exitEstimate", copy("1% -> {amount} USDC \xB7 {impact}% impact", { amount: formatValue(onePercent.output, 3), impact: onePercent.impact.toFixed(1) }));
}
function renderPoolComparison(market) {
  const peers = groupTokenPools(markets.filter((entry) => entry.chainId === market.chainId && entry.tokenAddress.toLowerCase() === market.tokenAddress.toLowerCase()))[0]?.pools ?? [market];
  const select = byId("poolSelector");
  select.replaceChildren();
  for (const peer of peers) {
    const option = element("option", "", `${adapterFor(peer).source.label} \xB7 ${shortHash(peer.pairAddress)} \xB7 ${formatValue(peer.totalLiquidity)} USDC`);
    option.value = peer.pairAddress.toLowerCase();
    select.append(option);
  }
  select.value = market.pairAddress.toLowerCase();
  select.disabled = peers.length < 2;
  setCopy("poolComparisonNote", copy("Loaded pools: {count}. Quotes are pool-specific, not executable prices. Default: fresh data first, then highest liquidity.", { count: peers.length }));
  const list = byId("poolComparisonList");
  list.replaceChildren();
  for (const peer of peers) {
    const row = element("div", "pool-comparison-row");
    const link = element("a", "", shortHash(peer.pairAddress));
    link.href = marketUrl(location.href, NETWORK.id, peer.pairAddress);
    link.setAttribute("aria-label", `Open pool ${peer.pairAddress}`);
    const quote = element("span");
    quote.append(priceElement(peer.currentPrice));
    row.append(
      link,
      quote,
      element("span", "", `${formatValue(peer.totalLiquidity)} USDC`),
      element("small", "", copy("{state}{partial} \xB7 {trade}", { state: copy(peer.stale ? "Cached" : "Fetched"), partial: copy(peer.historyTruncated ? " \xB7 Partial history" : ""), trade: peer.lastTradeAt ? copy("trade {time}", { time: relativeTime(peer.lastTradeAt) }) : copy("no trades") }))
    );
    list.append(row);
  }
}
function renderAuthority(market) {
  const key = `${market.chainId}:${market.tokenAddress.toLowerCase()}`;
  const entry = authorityReads.get(key);
  const button = byId("readAuthority");
  const cooling = Boolean(entry && Date.now() - entry.attemptedAt < 6e4);
  button.disabled = !NETWORK || Boolean(authorityRunning) || cooling;
  localize(button, authorityRunning === key ? "Reading..." : entry ? "Read again" : "Read state");
  localize(button, cooling ? "Public RPC cooldown: one request per token per minute." : "Read selected contract getters without connecting a wallet", "title");
  const status = byId("authorityStatus");
  localize(status, authorityRunning === key ? "Reading verified ABI and public RPC state..." : entry?.error ? entry.error : entry?.snapshot?.block ? "Fixed-block snapshot. Values may have changed since this read." : entry?.snapshot ? "State not read: no supported verified getters available." : "No state snapshot requested.");
  const provenance = byId("authoritySource");
  const rows = byId("authorityRows");
  provenance.replaceChildren();
  rows.replaceChildren();
  const snapshot = entry?.snapshot;
  if (!snapshot) return;
  const sourceLink = (label, path) => {
    const link = element("a", "", label);
    link.href = `${EXPLORER_BASE}${path}`;
    link.target = "_blank";
    link.rel = "noreferrer";
    return link;
  };
  provenance.append(element("span", "", `${NETWORK.label} / Checked ${new Date(snapshot.checkedAt).toLocaleString()}`));
  if (snapshot.block) {
    provenance.append(
      sourceLink(`Block ${snapshot.block.number}`, `/block/${snapshot.block.number}`),
      element("span", "", `Block time ${new Date(snapshot.block.timestamp).toLocaleString()}`)
    );
  }
  for (const address of snapshot.abiAddresses) provenance.append(sourceLink(`ABI ${shortHash(address)}`, `/address/${address}?tab=contract`));
  const unchecked = element("details", "authority-unchecked");
  const uncheckedCount = snapshot.rows.filter((item) => item.state === "unsupported").length;
  unchecked.append(element("summary", "", copy("{count} checks unavailable from ABI", { count: uncheckedCount })));
  for (const item of snapshot.rows) {
    const row = element("div", "authority-row");
    const value = element("div", "authority-value");
    value.append(element("strong", "", item.state === "unsupported" || item.value === "Unavailable" ? copy(item.value) : item.value));
    if (item.addresses?.length) {
      const addresses = element("div", "authority-addresses");
      for (const address of item.addresses) addresses.append(sourceLink(address, `/address/${address}`));
      if (item.addresses.length === 1 && item.value === item.addresses[0]) value.replaceChildren();
      value.append(addresses);
    }
    value.append(element("small", "", copy(item.note)));
    row.append(element("span", "", copy(item.label)), value);
    (item.state === "unsupported" ? unchecked : rows).append(row);
  }
  if (uncheckedCount) rows.append(unchecked);
  for (const note of snapshot.notes) rows.append(element("p", "authority-note", copy(note)));
}
async function readSelectedAuthority() {
  const market = markets.find((entry2) => entry2.pairAddress.toLowerCase() === selectedPair);
  if (!market || !NETWORK || authorityRunning) return;
  const key = `${market.chainId}:${market.tokenAddress.toLowerCase()}`;
  const previous = authorityReads.get(key);
  if (previous && Date.now() - previous.attemptedAt < 6e4) return;
  const entry = { attemptedAt: Date.now() };
  authorityReads.set(key, entry);
  authorityRunning = key;
  renderAuthority(market);
  const renderSelected = () => {
    const current = markets.find((item) => item.pairAddress.toLowerCase() === selectedPair);
    if (current) renderAuthority(current);
  };
  try {
    entry.snapshot = await readAuthoritySnapshot(NETWORK, market.tokenAddress);
  } catch (error) {
    entry.error = error instanceof Error && error.name !== "AbortError" && error.name !== "TimeoutError" ? error.message : "State read timed out. No current values are assumed.";
  } finally {
    authorityRunning = "";
    renderSelected();
    window.setTimeout(renderSelected, Math.max(0, 6e4 - (Date.now() - entry.attemptedAt)) + 50);
  }
}
function renderDetail(market, detail) {
  renderAuthority(market);
  renderPoolComparison(market);
  byId("marketTokenMark").textContent = (market.token.symbol || market.token.name || "?").slice(0, 2).toUpperCase();
  byId("marketTokenName").textContent = market.token.name || "Unnamed token";
  byId("marketTokenSymbol").textContent = market.token.symbol || "--";
  const tokenLink = byId("marketTokenAddress");
  tokenLink.textContent = shortHash(market.tokenAddress, 7, 5);
  tokenLink.href = `${EXPLORER_BASE}/token/${market.tokenAddress}`;
  updateWatchToggle(market);
  renderObservedAlerts(market);
  const detailPrice = byId("detailPrice");
  const formattedPrice = priceFormat(market.currentPrice);
  detailPrice.replaceChildren(...priceElement(market.currentPrice, true).childNodes);
  detailPrice.title = formattedPrice.full === "--" ? "Price unavailable" : `${formattedPrice.full} USDC`;
  detailPrice.setAttribute("aria-label", formattedPrice.full === "--" ? "Price unavailable" : `${formattedPrice.full} USDC`);
  const detailChange = byId("detailPriceChange");
  detailChange.textContent = `24H ${compactChange(market.periods.h24.priceChange)}`;
  detailChange.className = changeClass(market.periods.h24.priceChange);
  setCopy("detailFdv", market.fdv === null ? "Unavailable" : copy("{value} USDC", { value: formatValue(market.fdv) }));
  byId("detailLiquidity").textContent = `${formatValue(market.totalLiquidity)} USDC`;
  setCopy("detailLiquidityNote", copy("{amount} USDC exit side \xB7 {source}", { amount: formatValue(market.usdcReserve), source: copy(market.reserveSource === "sync" ? "Sync reserves" : "balance fallback") }));
  byId("detailHolders").textContent = fullNumber(market.token.holders_count);
  const change = byId("priceChange");
  change.textContent = formatChange(market.priceChange);
  change.className = changeClass(market.priceChange);
  renderWindowMetrics(market);
  renderPriceChart(market);
  const recent = market.periods.h24;
  byId("detailBuys").textContent = String(recent.buyCount);
  byId("detailSells").textContent = String(recent.sellCount);
  byId("detailVolume").textContent = `${formatValue(recent.volumeUsdc, 3)} USDC`;
  setCopy("detailLastTrade", market.lastTradeAt ? copy("{time} ago", { time: relativeTime(market.lastTradeAt) }) : "None");
  const totalFlow = Math.max(1, recent.buyCount + recent.sellCount);
  byId("detailBuyBar").style.width = `${recent.buyCount / totalFlow * 100}%`;
  byId("detailSellBar").style.width = `${recent.sellCount / totalFlow * 100}%`;
  renderTradeTape(market, detail);
  renderWalletSignals(market, detail);
  renderLiquidityMonitor(market, detail);
  renderHolders(market, detail);
  renderHolderConnections(detail);
  const warnings = buildWarnings(market, detail);
  const summary = evidenceSummary(warnings);
  setCopy("warningCount", copy("{indexed} indexed \xB7 {calculated} calculated \xB7 {unverified} unverified", { indexed: summary.observed, calculated: summary.estimates, unverified: summary.unverified }));
  const badge = byId("riskBadge");
  badge.className = "risk-badge";
  localize(badge, summary.label);
  localize(badge, "Evidence completeness, not a risk score or safety verdict.", "title");
  setCopy("evidenceFreshness", copy("Market: {market} \xB7 Contract: {contract} \xB7 Holders: {holders} \xB7 No safety score", { market: copy(market.stale ? "Cached" : "Fetched"), contract: copy(detail.sources.contract), holders: copy(detail.sources.holders) }));
  const sources = byId("evidenceSources");
  sources.replaceChildren();
  for (const [label, path] of [["Token contract", `/address/${market.tokenAddress}?tab=contract`], ["Pool events", `/address/${market.pairAddress}?tab=logs`], ["Holder index", `/token/${market.tokenAddress}?tab=holders`]]) {
    const link = element("a", "", copy(label));
    link.href = `${EXPLORER_BASE}${path}`;
    link.target = "_blank";
    link.rel = "noreferrer";
    sources.append(link);
  }
  const list = byId("marketWarnings");
  list.replaceChildren();
  for (const warning of warnings) {
    const row = element("div", `warning-item ${warning.tone}`);
    const copyBlock = element("div", "warning-copy");
    copyBlock.append(element("small", `evidence-label ${warning.basis}`, copy(warning.basis === "observed" ? "Indexed event" : warning.basis === "estimate" ? "Calculated" : "Unverified")), element("strong", "", copy(warning.title)), element("span", "", typeof warning.detail === "string" ? copy(warning.detail) : warning.detail));
    row.append(element("span", "warning-dot"), copyBlock);
    list.append(row);
  }
  renderExitCurve(market);
  setDetailState("content");
}
async function getMarketDetail(market, force) {
  const key = poolCacheKey(market);
  const scope = [...knownTokenPools(market, markets)].sort().join(",");
  const cached = detailCache.get(key);
  if (!force && cached && cached.data.poolScope === scope && Date.now() - cached.data.checkedAt < DETAIL_CACHE_TTL_MS) return cached.data;
  const flightKey = `${key}:${scope}`;
  const running = detailFlights.get(flightKey);
  if (running) return running;
  const request = fetchMarketDetail(market, force).then((detail) => {
    detailCache.set(key, { data: detail, savedAt: Date.now() });
    return detail;
  });
  detailFlights.set(flightKey, request);
  try {
    return await request;
  } finally {
    detailFlights.delete(flightKey);
  }
}
async function loadDetail(market, force = false) {
  const url = marketUrl(location.href, NETWORK.id, market.pairAddress);
  byId("fullMarketLink").href = url;
  byId("copyMarketLink").disabled = false;
  setCopy("shareMarketStatus", "");
  if (linkedPool) document.title = `${market.token.symbol ?? "Token"} | ARCROW`;
  const requestId = ++detailRequest;
  const key = poolCacheKey(market);
  const cached = detailCache.get(key);
  const poolScope = [...knownTokenPools(market, markets)].sort().join(",");
  if (!force && cached && cached.data.poolScope === poolScope && Date.now() - cached.savedAt < DETAIL_CACHE_TTL_MS) {
    if (requestId === detailRequest && selectedPair === market.pairAddress.toLowerCase()) renderDetail(market, cached.data);
    return;
  }
  setDetailState("loading");
  try {
    const detail = await getMarketDetail(market, force);
    if (requestId !== detailRequest || selectedPair !== market.pairAddress.toLowerCase()) return;
    if (!market.stale) observeDetailChanges(market, detail);
    renderDetail(market, detail);
  } catch {
    if (requestId !== detailRequest) return;
    renderDetail(market, { checkedAt: Date.now(), sources: { holders: "unavailable", lp: "unavailable", contract: "unavailable", creator: "unavailable", transfers: "unavailable", senders: "unavailable" }, poolScope, holderHistoryPartial: true, lpHistoryPartial: true, burnedTokenShare: null, capabilities: [], contractVisible: false, creatorShare: null, holderClusters: [], holderConnections: [], holderPositions: [], lpBurnedShare: null, lpTopHolderIsContract: false, lpTopHolderShare: null, poolShare: null, top1Share: null, top5Share: null, top10Share: null, transferHistoryTruncated: true, transactionSenders: {}, walletSignals: [] });
  }
}
async function selectMarket(market, scrollOnMobile) {
  selectedPair = market.pairAddress.toLowerCase();
  activeWalletSignalFilter = "all";
  renderMarketRows();
  await loadDetail(market);
  if (scrollOnMobile && window.matchMedia("(max-width: 960px)").matches) {
    byId("marketDetailContent").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
function setNotice(message) {
  const notice = byId("dataNotice");
  localize(notice, message ?? "");
  notice.classList.toggle("hidden", !message);
}
async function loadMarkets(force) {
  if (linkedPool) {
    const seed = await resolveLinkedPool(
      linkedPool,
      dexAdapters,
      async (address) => (await fetchData(`/addresses/${address}`, 3e5, force)).data,
      async (path) => (await fetchData(path, 3e5, force)).data
    );
    const market = await loadMarketPair(seed, force);
    if (!market) throw new Error("This pool's market data could not be loaded. Retry with Refresh.");
    markets = [market];
    selectedPair = market.pairAddress.toLowerCase();
    adPreview.setContentAvailable(true);
    await loadDetail(market, force);
    return market.stale;
  }
  const discovery = await discoverDexPools(dexAdapters, marketLimit, (path) => fetchData(path, 6e4, force));
  const loaded = await mapLimited(discovery.seeds, 3, (seed) => loadMarketPair(seed, force));
  failedMarketCount = loaded.filter((market) => market === null).length;
  if (discovery.seeds.length > 0 && failedMarketCount === loaded.length) {
    throw new Error("All discovered pools failed to load. Market activity is unknown. Retry with Refresh.");
  }
  const previous = new Map(markets.map((market) => [market.pairAddress.toLowerCase(), market]));
  markets = loaded.flatMap((market, index) => {
    if (market) return [market];
    const old = previous.get(discovery.seeds[index].pairAddress.toLowerCase());
    return old ? [{ ...old, stale: true }] : [];
  });
  hasMoreMarkets = discovery.hasMore;
  discoveryLimited = discovery.limited;
  const shown = visibleMarkets();
  const current = markets.find((market) => market.pairAddress.toLowerCase() === selectedPair);
  if (!current || !shown.some((market) => market.tokenAddress.toLowerCase() === current.tokenAddress.toLowerCase())) selectedPair = shown[0]?.pairAddress.toLowerCase() ?? "";
  const selected = markets.find((market) => market.pairAddress.toLowerCase() === selectedPair);
  if (selected) void loadDetail(selected, force);
  else {
    detailRequest += 1;
    setDetailState("empty");
  }
  return discovery.stale || markets.some((market) => market.stale);
}
async function loadDashboard(force = false) {
  if (loading || !NETWORK || routeError) return;
  loading = true;
  renderDiscoveryControls();
  const refresh = byId("refreshButton");
  refresh.disabled = true;
  localize(refresh, "Refreshing");
  setNotice();
  try {
    const stale = await loadMarkets(force);
    marketLoadFailed = false;
    renderMarketRows();
    void checkWatchedPools();
    if (stale) setNotice("Live indexing is temporarily unavailable. Showing the latest cached market snapshot.");
    else if (failedMarketCount > 0) setNotice(copy("Pool loads failed: {count}. Totals cover available pools only.", { count: failedMarketCount }));
    setCopy("lastUpdated", copy("{state} {time}", { state: copy(stale ? "Cached" : failedMarketCount > 0 ? "Partial update" : "Updated"), time: new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(/* @__PURE__ */ new Date()) }));
  } catch (error) {
    marketLoadFailed = true;
    markets = markets.map((market) => ({ ...market, stale: true }));
    renderMarketRows();
    adPreview.setContentAvailable(false);
    setNotice(error instanceof Error ? copy("Market data unavailable: {error}", { error: copy(error.message) }) : "Market data unavailable.");
    localize(byId("lastUpdated"), "Connection unavailable");
    detailRequest += 1;
    setDetailState("empty");
    if (linkedPool) {
      byId("marketDetailEmpty").textContent = "Pool unavailable. Use Refresh to retry or return to markets.";
      byId("copyMarketLink").disabled = true;
    }
  } finally {
    lastRefreshAt = Date.now();
    loading = false;
    refresh.disabled = false;
    localize(refresh, "Refresh");
    renderDiscoveryControls();
  }
}
function applyFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll("[data-market-filter]").forEach((button) => {
    const active = button.dataset.marketFilter === filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const shown = visibleMarkets();
  if (!shown.some((market) => market.pairAddress.toLowerCase() === selectedPair)) {
    if (shown[0]) {
      selectedPair = shown[0].pairAddress.toLowerCase();
      void loadDetail(shown[0]);
    } else {
      selectedPair = "";
      detailRequest += 1;
      setDetailState("empty");
    }
  }
  renderMarketRows();
}
function toggleSelectedWatch() {
  const market = markets.find((entry) => entry.pairAddress.toLowerCase() === selectedPair);
  if (!market) return;
  const key = market.tokenAddress.toLowerCase();
  if (watchlist.has(key)) {
    watchlist.delete(key);
  } else {
    watchlist.add(key);
    if (!market.stale) {
      startTracking(market);
      const detail = detailCache.get(poolCacheKey(market));
      if (detail) observeDetailChanges(market, detail.data);
    }
  }
  saveWatchlist();
  if (activeFilter === "watchlist") {
    applyFilter("watchlist");
    return;
  }
  renderMarketRows();
  updateWatchToggle(market);
  renderObservedAlerts(market);
}
function applyWalletSignalFilter(filter) {
  activeWalletSignalFilter = filter;
  const market = markets.find((entry) => entry.pairAddress.toLowerCase() === selectedPair);
  const detail = market ? detailCache.get(poolCacheKey(market)) : void 0;
  if (market && detail) renderWalletSignals(market, detail.data);
}
function runSearch(query) {
  activeQuery = query.trim().toLowerCase();
  applyFilter(activeFilter);
  const shown = visibleMarkets();
  if (shown.length === 0) {
    setNotice("No match in the loaded pools with these filters.");
    return;
  }
  setNotice();
}
document.querySelectorAll("[data-market-filter]").forEach((button) => {
  button.addEventListener("click", () => applyFilter(button.dataset.marketFilter ?? "all"));
});
document.querySelectorAll("[data-wallet-filter]").forEach((button) => {
  button.addEventListener("click", () => applyWalletSignalFilter(button.dataset.walletFilter ?? "all"));
});
byId("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch(byId("searchInput").value);
});
byId("refreshButton").addEventListener("click", () => void loadDashboard(true));
byId("copyMarketLink").addEventListener("click", async () => {
  const market = markets.find((entry) => entry.pairAddress.toLowerCase() === selectedPair);
  if (!market || !NETWORK) return;
  const url = marketUrl(location.href, NETWORK.id, market.pairAddress);
  try {
    await navigator.clipboard.writeText(url);
    localize(byId("shareMarketStatus"), "Link copied");
  } catch {
    localize(byId("shareMarketStatus"), "Copy unavailable. Use the Full details link.");
  }
});
byId("watchToggle").addEventListener("click", toggleSelectedWatch);
byId("readAuthority").addEventListener("click", () => void readSelectedAuthority());
byId("watchChangeView").addEventListener("change", renderWatchDigest);
byId("markWatchReviewed").addEventListener("click", () => {
  watchReviewedAt = Date.now();
  try {
    localStorage.setItem(`${CACHE_PREFIX}watch-reviewed-at`, String(watchReviewedAt));
  } catch {
  }
  renderWatchDigest();
});
byId("poolSelector").addEventListener("change", () => {
  const market = markets.find((entry) => entry.pairAddress.toLowerCase() === byId("poolSelector").value);
  if (market && !linkedPool) void selectMarket(market, false);
});
byId("marketSort").addEventListener("change", (event) => {
  discoveryOptions.sort = event.target.value;
  applyFilter(activeFilter);
});
byId("minimumLiquidity").addEventListener("change", (event) => {
  discoveryOptions.minimumLiquidity = Number(event.target.value);
  applyFilter(activeFilter);
});
for (const [id, key] of [["traded24h", "traded24h"], ["sellSeenOnly", "sellSeen"]]) {
  byId(id).addEventListener("change", (event) => {
    discoveryOptions[key] = event.target.checked;
    applyFilter(activeFilter);
  });
}
byId("loadMoreMarkets").addEventListener("click", () => {
  if (loading) return;
  if (!marketLoadFailed) marketLimit = Math.min(MAX_MARKETS, marketLimit + MARKET_LIMIT);
  void loadDashboard();
});
initializeLanguage();
if (NETWORK) {
  byId("backToMarkets").href = marketUrl(location.href, NETWORK.id);
  if (linkedPool || routeError) {
    document.body.classList.add("pool-page");
    byId("poolPageNav").classList.remove("hidden");
    byId("poolPageAddress").textContent = linkedPool ? `Pool ${shortHash(linkedPool)}` : "Invalid pool link";
    byId("fullMarketLink").classList.add("hidden");
  }
  localize(document.querySelector(".status-row strong"), copy("{network} MARKET FEED", { network: NETWORK.label.toUpperCase() }));
  document.querySelector(".chain-id").textContent = `CHAIN ${NETWORK.chainId}`;
  document.querySelector(".network-lockup small").textContent = NETWORK.testnet ? "TESTNET" : "MAINNET";
  document.querySelector(".pulse-heading .eyebrow").textContent = `ARCROW / ${NETWORK.label.toUpperCase()}`;
  document.querySelector(".footer-brand small").textContent = `ON ${NETWORK.label.toUpperCase()}`;
  document.querySelectorAll("a[data-explorer]").forEach((link) => {
    link.href = NETWORK.explorerBase;
  });
  if (routeError) {
    setNotice(routeError);
    byId("marketDetailEmpty").textContent = "This pool link is invalid. Return to markets.";
    localize(byId("lastUpdated"), "Invalid link");
    byId("refreshButton").disabled = true;
  } else void loadDashboard();
} else {
  setNotice(networkError);
  localize(byId("lastUpdated"), "Network unavailable");
  document.querySelector(".status-row strong").textContent = "ARCROW";
  document.querySelector(".live-dot").classList.add("hidden");
  document.querySelector(".chain-id").textContent = "";
  document.querySelector(".network-lockup small").textContent = "UNAVAILABLE";
  document.querySelector(".footer-brand small").textContent = "";
  byId("markets").classList.add("hidden");
  document.querySelectorAll("a[data-explorer]").forEach((link) => link.removeAttribute("href"));
  document.querySelectorAll('button, input:not([name="arcrow-theme"]), select:not(#languageSelect)').forEach((control) => {
    control.disabled = true;
  });
}
window.setInterval(() => {
  if (!document.hidden) void loadDashboard();
}, AUTO_REFRESH_MS);
document.addEventListener("visibilitychange", () => {
  if (NETWORK) renderWatchDigest();
  if (!document.hidden && Date.now() - lastRefreshAt >= AUTO_REFRESH_MS) void loadDashboard();
});
/*! Bundled license information:

ieee754/index.js:
  (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)

buffer/index.js:
  (*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   *)

@noble/hashes/esm/utils.js:
@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/esm/abstract/utils.js:
@noble/curves/esm/abstract/modular.js:
@noble/curves/esm/abstract/curve.js:
@noble/curves/esm/abstract/weierstrass.js:
@noble/curves/esm/_shortw_utils.js:
@noble/curves/esm/secp256k1.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
