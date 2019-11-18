import { DEFAULT_LANGUAGE } from "../language/Languages";
import { Phrase } from "../language/phrase/Phrase";
import { PhraseGroup } from "../language/phrase/PhraseGroup";
import { ISimpleMap, SimplePhrase } from "../language/phrase/SimplePhrase";
import { IExtendedMember, IExtendedRole } from "../util/Types";
import { Permissions } from "./Permissions";

export class Permission {
    public name: string;
    public fullName: string;
    public description?: string;
    public localizedDescription?: SimplePhrase;
    public phraseGroup: PhraseGroup;
    private subPhrases: Phrase[];
    private subPhraseGroup?: PhraseGroup;
    private phrases: Phrase[];
    private permissions?: Permissions;
    private parent?: Permission;

    constructor(info: IPermissionInfo) {
        this.name = info.name;
        this.description = typeof info.description === "object" ? info.description[DEFAULT_LANGUAGE] : info.description;
        if (info.description) {
            this.localizedDescription = new SimplePhrase({
                name: "description",
            }, info.description);
        }
        this.subPhrases = [];
        this.fullName = info.name;
        if (this.localizedDescription) {
            this.phrases = [this.localizedDescription];
        } else {
            this.phrases = [];
        }
        if (this.subPhrases.length !== 0) { // TODO: length is always 0, fix
            this.subPhraseGroup = new PhraseGroup({
                name: "phrases",
            }, this.subPhrases);
            this.phrases.push(this.subPhraseGroup);
        }
        this.phraseGroup = new PhraseGroup({
            name: this.name,
        }, this.phrases);
    }

    public registerSelf(permissions: Permissions) {
        this.permissions = permissions;
        this.updateFullName();
    }

    public unregisterSelf() {
        this.permissions = undefined;
        this.fullName = this.name;
    }

    public registerPhrase(phrase: Phrase) {
        this.subPhrases.push(phrase);
    }

    public unregisterPhrase(phrase: Phrase) {
        this.subPhrases.splice(this.subPhrases.indexOf(phrase), 1);
    }

    public registerParent(parent: Permission) {
        this.parent = parent;
        parent.registerPhrase(this.phraseGroup);
    }

    public unregisterParent(parent: Permission) {
        parent.unregisterPhrase(this.phraseGroup);
    }

    public updateFullName() {
        if (this.parent) { this.fullName = this.parent.fullName + "." + this.name; }
    }

    public async checkMember(member: IExtendedMember) {
        return this.permissions!.checkMemberPermission(this, member);
    }

    public async checkMemberOnly(member: IExtendedMember) {
        return this.permissions!.checkMemberPermissionOnly(this, member);
    }

    public async checkRole(role: IExtendedRole) {
        return this.permissions!.checkRolePermission(this, role);
    }
}

export interface IPermissionInfo {
    name: string;
    description?: string | ISimpleMap;
}
