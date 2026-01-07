import "./setup";

import { expect } from "chai";
import { afterEach, describe } from "mocha";
import Sinon, { spy } from "sinon";

import { $store } from "ceres";

afterEach(function () {
    Sinon.restore();
});

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

    it("should emit a change event", function () {
        const store = $store(0);
        const emitter = spy(store, "emit");

        store.value = 1;

        expect(emitter).to.have.been.calledWith({ prev: 0, curr: 1 });
    });
});
