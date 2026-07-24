import { Font } from '@react-pdf/renderer';

const getFontUri = (path: string) => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return path;
};

Font.register({
  family: 'CinzelDecorative',
  src: getFontUri('/fonts/CinzelDecorative-Regular.ttf')
});

Font.register({
  family: 'CormorantGaramond',
  src: getFontUri('/fonts/CormorantGaramond-Regular.ttf')
});

Font.register({
  family: 'Caveat',
  src: getFontUri('/fonts/Caveat-Regular.ttf')
});

// Web font loading (for preview mode)
export const loadWebFonts = () => {
  if (typeof document !== 'undefined') {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cinzel+Decorative&family=Cormorant+Garamond:wght@400;600&family=Caveat&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
};
