import DatabaseRow from "./row";

export default abstract class DatabaseRowWrapper {
    private databaseRow?: DatabaseRow;
    get database(): DatabaseRow {
        if (!this.databaseRow) {
            this.databaseRow = new DatabaseRow(this);
        }
        return this.databaseRow;
    }
}
