import { AuthBindings } from "@refinedev/core";
import { API_URL, dataProvider } from "./data";

// Use constants for magic strings
const ACCESS_TOKEN_KEY = "access_token";

export const authCredentials = {
  email: "hornetbot@gmail.com",
  password: "hornetboy",
};

export const authProvider: AuthBindings = {
  login: async ({ email }: { email: string }) => {
    try {
      const { data } = await dataProvider.custom({
        url: API_URL,
        method: "post",
        headers: {},
        meta: {
          variables: { email },
          rawQuery: `
            mutation Login($email: String!) {
              login(loginInput: {
                email: $email
              }) {
                accessToken
              }
            }
          `,
        },
      });

      // Store the access token securely
      localStorage.setItem(ACCESS_TOKEN_KEY, data.login.accessToken);

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error) {
      // Handle login errors
      console.error("Login failed:", error);
      return {
        success: false,
        error: {
          message: "Login failed. Please check your email and password.",
        },
      };
    }
  },

  logout: async () => {
    // Remove the access token on logout
    localStorage.removeItem(ACCESS_TOKEN_KEY);

    return {
      success: true,
      redirectTo: "/login",
    };
  },

  onError: async (error: any) => {
    if (error && error.statusCode === "UNAUTHENTICATED") {
      // Logout user if unauthenticated
      return {
        logout: true,
        redirectTo: "/login",
      };
    }
    return { error };
  },

  check: async () => {
    try {
      // Check if the user is authenticated
      await dataProvider.custom({
        url: API_URL,
        method: "post",
        headers: {},
        meta: {
          rawQuery: `
            query Me {
              me {
                name
              }
            }
          `,
        },
      });

      return {
        authenticated: true,
        redirectTo: "/",
      };
    } catch (error) {
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }
  },

  getIdentity: async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    try {
      const { data } = await dataProvider.custom<{ me: any }>({
        url: API_URL,
        method: "post",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        meta: {
          rawQuery: `
            query Me {
              me {
                id
                name
                email
                phone
                jobTitle
                timezone
                avatarUrl
              }
            }
          `,
        },
      });

      return data.me;
    } catch (error) {
      console.error("Failed to get user identity:", error);
      return undefined;
    }
  },
};
