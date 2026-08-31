var process = globalThis.process || { version: "v20.0.0", env: {}, browser: true };
var global = globalThis;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
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
    exports.read = function(buffer, offset, isLE, mLen, nBytes) {
      var e, m;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var nBits = -7;
      var i = isLE ? nBytes - 1 : 0;
      var d = isLE ? -1 : 1;
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
    exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
      var i = isLE ? 0 : nBytes - 1;
      var d = isLE ? 1 : -1;
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
      return from(arg, encodingOrOffset, length);
    }
    Buffer3.poolSize = 8192;
    function from(value, encodingOrOffset, length) {
      if (typeof value === "string") {
        return fromString(value, encodingOrOffset);
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
      return from(value, encodingOrOffset, length);
    };
    Object.setPrototypeOf(Buffer3.prototype, Uint8Array.prototype);
    Object.setPrototypeOf(Buffer3, Uint8Array);
    function assertSize(size) {
      if (typeof size !== "number") {
        throw new TypeError('"size" argument must be of type number');
      } else if (size < 0) {
        throw new RangeError('The value "' + size + '" is invalid for option "size"');
      }
    }
    function alloc(size, fill, encoding) {
      assertSize(size);
      if (size <= 0) {
        return createBuffer(size);
      }
      if (fill !== void 0) {
        return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
      }
      return createBuffer(size);
    }
    Buffer3.alloc = function(size, fill, encoding) {
      return alloc(size, fill, encoding);
    };
    function allocUnsafe(size) {
      assertSize(size);
      return createBuffer(size < 0 ? 0 : checked(size) | 0);
    }
    Buffer3.allocUnsafe = function(size) {
      return allocUnsafe(size);
    };
    Buffer3.allocUnsafeSlow = function(size) {
      return allocUnsafe(size);
    };
    function fromString(string, encoding) {
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
        const copy = new Uint8Array(arrayView);
        return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
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
    Buffer3.concat = function concat(list, length) {
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
            return utf8ToBytes(string).length;
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
              return mustMatch ? -1 : utf8ToBytes(string).length;
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
    Buffer3.prototype.toString = function toString() {
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
      return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
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
    Buffer3.prototype.slice = function slice(start, end) {
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
    Buffer3.prototype.copy = function copy(target, targetStart, start, end) {
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
    function utf8ToBytes(string, units) {
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

// circle/arc/src/arc-radar.ts
init_browser_buffer_global();

// circle/arc/src/arc-radar-core.ts
init_browser_buffer_global();
var ARC_TESTNET_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
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
function syncReserves(log, pair, tokenDecimals) {
  if (!log.decoded?.method_call?.startsWith("Sync(")) return null;
  const reserve0 = logParameter(log, "reserve0");
  const reserve1 = logParameter(log, "reserve1");
  if (!reserve0 || !reserve1) return null;
  const tokenIs0 = pair.token0.toLowerCase() !== ARC_TESTNET_USDC_ADDRESS;
  const tokenReserve = decimalValue(tokenIs0 ? reserve0 : reserve1, tokenDecimals);
  const usdcReserve = decimalValue(tokenIs0 ? reserve1 : reserve0, 6);
  if (tokenReserve < 0 || usdcReserve < 0) return null;
  return { tokenReserve, usdcReserve };
}
function latestSyncReserves(logs, pair, tokenDecimals) {
  let latest = null;
  for (const [sourcePosition, log] of logs.entries()) {
    const reserves = syncReserves(log, pair, tokenDecimals);
    if (!reserves) continue;
    const timestamp = log.block_timestamp ?? "";
    const parsedTimestamp = new Date(timestamp).getTime();
    const timestampMs = Number.isFinite(parsedTimestamp) ? parsedTimestamp : Number.NEGATIVE_INFINITY;
    const logIndex = log.index ?? -1;
    const isNewer = !latest || timestampMs > latest.timestampMs || timestampMs === latest.timestampMs && logIndex > latest.logIndex || timestampMs === latest.timestampMs && logIndex === latest.logIndex && sourcePosition < latest.sourcePosition;
    if (isNewer) latest = { ...reserves, logIndex, sourcePosition, timestamp, timestampMs };
  }
  if (!latest) return null;
  return { timestamp: latest.timestamp, tokenReserve: latest.tokenReserve, usdcReserve: latest.usdcReserve };
}
function swapDirection(log, pair) {
  if (!log.decoded?.method_call?.startsWith("Swap(")) return null;
  try {
    const amount0In = BigInt(logParameter(log, "amount0In") ?? "0");
    const amount1In = BigInt(logParameter(log, "amount1In") ?? "0");
    const amount0Out = BigInt(logParameter(log, "amount0Out") ?? "0");
    const amount1Out = BigInt(logParameter(log, "amount1Out") ?? "0");
    const tokenIs0 = pair.token0.toLowerCase() !== ARC_TESTNET_USDC_ADDRESS;
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
  try {
    const usdcIs0 = pair.token0.toLowerCase() === ARC_TESTNET_USDC_ADDRESS;
    const amountIn = BigInt(logParameter(log, usdcIs0 ? "amount0In" : "amount1In") ?? "0");
    const amountOut = BigInt(logParameter(log, usdcIs0 ? "amount0Out" : "amount1Out") ?? "0");
    return Number(amountIn + amountOut) / 1e6;
  } catch {
    return 0;
  }
}

// circle/arc/src/arc-radar.ts
var API_BASE = "https://testnet.arcscan.app/api/v2";
var EXPLORER_BASE = "https://testnet.arcscan.app";
var CACHE_PREFIX = "arc-meme-radar:v1:";
var WATCHLIST_STORAGE_KEY = `${CACHE_PREFIX}watchlist`;
var TRACKING_STORAGE_PREFIX = `${CACHE_PREFIX}tracking:v2:`;
var USDC_ADDRESS = ARC_TESTNET_USDC_ADDRESS;
var MARKET_FACTORY = "0x7483847D46Db2920DD64eFa676CF72dcF765814f";
var MARKET_LIMIT = 15;
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
var activeWalletSignalFilter = "all";
var loading = false;
var detailRequest = 0;
var lastRefreshAt = 0;
var watchlist = readWatchlist();
var detailCache = /* @__PURE__ */ new Map();
function byId(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node;
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== void 0) node.textContent = text;
  return node;
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
    const stored = JSON.parse(localStorage.getItem(WATCHLIST_STORAGE_KEY) ?? "[]");
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
  try {
    const raw = localStorage.getItem(`${TRACKING_STORAGE_PREFIX}${address.toLowerCase()}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveTracking(address, tracking) {
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
    return (await fetchData(path, ttlMs, force)).data;
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
function pairSeeds(response) {
  const seen = /* @__PURE__ */ new Set();
  const seeds = [];
  for (const log of response.items ?? []) {
    if (!log.decoded?.method_call?.startsWith("PairCreated(")) continue;
    const token0 = logParameter(log, "token0");
    const token1 = logParameter(log, "token1");
    const pairAddress = logParameter(log, "pair");
    if (!token0 || !token1 || !pairAddress) continue;
    const token0Lower = token0.toLowerCase();
    const token1Lower = token1.toLowerCase();
    if (token0Lower !== USDC_ADDRESS && token1Lower !== USDC_ADDRESS) continue;
    const key = pairAddress.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    seeds.push({
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
  const tokenIs0 = seed.token0.toLowerCase() !== USDC_ADDRESS;
  const events = [];
  for (const log of logs) {
    const method = log.decoded?.method_call ?? "";
    const direction = method.startsWith("Mint(") ? "add" : method.startsWith("Burn(") ? "remove" : null;
    if (!direction || !log.transaction_hash) continue;
    const amount0 = logParameter(log, "amount0");
    const amount1 = logParameter(log, "amount1");
    if (!amount0 || !amount1) continue;
    const tokenAmount = decimalValue(tokenIs0 ? amount0 : amount1, tokenDecimals);
    const usdcAmount = decimalValue(tokenIs0 ? amount1 : amount0, 6);
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
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 12);
}
function tradeFromLog(log, seed) {
  const direction = swapDirection(log, seed);
  if (!direction) return null;
  return {
    direction,
    fallbackAddress: logParameter(log, "to"),
    timestamp: log.block_timestamp ?? "",
    transactionHash: log.transaction_hash ?? "",
    usdcValue: swapUsdcValue(log, seed)
  };
}
function windowPriceChange(pricePoints, currentPrice, cutoffMs) {
  if (currentPrice <= 0 || pricePoints.length === 0) return null;
  const beforeCutoff = pricePoints.filter((point) => new Date(point.timestamp).getTime() <= cutoffMs).at(-1);
  const firstInWindow = pricePoints.find((point) => new Date(point.timestamp).getTime() > cutoffMs);
  const baseline = beforeCutoff ?? firstInWindow;
  if (!baseline || baseline.price <= 0) return null;
  return (currentPrice - baseline.price) / baseline.price * 100;
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
  const tracking = readTracking(market.tokenAddress) ?? {
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
  saveTracking(market.tokenAddress, tracking);
  return tracking;
}
function observeMarketChanges(market) {
  if (market.stale || !watchlist.has(market.tokenAddress.toLowerCase())) return;
  const tracking = readTracking(market.tokenAddress) ?? startTracking(market);
  const previous = tracking.marketSnapshot;
  const next = snapshotForMarket(market);
  if (!previous) {
    tracking.marketSnapshot = next;
    saveTracking(market.tokenAddress, tracking);
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
  if (next.sellCount > previous.sellCount) {
    const difference = next.sellCount - previous.sellCount;
    alerts.push({
      detail: `${difference} additional token-to-USDC sell${difference === 1 ? " was" : "s were"} indexed.`,
      observedAt,
      title: previous.sellCount === 0 ? "First sell observed" : "New sell observed",
      tone: "good",
      type: "sell"
    });
  }
  appendObservedAlerts(tracking, alerts);
  tracking.marketSnapshot = next;
  saveTracking(market.tokenAddress, tracking);
}
function observeDetailChanges(market, detail) {
  if (!watchlist.has(market.tokenAddress.toLowerCase())) return;
  const tracking = readTracking(market.tokenAddress) ?? startTracking(market);
  const next = {
    creatorShare: detail.creatorShare,
    lpBurnedShare: detail.lpBurnedShare,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    top10Share: detail.top10Share
  };
  const previous = tracking.detailSnapshot;
  if (previous) {
    const alerts = [];
    if (previous.top10Share !== null && next.top10Share !== null && Math.abs(next.top10Share - previous.top10Share) >= 3) {
      const difference = next.top10Share - previous.top10Share;
      alerts.push({
        detail: `Top 10 non-pool ownership changed from ${shareText(previous.top10Share)} to ${shareText(next.top10Share)}.`,
        observedAt: next.timestamp,
        title: difference > 0 ? "Holder concentration increased" : "Holder concentration decreased",
        tone: difference > 0 ? "warning" : "good",
        type: "ownership"
      });
    }
    if (previous.creatorShare !== null && next.creatorShare !== null && Math.abs(next.creatorShare - previous.creatorShare) >= 1) {
      const difference = next.creatorShare - previous.creatorShare;
      alerts.push({
        detail: `Pool creator holding changed from ${shareText(previous.creatorShare)} to ${shareText(next.creatorShare)}.`,
        observedAt: next.timestamp,
        title: difference < 0 ? "Pool creator reduced holdings" : "Pool creator holdings increased",
        tone: difference < 0 ? "warning" : "info",
        type: "ownership"
      });
    }
    if (previous.lpBurnedShare !== null && next.lpBurnedShare !== null && Math.abs(next.lpBurnedShare - previous.lpBurnedShare) >= 1) {
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
  saveTracking(market.tokenAddress, tracking);
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
    const nowMs = Date.now();
    const [tokenResult, logResult] = await Promise.all([
      fetchData(`/tokens/${seed.tokenAddress}`, 3e5, force),
      fetchAddressLogs(seed.pairAddress, 3e4, force, nowMs - DAY_MS)
    ]);
    const token = tokenResult.data;
    const logs = logResult.items;
    const latestSync = latestSyncReserves(logs, seed, token.decimals);
    let tokenReserve = latestSync?.tokenReserve ?? 0;
    let usdcReserve = latestSync?.usdcReserve ?? 0;
    let balanceStale = false;
    const reserveSource = latestSync ? "sync" : "balance";
    if (!latestSync) {
      const balanceResult = await fetchData(`/addresses/${seed.pairAddress}/token-balances`, 3e4, force);
      const tokenBalance = balanceResult.data.find((balance) => balance.token.address_hash.toLowerCase() === seed.tokenAddress.toLowerCase());
      const usdcBalance = balanceResult.data.find((balance) => balance.token.address_hash.toLowerCase() === USDC_ADDRESS);
      tokenReserve = decimalValue(tokenBalance?.value, tokenBalance?.token.decimals);
      usdcReserve = decimalValue(usdcBalance?.value, usdcBalance?.token.decimals);
      balanceStale = balanceResult.stale;
    }
    const currentPrice = tokenReserve > 0 ? usdcReserve / tokenReserve : 0;
    const supply = decimalValue(token.total_supply, token.decimals);
    const swaps = logs.filter((log) => log.decoded?.method_call?.startsWith("Swap("));
    const trades = swaps.map((log) => tradeFromLog(log, seed)).filter((trade) => trade !== null).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const buys = trades.filter((trade) => trade.direction === "buy");
    const sells = trades.filter((trade) => trade.direction === "sell");
    const liquidityEvents = liquidityEventsFromLogs(logs, seed, token.decimals);
    const pricePoints = logs.map((log) => syncPrice(log, seed, token.decimals)).filter((point) => point !== null).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (currentPrice > 0 && pricePoints.length === 0) pricePoints.push({ price: currentPrice, timestamp: seed.createdAt });
    const firstPrice = pricePoints[0]?.price;
    const priceChange = firstPrice && currentPrice ? (currentPrice - firstPrice) / firstPrice * 100 : null;
    const market = {
      ...seed,
      buyCount: buys.length,
      currentPrice,
      fdv: currentPrice * supply,
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
function lightweightRisk(market) {
  return (market.sellCount === 0 ? 2 : 0) + (market.usdcReserve < 10 ? 2 : market.usdcReserve < 100 ? 1 : 0);
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
    if (activeFilter === "risky") return lightweightRisk(market) >= 2;
    return true;
  });
  return filtered.sort((a, b) => {
    if (activeFilter === "active") return b.periods.h24.volumeUsdc - a.periods.h24.volumeUsdc || b.periods.h24.swapCount - a.periods.h24.swapCount || new Date(b.lastTradeAt ?? 0).getTime() - new Date(a.lastTradeAt ?? 0).getTime();
    if (activeFilter === "sells") return b.sellCount - a.sellCount;
    if (activeFilter === "risky") return lightweightRisk(b) - lightweightRisk(a);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
function renderMarketSummary() {
  const shown = visibleMarkets();
  const trades = shown.reduce((sum, market) => sum + market.swapCount, 0);
  const liquidity = shown.reduce((sum, market) => sum + market.totalLiquidity, 0);
  const partial = shown.filter((market) => market.historyTruncated).length;
  byId("marketSummary").textContent = `${shown.length} newest pools \xB7 ${trades} indexed swaps \xB7 ${formatValue(liquidity)} USDC liquidity${partial > 0 ? ` \xB7 ${partial} partial histories` : ""}`;
}
function renderMarketPulse() {
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
  byId("pulseNewestAge").textContent = newest ? `${relativeTime(newest.createdAt)} old` : "No pool indexed";
  byId("pulseSellVerified").textContent = `${sellVerified} / ${markets.length}`;
  const swapTotal = buys + sells;
  const coverage = partial > 0 ? ` \xB7 ${partial} pool${partial === 1 ? "" : "s"} partial` : "";
  byId("pulseStatus").textContent = swapTotal > 0 ? `${swapTotal} swaps indexed in the last 24 hours${coverage}` : `No swaps indexed in the available 24-hour history${coverage}`;
}
function changeClass(value) {
  if (value === null || Math.abs(value) < 0.05) return "neutral";
  return value > 0 ? "positive" : "negative";
}
function renderMarketRows() {
  const container = byId("marketRows");
  container.replaceChildren();
  const shown = visibleMarkets();
  renderMarketSummary();
  renderMarketPulse();
  if (shown.length === 0) {
    const message = activeFilter === "active" ? "No token has indexed trading activity in the last 24 hours." : activeFilter === "watchlist" ? "No token is currently on this browser's watchlist." : "No token matches this view.";
    container.append(element("div", "market-loading-row", message));
    return;
  }
  for (const market of shown) {
    const row = element("button", "market-row");
    row.type = "button";
    const isSelected = selectedPair === market.pairAddress.toLowerCase();
    row.classList.toggle("selected", isSelected);
    row.classList.toggle("risky", lightweightRisk(market) >= 2);
    row.setAttribute("aria-pressed", String(isSelected));
    row.setAttribute("aria-label", `Open ${market.token.symbol || market.token.name || "token"} market`);
    const identity = element("span", "market-token");
    const icon = element("span", "market-token-icon", (market.token.symbol || market.token.name || "?").slice(0, 2).toUpperCase());
    const copy = element("span", "market-token-copy");
    const watched = watchlist.has(market.tokenAddress.toLowerCase());
    copy.append(
      element("strong", watched ? "watched-token" : "", `${watched ? "\u2605 " : ""}${market.token.symbol || "Unknown"}`),
      element("span", "", market.token.name || shortHash(market.tokenAddress)),
      element("small", "", `${fullNumber(market.token.holders_count)} holders`)
    );
    identity.append(icon, copy);
    const price = element("span", "market-cell price-cell");
    price.append(priceElement(market.currentPrice), element("small", changeClass(market.periods.m5.priceChange), `5M ${compactChange(market.periods.m5.priceChange)}`));
    const pulse = element("span", "market-cell pulse-cell");
    pulse.append(
      element("strong", changeClass(market.periods.h1.priceChange), `1H ${compactChange(market.periods.h1.priceChange)}`),
      element("small", changeClass(market.periods.h24.priceChange), `24H ${compactChange(market.periods.h24.priceChange)} \xB7 ${formatValue(market.periods.h24.volumeUsdc, 3)} USDC${market.historyTruncated ? " \xB7 partial" : ""}`)
    );
    const liquidity = element("span", "market-cell");
    liquidity.append(element("strong", "", `${formatValue(market.totalLiquidity)} USDC`), element("small", "", `${formatValue(market.usdcReserve)} exit side`));
    const flow = element("span", "row-flow");
    const counts = element("strong");
    counts.append(element("span", "positive", `B ${market.buyCount}`), element("span", "negative", `S ${market.sellCount}`));
    const track = element("span", "mini-flow-track");
    const total = Math.max(1, market.buyCount + market.sellCount);
    const buyBar = element("span");
    const sellBar = element("span");
    buyBar.style.width = `${market.buyCount / total * 100}%`;
    sellBar.style.width = `${market.sellCount / total * 100}%`;
    track.append(buyBar, sellBar);
    flow.append(counts, track, element("small", "", `${formatValue(market.volumeUsdc, 3)} USDC`));
    const age = element("span", "market-cell");
    age.append(element("strong", "", relativeTime(market.createdAt)), element("small", "", market.lastTradeAt ? `trade ${relativeTime(market.lastTradeAt)}` : "no trades"));
    row.append(identity, price, pulse, liquidity, flow, age);
    row.addEventListener("click", () => void selectMarket(market, true));
    container.append(row);
  }
}
function holderShare(raw, totalSupply) {
  const amount = Number(raw);
  const total = Number(totalSupply);
  if (!Number.isFinite(amount) || !Number.isFinite(total) || total <= 0) return null;
  return amount / total * 100;
}
function classifyWalletSignals(market, transfers, holders, creatorAddress) {
  const pair = market.pairAddress.toLowerCase();
  const creator = creatorAddress?.toLowerCase() ?? null;
  const currentHolders = new Set(holders.filter((holder) => Number(holder.value || 0) > 0 && holder.address?.hash).map((holder) => holder.address.hash.toLowerCase()));
  const topHolders = new Set(holders.filter((holder) => {
    const hash = holder.address?.hash?.toLowerCase();
    return Boolean(hash && hash !== pair && !BURN_ADDRESSES.has(hash));
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
    const from = fromAddress.toLowerCase();
    const to = toAddress.toLowerCase();
    const firstIndexedReceipt = !seenReceivers.has(to);
    seenReceivers.add(to);
    const timestamp = new Date(transfer.timestamp).getTime();
    if (transfer.transaction_hash.toLowerCase() === market.creationTx.toLowerCase()) continue;
    if (Number.isFinite(createdAt) && timestamp < createdAt) continue;
    if (BURN_ADDRESSES.has(from) || BURN_ADDRESSES.has(to)) continue;
    const amount = decimalValue(transfer.total?.value, transfer.total?.decimals ?? market.token.decimals);
    const share = holderShare(transfer.total?.value, market.token.total_supply);
    if (amount <= 0 || share === null) continue;
    const fromPool = from === pair;
    const toPool = to === pair;
    const creatorInvolved = Boolean(creator && (from === creator || to === creator));
    const topHolderInvolved = topHolders.has(from) || topHolders.has(to);
    const fullExit = !fromPool && toPool && !currentHolders.has(from);
    const firstEntry = !toPool && !transfer.to?.is_contract && firstIndexedReceipt && currentHolders.has(to) && share >= 0.1;
    const whaleMove = share >= 1 || topHolderInvolved;
    const categories = /* @__PURE__ */ new Set();
    if (creatorInvolved) categories.add("creator");
    if (whaleMove) categories.add("whale");
    if (firstEntry) categories.add("entry");
    if (fullExit) categories.add("exit");
    if (categories.size === 0) continue;
    let title = "Wallet movement";
    let detail = "A token transfer moved between two indexed addresses.";
    let tone = "info";
    if (creatorInvolved) {
      if (from === creator && toPool) {
        title = "Pool creator sold";
        detail = "The PairCreated transaction sender moved tokens into the pool.";
        tone = "warning";
      } else if (to === creator && fromPool) {
        title = "Pool creator bought";
        detail = "The PairCreated transaction sender acquired tokens from the pool.";
        tone = "info";
      } else if (from === creator) {
        title = "Pool creator sent tokens";
        detail = "The PairCreated transaction sender transferred tokens to another address.";
        tone = "warning";
      } else {
        title = "Pool creator received tokens";
        detail = "Tokens moved into the PairCreated transaction sender.";
      }
    } else if (fullExit) {
      title = "Wallet fully exited";
      detail = "This wallet sold into the pool and no longer appears in the current holder index.";
      tone = "warning";
    } else if (whaleMove) {
      if (fromPool) {
        title = topHolders.has(to) ? "Top holder bought" : "Whale-sized buy";
        detail = "A large or current top holder acquired tokens from the pool.";
        tone = "good";
      } else if (toPool) {
        title = topHolders.has(from) ? "Top holder sold" : "Whale-sized sell";
        detail = "A large or current top holder moved tokens into the pool.";
        tone = "warning";
      } else {
        title = topHolders.has(from) ? "Top holder transferred" : "Large wallet transfer";
        detail = "A large token position moved directly between addresses.";
      }
    } else if (firstEntry) {
      title = "New holder entered";
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
function analyzeHolderConnections(market, transfers, positions) {
  const positionByAddress = new Map(positions.map((position) => [position.address.toLowerCase(), position]));
  const pair = market.pairAddress.toLowerCase();
  const createdAt = new Date(market.createdAt).getTime();
  const connectionMap = /* @__PURE__ */ new Map();
  const sharedSources = /* @__PURE__ */ new Map();
  const connectionKey = (addressA, addressB) => [addressA.toLowerCase(), addressB.toLowerCase()].sort().join(":");
  for (const transfer of transfers) {
    if (transfer.type !== "token_transfer" || !transfer.from?.hash || !transfer.to?.hash || !transfer.transaction_hash) continue;
    if (transfer.transaction_hash.toLowerCase() === market.creationTx.toLowerCase()) continue;
    const timestamp = new Date(transfer.timestamp ?? 0).getTime();
    if (Number.isFinite(createdAt) && timestamp < createdAt) continue;
    const from = transfer.from.hash.toLowerCase();
    const to = transfer.to.hash.toLowerCase();
    if (from === pair || to === pair || BURN_ADDRESSES.has(from) || BURN_ADDRESSES.has(to)) continue;
    if (positionByAddress.has(from) && positionByAddress.has(to) && from !== to) {
      connectionMap.set(connectionKey(from, to), {
        addressA: positionByAddress.get(from).address,
        addressB: positionByAddress.get(to).address,
        kind: "direct",
        source: null,
        transactionHash: transfer.transaction_hash
      });
    }
    if (!transfer.from.is_contract && positionByAddress.has(to) && from !== to) {
      const source = sharedSources.get(from) ?? { address: transfer.from.hash, recipients: /* @__PURE__ */ new Set() };
      source.recipients.add(to);
      sharedSources.set(from, source);
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
function detectCapabilities(address, contract) {
  const functions = contractFunctions(contract).filter((entry) => !["view", "pure"].includes(entry.stateMutability ?? ""));
  const names = functions.map((entry) => entry.name ?? "");
  const capabilities = [];
  const has = (pattern) => names.some((name) => pattern.test(name));
  if (has(/^mint|mintTo|increaseSupply|issue/i)) capabilities.push("mint");
  if (has(/blacklist|blocklist|denylist|freeze|wipe|seize/i)) capabilities.push("restrict");
  if (has(/^pause$|^unpause$|setPaused|emergencyPause/i)) capabilities.push("pause");
  if (address?.proxy_type || has(/upgrade|changeAdmin|setImplementation|updateImplementation/i)) capabilities.push("upgrade");
  if (has(/^(set|update|configure).*(fee|tax)|(fee|tax).*(set|update)/i)) capabilities.push("fee");
  return capabilities;
}
async function fetchMarketDetail(market, force) {
  const transactionHashes = [...new Set([
    ...market.trades.map((trade) => trade.transactionHash),
    ...market.liquidityEvents.map((event) => event.transactionHash)
  ].filter(Boolean))].slice(0, 12);
  const transactionRequests = mapLimited(
    transactionHashes,
    3,
    async (hash) => ({
      hash,
      transaction: await fetchOptional(`/transactions/${hash}`, 3e5, force)
    })
  );
  const [holderData, lpHolderData, pairToken, address, transaction, resolvedTransactions, transferHistory] = await Promise.all([
    fetchOptional(`/tokens/${market.tokenAddress}/holders`, 12e4, force),
    fetchOptional(`/tokens/${market.pairAddress}/holders`, 12e4, force),
    fetchOptional(`/tokens/${market.pairAddress}`, 3e5, force),
    fetchOptional(`/addresses/${market.tokenAddress}`, 12e4, force),
    market.creationTx ? fetchOptional(`/transactions/${market.creationTx}`, 3e5, force) : Promise.resolve(null),
    transactionRequests,
    fetchTokenTransfers(market.tokenAddress, force).catch(() => ({ items: [], stale: false, truncated: false }))
  ]);
  const implementationAddress = address?.implementations?.[0]?.address_hash;
  const [proxyContract, implementationContract] = await Promise.all([
    address?.is_verified ? fetchOptional(`/smart-contracts/${market.tokenAddress}`, 3e5, force) : Promise.resolve(null),
    implementationAddress ? fetchOptional(`/smart-contracts/${implementationAddress}`, 3e5, force) : Promise.resolve(null)
  ]);
  const contract = mergeContracts(proxyContract, implementationContract);
  const holders = [...holderData?.items ?? []].sort((a, b) => Number(b.value || 0) - Number(a.value || 0));
  const pairLower = market.pairAddress.toLowerCase();
  const creatorAddress = transaction?.from?.hash ?? null;
  const creator = creatorAddress?.toLowerCase() ?? null;
  const poolHolding = holders.find((holder) => holder.address?.hash?.toLowerCase() === pairLower);
  const burnedTokenRaw = holders.filter((holder) => BURN_ADDRESSES.has(holder.address?.hash?.toLowerCase() ?? "")).reduce((sum, holder) => sum + Number(holder.value || 0), 0);
  const nonPoolHolders = holders.filter((holder) => {
    const hash = holder.address?.hash?.toLowerCase();
    return Boolean(hash && hash !== pairLower && !BURN_ADDRESSES.has(hash));
  });
  const holderTotal = (count) => nonPoolHolders.slice(0, count).reduce((sum, holder) => sum + Number(holder.value || 0), 0);
  const top1Raw = holderTotal(1);
  const top5Raw = holderTotal(5);
  const top10Raw = nonPoolHolders.slice(0, 10).reduce((sum, holder) => sum + Number(holder.value || 0), 0);
  const creatorHolding = creator ? holders.find((holder) => holder.address?.hash?.toLowerCase() === creator) : void 0;
  const holderPositions = nonPoolHolders.slice(0, 8).flatMap((holder) => {
    const hash = holder.address?.hash;
    if (!hash) return [];
    return [{
      address: hash,
      balance: decimalValue(holder.value, market.token.decimals),
      isContract: Boolean(holder.address?.is_contract),
      isCreator: hash.toLowerCase() === creator,
      name: holder.address?.name ?? null,
      share: holderShare(holder.value, market.token.total_supply)
    }];
  });
  const lpHolders = lpHolderData?.items ?? [];
  const burnedRaw = lpHolders.filter((holder) => BURN_ADDRESSES.has(holder.address?.hash?.toLowerCase() ?? "")).reduce((sum, holder) => sum + Number(holder.value || 0), 0);
  const nonBurnedLp = lpHolders.filter((holder) => !BURN_ADDRESSES.has(holder.address?.hash?.toLowerCase() ?? ""));
  const topLp = nonBurnedLp[0];
  const transactionSenders = Object.fromEntries(resolvedTransactions.filter((entry) => entry.transaction?.from?.hash).map((entry) => [entry.hash.toLowerCase(), entry.transaction.from.hash]));
  const walletSignals = classifyWalletSignals(market, transferHistory.items, holders, creatorAddress);
  const holderNetwork = analyzeHolderConnections(market, transferHistory.items, holderPositions);
  return {
    burnedTokenShare: holderShare(burnedTokenRaw, market.token.total_supply),
    capabilities: detectCapabilities(address, contract),
    contractVisible: contractFunctions(contract).length > 0,
    creatorShare: holderShare(creatorHolding?.value, market.token.total_supply),
    holderClusters: holderNetwork.clusters,
    holderConnections: holderNetwork.connections,
    holderPositions,
    lpBurnedShare: holderShare(burnedRaw, pairToken?.total_supply ?? null),
    lpTopHolderIsContract: Boolean(topLp?.address?.is_contract),
    lpTopHolderShare: holderShare(topLp?.value, pairToken?.total_supply ?? null),
    poolShare: holderShare(poolHolding?.value, market.token.total_supply),
    top1Share: holderShare(top1Raw, market.token.total_supply),
    top5Share: holderShare(top5Raw, market.token.total_supply),
    top10Share: holderShare(top10Raw, market.token.total_supply),
    transferHistoryTruncated: transferHistory.truncated,
    transactionSenders,
    walletSignals
  };
}
function buildWarnings(market, detail) {
  const warnings = [];
  if (market.historyTruncated) warnings.push({ title: "24-hour activity is partial", detail: "The ArcScan page limit was reached, so older events in this window are not included in totals.", tone: "info" });
  if (market.reserveSource === "balance") warnings.push({ title: "Pool reserve event unavailable", detail: "Price and liquidity are using the pair's token balances because no indexed Sync event was available.", tone: "info" });
  if (market.sellCount > 0) warnings.push({ title: "A sell completed", detail: `A token-to-USDC sell was indexed ${relativeTime(market.lastSellAt)} ago. Future sells can still fail.`, tone: "good" });
  else warnings.push({ title: "No sell has been seen", detail: market.buyCount > 0 ? "Buys exist, but the indexed history does not show a token-to-USDC sell." : "The indexed history does not contain a successful sell.", tone: "warning" });
  if (market.totalLiquidity < 20) warnings.push({ title: "Extremely low liquidity", detail: `The pool contains about ${formatValue(market.totalLiquidity)} USDC total liquidity. Even small sells can move the price sharply.`, tone: "warning" });
  else if (market.totalLiquidity < 200) warnings.push({ title: "Low liquidity", detail: `The pool contains about ${formatValue(market.totalLiquidity)} USDC total liquidity.`, tone: "warning" });
  if (detail.top10Share !== null && detail.top10Share >= 50) warnings.push({ title: "A few wallets own most tokens", detail: `The top 10 non-pool holders own ${detail.top10Share.toFixed(1)}% of total supply.`, tone: "warning" });
  else if (detail.top10Share !== null && detail.top10Share >= 25) warnings.push({ title: "Holdings are concentrated", detail: `The top 10 non-pool holders own ${detail.top10Share.toFixed(1)}% of total supply.`, tone: "info" });
  if (detail.creatorShare !== null && detail.creatorShare >= 10) warnings.push({ title: "Pool creator still holds a large bag", detail: `The PairCreated transaction sender holds ${detail.creatorShare.toFixed(1)}% of total supply.`, tone: "warning" });
  if (detail.lpBurnedShare !== null && detail.lpBurnedShare >= 90) warnings.push({ title: "Liquidity tokens are mostly burned", detail: `${detail.lpBurnedShare.toFixed(1)}% of LP supply is held by burn addresses.`, tone: "good" });
  else if (detail.lpTopHolderShare !== null) warnings.push({ title: "Liquidity lock is not confirmed", detail: `One ${detail.lpTopHolderIsContract ? "contract" : "wallet"} holds ${detail.lpTopHolderShare.toFixed(1)}% of LP tokens. Removal may still be possible.`, tone: "warning" });
  else warnings.push({ title: "Liquidity lock is unknown", detail: "The current index cannot prove that liquidity is locked or burned.", tone: "info" });
  const capabilityWarnings = {
    mint: { title: "More tokens can be created", detail: "The token rules allow new supply to be created after launch.", tone: "warning" },
    restrict: { title: "Wallets can be blocked or frozen", detail: "Selected holders may be stopped from moving or selling tokens.", tone: "warning" },
    pause: { title: "Transfers can be paused", detail: "A privileged wallet may be able to stop token transfers.", tone: "warning" },
    upgrade: { title: "Token rules can change", detail: "The token's behavior can be changed after launch.", tone: "warning" },
    fee: { title: "Trading fees can change", detail: "A privileged wallet may be able to modify fee or tax settings.", tone: "warning" }
  };
  detail.capabilities.forEach((capability) => warnings.push(capabilityWarnings[capability]));
  if (!detail.contractVisible) warnings.push({ title: "Some token rules are unknown", detail: "Public data was not enough to check every hidden trading rule.", tone: "info" });
  else if (detail.capabilities.length === 0) warnings.push({ title: "No obvious supply or trading controls found", detail: "Public token rules did not reveal mint, pause, blocklist, upgrade, or adjustable fee controls.", tone: "good" });
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
  byId("detailTradeCount").textContent = trades.length > 0 ? `${trades.length} visible` : "No trades";
  if (trades.length === 0) {
    list.append(element("div", "trade-empty", "No swaps are available in the indexed history."));
    return;
  }
  for (const trade of trades) {
    const row = element("div", `trade-row ${trade.direction}`);
    const side = element("span", "trade-side", trade.direction === "buy" ? "BUY" : "SELL");
    const value = element("span", "trade-value");
    value.append(element("strong", "", `${formatValue(trade.usdcValue, 4)} USDC`), element("small", "", `${relativeTime(trade.timestamp)} ago`));
    const links = element("span", "trade-links");
    const sender = detail.transactionSenders[trade.transactionHash.toLowerCase()] ?? trade.fallbackAddress;
    if (sender) {
      const senderLink = element("a", "", shortHash(sender, 5, 4));
      senderLink.href = `${EXPLORER_BASE}/address/${sender}`;
      senderLink.target = "_blank";
      senderLink.rel = "noreferrer";
      senderLink.title = `Transaction sender: ${sender}`;
      senderLink.setAttribute("aria-label", `Transaction sender ${sender}`);
      links.append(element("span", "trade-sender-label", "Sender"), senderLink);
    } else {
      links.append(element("span", "", "Sender unknown"));
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
  byId("walletSignalCount").textContent = `${signals.length} signal${signals.length === 1 ? "" : "s"}`;
  byId("walletCreatorMoves").textContent = String(count("creator"));
  byId("walletWhaleMoves").textContent = String(count("whale"));
  byId("walletEntries").textContent = String(count("entry"));
  byId("walletExits").textContent = String(count("exit"));
  byId("walletSignalNote").textContent = detail.transferHistoryTruncated ? "Latest indexed transfer pages only; older wallet movements are not included. Launch distribution and mint events are excluded." : "Based on the latest indexed transfers. Launch distribution and mint events are excluded.";
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
    const label = filter === "all" ? "priority wallet movement" : `${filter} movement`;
    list.append(element("div", "wallet-signal-empty", `No ${label} appears in the latest indexed transfers.`));
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
  const cutoff = Date.now() - DAY_MS;
  const recent = events.filter((event) => new Date(event.timestamp).getTime() >= cutoff);
  const added = recent.filter((event) => event.direction === "add").reduce((sum, event) => sum + event.usdcAmount, 0);
  const removed = recent.filter((event) => event.direction === "remove").reduce((sum, event) => sum + event.usdcAmount, 0);
  byId("liquidityEventCount").textContent = `${events.length} event${events.length === 1 ? "" : "s"}`;
  byId("liquidityCurrent").textContent = formatValue(market.usdcReserve, 3);
  byId("liquidityAdded").textContent = formatValue(added, 3);
  byId("liquidityRemoved").textContent = formatValue(removed, 3);
  byId("liquidityBurned").textContent = shareText(detail.lpBurnedShare);
  if (detail.lpBurnedShare !== null && detail.lpBurnedShare >= 90) {
    byId("liquidityLpStatus").textContent = `${shareText(detail.lpBurnedShare)} of LP supply is held by burn addresses.`;
  } else if (detail.lpTopHolderShare !== null) {
    byId("liquidityLpStatus").textContent = `Top ${detail.lpTopHolderIsContract ? "contract" : "wallet"} controls ${shareText(detail.lpTopHolderShare)} of LP supply; a lock is not confirmed.`;
  } else {
    byId("liquidityLpStatus").textContent = "LP ownership is unavailable from the current index.";
  }
  const list = byId("liquidityEventList");
  list.replaceChildren();
  if (events.length === 0) {
    list.append(element("div", "liquidity-empty", "No Mint or Burn event appears in the visible pair history."));
    return;
  }
  for (const event of events.slice(0, 8)) {
    const row = element("div", `liquidity-event-row ${event.direction}`);
    const head = element("div", "liquidity-event-head");
    const time = element("time", "", `${relativeTime(event.timestamp)} ago`);
    time.dateTime = event.timestamp;
    head.append(element("strong", "", event.direction === "add" ? "Liquidity added" : "Liquidity removed"), time);
    const values = element("div", "liquidity-event-values");
    values.append(
      element("strong", "", `${formatValue(event.usdcAmount, 4)} USDC`),
      element("span", "", `${formatValue(event.tokenAmount, 3)} ${market.token.symbol || "tokens"}`),
      element("span", "", event.changePercent === null ? "Initial / unknown base" : `${event.changePercent.toFixed(1)}% of prior USDC reserve`)
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
  byId("holderCountSummary").textContent = `${fullNumber(market.token.holders_count)} indexed`;
  byId("holderTop1").textContent = shareText(detail.top1Share);
  byId("holderTop5").textContent = shareText(detail.top5Share);
  byId("holderTop10").textContent = shareText(detail.top10Share);
  byId("holderCreator").textContent = shareText(detail.creatorShare);
  byId("holderSupplyNote").textContent = `Pool ${shareText(detail.poolShare)} \xB7 Burned ${shareText(detail.burnedTokenShare)} \xB7 rankings exclude both.`;
  const list = byId("holderList");
  list.replaceChildren();
  if (detail.holderPositions.length === 0) {
    list.append(element("div", "holder-empty", "Holder positions are unavailable from the current index."));
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
    if (position.isCreator) addressLine.append(element("span", "holder-tag creator", "Pool creator"));
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
  byId("holderClusterSummary").textContent = connections.length === 0 ? "No links" : `${connections.length} link${connections.length === 1 ? "" : "s"}`;
  byId("clusterConnections").textContent = String(connections.length);
  byId("clusterWallets").textContent = String(connectedWallets.size);
  byId("clusterCount").textContent = String(clusters.length);
  byId("clusterLargest").textContent = clusters[0] ? shareText(clusters[0].share) : "--";
  const positionByAddress = new Map(detail.holderPositions.map((position) => [position.address.toLowerCase(), position]));
  const map = byId("holderClusterMap");
  map.replaceChildren();
  if (clusters.length === 0) {
    map.append(element("div", "cluster-empty", "No connection between current top holders appears in the visible post-launch history."));
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
    const copy = element("div", "connection-copy");
    copy.append(
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
    row.append(copy, links);
    list.append(row);
  }
}
function updateWatchToggle(market) {
  const watched = watchlist.has(market.tokenAddress.toLowerCase());
  const button = byId("watchToggle");
  button.classList.toggle("active", watched);
  button.setAttribute("aria-pressed", String(watched));
  button.setAttribute("aria-label", watched ? "Remove token from watchlist" : "Add token to watchlist");
  button.title = watched ? "Remove from watchlist" : "Add to watchlist";
  byId("watchIcon").textContent = watched ? "\u2605" : "\u2606";
}
function renderObservedAlerts(market) {
  const watched = watchlist.has(market.tokenAddress.toLowerCase());
  const section = byId("observedAlertSection");
  section.classList.toggle("hidden", !watched);
  if (!watched) return;
  const tracking = readTracking(market.tokenAddress) ?? startTracking(market);
  const alerts = tracking.alerts ?? [];
  byId("observedAlertCount").textContent = `${alerts.length} event${alerts.length === 1 ? "" : "s"}`;
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
  byId("observedAlertNote").textContent = `Baseline ${baseline} \xB7 stored in this browser.`;
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
    byId("exitEstimate").textContent = "Unavailable";
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
  byId("exitEstimate").textContent = `1% -> ${formatValue(onePercent.output, 3)} USDC \xB7 ${onePercent.impact.toFixed(1)}% impact`;
}
function renderDetail(market, detail) {
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
  byId("detailFdv").textContent = `${formatValue(market.fdv)} USDC`;
  byId("detailLiquidity").textContent = `${formatValue(market.totalLiquidity)} USDC`;
  byId("detailLiquidityNote").textContent = `${formatValue(market.usdcReserve)} USDC exit side \xB7 ${market.reserveSource === "sync" ? "Sync reserves" : "balance fallback"}`;
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
  byId("detailLastTrade").textContent = market.lastTradeAt ? `${relativeTime(market.lastTradeAt)} ago` : "None";
  const totalFlow = Math.max(1, recent.buyCount + recent.sellCount);
  byId("detailBuyBar").style.width = `${recent.buyCount / totalFlow * 100}%`;
  byId("detailSellBar").style.width = `${recent.sellCount / totalFlow * 100}%`;
  renderTradeTape(market, detail);
  renderWalletSignals(market, detail);
  renderLiquidityMonitor(market, detail);
  renderHolders(market, detail);
  renderHolderConnections(detail);
  const warnings = buildWarnings(market, detail);
  const warningTotal = warnings.filter((warning) => warning.tone === "warning").length;
  byId("warningCount").textContent = `${warningTotal} flag${warningTotal === 1 ? "" : "s"}`;
  const badge = byId("riskBadge");
  badge.className = "risk-badge";
  if (warningTotal >= 4) {
    badge.classList.add("danger");
    badge.textContent = `${warningTotal} red flags`;
  } else if (warningTotal > 0) {
    badge.classList.add("caution");
    badge.textContent = `${warningTotal} flag${warningTotal === 1 ? "" : "s"}`;
  } else {
    badge.classList.add("clear");
    badge.textContent = "No major flag";
  }
  const list = byId("marketWarnings");
  list.replaceChildren();
  for (const warning of warnings) {
    const row = element("div", `warning-item ${warning.tone}`);
    const copy = element("div", "warning-copy");
    copy.append(element("strong", "", warning.title), element("span", "", warning.detail));
    row.append(element("span", "warning-dot"), copy);
    list.append(row);
  }
  renderExitCurve(market);
  setDetailState("content");
}
async function loadDetail(market, force = false) {
  const requestId = ++detailRequest;
  const key = market.tokenAddress.toLowerCase();
  if (force) detailCache.delete(key);
  const cached = detailCache.get(key);
  if (!force && cached && Date.now() - cached.savedAt < DETAIL_CACHE_TTL_MS) {
    if (requestId === detailRequest && selectedPair === market.pairAddress.toLowerCase()) renderDetail(market, cached.data);
    return;
  }
  setDetailState("loading");
  try {
    const detail = await fetchMarketDetail(market, force);
    detailCache.set(key, { data: detail, savedAt: Date.now() });
    if (requestId !== detailRequest || selectedPair !== market.pairAddress.toLowerCase()) return;
    if (!market.stale) observeDetailChanges(market, detail);
    renderDetail(market, detail);
  } catch {
    if (requestId !== detailRequest) return;
    renderDetail(market, { burnedTokenShare: null, capabilities: [], contractVisible: false, creatorShare: null, holderClusters: [], holderConnections: [], holderPositions: [], lpBurnedShare: null, lpTopHolderIsContract: false, lpTopHolderShare: null, poolShare: null, top1Share: null, top5Share: null, top10Share: null, transferHistoryTruncated: false, transactionSenders: {}, walletSignals: [] });
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
  notice.textContent = message ?? "";
  notice.classList.toggle("hidden", !message);
}
async function loadMarkets(force) {
  const factoryLogs = await fetchData(`/addresses/${MARKET_FACTORY}/logs`, 6e4, force);
  const seeds = pairSeeds(factoryLogs.data).slice(0, MARKET_LIMIT);
  const loaded = await mapLimited(seeds, 3, (seed) => loadMarketPair(seed, force));
  markets = loaded.filter((market) => market !== null);
  const shown = visibleMarkets();
  if (!markets.some((market) => market.pairAddress.toLowerCase() === selectedPair)) selectedPair = markets[0]?.pairAddress.toLowerCase() ?? "";
  if (!shown.some((market) => market.pairAddress.toLowerCase() === selectedPair) && shown[0]) selectedPair = shown[0].pairAddress.toLowerCase();
  renderMarketRows();
  const selected = markets.find((market) => market.pairAddress.toLowerCase() === selectedPair);
  if (selected) void loadDetail(selected, force);
  else setDetailState("empty");
  return factoryLogs.stale || markets.some((market) => market.stale);
}
async function loadDashboard(force = false) {
  if (loading) return;
  loading = true;
  const refresh = byId("refreshButton");
  refresh.disabled = true;
  refresh.textContent = "Refreshing";
  setNotice();
  try {
    const stale = await loadMarkets(force);
    if (stale) setNotice("Live indexing is temporarily unavailable. Showing the latest cached market snapshot.");
    byId("lastUpdated").textContent = `${stale ? "Cached" : "Updated"} ${new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(/* @__PURE__ */ new Date())}`;
  } catch (error) {
    setNotice(error instanceof Error ? `Market data unavailable: ${error.message}` : "Market data unavailable.");
    byId("lastUpdated").textContent = "Connection unavailable";
    setDetailState("empty");
  } finally {
    lastRefreshAt = Date.now();
    loading = false;
    refresh.disabled = false;
    refresh.textContent = "Refresh";
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
      const detail = detailCache.get(key);
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
  const detail = market ? detailCache.get(market.tokenAddress.toLowerCase()) : void 0;
  if (market && detail) renderWalletSignals(market, detail.data);
}
function runSearch(query) {
  activeQuery = query.trim().toLowerCase();
  const shown = visibleMarkets();
  renderMarketRows();
  if (shown.length === 0) {
    setNotice("No indexed Arc USDC market matches that token or address.");
    return;
  }
  setNotice();
  selectedPair = shown[0].pairAddress.toLowerCase();
  renderMarketRows();
  void loadDetail(shown[0]);
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
byId("watchToggle").addEventListener("click", toggleSelectedWatch);
void loadDashboard();
window.setInterval(() => {
  if (!document.hidden) void loadDashboard();
}, AUTO_REFRESH_MS);
document.addEventListener("visibilitychange", () => {
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
*/
