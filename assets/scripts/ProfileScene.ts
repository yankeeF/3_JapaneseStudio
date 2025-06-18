import { _decorator, Component, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ProfileScene')
export class ProfileScene extends Component {
    onClickBack() {
        director.loadScene('HomeScene');
    }
}
