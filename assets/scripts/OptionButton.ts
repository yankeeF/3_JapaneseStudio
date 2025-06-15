import { _decorator, Component, Label, Button, Node, EventHandler, Sprite, SpriteFrame,tween, Vec3, easing} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('OptionButton')
export class OptionButton extends Component {

    @property(Label)
    kanjiLabel: Label = null!;

    @property(Label)
    kanaLabel: Label = null!;

    @property(Label)
    romajiLabel: Label = null!;

    @property(Sprite)
    backgroundSprite: Sprite = null!;

    @property(SpriteFrame)
    defaultSprite: SpriteFrame = null!;

    @property(SpriteFrame)
    correctSprite: SpriteFrame = null!;

    @property(SpriteFrame)
    wrongSprite: SpriteFrame = null!;

    private isCorrect: boolean = false;
    private clickCallback: (isCorrect: boolean) => void = () => {};

    playCorrectAnimation() {
        const originalScale = this.node.scale.clone();
        const smallScale = originalScale.clone().multiplyScalar(0.95);
        const enlargedScale = originalScale.clone().multiplyScalar(1.15);

        tween(this.node)
            .to(0.08, { scale: smallScale }, { easing: 'quadOut' })     // 先缩小
            .to(0.12, { scale: enlargedScale }, { easing: 'quadOut' })  // 放大
            .to(0.1, { scale: originalScale }, { easing: 'quadIn' })    // 回到原始大小
            .start();
    }

    playWrongAnimation() {
        const originalPos = this.node.position.clone();
        const offset = originalPos.x;

        tween(this.node)
            .to(0.08, { position: new Vec3(offset - 10, originalPos.y, originalPos.z) })
            .to(0.08, { position: new Vec3(offset + 20, originalPos.y, originalPos.z) })
            .to(0.04, { position: originalPos })
            .start();
    }

    onLoad() {
        let button = this.getComponent(Button);
        if (!button) {
            button = this.node.addComponent(Button);
        }

        button.clickEvents = [];

        const eventHandler = new EventHandler();
        eventHandler.target = this.node;
        eventHandler.component = 'OptionButton';
        eventHandler.handler = 'onClicked';

        button.clickEvents.push(eventHandler);

        this.setState('default');
    }

    setText(kanji: string, kana: string, romaji: string) {
        this.kanjiLabel.string = kanji?.trim() || ' ';
        this.kanaLabel.string = kana?.trim() || ' ';
        this.romajiLabel.string = romaji?.trim() || ' ';
    }

    setCorrect(value: boolean) {
        this.isCorrect = value;
    }

    setClickCallback(cb: (isCorrect: boolean) => void) {
        this.clickCallback = cb;
    }

    onClicked() {
        this.clickCallback(this); // 传入自己
    }

    setState(state: 'default' | 'correct' | 'wrong') {
        if (!this.backgroundSprite) return;

        switch (state) {
            case 'default':
                this.backgroundSprite.spriteFrame = this.defaultSprite;
                break;
            case 'correct':
                this.backgroundSprite.spriteFrame = this.correctSprite;
                break;
            case 'wrong':
                this.backgroundSprite.spriteFrame = this.wrongSprite;
                break;
        }
    }
    // ✅ 新增的这个方法
    isAnswerRight(): boolean {
        return this.isCorrect;
    }

    //启用/禁用按钮的方法：
    setInteractable(enabled: boolean) {
        const btn = this.getComponent(Button);
        if (btn) {
            btn.interactable = enabled;
        }
    }
}
