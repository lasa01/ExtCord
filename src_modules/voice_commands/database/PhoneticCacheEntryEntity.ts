import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("phoneticCache")
export class PhoneticCacheEntryEntity {
    @PrimaryColumn()
    public language!: string;

    @PrimaryColumn()
    public plain!: string;

    @Column()
    public phonetic!: string;
}
