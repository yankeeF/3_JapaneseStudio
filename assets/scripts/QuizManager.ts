import { _decorator, Component, Label, resources,Node,director  } from 'cc';
import { GoldManager } from './GoldManager';  // 👈 先导入
import { GoldRewardPopup } from './GoldRewardPopup';
import { GoldDisplay } from './GoldDisplay';
import { OptionButton } from './OptionButton';
const { ccclass, property } = _decorator;
import { SaveManager } from './SaveManager';
@ccclass('QuizManager')
export class QuizManager extends Component {

    @property(GoldManager)
    goldManager: GoldManager = null!;

    @property(GoldDisplay)
    goldDisplay: GoldDisplay = null!;

    @property(GoldRewardPopup)
    rewardPopup: GoldRewardPopup = null!;

    @property(Node)
    catGroup: Node = null!; // cat 节点（包含 cat_1 ~ cat_5）

    @property(Node)
    restartButton: Node = null!;
    // 题目进度文本
    @property(Label)
    progressLabel: Label = null!;

    // 中文问题内容文本
    @property(Label)
    chineseLabel: Label = null!;
    // 英文问C题内容文本
    @property(Label)
    englishLabel: Label = null!;

    // 答案反馈文本（"正确哦！" / "失败哦！"）
    @property(Label)
    resultLabel: Label = null!;

    // ✅ 用于标记当前题是否已经答错过
    private hasTriedWrong: boolean = false;

    // 四个选项按钮
    @property([OptionButton])
    optionButtons: OptionButton[] = [];

    // 当前题目索引
    private currentIndex: number = 0;

    // 随机抽取的题库
    private questions: any[] = [];

    // 正计时文本
    @property(Label)
    timerLabel: Label = null!;  // ✅ 添加计时Label引用

        private elapsedTime: number = 0; // ✅ 总计时间（秒）

    private level: string = 'n3';  // ✅ 默认等级 N3，可由外部传入
    private correctCount: number = 0;
    public setLevel(level: string) {
        this.level = level;
    }

    start() {
        this.restartButton.active = false;

        // ✅ 初始化金币 UI 显示（读取已有金币）
        const current = this.goldManager.get();
        this.goldDisplay.updateGold(current);

        this.scheduleOnce(() => {
            this.loadQuestionsByLevel(this.level);
        }, 0);  // ✅ 延迟1帧，确保 setLevel 已执行
    }

    // 加载多个 JSON 并合并
    loadQuestionsByLevel(levelStr: string) {
        // 解析难度字符串，例如 "n3" 或 "n2+n3"，按 "+" 分割为数组
        const levels = levelStr.split('+');

        // 每个级别拥有的题库文件数量映射
        const fileCountMap: Record<string, number> = {
            n3: 2,
            n2: 3,
            n1: 6
        };

        // 最终将题目存入 allData 中
        const allData: any[] = [];
        let totalToLoad = 0;  // 总共要加载的文件数
        let loaded = 0;       // 当前已加载文件数

        const filePaths: string[] = [];

        // 遍历每个难度级别
        levels.forEach(level => {
            // 获取当前级别对应的文件数量，默认1
            const count = fileCountMap[level] || 1;
            // 从 1 到 count 中随机抽一个索引
            const randomIndex = Math.floor(Math.random() * count) + 1;
            // 格式化为三位数，例如 5 => "005"
            const suffix = String(randomIndex).padStart(3, '0');
            // 构造资源路径
            const path = `questions/questions_${level}_${suffix}`;
            filePaths.push(path);
        });

        totalToLoad = filePaths.length;

        // 加载每个文件路径
        filePaths.forEach(path => {
            resources.load(path, (err, data: any) => {
                if (!err && data) {
                    // 成功加载，合并到 allData
                    allData.push(...data.json);
                } else {
                    // 加载失败，输出警告
                    console.warn(`加载失败: ${path}`, err);
                }

                loaded++;
                if (loaded === totalToLoad) {
                    // 所有资源加载完成后执行
                    if (allData.length === 0) {
                        console.error("题库为空，无法开始题目。");
                        this.resultLabel.string = "题库加载失败，请检查难度选择或资源路径！";
                        return;
                    }

                    // 随机抽取 20 题开始游戏
                    this.questions = this.shuffleArray(allData).slice(0, 20);
                    this.currentIndex = 0;
                    this.loadQuestion();
                    this.startTimer();
                }
            });
        });
    }
 // 随机排列四个选项

