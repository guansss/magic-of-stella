import EventEmitter from '@/utils/EventEmitter';
import { getJSON, postJSON } from '@/utils/net';
import { WEInterface } from '@/we/WEInterface';
import debounce from 'lodash/debounce';

export async function init(eventEmitter: EventEmitter) {
    WEInterface.setEventEmitter(eventEmitter);

    if (WEInterface.runningInWE) {
        if (WEInterface.redirectedFromBridge) {
            await setupRemote();

            // must use a debounce because property can change rapidly, for example when using a color picker
            eventEmitter.on('we:*', debounce(updateRemoteProperty, 100));
        }
    } else {
        await setupDefault();
    }
}

async function setupDefault() {
    try {
        // actually loading "wallpaper/project.json", but "wallpaper" is the content root of DevServer,
        //  so we need to call "project.json"
        const project = (await getJSON('project.json')) as { general: { properties: WEUserProperties } };

        if (project) {
            window.wallpaperPropertyListener.applyUserProperties(project.general.properties);
        } else {
            // noinspection ExceptionCaughtLocallyJS
            throw 'Empty response';
        }
    } catch (e) {
        console.error('WE', 'Failed to load project.json, have you run `yarn setup` ?', e);
    }
}

async function setupRemote() {
    try {
        const props = await getJSON('/props');

        if (props) {
            props.generalProps && window.wallpaperPropertyListener.applyGeneralProperties(props.generalProps);
            props.userProps && window.wallpaperPropertyListener.applyUserProperties(props.userProps);
        } else {
            // noinspection ExceptionCaughtLocallyJS
            throw 'Empty response';
        }
    } catch (e) {
        console.error('WE', 'Failed to retrieve Wallpaper Engine properties from Webpack DevServer:', e);
    }
}

// update remote properties so they can be retrieved after HMR
function updateRemoteProperty(propName: string, value: string) {
    postJSON('/props', {
        // no need to care about putting the property in userProps or generalProps, because they will finally be merged
        userProps: { [propName]: { value } },
    }).catch();
}
