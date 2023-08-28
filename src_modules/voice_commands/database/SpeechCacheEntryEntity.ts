import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("speechCache")
export class SpeechCacheEntryEntity {
    @PrimaryColumn()
    public language!: string;

    @PrimaryColumn()
    public text!: string;

    @Column()
    public ogg!: Buffer;
}
