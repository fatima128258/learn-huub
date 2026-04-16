'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store/store';

export default function ReduxProvider({ children }) {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={
          <div className="min-h-screen flex items-center justify-center bg-white">
            <p className="text-gray-600">Loading...</p>
          </div>
        } 
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}

