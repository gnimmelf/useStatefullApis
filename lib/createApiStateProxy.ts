import {
  ApiState,
  ApiStateProxy,
  ApiResult,
  FETCH_STATES,
  WrappedApiCall,
  ApiCompletedResult,
} from '../generic-types.d';

import { createDebugger } from '../helpers/createDebugger';

type ApiStateProxyTarget = ApiState & { fetch: WrappedApiCall };

const debug = createDebugger(__filename);

const apiStateProxyHandler = {
  get(target: ApiStateProxyTarget, propName: string) {
    let value: unknown;
    switch (propName) {
      // Props
      case 'isIdle':
        value = target.fetchState === FETCH_STATES.IDLE;
        break;
      case 'isPending':
        value = target.fetchState === FETCH_STATES.PENDING;
        break;
      case 'isDone':
        value = target.fetchState === FETCH_STATES.DONE;
        break;
      case 'isSuccess':
        value =
          target.fetchState === FETCH_STATES.DONE &&
          (target.result as ApiCompletedResult).meta.success;
        break;
      default:
        value = target[propName as keyof typeof target];
    }
    debug('get', { [propName]: value });
    return value;
  },
  set(target: ApiState, propName: string, value: ApiResult): boolean {
    // Only `result` is settable
    switch (propName) {
      case 'result':
        // eslint-disable-next-line no-param-reassign
        target.result = value;
        break;
      default:
        throw new Error(`Cannot set prop '${propName}' on ApiStateProxy`);
    }
    return true;
  },
};

const createApiStateProxy = (
  apiState: ApiState,
  wrappedApiCall: WrappedApiCall,
) => {
  const proxy = new Proxy(
    {
      ...apiState,
      fetch: wrappedApiCall,
    } as ApiStateProxyTarget,
    apiStateProxyHandler,
  );
  return proxy as unknown as ApiStateProxy;
};

export { createApiStateProxy };
