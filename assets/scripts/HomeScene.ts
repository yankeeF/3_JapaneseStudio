import { _decorator, Component, director } from 'cc';
import { GoldManager } from './GoldManager';
import { GoldDisplay } from './GoldDisplay';
const { ccclass, property } = _decorator;

@ccclass('HomeScene')
export class HomeScene extends Component {
    @property(GoldManager)
    goldManager: GoldManager = null!;

    @property(GoldDisplay)
    goldDisplay: GoldDisplay = null!;


    start() {
        // ✅ 显示本地保存的金币数（不传 delta，则无动画）
        const current = this.goldManager.get();
        this.goldDisplay.updateGold(current);
    }

    // 点击任意按钮后调用
    onSelectLevel(event: Event, customData: string) {
        director.loadScene('QuizScene', () => {
            const qm = director.getScene().getChildByName('Canvas')
                ?.getComponentInChildren('QuizManager');
            if (qm) {
                qm.setLevel(customData);  // 正确传入如 "n3"
            } else {
                console.warn("QuizManager not found.");
            }
        });
    }

    public onClickMyProfile(event?: Event, custom?: string) {
        console.log('点击我的');
                director.loadScene('ProfileScene');
    }
}
