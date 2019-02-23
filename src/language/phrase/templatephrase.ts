import format = require("string-format");

import { SimplePhrase } from "./simplephrase";

export class TemplatePhrase extends SimplePhrase {
    public format(language: string, stuff: { [key: string]: any } ) {
        return format(this.templates[language], stuff);
    }
}
