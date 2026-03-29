import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("Proof18 — Integration: Full Product Flows", function () {
  let access: any, vault: any, scheduler: any, passport: any;
  let owner: any, guardian: any, teen: any, executor: any, outsider: any;
  let familyId: string;

  beforeEach(async function () {
    [owner, guardian, teen, executor, outsider] = await ethers.getSigners();
    familyId = ethers.keccak256(
      ethers.toUtf8Bytes("integration-test-family")
    );

    // Deploy contracts
    const Access = await ethers.getContractFactory("Proof18Access");
    access = await Access.deploy();

    const Vault = await ethers.getContractFactory("Proof18Vault");
    vault = await Vault.deploy(await access.getAddress());

    const Scheduler = await ethers.getContractFactory("Proof18Scheduler");
    scheduler = await Scheduler.deploy(
      await access.getAddress(),
      await vault.getAddress()
    );

    const Passport = await ethers.getContractFactory("Proof18Passport");
    passport = await Passport.deploy(await access.getAddress());

    // Setup family
    await access.registerFamily(
      familyId,
      guardian.address,
      teen.address,
      executor.address
    );
    await passport.connect(guardian).createPassport(familyId, teen.address);
  });

  // ═══════════════════════════════════════
  // FLOW A: Complete Savings (GREEN path)
  // ═══════════════════════════════════════
  describe("Savings GREEN Path — End to End", function () {
    it("should execute full savings flow: deposit → passport → events", async function () {
      const amount = ethers.parseEther("5");

      // 1. Executor deposits savings (simulates Lit Action signing)
      const tx = await vault
        .connect(executor)
        .depositSavings(familyId, teen.address, { value: amount });
      const receipt = await tx.wait();

      // Verify SavingsDeposit event
      const depositEvent = receipt.logs.find((l: any) => {
        try {
          return vault.interface.parseLog(l)?.name === "SavingsDeposit";
        } catch {
          return false;
        }
      });
      expect(depositEvent).to.not.be.undefined;

      // 2. Verify balances
      const [savings, reserve] = await vault.getBalances(
        familyId,
        teen.address
      );
      expect(savings).to.equal(amount);
      expect(reserve).to.equal(0);

      // 3. Record action in Passport
      const passportTx = await passport
        .connect(executor)
        .recordAction(familyId, teen.address, "savings", true);
      const passportReceipt = await passportTx.wait();

      // Verify ActionRecorded event
      const actionEvent = passportReceipt.logs.find((l: any) => {
        try {
          return (
            passport.interface.parseLog(l)?.name === "PassportActionRecorded"
          );
        } catch {
          return false;
        }
      });
      expect(actionEvent).to.not.be.undefined;

      // 4. Verify passport state
      const [level, levelName, streak, total, savingsCount] =
        await passport.getPassport(familyId, teen.address);
      expect(total).to.equal(1);
      expect(savingsCount).to.equal(1);
    });

    it("should create weekly savings schedule", async function () {
      const amount = ethers.parseEther("5");
      const oneWeek = 604800;

      await scheduler
        .connect(executor)
        .createSchedule(
          familyId,
          teen.address,
          amount,
          oneWeek,
          "weekly-savings",
          0, // SAVINGS
          ethers.ZeroAddress
        );

      const [fId, t, a, interval, nextExec, label, active] =
        await scheduler.getSchedule(0);
      expect(fId).to.equal(familyId);
      expect(a).to.equal(amount);
      expect(interval).to.equal(oneWeek);
      expect(active).to.be.true;
    });
  });

  // ═══════════════════════════════════════
  // FLOW B: Subscription (RED → Approval → Execute)
  // ═══════════════════════════════════════
  describe("Subscription RED→Approval→Execute Path", function () {
    it("should complete full subscription lifecycle", async function () {
      const monthlyAmount = ethers.parseEther("2");
      const recipient = outsider;

      // 1. Guardian funds subscription reserve (approval)
      await vault
        .connect(guardian)
        .fundSubscription(familyId, teen.address, "spotify", {
          value: monthlyAmount,
        });

      // 2. Verify reserve
      const [, reserveAfterFund] = await vault.getBalances(
        familyId,
        teen.address
      );
      expect(reserveAfterFund).to.equal(monthlyAmount);

      // 3. Executor pays subscription
      const recipientBalBefore = await ethers.provider.getBalance(
        recipient.address
      );

      await vault
        .connect(executor)
        .executeSubscriptionPayment(
          familyId,
          teen.address,
          "spotify",
          monthlyAmount,
          recipient.address
        );

      // 4. Verify payment
      const recipientBalAfter = await ethers.provider.getBalance(
        recipient.address
      );
      expect(recipientBalAfter - recipientBalBefore).to.equal(monthlyAmount);

      const [, reserveAfterPay] = await vault.getBalances(
        familyId,
        teen.address
      );
      expect(reserveAfterPay).to.equal(0);

      // 5. Record in passport
      await passport
        .connect(executor)
        .recordAction(familyId, teen.address, "subscription", true);

      const [, , , total, , subsCount] = await passport.getPassport(
        familyId,
        teen.address
      );
      expect(total).to.equal(1);
      expect(subsCount).to.equal(1);
    });

    it("should reject unapproved subscription execution", async function () {
      await expect(
        vault
          .connect(executor)
          .executeSubscriptionPayment(
            familyId,
            teen.address,
            "spotify",
            ethers.parseEther("2"),
            outsider.address
          )
      ).to.be.rejectedWith("Insufficient reserve");
    });
  });

  // ═══════════════════════════════════════
  // FLOW C: BLOCKED Path
  // ═══════════════════════════════════════
  describe("BLOCKED Path", function () {
    it("should block all operations on deactivated family", async function () {
      await access.connect(guardian).deactivateFamily(familyId);

      await expect(
        vault
          .connect(executor)
          .depositSavings(familyId, teen.address, {
            value: ethers.parseEther("1"),
          })
      ).to.be.rejectedWith("Family not active");

      await expect(
        vault
          .connect(guardian)
          .fundSubscription(familyId, teen.address, "test", {
            value: ethers.parseEther("1"),
          })
      ).to.be.rejectedWith("Family not active");
    });

    it("should record rejected action in passport", async function () {
      await passport
        .connect(executor)
        .recordAction(familyId, teen.address, "subscription", false);

      const [, , , total, , , rejected] = await passport.getPassport(
        familyId,
        teen.address
      );
      expect(total).to.equal(1);
      expect(rejected).to.equal(1);
    });
  });

  // ═══════════════════════════════════════
  // PASSPORT PROGRESSION
  // ═══════════════════════════════════════
  describe("Passport Level Progression", function () {
    it("should progress through all levels with enough actions", async function () {
      const expectedLevels = [
        { actions: 5, level: 1, name: "Explorer" },
        { actions: 15, level: 2, name: "Saver" },
        { actions: 35, level: 3, name: "Manager" },
        { actions: 70, level: 4, name: "Planner" },
        { actions: 150, level: 5, name: "Independent" },
      ];

      let totalDone = 0;

      for (const expected of expectedLevels) {
        const remaining = expected.actions - totalDone;
        for (let i = 0; i < remaining; i++) {
          await passport
            .connect(executor)
            .recordAction(familyId, teen.address, "savings", true);
        }
        totalDone = expected.actions;

        const [level, levelName] = await passport.getPassport(
          familyId,
          teen.address
        );
        expect(level).to.equal(expected.level);
        expect(levelName).to.equal(expected.name);
      }
    });
  });

  // ═══════════════════════════════════════
  // SCHEDULER LIFECYCLE
  // ═══════════════════════════════════════
  describe("Schedule Lifecycle", function () {
    it("should create → pause → resume schedule", async function () {
      await scheduler
        .connect(executor)
        .createSchedule(
          familyId,
          teen.address,
          ethers.parseEther("1"),
          604800,
          "test-schedule",
          0,
          ethers.ZeroAddress
        );

      // Pause
      await scheduler.connect(guardian).pauseSchedule(0);
      let [, , , , , , active] = await scheduler.getSchedule(0);
      expect(active).to.be.false;

      // Resume
      await scheduler.connect(guardian).resumeSchedule(0);
      [, , , , , , active] = await scheduler.getSchedule(0);
      expect(active).to.be.true;
    });

    it("should reject outsider schedule manipulation", async function () {
      await scheduler
        .connect(executor)
        .createSchedule(
          familyId,
          teen.address,
          ethers.parseEther("1"),
          604800,
          "test",
          0,
          ethers.ZeroAddress
        );

      await expect(
        scheduler.connect(outsider).pauseSchedule(0)
      ).to.be.rejectedWith("Guardian only");
    });
  });

  // ═══════════════════════════════════════
  // ROLE SECURITY
  // ═══════════════════════════════════════
  describe("Role Security Across All Contracts", function () {
    it("should prevent teen from withdrawing savings", async function () {
      await vault
        .connect(executor)
        .depositSavings(familyId, teen.address, {
          value: ethers.parseEther("5"),
        });

      await expect(
        vault
          .connect(teen)
          .withdrawSavings(familyId, teen.address, ethers.parseEther("5"))
      ).to.be.rejectedWith("Guardian only");
    });

    it("should prevent outsider from recording passport actions", async function () {
      await expect(
        passport
          .connect(outsider)
          .recordAction(familyId, teen.address, "savings", true)
      ).to.be.rejectedWith("Not authorized");
    });

    it("should prevent teen from executing subscription payments", async function () {
      await vault
        .connect(guardian)
        .fundSubscription(familyId, teen.address, "test", {
          value: ethers.parseEther("1"),
        });

      await expect(
        vault
          .connect(teen)
          .executeSubscriptionPayment(
            familyId,
            teen.address,
            "test",
            ethers.parseEther("1"),
            outsider.address
          )
      ).to.be.rejectedWith("Executor only");
    });

    it("should allow guardian to rotate executor", async function () {
      const newExecutor = outsider;
      await access
        .connect(guardian)
        .updateExecutor(familyId, newExecutor.address);

      // Old executor should fail
      await expect(
        vault
          .connect(executor)
          .depositSavings(familyId, teen.address, {
            value: ethers.parseEther("1"),
          })
      ).to.be.rejectedWith("Not authorized");

      // New executor should succeed
      await vault
        .connect(newExecutor)
        .depositSavings(familyId, teen.address, {
          value: ethers.parseEther("1"),
        });
    });
  });
});
