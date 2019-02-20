import Hjson from "hjson";

export default {
    parse(text: string) {
        const setComments = (object: any) => {
            if (object.__COMMENTS__) {
                for (const o of object.__COMMENTS__.o) {
                    Object.defineProperty(object, o + "__commentBefore__", { enumerable: false, writable: true });
                    Object.defineProperty(object, o + "__commentAfter__", { enumerable: false, writable: true });
                    object[o + "__commentBefore__"] = object.__COMMENTS__.c[o][0].trim();
                    object[o + "__commentAfter__"] = object.__COMMENTS__.c[o][1].trim();
                }
                object.__COMMENTS__ = undefined;
            }
            for (const value of Object.values(object)) {
                if (typeof value === "object") {
                    setComments(value);
                }
            }
        };
        const data =  Hjson.parse(text, { keepWsc: true });
        setComments(data);
        return data;
    },
    stringify(data: any) {
        const regex = /^#|^\/\//;
        const getComments = (object: any, level = 1) => {
            if (!object.__COMMENTS__) {
                Object.defineProperty(object, "__COMMENTS__", { enumerable: false, writable: true });
                object.__COMMENTS__ = {};
            }
            if (!object.__COMMENTS__.c) {
                object.__COMMENTS__.c = {};
            }
            if (!object.__COMMENTS__.o) {
                object.__COMMENTS__.o = [];
            }
            for (const [name, value] of Object.entries(object)) {
                if (!object.__COMMENTS__.o.includes(name)) { object.__COMMENTS__.o.push(name); }
                if (!object.__COMMENTS__.c[name]) { object.__COMMENTS__.c[name] = ["", ""]; }
                if (object[name + "__commentBefore__"]) {
                    const lines = object[name + "__commentBefore__"].split("\n").trim();
                    let comment = "";
                    // Check that every line of comment begins with a correct character
                    for (let line of lines) {
                        if (!regex.test(line)) {
                            line = "# " + line;
                        }
                        comment += line;
                    }
                    object.__COMMENTS__.c[name][0] = "  ".repeat(level) + comment;
                    object[name + "__commentBefore__"] = undefined;
                }
                if (object[name + "__commentAfter__"]) {
                    const lines = object[name + "__commentAfter__"].split("\n").trim();
                    let comment = "";
                    // Check that every line of comment begins with a correct character
                    for (let line of lines) {
                        if (!regex.test(line)) {
                            line = "# " + line;
                        }
                        comment += line;
                    }
                    object.__COMMENTS__.c[name][1] = "  ".repeat(level) + comment;
                    object[name + "__commentAfter__"] = undefined;
                }
                if (typeof value === "object") {
                    getComments(value, level + 1);
                }
            }
        };
        getComments(data);
        return Hjson.stringify(data, { keepWsc: true });
    },
    extension: ".hjson",
};
