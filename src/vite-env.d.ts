/// <reference types="vite/client" />

declare module 'uikit/dist/js/uikit-icons' {
  const Icons: (uikit: typeof import('uikit')) => void;
  export default Icons;
}
