import { logError } from '../helpers/logError';

// import {
//   ApiResult,
//   ApiCall,
//   WrappedApiCall,
//   ResponseParser,
//   ApiErrorResult,
//   ApiCompletedResult,
// } from '../lib.xhr';

import { createDebugger } from '../helpers/createDebugger';

const debug = createDebugger(__filename);

type CreateApiCallWrapperArgs = {
  apiName: string;
  apiCall: ApiCall;
  responseParser?: ResponseParser;
  onPending?: () => void;
  // eslint-disable-next-line no-unused-vars
  onComplete?: (result: ApiCompletedResult) => void;
};

const createApiCallWrapper = ({
  apiName,
  apiCall,
  responseParser,
  onPending,
  onComplete,
}: CreateApiCallWrapperArgs): WrappedApiCall => {
  const { location } = window;
  const typeUrlBase = `${location.protocol}://${location.host}/error-type`;

  return async (...args: unknown[]) => {
    debug(`enhancedApiCall:${apiName}`, { apiName, apiCall, responseParser });

    const signal: AbortSignal | undefined = args.find(
      (arg: unknown): arg is AbortSignal => arg instanceof AbortSignal,
    );

    let response: Response | undefined;
    let result: ApiResult = {};

    if (onPending instanceof Function) {
      onPending();
    }

    try {
      response = await apiCall(...args);
      result = await (responseParser
        ? responseParser(response)
        : response.json());
    } catch (err) {
      logError(err as Error);
      const meta: Record<string, unknown> = { meta: { catchBlockError: true } };
      if (signal?.aborted) {
        result = {
          meta,
          type: `${typeUrlBase}/request-aborted`,
          title: 'Request was cancelled',
          details: `Request for (${apiName}) was aborted by signal`,
        };
      } else {
        result = {
          meta,
          type: `${typeUrlBase}/response-parsing-error`,
          title: 'Client side parsing error',
          details: (err as Error).toString(),
        };
      }
    }

    if (!result.meta) {
      result.meta = {};
    }

    if (response) {
      Object.assign(result.meta, {
        url: response.url,
        status: response.status,
        success: !result.meta.catchBlockError && response.status === 200,
      });
    }

    if (
      !result.meta.success &&
      ((result.meta.status as number) >= 500 ||
        (result as ApiErrorResult).type.endsWith('response-parsing-error'))
    ) {
      result.meta.isRuntimeException = true;
      // logError(result);
    }

    debug(`enhancedApiCall:${apiName}`, { result });

    if (onComplete instanceof Function) {
      onComplete(result);
    }

    return result;
  };
};

export { createApiCallWrapper };
