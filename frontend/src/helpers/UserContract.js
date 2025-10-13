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
    async getPool(pool_id) {
        const abi = await this.getABI();
        const contract = new Contract(abi, userContractAddress, hash_provider);
        const info = await contract.call('get_pool', [pool_id]);
        return info;
    }
    async previewAmount(pool_id, epoch, shares) {
        const abi = await this.getABI();
        const contract = new Contract(abi, userContractAddress, hash_provider);
        const result= await contract.call('preview_amount', CallData.compile({
            pool_id: cairo.uint256(pool_id),
            epoch: epoch,
            shares: cairo.uint256(shares),
          }));
        return result;
    }
    async claim(pool_id,epoch,index,shares) {
        const abi = await this.getABI();
        const contract = new Contract(abi, userContractAddress, hash_provider);
        const result= await contract.invoke('claim_epoch_with_transfer', CallData.compile({
            pool_id: cairo.uint256(pool_id),
            epoch: epoch,
            index: cairo.uint256(index),
            shares: cairo.uint256(shares),
          }));
        return result;
    }
    // TODO: Refund-related functions pending backend development
}