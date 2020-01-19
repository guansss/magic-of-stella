// make sure user properties are included in "/assets/project-json/base.json"
type WEUserPropertyNames = 'schemecolor' | WEFilePropertyNames;
type WEGeneralPropertyNames = 'language';

type WEUserProperties = Record<WEUserPropertyNames, { value: string }>;
type WEGeneralProperties = Record<WEGeneralPropertyNames, string>;

// merged user properties and general properties
type WEProperties = WEUserProperties & WEGeneralProperties;

type WEFilePropertyNames = 'imgDir' | 'vidDir';
type WEFiles = Partial<Record<WEFilePropertyNames, string[]>>;

declare interface Window {
    wallpaperRegisterAudioListener?(audioListener: (audioSamples: number[]) => void): void

    wallpaperPropertyListener: {
        applyUserProperties<T extends WEUserProperties>(props: T): void;
        applyGeneralProperties<T extends WEGeneralProperties>(props: T): void;

        setPaused(paused: boolean): void;
    };
}
