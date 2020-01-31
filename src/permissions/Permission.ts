import { DEFAULT_LANGUAGE } from "../language/Languages";
import { Phrase } from "../language/phrase/Phrase";
import { PhraseGroup } from "../language/phrase/PhraseGroup";
import { SimplePhrase } from "../language/phrase/SimplePhrase";
import { IExtendedMember, IExtendedRole } from "../util/Types";
import { Permissions } from "./Permissions";

/**
 * A base class for all permissions.
 * @category Permission
 */
export class Permission {
    /** The name the permission is registered by internally. */
    public name: string;
    /** The full name of the permission, including possible parents, separated by dots. */
    public fullName: string;
    /** The description of the permission in [[DEFAULT_LANGUAGE]]. */
    public description?: string;
    /** The localized description of the command. */
    public localizedDescription?: SimplePhrase;
    /** The phrase group of the permission for registration purposes. */
    public phraseGroup: PhraseGroup;
    /** The permission manager of the permission. */
    public permissions?: Permissions;
    private subPhrases: Phrase[];
    private subPhraseGroup?: PhraseGroup;
    private phrases: Phrase[];
    private parent?: Permission;

    /**
     * Creates a new permission.
     * @param info Defines basic permission parameters.
     */
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

    /**
     * Registers the permission for the specified permission handler.
     * @param permissions The permission handler to use.
     */
    public registerSelf(permissions: Permissions) {
        this.permissions = permissions;
        this.updateFullName();
    }

    /** Unregisters the permission from the previously registered permission handler. */
    public unregisterSelf() {
        this.permissions = undefined;
        this.fullName = this.name;
    }

    /**
     * Registers a phrase to the permission.
     * @param phrase The phrase to register.
     */
    public registerPhrase(phrase: Phrase) {
        this.subPhrases.push(phrase);
    }

    /**
     * Unregister a phrase from the permission.
     * @param phrase The phrase to unregister.
     */
    public unregisterPhrase(phrase: Phrase) {
        this.subPhrases.splice(this.subPhrases.indexOf(phrase), 1);
    }

    /**
     * Registers the permission for a parent.
     * @param parent The parent to register for.
     */
    public registerParent(parent: Permission) {
        this.parent = parent;
        parent.registerPhrase(this.phraseGroup);
    }

    /**
     * Registers the permission from a parent.
     * @param parent The parent to unregister from.
     */
    public unregisterParent(parent: Permission) {
        parent.unregisterPhrase(this.phraseGroup);
    }

    /** Updates the full name of the permission to include the parent's name. */
    public updateFullName() {
        if (this.parent) { this.fullName = this.parent.fullName + "." + this.name; }
    }

    /**
     * Checks if a member has this permission, or inherits it from a role.
     * @param member The member to check.
     */
    public async checkMember(member: IExtendedMember) {
        this.ensurePermissions();
        return this.permissions.checkMemberPermission(this, member);
    }

    /**
     * Checks if a member has this permission directly.
     * @param member The member to check.
     */
    public async checkMemberOnly(member: IExtendedMember) {
        this.ensurePermissions();
        return this.permissions.checkMemberPermissionOnly(this, member);
    }

    /**
     * Checks if a role has this permission.
     * @param role The role to check.
     */
    public async checkRole(role: IExtendedRole) {
        this.ensurePermissions();
        return this.permissions.checkRolePermission(this, role);
    }

    private ensurePermissions(): asserts this is this & { permissions: Permissions } {
        if (!this.permissions) {
            throw new Error(`Permission "${this.fullName}" is not registered`);
        }
    }
}

/**
 * Defines basic permission parameters.
 * @category Permission
 */
export interface IPermissionInfo {
    /** Name of the permission. */
    name: string;
    /**
     * Description of the permission.
     * Can be either a string, in which case it is assumed to be in [[DEFAULT_LANGUAGE]],
     * or an object, in which case the keys are languages and the values are associated localized descriptions.
     */
    description?: string | Record<string, string>;
}
