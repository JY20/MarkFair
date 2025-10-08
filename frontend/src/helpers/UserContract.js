import { Contract, Provider, cairo, CallData, RpcProvider } from 'starknet';

const hash_provider = new RpcProvider({
    nodeUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_8',
});

const classHash = '0x433873bd3709b5a5666d4c5a367a82e4da7e59f1ddf78c51d0eaced05317ed3';
const userContractAddress = '0x02ceed00a4e98084cfbb5e768c3a9ba92c9096f108376ae99f8a09d370c4da2a';

export class UserContract {
    constructor() {
    }
    async getABI() {
        const contractClass = await hash_provider.getClassByHash(classHash);
        return contractClass.abi;
    }
    async () {

    }
}