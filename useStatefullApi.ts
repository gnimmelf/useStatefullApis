import { useAppContext } from './useAppContext';
import { useNotifications } from './useNotifications';

import {
  ApiCall,
  AppState,
  ApiState,
  ResponseParser,
  FETCH_STATES,
  WrappedApiCall,
  ApiResult,
  ApiErrorResult,
} from './lib/lib.xhr.d';

import { createApiStateProxy } from '../lib/createApiStateProxy';
import { createApiCallWrapper } from '../lib/createApiCallWrapper';

import { createDebugger } from '../helpers/createDebugger';

const debug = createDebugger(__filename);

const API_STATES_KEY = 'apiStates';

const useStatefullApi = (
  apis: Record<string, ApiCall>,
  {
    initialResultData,
    responseParser,
  }: {
    initialResultData?: unknown;
    responseParser?: undefined | ResponseParser;
  }
) => {
  const { addSystemError } = useNotifications();

  const [contextAppState, setAppState] = useAppContext();

  const getSaturatedApiState = (
    appState: AppState,
    apiName: string
  ): ApiState => {
    debug('getApiState', { appState });

    const apiStates = (appState[API_STATES_KEY] || {}) as Record<
      string,
      unknown
    >;

    const apiState = (
      apiStates[apiName]
        ? apiStates[apiName]
        : {
            apiName,
            result: { data: initialResultData },
            fetchState: FETCH_STATES.IDLE,
          }
    ) as ApiState;

    return apiState;
  };

  const getNewAppState = (appState: AppState, apiName, apiState) => {
    return {
      ...appState,
      [API_STATES_KEY]: {
        ...(appState[API_STATES_KEY] as ApiState[]),
        [apiName]: apiState,
      },
    };
  };

  const updateApiState = (
    apiName: string,
    fetchState: FETCH_STATES,
    result?: ApiResult
  ) => {
    setAppState((prevAppState: AppState) => {
      const apiState = getSaturatedApiState(prevAppState, apiName);
      const newApiState = {
        ...apiState,
        result: result || apiState.result,
        fetchState,
      };
      return getNewAppState(prevAppState, apiName, newApiState);
    });
  };

  const getApiStateProxy = (
    apiName: string,
    apiCall: ApiCall,
    appState: AppState
  ) => {
    const apiState = getSaturatedApiState(appState, apiName);
    debug('getApiStateProxy', { appState, apiName, apiState });

    const wrappedApiCall: WrappedApiCall = createApiCallWrapper({
      apiName,
      apiCall,
      responseParser,
      onPending: () => updateApiState(apiName, FETCH_STATES.PENDING),
      onComplete: (result): void => {
        updateApiState(apiName, FETCH_STATES.DONE, result);
        if (result.meta.isRuntimeException) {
          addSystemError(
            `[Beskrivelse for "${(result as ApiErrorResult).type}"]`
          );
        }
      },
    });

    return createApiStateProxy(apiState, wrappedApiCall);
  };

  // Wrap every `ApiState` in an `ApiReqStateProxy`
  const apiStateProxies = Object.entries(apis).reduce(
    (acc, [apiName, apiCall]) => {
      acc[apiName] = getApiStateProxy(apiName, apiCall, contextAppState);
      return acc;
    },
    {}
  );
  debug('useStatefullApi', { apiStateProxies });

  return apiStateProxies;
};

export { useStatefullApi };
