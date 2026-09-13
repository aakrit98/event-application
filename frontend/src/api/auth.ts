import apiClient from "./client";
import type {User} from "../types"; 


//logn() can return one of two different shapes depending on wheather 
//the user has 2FA enabled - the component calling this has to check 
//which one it got back (see the "requires2FA" discriminant field).  

export type LoginResult = |{user : User} |{requires2FA: true; pendingToken: string}; 


export async function signup(name: string , email: string, password: string): Promise<User> {
    const res = await apiClient.post<{user: User}>("/auth/signup",{name,email,password}); 
    return res.data.user
} 


export async function login(email: string , password: string): Promise<LoginResult> {
    const res = await apiClient.post<LoginResult>("/auth/login" , {email, password}); 
    return res.data;
}

export async function verifyLoginTwoFactor(pendingToken: string, code: string): Promise<User> { 
    const res = await apiClient.post<{user:User}>("/auth/login/2fa" , {pendingToken,code}); 
    return res.data.user
} 
    

export async function logout():Promise<void> {
    await apiClient.post("/auth/logout"); 
}


export async function me(): Promise<User> {
  const res = await apiClient.get<{ user: User }>("/auth/me");
  return res.data.user;
}

export async function setupTwoFactor(): Promise<{ qrCodeDataUrl: string }> {
  const res = await apiClient.post<{ qrCodeDataUrl: string }>("/auth/2fa/setup");
  return res.data;
}

export async function confirmTwoFactorSetup(code: string): Promise<void> {
  await apiClient.post("/auth/2fa/confirm", { code });
}

export async function disableTwoFactor(): Promise<void> {
  await apiClient.post("/auth/2fa/disable");
}

