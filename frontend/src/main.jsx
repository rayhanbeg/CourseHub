import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store/store';
import App from './App';
import { MotionProvider } from './lib/motion';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <MotionProvider><App /></MotionProvider>
    </Provider>
  </React.StrictMode>,
);
