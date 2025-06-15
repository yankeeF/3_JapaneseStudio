import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GoldRewardPopup')
export class GoldRewardPopup extends Component {
    @property(Label)
    rewardLabel: Label = null!;  // ✅ 主标题，例如“限界超速だっ！！”

    @property(Label)
    messageLabel: Label = null!; // ✅ 多行说明文字

    onLoad() {
        this.node.active = false;  // 初始隐藏
    }

    showReward(message: string, base: number, bonus: number) {
        const total = base + bonus;

        // 设置主标题文本
        this.rewardLabel.string = message;

        // 设置多行说明内容
        this.messageLabel.string =
            `獲得金币 ${base} 枚\n` +
            `额外奖励 ${bonus} 枚\n` +
            `合计 ${total} 枚`;

        // 激活弹窗
        this.node.active = true;

        // TODO：你可以添加淡入动画等效果
    }
}
