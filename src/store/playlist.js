import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "/api/playlist";
const ADMIN_API_URL = "/api/playlist/admin";
const STUDENT_API_URL = "/api/playlist/student";


export const fetchPlaylists = createAsyncThunk(
  "playlist/fetchPlaylists",
  async (instructorId, thunkAPI) => {
    try {
      if (!instructorId) {
        throw new Error("Instructor ID is required");
      }
      const res = await axios.get(`${API_URL}?instructorId=${instructorId}`);
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch playlists"
      );
    }
  }
);


export const createPlaylist = createAsyncThunk(
  "playlist/createPlaylist",
  async (playlistData, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append("title", playlistData.title);
      formData.append("description", playlistData.description || "");
      formData.append("price", playlistData.price || 0);
      formData.append("instructorId", playlistData.instructorId);
      
      playlistData.content.forEach((item, index) => {
        formData.append(`content_${index}_type`, item.type);
        if (item.type === "quiz") {
          formData.append(`content_${index}_quizData`, JSON.stringify(item.quizData));
        } else {
          // Send file if available, otherwise send URL (for draft files)
          if (item.file) {
            formData.append(`content_${index}_file`, item.file);
          }
          if (item.url) {
            formData.append(`content_${index}_url`, item.url);
          }
          if (item.type === "lab" || item.type === "activity") {
            formData.append(`content_${index}_totalMarks`, item.totalMarks || "");
          }
        }
      });

      const res = await axios.post(`${API_URL}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to create playlist"
      );
    }
  }
);


export const deletePlaylist = createAsyncThunk(
  "playlist/deletePlaylist",
  async ({ playlistId, instructorId }, thunkAPI) => {
    try {
      const res = await axios.delete(`/api/instructor/playlists?playlistId=${playlistId}&instructorId=${instructorId}`);
      return { playlistId, ...res.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to delete playlist"
      );
    }
  }
);


export const updatePlaylist = createAsyncThunk(
  "playlist/updatePlaylist",
  async (playlistData, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append("playlistId", playlistData.playlistId);
      formData.append("instructorId", playlistData.instructorId);
      formData.append("title", playlistData.title);
      formData.append("description", playlistData.description || "");
      formData.append("price", playlistData.price || 0);
      
      playlistData.content.forEach((item, index) => {
        formData.append(`content_${index}_type`, item.type);
        if (item.type === "quiz") {
          formData.append(`content_${index}_quizData`, JSON.stringify(item.quizData));
        } else {
          formData.append(`content_${index}_file`, item.file);
          if (item.type === "lab" || item.type === "activity") {
            formData.append(`content_${index}_totalMarks`, item.totalMarks || "");
          }
        }
      });

      const res = await axios.put(`${API_URL}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to update playlist"
      );
    }
  }
);

// Admin: Fetch all playlists
export const fetchAllPlaylists = createAsyncThunk(
  "playlist/fetchAllPlaylists",
  async ({ adminId, status = "all" }, thunkAPI) => {
    try {
      if (!adminId) {
        throw new Error("Admin ID is required");
      }
      const res = await axios.get(`${ADMIN_API_URL}?adminId=${adminId}&status=${status}`);
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch playlists"
      );
    }
  }
);

// Admin: Approve or reject playlist
export const reviewPlaylist = createAsyncThunk(
  "playlist/reviewPlaylist",
  async ({ playlistId, adminId, action, rejectionReason }, thunkAPI) => {
    try {
      const res = await axios.patch(ADMIN_API_URL, {
        playlistId,
        adminId,
        action,
        rejectionReason,
      });
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to review playlist"
      );
    }
  }
);

// Student: Fetch approved playlists
export const fetchStudentPlaylists = createAsyncThunk(
  "playlist/fetchStudentPlaylists",
  async (studentId, thunkAPI) => {
    try {
      if (!studentId) {
        throw new Error("Student ID is required");
      }
      console.log(`[Redux] Fetching student playlists for: ${studentId}`);
      const startTime = Date.now();
      const res = await axios.get(`${STUDENT_API_URL}?studentId=${studentId}`, {
        timeout: 30000 // 30 second timeout - increased to handle complex queries
      });
      console.log(`[Redux] Playlists fetched in ${Date.now() - startTime}ms:`, res.data);
      return res.data;
    } catch (error) {
      console.error("[Redux] Error fetching playlists:", error);
      // Handle timeout errors specifically
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return thunkAPI.rejectWithValue(
          "Request timed out. The server is taking too long to respond. Please try again."
        );
      }
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch playlists"
      );
    }
  }
);

const initialState = {
  playlists: [],
  allPlaylists: [], 
  studentPlaylists: [], 
  loading: false,
  error: null,
  success: false,
};

const playlistSlice = createSlice({
  name: "playlist",
  initialState,
  reducers: {
    resetPlaylist(state) {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlaylists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlaylists.fulfilled, (state, action) => {
        state.loading = false;
        state.playlists = action.payload.playlists || [];
      })
      .addCase(fetchPlaylists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create playlist
      .addCase(createPlaylist.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createPlaylist.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.playlists.push(action.payload.playlist);
      })
      .addCase(createPlaylist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Delete playlist
      .addCase(deletePlaylist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePlaylist.fulfilled, (state, action) => {
        state.loading = false;
        state.playlists = state.playlists.filter(
          (playlist) => playlist._id !== action.payload.playlistId
        );
      })
      .addCase(deletePlaylist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
   
      .addCase(updatePlaylist.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updatePlaylist.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Add the new pending version to the list
        if (action.payload.playlist) {
          state.playlists.push(action.payload.playlist);
        }
      })
      .addCase(updatePlaylist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Admin: Fetch all playlists
      .addCase(fetchAllPlaylists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPlaylists.fulfilled, (state, action) => {
        state.loading = false;
        state.allPlaylists = action.payload.playlists || [];
      })
      .addCase(fetchAllPlaylists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Admin: Review playlist
      .addCase(reviewPlaylist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reviewPlaylist.fulfilled, (state, action) => {
        state.loading = false;
        // Update in allPlaylists
        const index = state.allPlaylists.findIndex(
          (p) => p._id === action.payload.playlist._id
        );
        if (index !== -1) {
          state.allPlaylists[index] = action.payload.playlist;
        }
        // Also update in instructor playlists if exists
        const instructorIndex = state.playlists.findIndex(
          (p) => p._id === action.payload.playlist._id
        );
        if (instructorIndex !== -1) {
          state.playlists[instructorIndex] = action.payload.playlist;
        }
        // If approved, add to student playlists or update if exists
        if (action.payload.playlist.status === "approved") {
          const studentIndex = state.studentPlaylists.findIndex(
            (p) => p._id === action.payload.playlist._id
          );
          if (studentIndex !== -1) {
            state.studentPlaylists[studentIndex] = action.payload.playlist;
          } else {
            state.studentPlaylists.push(action.payload.playlist);
          }
        } else if (action.payload.playlist.status === "rejected") {
          // Remove from student playlists if rejected
          state.studentPlaylists = state.studentPlaylists.filter(
            (p) => p._id !== action.payload.playlist._id
          );
        }
      })
      .addCase(reviewPlaylist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Student: Fetch approved playlists
      .addCase(fetchStudentPlaylists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentPlaylists.fulfilled, (state, action) => {
        state.loading = false;
        state.studentPlaylists = action.payload.playlists || [];
      })
      .addCase(fetchStudentPlaylists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetPlaylist } = playlistSlice.actions;
export default playlistSlice.reducer;

