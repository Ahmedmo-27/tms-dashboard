import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {User} from "../../../components/ui/member-requests/columns"


interface AuthState {
    user: User | null;
}

const initialState: AuthState = {
    user: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<any>) => {
            // Never keep JWTs in Redux (they would be persisted / XSS-readable).
            if (action.payload && typeof action.payload === "object" && "token" in action.payload) {
                const { token: _token, ...safeUser } = action.payload;
                state.user = safeUser;
            } else {
                state.user = action.payload;
            }
        },
        logout: (state) => {
            state.user = null;
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
