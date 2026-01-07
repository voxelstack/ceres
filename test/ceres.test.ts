import { describe } from "mocha";
import { expect } from "chai";
import { $store } from "ceres";

describe("Array", function () {
    describe("#indexOf()", function () {
        it("should return -1 when the value is not present", function () {
            expect([1, 2, 3].indexOf(4)).to.equal(-1);
        });
    });
});

describe("Store", function () {
    it("should store a value", function () {
        const store = $store(0);
        expect(store.value).to.equal(0);
    });
});
