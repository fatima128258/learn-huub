import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { PURGE } from 'redux-persist';

const API_URL = "/api/auth";

// Signup thunk - handles both student and instructor
export const signupUser = createAsyncThunk(
  "auth/signup",
  async (userData, thunkAPI) => {
    try {
     
      const isFormData = userData instanceof FormData;
      
     
      let role = "student";
      if (isFormData) {
        role = userData.get("role") || "instructor";
      } else {
        role = userData.role || "student";
      }

     
      const endpoint = role === "instructor" 
        ? "/signup/instructor" 
        : "/signup/student";

      const config = isFormData
        ? {} 
        : { headers: { "Content-Type": "application/json" } };

      const res = await axios.post(
        `${API_URL}${endpoint}`,
        userData,
        config
      );
      return res.data;
    } catch (error) {
      // Better error handling
      if (error.code === "ECONNREFUSED" || error.message.includes("Network Error")) {
        return thunkAPI.rejectWithValue(
          "Server connection error. Please check your internet connection and try again."
        );
      }
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Signup failed"
      );
    }
  }
);


// Login thunk
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, thunkAPI) => {
    try {
      const res = await axios.post(`${API_URL}/login`, credentials);
      // Store user in localStorage
      // if (typeof window !== "undefined") {
      //   localStorage.setItem("user", JSON.stringify(res.data.user));
      //   localStorage.setItem("isAuthenticated", "true");
      // }
      return res.data;
    } catch (error) {
     
      if (error.code === "ECONNREFUSED" || error.message.includes("Network Error")) {
        return thunkAPI.rejectWithValue(
          "Server connection error. Please check your internet connection and try again."
        );
      }
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Login failed"
      );
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  success: false,
  error: null,
};



// if (typeof window !== "undefined") {
//   localStorage.removeItem("user");
//   localStorage.removeItem("isAuthenticated");
// }

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuth(state) {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Signup cases
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Handle PURGE action from redux-persist
      .addCase(PURGE, () => {
        return initialState;
      });
  },
});

export const { resetAuth, logout, setUser } = authSlice.actions;
export default authSlice.reducer;























// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const API_URL = "/api/auth";

// // Signup thunk - handles both student and instructor
// export const signupUser = createAsyncThunk(
//   "auth/signup",
//   async (userData, thunkAPI) => {
//     try {
     
//       const isFormData = userData instanceof FormData;
      
     
//       let role = "student";
//       if (isFormData) {
//         role = userData.get("role") || "instructor";
//       } else {
//         role = userData.role || "student";
//       }

     
//       const endpoint = role === "instructor" 
//         ? "/signup/instructor" 
//         : "/signup/student";

//       const config = isFormData
//         ? {} 
//         : { headers: { "Content-Type": "application/json" } };

//       const res = await axios.post(
//         `${API_URL}${endpoint}`,
//         userData,
//         config
//       );
//       return res.data;
//     } catch (error) {
//       // Better error handling
//       if (error.code === "ECONNREFUSED" || error.message.includes("Network Error")) {
//         return thunkAPI.rejectWithValue(
//           "Server connection error. Please check your internet connection and try again."
//         );
//       }
//       return thunkAPI.rejectWithValue(
//         error.response?.data?.message || error.message || "Signup failed"
//       );
//     }
//   }
// );


// // Login thunk
// export const loginUser = createAsyncThunk(
//   "auth/login",
//   async (credentials, thunkAPI) => {
//     try {
//       const res = await axios.post(`${API_URL}/login`, credentials);
//       // Store user in localStorage
//       if (typeof window !== "undefined") {
//         localStorage.setItem("user", JSON.stringify(res.data.user));
//         localStorage.setItem("isAuthenticated", "true");
//       }
//       return res.data;
//     } catch (error) {
     
//       if (error.code === "ECONNREFUSED" || error.message.includes("Network Error")) {
//         return thunkAPI.rejectWithValue(
//           "Server connection error. Please check your internet connection and try again."
//         );
//       }
//       return thunkAPI.rejectWithValue(
//         error.response?.data?.message || error.message || "Login failed"
//       );
//     }
//   }
// );

// const initialState = {
//   user: null,
//   isAuthenticated: false,
//   loading: false,
//   success: false,
//   error: null,
// };


// if (typeof window !== "undefined") {
//   localStorage.removeItem("user");
//   localStorage.removeItem("isAuthenticated");
// }

// const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     resetAuth(state) {
//       state.loading = false;
//       state.success = false;
//       state.error = null;
//     },
//     logout(state) {
//       state.user = null;
//       state.isAuthenticated = false;
//       if (typeof window !== "undefined") {
//         localStorage.removeItem("user");
//         localStorage.removeItem("isAuthenticated");
//       }
//     },
//     setUser(state, action) {
//       state.user = action.payload;
//       state.isAuthenticated = true;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Signup cases
//       .addCase(signupUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(signupUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.success = true;
//         state.user = action.payload.user;
//         state.isAuthenticated = true;
//         if (typeof window !== "undefined") {
//           localStorage.setItem("user", JSON.stringify(action.payload.user));
//           localStorage.setItem("isAuthenticated", "true");
//         }
//       })
//       .addCase(signupUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Login cases
//       .addCase(loginUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(loginUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.success = true;
//         state.user = action.payload.user;
//         state.isAuthenticated = true;
//       })
//       .addCase(loginUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.isAuthenticated = false;
//       });
//   },
// });

// export const { resetAuth, logout, setUser } = authSlice.actions;
// export default authSlice.reducer;
