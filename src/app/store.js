import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../modules/auth/store/authSlice'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from 'redux'
import flowReducer from '../modules/flow-builder/store/flowSlice'

const rootReducer = combineReducers({
    auth: authReducer,
    flow: flowReducer
})

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth']
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        })
})

export const persistor = persistStore(store)