export const Util = {
    isValidUrl(url: string) {
        try {
            // tslint:disable-next-line:no-unused-expression
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
};