    private previousOptionKeys: Set<string> = new Set();
    shuffleOptions(currentIndex: number) {
        const correct = this.questions[currentIndex];

        // 限定干扰项抽取范围（±40 题范围）
        const start = Math.max(0, currentIndex - 40);
        const end = Math.min(this.questions.length - 1, currentIndex + 40);

        // 候选池：不包含当前题
        const candidates = this.questions.slice(start, end + 1)
            .filter((_, i) => (start + i) !== currentIndex);

        let distractors = [];
        let attempts = 0;

        while (attempts < 10) {
            // 每次打乱，抽取3个干扰项
            const shuffled = this.shuffleArray(candidates);
            distractors = shuffled.slice(0, 3);

            // 组装本题所有选项（含正确项）
            const combined = [correct, ...distractors];

            // 生成唯一性 key（用 kanji + kana + romaji 组合来对比是否重复）
            const currentKeys = combined.map(opt => `${opt.kanji}|${opt.kana}|${opt.romaji}`);

            // 与上一题选项做对比
            const hasOverlap = currentKeys.some(key => this.previousOptionKeys.has(key));

            if (!hasOverlap) {
                // 无重复，可使用
                this.previousOptionKeys = new Set(currentKeys); // 记录当前题目的选项key供下一题使用
                break;
            }

            attempts++;
        }

        // 最终构造选项列表
        const options = [correct, ...distractors];
        const shuffled = this.shuffleArray(options);
        const correctIndex = shuffled.findIndex(opt => opt === correct);

        return {
            options: shuffled.map(opt => ({
                kanji: opt.kanji,
                kana: opt.kana,
                romaji: opt.romaji
            })),
            correctIndex
        };
    }
    // 正计时
    startTimer() {
        this.schedule(() => {
            this.elapsedTime++;
            this.updateTimerLabel();
        }, 1); // 每秒执行一次
    }

    // 更新时间显示
    updateTimerLabel() {
        const minutes = Math.floor(this.elapsedTime / 60).toString().padStart(2, '0');
        const seconds = (this.elapsedTime % 60).toString().padStart(2, '0');
        this.timerLabel.string = `${minutes}:${seconds}`;
    }

    // 工具函数：打乱数组顺序
    shuffleArray(array: any[]) {
        return array.sort(() => Math.random() - 0.5);
    }

    // 加载当前题目到界面
    loadQuestion() {
        if (!this.questions[this.currentIndex]) {
            console.warn("当前题目为空，终止加载！");
            return;
        }

        const q = this.questions[this.currentIndex];
        this.progressLabel.string = `${this.currentIndex + 1}/20`;

        // ✅ 设置题干（中英）
        // ✅ 设置题干（中英）——随机一个中文词汇
        if (q.chinese) {
            const parts = q.chinese.split('；').map(s => s.trim());
            const index = Math.floor(Math.random() * parts.length);
            this.chineseLabel.string = parts[index];
        } else {
            this.chineseLabel.string = ' ';
        }
        this.englishLabel.string = q.english?.trim() || ' ';

        // ✅ 每次动态生成选项（使用当前索引）
        const { options, correctIndex } = this.shuffleOptions(this.currentIndex);

        // ✅ 随机猫猫
        this.showRandomCat();

        // ✅ 设置按钮文字
        const clean = (val: string) => val?.trim() || ' ';
        this.optionButtons.forEach((btn, index) => {
            btn.setState('default');
            btn.setInteractable(true);

            const data = options[index];
            btn.setText(clean(data.kanji), clean(data.kana), clean(data.romaji));

            btn.setCorrect(index === correctIndex);
            btn.setClickCallback(this.onOptionClicked.bind(this));
        });
        this.hasTriedWrong = false; // ✅ 每题开始时重置
    }

    // 当任意选项被点击时调用
    onOptionClicked(clickedBtn: OptionButton) {
        const isCorrect = clickedBtn.isAnswerRight();
        this.questions[this.currentIndex].answeredCorrectly = isCorrect;
        this.resultLabel.string = isCorrect ? "对了ね～！" : "错了よ～";

            // ✅ 如果答错，记录“当前题已经答错过”
            if (!isCorrect) {
                this.hasTriedWrong = true;
            }

            // ✅ 正确时再判断是否首答正确
            if (isCorrect) {
                this.correctCount++;

                if (!this.hasTriedWrong) {
                    const delta = 1;
                    this.goldManager.add(delta);
                    const current = this.goldManager.get();
                    this.goldDisplay.updateGold(current, delta);
                }
            }

        // 所有按钮禁用
        this.optionButtons.forEach((btn) => {
            btn.setInteractable(false);

            if (btn === clickedBtn) {
                // 当前点击的按钮变色
                btn.setState(isCorrect ? 'correct' : 'wrong');
            } else if (isCorrect && btn.isAnswerRight()) {
                // 若答对了，也高亮正确项（备选）
                btn.setState('correct');
            }
            if (btn === clickedBtn) {
                btn.setState(isCorrect ? 'correct' : 'wrong');
                if (isCorrect) {
                    btn.playCorrectAnimation(); // ✅ 加这个
                } else {
                    btn.playWrongAnimation();   // ✅ 加这个
                }
            }
        });

        // 0.8 秒后清除提示文字
        this.scheduleOnce(() => {
            this.resultLabel.string = "";
        }, 0.8);

        if (isCorrect) {

            // 跳下一题
            this.scheduleOnce(() => {
                this.onNext();
            }, 0.5);
        }
        else {
            // 答错后 0.5秒重置颜色和按钮状态
            this.scheduleOnce(() => {
                this.optionButtons.forEach((btn) => {
                    btn.setState('default');
                    btn.setInteractable(true);
                });
            }, 0.5);
        }
    }
    // 点击“再次挑战”按钮时调用
    onRestart() {
        console.log("Restarting quiz...");

        this.restartButton.active = false;   // 隐藏“再次挑战”按钮
        this.elapsedTime = 0;                // 重置计时
        this.currentIndex = 0;               // 重置题目索引
        this.unscheduleAllCallbacks();       // 停止计时器
        this.updateTimerLabel();            // 更新显示为 00:00

        this.loadQuestionsByLevel(this.level);  // ✅ 重新随机加载题库分包
        this.rewardPopup.node.active = false;
        this.correctCount = 0;
    }
    // 切换到下一题（或结束）
    onNext() {
        this.currentIndex++;
        if (this.currentIndex < this.questions.length) {
            this.loadQuestion();
        } else {
            // 停止计时器
            this.unscheduleAllCallbacks();

            // 格式化耗时
            const minutes = Math.floor(this.elapsedTime / 60).toString().padStart(2, '0');
            const seconds = (this.elapsedTime % 60).toString().padStart(2, '0');

            // 显示最终结果
            this.resultLabel.string = `完成挑战，耗时 ${minutes}:${seconds}！`;
                    this.restartButton.active = true;  // ✅ 显示“再次挑战”按钮
               this.showResultAndReward();
        }
    }

