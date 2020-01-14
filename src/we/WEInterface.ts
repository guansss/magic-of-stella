import EventEmitter from '@/utils/EventEmitter';

declare module '@/utils/EventEmitter' {
    interface EventEmitter {
        on(event: 'we:*', fn: (name: string, value: string | number) => void, context?: any): this;

        on<T extends keyof WEProperties>(event: 'we:{T}', fn: (value: string) => void, context?: any): this;
    }
}

export namespace WEInterface {
    export const PREFIX = 'we:';

    export const props: Partial<WEProperties> = {};

    let eventEmitter: EventEmitter;

    export function setEventEmitter(emitter: EventEmitter) {
        eventEmitter = emitter;

        // immediately emit all properties and files
        Object.keys(props).forEach(name => emitProp(name as keyof WEProperties, true));
    }

    export function getPropValue<T extends keyof WEProperties>(name: T): string | undefined {
        const prop = props[name];

        if (prop !== undefined && prop !== null) {
            return typeof prop === 'string' ? prop : prop.value;
        }
    }

    function updateProps(_props: Partial<WEProperties>) {
        const initial = Object.keys(_props).length > 1;

        Object.assign(props, _props);
        Object.keys(_props).forEach(name => emitProp(name as keyof WEProperties, initial));
    }

    function emitProp<T extends keyof WEProperties>(name: T, initial?: boolean) {
        if (eventEmitter) {
            const value = getPropValue(name);

            if (value !== undefined) {
                eventEmitter.sticky(PREFIX + name, value, initial);
                eventEmitter.emit(PREFIX + '*', name, value, initial);
            }
        }
    }

    window.wallpaperPropertyListener = {
        applyUserProperties: updateProps,
        applyGeneralProperties: updateProps,

        setPaused(paused) {
            eventEmitter && eventEmitter.sticky(paused ? 'pause' : 'resume');
        },
    };
}
