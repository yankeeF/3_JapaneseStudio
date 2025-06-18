import { _decorator, Component, director, Label } from 'cc';
import { GoldManager } from './GoldManager';
import { GoldDisplay } from './GoldDisplay';
import { SaveManager } from './SaveManager';
const { ccclass, property } = _decorator;

@ccclass('ProfileScene')
export class ProfileScene extends Component {
    // 📌 展示统计信息的文本节点
    @property(Label)
    messageLabel: Label = null!;

    // 💰 金币管理器，用于获取金币数
    @property(GoldManager)
    goldManager: GoldManager = null!;

    // 💰 金币展示组件（包含主金币数与浮动动画）
    @property(GoldDisplay)
    goldDisplay: GoldDisplay = null!;

    start() {
        // ✅ 1. 加载金币并显示（不带动画）
        const current = this.goldManager.get();
        this.goldDisplay.updateGold(current, 0);

        // ✅ 2. 读取存档数据（SaveManager 保存在 localStorage）
        const save = SaveManager.load();

    // 计算总对局数（胜+败）
    const totalGames = save.winCount + save.loseCount;

    // 胜率计算（避免除以 0）
    const winRate = totalGames > 0 ? (save.winCount / totalGames * 100).toFixed(0) + '%' : 'N/A';

    // 设置文本
    this.messageLabel.string =
        `我的页面\n` +
        `最速记录：${formatTime(save.fastestRecord)}\n` +
        `胜利次数：${save.winCount}\n` +
        `失败次数：${save.loseCount}\n` +
        `胜率：${winRate}\n` +
        `连续登录次数：${save.loginStreak}\n` +
        `已学习单词数量：${save.learnedWords.length}`;
    }

    // 🔙 返回首页
    onClickBack() {
        director.loadScene('HomeScene');
    }
}

// ⏱️ 工具函数：将秒数格式化为 mm:ss
function formatTime(seconds: number): string {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
}
