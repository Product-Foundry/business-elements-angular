"use strict";

import chai from "chai";
import StringUtil from "../../src/util/string.util";

chai.should();

/** @test {stringUtil} */
describe("stringUtil", () => {
  let stringUtil, expect;
  
  beforeEach(() => {
    stringUtil = new StringUtil();
    expect = require("chai").expect;
  });

  describe("#toValidHandle", () => {
    it("should convert invalid handle into a valid format", () => {
      const handle = stringUtil.toValidHandle("handle!-@# $%^&*(name");
      handle.should.equal("handle-----------name");
    });

    it("should convert handle into a valid format", () => {
      const handle = stringUtil.toValidHandle("valid-handle");
      handle.should.equal("valid-handle");
    });
  });

  describe("#isEmailAddressValid", () => {
    it("should return false on invalid emailaddresses", () => {
      expect(stringUtil.isEmailAddressValid("username@test")).to.be.false;
      expect(stringUtil.isEmailAddressValid("username@test.c")).to.be.false;
      expect(stringUtil.isEmailAddressValid("username")).to.be.false;
    });
    it("should return false on undefined emailaddresses", () => {
      expect(stringUtil.isEmailAddressValid(undefined)).to.be.false;
    });
    it("should return false on empty emailaddresses", () => {
      expect(stringUtil.isEmailAddressValid("")).to.be.false;
    });
    it("should return true on valid emailaddresses", () => {
      expect(stringUtil.isEmailAddressValid("username@domain.name")).to.be.true;
      expect(stringUtil.isEmailAddressValid("username@domain.co.uk")).to.be.true;
      expect(stringUtil.isEmailAddressValid("user._-name@domain.co.uk")).to.be.true;
    });

  });

  describe("#isHandleValid", () => {
    it("should return false on invalid handle", () => {
      expect(stringUtil.isHandleValid("")).to.be.false;
      expect(stringUtil.isHandleValid("_ABC")).to.be.false;
      expect(stringUtil.isHandleValid("#def")).to.be.false;
      expect(stringUtil.isHandleValid("^GHI")).to.be.false;
    });
    it("should return false on too long handle", () => {
      expect(stringUtil.isHandleValid("1012345678901234567890123456789012345678901234567890123456789")).to.be.false;
    });
    it("should return true on valid handle", () => {
      expect(stringUtil.isHandleValid("-handle-x")).to.be.true;
      expect(stringUtil.isHandleValid("0-handle-x")).to.be.true;
      expect(stringUtil.isHandleValid("A-handle-x")).to.be.true;
      expect(stringUtil.isHandleValid("b-handle-x")).to.be.true;
      expect(stringUtil.isHandleValid("y")).to.be.true;
    });

  });

  describe("#toUrlPath", () => {
    it("should convert nothing when its empty", () => {
      stringUtil.toUrlPath("").should.equal("");
    });
    it("should convert url-path to lowercase", () => {
      stringUtil.toUrlPath("ABCdefGHI13344334587").should.equal("abcdefghi13344334587");
    });
    it("should convert whitespace to dash", () => {
      stringUtil.toUrlPath("  test 123  test 567 ").should.equal("-test-123-test-567-");
    });
    it("should strip exotic characters", () => {
      stringUtil.toUrlPath("test  123 ±±!@#$%^&*()))__+=-1234567890-=abcdefghijklmnopqrstuvwyz").should.equal("test-123-__-1234567890-abcdefghijklmnopqrstuvwyz");
    });

  });

  describe("#toValidAttributePath", () => {
    it("should convert nothing when its valid", () => {
      stringUtil.toValidAttributePath("/abc").should.equal("/abc");
    });
    it("should prefix it with slash", () => {
      stringUtil.toValidAttributePath("abc").should.equal("/abc");
    });
  });
});
