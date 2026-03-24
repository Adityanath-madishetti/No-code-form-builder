// src/lib.authFetch.ts
import { useAuth } from "@/contexts/AuthContext";

export const useAuthFetch = () => {
  const { getToken } = useAuth();

  return async (url: string, options: RequestInit = {}) => {
    let token = await getToken();

    if (!token) {
      throw new Error("User not logged in");
    }

    const makeRequest = async (token: string) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          ...(options.body ? { "Content-Type": "application/json" } : {}),
        },
      });
    };

    let res = await makeRequest(token);

    if (res.status === 401) {
      token = await getToken(true);
      if (!token) throw new Error("Session expired");

      res = await makeRequest(token);
    }

    return res;
  };
};