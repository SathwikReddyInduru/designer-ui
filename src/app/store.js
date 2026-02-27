import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../modules/auth/store/authSlice'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
// import sessionStorage from 'redux-persist/lib/storage/session' // sessionStorage
import { combineReducers } from 'redux'
import flowReducer from '../modules/flow-builder/store/flowSlice'

const appReducer = combineReducers({
    auth: authReducer,
    flow: flowReducer
})

const persistConfig = {
    key: 'root',
    storage: storage,
    whitelist: ['auth']
}

const rootReducer = (state, action) => {
    if (action.type === 'auth/logout') {
        return {
            auth: authReducer(state.auth, action),
            flow: undefined
        }
    }

    return appReducer(state, action)
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
            }
        })
})

export const persistor = persistStore(store)