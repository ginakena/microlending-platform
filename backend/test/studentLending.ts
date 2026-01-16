import { expect } from "chai";
import { ethers } from "hardhat";
// import hre from "hardhat";
import { StudentLending, MockERC20 } from "../typechain-types"; // adjust if names differ

describe("StudentLending", function () {
  let lending: StudentLending;
  let token: MockERC20;
  let owner: any, lender: any, student: any, other: any;

  const TOKEN_DECIMALS = 6;
  const INITIAL_SUPPLY = ethers.parseUnits("10000", TOKEN_DECIMALS);

  beforeEach(async function () {
    [owner, lender, student, other] = await ethers.getSigners();

    // Deploy mock ERC20
    const MockToken = await ethers.getContractFactory("MockERC20");
    token = (await MockToken.deploy(
      "TestUSDC",
      "USDC",
      TOKEN_DECIMALS
    )) as unknown as MockERC20;

    await token.mint(lender.address, INITIAL_SUPPLY);

    // Deploy lending contract
    const StudentLending = await ethers.getContractFactory("StudentLending");
    lending = (await StudentLending.deploy(
      await token.getAddress()
    )) as unknown as StudentLending;
  });

  describe("Deployment", function () {
    it("should set the correct lending token", async function () {
      expect(await lending.lendingToken()).to.equal(await token.getAddress());
    });

    it("should set owner to deployer", async function () {
      expect(await lending.owner()).to.equal(owner.address);
    });
  });

  describe("Deposit", function () {
    it("should allow deposit and update totalDeposited", async function () {
      const amount = ethers.parseUnits("1000", TOKEN_DECIMALS);
      await token.connect(lender).approve(await lending.getAddress(), amount);
      await lending.connect(lender).deposit(amount);

      expect(await lending.totalDeposited()).to.equal(amount);
    });

    it("should revert on zero deposit", async function () {
      await expect(lending.connect(lender).deposit(0)).to.be.revertedWith(
        "Amount must be > 0"
      );
    });
  });

  describe("Verify Student", function () {
    it("should allow owner to verify student and emit event", async function () {
      await expect(lending.verifyStudent(student.address, true))
        .to.emit(lending, "StudentVerified")
        .withArgs(student.address, true);

      expect(await lending.verifiedStudents(student.address)).to.be.true;
    });

    it("should revert if non-owner tries to verify", async function () {
      await expect(
        lending.connect(student).verifyStudent(student.address, true)
      ).to.be.revertedWithCustomError(lending, "OwnableUnauthorizedAccount");
    });
  });

  describe("Borrow", function () {
    beforeEach(async function () {
      // Setup: deposit liquidity + verify student
      const depositAmount = ethers.parseUnits("2000", TOKEN_DECIMALS);
      await token
        .connect(lender)
        .approve(await lending.getAddress(), depositAmount);
      await lending.connect(lender).deposit(depositAmount);

      await lending.verifyStudent(student.address, true);
    });

    it("should allow verified student to borrow and calculate interest", async function () {
      const borrowAmount = ethers.parseUnits("500", TOKEN_DECIMALS);
      await lending.connect(student).borrow(borrowAmount);

      const loan = await lending.getLoanDetails(student.address);
      expect(loan.principal).to.equal(borrowAmount);
      expect(loan.repayAmount).to.equal(
        borrowAmount + (borrowAmount * 5n) / 100n
      );
      expect(await lending.totalDeposited()).to.be.lt(
        ethers.parseUnits("2000", TOKEN_DECIMALS)
      );
    });

    it("should revert if student not verified", async function () {
      await expect(
        lending.connect(other).borrow(ethers.parseUnits("100", TOKEN_DECIMALS))
      ).to.be.revertedWith("Student not verified");
    });

    // Add more: max amount, existing loan, insufficient liquidity...
  });

  // Add repay, isOverdue, etc. similarly
});
