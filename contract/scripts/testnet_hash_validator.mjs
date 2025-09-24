import { hash, shortString } from "starknet";

console.log("=== 最终测试网验证 ===\n");

const ESCROW_CONTRACT =
  "0x0208b971642fa7a85733d433895d6c6b83dc4eda4e04067be15847a03d7d4524";

function normalizeHex(h) {
  if (typeof h === "bigint") h = "0x" + h.toString(16);
  if (typeof h === "number") h = "0x" + h.toString(16);
  if (typeof h !== "string") h = h.toString();
  if (!h.startsWith("0x")) h = "0x" + h;
  return h;
}

// 从合约验证的叶子哈希
const user1LeafHash =
  "0x317836533f959f70d8ed3d6c9ec76934b36830fa0035e8552f447f7c30f8ac0";
const user2LeafHash =
  "0x7e92d1cc03eb7025e0d8b601c8ba58e5315a065bafca42b75a5dff8958bc6eb";

// 存储的Merkle root
const storedMerkleRoot =
  "0x2a644ca0bbb3f3baf234f1c96518688ad73cdb5712918b509ed5c8f22b42aa2";

console.log("=== 验证叶子哈希和Merkle root ===");
console.log(`User1 Leaf: ${user1LeafHash}`);
console.log(`User2 Leaf: ${user2LeafHash}`);
console.log(`Stored Root: ${storedMerkleRoot}`);

// 手动计算Merkle root (2叶子的简单情况)
// root = nodeHash(leaf1, leaf2)
function customNodeHash(left, right) {
  const leftBig = BigInt(left);
  const rightBig = BigInt(right);
  let elements;
  if (leftBig < rightBig) {
    elements = [left, right, "0x2"];
  } else {
    elements = [right, left, "0x2"];
  }
  const serialized = elements.map((x) => normalizeHex(x));
  const result = hash.computeHashOnElements(serialized);
  return normalizeHex(result);
}

const calculatedRoot = customNodeHash(user1LeafHash, user2LeafHash);
console.log(`Calculated Root: ${calculatedRoot}`);
console.log(
  `Root Match: ${BigInt(calculatedRoot) === BigInt(storedMerkleRoot)}`
);

// 确定叶子顺序
const leaf1Big = BigInt(user1LeafHash);
const leaf2Big = BigInt(user2LeafHash);

console.log(`\nLeaf1 (User1): ${leaf1Big.toString(16)}`);
console.log(`Leaf2 (User2): ${leaf2Big.toString(16)}`);
console.log(`User1 < User2: ${leaf1Big < leaf2Big}`);

// 根据数值大小确定proof
let user1Proof, user2Proof;
if (leaf1Big < leaf2Big) {
  // User1的叶子更小，它的proof是User2的叶子
  user1Proof = [user2LeafHash];
  user2Proof = [user1LeafHash];
} else {
  // User2的叶子更小，它的proof是User1的叶子
  user1Proof = [user1LeafHash];
  user2Proof = [user2LeafHash];
}

console.log(`\nUser1 Proof: [${user1Proof.join(", ")}]`);
console.log(`User2 Proof: [${user2Proof.join(", ")}]`);

// 验证proof
function verifyProof(leafHash, proof, root) {
  let current = leafHash;
  for (const sibling of proof) {
    current = customNodeHash(current, sibling);
  }
  return BigInt(current) === BigInt(root);
}

const user1Valid = verifyProof(user1LeafHash, user1Proof, storedMerkleRoot);
const user2Valid = verifyProof(user2LeafHash, user2Proof, storedMerkleRoot);

console.log(`\nUser1 Proof Valid: ${user1Valid}`);
console.log(`User2 Proof Valid: ${user2Valid}`);

// 用户数据
const users = [
  {
    account:
      "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
    shares: 7n,
    index: 0n,
    amount: 7000000000000000000n,
  },
  {
    account:
      "0x1ea8da13e8ae65fe7e1fb368e174d50f1b9588305a4f12629c9eef467c4abee",
    shares: 3n,
    index: 1n,
    amount: 3000000000000000000n,
  },
];

console.log("\n=== 最终测试命令 ===\n");

console.log("4️⃣ 验证User1 proof:");
const verifyCmd1 = `sncast --profile sepolia call --contract-address ${ESCROW_CONTRACT} --function verify_epoch_proof --calldata 100 0 1 ${
  users[0].index
} 0 ${users[0].account} ${users[0].shares} 0 ${users[0].amount} 0 ${
  user1Proof.length
} ${user1Proof.join(" ")}`;
console.log(verifyCmd1);

console.log("\n5️⃣ 验证User2 proof:");
const verifyCmd2 = `sncast --profile sepolia call --contract-address ${ESCROW_CONTRACT} --function verify_epoch_proof --calldata 100 0 1 ${
  users[1].index
} 0 ${users[1].account} ${users[1].shares} 0 ${users[1].amount} 0 ${
  user2Proof.length
} ${user2Proof.join(" ")}`;
console.log(verifyCmd2);

console.log("\n6️⃣ User1 领取:");
const claimCmd1 = `sncast --profile sepolia invoke --contract-address ${ESCROW_CONTRACT} --function claim_epoch_with_transfer --calldata 100 0 1 ${
  users[0].index
} 0 ${users[0].account} ${users[0].shares} 0 ${users[0].amount} 0 ${
  user1Proof.length
} ${user1Proof.join(" ")}`;
console.log(claimCmd1);

console.log("\n7️⃣ User2 领取:");
const claimCmd2 = `sncast --profile sepolia invoke --contract-address ${ESCROW_CONTRACT} --function claim_epoch_with_transfer --calldata 100 0 1 ${
  users[1].index
} 0 ${users[1].account} ${users[1].shares} 0 ${users[1].amount} 0 ${
  user2Proof.length
} ${user2Proof.join(" ")}`;
console.log(claimCmd2);
