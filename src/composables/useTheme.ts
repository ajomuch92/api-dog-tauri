import { computed, ref, watchEffect } from 'vue';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'apidog-client.theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* localStorage no disponible */
  }
  return 'system';
}

const preference = ref<ThemePreference>(readPreference());
const systemDark = ref(media.matches);
media.addEventListener('change', (e) => (systemDark.value = e.matches));

const isDark = computed(() =>
  preference.value === 'system' ? systemDark.value : preference.value === 'dark',
);

let installed = false;

/** Aplica `data-theme` y la clase `uk-light` (modo invertido de UIkit) al <html>. */
function install() {
  if (installed) return;
  installed = true;
  watchEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = isDark.value ? 'dark' : 'light';
    root.classList.toggle('uk-light', isDark.value);
    root.style.colorScheme = isDark.value ? 'dark' : 'light';
  });
}

export function useTheme() {
  install();

  function setPreference(value: ThemePreference) {
    preference.value = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignorar */
    }
  }

  /** Alterna entre claro y oscuro (abandona el modo "sistema"). */
  function toggle() {
    setPreference(isDark.value ? 'light' : 'dark');
  }

  return { preference, isDark, setPreference, toggle };
}
