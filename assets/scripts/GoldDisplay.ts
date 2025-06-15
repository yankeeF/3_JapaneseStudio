import { _decorator, Component, Label, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GoldDisplay')
export class GoldDisplay extends Component {
    @property(Label)
    coinLabel: Label = null!;  // ✅ 主金币数显示 Label（右上角）

    @property(Label)
    floatingLabel: Label = null!;  // ✅ 浮动金币动画 Label（用于显示 "+X"）

    private currentCoin: number = 0;  // 当前金币数量记录

    /**
     * 更新金币数并播放浮动动画
     * @param newAmount 当前金币总量（GoldManager.get() 结果）
     * @param delta 增量（新加金币数量；如果为 0 则不播放动画）
     */
    updateGold(newAmount: number, delta: number = 0) {
        // 限制显示最大值为 999999
        const display = Math.min(newAmount, 999999);
        this.coinLabel.string = display.toString();

        // 更新内部记录
        this.currentCoin = newAmount;

        // 如果有增量金币，并且浮动标签存在
        if (delta > 0 && this.floatingLabel) {
            this.showFloatingText(`+${delta}`);
        }
    }

    /**
     * 播放浮动 "+X" 文本动画
     * @param text 显示文本（例如 "+1", "+12"）
     */
    private showFloatingText(text: string) {
        // 设置文本与初始状态
        this.floatingLabel.string = text;
        this.floatingLabel.node.active = true;
        this.floatingLabel.node.setPosition(new Vec3(0, 0, 0));
        this.floatingLabel.node.opacity = 255;

        // 播放 tween 动画（上升 + 淡出）
        tween(this.floatingLabel.node)
            .to(0.5, { position: new Vec3(0, 40, 0), opacity: 255 })  // 上升
            .to(0.5, { opacity: 0 })                                  // 淡出
            .call(() => {
                // 动画结束，重置状态
                this.floatingLabel.node.active = false;
                this.floatingLabel.node.setPosition(new Vec3(0, 0, 0));
                this.floatingLabel.node.opacity = 255;
            })
            .start();
    }
}
