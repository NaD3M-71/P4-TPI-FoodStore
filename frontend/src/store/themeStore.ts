import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  darkMode: boolean
  toggleTheme: () => void
}

// Tailwind activa el modo oscuro con la clase "dark" en <html> (ver index.css)
const aplicarTema = (darkMode: boolean) => {
  document.documentElement.classList.toggle('dark', darkMode)
}

// Tema de la interfaz. Se persiste en localStorage: es una preferencia, no la sesion.
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      darkMode: false,

      toggleTheme: () => {
        const darkMode = !get().darkMode
        aplicarTema(darkMode)
        set({ darkMode })
      },
    }),
    {
      name: 'theme-storage',
      // Al recargar, se vuelve a aplicar la preferencia guardada
      onRehydrateStorage: () => (state) => {
        if (state) aplicarTema(state.darkMode)
      },
    },
  ),
)