    showResultAndReward() {
        // ✅ 首答正确的题数（在答题过程中已累加到 correctCount）
        const baseGold = this.correctCount;

        // ✅ 本次完成所花总时间（秒）
        const totalTime = this.elapsedTime;

        // ✅ 不同奖励倍率的时间阈值
        const timeLimitFast = this.questions.length * 2;    // 最快：每题2秒以内
        const timeLimitNormal = this.questions.length * 3;  // 普通：每题3秒以内

        // ✅ 奖励倍率和显示用语初始化
        let multiplier = 1;
        let message = '完成だっ～';

        if (totalTime <= timeLimitFast) {
            multiplier = 3;
            message = '限界超速だっ！！';
        } else if (totalTime <= timeLimitNormal) {
            multiplier = 2;
            message = '神速だっ！！';
        }

        // ✅ 计算最终奖励金币总量（含倍率加成）
        const finalGold = baseGold * multiplier;

        // ✅ 额外奖励部分 = 最终金币 - 已获得的 baseGold
        const bonusGold = finalGold - baseGold;

        // ✅ 累加“额外奖励”到总金币
        this.goldManager.add(bonusGold);

        // ✅ 弹出奖励弹窗，展示：原始金币、额外加成、合计
        this.rewardPopup.showReward(
                message,        // 👈 正确的：主标题
                baseGold,     // 👈 正确的：基础金币数
                bonusGold     // 👈 正确的：奖励金币数（额外）
        );

        // ✅ 更新右上角金币总数（并播放 "+X" 浮动动画）
        const current = this.goldManager.get();
        this.goldDisplay.updateGold(current, bonusGold);


        // ⏺️ 加载本地存档
        const save = SaveManager.load();

        // 1️⃣ 记录最速记录（若更快）
        if (!save.fastestRecord || this.elapsedTime < save.fastestRecord) {
            save.fastestRecord = this.elapsedTime;
        }

        // 2️⃣ 累计正确题数 / 总题数（用于胜率统计）
        save.correctCount = (save.correctCount || 0) + this.correctCount;
        save.totalCount = (save.totalCount || 0) + this.questions.length;

        // 3️⃣ 存储已学单词（只记录答对题目）
        for (let i = 0; i < this.questions.length; i++) {
            const q = this.questions[i];
            if (q.answeredCorrectly && q.kanji) {
                if (!save.learnedWords.includes(q.kanji)) {
                    save.learnedWords.push(q.kanji);
                }
            }
        }

        // 💾 保存回本地
        SaveManager.save(save);
    }

    showRandomCat() {
        const cats = this.catGroup.children;
        const index = Math.floor(Math.random() * cats.length);

        cats.forEach((child, i) => {
            child.active = i === index;
        });
    }
    // 点击返回主菜单
    public onClickBack() {
        director.loadScene("HomeScene");
    }
    private calculateReward(isCorrect: boolean, timeSec: number, totalQuestions: number): { coins: number, message: string } {
        if (!isCorrect) return { coins: 0, message: '' };

        let multiplier = 1;
        let message = "完成だっ~";

        const threshold1 = totalQuestions * 2;
        const threshold2 = totalQuestions * 3;

        if (timeSec <= threshold1) {
            multiplier = 3;
            message = "限界超速だっ！！";
        } else if (timeSec <= threshold2) {
            multiplier = 2;
            message = "神速だっ！！";
        }

        return { coins: multiplier, message };
    }
}
