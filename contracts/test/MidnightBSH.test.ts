import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const CERT_NAMES = ["Can Drive a Car", "Coffee Enthusiast"];
const CERT_ICONS = ["🚗", "☕"];

async function setUtcHour(hour: number) {
  const now = await time.latest();
  const currentHour = Math.floor((now / 3600) % 24);
  const secondsIntoHour = now % 3600;
  let target = now - secondsIntoHour - currentHour * 3600 + hour * 3600 + 1;
  if (target <= now) target += 24 * 3600;
  await time.increaseTo(target);
}

describe("MidnightBSH", () => {
  async function deploy(startHour = 21, endHour = 9) {
    const Factory = await ethers.getContractFactory("MidnightBSH");
    const contract = await Factory.deploy(CERT_NAMES, CERT_ICONS, startHour, endHour);
    await contract.waitForDeployment();
    return contract;
  }

  it("deploys with the configured certificates and window", async () => {
    const contract = await deploy();
    expect(await contract.certificateCount()).to.equal(2n);
    expect(await contract.nightStartHour()).to.equal(21);
    expect(await contract.nightEndHour()).to.equal(9);
  });

  it("lets anyone self-claim a certificate", async () => {
    const contract = await deploy();
    const [, alice] = await ethers.getSigners();
    await expect(contract.connect(alice).claimCertificate(0))
      .to.emit(contract, "CertificateClaimed")
      .withArgs(alice.address, 0);
    expect(await contract.holdsCertificate(0, alice.address)).to.equal(true);
  });

  it("rejects claiming an unknown certificate", async () => {
    const contract = await deploy();
    await expect(contract.claimCertificate(99)).to.be.revertedWithCustomError(
      contract,
      "UnknownCertificate"
    );
  });

  it("only allows posting during the night window", async () => {
    const contract = await deploy(21, 9);

    await setUtcHour(22); // open (wraps 21->9)
    await expect(contract.createPost("hello at night", false, 0)).to.not.be.reverted;

    await setUtcHour(12); // closed (daytime)
    await expect(contract.createPost("hello at noon", false, 0)).to.be.revertedWithCustomError(
      contract,
      "OutsideNightWindow"
    );

    await setUtcHour(3); // open (early morning tail of the window)
    await expect(contract.createPost("hello before dawn", false, 0)).to.not.be.reverted;
  });

  it("toggles, switches and retracts votes exactly like the app", async () => {
    const contract = await deploy(0, 0); // 0,0 => always open, simplifies this test
    const [, alice] = await ethers.getSigners();

    await contract.createPost("vote on me", false, 0);

    await contract.connect(alice).vote(0, true);
    let post = await contract.getPost(0);
    expect(post.likeCount).to.equal(1n);
    expect(post.dislikeCount).to.equal(0n);

    // voting the same way again retracts it
    await contract.connect(alice).vote(0, true);
    post = await contract.getPost(0);
    expect(post.likeCount).to.equal(0n);

    // switching from like to dislike moves the count over
    await contract.connect(alice).vote(0, true);
    await contract.connect(alice).vote(0, false);
    post = await contract.getPost(0);
    expect(post.likeCount).to.equal(0n);
    expect(post.dislikeCount).to.equal(1n);
  });

  it("blocks voting on a gated post without the required certificate", async () => {
    const contract = await deploy(0, 0);
    const [, alice, bob] = await ethers.getSigners();

    await contract.createPost("gated joke", true, 0);

    await expect(contract.connect(bob).vote(0, true)).to.be.revertedWithCustomError(
      contract,
      "MissingRequiredCertificate"
    );

    await contract.connect(alice).claimCertificate(0);
    await expect(contract.connect(alice).vote(0, true)).to.not.be.reverted;
  });

  it("paginates posts via getPostsRange", async () => {
    const contract = await deploy(0, 0);
    for (let i = 0; i < 5; i++) {
      await contract.createPost(`post ${i}`, false, 0);
    }
    const page = await contract.getPostsRange(2, 2);
    expect(page.length).to.equal(2);
    expect(page[0].content).to.equal("post 2");
    expect(page[1].content).to.equal("post 3");
  });

  it("only the deployer can update the window", async () => {
    const contract = await deploy();
    const [, alice] = await ethers.getSigners();
    await expect(contract.connect(alice).setWindow(1, 2)).to.be.revertedWithCustomError(
      contract,
      "NotOwner"
    );
    await contract.setWindow(1, 2);
    expect(await contract.nightStartHour()).to.equal(1);
  });
});
