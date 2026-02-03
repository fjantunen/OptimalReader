export enum Theme {
  Light = 'light',
  Sepia = 'sepia',
  Dark = 'dark',
  ThisIsFine = 'thisisfine',
}

export enum ReaderFont {
  Clean = 'clean',
  Classic = 'classic',
}

export interface ReaderSettings {
  theme: Theme;
  font: ReaderFont;
  fontSize: number;
  lineHeight: number;
  ttsSpeed: number;
}