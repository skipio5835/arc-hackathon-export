// Browser-client type subset from jayson 4.3.0 (MIT); no server transports.
export type RequestParamsLike = Array<any> | object | undefined;
export type JSONRPCIDLike = number | string;
export type JSONRPCResultLike = any;

export interface JSONRPCError {
  code: number;
  message: string;
  data?: object;
}

export type JSONRPCErrorLike = Error | JSONRPCError;

export interface JSONRPCVersionOneRequest {
  method: string;
  params: Array<any>;
  id: JSONRPCIDLike;
}

export interface JSONRPCVersionTwoRequest {
  jsonrpc: string;
  method: string;
  params: RequestParamsLike;
  id?: JSONRPCIDLike | null;
}

export type JSONRPCRequest = JSONRPCVersionOneRequest | JSONRPCVersionTwoRequest;
export type JSONRPCRequestLike = JSONRPCRequest | string;

export interface JSONRPCCallbackTypePlain {
  (err?: JSONRPCErrorLike | null, result?: JSONRPCResultLike): void;
}

export interface JSONRPCCallbackTypeSugared {
  (err?: Error | null, error?: JSONRPCErrorLike, result?: JSONRPCResultLike): void;
}

export type JSONRPCCallbackType = JSONRPCCallbackTypePlain | JSONRPCCallbackTypeSugared;

export interface JSONRPCCallbackTypeBatchPlain {
  (err: JSONRPCErrorLike, results?: Array<JSONRPCResultLike>): void;
}

export interface JSONRPCCallbackTypeBatchSugared {
  (err: Error, errors?: Array<JSONRPCErrorLike>, results?: Array<JSONRPCResultLike>): void;
}

export type JSONRPCCallbackTypeBatch = JSONRPCCallbackTypeBatchPlain | JSONRPCCallbackTypeBatchSugared;

export interface ClientOptions {
  version?: number;
  reviver?: (key: string, value: any) => any;
  replacer?: (key: string, value: any) => any;
  generator?: () => JSONRPCIDLike;
  notificationIdNull?: boolean;
}
