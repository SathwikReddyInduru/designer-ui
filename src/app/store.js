import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/modules/auth/store/authSlice'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'
import flowReducer from '@/modules/flow-builder/store/flowSlice'

const appReducer = combineReducers({
    auth: authReducer,
    flow: flowReducer
})

const persistConfig = {
    key: 'root',
    storage: storage,
    whitelist: ['auth', 'flow']
}

const rootReducer = (state, action) => {
    if (action.type === 'auth/logout') {
        storage.removeItem('persist:root')
        return appReducer(undefined, action)
    }

    return appReducer(state, action)
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    'persist/PERSIST',
                    'persist/REHYDRATE',
                    'persist/PURGE',
                    'persist/REGISTER',
                    'persist/FLUSH',
                    'persist/PAUSE'
                ]
            }
        })
})

export const persistor = persistStore(store)