/* eslint-disable no-unused-vars */

export type AppState = Record<string, unknown>;

export type ApiSuccessResult = {
  meta: Record<string, unknown>;
  data?: Record<string, unknown>;
};

export type ApiErrorResult = {
  type: string;
  title?: string;
  details?: string;
  errors?: [];
  meta: Record<string, unknown>;
};

export type ApiCompletedResult = ApiSuccessResult | ApiErrorResult;

export type ApiResult = unknown | ApiCompletedResult;

export enum FETCH_STATES {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  DONE = 'DONE',
}

export type ApiState = {
  apiName: string;
  fetchState: FETCH_STATES;
  result: ApiResult;
};

export type ApiStateProxy = {
  call: WrappedApiCall;
  isIdle: boolean;
  isPending: boolean;
  isDone: boolean;
  isSuccess: boolean;
  result: ApiResult;
};

export type ApiCall = (...args: unknown[]) => Promise<Response>;

export type WrappedApiCall = (...args: unknown[]) => Promise<ApiResult>;

export type ResponseParser = (response: Response) => ApiResult;
