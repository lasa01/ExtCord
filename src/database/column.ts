import Sequelize from "sequelize";
import Winston from "winston";
import DatabaseRow from "./row";

// NEED INDIVIDUAL SUBCLASSES FOR DIFFERENT TYPES, NOT GENERIC ONE
export default abstract class DatabaseColumn<T> {
    public name: string;
    private row: DatabaseRow;
    private cache?: T;

    constructor(name: string, row: DatabaseRow) {
        this.name = name;
        this.row = row;
    }
}
