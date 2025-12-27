export const TOKEN_KEY = "hawkshaw_jwt";

export function saveToken(token: string) {
    sessionStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
}
