import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice"
import { authApi } from "@/features/api/AuthApi";
import { courseApi } from "@/features/api/CourseApi";

const rootReducer = combineReducers({
    [authApi.reducerPath] : authApi.reducer,
    [courseApi.reducerPath] : courseApi.reducer,
    auth:authReducer
});

export default rootReducer;

