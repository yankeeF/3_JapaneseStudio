import { _decorator, Component, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GoldManager')
export class GoldManager extends Component {
    private coin: number = 0;
    private readonly maxCoin: number = 99999;
    private readonly saveKey: string = 'player_coin';

    onLoad() {
        this.load();
    }

    // 增加金币（不会超过上限）
    public add(amount: number) {
        this.coin += amount;
        this.coin = Math.min(this.coin, this.maxCoin);
        this.save();
    }

    // 减少金币（可选扩展，防止负数）
    public deduct(amount: number): boolean {
        if (this.coin >= amount) {
            this.coin -= amount;
            this.save();
            return true;
        }
        return false;
    }

    // 获取当前金币
    public get(): number {
        return this.coin;
    }

    // 设置金币（调试或初始化用）
    public set(amount: number) {
        this.coin = Math.min(Math.max(amount, 0), this.maxCoin);
        this.save();
    }

    // 保存金币数到本地
    private save() {
        sys.localStorage.setItem(this.saveKey, this.coin.toString());
    }

    // 读取金币数（如无数据则为0）
    private load() {
        const saved = sys.localStorage.getItem(this.saveKey);
        this.coin = saved ? parseInt(saved) : 0;
    }
}
