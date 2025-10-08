import { Contract, Provider, cairo, CallData, RpcProvider } from 'starknet';

const hash_provider = new RpcProvider({
    nodeUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_8',
});

const classHash = '0x07d88c5ee12678cff834f98983696a9b5644831cb4fea4b6d462454b5d9c6e2b';
const contractAddress = '0x075d470cb627938cb8f835fd01cab06b7fab0fbe4b2eeb2f6e6175edad0f98ec';

export class TokenContract {
    constructor() {
    }
    async getABI() {
        const contractClass = await hash_provider.getClassByHash(classHash);
        return contractClass.abi;
    }
    async getWalletBalance(walletAddress) {
        const abi = await this.getABI();
        const contract = new Contract(abi, contractAddress, hash_provider);
        const balance = await contract.call('balance_of', [walletAddress]);
        const convertedBalance = (Number(balance) / 1000000).toFixed(2);
        return convertedBalance;
    }
    async Approve(address, amount, account) {
        const provider = account;
        const abi = await this.getABI();
        console.log(abi);
        const contract = new Contract(abi, contractAddress, hash_provider);
        const weiAmount = amount * 1000000;

        const tx = await contract.populate("approve", [address, weiAmount]);
        const result = await provider.execute([
            {
                contractAddress: contractAddress,
                entrypoint: "approve",
                calldata: tx.calldata,
            },
            {
                contractAddress: address,
                entrypoint: "fund_pool_with_transfer",
                calldata: CallData.compile({
                    pool_id: "0x2001",
                    token: "0",
                    from: address,
                    amount: cairo.uint256(weiAmount),
                }),
            },
        ]);

        return result;
    }
}