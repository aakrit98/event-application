import axios from "axios";

// One shared axios instance for the whole app, instead of every file
// repeating the base URL and cookie settings.
const apiClient = axios.create({
  baseURL: "http://localhost:4000/api",
  // REQUIRED for our httpOnly-cookie auth to work: without this, the
  // browser will not send the login cookie on requests, and the
  // backend's requireAuth middleware will always see no cookie at all.
  withCredentials: true,
});

export default apiClient;