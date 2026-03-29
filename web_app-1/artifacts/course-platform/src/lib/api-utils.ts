/**
 * Utility functions for handling authentication tokens and API options
 */
export const getAuthToken = () => localStorage.getItem('auth_token');
export const setAuthToken = (token: string) => localStorage.setItem('auth_token', token);
export const removeAuthToken = () => localStorage.removeItem('auth_token');

export const getAuthOptions = () => {
  const token = getAuthToken();
  return {
    request: {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }
  };
};

export const combineOptions = (customOptions: any = {}) => {
  const baseOptions = getAuthOptions();
  return {
    ...baseOptions,
    ...customOptions,
    request: {
      ...baseOptions.request,
      ...customOptions.request,
      headers: {
        ...baseOptions.request.headers,
        ...(customOptions.request?.headers || {})
      }
    }
  };
};
