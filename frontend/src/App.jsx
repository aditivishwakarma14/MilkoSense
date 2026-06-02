import React from 'react';
import ThemeProvider from './app/providers/ThemeProvider';
import AppRouter from './app/router/AppRouter';

function App() {
  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  );
}

export default App;
