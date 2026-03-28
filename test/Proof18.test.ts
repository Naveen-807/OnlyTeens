import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("Proof18", function () {
  it("registers family, deposits savings, records passport actions", async function () {
    const [deployer, guardian, teen, executor, recipient] = await ethers.getSigners();

    const Access = await ethers.getContractFactory("Proof18Access");
    const access = await Access.deploy();
    await access.waitForDeployment();

    const Vault = await ethers.getContractFactory("Proof18Vault");
    const vault = await Vault.deploy(await access.getAddress());
    await vault.waitForDeployment();

    const Scheduler = await ethers.getContractFactory("Proof18Scheduler");
    const scheduler = await Scheduler.deploy(await access.getAddress(), await vault.getAddress());
    await scheduler.waitForDeployment();

    const Passport = await ethers.getContractFactory("Proof18Passport");
    const passport = await Passport.deploy(await access.getAddress());
    await passport.waitForDeployment();

    const familyId = ethers.keccak256(ethers.toUtf8Bytes("family-1"));

    await expect(
      access.connect(deployer).registerFamily(familyId, guardian.address, teen.address, executor.address),
    )
      .to.emit(access, "FamilyRegistered");

    await expect(
      passport.connect(executor).createPassport(familyId, teen.address),
    ).to.emit(passport, "PassportCreated");

    const depositAmount = ethers.parseEther("1.0");
    await expect(
      vault.connect(teen).depositSavings(familyId, teen.address, { value: depositAmount }),
    ).to.emit(vault, "SavingsDeposit");

    await expect(
      passport.connect(executor).recordAction(familyId, teen.address, "savings", true),
    ).to.emit(passport, "PassportActionRecorded");

    const [level] = await passport.getPassport(familyId, teen.address);
    expect(Number(level)).to.equal(0);

    const subFunding = ethers.parseEther("2.0");
    await expect(
      vault.connect(executor).fundSubscription(familyId, teen.address, "Spotify", { value: subFunding }),
    ).to.emit(vault, "SubscriptionFunded");

    await expect(
      scheduler.connect(executor).createSchedule(
        familyId,
        teen.address,
        ethers.parseEther("0.5"),
        3600,
        "Spotify",
        1,
        recipient.address,
      ),
    ).to.emit(scheduler, "ScheduleCreated");
  });
});
