// 引入 Cocos 的 sys 模块，用于操作本地存储（localStorage）
import { sys } from 'cc';

// 定义存档数据结构（用于类型检查和补全）
export type SaveData = {
    fastestRecord: number;       // 最快完成时间（单位：秒）
    winCount: number;            // 玩家胜利次数
    loseCount: number;           // 玩家失败次数
    loginTimes: number;          // 总登录次数
    loginStreak: number;         // 连续登录天数
    lastLoginDate: string;       // 上次登录日期（格式："YYYY-MM-DD"）
    learnedWords: string[];      // 已学习单词（字符串 ID 列表）
};

// 本地存储用的键名，固定为字符串常量
const SAVE_KEY = 'player_data';

// SaveManager 提供存档的读取、写入、登录记录等操作
export class SaveManager {

    /** 从本地读取玩家存档 */
    public static load(): SaveData {
        let raw = '';  // 用于存储读取的原始字符串

        try {
            // 从本地存储读取 JSON 字符串（可能为 null）
            raw = sys.localStorage.getItem(SAVE_KEY) ?? '';
        } catch (e) {
            console.warn('[SaveManager] 读取失败', e);
        }

        // 如果成功读取到了内容
        if (raw) {
            try {
                // 解析 JSON 字符串为对象
                const parsed = JSON.parse(raw);

                // 对字段进行校验与补全
                return this.validate(parsed);
            } catch (e) {
                // 如果解析失败，视为损坏 → 重置为默认值
                console.warn('[SaveManager] 存档损坏，重置为默认值', e);
                const def = this.defaultSaveData();
                this.save(def);  // 存一次默认值
                return def;
            }
        }

        // 如果完全没有数据，也返回默认值
        return this.defaultSaveData();
    }

    /** 将存档数据写入本地存储 */
    public static save(data: SaveData) {
        try {
            const json = JSON.stringify(data);           // 对象转 JSON 字符串
            sys.localStorage.setItem(SAVE_KEY, json);    // 写入本地
        } catch (e) {
            console.error('[SaveManager] 存档保存失败', e);
        }
    }

    /** 登录逻辑（自动更新登录次数和连续登录） */
    public static handleLogin() {
        const data = this.load();  // 获取当前存档
        const today = new Date().toISOString().split('T')[0];  // 当前日期（只取 YYYY-MM-DD）

        // 如果还没有登录过，或今天尚未登录
        if (!data.lastLoginDate || this.isNewDay(data.lastLoginDate, today)) {
            data.loginTimes++;  // 总登录次数 +1

            // 如果昨天也登录了（连续登录）
            if (this.isConsecutiveDay(data.lastLoginDate, today)) {
                data.loginStreak++;  // 连续登录 +1
            } else {
                data.loginStreak = 1;  // 否则重置为 1
            }

            data.lastLoginDate = today;  // 更新登录日期
            this.save(data);             // 保存更新
        }
    }

    /** 判断是否进入新的一天（与上次日期不同） */
    private static isNewDay(lastDate: string, currentDate: string) {
        return lastDate !== currentDate;
    }

    /** 判断是否是连续登录（lastDate +1 天 === currentDate） */
    private static isConsecutiveDay(lastDate: string, currentDate: string) {
        if (!lastDate) return false;  // 如果无上次记录则不连续

        const last = new Date(lastDate);      // 转为日期对象
        const current = new Date(currentDate);
        last.setDate(last.getDate() + 1);     // 上次登录日 +1 天

        // 判断是否与今天相等（格式化成 YYYY-MM-DD 再比较）
        return last.toISOString().split('T')[0] === currentDate;
    }

    /** 返回一个默认的新存档（用于首次启动或数据损坏） */
    private static defaultSaveData(): SaveData {
        return {
            fastestRecord: 9999,    // 表示还没有通过任何一关
            winCount: 0,            // 初始胜利次数为 0
            loseCount: 0,           // 初始失败次数为 0
            loginTimes: 0,          // 初始总登录次数
            loginStreak: 0,         // 初始连续登录为 0
            lastLoginDate: '',      // 没有上次记录
            learnedWords: [],       // 初始无单词学习记录
        };
    }

    /** 校验存档字段是否完整，缺失部分自动补默认值 */
    private static validate(data: Partial<SaveData>): SaveData {
        const d = this.defaultSaveData();  // 引用默认值

        return {
            // 确保 fastestRecord 是合法数字
            fastestRecord: typeof data.fastestRecord === 'number'
                ? Math.max(0, data.fastestRecord) : d.fastestRecord,

            // 胜利次数
            winCount: typeof data.winCount === 'number'
                ? Math.max(0, data.winCount) : d.winCount,

            // 失败次数
            loseCount: typeof data.loseCount === 'number'
                ? Math.max(0, data.loseCount) : d.loseCount,

            // 登录次数
            loginTimes: typeof data.loginTimes === 'number'
                ? Math.max(0, data.loginTimes) : d.loginTimes,

            // 连续登录天数
            loginStreak: typeof data.loginStreak === 'number'
                ? Math.max(0, data.loginStreak) : d.loginStreak,

            // 上次登录日期
            lastLoginDate: typeof data.lastLoginDate === 'string'
                ? data.lastLoginDate : d.lastLoginDate,

            // 学过的单词列表
            learnedWords: Array.isArray(data.learnedWords)
                ? data.learnedWords.filter(w => typeof w === 'string') : d.learnedWords,
        };
    }
}
