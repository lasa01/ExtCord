import { expect } from "chai";
import "mocha";

import { Serializer } from "../../src/util/Serializer";

describe("Serializer", () => {
    describe("#extension", () => {
        it("should be a string", () => expect(Serializer.extension).to.be.a("string"));
        it("should start with a dot", () => expect(Serializer.extension).to.satisfy((s: string) => s.startsWith(".")));
        it("should be longer than 1", () => expect(Serializer.extension).to.have.lengthOf.above(1));
    });
    it("test object deep equals after stringify-parse cycle", () => {
        const obj = {
            deep: {
                list: [{
                    name: "item 1",
                }, "item 2"],
                name: "deep",
            },
            name: "Null",
            nontrue: false,
            twelve: 12,
        };
        expect(Serializer.parse(Serializer.stringify(obj))).to.deep.equal(obj);
    });
    it("test object keeps comments after stringify-parse cycle", () => {
        const obj = {
            // no start char
            deep: {
                // deep
                deeper: {
                    // deeper no start char
                    // nor here
                    name: "deeper",
                    // deeper
                    value: 134,
                },
                name: "deep",
            },
            // start char
            // and here
            name: "Null",
            // start char
            // not here
            value: 124,
        };
        Object.defineProperty(obj, "deep__comment__", {
            enumerable: false, value: "no start char", writable: true,
        });
        Object.defineProperty(obj, "name__comment__", {
            enumerable: false, value: "# start char\n# and here", writable: true,
        });
        Object.defineProperty(obj, "value__comment__", {
            enumerable: false, value: "# start char\nnot here", writable: true,
        });
        Object.defineProperty(obj.deep, "deeper__comment__", {
            enumerable: false, value: "# deep", writable: true,
        });
        Object.defineProperty(obj.deep.deeper, "value__comment__", {
            enumerable: false, value: "# deeper", writable: true,
        });
        Object.defineProperty(obj.deep.deeper, "name__comment__", {
            enumerable: false, value: "deeper no start char\nnor here", writable: true,
        });

        const expected = {
            "deep.deeper.name__comment__.": "# deeper no start char\n# nor here",
            "deep.deeper.value__comment__.": "# deeper",
            "deep.deeper__comment__": "# deep",
            "deep__comment__": "# no start char",
            "name__comment__": "# start char\n# and here",
            "value__comment__": "# start char\n# not here",
        };

        expect(Serializer.parse(Serializer.stringify(obj))).to.nested.include(expected).and.to.deep.equal(obj);
    });
});
