import { useEffect } from 'react';
import useUiStore from '../store/uiStore';

const ThemeProvider = ({ children }) => {
  const initTheme = useUiStore((state) => state.initTheme);
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    initTheme(); // Sync html document state class with active theme
  }, [initTheme, theme]);

  return <>{children}</>;
};

export default ThemeProvider;
