export const TOKEN_KEY = "hawkshaw_jwt";

export function saveToken(token: string) {
    sessionStorage.setItem(TOKEN_KEY, token);
}

export const getToken = () => localStorage.getItem('token');
export const setToken = (token: string) => localStorage.setItem('token', token);
export const clearToken = () => localStorage.removeItem('token');
