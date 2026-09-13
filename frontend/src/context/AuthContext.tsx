import { createContext , useContext , useEffect , useState , useCallback } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";
import * as authApi from "../api/auth"; 
import type { LoginResult } from "../api/auth"; 

interface AuthContextValue { 
    user : User | null; 
    loading: boolean; 
    login: (email: string , password: string) => Promise<LoginResult>; 
    verifyTwoFactor: (pendingToken: string , code: string) => Promise<User>; 
    signup: (name: string , email:string , password : string) => Promise<User>; 
    logout: ()=> Promise<void>; 
}


const AuthContext = createContext<AuthContextValue | undefined>(undefined); 

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Starts true: on first load we don't yet know if there's a valid
  // session cookie or not. Pages should wait for loading to become
  // false before deciding "show login page" vs "show dashboard".
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    authApi
      .me()
      .then((fetchedUser) => {
        if (!cancelled) setUser(fetchedUser);
      })
      .catch(() => {
        // No valid session — this is a normal, expected outcome for a
        // logged-out visitor, not an error worth surfacing to them.
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Prevents a late-arriving response from setting state after this
    // component has already unmounted (e.g. user navigated away fast).
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    if ("user" in result) {
      setUser(result.user);
    }
    // If 2FA is required, we deliberately do NOT set user yet — the
    // caller (LoginPage) is responsible for showing the code screen
    // and calling verifyTwoFactor next.
    return result;
  }, []);

  const verifyTwoFactor = useCallback(async (pendingToken: string, code: string) => {
    const loggedInUser = await authApi.verifyLoginTwoFactor(pendingToken, code);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const newUser = await authApi.signup(name, email, password);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyTwoFactor, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}