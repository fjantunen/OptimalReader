export enum Theme {
  Light = 'light',
  Sepia = 'sepia',
  Dark = 'dark',
  Amber = 'amber',
}

export enum ReaderFont {
  Clean = 'clean',
  Classic = 'classic',
}

export enum ReaderMode {
  Normal = 'normal',
  RSVP = 'rsvp',
}

export interface ReaderSettings {
  theme: Theme;
  font: ReaderFont;
  fontSize: number;
  lineHeight: number;
  ttsSpeed: number;
  mode: ReaderMode;
}