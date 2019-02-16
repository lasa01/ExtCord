import Hjson from "hjson";

export default {
    parse(text: string) {
        const data =  Hjson.parse(text, { keepWsc: true });
        const comments: { [key: string]: {
            __before__: string;
            __after__: string;
        }} = {};
        for (const [key, list] of Object.entries(data.__COMMENTS__.c)) {
            comments[key] = {
                __after__: (list as string[])[1],
                __before__: (list as string[])[0],
            };
        }
    },
};
